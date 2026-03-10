#!/usr/bin/env node
// ============================================================
// Monster Generation Pipeline v4 — roster 완성형 데이터 기반
// ============================================================
//
// roster/*.json의 완성형 데이터를 기반으로:
//   1. image_desc (한국어) → LM Studio → 영어 prompt → ComfyUI 이미지 생성
//   2. 토너먼트 심사로 최적 이미지 선택
//   3. 후보 번들 저장
//
// 사용법:
//   node pipeline.js              # roster 순차 실행 (이어서)
//   node pipeline.js --from 5     # 5번부터 시작
//   node pipeline.js --only 3     # 3번만 실행
//   node pipeline.js --skip-review # 이미지 심사 건너뛰기
//   node pipeline.js --reset      # 진행 기록 초기화
//   node pipeline.js --status     # 현재 진행 상황 확인
//   node pipeline.js --wild-only     # 야생(base) 이미지만 재생성
//   node pipeline.js --wild-only --only 3  # 3번만 야생 재생성
//   node pipeline.js --silence 300  # 무응답 타임아웃 초 (기본 300)
//   node pipeline.js --max-retries 3 # 최대 재시도 (기본 3)
//   node pipeline.js --skip-translate # 번역 건너뛰기 (image_desc를 그대로 사용)
// ============================================================

import {
  buildFormsFromRoster,
  generatePromptVariants,
  generateReactionsAndActions,
  assembleConcept,
} from './concept-agent.js';
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
  skipTranslate: args.includes('--skip-translate'),
  reset: args.includes('--reset'),
  status: args.includes('--status'),
  wildOnly: args.includes('--wild-only'),
  from: getArgInt('--from', null),
  only: getArgInt('--only', null),
  silenceSec: getArgInt('--silence', 300),
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
  const files = (await readdir(ROSTER_DIR))
    .filter(f => f.match(/^\d{2}_/) && f.endsWith('.json'))
    .sort();
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

// ── heartbeat 감시 ──
let _lastActivity = Date.now();
let _silenceTimer = null;

function heartbeat() { _lastActivity = Date.now(); }

function startSilenceWatch(label) {
  stopSilenceWatch();
  _silenceTimer = setInterval(() => {
    const silentMs = Date.now() - _lastActivity;
    if (silentMs > flags.silenceSec * 1000) {
      log(`HANG 감지: ${Math.round(silentMs / 1000)}초 무응답 (${label})`);
      stopSilenceWatch();
      process.exit(99);
    }
  }, 10000);
}

function stopSilenceWatch() {
  if (_silenceTimer) { clearInterval(_silenceTimer); _silenceTimer = null; }
}

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

  // roster 원본 저장
  await writeFile(resolve(candidateDir, 'roster.json'), JSON.stringify(rosterData, null, 2), 'utf-8');
  // concept (번역된 prompt + reactions + actions 포함) 저장
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
  try {
    const tempDir = resolve(__dirname, CONFIG.TEMP_DIR);
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
  md += `| HP | ${w.hp} |\n`;
  if (w.wildMechanic) {
    md += `| 고유 메커니즘 | ${w.wildMechanic.name_kr}: ${w.wildMechanic.desc_kr} |\n`;
  }
  const vc = w.visual?.colors;
  if (vc) {
    md += `| 컬러 | ${vc.primary} / ${vc.secondary} / ${vc.accent} |\n`;
  }
  md += `\n## 퇴화 트리\n\n\`\`\`\n${w.name_kr} (야생)\n`;
  for (const d1 of roster.devo1) {
    md += `  └─ ${d1.name_kr} [${d1.role}] HP:${d1.hp}\n`;
    md += `     스킬: ${d1.skillFocus}\n`;
    if (d1.devo2) {
      for (const d2 of d1.devo2) {
        md += `       └─ ${d2.name_kr} [${d2.role}] HP:${d2.hp}\n`;
      }
    }
  }
  md += `\`\`\`\n\n## 선택된 이미지\n\n\`selected/\` 폴더 확인\n\n---\n생성일: ${new Date().toISOString()}\n`;
  return md;
}

// ── 1종 처리 (roster) — LM Studio 메인 루프 + ComfyUI 큐 적재 ──
// LM Studio(번역)가 메인 루프, ComfyUI(이미지)는 큐에 쌓아놓고 나중에 수집:
//   Phase A: LM Studio가 번역하는 즉시 ComfyUI 큐에 fire-and-forget
//   Phase B: 모든 번역 완료 후 ComfyUI 결과 일괄 수집
//   Phase C: 이미지 심사 (LM Studio)
//   reactions/actions는 Phase A 시작과 동시에 백그라운드 실행
async function processOne(rosterEntry, progress) {
  const { data: rosterData } = rosterEntry;
  const id = rosterData.id;
  const w = rosterData.wild;

  const devo1Count = rosterData.devo1.length;
  const devo2Count = rosterData.devo1.reduce((sum, d1) => sum + (d1.devo2?.length || 0), 0);
  const totalForms = 1 + devo1Count + devo2Count;
  const variantsPerForm = CONFIG.IMAGES_PER_CONCEPT;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  #${String(id).padStart(2, '0')} ${w.name_kr} (${w.name_en})`);
  console.log(`  ${w.personality} | ${w.sensoryType.join('+')} | ${w.habitat}`);
  console.log(`  devo1: ${devo1Count}종 | devo2: ${devo2Count}종 | 총: ${totalForms}형태`);
  console.log(`  이미지: ${totalForms} × ${variantsPerForm} = ${totalForms * variantsPerForm}장`);
  console.log(`  ⚡ LM Studio → 번역 즉시 ComfyUI 큐 적재 (대기 없음)`);
  if (w.wildMechanic) console.log(`  메커니즘: ${w.wildMechanic.name_kr}`);
  console.log(`${'='.repeat(60)}\n`);

  startSilenceWatch(`#${id} ${w.name_en}`);

  // ── Phase 0: roster → allForms 빌드 ──
  const allForms = buildFormsFromRoster(rosterData);
  log(`[Phase 0] ${allForms.length}개 형태 빌드 완료`);

  // ── Phase A: LM Studio 번역 → ComfyUI 큐 적재 (메인 루프) ──
  log(`[Phase A] LM Studio 번역 시작 + ComfyUI 큐 적재`);

  // reactions/actions를 번역과 동시에 백그라운드 실행
  const supplementaryPromise = generateReactionsAndActions(rosterData);
  log(`  [LM Studio] reactions/actions 백그라운드 시작`);

  // ComfyUI 이미지 생성 promise 배열 (await 하지 않고 쌓아둠)
  const imagePromises = []; // { form, promise: Promise<result> }

  for (let i = 0; i < allForms.length; i++) {
    const form = allForms[i];

    // LM Studio: 번역 (메인 루프 — 순차 대기)
    log(`  [LM Studio] form[${i}/${allForms.length - 1}] "${form.name_kr}" 번역 중...`);
    const prompts = await generatePromptVariants(form.image_desc, form.name_kr, variantsPerForm, form.type);
    form.image_prompts = prompts;
    form.image_prompt = prompts[0];
    log(`  ✓ form[${i}] 번역 완료 (${prompts.length}변형)`);

    // ComfyUI: 큐에 적재 (fire-and-forget — await 안 함!)
    log(`  → [ComfyUI] form[${i}] "${form.name_kr}" ${variantsPerForm}장 큐 적재`);
    const imagePromise = generateImages(form);
    imagePromises.push({ form, promise: imagePromise });
  }

  log(`[Phase A 완료] ${allForms.length}개 형태 번역 완료, ${imagePromises.length}개 ComfyUI 작업 큐 적재됨`);

  // ── Phase B: ComfyUI 결과 일괄 수집 ──
  log(`[Phase B] ComfyUI 결과 수집 대기 중...`);
  const allImageResults = [];
  for (let i = 0; i < imagePromises.length; i++) {
    const { form, promise } = imagePromises[i];
    const result = await promise;
    allImageResults.push({ form, result });
    log(`  ✓ [ComfyUI] form[${i}] "${form.name_kr}" ${result.images.length}장 수집 완료`);
  }

  // ── Phase C: 이미지 심사 ──
  log(`[Phase C] 토너먼트 심사...`);
  const selectedImages = [];
  for (const { form, result } of allImageResults) {
    let winner;
    if (flags.skipReview) {
      winner = result.images[0] || null;
      if (winner) log(`  [Skip] "${form.name_en}" 첫번째 이미지`);
    } else {
      log(`  [LM Studio] "${form.name_kr}" 심사 중...`);
      winner = await reviewAndSelectBest(result, null);
    }
    selectedImages.push({ form, winner });
  }

  // ── Phase D: reactions 수집 + concept 조립 + 저장 ──
  log(`[Phase D] 최종 조립 + 저장`);
  const supplementary = await supplementaryPromise;
  log(`  ✓ reactions + ${Object.keys(supplementary.actions || {}).length}종 actions 완료`);

  const concept = assembleConcept(rosterData, allForms, supplementary);

  concept.devolutions_1.forEach((d, i) => {
    console.log(`  퇴화1-${String.fromCharCode(65 + i)}: ${d.name_kr} [${d.role}]`);
    d.actions?.forEach(a => console.log(`    [${a.category}] ${a.name} (${a.axis}) pow:${a.power} esc:${a.escapeRisk} pp:${a.pp}`));
  });

  stopSilenceWatch();

  const dirName = await saveCandidateBundle(id, rosterData, concept, selectedImages, allImageResults);

  if (!progress.completed) progress.completed = [];
  if (!progress.completed.includes(id)) progress.completed.push(id);
  progress.lastCompleted = id;
  await saveProgress(progress);

  log(`✓ #${String(id).padStart(2, '0')} ${w.name_kr} 완료 → candidates/${dirName}/`);
}

// ── 야생(base) 이미지만 재생성 ──
async function runWildOnly(roster) {
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
  console.log('║     Monster Pipeline v4 — WILD-ONLY 재생성         ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  대상:        ${String(targets.length + '종').padEnd(37)}║`);
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
      // image_desc → 변형 영어 프롬프트 생성
      const imageDesc = w.visual?.image_desc || w.desc_kr;
      log(`[Wild] ${CONFIG.IMAGES_PER_CONCEPT}개 변형 프롬프트 생성 중...`);
      const prompts = await generatePromptVariants(imageDesc, w.name_kr, CONFIG.IMAGES_PER_CONCEPT);

      const wildForm = {
        name_en: w.name_en,
        name_kr: w.name_kr,
        image_prompt: prompts[0],
        image_prompts: prompts,
        type: 'base',
      };

      // 이미지 생성 (각 이미지마다 다른 프롬프트)
      log(`[Wild] ${CONFIG.IMAGES_PER_CONCEPT}장 이미지 생성 중 (${prompts.length}변형 프롬프트)...`);
      const result = await generateImages(wildForm);

      // 심사
      let winner;
      if (flags.skipReview) {
        winner = result.images[0] || null;
        if (winner) log(`  [Skip] 첫번째 이미지 선택`);
      } else {
        log(`[Wild] 토너먼트 심사...`);
        winner = await reviewAndSelectBest(result, null);
      }

      // 저장
      await mkdir(resolve(candidateDir, 'selected'), { recursive: true });
      await mkdir(resolve(candidateDir, 'all_images'), { recursive: true });

      if (winner) {
        const baseName = `base_${w.name_en}.png`;
        await copyFile(winner.path, resolve(candidateDir, 'selected', baseName));
        log(`  ✓ selected/${baseName} 교체 완료`);
      }

      for (const img of result.images) {
        const filename = `base_${w.name_en}_${img.index}.png`;
        await copyFile(img.path, resolve(candidateDir, 'all_images', filename));
      }

      // temp 정리
      try {
        await rm(resolve(__dirname, CONFIG.TEMP_DIR), { recursive: true, force: true });
        await mkdir(resolve(__dirname, CONFIG.TEMP_DIR), { recursive: true });
      } catch {}

      stopSilenceWatch();
      log(`✓ #${num} ${w.name_kr} 야생 이미지 재생성 완료`);

    } catch (err) {
      stopSilenceWatch();
      log(`✗ #${num} ${w.name_kr} 에러: ${err.message}`);
      try {
        await rm(resolve(__dirname, CONFIG.TEMP_DIR), { recursive: true, force: true });
        await mkdir(resolve(__dirname, CONFIG.TEMP_DIR), { recursive: true });
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
    console.log('║          Monster Pipeline v4 진행 상황               ║');
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
      const d2count = data.devo1.reduce((s, d1) => s + (d1.devo2?.length || 0), 0);
      const mech = data.wild.wildMechanic ? ` [${data.wild.wildMechanic.name_kr}]` : '';
      console.log(`  ${icon} #${String(id).padStart(2, '0')} ${data.wild.name_kr} (${data.wild.name_en}) [${data.wild.personality}/${data.wild.sensoryType.join('+')}] devo1:${data.devo1.length} devo2:${d2count}${mech}`);
    }
    console.log();
    return;
  }

  // -- wild-only 모드
  if (flags.wildOnly) {
    await runWildOnly(roster);
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

  // 총 형태 수 계산
  const totalForms = toProcess.reduce((sum, e) => {
    const d = e.data;
    return sum + 1 + d.devo1.length + d.devo1.reduce((s, d1) => s + (d1.devo2?.length || 0), 0);
  }, 0);

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║     Monster Generation Pipeline v4                  ║');
  console.log('║     (roster 완성형 데이터 기반)                     ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Model:       ${CONFIG.TEXT_MODEL.padEnd(37)}║`);
  console.log(`║  ComfyUI:     ${CONFIG.COMFYUI_URL.padEnd(37)}║`);
  console.log(`║  Images:      ${String(CONFIG.IMAGES_PER_CONCEPT + '/form').padEnd(37)}║`);
  console.log(`║  대상:        ${String(toProcess.length + '종 (' + totalForms + '형태)').padEnd(37)}║`);
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
        try {
          await rm(resolve(__dirname, CONFIG.TEMP_DIR), { recursive: true, force: true });
          await mkdir(resolve(__dirname, CONFIG.TEMP_DIR), { recursive: true });
        } catch {}
      }
    }

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
