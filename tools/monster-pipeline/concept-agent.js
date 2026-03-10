// ============================================================
// Monster Concept Agent v3 — roster 기반 + 다중 변형 프롬프트
// ============================================================
// roster/*.json의 완성형 데이터를 기반으로:
// 1. allForms를 직접 빌드
// 2. 형태별 N개 변형 영어 프롬프트 생성 (LM Studio, 창의적 변형)
// 3. LLM으로 보조 데이터 생성 (reactions, actions)
// ============================================================

import { CONFIG } from './config.js';
import { writeFile, mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── LLM 호출 (타임아웃 + 재시도) ──
const LLM_TIMEOUT_MS = 120_000;   // 2분 타임아웃
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
          messages,
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
      console.warn(`    [LLM] ${isTimeout ? '타임아웃' : '오류'} (${attempt}/${LLM_MAX_RETRIES}): ${err.message}`);
      if (attempt === LLM_MAX_RETRIES) throw err;
      const delay = attempt * 3000;
      console.log(`    [LLM] ${delay / 1000}초 후 재시도...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// ── JSON 추출 ──
function extractJSON(text) {
  const debugDir = resolve(__dirname, CONFIG.TEMP_DIR);
  mkdir(debugDir, { recursive: true }).then(() =>
    writeFile(resolve(debugDir, 'last_raw_response.txt'), text, 'utf-8')
  ).catch(() => {});

  let cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/<\/?think>/g, '')
    .replace(/<\/?no_think>/g, '')
    .trim();

  const codeBlock = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) return JSON.parse(codeBlock[1].trim());

  // { 또는 [ 찾기
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

// ── 형태별 스타일 서픽스 ──
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

// ── 형태 1개 → 1회 LLM 호출로 번역 + N개 프롬프트 완성 ──
async function generatePromptVariants(imageDesc, nameKr, count, formType = 'base') {
  console.log(`    [번역] "${nameKr}" → ${count}개 프롬프트 생성 중...`);

  const suffix = getFormSuffix(formType);
  const messages = [
    {
      role: 'system',
      content: `You translate a Korean monster description into ${count} English image prompts for AI image generation.

RULES:
1. Translate the Korean description into English, then create ${count} variations.
2. Every prompt MUST start with: "pokemon official art style, ken sugimori style, single creature only, one character, full body, white background, simple clean background, cel-shaded, bold outlines,"
3. Every prompt MUST end with: "${suffix}"
4. Between prefix and suffix, include: creature description + one unique variation per prompt.
5. Variations: different poses (standing, crouching, leaping, sitting, rearing up, head tilt, looking back, mid-step), angles (front, three-quarter, side), emphasis (skin texture, eyes, claws, markings, tail).
6. Translate Korean colors accurately (숯검정→charcoal black, 한밤파랑→midnight blue, 탁한→dull/muted, 독성→toxic).
7. NEVER use: chibi, baby, kawaii, dragon, pikachu.
8. Each prompt: 40-80 words.
9. Output ONLY a JSON array of ${count} strings. No explanation.`
    },
    {
      role: 'user',
      content: imageDesc
    }
  ];

  const raw = await callLLM(messages, 0.7);
  let prompts;
  try {
    prompts = extractJSON(raw);
  } catch {
    console.warn(`    [번역] JSON 파싱 실패, fallback`);
    prompts = [raw.replace(/```json|```|\[|\]/g, '').trim()];
  }

  if (!Array.isArray(prompts)) {
    prompts = prompts.prompts || [String(prompts)];
  }

  // 부족하면 마지막 것 복제
  while (prompts.length < count) prompts.push(prompts[prompts.length - 1] || imageDesc);
  if (prompts.length > count) prompts = prompts.slice(0, count);

  console.log(`    [번역] ${prompts.length}개 완료 (첫번째: ${prompts[0]?.substring(0, 60)}...)`);
  return prompts;
}

// ── 모든 forms에 대해 변형 프롬프트 일괄 생성 ──
async function translateAllFormsWithVariants(forms, variantsPerForm) {
  console.log(`[Concept Agent] ${forms.length}개 형태 × ${variantsPerForm}변형 = 총 ${forms.length * variantsPerForm}개 프롬프트 생성`);

  const results = [];
  for (const form of forms) {
    const variants = await generatePromptVariants(
      form.image_desc,
      form.name_kr,
      variantsPerForm,
      form.type
    );
    results.push(variants);
  }

  return results;
}

// ── 반응 텍스트 + 스킬 생성 (LLM) ──
async function generateReactionsAndActions(rosterData) {
  const w = rosterData.wild;
  const d1List = rosterData.devo1;

  console.log(`[Concept Agent] 반응 텍스트 + 스킬 LLM 생성 중...`);

  const messages = [
    {
      role: 'system',
      content: `You are a game designer for "Devolution Idle Game".
You MUST respond with ONLY valid JSON. No thinking, no explanation.

Game context:
- Turn-based monster taming (not attacking - taming via calming/bonding)
- 3v1 battles (3 allies vs 1 wild enemy)
- Goal: raise Taming gauge, then trigger Human Bonding
- Sensory axes: sound, temperature, smell, behavior
- Skill categories: stimulate (raises taming), capture (bonding attempt), defend (heal/protect)
- Each skill: axis, category, power(3-20), escapeRisk(-6 to 18), pp(2-9), effects[{type,chance,turns}]
  - emotions: calm, curious, fear, charmed, rage, trust
- Reactions: Korean text for each sensory axis good/bad + attack/calm`
    },
    {
      role: 'user',
      content: `Generate reactions and skills for this monster:

Wild: ${w.name_kr} (${w.name_en})
- ${w.desc_kr}
- Sensory: ${w.sensoryType.join(', ')} | Personality: ${w.personality}
- HP: ${w.hp} | Attack: ${w.attackPower}
${w.wildMechanic ? `- 고유 메커니즘: ${w.wildMechanic.name_kr} - ${w.wildMechanic.desc_kr}` : ''}

Devo1 (${d1List.length}종):
${d1List.map((d, i) => `  ${i}: ${d.name_kr} (${d.name_en}) [${d.role}] HP:${d.hp}
     ${d.desc_kr}
     skillFocus: ${d.skillFocus}
     Stats: G${d.stats.gentleness} E${d.stats.empathy} R${d.stats.resilience} A${d.stats.agility}`).join('\n')}

Generate JSON:
{
  "reactions": {
    "sound_good": "Korean", "sound_bad": "Korean",
    "temp_good": "Korean", "temp_bad": "Korean",
    "smell_good": "Korean", "smell_bad": "Korean",
    "behav_good": "Korean", "behav_bad": "Korean",
    "attack": "Korean!", "calm": "Korean."
  },
  "actions": {
    "${d1List[0]?.name_en || 'devo1_0'}": [
      {"id":"skill_id","name":"Korean","axis":"sound","category":"stimulate","power":12,"escapeRisk":3,"pp":8,"maxPp":8,"effects":[{"type":"calm","chance":0.2,"turns":2}],"log":"Korean action desc."},
      {"id":"skill_id","name":"Korean","axis":"behavior","category":"defend","power":8,"escapeRisk":-3,"healAmount":5,"defenseBoost":2,"pp":6,"maxPp":6,"effects":[],"log":"Korean."},
      {"id":"skill_id","name":"Korean","axis":"smell","category":"capture","power":15,"escapeRisk":12,"pp":3,"maxPp":3,"effects":[],"log":"Korean."}
    ]${d1List.length > 1 ? `,\n    "${d1List[1]?.name_en}": [3 skills],\n    ...for each devo1` : ''}
  }
}

Each devo1 MUST have exactly 3 actions matching their skillFocus axis preferences.
Skills must be balanced: 1 stimulate + 1 defend + 1 capture per devo1.`
    }
  ];

  const raw = await callLLM(messages, 0.7);
  return extractJSON(raw);
}

// ── roster에서 allForms 빌드 ──
function buildFormsFromRoster(rosterData) {
  const forms = [];
  const w = rosterData.wild;

  forms.push({
    name_en: w.name_en,
    name_kr: w.name_kr,
    image_desc: w.visual?.image_desc || w.desc_kr,
    type: 'base',
  });

  for (let i = 0; i < rosterData.devo1.length; i++) {
    const d1 = rosterData.devo1[i];
    forms.push({
      name_en: d1.name_en,
      name_kr: d1.name_kr,
      image_desc: d1.visual?.image_desc || d1.desc_kr,
      type: `devo1_${i}`,
    });

    if (d1.devo2) {
      for (let j = 0; j < d1.devo2.length; j++) {
        const d2 = d1.devo2[j];
        forms.push({
          name_en: d2.name_en,
          name_kr: d2.name_kr,
          image_desc: d2.visual?.image_desc || d2.desc_kr,
          type: `devo2_${i}_${j}`,
          parent: d1.name_en,
        });
      }
    }
  }

  return forms;
}

// ── concept 객체 조립 (pipeline에서 호출) ──
export function assembleConcept(rosterData, allForms, supplementary) {
  const w = rosterData.wild;
  const concept = {
    base: {
      name_en: w.name_en,
      name_kr: w.name_kr,
      desc_kr: w.desc_kr,
      sensoryType: w.sensoryType,
      personality: w.personality,
      attackPower: w.attackPower,
      tamingThreshold: w.tamingThreshold,
      escapeThreshold: w.escapeThreshold,
      hp: w.hp,
      stats: w.stats,
      visual: w.visual,
      wildMechanic: w.wildMechanic,
      image_prompt: allForms[0]?.image_prompt || '',
      reactions: supplementary.reactions || {},
    },
    devolutions_1: rosterData.devo1.map(d1 => ({
      name_en: d1.name_en,
      name_kr: d1.name_kr,
      desc_kr: d1.desc_kr,
      role: d1.role,
      hp: d1.hp,
      stats: d1.stats,
      skillFocus: d1.skillFocus,
      visual: d1.visual,
      image_prompt: allForms.find(f => f.name_en === d1.name_en)?.image_prompt || '',
      actions: supplementary.actions?.[d1.name_en] || [],
    })),
    devolutions_2: [],
  };

  for (const d1 of rosterData.devo1) {
    if (d1.devo2) {
      for (const d2 of d1.devo2) {
        concept.devolutions_2.push({
          parent: d1.name_en,
          name_en: d2.name_en,
          name_kr: d2.name_kr,
          desc_kr: d2.desc_kr,
          role: d2.role,
          hp: d2.hp,
          stats: d2.stats,
          skillFocus: d2.skillFocus,
          visual: d2.visual,
          image_prompt: allForms.find(f => f.name_en === d2.name_en)?.image_prompt || '',
        });
      }
    }
  }

  return concept;
}

// ── 개별 함수 export (pipeline에서 병렬 오케스트레이션용) ──
export { buildFormsFromRoster, generatePromptVariants, generateReactionsAndActions };
