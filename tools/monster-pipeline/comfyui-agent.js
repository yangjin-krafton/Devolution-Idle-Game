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

function buildWorkflow(prompt, seed) {
  const wf = JSON.parse(JSON.stringify(baseWorkflow));
  // 노드 50: 프롬프트 설정
  wf['50'].inputs.text = prompt;
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

export async function generateImages(form) {
  const { name_en, image_prompt, type } = form;
  console.log(`[ComfyUI Agent] "${name_en}" (${type}) 이미지 ${CONFIG.IMAGES_PER_CONCEPT}장 생성 시작...`);

  await loadWorkflow();

  const tempDir = resolve(__dirname, CONFIG.TEMP_DIR, name_en);
  await mkdir(tempDir, { recursive: true });

  const images = [];

  for (let i = 0; i < CONFIG.IMAGES_PER_CONCEPT; i++) {
    const seed = Math.floor(Math.random() * 2 ** 48);
    const workflow = buildWorkflow(image_prompt, seed);

    try {
      const promptId = await queuePrompt(workflow);
      console.log(`  [${i + 1}/${CONFIG.IMAGES_PER_CONCEPT}] queued (seed: ${seed}, id: ${promptId})`);

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
        const localPath = resolve(tempDir, `${name_en}_${i}.png`);
        await writeFile(localPath, imgBuffer);
        images.push({ index: i, seed, path: localPath, filename: imageInfo.filename });
        console.log(`  [${i + 1}/${CONFIG.IMAGES_PER_CONCEPT}] saved: ${localPath}`);
      } else {
        console.warn(`  [${i + 1}/${CONFIG.IMAGES_PER_CONCEPT}] 이미지 없음, 출력 노드 확인 필요`);
      }
    } catch (err) {
      console.error(`  [${i + 1}/${CONFIG.IMAGES_PER_CONCEPT}] 에러: ${err.message}`);
    }
  }

  console.log(`[ComfyUI Agent] "${name_en}" 완료: ${images.length}장 생성`);
  return { name_en, type, images };
}
