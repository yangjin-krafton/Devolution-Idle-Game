// ============================================================
// Game Integration Agent — 최종 이미지를 게임 에셋으로 저장
// ============================================================

import { CONFIG } from './config.js';
import { copyFile, mkdir, writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function integrateToGame(concept, selectedImages) {
  const outputDir = resolve(__dirname, CONFIG.OUTPUT_DIR);
  await mkdir(outputDir, { recursive: true });

  console.log('[Integration Agent] 게임 에셋 저장 시작...');

  const assetMap = {};

  for (const { form, winner } of selectedImages) {
    if (!winner) {
      console.warn(`  [Skip] ${form.name_en} - 선택된 이미지 없음`);
      continue;
    }

    // 파일명 결정: 타입에 따라 prefix
    let filename;
    if (form.type === 'base') {
      filename = `enemy_${form.name_en}.png`;
    } else if (form.type.startsWith('devo1')) {
      filename = `${form.name_en}.png`;
    } else {
      filename = `${form.name_en}.png`;
    }

    const destPath = resolve(outputDir, filename);
    await copyFile(winner.path, destPath);

    assetMap[form.name_en] = {
      filename,
      path: `asset/monsters/${filename}`,
      name_kr: form.name_kr,
      type: form.type,
    };

    console.log(`  [Saved] ${filename} ← ${form.name_kr} (${form.type})`);
  }

  // 컨셉 메타데이터 저장
  const metaPath = resolve(outputDir, `${concept.base.name_en}_meta.json`);
  const meta = {
    generatedAt: new Date().toISOString(),
    base: {
      ...concept.base,
      asset: assetMap[concept.base.name_en] || null,
    },
    devolutions_1: concept.devolutions_1.map(d => ({
      ...d,
      asset: assetMap[d.name_en] || null,
    })),
    devolutions_2: concept.devolutions_2.map(d => ({
      ...d,
      asset: assetMap[d.name_en] || null,
    })),
  };

  await writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
  console.log(`[Integration Agent] 메타데이터 저장: ${metaPath}`);

  // data.js에 추가할 코드 스니펫 생성
  const snippet = generateDataSnippet(concept, assetMap);
  const snippetPath = resolve(__dirname, CONFIG.TEMP_DIR, `${concept.base.name_en}_data_snippet.js`);
  await writeFile(snippetPath, snippet, 'utf-8');
  console.log(`[Integration Agent] data.js 스니펫 저장: ${snippetPath}`);

  return { assetMap, meta, snippet };
}

function generateDataSnippet(concept, assetMap) {
  const b = concept.base;
  const asset = assetMap[b.name_en];

  return `// ============================================================
// Auto-generated monster: ${b.name_kr} (${b.name_en})
// Generated: ${new Date().toISOString()}
// ============================================================

// ENEMY_MONSTERS 배열에 추가:
{
  id: '${b.name_en}', name: '${b.name_kr}',
  img: '${asset?.path || `asset/monsters/enemy_${b.name_en}.png`}',
  desc: '${b.desc_kr}',
  attackPower: 5, tamingThreshold: 65, escapeThreshold: 80,
  sensoryType: ${JSON.stringify(b.sensoryType)}, personality: '${b.personality}',
  reactions: {
    sound_good: '', sound_bad: '',
    temp_good: '', temp_bad: '',
    smell_good: '', smell_bad: '',
    behav_good: '', behav_bad: '',
    attack: '', calm: '',
  },
},

// --- 퇴화 트리 ---
// Base: ${b.name_kr} (${b.name_en})
${concept.devolutions_1.map((d, i) => {
  const dAsset = assetMap[d.name_en];
  return `//   └─ 퇴화1-${String.fromCharCode(65 + i)}: ${d.name_kr} (${d.name_en}) → ${dAsset?.path || '?'}
${concept.devolutions_2.filter(d2 => d2.parent === d.name_en).map(d2 => {
  const d2Asset = assetMap[d2.name_en];
  return `//       └─ 퇴화2: ${d2.name_kr} (${d2.name_en}) → ${d2Asset?.path || '?'}`;
}).join('\n')}`;
}).join('\n')}
`;
}
