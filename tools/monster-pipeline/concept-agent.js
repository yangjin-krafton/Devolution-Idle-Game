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

CRITICAL - ALL image prompts MUST follow these absolute rules:
- Clean cel-shaded look, bold outlines, vibrant saturated colors, Ken Sugimori style
- Every stage must look like it belongs in a Pokemon game
- SINGLE CREATURE ONLY: Every image must contain exactly ONE creature. Never draw multiple creatures, duplicates, or copies of the same monster
- WHITE BACKGROUND: Plain white background only. The creature stands alone on a clean white surface.
- Always include these keywords in every image_prompt: "solo, single creature, one character, white background, simple clean background"
- NEVER use negative descriptions like "no scenery", "no ground", "not a group" etc. in image_prompt. Only describe what IS in the image, never what is NOT.

Style per stage (all within Pokemon art style):
- BASE (wild enemy): MAXIMUM BODY PART COUNT. The wild form must have an EXCESSIVE number of body parts. The core design principle is QUANTITY — many of everything. Devolution means losing/merging these extra parts into a cleaner form.
  * MANY EYES: 4-8 eyes, multiple eye rows, eyes on unusual places (shoulders, back, tail)
  * MANY LIMBS: 6+ legs or arms, extra grabbing claws, secondary arm pairs
  * MANY WINGS: 2-4 wings of different sizes, tattered or layered
  * MANY TAILS: 2-5 tails, branching tails, tail splitting into multiple ends
  * MANY HORNS: 4-8 horns, antlers, spikes growing from head/back/shoulders
  * MANY MOUTHS/FANGS: multiple jaw lines, extra mouths on body, excessive teeth rows
  * MANY FINS/TENDRILS: extra fins, dangling tendrils, flowing appendages everywhere
  * Think Hydreigon (3 heads), Barbaracle (multiple arms/eyes), Eternatus (excessive spikes)
  * The image_prompt MUST explicitly specify the COUNT of each body part (e.g. "six legs", "four eyes", "three tails")
  * Dark, saturated color palette with intimidating presence
  * The wilder and more body parts, the better — devo1 should feel like "tidying up" by reducing parts to normal counts

COLOR INHERITANCE RULE (CRITICAL):
- The BASE form defines the master color palette for the entire devolution line
- DEVO1 MUST use the EXACT SAME colors as the base form (same primary color, same secondary color, same accent colors). Do NOT lighten, pastel-ify, or change hues. Only the shape simplifies — colors stay identical.
- DEVO2 MUST use the EXACT SAME colors as its devo1 parent (which are the same as base). Do NOT use pastel versions. A dark blue base = dark blue devo1 = dark blue devo2. Keep the original saturation and darkness.
- The image_prompt for devo1 and devo2 MUST explicitly state: "same color palette as wild form: [list the specific colors from base]"
- Example: if base is "dark navy blue body with crimson red accents and silver claws", then devo1 prompt must include "dark navy blue body with crimson red accents and silver claws" and devo2 must also include "dark navy blue body with crimson red accents"

- DEVO1 (tamed ally): REDUCED body part count — normal anatomy. The wild form's excess parts are merged/shed:
  * Eyes reduced to 2, limbs to 4, tail to 1, wings to 2 or 0, horns to 2 or 0
  * Same creature but with a clean, organized body plan. Like fully evolved starter Pokemon (Charizard, Greninja level)
  * MUST keep the EXACT same color palette as the base wild form — same hues, same saturation, same darkness
  * The visual contrast should clearly show "this creature lost its extra parts and became neater" while keeping identical colors
  * CRITICAL: image_prompt must be LONG and DETAILED (at least 40 words describing the creature). Include specific body shape, pose, texture, features. Short vague prompts cause the model to generate multiple copies. Describe ONE specific creature with concrete visual details.
- DEVO2 (final devolution): Maximum cute tiny creature. Round soft shapes, oversized head, big sparkly eyes, tiny body. Like Togepi, Igglybuff, Cleffa level cuteness. Previous stage's features miniaturized and adorable (tiny horns, small tail).
  * IMPORTANT: Avoid "chibi", "baby", "kawaii" in image_prompt. Instead use: "small round proportions, oversized head, big eyes, young small creature"
  * MUST keep the EXACT same color palette as its parent devo1 and the original base form — NO pastel, NO lightening, same dark/saturated colors on a tiny cute body
  * CRITICAL: image_prompt must be LONG and DETAILED (at least 40 words describing the creature). Describe specific body shape, face, limbs, texture. Short vague prompts cause the model to generate multiple copies. Describe ONE specific small creature with concrete visual details like "sitting pose, round belly, two small ears, stubby legs, looking forward".`;

const GENERATE_PROMPT = `Create 1 new monster with full devolution tree and game-ready data.

Requirements:
- Base form (wild enemy) with stats + reactions
- 3 devolution level 1 variations (ally forms with 3 skills each)
- 2 devolution level 2 variations per level 1 (6 total, final cute forms)

Respond with ONLY this JSON (fill ALL fields with creative real content):

{"base":{"name_kr":"Korean name","name_en":"snake_case_id","desc_kr":"1-line Korean description","element":"element keyword","sensoryType":["axis1","axis2"],"personality":"one of: aggressive/timid/curious/stubborn","attackPower":5,"tamingThreshold":65,"escapeThreshold":80,"image_prompt":"pokemon official art style, ken sugimori style, [FILL extremely detailed chaotic wild appearance with multiple appendages horns spikes tendrils, layered textures scales fur crystals glowing veins, elaborate swirling patterns bioluminescent markings, environmental debris clinging to body, asymmetric features, ornamental crests flowing energy trails, dark complex color palette with multiple accent colors], menacing dark pokemon, maximum visual complexity, overly decorated fierce creature, sharp features, bold outlines, cel-shaded, vibrant saturated colors, dark color palette, solo, white background, simple clean background, full body, facing left, front three-quarter view, game sprite, transparent background","reactions":{"sound_good":"Korean reaction","sound_bad":"Korean reaction","temp_good":"Korean reaction","temp_bad":"Korean reaction","smell_good":"Korean reaction","smell_bad":"Korean reaction","behav_good":"Korean reaction","behav_bad":"Korean reaction","attack":"Korean attack description!","calm":"Korean calm description."}},"devolutions_1":[{"name_kr":"Korean name","name_en":"snake_case_id","desc_kr":"Korean desc","hp":28,"maxHp":28,"stats":{"gentleness":5,"empathy":5,"resilience":5,"agility":5},"devolvedName":"Korean devolved name","devolvedDesc":"Korean devolved desc","devolvedStats":{"gentleness":10,"empathy":3,"resilience":3,"agility":4},"image_prompt":"pokemon official art style, ken sugimori style, single creature only, one character, solo, [FILL 40+ words: describe a specific streamlined wolf/dragon/beast creature in detail - body shape, face, limbs, pose, texture, features. Use SAME EXACT COLORS as base form. Example: 'sleek quadruped wolf with smooth dark navy blue fur, two pointed ears, two sharp red eyes, silver chest plate, muscular legs, one long tail, standing alert pose'], reduced body parts two eyes four limbs one tail, bold outlines, cel-shaded, solo, white background, simple clean background, full body, facing left, front three-quarter view, game sprite, transparent background","actions":[{"id":"skill_id","name":"Korean skill name","axis":"sound","category":"stimulate","power":12,"escapeRisk":3,"pp":8,"maxPp":8,"effects":[{"type":"calm","chance":0.2,"turns":2}],"log":"Korean action description."},{"id":"skill_id","name":"Korean skill name","axis":"behavior","category":"defend","power":8,"escapeRisk":-3,"healAmount":5,"defenseBoost":2,"pp":6,"maxPp":6,"effects":[],"log":"Korean action description."},{"id":"skill_id","name":"Korean skill name","axis":"smell","category":"capture","power":15,"escapeRisk":12,"pp":3,"maxPp":3,"effects":[],"log":"Korean action description."}]},{"name_kr":"variation B name","name_en":"snake_case_b","desc_kr":"desc","hp":25,"maxHp":25,"stats":{"gentleness":6,"empathy":4,"resilience":4,"agility":6},"devolvedName":"devolved B","devolvedDesc":"desc","devolvedStats":{"gentleness":12,"empathy":2,"resilience":3,"agility":3},"image_prompt":"pokemon official art style, ken sugimori style, single creature only, one character, solo, [FILL 40+ words: describe a specific agile variant creature in detail - body shape, face, limbs, pose, texture. Use SAME EXACT COLORS as base form], reduced body parts two eyes four limbs one tail, bold outlines, cel-shaded, agile battle stance, solo, white background, simple clean background, full body, facing left, front three-quarter view, game sprite, transparent background","actions":[{"id":"b_skill1","name":"skill name","axis":"temperature","category":"stimulate","power":11,"escapeRisk":4,"pp":7,"maxPp":7,"effects":[{"type":"curious","chance":0.15,"turns":2}],"log":"action desc."},{"id":"b_skill2","name":"skill name","axis":"smell","category":"defend","power":6,"escapeRisk":-4,"healAmount":6,"defenseBoost":3,"pp":5,"maxPp":5,"effects":[],"log":"action desc."},{"id":"b_skill3","name":"skill name","axis":"behavior","category":"capture","power":14,"escapeRisk":11,"pp":3,"maxPp":3,"effects":[],"log":"action desc."}]},{"name_kr":"variation C name","name_en":"snake_case_c","desc_kr":"desc","hp":30,"maxHp":30,"stats":{"gentleness":4,"empathy":6,"resilience":6,"agility":4},"devolvedName":"devolved C","devolvedDesc":"desc","devolvedStats":{"gentleness":3,"empathy":3,"resilience":12,"agility":2},"image_prompt":"pokemon official art style, ken sugimori style, single creature only, one character, solo, [FILL 40+ words: describe a specific sturdy tank variant creature in detail - body shape, face, limbs, pose, texture. Use SAME EXACT COLORS as base form], reduced body parts two eyes four limbs one tail, bold outlines, cel-shaded, sturdy defensive pose, solo, white background, simple clean background, full body, facing left, front three-quarter view, game sprite, transparent background","actions":[{"id":"c_skill1","name":"skill name","axis":"sound","category":"stimulate","power":13,"escapeRisk":5,"pp":6,"maxPp":6,"effects":[{"type":"charmed","chance":0.1,"turns":3}],"log":"action desc."},{"id":"c_skill2","name":"skill name","axis":"temperature","category":"defend","power":5,"escapeRisk":-5,"healAmount":4,"defenseBoost":4,"pp":5,"maxPp":5,"effects":[{"type":"calm","chance":0.25,"turns":2}],"log":"action desc."},{"id":"c_skill3","name":"skill name","axis":"sound","category":"capture","power":16,"escapeRisk":14,"pp":2,"maxPp":2,"effects":[],"log":"action desc."}]}],"devolutions_2":[{"parent":"snake_case_id of devo1 parent","name_kr":"tiny name","name_en":"tiny_id_a1","desc_kr":"Korean desc","image_prompt":"pokemon official art style, ken sugimori style, single creature only, one character, solo, [FILL 40+ words: describe ONE specific tiny round creature sitting or standing. Include body shape face ears limbs tail in detail. Use SAME EXACT COLORS as base wild form. Example: 'tiny round dark navy blue pup sitting upright, round belly, two small pointed ears, two big red eyes, stubby four legs, short tail, silver chest marking'], small round proportions, oversized head, big sparkly eyes, bold outlines, cel-shaded, solo, white background, simple clean background, full body, facing left, front three-quarter view, game sprite, transparent background"},{"parent":"same parent","name_kr":"tiny name","name_en":"tiny_id_a2","desc_kr":"Korean desc","image_prompt":"pokemon official art style, ken sugimori style, single creature only, one character, solo, [FILL 40+ words: describe ONE specific tiny pudgy creature. Include body shape face ears limbs in detail. Use SAME EXACT COLORS as base wild form], small round proportions, pudgy round shape, oversized head, big innocent eyes, bold outlines, cel-shaded, solo, white background, simple clean background, full body, facing left, front three-quarter view, game sprite, transparent background"},{"parent":"snake_case_b","name_kr":"tiny name","name_en":"tiny_id_b1","desc_kr":"Korean desc","image_prompt":"pokemon official art style, ken sugimori style, single creature only, one character, solo, [FILL 40+ words: describe ONE specific tiny round creature from parent B. Include body shape face ears limbs in detail. Use SAME EXACT COLORS as base wild form], small round proportions, round soft body, oversized head, big eyes, bold outlines, cel-shaded, solo, white background, simple clean background, full body, facing left, front three-quarter view, game sprite, transparent background"},{"parent":"snake_case_b","name_kr":"tiny name","name_en":"tiny_id_b2","desc_kr":"Korean desc","image_prompt":"pokemon official art style, ken sugimori style, single creature only, one character, solo, [FILL 40+ words: describe ONE specific tiny blob creature from parent B. Include body shape face ears limbs in detail. Use SAME EXACT COLORS as base wild form], small round proportions, tiny limbs, oversized head, bold outlines, cel-shaded, solo, white background, simple clean background, full body, facing left, front three-quarter view, game sprite, transparent background"},{"parent":"snake_case_c","name_kr":"tiny name","name_en":"tiny_id_c1","desc_kr":"Korean desc","image_prompt":"pokemon official art style, ken sugimori style, single creature only, one character, solo, [FILL 40+ words: describe ONE specific tiny round creature from parent C. Include body shape face ears limbs in detail. Use SAME EXACT COLORS as base wild form], small round proportions, round shape, oversized head, sparkly eyes, bold outlines, cel-shaded, solo, white background, simple clean background, full body, facing left, front three-quarter view, game sprite, transparent background"},{"parent":"snake_case_c","name_kr":"tiny name","name_en":"tiny_id_c2","desc_kr":"Korean desc","image_prompt":"pokemon official art style, ken sugimori style, single creature only, one character, solo, [FILL 40+ words: describe ONE specific tiniest round creature from parent C. Include body shape face ears limbs in detail. Use SAME EXACT COLORS as base wild form], small round proportions, soft round body, oversized head, big happy eyes, bold outlines, cel-shaded, solo, white background, simple clean background, full body, facing left, front three-quarter view, game sprite, transparent background"}]}`;

async function callQwen(messages, temperature = 0.8) {
  const res = await fetch(`${CONFIG.LM_STUDIO_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CONFIG.TEXT_MODEL,
      messages,
      temperature,
      max_tokens: 16384,
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

  if (lastBrace === -1) {
    // 불완전한 JSON 복구 시도: 남은 괄호를 닫아줌
    console.warn(`[extractJSON] JSON 불완전 (depth: ${depth}), 복구 시도...`);
    let truncated = cleaned.substring(firstBrace);
    // 마지막 불완전한 문자열/값 제거
    truncated = truncated.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*$/, '');
    truncated = truncated.replace(/,\s*\{[^}]*$/, '');
    truncated = truncated.replace(/,\s*\[[^\]]*$/, '');
    truncated = truncated.replace(/,\s*$/, '');
    // 남은 depth만큼 괄호 닫기
    for (let d = 0; d < depth; d++) {
      // 배열 안이면 ] 먼저, 객체면 }
      if (truncated.match(/\[\s*(\{[^}]*,?\s*)*$/)) {
        truncated += ']}';
      } else {
        truncated += '}';
      }
    }
    try {
      return JSON.parse(truncated);
    } catch (e) {
      throw new Error(`JSON 복구 실패. max_tokens를 늘려보세요. 원본 마지막 200자:\n${text.substring(text.length - 200)}`);
    }
  }

  const jsonStr = cleaned.substring(firstBrace, lastBrace + 1);
  return JSON.parse(jsonStr);
}

// roster 데이터를 기반으로 LLM에게 보강 요청 (이미지 프롬프트 + 스킬 + 반응 텍스트)
function buildRosterPrompt(rosterData) {
  const w = rosterData.wild;
  const d1List = rosterData.devo1;
  const d2Count = rosterData.devo2_per_devo1;

  return `Based on this pre-defined monster roster, generate the complete game data with image prompts, skills, and reaction texts.

ROSTER DATA:
- Wild: ${w.name_kr} (${w.name_en}) - ${w.desc_kr}
- Sensory: ${w.sensoryType.join(', ')} | Personality: ${w.personality} | Habitat: ${w.habitat}
- Stats: gentleness ${w.stats.gentleness}, empathy ${w.stats.empathy}, resilience ${w.stats.resilience}, agility ${w.stats.agility}
- HP: ${w.hp} | Attack: ${w.attackPower} | Taming: ${w.tamingThreshold} | Escape: ${w.escapeThreshold}

Devo1 variants (${d1List.length}):
${d1List.map((d, i) => `  ${i}: ${d.name_kr} (${d.name_en}) [${d.role}] HP:${d.hp} - ${d.desc_kr}
     Stats: G${d.stats.gentleness} E${d.stats.empathy} R${d.stats.resilience} A${d.stats.agility}
     Skills: ${d.skillFocus}`).join('\n')}

Each devo1 gets ${d2Count} devo2 baby forms.

Generate JSON with:
1. base: wild form with image_prompt and reactions (Korean). Define the master color palette here (e.g. "dark navy blue body with crimson red accents").
2. devolutions_1: each with image_prompt + 3 actions. CRITICAL: each devo1 image_prompt MUST start with "pokemon official art style, ken sugimori style, single creature only, one character," and MUST copy-paste the EXACT color words from the base image_prompt. Add "reduced body parts two eyes four limbs one tail" to show simplification.
3. devolutions_2: ${d1List.length * d2Count} baby forms. CRITICAL: each devo2 image_prompt MUST start with "pokemon official art style, ken sugimori style, solo, single creature, one character," and MUST be at least 40 words long with specific body/face/limb details. Copy-paste the EXACT color words from the base form. Keep same dark saturated colors. Use "small round proportions, oversized head, sitting pose, stubby legs" for cuteness. Describe ONE specific creature. Only describe what IS in the image.

{"base":{"name_en":"${w.name_en}","name_kr":"${w.name_kr}","desc_kr":"${w.desc_kr}","sensoryType":${JSON.stringify(w.sensoryType)},"personality":"${w.personality}","attackPower":${w.attackPower},"tamingThreshold":${w.tamingThreshold},"escapeThreshold":${w.escapeThreshold},"hp":${w.hp},"stats":${JSON.stringify(w.stats)},"image_prompt":"pokemon official art style, ken sugimori style, [FILL detailed fierce appearance for ${w.name_kr}], menacing dark pokemon, sharp features, bold outlines, cel-shaded, vibrant colors, dark color palette, solo, white background, simple clean background, full body, facing left, front three-quarter view, game sprite, transparent background","reactions":{"sound_good":"FILL Korean","sound_bad":"FILL Korean","temp_good":"FILL Korean","temp_bad":"FILL Korean","smell_good":"FILL Korean","smell_bad":"FILL Korean","behav_good":"FILL Korean","behav_bad":"FILL Korean","attack":"FILL Korean!","calm":"FILL Korean."}},"devolutions_1":[FILL each devo1 with image_prompt + actions array of 3 skills],"devolutions_2":[FILL ${d1List.length * d2Count} baby forms]}`;
}

export async function generateMonsterConcept(rosterData) {
  const isRosterMode = !!rosterData;
  console.log(`[Concept Agent] ${isRosterMode ? 'roster 기반' : '랜덤'} 컨셉 보강 중...`);

  let userPrompt;
  if (isRosterMode) {
    userPrompt = buildRosterPrompt(rosterData);
  } else {
    userPrompt = GENERATE_PROMPT;
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];

  const raw = await callQwen(messages);
  console.log(`[Concept Agent] 응답 수신 (${raw.length}자), JSON 파싱 중...`);

  const concept = extractJSON(raw);

  // 검증
  if (!concept.base) {
    throw new Error('컨셉 JSON에 base가 없습니다.');
  }

  // 스킬 검증
  if (concept.devolutions_1) {
    for (const devo of concept.devolutions_1) {
      if (!devo.actions || devo.actions.length !== 3) {
        console.warn(`[Concept Agent] ${devo.name_en || '?'}: 스킬 ${devo.actions?.length || 0}개 (기대: 3)`);
      }
    }
  }

  // 모든 이미지 프롬프트 폼 수집
  const allForms = [
    { ...concept.base, type: 'base' },
    ...(concept.devolutions_1 || []).map((d, i) => ({ ...d, type: `devo1_${i}` })),
    ...(concept.devolutions_2 || []).map((d, i) => ({ ...d, type: `devo2_${i}` })),
  ];

  console.log(`[Concept Agent] 컨셉 완료: ${concept.base.name_kr}`);
  console.log(`  - 기본형: ${concept.base.name_kr} (${concept.base.name_en})`);
  (concept.devolutions_1 || []).forEach((d, i) => {
    console.log(`  - 퇴화1-${String.fromCharCode(65 + i)}: ${d.name_kr || '?'} (${d.name_en || '?'})`);
    d.actions?.forEach(a => console.log(`      [${a.category}] ${a.name} (${a.axis}) pow:${a.power} esc:${a.escapeRisk} pp:${a.pp}`));
  });
  (concept.devolutions_2 || []).forEach((d, i) =>
    console.log(`  - 퇴화2-${i}: ${d.name_kr || '?'} (${d.name_en || '?'}) ← ${d.parent || '?'}`)
  );

  return { concept, allForms };
}
