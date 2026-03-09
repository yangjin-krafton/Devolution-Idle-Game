// ============================================================
// Image Review Agent — Vision 모델로 최적 이미지 선택
// ============================================================

import { CONFIG } from './config.js';
import { readFile } from 'fs/promises';

async function callVision(messages) {
  const res = await fetch(`${CONFIG.LM_STUDIO_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CONFIG.VISION_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });
  if (!res.ok) throw new Error(`Vision API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

function imageToBase64(buffer) {
  return buffer.toString('base64');
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

  console.log(`[Review Agent] "${name_en}" ${images.length}장 심사 시작...`);

  // 이미지를 배치로 나눠서 비전 모델에 전송 (한번에 최대 5장)
  const batchSize = 5;
  const batchWinners = [];

  for (let batchStart = 0; batchStart < images.length; batchStart += batchSize) {
    const batch = images.slice(batchStart, batchStart + batchSize);

    const content = [
      {
        type: 'text',
        text: `당신은 게임 몬스터 스프라이트 심사관입니다.

아래 ${batch.length}장의 이미지를 심사해주세요.

몬스터 정보:
- 이름: ${name_en}
- 타입: ${type} (base=기본형, devo1=퇴화1, devo2=퇴화2)
${type.startsWith('devo') ? '- 퇴화된 형태일수록 더 작고 단순하고 귀여워야 합니다' : ''}

심사 기준:
1. 게임 스프라이트로 적합한가 (명확한 실루엣, 투명 배경)
2. 몬스터/크리처로 보이는가 (인간이 아닌 생물체)
3. 디자인이 매력적이고 기억에 남는가
4. 색감과 디테일이 적절한가
5. 포켓몬/크리처 수집 게임 스타일에 맞는가

반드시 아래 JSON 형식으로만 응답하세요:
{"winner": 이미지번호(0부터), "reason": "선택 이유 한줄"}`,
      },
    ];

    // 각 이미지를 base64로 추가
    for (let i = 0; i < batch.length; i++) {
      const imgBuffer = await readFile(batch[i].path);
      content.push({
        type: 'text',
        text: `\n--- 이미지 ${i} ---`,
      });
      content.push({
        type: 'image_url',
        image_url: {
          url: `data:image/png;base64,${imageToBase64(imgBuffer)}`,
        },
      });
    }

    try {
      const raw = await callVision([{ role: 'user', content }]);
      const cleaned = raw.replace(/<\/?think>/g, '').replace(/<\/?no_think>/g, '').trim();
      const match = cleaned.match(/\{[\s\S]*?\}/);
      if (match) {
        const result = JSON.parse(match[0]);
        const winnerIdx = result.winner;
        if (winnerIdx >= 0 && winnerIdx < batch.length) {
          batchWinners.push({
            ...batch[winnerIdx],
            reason: result.reason,
            batchIndex: batchStart + winnerIdx,
          });
          console.log(`  배치 ${Math.floor(batchStart / batchSize) + 1} 승자: 이미지 ${batchStart + winnerIdx} - ${result.reason}`);
        }
      }
    } catch (err) {
      console.error(`  배치 심사 에러: ${err.message}`);
      // 에러 시 배치 첫 이미지 선택
      batchWinners.push(batch[0]);
    }
  }

  // 배치 승자가 여러명이면 최종 결선
  if (batchWinners.length <= 1) {
    const winner = batchWinners[0] || images[0];
    console.log(`[Review Agent] "${name_en}" 최종 선택: 이미지 ${winner.index}`);
    return winner;
  }

  console.log(`[Review Agent] "${name_en}" 결선 심사 (${batchWinners.length}장)...`);

  const finalContent = [
    {
      type: 'text',
      text: `최종 결선입니다. ${batchWinners.length}장 중 게임 스프라이트로 가장 적합한 1장을 선택하세요.
몬스터: ${name_en} (${type})
반드시 JSON으로만: {"winner": 번호(0부터), "reason": "이유"}`,
    },
  ];

  for (let i = 0; i < batchWinners.length; i++) {
    const imgBuffer = await readFile(batchWinners[i].path);
    finalContent.push({ type: 'text', text: `\n--- 후보 ${i} ---` });
    finalContent.push({
      type: 'image_url',
      image_url: { url: `data:image/png;base64,${imageToBase64(imgBuffer)}` },
    });
  }

  try {
    const raw = await callVision([{ role: 'user', content: finalContent }]);
    const cleaned = raw.replace(/<\/?think>/g, '').replace(/<\/?no_think>/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*?\}/);
    if (match) {
      const result = JSON.parse(match[0]);
      const winner = batchWinners[result.winner] || batchWinners[0];
      console.log(`[Review Agent] "${name_en}" 최종 선택: 이미지 ${winner.index} - ${result.reason}`);
      return winner;
    }
  } catch (err) {
    console.error(`  결선 심사 에러: ${err.message}`);
  }

  // 폴백
  const winner = batchWinners[0];
  console.log(`[Review Agent] "${name_en}" 폴백 선택: 이미지 ${winner.index}`);
  return winner;
}
