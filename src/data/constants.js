// ============================================================
// Shared Constants
// ============================================================

export const SENSORY_AXES = ['sound', 'temperature', 'smell', 'behavior'];

export const SENSORY_EFFECTIVENESS = {
  sound:       { sound: 1.0, temperature: 0.5, smell: 1.0, behavior: 1.5 },
  temperature: { sound: 1.5, temperature: 1.0, smell: 0.5, behavior: 1.0 },
  smell:       { sound: 1.0, temperature: 1.5, smell: 1.0, behavior: 0.5 },
  behavior:    { sound: 0.5, temperature: 1.0, smell: 1.5, behavior: 1.0 },
};

export function calcSensoryMod(skillAxis, enemySensoryTypes) {
  if (!enemySensoryTypes || enemySensoryTypes.length === 0) return 1.0;
  let total = 0;
  for (const eType of enemySensoryTypes) {
    total += SENSORY_EFFECTIVENESS[skillAxis]?.[eType] ?? 1.0;
  }
  return total / enemySensoryTypes.length;
}

export const SKILL_CATEGORY = {
  stimulate: { id: 'stimulate', name: '자극', color: 'axis' },
  capture:   { id: 'capture',   name: '포획', color: 'orange' },
  defend:    { id: 'defend',    name: '수비', color: 'water' },
};

export const AXIS_LABEL = { sound: '소리', temperature: '온도', smell: '냄새', behavior: '행동' };

export const GENERIC_LOGS = {
  encounter: (name) => `야생 ${name}이(가) 나타났다!`,
  enemyAttack: (name, damage) => `${name}의 공격! ${damage}의 피해!`,
  allyFaint: (name) => `${name}이(가) 기절했다`,
  allFaint: '모든 아군이 쓰러졌다 게임 오버.',
  enemyEscape: (name) => `${name}이(가) 도망쳤다!`,
  tamingSuccess: (name) => `${name}과(와)의 교감에 성공했다!`,
  captureTooEarly: '아직 이르다 순화가 더 필요하다.',
  captureSuccess: (name) => `${name}이(가) 마음을 열었다!`,
  captureFail: '교감에 실패했다 도주 위험이 높아진다!',
  defendEffect: (name) => `${name}이(가) 아군을 보호한다.`,
  healEffect: (name, amount) => `${name}이(가) 체력을 ${amount} 회복했다.`,
  xpGain: (name, xp) => `${name}: 경험치 +1 (${xp})`,
  eggEnter: (name) => `${name}이(가) 알 상태에 들어갔다! 잠시 전투에 나설 수 없다.`,
  eggHatch: (name, newName) => `알에서 ${newName}이(가) 나왔다! ${name}이(가) 퇴화했다!`,
  emotionApply: (name, emotion) => `${name}이(가) ${emotion} 상태가 되었다!`,
  emotionExpire: (name, emotion) => `${name}의 ${emotion} 상태가 풀렸다.`,
  ppEmpty: (name) => `${name}은(는) 더 이상 쓸 수 없다!`,
};
