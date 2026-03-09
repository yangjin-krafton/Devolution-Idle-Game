#!/usr/bin/env node
// ============================================================
// Monster Generation Pipeline — 총괄 오케스트레이터
// ============================================================
//
// 파이프라인 흐름:
//   1. [Concept Agent]     Qwen으로 몬스터 컨셉+스킬+퇴화 트리 생성
//   2. [ComfyUI Agent]     각 형태별 N장 이미지 생성
//   3. [Review Agent]      Vision 모델로 베스트 이미지 자동 선택
//   4. candidates/ 폴더에 결과 저장 (수동 심사용)
//
// 사용법:
//   node pipeline.js                # 몬스터 1종 생성 → candidates/
//   node pipeline.js --count 3      # 몬스터 3종 생성
//   node pipeline.js --dry-run      # 컨셉만 생성 (이미지 X)
//   node pipeline.js --skip-review  # 이미지 심사 건너뛰기
//   node pipeline.js --test         # base + 퇴화1 하나만 테스트
//
// 후보 심사:
//   node integrate.js --list        # 후보 목록 조회
//   node integrate.js --pick <id>   # 선택한 후보를 게임에 통합
// ============================================================

import { generateMonsterConcept } from './concept-agent.js';
import { generateImages } from './comfyui-agent.js';
import { reviewAndSelectBest } from './review-agent.js';
import { CONFIG } from './config.js';
import { mkdir, writeFile, copyFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// CLI 인수 파싱
const args = process.argv.slice(2);
const flags = {
  count: 1,
  dryRun: args.includes('--dry-run'),
  skipReview: args.includes('--skip-review'),
  test: args.includes('--test'),
};
const countIdx = args.indexOf('--count');
if (countIdx !== -1 && args[countIdx + 1]) {
  flags.count = parseInt(args[countIdx + 1], 10);
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
}

async function saveCandidateBundle(concept, selectedImages, allImages) {
  const ts = timestamp();
  const dirName = `${ts}_${concept.base.name_en}`;
  const candidateDir = resolve(__dirname, CONFIG.CANDIDATES_DIR, dirName);
  await mkdir(candidateDir, { recursive: true });
  await mkdir(resolve(candidateDir, 'selected'), { recursive: true });
  await mkdir(resolve(candidateDir, 'all_images'), { recursive: true });

  // 1. 컨셉 JSON (스킬 포함) 저장
  await writeFile(
    resolve(candidateDir, 'concept.json'),
    JSON.stringify(concept, null, 2),
    'utf-8'
  );

  // 2. 선택된 이미지를 selected/ 에 복사
  for (const { form, winner } of selectedImages) {
    if (!winner) continue;
    const filename = `${form.type}_${form.name_en}.png`;
    await copyFile(winner.path, resolve(candidateDir, 'selected', filename));
  }

  // 3. 전체 이미지를 all_images/ 에 복사 (비교용)
  for (const { form, result } of allImages) {
    for (const img of result.images) {
      const filename = `${form.type}_${form.name_en}_${img.index}.png`;
      await copyFile(img.path, resolve(candidateDir, 'all_images', filename));
    }
  }

  // 4. 요약 README 생성
  const readme = generateReadme(concept, selectedImages);
  await writeFile(resolve(candidateDir, 'README.md'), readme, 'utf-8');

  console.log(`[Candidate] 후보 저장 완료: candidates/${dirName}/`);
  return dirName;
}

function generateReadme(concept, selectedImages) {
  const b = concept.base;
  let md = `# ${b.name_kr} (${b.name_en})\n\n`;
  md += `> ${b.desc_kr}\n\n`;
  md += `- 성격: ${b.personality}\n`;
  md += `- 감각: ${b.sensoryType.join(', ')}\n`;
  md += `- 공격력: ${b.attackPower} | 순화 임계: ${b.tamingThreshold} | 도주 임계: ${b.escapeThreshold}\n\n`;

  md += `## 퇴화 트리\n\n`;
  md += `\`\`\`\n`;
  md += `${b.name_kr} (적)\n`;
  for (const d1 of concept.devolutions_1) {
    md += `  └─ ${d1.name_kr} (아군, HP:${d1.hp})\n`;
    if (d1.actions) {
      for (const a of d1.actions) {
        md += `      [${a.category}] ${a.name} (${a.axis}) pow:${a.power} esc:${a.escapeRisk} pp:${a.pp}\n`;
      }
    }
    const children = concept.devolutions_2.filter(d2 => d2.parent === d1.name_en);
    for (const d2 of children) {
      md += `      └─ ${d2.name_kr}\n`;
    }
  }
  md += `\`\`\`\n\n`;

  md += `## 선택된 이미지\n\n`;
  md += `\`selected/\` 폴더에서 확인\n\n`;
  md += `## 전체 후보 이미지\n\n`;
  md += `\`all_images/\` 폴더에서 비교 가능\n\n`;

  md += `## 적 반응\n\n`;
  if (b.reactions) {
    for (const [key, val] of Object.entries(b.reactions)) {
      md += `- **${key}**: ${val}\n`;
    }
  }

  md += `\n---\n생성일: ${new Date().toISOString()}\n`;
  return md;
}

async function runPipeline() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║     Monster Generation Pipeline v2                  ║');
  console.log('║     (후보 폴더 시스템 + 스킬 포함)                  ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Model:    ${CONFIG.TEXT_MODEL.padEnd(40)}║`);
  console.log(`║  ComfyUI:  ${CONFIG.COMFYUI_URL.padEnd(40)}║`);
  console.log(`║  Images:   ${String(CONFIG.IMAGES_PER_CONCEPT + '/form').padEnd(40)}║`);
  console.log(`║  Count:    ${String(flags.count).padEnd(40)}║`);
  console.log(`║  Mode:     ${(flags.dryRun ? 'dry-run' : flags.test ? 'test' : 'full').padEnd(40)}║`);
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log();

  await mkdir(resolve(__dirname, CONFIG.TEMP_DIR), { recursive: true });
  await mkdir(resolve(__dirname, CONFIG.CANDIDATES_DIR), { recursive: true });

  const results = [];

  for (let m = 0; m < flags.count; m++) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  몬스터 ${m + 1}/${flags.count} 생성 시작`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      // ── Step 1: 컨셉+스킬 생성 ──
      const { concept, allForms } = await generateMonsterConcept();

      if (flags.dryRun) {
        // dry-run에서도 candidates에 컨셉 저장
        const ts = timestamp();
        const dirName = `${ts}_${concept.base.name_en}`;
        const candidateDir = resolve(__dirname, CONFIG.CANDIDATES_DIR, dirName);
        await mkdir(candidateDir, { recursive: true });
        await writeFile(resolve(candidateDir, 'concept.json'), JSON.stringify(concept, null, 2), 'utf-8');
        const readme = generateReadme(concept, []);
        await writeFile(resolve(candidateDir, 'README.md'), readme, 'utf-8');
        console.log(`[Dry Run] 컨셉 저장: candidates/${dirName}/`);
        results.push({ concept, status: 'dry-run', dir: dirName });
        continue;
      }

      // ── Step 2: 이미지 생성 ──
      const formsToProcess = flags.test ? allForms.slice(0, 2) : allForms;
      console.log(`\n[Pipeline] ${formsToProcess.length}개 형태 이미지 생성 시작...${flags.test ? ' (테스트)' : ''}`);

      const allImageResults = [];
      for (const form of formsToProcess) {
        const result = await generateImages(form);
        allImageResults.push({ form, result });
      }

      // ── Step 3: 이미지 심사 ──
      console.log(`\n[Pipeline] 이미지 심사 시작...`);
      const selectedImages = [];

      for (const { form, result } of allImageResults) {
        let winner;
        if (flags.skipReview) {
          winner = result.images[0] || null;
          if (winner) console.log(`[Skip Review] "${form.name_en}" 첫번째 이미지 선택`);
        } else {
          winner = await reviewAndSelectBest(result, concept);
        }
        selectedImages.push({ form, winner });
      }

      // ── Step 4: candidates/ 에 번들 저장 ──
      const dirName = await saveCandidateBundle(concept, selectedImages, allImageResults);

      results.push({ concept, status: 'complete', dir: dirName });
      console.log(`\n✓ ${concept.base.name_kr} → candidates/${dirName}/`);

    } catch (err) {
      console.error(`\n✗ 몬스터 ${m + 1} 생성 실패: ${err.message}`);
      console.error(err.stack);
      results.push({ status: 'error', error: err.message });
    }
  }

  // ── 최종 요약 ──
  console.log(`\n${'='.repeat(60)}`);
  console.log('  파이프라인 완료 요약');
  console.log(`${'='.repeat(60)}`);
  for (const r of results) {
    if (r.status === 'complete') {
      console.log(`  ✓ ${r.concept.base.name_kr} → candidates/${r.dir}/`);
    } else if (r.status === 'dry-run') {
      console.log(`  ~ ${r.concept.base.name_kr} (dry-run) → candidates/${r.dir}/`);
    } else {
      console.log(`  ✗ 에러: ${r.error}`);
    }
  }
  console.log(`\n후보 심사: node integrate.js --list`);
  console.log(`게임 통합: node integrate.js --pick <후보폴더명>\n`);
}

runPipeline().catch(err => {
  console.error('파이프라인 치명적 에러:', err);
  process.exit(1);
});
