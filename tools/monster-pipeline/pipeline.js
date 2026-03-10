#!/usr/bin/env node
// ============================================================
// Monster Generation Pipeline v3 — roster 기반 + watchdog 내장
// ============================================================
//
// roster/*.json을 순차 처리하며, 에러/타임아웃 시 자동 재시도합니다.
//
// 사용법:
//   node pipeline.js              # roster 순차 실행 (이어서)
//   node pipeline.js --from 5     # 5번부터 시작
//   node pipeline.js --only 3     # 3번만 실행
//   node pipeline.js --free       # 자율 주제 (roster 없이 랜덤 생성)
//   node pipeline.js --free --count 5  # 자율 주제 5마리
//   node pipeline.js --skip-review # 이미지 심사 건너뛰기
//   node pipeline.js --reset      # 진행 기록 초기화
//   node pipeline.js --status     # 현재 진행 상황 확인
//   node pipeline.js --wild-only     # 기존 후보의 야생(base) 이미지만 재생성
//   node pipeline.js --wild-only --only 3  # 3번만 야생 재생성
//   node pipeline.js --wild-only --from 5  # 5번부터 야생 재생성
//   node pipeline.js --wild-only --wild-prompt  # LLM으로 야생 프롬프트도 재생성
//   node pipeline.js --silence 300  # 무응답 타임아웃 초 (기본 300 = 5분)
//   node pipeline.js --max-retries 3 # 같은 번호 최대 재시도 (기본 3)
// ============================================================

import { generateMonsterConcept } from './concept-agent.js';
import { generateImages } from './comfyui-agent.js';
import { reviewAndSelectBest } from './review-agent.js';
import { CONFIG } from './config.js';
import { mkdir, writeFile, copyFile, rm, readFile, readdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROSTER_DIR = resolve(__dirname, 'roster');
const PROGRESS_FILE = resolve(__dirname, 'progress.json');

// ── CLI 인수 ──
const args = process.argv.slice(2);
function getArgInt(name, def) {
  const idx = args.indexOf(name);
  return idx !== -1 && args[idx + 1] ? parseInt(args[idx + 1], 10) : def;
}
const flags = {
  skipReview: args.includes('--skip-review'),
  reset: args.includes('--reset'),
  status: args.includes('--status'),
  free: args.includes('--free'),
  wildOnly: args.includes('--wild-only'),
  wildPrompt: args.includes('--wild-prompt'),
  from: getArgInt('--from', null),
  only: getArgInt('--only', null),
  count: getArgInt('--count', 1),     // --free 모드에서 생성할 마리 수
  silenceSec: getArgInt('--silence', 300), // 무응답 N초 후 hang 판단
  maxRetries: getArgInt('--max-retries', 3),
};

// ── 진행 기록 ──
async function loadProgress() {
  try {
    return JSON.parse(await readFile(PROGRESS_FILE, 'utf-8'));
  } catch {
    return { lastCompleted: 0, completed: [], failed: [], startedAt: null };
  }
}

async function saveProgress(progress) {
  await writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf-8');
}

// ── roster 파일 로드 ──
async function loadRosterFiles() {
  const files = (await readdir(ROSTER_DIR)).filter(f => f.endsWith('.json')).sort();
  const roster = [];
  for (const f of files) {
    const data = JSON.parse(await readFile(resolve(ROSTER_DIR, f), 'utf-8'));
    roster.push({ filename: f, data });
  }
  return roster;
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
}

function log(msg) {
  const ts = new Date().toISOString().substring(11, 19);
  console.log(`[${ts}] ${msg}`);
}

// ── 로그 기반 heartbeat 감시 ──
// 마지막 로그 출력 이후 silenceSec초 동안 새 로그 없으면 hang 판단
let _lastActivity = Date.now();
let _silenceTimer = null;

function heartbeat() {
  _lastActivity = Date.now();
}

function startSilenceWatch(label) {
  stopSilenceWatch();
  const checkInterval = 10000; // 10초마다 체크
  _silenceTimer = setInterval(() => {
    const silentMs = Date.now() - _lastActivity;
    const silentSec = Math.round(silentMs / 1000);
    if (silentMs > flags.silenceSec * 1000) {
      log(`HANG 감지: ${silentSec}초 무응답 (${label})`);
      stopSilenceWatch();
      // 프로세스를 강제 종료하지 않고 에러를 발생시키기 위해
      // 현재 진행중인 fetch를 abort할 방법이 없으므로
      // 프로세스 자체를 재시작하는 게 최선
      process.exit(99); // watchdog.js 또는 사용자가 재실행
    }
  }, checkInterval);
}

function stopSilenceWatch() {
  if (_silenceTimer) { clearInterval(_silenceTimer); _silenceTimer = null; }
}

// console.log를 래핑해서 heartbeat 자동 갱신
const _origLog = console.log;
const _origErr = console.error;
const _origWarn = console.warn;
console.log = (...a) => { heartbeat(); _origLog(...a); };
console.error = (...a) => { heartbeat(); _origErr(...a); };
console.warn = (...a) => { heartbeat(); _origWarn(...a); };

// ── 후보 번들 저장 ──
async function saveCandidateBundle(rosterId, rosterData, conceptData, selectedImages, allImages) {
  const num = String(rosterId).padStart(2, '0');
  const dirName = `${num}_${rosterData.wild.name_en}`;
  const candidateDir = resolve(__dirname, CONFIG.CANDIDATES_DIR, dirName);
  await mkdir(candidateDir, { recursive: true });
  await mkdir(resolve(candidateDir, 'selected'), { recursive: true });
  await mkdir(resolve(candidateDir, 'all_images'), { recursive: true });

  await writeFile(resolve(candidateDir, 'roster.json'), JSON.stringify(rosterData, null, 2), 'utf-8');
  if (conceptData) {
    await writeFile(resolve(candidateDir, 'concept.json'), JSON.stringify(conceptData, null, 2), 'utf-8');
  }

  for (const { form, winner } of selectedImages) {
    if (!winner) continue;
    const filename = `${form.type}_${form.name_en}.png`;
    await copyFile(winner.path, resolve(candidateDir, 'selected', filename));
  }

  for (const { form, result } of allImages) {
    for (const img of result.images) {
      const filename = `${form.type}_${form.name_en}_${img.index}.png`;
      await copyFile(img.path, resolve(candidateDir, 'all_images', filename));
    }
  }

  const readme = generateReadme(rosterId, rosterData, conceptData, selectedImages);
  await writeFile(resolve(candidateDir, 'README.md'), readme, 'utf-8');

  // temp 정리
  const tempDir = resolve(__dirname, CONFIG.TEMP_DIR);
  try {
    await rm(tempDir, { recursive: true, force: true });
    await mkdir(tempDir, { recursive: true });
  } catch {}

  log(`후보 저장: candidates/${dirName}/`);
  return dirName;
}

function generateReadme(id, roster, concept, selectedImages) {
  const w = roster.wild;
  let md = `# #${id} ${w.name_kr} (${w.name_en})\n\n`;
  md += `> ${w.desc_kr}\n\n`;
  md += `| 항목 | 값 |\n|------|----|\n`;
  md += `| 감각 | ${w.sensoryType.join(', ')} |\n`;
  md += `| 성격 | ${w.personality} |\n`;
  md += `| 서식지 | ${w.habitat} |\n`;
  md += `| 공격력 | ${w.attackPower} |\n`;
  md += `| 순화 임계 | ${w.tamingThreshold} |\n`;
  md += `| 도주 임계 | ${w.escapeThreshold} |\n`;
  md += `| HP | ${w.hp} |\n\n`;
  md += `## 퇴화 트리\n\n\`\`\`\n${w.name_kr} (야생)\n`;
  for (const d1 of roster.devo1) {
    md += `  └─ ${d1.name_kr} [${d1.role}] HP:${d1.hp}\n`;
    md += `     스킬: ${d1.skillFocus}\n`;
  }
  md += `\`\`\`\n\n## 선택된 이미지\n\n\`selected/\` 폴더 확인\n\n---\n생성일: ${new Date().toISOString()}\n`;
  return md;
}

// ── 자율 주제 후보 저장 ──
async function saveFreeCandidateBundle(seqNum, conceptData, selectedImages, allImages) {
  const name = conceptData.base.name_en || `free_${seqNum}`;
  const num = String(seqNum).padStart(2, '0');
  const dirName = `free_${num}_${name}`;
  const candidateDir = resolve(__dirname, CONFIG.CANDIDATES_DIR, dirName);
  await mkdir(candidateDir, { recursive: true });
  await mkdir(resolve(candidateDir, 'selected'), { recursive: true });
  await mkdir(resolve(candidateDir, 'all_images'), { recursive: true });

  await writeFile(resolve(candidateDir, 'concept.json'), JSON.stringify(conceptData, null, 2), 'utf-8');

  for (const { form, winner } of selectedImages) {
    if (!winner) continue;
    const filename = `${form.type}_${form.name_en}.png`;
    await copyFile(winner.path, resolve(candidateDir, 'selected', filename));
  }

  for (const { form, result } of allImages) {
    for (const img of result.images) {
      const filename = `${form.type}_${form.name_en}_${img.index}.png`;
      await copyFile(img.path, resolve(candidateDir, 'all_images', filename));
    }
  }

  // 간단한 README
  const b = conceptData.base;
  let md = `# ${b.name_kr} (${b.name_en}) — 자율 생성\n\n`;
  md += `> ${b.desc_kr}\n\n`;
  md += `| 항목 | 값 |\n|------|----|\n`;
  md += `| 감각 | ${b.sensoryType?.join(', ') || '?'} |\n`;
  md += `| 성격 | ${b.personality || '?'} |\n\n`;
  md += `## 퇴화 트리\n\n`;
  md += `\`\`\`\n${b.name_kr} (야생)\n`;
  for (const d1 of (conceptData.devolutions_1 || [])) {
    md += `  └─ ${d1.name_kr}\n`;
  }
  md += `\`\`\`\n\n---\n생성일: ${new Date().toISOString()}\n`;
  await writeFile(resolve(candidateDir, 'README.md'), md, 'utf-8');

  // temp 정리
  const tempDir = resolve(__dirname, CONFIG.TEMP_DIR);
  try { await rm(tempDir, { recursive: true, force: true }); await mkdir(tempDir, { recursive: true }); } catch {}

  log(`후보 저장: candidates/${dirName}/`);
  return dirName;
}

// ── 자율 주제 1종 처리 ──
async function processOneFree(seqNum) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  [Free #${seqNum}] 자율 주제 몬스터 생성`);
  console.log(`${'='.repeat(60)}\n`);

  startSilenceWatch(`Free #${seqNum}`);

  // Step 1: LLM 랜덤 컨셉 생성
  log('[Step 1/4] LLM 랜덤 컨셉 생성...');
  const { concept, allForms } = await generateMonsterConcept(null);

  // Step 2: 이미지 생성
  log(`[Step 2/4] ${allForms.length}개 형태 이미지 생성...`);
  const allImageResults = [];
  for (const form of allForms) {
    const result = await generateImages(form);
    allImageResults.push({ form, result });
  }

  // Step 3: 이미지 심사
  log(`[Step 3/4] 토너먼트 심사...`);
  const selectedImages = [];
  for (const { form, result } of allImageResults) {
    let winner;
    if (flags.skipReview) {
      winner = result.images[0] || null;
      if (winner) log(`  [Skip] "${form.name_en}" 첫번째 이미지`);
    } else {
      winner = await reviewAndSelectBest(result, concept);
    }
    selectedImages.push({ form, winner });
  }

  stopSilenceWatch();

  // Step 4: 저장
  log(`[Step 4/4] 후보 저장...`);
  const dirName = await saveFreeCandidateBundle(seqNum, concept, selectedImages, allImageResults);

  log(`✓ Free #${seqNum} ${concept.base.name_kr} 완료 → candidates/${dirName}/`);
  return concept;
}

// ── 1종 처리 (roster) ──
async function processOne(rosterEntry, progress) {
  const { data: rosterData } = rosterEntry;
  const id = rosterData.id;
  const w = rosterData.wild;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  #${String(id).padStart(2, '0')} ${w.name_kr} (${w.name_en})`);
  console.log(`  ${w.personality} | ${w.sensoryType.join('+')} | ${w.habitat} | devo1: ${rosterData.devo1.length}종`);
  console.log(`${'='.repeat(60)}\n`);

  startSilenceWatch(`#${id} ${w.name_en}`);

  // Step 1: LLM 컨셉 보강
  log('[Step 1/4] LLM 컨셉 보강...');
  const { concept, allForms } = await generateMonsterConcept(rosterData);

  // Step 2: 이미지 생성
  log(`[Step 2/4] ${allForms.length}개 형태 이미지 생성...`);
  const allImageResults = [];
  for (const form of allForms) {
    const result = await generateImages(form);
    allImageResults.push({ form, result });
  }

  // Step 3: 이미지 심사
  log(`[Step 3/4] 토너먼트 심사...`);
  const selectedImages = [];
  for (const { form, result } of allImageResults) {
    let winner;
    if (flags.skipReview) {
      winner = result.images[0] || null;
      if (winner) log(`  [Skip] "${form.name_en}" 첫번째 이미지`);
    } else {
      winner = await reviewAndSelectBest(result, concept);
    }
    selectedImages.push({ form, winner });
  }

  stopSilenceWatch();

  // Step 4: 저장
  log(`[Step 4/4] 후보 저장...`);
  const dirName = await saveCandidateBundle(id, rosterData, concept, selectedImages, allImageResults);

  // 진행 기록
  if (!progress.completed) progress.completed = [];
  if (!progress.completed.includes(id)) progress.completed.push(id);
  progress.lastCompleted = id;
  await saveProgress(progress);

  log(`✓ #${String(id).padStart(2, '0')} ${w.name_kr} 완료 → candidates/${dirName}/`);
}

// ── 야생 프롬프트 복잡도 강화 ──
const WILD_COMPLEXITY_BOOST = [
  'many body parts excessive anatomy',
  'multiple eyes four to eight eyes',
  'six or more legs extra limbs multiple arms',
  'multiple wings layered wings',
  'multiple tails branching tails',
  'many horns many spikes growing from head back shoulders',
  'multiple fangs extra mouths excessive teeth rows',
  'many fins many tendrils flowing appendages',
  'dark saturated color palette intimidating presence',
  'maximum body part count chaotic wild creature',
].join(', ');

function enhanceWildPrompt(originalPrompt) {
  // 이미 강화된 프롬프트인지 확인
  if (originalPrompt.includes('maximum visual complexity')) {
    return originalPrompt;
  }
  // 'menacing dark pokemon' 앞에 복잡도 요소 삽입
  const insertPoint = originalPrompt.indexOf('menacing dark pokemon');
  if (insertPoint !== -1) {
    return originalPrompt.substring(0, insertPoint)
      + WILD_COMPLEXITY_BOOST + ', '
      + originalPrompt.substring(insertPoint);
  }
  // fallback: 프롬프트 앞에 추가
  return originalPrompt + ', ' + WILD_COMPLEXITY_BOOST;
}

// ── 야생 전용 LLM 프롬프트 재생성 ──
async function regenerateWildPrompt(rosterData) {
  const { generateMonsterConcept } = await import('./concept-agent.js');
  log('[Wild Regen] LLM으로 야생 프롬프트 재생성 중...');
  const { concept } = await generateMonsterConcept(rosterData);
  return concept.base.image_prompt;
}

// ── 야생(base) 이미지만 재생성 ──
async function runWildOnly(roster) {
  // 대상 결정
  let targets = [];
  if (flags.only) {
    const entry = roster.find(r => r.data.id === flags.only);
    if (!entry) { console.error(`roster #${flags.only} 없음`); return; }
    targets = [entry];
  } else if (flags.from) {
    targets = roster.filter(r => r.data.id >= flags.from);
  } else {
    targets = roster;
  }

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║     Monster Pipeline — WILD-ONLY 이미지 재생성     ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  대상:        ${String(targets.length + '종').padEnd(37)}║`);
  console.log(`║  LLM 재생성:  ${String(flags.wildPrompt ? '예 (--wild-prompt)' : '아니오 (프롬프트 강화만)').padEnd(37)}║`);
  console.log(`║  Skip Review: ${String(flags.skipReview).padEnd(37)}║`);
  console.log(`║  Silence:     ${String(flags.silenceSec + '초').padEnd(37)}║`);
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log();

  await mkdir(resolve(__dirname, CONFIG.TEMP_DIR), { recursive: true });

  for (const entry of targets) {
    const id = entry.data.id;
    const w = entry.data.wild;
    const num = String(id).padStart(2, '0');
    const dirName = `${num}_${w.name_en}`;
    const candidateDir = resolve(__dirname, CONFIG.CANDIDATES_DIR, dirName);

    console.log(`\n${'─'.repeat(50)}`);
    console.log(`  #${num} ${w.name_kr} (${w.name_en}) — 야생 이미지 재생성`);
    console.log(`${'─'.repeat(50)}`);

    startSilenceWatch(`Wild #${id} ${w.name_en}`);

    try {
      // concept.json 로드
      let concept;
      try {
        concept = JSON.parse(await readFile(resolve(candidateDir, 'concept.json'), 'utf-8'));
      } catch {
        log(`⚠ candidates/${dirName}/concept.json 없음, 건너뛰기`);
        stopSilenceWatch();
        continue;
      }

      // 야생 프롬프트 결정
      let wildPrompt;
      if (flags.wildPrompt) {
        // LLM으로 새 프롬프트 생성
        wildPrompt = await regenerateWildPrompt(entry.data);
        log(`[Wild] LLM 새 프롬프트: ${wildPrompt.substring(0, 80)}...`);
      } else {
        // 기존 프롬프트 강화
        wildPrompt = enhanceWildPrompt(concept.base.image_prompt);
        log(`[Wild] 프롬프트 강화 완료`);
      }

      // concept.json 업데이트
      concept.base.image_prompt = wildPrompt;
      await writeFile(resolve(candidateDir, 'concept.json'), JSON.stringify(concept, null, 2), 'utf-8');

      // base form 준비
      const baseForm = {
        name_en: concept.base.name_en,
        image_prompt: wildPrompt,
        type: 'base',
      };

      // 이미지 생성
      log(`[Wild] ${CONFIG.IMAGES_PER_CONCEPT}장 이미지 생성 중...`);
      const result = await generateImages(baseForm);

      // 이미지 심사
      let winner;
      if (flags.skipReview) {
        winner = result.images[0] || null;
        if (winner) log(`  [Skip] 첫번째 이미지 선택`);
      } else {
        log(`[Wild] 토너먼트 심사...`);
        winner = await reviewAndSelectBest(result, concept);
      }

      // 기존 base 이미지 교체
      if (winner) {
        const selectedDir = resolve(candidateDir, 'selected');
        await mkdir(selectedDir, { recursive: true });
        const baseName = `base_${concept.base.name_en}.png`;
        await copyFile(winner.path, resolve(selectedDir, baseName));
        log(`  ✓ selected/${baseName} 교체 완료`);
      }

      // all_images에 새 base 이미지 추가 (기존 base 이미지 덮어쓰기)
      const allImgDir = resolve(candidateDir, 'all_images');
      await mkdir(allImgDir, { recursive: true });
      for (const img of result.images) {
        const filename = `base_${concept.base.name_en}_${img.index}.png`;
        await copyFile(img.path, resolve(allImgDir, filename));
      }

      // temp 정리
      try {
        const tempDir = resolve(__dirname, CONFIG.TEMP_DIR);
        await rm(tempDir, { recursive: true, force: true });
        await mkdir(tempDir, { recursive: true });
      } catch {}

      stopSilenceWatch();
      log(`✓ #${num} ${w.name_kr} 야생 이미지 재생성 완료`);

    } catch (err) {
      stopSilenceWatch();
      log(`✗ #${num} ${w.name_kr} 에러: ${err.message}`);
      // temp 정리
      try {
        const tempDir = resolve(__dirname, CONFIG.TEMP_DIR);
        await rm(tempDir, { recursive: true, force: true });
        await mkdir(tempDir, { recursive: true });
      } catch {}
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log('  야생 이미지 재생성 완료');
  console.log(`${'='.repeat(50)}\n`);
}

// ── 메인 ──
async function runPipeline() {
  const roster = await loadRosterFiles();
  let progress = await loadProgress();

  // --reset
  if (flags.reset) {
    await saveProgress({ lastCompleted: 0, completed: [], failed: [], startedAt: null });
    console.log('진행 기록 초기화 완료.');
    return;
  }

  // --status
  if (flags.status) {
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║          Monster Pipeline 진행 상황                  ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');
    console.log(`  총 roster:     ${roster.length}종`);
    console.log(`  마지막 완료:   #${progress.lastCompleted}`);
    console.log(`  완료:          ${progress.completed?.length || 0}종 [${(progress.completed || []).join(', ')}]`);
    console.log(`  실패:          ${progress.failed?.length || 0}종 [${(progress.failed || []).join(', ')}]`);
    console.log(`  남은:          ${roster.length - (progress.completed?.length || 0)}종`);
    if (progress.startedAt) console.log(`  시작:          ${progress.startedAt}`);
    console.log();
    for (const { data } of roster) {
      const id = data.id;
      const done = (progress.completed || []).includes(id);
      const fail = (progress.failed || []).includes(id);
      const icon = done ? '✓' : fail ? '✗' : '·';
      console.log(`  ${icon} #${String(id).padStart(2, '0')} ${data.wild.name_kr} (${data.wild.name_en}) [${data.wild.personality}/${data.wild.sensoryType.join('+')}] devo1:${data.devo1.length}종`);
    }
    console.log();
    return;
  }

  // ── 야생(base) 이미지만 재생성 모드 ──
  if (flags.wildOnly) {
    await runWildOnly(roster);
    return;
  }

  // ── 자율 주제 모드 ──
  if (flags.free) {
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║     Monster Generation Pipeline v3 — FREE MODE      ║');
    console.log('║     (자율 주제 · roster 없이 랜덤 생성)             ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log(`║  Model:       ${CONFIG.TEXT_MODEL.padEnd(37)}║`);
    console.log(`║  ComfyUI:     ${CONFIG.COMFYUI_URL.padEnd(37)}║`);
    console.log(`║  Images:      ${String(CONFIG.IMAGES_PER_CONCEPT + '/form').padEnd(37)}║`);
    console.log(`║  생성 수:     ${String(flags.count + '마리').padEnd(37)}║`);
    console.log(`║  Silence:     ${String(flags.silenceSec + '초 무응답=hang').padEnd(37)}║`);
    console.log(`║  Max Retries: ${String(flags.maxRetries + '회/몬스터').padEnd(37)}║`);
    console.log(`║  Skip Review: ${String(flags.skipReview).padEnd(37)}║`);
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log();

    await mkdir(resolve(__dirname, CONFIG.TEMP_DIR), { recursive: true });
    await mkdir(resolve(__dirname, CONFIG.CANDIDATES_DIR), { recursive: true });

    // 기존 free 후보 수를 세서 시퀀스 번호 결정
    const { readdir: rd } = await import('fs/promises');
    const existingFree = (await rd(resolve(__dirname, CONFIG.CANDIDATES_DIR)))
      .filter(d => d.startsWith('free_')).length;

    for (let i = 0; i < flags.count; i++) {
      const seqNum = existingFree + i + 1;
      let success = false;
      let retries = 0;

      while (!success && retries < flags.maxRetries) {
        if (retries > 0) {
          log(`재시도 ${retries + 1}/${flags.maxRetries}: Free #${seqNum} (5초 대기...)`);
          await new Promise(r => setTimeout(r, 5000));
        }
        try {
          await processOneFree(seqNum);
          success = true;
        } catch (err) {
          stopSilenceWatch();
          retries++;
          log(`✗ Free #${seqNum} 에러: ${err.message}`);
          try {
            const tempDir = resolve(__dirname, CONFIG.TEMP_DIR);
            await rm(tempDir, { recursive: true, force: true });
            await mkdir(tempDir, { recursive: true });
          } catch {}
        }
      }
      if (!success) {
        log(`✗ Free #${seqNum} — ${flags.maxRetries}회 실패, 건너뛰기`);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('  자율 주제 파이프라인 완료');
    console.log(`${'='.repeat(60)}\n`);
    return;
  }

  // 실행 대상 결정
  let toProcess = [];
  if (flags.only) {
    const entry = roster.find(r => r.data.id === flags.only);
    if (!entry) { console.error(`roster #${flags.only} 없음`); return; }
    toProcess = [entry];
  } else {
    const startFrom = flags.from || (progress.lastCompleted + 1);
    toProcess = roster.filter(r => r.data.id >= startFrom);
  }

  if (toProcess.length === 0) {
    console.log('모든 몬스터 처리 완료! --status로 확인하거나 --reset으로 초기화하세요.');
    return;
  }

  if (!progress.startedAt) progress.startedAt = new Date().toISOString();

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║     Monster Generation Pipeline v3                  ║');
  console.log('║     (roster 기반 + watchdog 내장)                   ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Model:       ${CONFIG.TEXT_MODEL.padEnd(37)}║`);
  console.log(`║  ComfyUI:     ${CONFIG.COMFYUI_URL.padEnd(37)}║`);
  console.log(`║  Images:      ${String(CONFIG.IMAGES_PER_CONCEPT + '/form').padEnd(37)}║`);
  console.log(`║  대상:        ${String(toProcess.length + '종 (#' + toProcess[0].data.id + '~#' + toProcess[toProcess.length-1].data.id + ')').padEnd(37)}║`);
  console.log(`║  Silence:     ${String(flags.silenceSec + '초 무응답=hang').padEnd(37)}║`);
  console.log(`║  Max Retries: ${String(flags.maxRetries + '회/몬스터').padEnd(37)}║`);
  console.log(`║  Skip Review: ${String(flags.skipReview).padEnd(37)}║`);
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log();

  await mkdir(resolve(__dirname, CONFIG.TEMP_DIR), { recursive: true });
  await mkdir(resolve(__dirname, CONFIG.CANDIDATES_DIR), { recursive: true });

  const retryCount = {};

  for (const entry of toProcess) {
    const id = entry.data.id;
    const w = entry.data.wild;

    // 재시도 루프
    let success = false;
    while (!success) {
      const retries = retryCount[id] || 0;

      if (retries >= flags.maxRetries) {
        log(`✗ #${String(id).padStart(2, '0')} ${w.name_kr} — ${flags.maxRetries}회 실패, 건너뛰기`);
        if (!progress.failed) progress.failed = [];
        if (!progress.failed.includes(id)) progress.failed.push(id);
        progress.lastCompleted = id;
        await saveProgress(progress);
        break;
      }

      if (retries > 0) {
        log(`재시도 ${retries + 1}/${flags.maxRetries}: #${String(id).padStart(2, '0')} ${w.name_kr} (5초 대기...)`);
        await new Promise(r => setTimeout(r, 5000));
      }

      try {
        await processOne(entry, progress);
        success = true;
      } catch (err) {
        stopSilenceWatch();
        retryCount[id] = (retryCount[id] || 0) + 1;
        log(`✗ #${String(id).padStart(2, '0')} 에러: ${err.message}`);

        // temp 정리 (반쯤 생성된 파일 제거)
        try {
          const tempDir = resolve(__dirname, CONFIG.TEMP_DIR);
          await rm(tempDir, { recursive: true, force: true });
          await mkdir(tempDir, { recursive: true });
        } catch {}
      }
    }

    // 진행 상태 리로드 (processOne이 저장했을 수 있음)
    progress = await loadProgress();
  }

  // 최종 요약
  const final = await loadProgress();
  console.log(`\n${'='.repeat(60)}`);
  console.log('  파이프라인 완료 요약');
  console.log(`${'='.repeat(60)}`);
  console.log(`  완료: ${final.completed?.length || 0}/${roster.length}`);
  console.log(`  실패: ${final.failed?.length || 0}종 [${(final.failed || []).join(', ')}]`);
  console.log(`  다음: #${final.lastCompleted + 1}`);
  console.log(`\n진행 확인: node pipeline.js --status`);
  console.log(`이어서:    node pipeline.js\n`);
}

runPipeline().catch(err => {
  console.error('파이프라인 치명적 에러:', err);
  process.exit(1);
});
