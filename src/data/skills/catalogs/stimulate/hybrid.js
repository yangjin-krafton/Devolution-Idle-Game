import { defineSkill } from '../../core/schema.js';

const AXIS_META = {
  sound: {
    prefix: '공명',
    effect: 'calm',
    comboEffect: 'trust',
  },
  temperature: {
    prefix: '열기',
    effect: 'curious',
    comboEffect: 'calm',
  },
  smell: {
    prefix: '향기',
    effect: 'charmed',
    comboEffect: 'curious',
  },
  behavior: {
    prefix: '본능',
    effect: 'trust',
    comboEffect: 'charmed',
  },
};

const TEMPLATES = [
  {
    suffix: 'cadence',
    label: '박자',
    role: 'basic_stimulate',
    power: 8,
    pp: 7,
    escapeRisk: 3,
    effects: meta => [{ type: meta.effect, chance: 0.22 }],
    logFn: meta => `${meta.prefix}의 박자로 리듬을 맞춘다.`,
    summary: meta => `${meta.effect} 22%`,
  },
  {
    suffix: 'hush',
    label: '달래기',
    role: 'emotion_setup',
    power: 7,
    pp: 7,
    escapeRisk: 2,
    effects: meta => [{ type: 'calm', chance: 0.3 }],
    stateBonus: { ifEnemyEmotion: 'rage', tamingPowerBonus: 2 },
    logFn: meta => `${meta.prefix}으로 부드럽게 달랜다.`,
    summary: () => 'calm 30%, bonus vs rage',
  },
  {
    suffix: 'spiral',
    label: '소용돌이',
    role: 'emotion_setup',
    power: 9,
    pp: 6,
    escapeRisk: 3,
    effects: meta => [{ type: meta.comboEffect, chance: 0.18 }],
    stateBonus: meta => ({ ifEnemyEmotion: meta.effect, tamingPowerBonus: 3 }),
    logFn: meta => `${meta.prefix}의 소용돌이로 감각을 흔든다.`,
    summary: meta => `${meta.comboEffect} 18%, combo on ${meta.effect}`,
  },
  {
    suffix: 'spark',
    label: '불꽃',
    role: 'high_risk_stimulate',
    power: 12,
    pp: 5,
    escapeRisk: 6,
    effects: () => [{ type: 'curious', chance: 0.2 }],
    logFn: meta => `${meta.prefix}의 불꽃을 세차게 터뜨린다.`,
    summary: () => 'curious 20%',
  },
  {
    suffix: 'tether',
    label: '연결고리',
    role: 'swap_setup',
    priority: 1,
    power: 6,
    pp: 5,
    escapeRisk: 1,
    effects: meta => [{ type: meta.effect, chance: 0.15 }],
    swapSynergy: { onSwapIn: { tamingBonus: 3 } },
    logFn: meta => `${meta.prefix}의 연결고리를 남긴다.`,
    summary: meta => `${meta.effect} 15%, swap in bonus`,
  },
  {
    suffix: 'veil',
    label: '장막',
    role: 'emotion_setup',
    power: 8,
    pp: 6,
    escapeRisk: 2,
    effects: meta => [{ type: meta.comboEffect, chance: 0.14 }],
    logFn: meta => `${meta.prefix}의 장막을 드리운다.`,
    summary: meta => `${meta.comboEffect} 14%`,
  },
  {
    suffix: 'sweep',
    label: '휩쓸기',
    role: 'basic_stimulate',
    power: 10,
    pp: 6,
    escapeRisk: 4,
    effects: () => [{ type: 'calm', chance: 0.18 }],
    logFn: meta => `${meta.prefix}으로 주변을 휩쓴다.`,
    summary: () => 'calm 18%',
  },
  {
    suffix: 'lure',
    label: '유인',
    role: 'emotion_setup',
    power: 10,
    pp: 5,
    escapeRisk: 4,
    effects: meta => [{ type: meta.effect, chance: 0.24 }],
    logFn: meta => `${meta.prefix}으로 천천히 유인한다.`,
    summary: meta => `${meta.effect} 24%`,
  },
  {
    suffix: 'surge',
    label: '쇄도',
    role: 'high_risk_stimulate',
    power: 13,
    pp: 4,
    escapeRisk: 7,
    condition: { maxEscapePercent: 75 },
    effects: () => [{ type: 'rage', chance: 0.12 }],
    logFn: meta => `${meta.prefix}의 기세를 한꺼번에 밀어붙인다.`,
    summary: () => 'rage 12%, escape <= 75%',
  },
  {
    suffix: 'bridge',
    label: '다리놓기',
    role: 'swap_setup',
    priority: 1,
    power: 7,
    pp: 5,
    escapeRisk: 1,
    effects: () => [{ type: 'curious', chance: 0.16 }],
    swapSynergy: { onSwapOut: { enemyEmotion: 'curious', chance: 0.25 } },
    logFn: meta => `${meta.prefix}으로 다음 동료에게 다리를 놓는다.`,
    summary: () => 'curious 16%, swap out combo',
  },
  {
    suffix: 'bloom',
    label: '만개',
    role: 'emotion_setup',
    power: 9,
    pp: 5,
    escapeRisk: 3,
    effects: meta => [{ type: meta.comboEffect, chance: 0.2 }],
    stateBonus: meta => ({ ifEnemyEmotion: meta.comboEffect, tamingPowerBonus: 2 }),
    logFn: meta => `${meta.prefix}을 만개시켜 감각을 깨운다.`,
    summary: meta => `${meta.comboEffect} 20%, same-emotion bonus`,
  },
];

function resolveValue(value, meta) {
  return typeof value === 'function' ? value(meta) : value;
}

const hybridSkills = Object.fromEntries(
  Object.entries(AXIS_META).flatMap(([axis, meta]) =>
    TEMPLATES.map(template => {
      const id = `${axis}-${template.suffix}`;
      return [
        id,
        defineSkill(id, {
          name: `${meta.prefix} ${template.label}`,
          category: 'stimulate',
          role: template.role,
          axis,
          priority: template.priority,
          power: template.power,
          pp: template.pp,
          escapeRisk: template.escapeRisk,
          effects: resolveValue(template.effects, meta),
          condition: resolveValue(template.condition, meta),
          stateBonus: resolveValue(template.stateBonus, meta),
          swapSynergy: resolveValue(template.swapSynergy, meta),
          log: template.logFn(meta),
          desc: template.logFn(meta),
          tags: [axis, 'stimulate', 'hybrid', template.role],
        }),
      ];
    })
  )
);

export const STIMULATE_HYBRID_SUMMARY = Object.fromEntries(
  Object.entries(AXIS_META).flatMap(([axis, meta]) =>
    TEMPLATES.map(template => [`${axis}-${template.suffix}`, template.summary(meta)])
  )
);

export default hybridSkills;
