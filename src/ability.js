// ============================================================
// Ability System — 아군 몬스터 패시브 어빌리티
// ============================================================

// 어빌리티 카탈로그
// trigger: turnEnd, turnStart, onStimulate, onCapture, onDefend, onAllyDamaged
export const ABILITIES = {
  // ---- 기본 (devo1) 어빌리티 ----
  gentle_wave: {
    id: 'gentle_wave', name: '잔잔한 물결',
    desc: '매 턴 도주 게이지 -2',
    trigger: 'turnEnd',
    effect: { escapeReduce: 2 },
  },
  keen_nose: {
    id: 'keen_nose', name: '예민한 코',
    desc: '냄새 자극 시 순화 +15% 추가',
    trigger: 'onStimulate',
    effect: { axisTamingBonus: { smell: 0.15 } },
  },
  warm_body: {
    id: 'warm_body', name: '따뜻한 체온',
    desc: '온도 자극 시 진정 확률 20%',
    trigger: 'onStimulate',
    effect: { axisEmotionChance: { temperature: { type: 'calm', chance: 0.2 } } },
  },
  sharp_eye: {
    id: 'sharp_eye', name: '날카로운 눈',
    desc: '포획 시도 시 성공률 +10%',
    trigger: 'onCapture',
    effect: { captureBonus: 0.1 },
  },
  thick_hide: {
    id: 'thick_hide', name: '두꺼운 가죽',
    desc: '피해를 받을 때 -2 경감',
    trigger: 'onAllyDamaged',
    effect: { damageReduce: 2 },
  },
  echo_sense: {
    id: 'echo_sense', name: '반향 감각',
    desc: '소리 자극 시 호기심 확률 20%',
    trigger: 'onStimulate',
    effect: { axisEmotionChance: { sound: { type: 'curious', chance: 0.2 } } },
  },

  // ---- 퇴화 (devo2) 어빌리티 ----
  tiny_steps: {
    id: 'tiny_steps', name: '조그만 발걸음',
    desc: '매 턴 순화 +3',
    trigger: 'turnEnd',
    effect: { tamingGain: 3 },
  },
  soft_cry: {
    id: 'soft_cry', name: '부드러운 울음',
    desc: '매 턴 적 공격력 -10%',
    trigger: 'turnStart',
    effect: { enemyAtkReduce: 0.1 },
  },
  lucky_charm: {
    id: 'lucky_charm', name: '행운의 부적',
    desc: '포획 시도 시 성공률 +15%',
    trigger: 'onCapture',
    effect: { captureBonus: 0.15 },
  },
  resilient_spirit: {
    id: 'resilient_spirit', name: '불굴의 정신',
    desc: '수비 시 HP 5 추가 회복',
    trigger: 'onDefend',
    effect: { healBonus: 5 },
  },
  calming_aura: {
    id: 'calming_aura', name: '안정의 기운',
    desc: '분노 상태일 때 해제 확률 30%',
    trigger: 'turnEnd',
    effect: { clearEmotionChance: { rage: 0.3 } },
  },
  bond_sense: {
    id: 'bond_sense', name: '유대 감각',
    desc: '신뢰 상태에서 순화 효율 ×1.5',
    trigger: 'onStimulate',
    effect: { emotionTamingMod: { trust: 1.5 } },
  },
};

// 역할(role) 기반 어빌리티 자동 배정
// devo1 / devo2 각각 역할별 기본 어빌리티
const ROLE_ABILITIES = {
  devo1: {
    attacker:  'keen_nose',       // 냄새 자극 순화 보너스
    tank:      'thick_hide',      // 피해 경감
    support:   'gentle_wave',     // 매 턴 도주 감소
    speedster: 'sharp_eye',       // 포획 성공률 보너스
    default:   'echo_sense',      // 소리 자극 호기심 유발
  },
  devo2: {
    attacker:  'bond_sense',      // 신뢰 시 순화 효율 증가
    tank:      'resilient_spirit', // 수비 시 추가 회복
    support:   'calming_aura',    // 분노 해제 확률
    speedster: 'lucky_charm',     // 포획 성공률 대폭 보너스
    default:   'tiny_steps',      // 매 턴 순화 소량 증가
  },
};

// 역할 기반 어빌리티 자동 결정
export function resolveAbility(monster) {
  // 이미 명시적으로 지정된 경우 우선
  if (monster.ability) return monster.ability;

  const role = monster.role || 'default';
  const isDevo2 = monster.parentDevo1 != null;
  const tier = isDevo2 ? 'devo2' : 'devo1';
  return ROLE_ABILITIES[tier][role] || ROLE_ABILITIES[tier].default;
}

// 어빌리티 조회
export function getAbility(id) {
  return ABILITIES[id] || null;
}

// 팀의 특정 트리거 어빌리티 수집
export function collectAbilities(team, trigger) {
  const results = [];
  for (let i = 0; i < team.length; i++) {
    const ally = team[i];
    if (!ally || ally.inEgg) continue;
    const abilityId = ally.ability;
    if (!abilityId) continue;
    const ability = ABILITIES[abilityId];
    if (!ability || ability.trigger !== trigger) continue;
    results.push({ allyIdx: i, ally, ability });
  }
  return results;
}

// turnEnd / turnStart 어빌리티 적용
export function applyPassiveAbilities(team, trigger, context) {
  const entries = collectAbilities(team, trigger);
  const logs = [];

  for (const { ally, ability } of entries) {
    const eff = ability.effect;

    if (eff.escapeReduce && context.escapeGauge != null) {
      context.escapeGauge = Math.max(0, context.escapeGauge - eff.escapeReduce);
      logs.push(`${ally.name}의 ${ability.name} — 도주 위험이 줄어든다.`);
    }

    if (eff.tamingGain && context.tamingGauge != null) {
      context.tamingGauge += eff.tamingGain;
      logs.push(`${ally.name}의 ${ability.name} — 순화가 조금 진행된다.`);
    }

    if (eff.enemyAtkReduce != null) {
      context.enemyAtkMod = (context.enemyAtkMod || 1) - eff.enemyAtkReduce;
      logs.push(`${ally.name}의 ${ability.name} — 적의 기세가 약해진다.`);
    }

    if (eff.clearEmotionChance && context.emotionState) {
      for (const [emotionType, chance] of Object.entries(eff.clearEmotionChance)) {
        if (context.emotionState.type === emotionType && Math.random() < chance) {
          context.emotionState.type = null;
          context.emotionState.turnsLeft = 0;
          logs.push(`${ally.name}의 ${ability.name} — 적의 ${emotionType} 상태가 풀렸다!`);
        }
      }
    }
  }

  return logs;
}

// 자극 시 발동 어빌리티 보정값 계산
export function getStimulateAbilityMods(team, action, emotionType) {
  const entries = collectAbilities(team, 'onStimulate');
  let tamingMod = 1.0;

  for (const { ability } of entries) {
    const eff = ability.effect;

    // 축별 순화 보너스
    if (eff.axisTamingBonus && eff.axisTamingBonus[action.axis]) {
      tamingMod += eff.axisTamingBonus[action.axis];
    }

    // 감정 상태에 따른 순화 배율
    if (eff.emotionTamingMod && eff.emotionTamingMod[emotionType]) {
      tamingMod *= eff.emotionTamingMod[emotionType];
    }
  }

  return { tamingMod };
}

// 자극 시 감정 유발 어빌리티 체크
export function checkStimulateEmotionAbility(team, action) {
  const entries = collectAbilities(team, 'onStimulate');
  for (const { ability } of entries) {
    const eff = ability.effect;
    if (eff.axisEmotionChance && eff.axisEmotionChance[action.axis]) {
      const { type, chance } = eff.axisEmotionChance[action.axis];
      if (Math.random() < chance) return { type, chance: 1.0 }; // 이미 확률 통과
    }
  }
  return null;
}

// 포획 시 어빌리티 보정
export function getCaptureAbilityBonus(team) {
  const entries = collectAbilities(team, 'onCapture');
  let bonus = 0;
  for (const { ability } of entries) {
    bonus += ability.effect.captureBonus || 0;
  }
  return bonus;
}

// 수비 시 어빌리티 보정
export function getDefendAbilityBonus(team, ally) {
  const entries = collectAbilities(team, 'onDefend');
  let healBonus = 0;
  for (const { ability, ally: a } of entries) {
    if (a === ally) healBonus += ability.effect.healBonus || 0;
  }
  return { healBonus };
}

// 피해 경감 어빌리티
export function getDamageReduceAbility(team, targetAlly) {
  const entries = collectAbilities(team, 'onAllyDamaged');
  let reduce = 0;
  for (const { ability, ally } of entries) {
    if (ally === targetAlly) reduce += ability.effect.damageReduce || 0;
  }
  return reduce;
}
