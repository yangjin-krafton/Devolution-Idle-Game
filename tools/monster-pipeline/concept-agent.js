// ============================================================
// Monster Concept Agent — Qwen으로 몬스터 컨셉+스킬 생성
// ============================================================

import { CONFIG } from './config.js';
import { writeFile, mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SYSTEM_PROMPT = `You are a monster designer for "Devolution Idle Game".
You MUST respond with ONLY valid JSON. No thinking, no explanation, no markdown.
Start your response with { and end with }.

Game concept:
- Turn-based monster taming game (NOT attacking - taming via calming/bonding)
- Monsters "devolve" (regress to simpler, cuter forms) instead of evolving
- Sensory axes: sound, temperature, smell, behavior
- Sensory effectiveness cycle: sound > behavior > smell > temperature > sound
- Personalities: aggressive, timid, curious, stubborn

Combat system:
- 3v1 battles (3 allies vs 1 wild enemy)
- Goal: raise enemy's Taming gauge, then trigger Human Bonding
- Skill categories:
  - stimulate: raises taming gauge (main damage dealer)
  - capture: attempts bonding (needs 40%+ taming, high escape risk)
  - defend: heals allies, boosts defense, reduces escape gauge
- Each skill has:
  - axis: sound/temperature/smell/behavior
  - power: 3-20 (stimulate: 10-15, capture: 12-20, defend: 3-10)
  - escapeRisk: -6 to 18 (negative = reduces escape)
  - pp/maxPp: usage limit (stimulate: 5-9, capture: 2-3, defend: 5-6)
  - effects: emotion effects [{type, chance, turns}]
    - emotions: calm, curious, fear, charmed, rage, trust
    - chance: 0.1-0.35, turns: 2-3
  - healAmount (defend only): 3-8
  - defenseBoost (defend only): 1-6

Enemy stats reference:
- attackPower: 3-9 (timid=3-4, curious=4-5, aggressive=6-9)
- tamingThreshold: 50-85 (how much taming needed)
- escapeThreshold: 65-120 (max escape before fleeing)

Existing enemies (avoid overlap):
abyss_wolf, glass_moth, stone_turtle, shadow_cat, crystal_deer, fog_jellyfish, iron_boar, echo_bat

Existing allies:
water(이슬요정), fire(숯뭉이), grass(잎사귀요정), crystal(수정벌레), moss(이끼도롱), spark(번개꼬리)

Rules:
1. Unique concepts, no overlap with existing monsters
2. Natural + fantasy element combination
3. Each form visually distinct but sharing recognizable lineage traits
4. Skills must be balanced and thematically fitting
5. Enemy reactions must match personality and sensory types

CRITICAL - ALL image prompts MUST maintain Nintendo Pokemon official illustration art style:
- Clean cel-shaded look, bold outlines, vibrant saturated colors, Ken Sugimori style
- Every stage must look like it belongs in a Pokemon game

Style per stage (all within Pokemon art style):
- BASE (wild enemy): Intimidating, fierce, menacing Pokemon. Sharp features, dark color palette, threatening pose. Think legendary/pseudo-legendary Pokemon like Hydreigon, Darkrai, Giratina. Still Pokemon style but scary and powerful.
- DEVO1 (tamed ally): Strong, cool, battle-ready Pokemon. Confident pose, sleek design. Like fully evolved starter Pokemon (Charizard, Greninja level). Visible traces of base form (same color scheme, similar features but refined).
- DEVO2 (final devolution): Maximum cute baby Pokemon. Round soft shapes, oversized head, big sparkly eyes, tiny body. Like Togepi, Igglybuff, Cleffa level cuteness. Previous stage's features miniaturized and adorable (tiny horns, small tail, same colors but pastel).`;

const GENERATE_PROMPT = `Create 1 new monster with full devolution tree and game-ready data.

Requirements:
- Base form (wild enemy) with stats + reactions
- 3 devolution level 1 variations (ally forms with 3 skills each)
- 2 devolution level 2 variations per level 1 (6 total, final cute forms)

Respond with ONLY this JSON (fill ALL fields with creative real content):

{"base":{"name_kr":"Korean name","name_en":"snake_case_id","desc_kr":"1-line Korean description","element":"element keyword","sensoryType":["axis1","axis2"],"personality":"one of: aggressive/timid/curious/stubborn","attackPower":5,"tamingThreshold":65,"escapeThreshold":80,"image_prompt":"pokemon official art style, ken sugimori style, [detailed fierce intimidating appearance], menacing dark pokemon, sharp features, bold outlines, cel-shaded, vibrant colors, dark color palette, simple white background, full body, facing left, front three-quarter view, game sprite, transparent background","reactions":{"sound_good":"Korean reaction","sound_bad":"Korean reaction","temp_good":"Korean reaction","temp_bad":"Korean reaction","smell_good":"Korean reaction","smell_bad":"Korean reaction","behav_good":"Korean reaction","behav_bad":"Korean reaction","attack":"Korean attack description!","calm":"Korean calm description."}},"devolutions_1":[{"name_kr":"Korean name","name_en":"snake_case_id","desc_kr":"Korean desc","hp":28,"maxHp":28,"stats":{"gentleness":5,"empathy":5,"resilience":5,"agility":5},"devolvedName":"Korean devolved name","devolvedDesc":"Korean devolved desc","devolvedStats":{"gentleness":10,"empathy":3,"resilience":3,"agility":4},"image_prompt":"powerful battle creature, [cool strong warrior appearance with traces of wild base form], pokemon official art style, ken sugimori style, bold outlines, cel-shaded, vibrant colors, confident battle pose, simple white background, full body, facing left, front three-quarter view, game sprite, transparent background","actions":[{"id":"skill_id","name":"Korean skill name","axis":"sound","category":"stimulate","power":12,"escapeRisk":3,"pp":8,"maxPp":8,"effects":[{"type":"calm","chance":0.2,"turns":2}],"log":"Korean action description."},{"id":"skill_id","name":"Korean skill name","axis":"behavior","category":"defend","power":8,"escapeRisk":-3,"healAmount":5,"defenseBoost":2,"pp":6,"maxPp":6,"effects":[],"log":"Korean action description."},{"id":"skill_id","name":"Korean skill name","axis":"smell","category":"capture","power":15,"escapeRisk":12,"pp":3,"maxPp":3,"effects":[],"log":"Korean action description."}]},{"name_kr":"variation B name","name_en":"snake_case_b","desc_kr":"desc","hp":25,"maxHp":25,"stats":{"gentleness":6,"empathy":4,"resilience":4,"agility":6},"devolvedName":"devolved B","devolvedDesc":"desc","devolvedStats":{"gentleness":12,"empathy":2,"resilience":3,"agility":3},"image_prompt":"powerful battle creature, [variant B cool warrior look with echoes of wild form], pokemon official art style, ken sugimori style, bold outlines, cel-shaded, vibrant colors, agile battle stance, simple white background, full body, facing left, front three-quarter view, game sprite, transparent background","actions":[{"id":"b_skill1","name":"skill name","axis":"temperature","category":"stimulate","power":11,"escapeRisk":4,"pp":7,"maxPp":7,"effects":[{"type":"curious","chance":0.15,"turns":2}],"log":"action desc."},{"id":"b_skill2","name":"skill name","axis":"smell","category":"defend","power":6,"escapeRisk":-4,"healAmount":6,"defenseBoost":3,"pp":5,"maxPp":5,"effects":[],"log":"action desc."},{"id":"b_skill3","name":"skill name","axis":"behavior","category":"capture","power":14,"escapeRisk":11,"pp":3,"maxPp":3,"effects":[],"log":"action desc."}]},{"name_kr":"variation C name","name_en":"snake_case_c","desc_kr":"desc","hp":30,"maxHp":30,"stats":{"gentleness":4,"empathy":6,"resilience":6,"agility":4},"devolvedName":"devolved C","devolvedDesc":"desc","devolvedStats":{"gentleness":3,"empathy":3,"resilience":12,"agility":2},"image_prompt":"powerful battle creature, [variant C strong appearance with remnants of wild form], pokemon official art style, ken sugimori style, bold outlines, cel-shaded, vibrant colors, sturdy defensive pose, simple white background, full body, facing left, front three-quarter view, game sprite, transparent background","actions":[{"id":"c_skill1","name":"skill name","axis":"sound","category":"stimulate","power":13,"escapeRisk":5,"pp":6,"maxPp":6,"effects":[{"type":"charmed","chance":0.1,"turns":3}],"log":"action desc."},{"id":"c_skill2","name":"skill name","axis":"temperature","category":"defend","power":5,"escapeRisk":-5,"healAmount":4,"defenseBoost":4,"pp":5,"maxPp":5,"effects":[{"type":"calm","chance":0.25,"turns":2}],"log":"action desc."},{"id":"c_skill3","name":"skill name","axis":"sound","category":"capture","power":16,"escapeRisk":14,"pp":2,"maxPp":2,"effects":[],"log":"action desc."}]}],"devolutions_2":[{"parent":"snake_case_id of devo1 parent","name_kr":"tiny name","name_en":"tiny_id_a1","desc_kr":"Korean desc","image_prompt":"tiny adorable chibi creature, [miniaturized version of devo1 parent with same features shrunk down], pokemon official art style, ken sugimori style, bold outlines, cel-shaded, maximum cute, round body, oversized head, big sparkly eyes, soft pastel colors, baby pokemon, simple white background, full body, facing left, front three-quarter view, game sprite, transparent background"},{"parent":"same parent","name_kr":"tiny name","name_en":"tiny_id_a2","desc_kr":"Korean desc","image_prompt":"tiny adorable chibi creature, [cute variant still recognizable from parent form], pokemon official art style, ken sugimori style, bold outlines, cel-shaded, maximum kawaii, pudgy round shape, oversized head, big innocent eyes, baby pokemon, simple white background, full body, facing left, front three-quarter view, game sprite, transparent background"},{"parent":"snake_case_b","name_kr":"tiny name","name_en":"tiny_id_b1","desc_kr":"Korean desc","image_prompt":"tiny adorable chibi creature, [mini version of parent B with inherited features], pokemon official art style, ken sugimori style, bold outlines, cel-shaded, extremely cute, round soft body, oversized head, big eyes, baby pokemon, simple white background, full body, facing left, front three-quarter view, game sprite, transparent background"},{"parent":"snake_case_b","name_kr":"tiny name","name_en":"tiny_id_b2","desc_kr":"Korean desc","image_prompt":"tiny adorable chibi creature, [cute blob variant of parent B], pokemon official art style, ken sugimori style, bold outlines, cel-shaded, maximum adorable, tiny limbs, oversized head, soft pastel colors, baby pokemon, simple white background, full body, facing left, front three-quarter view, game sprite, transparent background"},{"parent":"snake_case_c","name_kr":"tiny name","name_en":"tiny_id_c1","desc_kr":"Korean desc","image_prompt":"tiny adorable chibi creature, [miniaturized parent C with same color pattern], pokemon official art style, ken sugimori style, bold outlines, cel-shaded, super cute tiny creature, round shape, oversized head, sparkly eyes, baby pokemon, simple white background, full body, facing left, front three-quarter view, game sprite, transparent background"},{"parent":"snake_case_c","name_kr":"tiny name","name_en":"tiny_id_c2","desc_kr":"Korean desc","image_prompt":"tiny adorable chibi creature, [tiniest cutest version of parent C], pokemon official art style, ken sugimori style, bold outlines, cel-shaded, maximum kawaii, soft round body, oversized head, big happy eyes, pastel colors, baby pokemon, simple white background, full body, facing left, front three-quarter view, game sprite, transparent background"}]}`;

async function callQwen(messages, temperature = 0.8) {
  const res = await fetch(`${CONFIG.LM_STUDIO_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CONFIG.TEXT_MODEL,
      messages,
      temperature,
      max_tokens: 8192,
    }),
  });
  if (!res.ok) throw new Error(`Qwen API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

function extractJSON(text) {
  // 디버그: 원본 저장
  const debugDir = resolve(__dirname, CONFIG.TEMP_DIR);
  mkdir(debugDir, { recursive: true }).then(() =>
    writeFile(resolve(debugDir, 'last_raw_response.txt'), text, 'utf-8')
  ).catch(() => {});

  // thinking 태그 및 내용 제거
  let cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/<\/?think>/g, '')
    .replace(/<\/?no_think>/g, '')
    .trim();

  // JSON 코드블록 먼저 시도
  const codeBlock = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) {
    return JSON.parse(codeBlock[1].trim());
  }

  // 중첩 { } 매칭으로 JSON 객체 추출 (문자열 내부 무시)
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace === -1) throw new Error('JSON 객체를 찾을 수 없습니다. 원본 앞 500자:\n' + text.substring(0, 500));

  let depth = 0;
  let lastBrace = -1;
  let inString = false;
  let escape = false;

  for (let i = firstBrace; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { lastBrace = i; break; }
    }
  }

  if (lastBrace === -1) throw new Error('JSON 객체가 불완전합니다 (닫는 괄호 부족).');

  const jsonStr = cleaned.substring(firstBrace, lastBrace + 1);
  return JSON.parse(jsonStr);
}

export async function generateMonsterConcept() {
  console.log('[Concept Agent] 몬스터 컨셉+스킬 생성 중...');

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: GENERATE_PROMPT },
  ];

  const raw = await callQwen(messages);
  console.log(`[Concept Agent] 응답 수신 (${raw.length}자), JSON 파싱 중...`);

  const concept = extractJSON(raw);

  // 검증
  if (!concept.base || !concept.devolutions_1 || !concept.devolutions_2) {
    throw new Error('컨셉 JSON 구조가 올바르지 않습니다.');
  }
  if (concept.devolutions_1.length !== CONFIG.DEVOLUTION_DEPTH_1_COUNT) {
    console.warn(`[Concept Agent] 퇴화1이 ${concept.devolutions_1.length}개 (기대: ${CONFIG.DEVOLUTION_DEPTH_1_COUNT})`);
  }

  // 스킬 검증
  for (const devo of concept.devolutions_1) {
    if (!devo.actions || devo.actions.length !== 3) {
      console.warn(`[Concept Agent] ${devo.name_en}: 스킬 ${devo.actions?.length || 0}개 (기대: 3)`);
    }
  }

  // 모든 이미지 프롬프트 목록 수집
  const allForms = [
    { ...concept.base, type: 'base' },
    ...concept.devolutions_1.map((d, i) => ({ ...d, type: `devo1_${i}` })),
    ...concept.devolutions_2.map((d, i) => ({ ...d, type: `devo2_${i}` })),
  ];

  console.log(`[Concept Agent] 컨셉 완료: ${concept.base.name_kr}`);
  console.log(`  - 기본형: ${concept.base.name_kr} (${concept.base.name_en}) [${concept.base.personality}, ${concept.base.sensoryType}]`);
  concept.devolutions_1.forEach((d, i) => {
    console.log(`  - 퇴화1-${String.fromCharCode(65 + i)}: ${d.name_kr} (${d.name_en}) HP:${d.hp}`);
    d.actions?.forEach(a => console.log(`      [${a.category}] ${a.name} (${a.axis}) pow:${a.power} esc:${a.escapeRisk} pp:${a.pp}`));
  });
  concept.devolutions_2.forEach((d, i) =>
    console.log(`  - 퇴화2-${i}: ${d.name_kr} (${d.name_en}) ← ${d.parent}`)
  );

  return { concept, allForms };
}
