// ============================================================
// Image Review Agent — Vision 모델로 최적 이미지 선택
// 토너먼트 방식: 1:1 비교로 최종 승자 결정
// ============================================================

import { CONFIG } from './config.js';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function callVision(messages) {
  const res = await fetch(`${CONFIG.LM_STUDIO_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CONFIG.VISION_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 512,
    }),
  });
  if (!res.ok) throw new Error(`Vision API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

function imageToBase64(buffer) {
  return buffer.toString('base64');
}

function getReviewCriteria(type) {
  if (type === 'base') {
    return `[야생 원본] 더 기괴하고, 무섭고, 위협적이고, 다크 판타지 느낌이 강한 쪽을 선택하세요. 날카로운 디테일, 어두운 색감, 공포스러운 분위기가 더 좋은 쪽이 승자입니다.`;
  }
  if (type.startsWith('devo1')) {
    return `[1단 퇴화 아군] 더 강력하고, 멋지고, 전투적인 쪽을 선택하세요. 전투 파트너로 믿음직하고 디지몬 챔피언급 느낌이 더 강한 쪽이 승자입니다.`;
  }
  return `[2단 퇴화 최종] 더 귀엽고, 깜찍하고, 사랑스러운 쪽을 선택하세요. 둥글둥글하고 부드럽고 베이비 포켓몬 같은 느낌이 더 강한 쪽이 승자입니다.`;
}

// 1:1 비교로 승자 결정
async function compareTwo(imgA, imgB, type, name_en, matchLabel) {
  const bufA = await readFile(imgA.path);
  const bufB = await readFile(imgB.path);

  // A와 B 순서를 랜덤으로 섞어서 위치 편향 방지
  const swapped = Math.random() > 0.5;
  const first = swapped ? bufB : bufA;
  const second = swapped ? bufA : bufB;
  const firstLabel = swapped ? 'B' : 'A';
  const secondLabel = swapped ? 'A' : 'B';

  const content = [
    {
      type: 'text',
      text: `게임 몬스터 스프라이트 1:1 비교 심사.

몬스터: ${name_en}
${getReviewCriteria(type)}

이미지 1과 이미지 2 중 하나만 선택하세요.
반드시 JSON으로만 응답: {"winner": 1 또는 2, "reason": "이유"}`,
    },
    { type: 'text', text: '\n--- 이미지 1 ---' },
    { type: 'image_url', image_url: { url: `data:image/png;base64,${imageToBase64(first)}` } },
    { type: 'text', text: '\n--- 이미지 2 ---' },
    { type: 'image_url', image_url: { url: `data:image/png;base64,${imageToBase64(second)}` } },
  ];

  try {
    const raw = await callVision([{ role: 'user', content }]);

    // 디버그 로그 저장
    const debugDir = resolve(__dirname, CONFIG.TEMP_DIR);
    await mkdir(debugDir, { recursive: true });
    await writeFile(
      resolve(debugDir, `review_debug_${name_en}_${matchLabel}.txt`),
      `Match: ${matchLabel}\nSwapped: ${swapped}\nRaw response:\n${raw}`,
      'utf-8'
    );

    const cleaned = raw
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/<\/?think>/g, '')
      .replace(/<\/?no_think>/g, '')
      .trim();

    const match = cleaned.match(/\{[\s\S]*?\}/);
    if (match) {
      const result = JSON.parse(match[0]);
      const pickedNum = result.winner; // 1 or 2

      // 순서 복원: swapped면 1=B,2=A / 아니면 1=A,2=B
      let winner;
      if (pickedNum === 1) {
        winner = swapped ? imgB : imgA;
      } else {
        winner = swapped ? imgA : imgB;
      }

      console.log(`    ${matchLabel}: 이미지${imgA.index} vs 이미지${imgB.index} → 승자: 이미지${winner.index} (${result.reason})`);
      return winner;
    }
  } catch (err) {
    console.error(`    ${matchLabel} 심사 에러: ${err.message}`);
  }

  // 파싱 실패 시 랜덤 선택 (편향 방지)
  const fallback = Math.random() > 0.5 ? imgA : imgB;
  console.log(`    ${matchLabel}: 파싱 실패 → 랜덤 선택: 이미지${fallback.index}`);
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
