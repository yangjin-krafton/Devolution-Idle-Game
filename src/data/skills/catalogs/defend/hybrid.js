import { defineSkill } from '../../core/schema.js';

const AXIS_META = {
  sound: {
    prefix: '공명',
    effect: 'calm',
  },
  temperature: {
    prefix: '열기',
    effect: 'curious',
  },
  smell: {
    prefix: '향기',
    effect: 'trust',
  },
  behavior: {
    prefix: '본능',
    effect: 'calm',
  },
};

const TEMPLATES = [
  {
    suffix: 'ward',
    label: '보호막',
    role: 'guard',
    targetType: 'ally_team',
    priority: 2,
    power: 5,
    pp: 5,
    escapeRisk: -5,
    healAmount: 3,
    defenseBoost: 5,
    effects: meta => [{ type: meta.effect, chance: 0.18 }],
    logFn: meta => `${meta.prefix} 보호막으로 아군을 지킨다.`,
    summary: meta => `heal 3 / def 5, ${meta.effect} 18%`,
  },
  {
    suffix: 'shelter',
    label: '은신처',
    role: 'stabilize',
    targetType: 'ally_team',
    priority: 1,
    power: 4,
    pp: 5,
    escapeRisk: -6,
    healAmount: 4,
    defenseBoost: 4,
    effects: () => [{ type: 'calm', chance: 0.22 }],
    logFn: meta => `${meta.prefix} 은신처를 만들어 숨을 고른다.`,
    summary: () => 'heal 4 / def 4, calm 22%',
  },
  {
    suffix: 'mend',
    label: '치유',
    role: 'heal',
    targetType: 'self',
    power: 4,
    pp: 4,
    escapeRisk: -3,
    healAmount: 8,
    defenseBoost: 2,
    effects: () => [{ type: 'trust', chance: 0.1 }],
    logFn: meta => `${meta.prefix}으로 상처를 치유한다.`,
    summary: () => 'heal 8 / def 2',
  },
  {
    suffix: 'pivot',
    label: '전환 방어',
    role: 'swap_guard',
    targetType: 'ally_team',
    priority: 2,
    power: 3,
    pp: 4,
    escapeRisk: -5,
    healAmount: 4,
    defenseBoost: 5,
    swapSynergy: { onSwapIn: { defenseBonus: 3, tamingBonus: 2 } },
    logFn: meta => `${meta.prefix}으로 전열을 재정비한다.`,
    summary: () => 'heal 4 / def 5, swap in bonus',
  },
  {
    suffix: 'reserve',
    label: '비축',
    role: 'stabilize',
    targetType: 'ally_team',
    priority: 1,
    power: 5,
    pp: 4,
    escapeRisk: -7,
    healAmount: 2,
    defenseBoost: 6,
    effects: meta => [{ type: meta.effect, chance: 0.14 }],
    logFn: meta => `${meta.prefix}을 비축해 방어를 굳힌다.`,
    summary: meta => `heal 2 / def 6, ${meta.effect} 14%`,
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
          category: 'defend',
          role: template.role,
          axis,
          targetType: template.targetType,
          priority: template.priority,
          power: template.power,
          pp: template.pp,
          escapeRisk: template.escapeRisk,
          healAmount: template.healAmount,
          defenseBoost: template.defenseBoost,
          effects: resolveValue(template.effects, meta),
          swapSynergy: resolveValue(template.swapSynergy, meta),
          log: template.logFn(meta),
          desc: template.logFn(meta),
          tags: [axis, 'defend', 'hybrid', template.role],
        }),
      ];
    })
  )
);

export const DEFEND_HYBRID_SUMMARY = Object.fromEntries(
  Object.entries(AXIS_META).flatMap(([axis, meta]) =>
    TEMPLATES.map(template => [`${axis}-${template.suffix}`, template.summary(meta)])
  )
);

export default hybridSkills;
