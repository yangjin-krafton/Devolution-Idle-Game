import { defineSkill } from '../../core/schema.js';

const AXIS_META = {
  sound: {
    prefix: 'Resonant',
    effect: 'calm',
    supportEmotion: ['calm', 'trust'],
  },
  temperature: {
    prefix: 'Thermal',
    effect: 'curious',
    supportEmotion: ['calm', 'curious'],
  },
  smell: {
    prefix: 'Aromatic',
    effect: 'charmed',
    supportEmotion: ['curious', 'charmed'],
  },
  behavior: {
    prefix: 'Instinctive',
    effect: 'trust',
    supportEmotion: ['trust', 'charmed'],
  },
};

const TEMPLATES = [
  {
    suffix: 'snare',
    label: 'Snare',
    role: 'capture_finisher',
    power: 16,
    pp: 3,
    escapeRisk: 11,
    stateBonus: meta => ({ ifEnemyEmotion: meta.effect, captureChanceBonus: 0.04 }),
    summary: meta => `${meta.effect} bonus`,
  },
  {
    suffix: 'clasp',
    label: 'Clasp',
    role: 'conditional_finisher',
    power: 17,
    pp: 3,
    escapeRisk: 12,
    condition: { minTamingPercent: 60 },
    stateBonus: meta => ({ ifEnemyEmotionIn: meta.supportEmotion, captureChanceBonus: 0.05 }),
    summary: meta => `taming 60%+, ${meta.supportEmotion.join('/')}`,
  },
  {
    suffix: 'pact',
    label: 'Pact',
    role: 'conditional_finisher',
    power: 18,
    pp: 2,
    escapeRisk: 13,
    condition: { minTamingPercent: 70, maxEscapePercent: 75 },
    effects: meta => [{ type: meta.effect, chance: 0.1 }],
    summary: () => 'taming 70%+, escape <= 75%',
  },
  {
    suffix: 'sealburst',
    label: 'Sealburst',
    role: 'high_risk_finisher',
    power: 19,
    pp: 2,
    escapeRisk: 15,
    condition: { minTamingPercent: 72 },
    stateBonus: meta => ({ ifEnemyEmotionIn: meta.supportEmotion, captureChanceBonus: 0.08 }),
    summary: meta => `taming 72%+, ${meta.supportEmotion.join('/')} bonus`,
  },
  {
    suffix: 'keystone',
    label: 'Keystone',
    role: 'conditional_finisher',
    power: 18,
    pp: 2,
    escapeRisk: 10,
    condition: { minTamingPercent: 65, maxEscapePercent: 65 },
    effects: () => [{ type: 'trust', chance: 0.12 }],
    summary: () => 'taming 65%+, escape <= 65%',
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
          category: 'capture',
          role: template.role,
          axis,
          power: template.power,
          pp: template.pp,
          escapeRisk: template.escapeRisk,
          effects: resolveValue(template.effects, meta),
          condition: resolveValue(template.condition, meta),
          stateBonus: resolveValue(template.stateBonus, meta),
          log: `${meta.prefix} ${template.label} attempts a decisive capture.`,
          desc: `${meta.prefix} ${template.label} finisher.`,
          rarity: template.role === 'high_risk_finisher' ? 'rare' : 'uncommon',
          tags: [axis, 'capture', 'hybrid', template.role],
        }),
      ];
    })
  )
);

export const CAPTURE_HYBRID_SUMMARY = Object.fromEntries(
  Object.entries(AXIS_META).flatMap(([axis, meta]) =>
    TEMPLATES.map(template => [`${axis}-${template.suffix}`, template.summary(meta)])
  )
);

export default hybridSkills;
