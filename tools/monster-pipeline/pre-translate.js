#!/usr/bin/env node
// ============================================================
// Pre-Translate: roster image_desc → 영어 프롬프트 사전 생성
// ============================================================
//
// 모든 roster JSON의 각 형태(wild, devo1, devo2)에 대해
// image_desc(한국어) → 8개 영어 프롬프트를 LM Studio로 생성하고
// roster JSON에 image_prompts_en 필드로 저장.
//
// pipeline.js에서 image_prompts_en이 있으면 번역을 건너뛰고
// 바로 ComfyUI 이미지 생성으로 진행.
//
// 사용법:
//   node pre-translate.js              # 전체 roster 번역
//   node pre-translate.js --only 3     # 3번만
//   node pre-translate.js --from 5     # 5번부터
//   node pre-translate.js --force      # 기존 image_prompts_en 덮어쓰기
//   node pre-translate.js --status     # 번역 상태 확인
//   node pre-translate.js --dry-run    # 실제 호출 없이 대상만 확인
// ============================================================

import { CONFIG } from './config.js';
import { readFile, writeFile, readdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROSTER_DIR = resolve(__dirname, 'roster');

// ── CLI ──
const args = process.argv.slice(2);
function getArgInt(name, def) {
  const idx = args.indexOf(name);
  return idx !== -1 && args[idx + 1] ? parseInt(args[idx + 1], 10) : def;
}
const flags = {
  only: getArgInt('--only', null),
  from: getArgInt('--from', null),
  force: args.includes('--force'),
  status: args.includes('--status'),
  dryRun: args.includes('--dry-run'),
};

// ── 형태별 스타일 서픽스 (concept-agent.js와 동일) ──
const FORM_SUFFIX = {
  base: 'dark saturated color palette, intimidating presence',
  devo1: 'reduced complexity, two eyes, neat proportions',
  devo2: 'small round proportions, oversized head, big eyes, stubby legs, young small creature',
};

function getFormSuffix(formType) {
  if (formType.startsWith('devo2')) return FORM_SUFFIX.devo2;
  if (formType.startsWith('devo1')) return FORM_SUFFIX.devo1;
  return FORM_SUFFIX.base;
}

// ── LLM 호출 ──
const LLM_TIMEOUT_MS = 600_000;
const LLM_MAX_RETRIES = 3;

async function callLLM(messages, temperature = 0.7) {
  for (let attempt = 1; attempt <= LLM_MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
    try {
      const res = await fetch(`${CONFIG.LM_STUDIO_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: CONFIG.TEXT_MODEL,
          messages: [{ role: 'system', content: '/no_think' }, ...messages],
          temperature,
          max_tokens: 16384,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`LLM API error: ${res.status} ${await res.text()}`);
      const data = await res.json();
      return data.choices[0].message.content;
    } catch (err) {
      clearTimeout(timer);
      const isTimeout = err.name === 'AbortError';
      console.warn(`  [LLM] ${isTimeout ? '타임아웃' : '오류'} (${attempt}/${LLM_MAX_RETRIES}): ${err.message}`);
      if (attempt === LLM_MAX_RETRIES) throw err;
      const delay = attempt * 3000;
      console.log(`  [LLM] ${delay / 1000}초 후 재시도...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// ── JSON 추출 ──
function extractJSON(text) {
  let cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/<\/?think>/g, '')
    .replace(/<\/?no_think>/g, '')
    .trim();

  const codeBlock = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) return JSON.parse(codeBlock[1].trim());

  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  const start = (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace))
    ? firstBracket : firstBrace;
  if (start === -1) throw new Error('JSON not found in response');

  const openChar = cleaned[start];
  const closeChar = openChar === '{' ? '}' : ']';
  let depth = 0, end = -1, inString = false, escape = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === openChar || ch === '{' || ch === '[') depth++;
    if (ch === closeChar || ch === '}' || ch === ']') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }

  if (end === -1) {
    let truncated = cleaned.substring(start);
    truncated = truncated.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*$/, '');
    truncated = truncated.replace(/,\s*$/, '');
    for (let d = 0; d < depth; d++) truncated += closeChar;
    return JSON.parse(truncated);
  }

  return JSON.parse(cleaned.substring(start, end + 1));
}

// ── 프롬프트 생성 ──
async function generatePromptBatch(imageDesc, batchSize, suffix) {
  const messages = [
    {
      role: 'system',
      content: `You translate a Korean monster description into ${batchSize} English image prompts for AI image generation.

RULES:
1. Translate the Korean description into English, then create ${batchSize} variations.
2. Every prompt MUST start with: "pokemon official art style, ken sugimori style, single creature only, one character, full body, white background, simple clean background, cel-shaded, bold outlines,"
3. Every prompt MUST end with: "${suffix}"
4. Between prefix and suffix, include: creature description + one unique variation per prompt.
5. Variations: different poses (standing, crouching, leaping, sitting, rearing up, head tilt, looking back, mid-step), angles (front, three-quarter, side), emphasis (skin texture, eyes, claws, markings, tail).
6. Translate Korean colors accurately (숯검정→charcoal black, 한밤파랑→midnight blue, 탁한→dull/muted, 독성→toxic).
7. NEVER use: chibi, baby, kawaii, dragon, pikachu.
8. Each prompt: 40-80 words.
9. Output ONLY a JSON array of ${batchSize} strings. No explanation.`
    },
    { role: 'user', content: imageDesc }
  ];

  const raw = await callLLM(messages, 0.7);
  let prompts;
  try {
    prompts = extractJSON(raw);
  } catch {
    prompts = [raw.replace(/```json|```|\[|\]/g, '').trim()];
  }
  if (!Array.isArray(prompts)) prompts = prompts.prompts || [String(prompts)];

  while (prompts.length < batchSize) prompts.push(prompts[prompts.length - 1] || imageDesc);
  if (prompts.length > batchSize) prompts = prompts.slice(0, batchSize);
  return prompts;
}

// ── 모든 형태 추출 ──
function extractAllForms(rosterData) {
  const forms = [];
  const w = rosterData.wild;

  forms.push({
    path: ['wild', 'visual'],
    imageDesc: w.visual?.image_desc || w.desc_kr,
    nameKr: w.name_kr,
    formType: 'base',
    existing: w.visual?.image_prompts_en,
  });

  for (let i = 0; i < rosterData.devo1.length; i++) {
    const d1 = rosterData.devo1[i];
    forms.push({
      path: ['devo1', i, 'visual'],
      imageDesc: d1.visual?.image_desc || d1.desc_kr,
      nameKr: d1.name_kr,
      formType: `devo1_${i}`,
      existing: d1.visual?.image_prompts_en,
    });

    if (d1.devo2) {
      for (let j = 0; j < d1.devo2.length; j++) {
        const d2 = d1.devo2[j];
        forms.push({
          path: ['devo1', i, 'devo2', j, 'visual'],
          imageDesc: d2.visual?.image_desc || d2.desc_kr,
          nameKr: d2.name_kr,
          formType: `devo2_${i}_${j}`,
          existing: d2.visual?.image_prompts_en,
        });
      }
    }
  }

  return forms;
}

// ── 경로로 객체에 값 설정 ──
function setNestedValue(obj, pathArr, key, value) {
  let current = obj;
  for (const p of pathArr) {
    current = current[p];
  }
  if (!current) return;
  current[key] = value;
}

// ── roster 파일 로드 ──
async function loadRosterFiles() {
  const files = (await readdir(ROSTER_DIR))
    .filter(f => f.match(/^\d{2}_/) && f.endsWith('.json'))
    .sort();
  const roster = [];
  for (const f of files) {
    const data = JSON.parse(await readFile(resolve(ROSTER_DIR, f), 'utf-8'));
    roster.push({ filename: f, data });
  }
  return roster;
}

function log(msg) {
  const ts = new Date().toISOString().substring(11, 19);
  console.log(`[${ts}] ${msg}`);
}

// ── 메인 ──
async function main() {
  const roster = await loadRosterFiles();
  const promptCount = CONFIG.PROMPTS_PER_FORM;

  // --status
  if (flags.status) {
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║       Pre-Translate 진행 상황                       ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');

    let totalForms = 0, translatedForms = 0;
    for (const { filename, data } of roster) {
      const forms = extractAllForms(data);
      const done = forms.filter(f => f.existing && f.existing.length > 0).length;
      totalForms += forms.length;
      translatedForms += done;
      const icon = done === forms.length ? '✓' : done > 0 ? '◐' : '·';
      console.log(`  ${icon} #${String(data.id).padStart(2, '0')} ${data.wild.name_kr} (${data.wild.name_en}) — ${done}/${forms.length} 형태 번역됨`);
    }
    console.log(`\n  총: ${translatedForms}/${totalForms} 형태 번역 완료\n`);
    return;
  }

  // 대상 결정
  let targets = roster;
  if (flags.only) {
    const entry = roster.find(r => r.data.id === flags.only);
    if (!entry) { console.error(`roster #${flags.only} 없음`); return; }
    targets = [entry];
  } else if (flags.from) {
    targets = roster.filter(r => r.data.id >= flags.from);
  }

  // 번역할 형태 수 계산
  let totalWork = 0;
  for (const { data } of targets) {
    const forms = extractAllForms(data);
    totalWork += flags.force ? forms.length : forms.filter(f => !f.existing || f.existing.length === 0).length;
  }

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║     Pre-Translate: image_desc → English prompts     ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  LM Studio:   ${CONFIG.LM_STUDIO_URL.padEnd(37)}║`);
  console.log(`║  Model:       ${CONFIG.TEXT_MODEL.padEnd(37)}║`);
  console.log(`║  대상:        ${String(targets.length + '종').padEnd(37)}║`);
  console.log(`║  번역 필요:   ${String(totalWork + '형태 × ' + promptCount + '프롬프트').padEnd(37)}║`);
  console.log(`║  Force:       ${String(flags.force).padEnd(37)}║`);
  console.log(`║  Dry Run:     ${String(flags.dryRun).padEnd(37)}║`);
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log();

  if (totalWork === 0) {
    console.log('모든 형태가 이미 번역되어 있습니다. --force로 덮어쓰기 가능.');
    return;
  }

  if (flags.dryRun) {
    console.log('[DRY RUN] 실제 LLM 호출 없이 대상만 표시:\n');
    for (const { filename, data } of targets) {
      const forms = extractAllForms(data);
      const todo = flags.force ? forms : forms.filter(f => !f.existing || f.existing.length === 0);
      if (todo.length === 0) continue;
      console.log(`  #${String(data.id).padStart(2, '0')} ${data.wild.name_kr}:`);
      for (const f of todo) {
        console.log(`    [${f.formType}] ${f.nameKr} — ${f.imageDesc.substring(0, 50)}...`);
      }
    }
    return;
  }

  // 실행
  let processed = 0;
  for (const { filename, data } of targets) {
    const id = data.id;
    const forms = extractAllForms(data);
    const todo = flags.force ? forms : forms.filter(f => !f.existing || f.existing.length === 0);

    if (todo.length === 0) {
      log(`#${String(id).padStart(2, '0')} ${data.wild.name_kr} — 이미 완료, 건너뛰기`);
      continue;
    }

    console.log(`\n${'─'.repeat(50)}`);
    console.log(`  #${String(id).padStart(2, '0')} ${data.wild.name_kr} (${data.wild.name_en}) — ${todo.length}형태`);
    console.log(`${'─'.repeat(50)}`);

    for (const form of todo) {
      const suffix = getFormSuffix(form.formType);
      log(`  [${form.formType}] "${form.nameKr}" → ${promptCount}프롬프트 생성 중...`);

      try {
        const prompts = await generatePromptBatch(form.imageDesc, promptCount, suffix);
        setNestedValue(data, form.path, 'image_prompts_en', prompts);
        log(`  ✓ [${form.formType}] ${prompts.length}프롬프트 완료 (첫번째: ${prompts[0]?.substring(0, 60)}...)`);
        processed++;
      } catch (err) {
        log(`  ✗ [${form.formType}] 에러: ${err.message}`);
      }
    }

    // roster JSON 저장
    const filePath = resolve(ROSTER_DIR, filename);
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    log(`  ✓ ${filename} 저장 완료`);
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`  Pre-Translate 완료: ${processed}/${totalWork} 형태 번역`);
  console.log(`  pipeline.js 실행 시 번역을 건너뛰고 바로 이미지 생성합니다.`);
  console.log(`${'='.repeat(50)}\n`);
}

main().catch(err => {
  console.error('Pre-Translate 치명적 에러:', err);
  process.exit(1);
});
