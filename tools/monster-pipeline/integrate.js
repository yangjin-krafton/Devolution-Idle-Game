#!/usr/bin/env node
// ============================================================
// Monster Integration Tool — 후보 심사 + 게임 통합
// ============================================================
//
// 사용법:
//   node integrate.js --list              # 후보 목록 조회
//   node integrate.js --show <폴더명>      # 후보 상세 보기
//   node integrate.js --pick <폴더명>      # LLM으로 data.js 통합 코드 생성
//   node integrate.js --pick <폴더명> --apply  # 실제로 data.js + 에셋 적용
// ============================================================

import { CONFIG } from './config.js';
import { readdir, readFile, copyFile, writeFile, stat, mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CANDIDATES_DIR = resolve(__dirname, CONFIG.CANDIDATES_DIR);
const DATA_JS_PATH = resolve(__dirname, '../../src/data.js');
const MONSTERS_DIR = resolve(__dirname, CONFIG.OUTPUT_DIR);

const args = process.argv.slice(2);

async function listCandidates() {
  let dirs;
  try {
    dirs = await readdir(CANDIDATES_DIR);
  } catch {
    console.log('후보 폴더가 비어있습니다. 먼저 pipeline.js를 실행하세요.');
    return;
  }

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║           Monster Candidates                     ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  for (const dir of dirs.sort()) {
    try {
      // roster.json 또는 concept.json 에서 정보 읽기
      let name_kr, name_en, desc_kr, personality, sensoryType, devo1Names;
      const rosterPath = resolve(CANDIDATES_DIR, dir, 'roster.json');
      const conceptPath = resolve(CANDIDATES_DIR, dir, 'concept.json');

      try {
        const roster = JSON.parse(await readFile(rosterPath, 'utf-8'));
        const w = roster.wild;
        name_kr = w.name_kr; name_en = w.name_en; desc_kr = w.desc_kr;
        personality = w.personality; sensoryType = w.sensoryType;
        devo1Names = roster.devo1?.map(d => `${d.name_kr}[${d.role}]`).join(', ') || '?';
      } catch {
        const concept = JSON.parse(await readFile(conceptPath, 'utf-8'));
        const b = concept.base;
        name_kr = b.name_kr; name_en = b.name_en; desc_kr = b.desc_kr;
        personality = b.personality; sensoryType = b.sensoryType;
        devo1Names = concept.devolutions_1?.map(d => d.name_kr).join(', ') || '?';
      }

      const selectedDir = resolve(CANDIDATES_DIR, dir, 'selected');
      let imageCount = 0;
      try { imageCount = (await readdir(selectedDir)).length; } catch {}

      console.log(`  📁 ${dir}`);
      console.log(`     ${name_kr} (${name_en}) — ${desc_kr}`);
      console.log(`     성격: ${personality} | 감각: ${sensoryType?.join('+')} | 이미지: ${imageCount}장`);
      console.log(`     퇴화1: ${devo1Names}`);
      console.log();
    } catch {
      console.log(`  📁 ${dir} (데이터 없음)`);
      console.log();
    }
  }
}

async function showCandidate(dirName) {
  const conceptPath = resolve(CANDIDATES_DIR, dirName, 'concept.json');
  const concept = JSON.parse(await readFile(conceptPath, 'utf-8'));

  console.log('\n' + '='.repeat(60));
  console.log(`  ${concept.base.name_kr} (${concept.base.name_en})`);
  console.log('='.repeat(60));

  const b = concept.base;
  console.log(`\n[적 몬스터 - 기본형]`);
  console.log(`  이름: ${b.name_kr} (${b.name_en})`);
  console.log(`  설명: ${b.desc_kr}`);
  console.log(`  성격: ${b.personality} | 감각: ${b.sensoryType?.join(', ')}`);
  console.log(`  공격력: ${b.attackPower} | 순화 임계: ${b.tamingThreshold} | 도주 임계: ${b.escapeThreshold}`);

  if (b.reactions) {
    console.log(`  반응:`);
    for (const [key, val] of Object.entries(b.reactions)) {
      console.log(`    ${key}: ${val}`);
    }
  }

  for (let i = 0; i < concept.devolutions_1.length; i++) {
    const d = concept.devolutions_1[i];
    console.log(`\n[퇴화1-${String.fromCharCode(65 + i)}: ${d.name_kr} (${d.name_en})]`);
    console.log(`  HP: ${d.hp} | 스탯: G${d.stats?.gentleness} E${d.stats?.empathy} R${d.stats?.resilience} A${d.stats?.agility}`);
    console.log(`  퇴화명: ${d.devolvedName} — ${d.devolvedDesc}`);
    if (d.actions) {
      console.log(`  스킬:`);
      for (const a of d.actions) {
        const fx = a.effects?.length > 0 ? ` [${a.effects.map(e => `${e.type}:${(e.chance * 100).toFixed(0)}%`).join(',')}]` : '';
        const heal = a.healAmount ? ` heal:${a.healAmount} def:${a.defenseBoost}` : '';
        console.log(`    [${a.category}] ${a.name} (${a.axis}) pow:${a.power} esc:${a.escapeRisk} pp:${a.pp}/${a.maxPp}${heal}${fx}`);
        console.log(`      → ${a.log}`);
      }
    }

    const children = concept.devolutions_2.filter(d2 => d2.parent === d.name_en);
    for (const d2 of children) {
      console.log(`    └─ ${d2.name_kr} (${d2.name_en}): ${d2.desc_kr}`);
    }
  }

  // 이미지 목록
  const selectedDir = resolve(CANDIDATES_DIR, dirName, 'selected');
  try {
    const images = await readdir(selectedDir);
    console.log(`\n[선택된 이미지] (${images.length}장)`);
    for (const img of images) console.log(`  ${img}`);
  } catch {}

  const allDir = resolve(CANDIDATES_DIR, dirName, 'all_images');
  try {
    const images = await readdir(allDir);
    console.log(`\n[전체 후보 이미지] (${images.length}장)`);
    for (const img of images) console.log(`  ${img}`);
  } catch {}

  console.log(`\n이미지 확인: ${resolve(CANDIDATES_DIR, dirName, 'selected')}`);
  console.log(`통합 실행:   node integrate.js --pick ${dirName} --apply\n`);
}

async function generateIntegrationCode(concept) {
  console.log('[Integration] LLM으로 data.js 통합 코드 생성 중...');

  const currentDataJs = await readFile(DATA_JS_PATH, 'utf-8');
  const prompt = `You are integrating a new monster into the game's data.js file.

Current ENEMY_MONSTERS array ends before the closing ];
Current ALLY_MONSTERS array has 6 monsters.

New monster concept:
${JSON.stringify(concept, null, 2)}

Generate TWO code blocks:

1. A new ENEMY_MONSTERS entry for the base form (copy the exact style from existing entries)
2. A new ALLY_MONSTERS entry for the FIRST devolution_1 form (the player picks which variant to use)

IMPORTANT:
- Match the exact code style of existing entries in data.js
- Include img paths as: 'asset/monsters/enemy_{name_en}.png' for enemy, 'asset/monsters/{name_en}_ally.png' and 'asset/monsters/{name_en}_devolved.png' for ally
- xpThreshold should be 5
- inEgg: false, devolved: false initially
- Include all 3 actions for ally

Respond with ONLY the JavaScript code blocks, ready to paste.`;

  const res = await fetch(`${CONFIG.LM_STUDIO_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CONFIG.TEXT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  const data = await res.json();
  return data.choices[0].message.content;
}

async function pickCandidate(dirName, apply) {
  const conceptPath = resolve(CANDIDATES_DIR, dirName, 'concept.json');
  const concept = JSON.parse(await readFile(conceptPath, 'utf-8'));

  console.log(`\n[Pick] ${concept.base.name_kr} (${concept.base.name_en}) 선택됨`);

  // LLM으로 통합 코드 생성
  const code = await generateIntegrationCode(concept);

  // 통합 코드 저장
  const codePath = resolve(CANDIDATES_DIR, dirName, 'integration_code.js');
  await writeFile(codePath, code, 'utf-8');
  console.log(`[Pick] 통합 코드 저장: ${codePath}`);

  if (!apply) {
    console.log('\n생성된 코드를 검토한 후 --apply 플래그로 실제 적용하세요:');
    console.log(`  node integrate.js --pick ${dirName} --apply\n`);
    console.log('--- 생성된 통합 코드 ---');
    console.log(code);
    return;
  }

  // --apply: 에셋 복사
  console.log('\n[Apply] 에셋 복사 중...');
  await mkdir(MONSTERS_DIR, { recursive: true });

  const selectedDir = resolve(CANDIDATES_DIR, dirName, 'selected');
  try {
    const images = await readdir(selectedDir);
    for (const img of images) {
      // 파일명 변환: type_name.png → 적절한 게임 에셋명
      let destName = img;
      if (img.startsWith('base_')) {
        destName = `enemy_${concept.base.name_en}.png`;
      } else if (img.startsWith('devo1_')) {
        // devo1_0_name.png → name_ally.png
        const nameEn = img.replace(/^devo1_\d+_/, '').replace('.png', '');
        destName = `${nameEn}_ally.png`;
      } else if (img.startsWith('devo2_')) {
        const nameEn = img.replace(/^devo2_\d+_/, '').replace('.png', '');
        destName = `${nameEn}_devolved.png`;
      }
      await copyFile(resolve(selectedDir, img), resolve(MONSTERS_DIR, destName));
      console.log(`  [Copy] ${img} → ${destName}`);
    }
  } catch (err) {
    console.warn(`  이미지 복사 실패: ${err.message}`);
  }

  console.log('\n[Apply] 에셋 복사 완료!');
  console.log('\n주의: data.js는 자동 수정하지 않습니다.');
  console.log('아래 파일의 코드를 검토 후 수동으로 data.js에 붙여넣으세요:');
  console.log(`  ${codePath}\n`);
}

// ── Main ──
async function main() {
  if (args.includes('--list') || args.length === 0) {
    await listCandidates();
  } else if (args.includes('--show')) {
    const idx = args.indexOf('--show');
    const dirName = args[idx + 1];
    if (!dirName) { console.error('사용법: node integrate.js --show <폴더명>'); return; }
    await showCandidate(dirName);
  } else if (args.includes('--pick')) {
    const idx = args.indexOf('--pick');
    const dirName = args[idx + 1];
    if (!dirName) { console.error('사용법: node integrate.js --pick <폴더명>'); return; }
    await pickCandidate(dirName, args.includes('--apply'));
  } else {
    console.log('사용법:');
    console.log('  node integrate.js --list              후보 목록');
    console.log('  node integrate.js --show <폴더명>      후보 상세');
    console.log('  node integrate.js --pick <폴더명>      통합 코드 생성');
    console.log('  node integrate.js --pick <폴더명> --apply  에셋 복사 + 코드 생성');
  }
}

main().catch(err => {
  console.error('에러:', err.message);
  process.exit(1);
});
