// ============================================================
// Skill Generation from axis-category keys
// ============================================================

const SKILL_NAMES = {
  'sound-stimulate': '공명 울음', 'sound-capture': '소리 교감', 'sound-defend': '음파 방벽',
  'temperature-stimulate': '온기 전달', 'temperature-capture': '온도 교감', 'temperature-defend': '온도 보호',
  'smell-stimulate': '향기 유혹', 'smell-capture': '향기 교감', 'smell-defend': '향기 치유',
  'behavior-stimulate': '부드러운 접근', 'behavior-capture': '행동 교감', 'behavior-defend': '행동 수비',
};

const SKILL_LOGS = {
  'sound-stimulate': '음파로 순화도를 올린다.', 'sound-capture': '소리로 교감을 시도한다!', 'sound-defend': '음파 방벽으로 아군을 지킨다.',
  'temperature-stimulate': '온기로 순화도를 올린다.', 'temperature-capture': '온도를 맞추며 교감한다!', 'temperature-defend': '온도를 조절해 아군을 보호한다.',
  'smell-stimulate': '향기로 순화도를 올린다.', 'smell-capture': '향기로 교감을 시도한다!', 'smell-defend': '향기로 아군을 치유한다.',
  'behavior-stimulate': '행동으로 순화도를 올린다.', 'behavior-capture': '행동으로 교감을 시도한다!', 'behavior-defend': '행동으로 아군을 수비한다.',
};

const SKILL_BASE = {
  stimulate: { power: 9, escapeRisk: 4, pp: 8, maxPp: 8, effects: [{ type: 'calm', chance: 0.2, turns: 2 }] },
  capture:   { power: 15, escapeRisk: 12, pp: 3, maxPp: 3, effects: [] },
  defend:    { power: 6, escapeRisk: -4, healAmount: 5, defenseBoost: 3, pp: 6, maxPp: 6, effects: [] },
};

export function makeSkill(key) {
  const clean = key.replace(/\(.*\)/, '').trim();
  const [axis, category] = clean.split('-');
  const base = SKILL_BASE[category];
  return { id: clean.replace('-', '_'), name: SKILL_NAMES[clean], axis, category, ...base, log: SKILL_LOGS[clean] };
}

export function makeActions(skillKeys) {
  return skillKeys.map(k => makeSkill(k));
}
