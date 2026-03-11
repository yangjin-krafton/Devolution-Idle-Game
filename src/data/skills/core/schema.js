const DEFAULT_PP_BY_CATEGORY = {
  stimulate: 6,
  capture: 3,
  defend: 5,
};

function cloneEffects(effects = []) {
  return effects.map(effect => ({ ...effect }));
}

function cloneArray(values = []) {
  return [...values];
}

export function defineSkill(id, config) {
  const category = config.category;
  const pp = config.pp ?? DEFAULT_PP_BY_CATEGORY[category] ?? 5;

  return {
    id,
    key: id,
    name: config.name,
    category,
    axis: config.axis ?? null,
    role: config.role ?? category,
    targetType: config.targetType ?? 'enemy',
    priority: config.priority ?? 0,
    power: config.power ?? 0,
    pp,
    maxPp: config.maxPp ?? pp,
    escapeRisk: config.escapeRisk ?? 0,
    healAmount: config.healAmount ?? 0,
    defenseBoost: config.defenseBoost ?? 0,
    effects: cloneEffects(config.effects),
    condition: config.condition ? { ...config.condition } : null,
    stateBonus: config.stateBonus ? { ...config.stateBonus } : null,
    swapSynergy: config.swapSynergy ? { ...config.swapSynergy } : null,
    log: config.log ?? config.name,
    desc: config.desc ?? config.log ?? config.name,
    rarity: config.rarity ?? 'common',
    tags: cloneArray(config.tags),
    aliases: cloneArray(config.aliases),
  };
}

export function cloneSkill(skill) {
  return {
    ...skill,
    effects: cloneEffects(skill.effects),
    condition: skill.condition ? { ...skill.condition } : null,
    stateBonus: skill.stateBonus ? { ...skill.stateBonus } : null,
    swapSynergy: skill.swapSynergy ? { ...skill.swapSynergy } : null,
    tags: cloneArray(skill.tags),
    aliases: cloneArray(skill.aliases),
  };
}
