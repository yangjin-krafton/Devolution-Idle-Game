// ============================================================
// ComfyUI Image Generation Agent
// ============================================================

import { CONFIG } from './config.js';
import { readFile, mkdir, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

let baseWorkflow = null;

async function loadWorkflow() {
  if (baseWorkflow) return baseWorkflow;
  const wfPath = resolve(__dirname, CONFIG.WORKFLOW_PATH);
  const raw = await readFile(wfPath, 'utf-8');
  baseWorkflow = JSON.parse(raw);
  return baseWorkflow;
}

// 다수 객체/캐릭터 시트를 유발하는 키워드 제거
function sanitizePrompt(prompt) {
  // 캐릭터 시트/도감/다수 유발 키워드 제거
  const removePatterns = [
    /\bchibi\b/gi,
    /\bbaby pokemon\b/gi,
    /\bbaby\b/gi,
    /\bkawaii\b/gi,
    /\bcharacter sheet\b/gi,
    /\breference sheet\b/gi,
    /\bmultiple views\b/gi,
    /\bmultiple poses\b/gi,
    /\bexpression sheet\b/gi,
    /\bturnaround\b/gi,
    // 부정 설명 제거 (모델에게 역효과)
    /,?\s*no\s+\w+(\s+\w+)*/gi,
    /,?\s*not\s+a\s+\w+/gi,
    /,?\s*without\s+\w+/gi,
  ];
  let cleaned = prompt;
  for (const pat of removePatterns) {
    cleaned = cleaned.replace(pat, '');
  }
  // 연속 콤마/공백 정리
  cleaned = cleaned.replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' ').trim();
  return cleaned;
}

function buildWorkflow(prompt, seed) {
  const wf = JSON.parse(JSON.stringify(baseWorkflow));
  // 프롬프트 정제 (다수 객체 유발 키워드 제거)
  const cleanedPrompt = sanitizePrompt(prompt);
  // 노드 50: 프롬프트 설정 (좌측 전면 방향 + 단일 객체 강제)
  const directionSuffix = ', pokemon official art, ken sugimori style, cel-shaded, bold outlines, facing left, front three-quarter view, looking at viewer, solo, single creature, one full body character, white background, simple clean background';
  wf['50'].inputs.text = cleanedPrompt + directionSuffix;
  // 노드 49: 시드 변경으로 배리에이션 생성
  wf['49'].inputs.seed = seed;
  // denoise를 높여서 더 다양한 결과
  wf['49'].inputs.denoise = 0.85;
  return wf;
}

async function queuePrompt(workflow) {
  const res = await fetch(`${CONFIG.COMFYUI_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow }),
  });
  if (!res.ok) throw new Error(`ComfyUI queue error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.prompt_id;
}

async function waitForCompletion(promptId, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${CONFIG.COMFYUI_URL}/history/${promptId}`);
    const data = await res.json();
    if (data[promptId]) {
      const outputs = data[promptId].outputs;
      if (outputs && Object.keys(outputs).length > 0) {
        return outputs;
      }
      // 에러 체크
      if (data[promptId].status?.status_str === 'error') {
        throw new Error(`ComfyUI 실행 에러: ${JSON.stringify(data[promptId].status)}`);
      }
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error(`ComfyUI 타임아웃 (${timeoutMs}ms)`);
}

async function downloadImage(filename, subfolder, folderType) {
  const params = new URLSearchParams({ filename, subfolder: subfolder || '', type: folderType || 'output' });
  const res = await fetch(`${CONFIG.COMFYUI_URL}/view?${params}`);
  if (!res.ok) throw new Error(`이미지 다운로드 실패: ${filename}`);
  return Buffer.from(await res.arrayBuffer());
}

// 8 프롬프트 × 4 시드 = 32장 생성
export async function generateImages(form) {
  const { name_en, image_prompt, image_prompts, type } = form;
  const prompts = Array.isArray(image_prompts) && image_prompts.length > 0
    ? image_prompts : [image_prompt];
  const seedsPerPrompt = CONFIG.SEEDS_PER_PROMPT;
  const totalImages = prompts.length * seedsPerPrompt;

  console.log(`[ComfyUI Agent] "${name_en}" (${type}) ${prompts.length}프롬프트 × ${seedsPerPrompt}시드 = ${totalImages}장 생성 시작...`);

  await loadWorkflow();

  const tempDir = resolve(__dirname, CONFIG.TEMP_DIR, name_en);
  await mkdir(tempDir, { recursive: true });

  const images = [];
  let globalIdx = 0;

  for (let p = 0; p < prompts.length; p++) {
    const prompt = prompts[p];

    for (let s = 0; s < seedsPerPrompt; s++) {
      const seed = Math.floor(Math.random() * 2 ** 48);
      const workflow = buildWorkflow(prompt, seed);

      try {
        const promptId = await queuePrompt(workflow);
        console.log(`  [${globalIdx + 1}/${totalImages}] P${p + 1}S${s + 1} queued (seed: ${seed}, id: ${promptId})`);

        const outputs = await waitForCompletion(promptId);

        // 노드 9 (SaveImage) 또는 노드 99 (RemBg) 에서 이미지 가져오기
        let imageInfo = null;
        for (const nodeId of ['9', '99']) {
          if (outputs[nodeId]?.images?.length > 0) {
            imageInfo = outputs[nodeId].images[0];
            break;
          }
        }

        if (imageInfo) {
          const imgBuffer = await downloadImage(imageInfo.filename, imageInfo.subfolder, imageInfo.type);
          const localPath = resolve(tempDir, `${name_en}_p${p}_s${s}.png`);
          await writeFile(localPath, imgBuffer);
          images.push({
            index: globalIdx,
            promptIndex: p,
            seedIndex: s,
            seed,
            path: localPath,
            filename: imageInfo.filename,
          });
          console.log(`  [${globalIdx + 1}/${totalImages}] saved: ${name_en}_p${p}_s${s}.png`);
        } else {
          console.warn(`  [${globalIdx + 1}/${totalImages}] 이미지 없음, 출력 노드 확인 필요`);
        }
      } catch (err) {
        console.error(`  [${globalIdx + 1}/${totalImages}] 에러: ${err.message}`);
      }

      globalIdx++;
    }
  }

  console.log(`[ComfyUI Agent] "${name_en}" 완료: ${images.length}/${totalImages}장 생성`);
  return { name_en, type, images };
}
