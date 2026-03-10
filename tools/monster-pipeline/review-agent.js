// ============================================================
// Image Review Agent — Vision 모델로 최적 이미지 선택
// 토너먼트 방식: 1:1 비교로 최종 승자 결정
// ============================================================

import { CONFIG } from './config.js';
import { readFile } from 'fs/promises';
import sharp from 'sharp';

const REVIEW_SIZE = 128; // 심사용 다운스케일 크기

async function downsizeImage(buffer) {
  return sharp(buffer).resize(REVIEW_SIZE, REVIEW_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
}

async function callVision(messages) {
  const res = await fetch(`${CONFIG.LM_STUDIO_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CONFIG.VISION_MODEL,
      messages,
      temperature: 0.1,
      max_tokens: 30,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'pick_winner',
          strict: true,
          schema: {
            type: 'object',
            properties: { w: { type: 'integer', enum: [1, 2] } },
            required: ['w'],
            additionalProperties: false,
          },
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`Vision API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

function imageToBase64(buffer) {
  return buffer.toString('base64');
}

// 1:1 비교로 승자 결정
async function compareTwo(imgA, imgB, type, name_en, matchLabel) {
  const bufA = await downsizeImage(await readFile(imgA.path));
  const bufB = await downsizeImage(await readFile(imgB.path));

  // A와 B 순서를 랜덤으로 섞어서 위치 편향 방지
  const swapped = Math.random() > 0.5;
  const first = swapped ? bufB : bufA;
  const second = swapped ? bufA : bufB;
  const styleCriteria = type === 'base' ? 'darker, scarier, more menacing'
    : type.startsWith('devo1') ? 'stronger, cooler, more battle-ready'
    : 'cuter, rounder, more adorable';

  const prompt = [
    `Compare two "${name_en}" sprites. Pick the better one.`,
    `Quality criteria (in priority order):`,
    `1. NOT cropped/cut off — full body visible, not extending beyond canvas edges`,
    `2. Clean transparent background — no leftover artifacts or colored bg remnants`,
    `3. No visual glitches — no broken parts, no weird seams or distortions`,
    `4. Facing LEFT — monster should be looking/facing toward the left side`,
    `5. Style fit: ${styleCriteria}`,
    `Reply ONLY: {"w":1} or {"w":2}`,
  ].join('\n');

  const content = [
    {
      type: 'text',
      text: prompt,
    },
    { type: 'image_url', image_url: { url: `data:image/png;base64,${imageToBase64(first)}` } },
    { type: 'image_url', image_url: { url: `data:image/png;base64,${imageToBase64(second)}` } },
  ];

  try {
    const raw = await callVision([{ role: 'user', content }]);

    const cleaned = raw
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/<\/?think>/g, '')
      .replace(/<\/?no_think>/g, '')
      .trim();

    // JSON에서 승자 추출: {"w":1} or {"w":2} or {"winner":1}
    const jsonMatch = cleaned.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const result = JSON.parse(jsonMatch[0]);
        const pickedNum = result.w ?? result.winner;
        if (pickedNum === 1 || pickedNum === 2) {
          const winner = pickedNum === 1 ? (swapped ? imgB : imgA) : (swapped ? imgA : imgB);
          console.log(`    ${matchLabel}: img${imgA.index} vs img${imgB.index} → img${winner.index}`);
          return winner;
        }
      } catch {}
    }

    // 폴백: 숫자 추출
    const numMatch = cleaned.match(/[12]/);
    if (numMatch) {
      const pickedNum = parseInt(numMatch[0]);
      const winner = pickedNum === 1 ? (swapped ? imgB : imgA) : (swapped ? imgA : imgB);
      console.log(`    ${matchLabel}: img${imgA.index} vs img${imgB.index} → img${winner.index} (fallback)`);
      return winner;
    }

  } catch (err) {
    console.error(`    ${matchLabel} 에러: ${err.message}`);
  }

  // 최종 폴백: 랜덤
  const fallback = Math.random() > 0.5 ? imgA : imgB;
  console.log(`    ${matchLabel}: 파싱실패 → 랜덤 img${fallback.index}`);
  return fallback;
}

export async function reviewAndSelectBest(formResult, concept) {
  const { name_en, type, images } = formResult;

  if (images.length === 0) {
    console.error(`[Review Agent] "${name_en}" 이미지가 없어 심사 불가`);
    return null;
  }

  if (images.length === 1) {
    console.log(`[Review Agent] "${name_en}" 이미지 1장뿐, 자동 선택`);
    return images[0];
  }

  console.log(`[Review Agent] "${name_en}" ${images.length}장 토너먼트 심사 시작...`);

  // 토너먼트: 순차적 1:1 비교
  let survivors = [...images];
  let round = 1;

  while (survivors.length > 1) {
    console.log(`  [라운드 ${round}] ${survivors.length}장 → ${Math.ceil(survivors.length / 2)}장`);
    const nextRound = [];

    for (let i = 0; i < survivors.length; i += 2) {
      if (i + 1 < survivors.length) {
        const winner = await compareTwo(
          survivors[i], survivors[i + 1],
          type, name_en,
          `R${round}M${Math.floor(i / 2) + 1}`
        );
        nextRound.push(winner);
      } else {
        // 홀수면 부전승
        console.log(`    R${round}부전승: 이미지${survivors[i].index}`);
        nextRound.push(survivors[i]);
      }
    }

    survivors = nextRound;
    round++;
  }

  const winner = survivors[0];
  console.log(`[Review Agent] "${name_en}" 최종 승자: 이미지 ${winner.index}`);
  return winner;
}
