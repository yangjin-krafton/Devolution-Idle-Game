import { defineSkill } from '../../core/schema.js';

const AXIS_META = {
  sound: {
    prefix: 'Resonant',
    effect: 'calm',
  },
  temperature: {
    prefix: 'Thermal',
    effect: 'curious',
  },
  smell: {
    prefix: 'Aromatic',
    effect: 'trust',
  },
  behavior: {
    prefix: 'Instinctive',
    effect: 'calm',
  },
};

const TEMPLATES = [
  {
    suffix: 'ward',
    label: 'Ward',
    role: 'guard',
    targetType: 'ally_team',
    priority: 2,
    power: 5,
    pp: 5,
    escapeRisk: -5,
    healAmount: 3,
    defenseBoost: 5,
    effects: meta => [{ type: meta.effect, chance: 0.18 }],
    summary: meta => `heal 3 / def 5, ${meta.effect} 18%`,
  },
  {
    suffix: 'shelter',
    label: 'Shelter',
    role: 'stabilize',
    targetType: 'ally_team',
    priority: 1,
    power: 4,
    pp: 5,
    escapeRisk: -6,
    healAmount: 4,
    defenseBoost: 4,
    effects: () => [{ type: 'calm', chance: 0.22 }],
    summary: () => 'heal 4 / def 4, calm 22%',
  },
  {
    suffix: 'mend',
    label: 'Mend',
    role: 'heal',
    targetType: 'self',
    power: 4,
    pp: 4,
    escapeRisk: -3,
    healAmount: 8,
    defenseBoost: 2,
    effects: () => [{ type: 'trust', chance: 0.1 }],
    summary: () => 'heal 8 / def 2',
  },
  {
    suffix: 'pivot',
    label: 'Pivot',
    role: 'swap_guard',
    targetType: 'ally_team',
    priority: 2,
    power: 3,
    pp: 4,
    escapeRisk: -5,
    healAmount: 4,
    defenseBoost: 5,
    swapSynergy: { onSwapIn: { defenseBonus: 3, tamingBonus: 2 } },
    summary: () => 'heal 4 / def 5, swap in bonus',
  },
  {
    suffix: 'reserve',
    label: 'Reserve',
    role: 'stabilize',
    targetType: 'ally_team',
    priority: 1,
    power: 5,
    pp: 4,
    escapeRisk: -7,
    healAmount: 2,
    defenseBoost: 6,
    effects: meta => [{ type: meta.effect, chance: 0.14 }],
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
          log: `${meta.prefix} ${template.label} reinforces the party.`,
          desc: `${meta.prefix} ${template.label} defensive combo.`,
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
