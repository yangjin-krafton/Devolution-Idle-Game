// ============================================================
// Enemy AI — 성격 시스템 + 순화 단계별 행동 분기
// ============================================================

// 적 성격 타입 정의
export const PERSONALITY = {
  aggressive: {
    id: 'aggressive', name: '공격적',
    attackMod: 1.3, rageChance: 0.4, calmResist: 0.5,
    skipBase: 0, aoeMod: 1.3, naturalEscape: 6,
  },
  timid: {
    id: 'timid', name: '겁많은',
    attackMod: 0.8, rageChance: 0.1, calmResist: 0,
    skipBase: 0.1, aoeMod: 0.5, naturalEscape: 8,
  },
  curious: {
    id: 'curious', name: '호기심',
    attackMod: 1.0, rageChance: 0.15, calmResist: 0,
    skipBase: 0.25, aoeMod: 0.8, naturalEscape: 5,
  },
  stubborn: {
    id: 'stubborn', name: '완고',
    attackMod: 1.1, rageChance: 0.2, calmResist: 0.3,
    skipBase: 0.05, aoeMod: 1.0, naturalEscape: 6,
  },
};

// 순화 단계 정의
const TAMING_STAGES = [
  { min: 0,  max: 30,  id: 'wary',     name: '경계',     atkScale: 1.0, skipChance: 0 },
  { min: 30, max: 60,  id: 'wavering', name: '동요',     atkScale: 0.7, skipChance: 0.2 },
  { min: 60, max: 80,  id: 'interest', name: '관심',     atkScale: 0.4, skipChance: 0.4 },
  { min: 80, max: 999, id: 'bonding',  name: '교감 가능', atkScale: 0.1, skipChance: 0.8 },
];

export function getTamingStage(tamingPct) {
  for (const s of TAMING_STAGES) {
    if (tamingPct >= s.min && tamingPct < s.max) return s;
  }
  return TAMING_STAGES[TAMING_STAGES.length - 1];
}

// 적 행동 결정: 공격 / 스킵 / 발악
export function decideEnemyAction(enemy, tamingPct, escapePct, emotionMods) {
  const personality = PERSONALITY[enemy.personality] || PERSONALITY.curious;
  const stage = getTamingStage(tamingPct);

  // 도주 80%+ → 발악 강공 (50%) or 도주 시도 (50%)
  if (escapePct >= 80) {
    if (Math.random() < 0.5) {
      return { type: 'rage_attack', atkScale: 1.8, log: `${enemy.name}이(가) 필사적으로 발악한다!` };
    }
    return { type: 'flee_attempt', atkScale: 0, log: `${enemy.name}이(가) 도망치려 몸을 돌린다!` };
  }

  // 스킵 확률 = 기본 스킵 + 성격 스킵 + 감정 보정
  const skipChance = stage.skipChance + personality.skipBase;
  if (Math.random() < skipChance) {
    return getSkipAction(enemy, stage);
  }

  // 공격
  const atkScale = stage.atkScale * personality.attackMod * emotionMods.attackMod;
  return { type: 'attack', atkScale, log: null }; // log null → 기본 attack reaction 사용
}

// 스킵 행동 (순화 단계별 다른 메시지)
function getSkipAction(enemy, stage) {
  const msgs = {
    wary:     [`${enemy.name}이(가) 경계하며 주위를 살핀다.`],
    wavering: [`${enemy.name}이(가) 잠시 멈추고 이쪽을 본다.`, `${enemy.name}이(가) 고개를 갸웃거린다.`],
    interest: [`${enemy.name}이(가) 한 발짝 다가왔다.`, `${enemy.name}이(가) 코를 킁킁거리며 관찰한다.`],
    bonding:  [`${enemy.name}이(가) 가만히 곁에 머문다.`, `${enemy.name}이(가) 조용히 앉아 있다.`],
  };
  const pool = msgs[stage.id] || msgs.wary;
  const log = pool[Math.floor(Math.random() * pool.length)];
  return { type: 'skip', atkScale: 0, log };
}

// 광역 vs 단일 판정
export function decideTargeting(enemy, aliveCount, personality) {
  const p = PERSONALITY[personality] || PERSONALITY.curious;
  const aoeChance = aliveCount >= 2 ? 0.2 * p.aoeMod : 0;
  return Math.random() < aoeChance ? 'aoe' : 'single';
}

// 적 공격력 계산 (순화 단계 + 감정 보정 반영)
export function calcEnemyDamage(basePower, atkScale, defenseBoost) {
  const raw = Math.round(basePower * atkScale) + Math.floor(Math.random() * 3) - 1;
  return Math.max(1, raw - defenseBoost);
}

// 적 광역 공격력 계산
export function calcAoeDamage(basePower, atkScale, defenseBoost) {
  const raw = Math.round(basePower * 0.5 * atkScale);
  return Math.max(1, raw - defenseBoost);
}
