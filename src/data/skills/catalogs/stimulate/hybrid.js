import { defineSkill } from '../../core/schema.js';

const AXIS_META = {
  sound: {
    prefix: 'Resonant',
    effect: 'calm',
    comboEffect: 'trust',
  },
  temperature: {
    prefix: 'Thermal',
    effect: 'curious',
    comboEffect: 'calm',
  },
  smell: {
    prefix: 'Aromatic',
    effect: 'charmed',
    comboEffect: 'curious',
  },
  behavior: {
    prefix: 'Instinctive',
    effect: 'trust',
    comboEffect: 'charmed',
  },
};

const TEMPLATES = [
  {
    suffix: 'cadence',
    label: 'Cadence',
    role: 'basic_stimulate',
    power: 8,
    pp: 7,
    escapeRisk: 3,
    effects: meta => [{ type: meta.effect, chance: 0.22 }],
    summary: meta => `${meta.effect} 22%`,
  },
  {
    suffix: 'hush',
    label: 'Hush',
    role: 'emotion_setup',
    power: 7,
    pp: 7,
    escapeRisk: 2,
    effects: meta => [{ type: 'calm', chance: 0.3 }],
    stateBonus: { ifEnemyEmotion: 'rage', tamingPowerBonus: 2 },
    summary: () => 'calm 30%, bonus vs rage',
  },
  {
    suffix: 'spiral',
    label: 'Spiral',
    role: 'emotion_setup',
    power: 9,
    pp: 6,
    escapeRisk: 3,
    effects: meta => [{ type: meta.comboEffect, chance: 0.18 }],
    stateBonus: meta => ({ ifEnemyEmotion: meta.effect, tamingPowerBonus: 3 }),
    summary: meta => `${meta.comboEffect} 18%, combo on ${meta.effect}`,
  },
  {
    suffix: 'spark',
    label: 'Spark',
    role: 'high_risk_stimulate',
    power: 12,
    pp: 5,
    escapeRisk: 6,
    effects: () => [{ type: 'curious', chance: 0.2 }],
    summary: () => 'curious 20%',
  },
  {
    suffix: 'tether',
    label: 'Tether',
    role: 'swap_setup',
    priority: 1,
    power: 6,
    pp: 5,
    escapeRisk: 1,
    effects: meta => [{ type: meta.effect, chance: 0.15 }],
    swapSynergy: { onSwapIn: { tamingBonus: 3 } },
    summary: meta => `${meta.effect} 15%, swap in bonus`,
  },
  {
    suffix: 'veil',
    label: 'Veil',
    role: 'emotion_setup',
    power: 8,
    pp: 6,
    escapeRisk: 2,
    effects: meta => [{ type: meta.comboEffect, chance: 0.14 }],
    summary: meta => `${meta.comboEffect} 14%`,
  },
  {
    suffix: 'sweep',
    label: 'Sweep',
    role: 'basic_stimulate',
    power: 10,
    pp: 6,
    escapeRisk: 4,
    effects: () => [{ type: 'calm', chance: 0.18 }],
    summary: () => 'calm 18%',
  },
  {
    suffix: 'lure',
    label: 'Lure',
    role: 'emotion_setup',
    power: 10,
    pp: 5,
    escapeRisk: 4,
    effects: meta => [{ type: meta.effect, chance: 0.24 }],
    summary: meta => `${meta.effect} 24%`,
  },
  {
    suffix: 'surge',
    label: 'Surge',
    role: 'high_risk_stimulate',
    power: 13,
    pp: 4,
    escapeRisk: 7,
    condition: { maxEscapePercent: 75 },
    effects: () => [{ type: 'rage', chance: 0.12 }],
    summary: () => 'rage 12%, escape <= 75%',
  },
  {
    suffix: 'bridge',
    label: 'Bridge',
    role: 'swap_setup',
    priority: 1,
    power: 7,
    pp: 5,
    escapeRisk: 1,
    effects: () => [{ type: 'curious', chance: 0.16 }],
    swapSynergy: { onSwapOut: { enemyEmotion: 'curious', chance: 0.25 } },
    summary: () => 'curious 16%, swap out combo',
  },
  {
    suffix: 'bloom',
    label: 'Bloom',
    role: 'emotion_setup',
    power: 9,
    pp: 5,
    escapeRisk: 3,
    effects: meta => [{ type: meta.comboEffect, chance: 0.2 }],
    stateBonus: meta => ({ ifEnemyEmotion: meta.comboEffect, tamingPowerBonus: 2 }),
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
          log: `${meta.prefix} ${template.label} keeps the target engaged.`,
          desc: `${meta.prefix} ${template.label} stimulation combo.`,
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
