#!/usr/bin/env node
// ============================================================
// Monster Integration Tool — selected 이미지를 게임 에셋으로 통합
// ============================================================
//
// 현재 구조:
//   candidates/<폴더>/selected/ → src/asset/monsters/ 이미지 복사
//   src/data/monsters/XX_name.js → img 경로 업데이트
//
// 사용법:
//   node integrate.js --list                # 후보 목록 + 통합 상태
//   node integrate.js --show <폴더명>        # 후보 상세 + 이미지 매핑 미리보기
//   node integrate.js --apply <폴더명>       # 이미지 복사 + JS 파일 img 경로 업데이트
//   node integrate.js --apply-all           # 전체 후보 일괄 통합
//   node integrate.js --dry-run <폴더명>     # 변경 없이 매핑만 출력
// ============================================================

import { CONFIG } from './config.js';
import { readdir, readFile, copyFile, writeFile, stat, mkdir, access } from 'fs/promises';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CANDIDATES_DIR = resolve(__dirname, CONFIG.CANDIDATES_DIR);
const MONSTERS_DIR = resolve(__dirname, CONFIG.OUTPUT_DIR);
const DATA_DIR = resolve(__dirname, '../../src/data/monsters');

const args = process.argv.slice(2);

// ---- Utilities ----

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function getCandidateDirs() {
  try {
    const entries = await readdir(CANDIDATES_DIR);
    const dirs = [];
    for (const d of entries.sort()) {
      const s = await stat(resolve(CANDIDATES_DIR, d));
      if (s.isDirectory()) dirs.push(d);
    }
    return dirs;
  } catch {
    return [];
  }
}

async function loadJson(p) {
  try { return JSON.parse(await readFile(p, 'utf-8')); } catch { return null; }
}

// Parse candidate dir name → monster ID and data file
// e.g. "01_howl_wolf" → { num: "01", monsterId: "howl_wolf", dataFile: "01_howl_wolf.js" }
function parseDirName(dirName) {
  const match = dirName.match(/^(\d+)_(.+)$/);
  if (!match) return null;
  return { num: match[1], monsterId: match[2], dataFile: `${dirName}.js` };
}

// Build image mapping: selected file → target asset filename
function buildImageMap(dirName, selectedFiles) {
  const info = parseDirName(dirName);
  if (!info) return [];

  const mapping = [];

  for (const file of selectedFiles) {
    let targetName = null;

    if (file.startsWith('base_')) {
      // base_howl_wolf.png → howl_wolf_wild.png
      targetName = `${info.monsterId}_wild.png`;
    } else {
      const d1Match = file.match(/^devo1_(\d+)_(.+)\.png$/);
      if (d1Match) {
        // devo1_0_moon_howler.png → howl_wolf_d1_0.png
        targetName = `${info.monsterId}_d1_${d1Match[1]}.png`;
      }

      const d2Match = file.match(/^devo2_(\d+)_(\d+)_(.+)\.png$/);
      if (d2Match) {
        // devo2_0_0_howl_pup.png → howl_wolf_d2_0.png (flat index = parentIdx * 2 + sibIdx)
        const parentIdx = parseInt(d2Match[1]);
        const sibIdx = parseInt(d2Match[2]);
        const flatIdx = parentIdx * 2 + sibIdx;
        targetName = `${info.monsterId}_d2_${flatIdx}.png`;
      }
    }

    if (targetName) {
      mapping.push({ source: file, target: targetName });
    }
  }

  return mapping;
}

// Update the monster JS file to use real image paths
async function updateMonsterJs(dirName, imageMap) {
  const info = parseDirName(dirName);
  if (!info) return false;

  const jsPath = resolve(DATA_DIR, info.dataFile);
  if (!await exists(jsPath)) {
    console.log(`  [Skip] 데이터 파일 없음: ${info.dataFile}`);
    return false;
  }

  let code = await readFile(jsPath, 'utf-8');
  const originalCode = code;

  // Build lookup: role → [allyImg, devolvedImg] for devo1
  // Build lookup for wild img
  const wildImg = imageMap.find(m => m.target.endsWith('_wild.png'));
  const d1Imgs = imageMap.filter(m => m.target.includes('_d1_'));
  const d2Imgs = imageMap.filter(m => m.target.includes('_d2_'));

  // 1. Update wild img
  if (wildImg) {
    // Replace the img value in wild section (handles both 'str' and IMG + 'str')
    code = code.replace(
      /(wild:\s*\{[^}]*?img:\s*)(IMG\s*\+\s*)?(['"][^'"]+['"]),/s,
      `$1IMG + '${wildImg.target}',`
    );
  }

  // 2. Update devo1 img — replace AIMG references with actual paths
  // Current pattern: img: AIMG.role[0], devolvedImg: AIMG.role[1],
  // We need to match each devo1 block by id and replace
  for (const d1 of d1Imgs) {
    const d1Match = d1.target.match(/_d1_(\d+)\.png$/);
    if (!d1Match) continue;
    const idx = parseInt(d1Match[1]);
    const d1Id = `${info.monsterId}_d1_${idx}`;

    // Find corresponding devo2 images for this devo1
    const d2ForThisD1 = d2Imgs.filter(d2 => {
      const d2m = d2.target.match(/_d2_(\d+)\.png$/);
      if (!d2m) return false;
      const flatIdx = parseInt(d2m[1]);
      return Math.floor(flatIdx / 2) === idx;
    });
    // First devo2 is the "devolved" form image
    const devolvedImg = d2ForThisD1.length > 0 ? d2ForThisD1[0].target : null;

    // Replace img in devo1 block — find by id string
    const idPattern = new RegExp(
      `(id:\\s*'${d1Id}'[^}]*?img:\\s*)([^,]+),([^}]*?devolvedImg:\\s*)([^,]+),`,
      's'
    );
    const match = code.match(idPattern);
    if (match) {
      const newImg = `IMG + '${d1.target}'`;
      const newDevImg = devolvedImg ? `IMG + '${devolvedImg}'` : match[4].trim();
      code = code.replace(idPattern, `$1${newImg},$3${newDevImg},`);
    }
  }

  // 3. Remove old AIMG constant if all devo1 are updated
  if (d1Imgs.length > 0) {
    // Check if AIMG is still referenced
    const aimgUsed = code.includes('AIMG.');
    if (!aimgUsed) {
      code = code.replace(/const AIMG = \{[^}]+\};\n?/s, '');
      // Also remove the comment line above if present
      code = code.replace(/\/\/ Image assignments by role \(temporary placeholders\)\n?/, '');
    }
  }

  if (code === originalCode) {
    console.log(`  [Skip] ${info.dataFile} — 변경 없음`);
    return false;
  }

  await writeFile(jsPath, code, 'utf-8');
  return true;
}

// ---- Commands ----

async function listCandidates() {
  const dirs = await getCandidateDirs();
  if (dirs.length === 0) {
    console.log('후보 폴더가 비어있습니다.');
    return;
  }

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║           Monster Candidates                     ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  for (const dir of dirs) {
    const info = parseDirName(dir);
    const roster = await loadJson(resolve(CANDIDATES_DIR, dir, 'roster.json'));
    const concept = await loadJson(resolve(CANDIDATES_DIR, dir, 'concept.json'));
    const data = roster || concept;

    const w = roster?.wild || concept?.base || {};
    const name_kr = w.name_kr || dir;
    const name_en = w.name_en || '';

    // Count selected images
    let selectedCount = 0;
    try {
      selectedCount = (await readdir(resolve(CANDIDATES_DIR, dir, 'selected'))).filter(f => f.endsWith('.png')).length;
    } catch {}

    // Check if data file exists
    const hasDataFile = info ? await exists(resolve(DATA_DIR, info.dataFile)) : false;

    // Check if assets already integrated
    let integratedCount = 0;
    if (info && selectedCount > 0) {
      try {
        const selected = (await readdir(resolve(CANDIDATES_DIR, dir, 'selected'))).filter(f => f.endsWith('.png'));
        const mapping = buildImageMap(dir, selected);
        for (const m of mapping) {
          if (await exists(resolve(MONSTERS_DIR, m.target))) integratedCount++;
        }
      } catch {}
    }

    const status = selectedCount === 0 ? '이미지 없음'
      : integratedCount === selectedCount ? '통합 완료'
      : integratedCount > 0 ? `일부 통합 (${integratedCount}/${selectedCount})`
      : '미통합';

    const devo1Names = roster?.devo1?.map(d => `${d.name_kr}[${d.role}]`).join(', ')
      || concept?.devolutions_1?.map(d => `${d.name_kr}[${d.role || '?'}]`).join(', ')
      || '?';

    console.log(`  ${dir}  [${status}]`);
    console.log(`     ${name_kr} (${name_en}) — ${w.desc_kr || ''}`);
    console.log(`     성격: ${w.personality || '?'} | 감각: ${(w.sensoryType || []).join('+')} | 선택 이미지: ${selectedCount}장`);
    console.log(`     퇴화1: ${devo1Names}`);
    console.log(`     data.js: ${hasDataFile ? info.dataFile : '없음'}`);
    console.log();
  }
}

async function showCandidate(dirName) {
  const info = parseDirName(dirName);
  const roster = await loadJson(resolve(CANDIDATES_DIR, dirName, 'roster.json'));
  const concept = await loadJson(resolve(CANDIDATES_DIR, dirName, 'concept.json'));

  if (!roster && !concept) {
    console.error(`데이터 없음: ${dirName}`);
    return;
  }

  const w = roster?.wild || concept?.base || {};
  console.log('\n' + '='.repeat(60));
  console.log(`  ${w.name_kr || dirName} (${w.name_en || ''})`);
  console.log('='.repeat(60));

  // Wild form
  console.log(`\n[야생형]`);
  console.log(`  ${w.name_kr} (${w.name_en})`);
  console.log(`  ${w.desc_kr || ''}`);
  console.log(`  성격: ${w.personality} | 감각: ${(w.sensoryType || []).join(', ')}`);
  if (w.hp != null) console.log(`  HP: ${w.hp} | 공격력: ${w.attackPower || '?'}`);

  // Devo1
  const devo1List = roster?.devo1 || concept?.devolutions_1 || [];
  for (let i = 0; i < devo1List.length; i++) {
    const d = devo1List[i];
    console.log(`\n[퇴화1-${i}: ${d.name_kr} (${d.name_en || ''})] — ${d.role || '?'}`);
    console.log(`  HP: ${d.hp || '?'} | ${d.desc_kr || ''}`);

    // Devo2
    const devo2List = d.devo2 || concept?.devolutions_2?.filter(d2 => d2.parent === d.name_en) || [];
    for (let j = 0; j < devo2List.length; j++) {
      const d2 = devo2List[j];
      console.log(`    └─ ${d2.name_kr} (${d2.name_en || ''}) — ${d2.role || '?'}: ${d2.desc_kr || ''}`);
    }
  }

  // Image mapping preview
  let selectedFiles = [];
  try {
    selectedFiles = (await readdir(resolve(CANDIDATES_DIR, dirName, 'selected'))).filter(f => f.endsWith('.png')).sort();
  } catch {}

  if (selectedFiles.length > 0) {
    const mapping = buildImageMap(dirName, selectedFiles);
    console.log(`\n[이미지 매핑] (${selectedFiles.length}장)`);
    for (const m of mapping) {
      const targetExists = await exists(resolve(MONSTERS_DIR, m.target));
      const status = targetExists ? '(이미 존재)' : '';
      console.log(`  ${m.source} → ${m.target} ${status}`);
    }
  }

  // Data file status
  if (info) {
    const jsExists = await exists(resolve(DATA_DIR, info.dataFile));
    console.log(`\n[데이터 파일] ${info.dataFile} — ${jsExists ? '존재' : '없음'}`);
  }

  console.log(`\n통합 실행: node integrate.js --apply ${dirName}`);
  console.log(`미리보기:  node integrate.js --dry-run ${dirName}\n`);
}

async function applyCandidate(dirName, dryRun = false) {
  const info = parseDirName(dirName);
  if (!info) {
    console.error(`잘못된 폴더명: ${dirName}`);
    return false;
  }

  const selectedDir = resolve(CANDIDATES_DIR, dirName, 'selected');
  let selectedFiles;
  try {
    selectedFiles = (await readdir(selectedDir)).filter(f => f.endsWith('.png')).sort();
  } catch {
    console.error(`selected 폴더 없음: ${dirName}`);
    return false;
  }

  if (selectedFiles.length === 0) {
    console.error(`선택된 이미지 없음: ${dirName}`);
    return false;
  }

  const mapping = buildImageMap(dirName, selectedFiles);
  const prefix = dryRun ? '[DRY-RUN] ' : '';

  console.log(`\n${prefix}${dirName} 통합 시작 (${selectedFiles.length}장)\n`);

  // 1. Copy images
  if (!dryRun) await mkdir(MONSTERS_DIR, { recursive: true });

  let copied = 0;
  for (const m of mapping) {
    const src = resolve(selectedDir, m.source);
    const dst = resolve(MONSTERS_DIR, m.target);
    console.log(`  ${prefix}[Copy] ${m.source} → ${m.target}`);
    if (!dryRun) {
      await copyFile(src, dst);
      copied++;
    }
  }

  // 2. Update monster JS file
  const jsPath = resolve(DATA_DIR, info.dataFile);
  if (await exists(jsPath)) {
    if (dryRun) {
      console.log(`\n  ${prefix}[JS] ${info.dataFile} — img 경로 업데이트 예정`);
    } else {
      const updated = await updateMonsterJs(dirName, mapping);
      if (updated) {
        console.log(`\n  [JS] ${info.dataFile} — img 경로 업데이트 완료`);
      }
    }
  } else {
    console.log(`\n  [Skip] ${info.dataFile} — 데이터 파일 없음`);
  }

  console.log(`\n${prefix}완료: ${copied}장 복사${dryRun ? ' (dry-run, 실제 변경 없음)' : ''}\n`);
  return true;
}

async function applyAll() {
  const dirs = await getCandidateDirs();
  let success = 0;
  let skip = 0;

  for (const dir of dirs) {
    try {
      const selectedDir = resolve(CANDIDATES_DIR, dir, 'selected');
      const files = (await readdir(selectedDir)).filter(f => f.endsWith('.png'));
      if (files.length === 0) { skip++; continue; }
      const ok = await applyCandidate(dir);
      if (ok) success++;
    } catch {
      skip++;
    }
  }

  console.log(`\n전체 결과: ${success}개 통합, ${skip}개 스킵 (총 ${dirs.length}개)\n`);
}

// ---- Main ----
async function main() {
  if (args.includes('--list') || args.length === 0) {
    await listCandidates();
  } else if (args.includes('--show')) {
    const idx = args.indexOf('--show');
    const dirName = args[idx + 1];
    if (!dirName) { console.error('사용법: node integrate.js --show <폴더명>'); return; }
    await showCandidate(dirName);
  } else if (args.includes('--dry-run')) {
    const idx = args.indexOf('--dry-run');
    const dirName = args[idx + 1];
    if (!dirName) { console.error('사용법: node integrate.js --dry-run <폴더명>'); return; }
    await applyCandidate(dirName, true);
  } else if (args.includes('--apply-all')) {
    await applyAll();
  } else if (args.includes('--apply')) {
    const idx = args.indexOf('--apply');
    const dirName = args[idx + 1];
    if (!dirName) { console.error('사용법: node integrate.js --apply <폴더명>'); return; }
    await applyCandidate(dirName);
  } else {
    console.log('Monster Integration Tool\n');
    console.log('사용법:');
    console.log('  node integrate.js --list               후보 목록 + 통합 상태');
    console.log('  node integrate.js --show <폴더명>       후보 상세 + 이미지 매핑 미리보기');
    console.log('  node integrate.js --dry-run <폴더명>    변경 없이 매핑만 출력');
    console.log('  node integrate.js --apply <폴더명>      이미지 복사 + JS img 경로 업데이트');
    console.log('  node integrate.js --apply-all          전체 후보 일괄 통합');
  }
}

main().catch(err => {
  console.error('에러:', err.message);
  process.exit(1);
});
