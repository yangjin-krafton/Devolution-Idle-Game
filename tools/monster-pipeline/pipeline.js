#!/usr/bin/env node
// ============================================================
// Monster Generation Pipeline v3 — roster 기반 순차 실행
// ============================================================
//
// roster/*.json 파일을 순차적으로 처리하며 진행 상태를 기록합니다.
// 중단 후 재실행하면 마지막 완료 지점부터 이어서 진행합니다.
//
// 사용법:
//   node pipeline.js              # roster 순차 실행 (이어서)
//   node pipeline.js --from 5     # 5번부터 시작
//   node pipeline.js --only 3     # 3번만 실행
//   node pipeline.js --skip-review # 이미지 심사 건너뛰기
//   node pipeline.js --reset      # 진행 기록 초기화
//   node pipeline.js --status     # 현재 진행 상황 확인
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
const flags = {
  skipReview: args.includes('--skip-review'),
  reset: args.includes('--reset'),
  status: args.includes('--status'),
  from: null,
  only: null,
};
const fromIdx = args.indexOf('--from');
if (fromIdx !== -1 && args[fromIdx + 1]) flags.from = parseInt(args[fromIdx + 1], 10);
const onlyIdx = args.indexOf('--only');
if (onlyIdx !== -1 && args[onlyIdx + 1]) flags.only = parseInt(args[onlyIdx + 1], 10);

// ── 진행 기록 ──
async function loadProgress() {
  try {
    const raw = await readFile(PROGRESS_FILE, 'utf-8');
    return JSON.parse(raw);
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
    .filter(f => f.endsWith('.json'))
    .sort();
  const roster = [];
  for (const f of files) {
    const data = JSON.parse(await readFile(resolve(ROSTER_DIR, f), 'utf-8'));
    roster.push({ filename: f, data });
  }
  return roster;
}

// ── roster 데이터로 이미지 프롬프트 폼 생성 ──
function buildFormsFromRoster(rosterEntry) {
  const { wild, devo1, devo2_per_devo1 } = rosterEntry;
  const forms = [];

  // 야생 (base)
  forms.push({
    name_en: wild.name_en,
    name_kr: wild.name_kr,
    type: 'base',
    image_prompt: null, // concept-agent가 생성
  });

  // 퇴화1 각 변종
  devo1.forEach((d, i) => {
    forms.push({
      name_en: d.name_en,
      name_kr: d.name_kr,
      type: `devo1_${i}`,
      image_prompt: null,
    });

    // 퇴화2 (각 퇴화1당 devo2_per_devo1개)
    for (let j = 0; j < devo2_per_devo1; j++) {
      forms.push({
        name_en: `${d.name_en}_baby${j + 1}`,
        name_kr: `${d.name_kr} 아기${j + 1}`,
        type: `devo2_${i}_${j}`,
        parent_devo1: d.name_en,
        image_prompt: null,
      });
    }
  });

  return forms;
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
}

// ── 후보 번들 저장 ──
async function saveCandidateBundle(rosterId, rosterData, conceptData, selectedImages, allImages) {
  const num = String(rosterId).padStart(2, '0');
  const dirName = `${num}_${rosterData.wild.name_en}`;
  const candidateDir = resolve(__dirname, CONFIG.CANDIDATES_DIR, dirName);
  await mkdir(candidateDir, { recursive: true });
  await mkdir(resolve(candidateDir, 'selected'), { recursive: true });
  await mkdir(resolve(candidateDir, 'all_images'), { recursive: true });

  // 1. roster 원본 + 생성된 컨셉 저장
  await writeFile(resolve(candidateDir, 'roster.json'), JSON.stringify(rosterData, null, 2), 'utf-8');
  if (conceptData) {
    await writeFile(resolve(candidateDir, 'concept.json'), JSON.stringify(conceptData, null, 2), 'utf-8');
  }

  // 2. 선택된 이미지
  for (const { form, winner } of selectedImages) {
    if (!winner) continue;
    const filename = `${form.type}_${form.name_en}.png`;
    await copyFile(winner.path, resolve(candidateDir, 'selected', filename));
  }

  // 3. 전체 이미지
  for (const { form, result } of allImages) {
    for (const img of result.images) {
      const filename = `${form.type}_${form.name_en}_${img.index}.png`;
      await copyFile(img.path, resolve(candidateDir, 'all_images', filename));
    }
  }

  // 4. README
  const readme = generateReadme(rosterId, rosterData, conceptData, selectedImages);
  await writeFile(resolve(candidateDir, 'README.md'), readme, 'utf-8');

  // 5. temp 정리
  const tempDir = resolve(__dirname, CONFIG.TEMP_DIR);
  try {
    await rm(tempDir, { recursive: true, force: true });
    await mkdir(tempDir, { recursive: true });
  } catch {}

  console.log(`[Save] candidates/${dirName}/`);
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

  md += `## 퇴화 트리\n\n\`\`\`\n`;
  md += `${w.name_kr} (야생)\n`;
  for (const d1 of roster.devo1) {
    md += `  └─ ${d1.name_kr} [${d1.role}] HP:${d1.hp}\n`;
    md += `     스킬: ${d1.skillFocus}\n`;
  }
  md += `\`\`\`\n\n`;

  md += `## 선택된 이미지\n\n\`selected/\` 폴더 확인\n\n`;
  md += `---\n생성일: ${new Date().toISOString()}\n`;
  return md;
}

// ── 메인 파이프라인 ──
async function runPipeline() {
  const roster = await loadRosterFiles();
  const progress = await loadProgress();

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

    for (const { filename, data } of roster) {
      const id = data.id;
      const done = (progress.completed || []).includes(id);
      const fail = (progress.failed || []).includes(id);
      const icon = done ? '✓' : fail ? '✗' : '·';
      console.log(`  ${icon} #${String(id).padStart(2, '0')} ${data.wild.name_kr} (${data.wild.name_en}) [${data.wild.personality}/${data.wild.sensoryType.join('+')}] devo1:${data.devo1.length}종`);
    }
    console.log();
    return;
  }

  // 실행할 목록 결정
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
    console.log('처리할 몬스터가 없습니다. --status로 확인하거나 --reset으로 초기화하세요.');
    return;
  }

  if (!progress.startedAt) progress.startedAt = new Date().toISOString();

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║     Monster Generation Pipeline v3                  ║');
  console.log('║     (roster 기반 순차 실행)                         ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Model:      ${CONFIG.TEXT_MODEL.padEnd(38)}║`);
  console.log(`║  ComfyUI:    ${CONFIG.COMFYUI_URL.padEnd(38)}║`);
  console.log(`║  Images:     ${String(CONFIG.IMAGES_PER_CONCEPT + '/form').padEnd(38)}║`);
  console.log(`║  처리 대상:  ${String(toProcess.length + '종 (#' + toProcess[0].data.id + '~#' + toProcess[toProcess.length-1].data.id + ')').padEnd(38)}║`);
  console.log(`║  마지막완료: ${String('#' + progress.lastCompleted).padEnd(38)}║`);
  console.log(`║  Skip Review:${String(flags.skipReview).padEnd(38)}║`);
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log();

  await mkdir(resolve(__dirname, CONFIG.TEMP_DIR), { recursive: true });
  await mkdir(resolve(__dirname, CONFIG.CANDIDATES_DIR), { recursive: true });

  for (const { filename, data: rosterData } of toProcess) {
    const id = rosterData.id;
    const w = rosterData.wild;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`  #${String(id).padStart(2, '0')} ${w.name_kr} (${w.name_en})`);
    console.log(`  ${w.personality} | ${w.sensoryType.join('+')} | ${w.habitat} | devo1: ${rosterData.devo1.length}종`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      // ── Step 1: LLM으로 컨셉 보강 (이미지 프롬프트 + 스킬 + 반응 텍스트) ──
      console.log('[Step 1] LLM 컨셉 보강 (이미지 프롬프트 + 스킬 + 반응)...');
      const { concept, allForms } = await generateMonsterConcept(rosterData);

      // ── Step 2: 이미지 생성 ──
      console.log(`\n[Step 2] ${allForms.length}개 형태 이미지 생성...`);
      const allImageResults = [];
      for (const form of allForms) {
        const result = await generateImages(form);
        allImageResults.push({ form, result });
      }

      // ── Step 3: 이미지 심사 ──
      console.log(`\n[Step 3] 이미지 토너먼트 심사...`);
      const selectedImages = [];
      for (const { form, result } of allImageResults) {
        let winner;
        if (flags.skipReview) {
          winner = result.images[0] || null;
          if (winner) console.log(`  [Skip] "${form.name_en}" 첫번째 이미지`);
        } else {
          winner = await reviewAndSelectBest(result, concept);
        }
        selectedImages.push({ form, winner });
      }

      // ── Step 4: 후보 저장 ──
      console.log(`\n[Step 4] 후보 저장...`);
      const dirName = await saveCandidateBundle(id, rosterData, concept, selectedImages, allImageResults);

      // ── 진행 기록 ──
      if (!progress.completed) progress.completed = [];
      if (!progress.completed.includes(id)) progress.completed.push(id);
      progress.lastCompleted = id;
      await saveProgress(progress);

      console.log(`\n✓ #${String(id).padStart(2, '0')} ${w.name_kr} 완료 → candidates/${dirName}/`);

    } catch (err) {
      console.error(`\n✗ #${String(id).padStart(2, '0')} ${w.name_kr} 실패: ${err.message}`);
      console.error(err.stack);

      if (!progress.failed) progress.failed = [];
      if (!progress.failed.includes(id)) progress.failed.push(id);
      await saveProgress(progress);
    }
  }

  // ── 최종 요약 ──
  const finalProgress = await loadProgress();
  console.log(`\n${'='.repeat(60)}`);
  console.log('  파이프라인 완료 요약');
  console.log(`${'='.repeat(60)}`);
  console.log(`  완료: ${finalProgress.completed?.length || 0}/${roster.length}`);
  console.log(`  실패: ${finalProgress.failed?.length || 0}종`);
  console.log(`  다음: #${finalProgress.lastCompleted + 1}`);
  console.log(`\n진행 확인:  node pipeline.js --status`);
  console.log(`이어서 실행: node pipeline.js`);
  console.log(`후보 심사:  node integrate.js --list\n`);
}

runPipeline().catch(err => {
  console.error('파이프라인 치명적 에러:', err);
  process.exit(1);
});
