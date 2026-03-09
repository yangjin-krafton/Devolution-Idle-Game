#!/usr/bin/env node
// 토너먼트 리뷰만 테스트
// 사용법: node test-review.js <temp 내 폴더명> [type]
// 예: node test-review.js magma_basilisk base

import { reviewAndSelectBest } from './review-agent.js';
import { readdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { CONFIG } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const folderName = args[0] || 'magma_basilisk';
const type = args[1] || 'base';

async function main() {
  const imgDir = resolve(__dirname, CONFIG.TEMP_DIR, folderName);
  const files = (await readdir(imgDir)).filter(f => f.endsWith('.png')).sort();

  console.log(`[Test Review] ${folderName} (${type}) — ${files.length}장`);
  console.log(`  이미지: ${files.join(', ')}\n`);

  const images = files.map((f, i) => ({
    index: i,
    path: resolve(imgDir, f),
    filename: f,
  }));

  const formResult = { name_en: folderName, type, images };
  const winner = await reviewAndSelectBest(formResult, {});

  console.log(`\n=============================`);
  console.log(`최종 승자: 이미지 ${winner.index} (${winner.filename})`);
  console.log(`=============================`);
}

main().catch(err => {
  console.error('에러:', err.message);
  process.exit(1);
});
