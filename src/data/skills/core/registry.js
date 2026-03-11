import { cloneSkill } from './schema.js';
import { normalizeEquippedKeys, validateSkillLibrary } from './validation.js';

function addSkill(library, aliases, skill, key) {
  library[key] = skill;
  aliases.add(key);
  for (const alias of skill.aliases ?? []) {
    library[alias] = skill;
  }
}

export function buildSkillRegistry(sources) {
  const library = {};
  const canonicalKeys = new Set();

  for (const source of sources) {
    for (const [key, skill] of Object.entries(source)) {
      addSkill(library, canonicalKeys, skill, key);
    }
  }

  const keys = [...canonicalKeys].sort();
  const validation = validateSkillLibrary(library, keys);

  function getSkill(key) {
    if (!key) return null;
    return library[String(key).trim()] || null;
  }

  function listSkills() {
    return keys.map(key => cloneSkill(library[key]));
  }

  function listSkillsByRole(role) {
    return listSkills().filter(skill => skill.role === role);
  }

  function makeSkill(key) {
    const skill = getSkill(key);
    if (!skill) {
      throw new Error(`Unknown skill key: ${key}`);
    }
    return cloneSkill(skill);
  }

  function makeActions(skillKeys) {
    return skillKeys.map(key => makeSkill(key));
  }

  function createSkillLoadout(skillPoolKeys, equippedKeys = null) {
    const poolKeys = skillPoolKeys.map(key => String(key).trim());
    const equipped = normalizeEquippedKeys(poolKeys, equippedKeys, 3);
    return {
      skillPool: poolKeys.map(key => makeSkill(key)),
      equipped,
      actions: equipped.map(key => makeSkill(key)),
    };
  }

  function normalizeSkillLoadout(monster) {
    const hasPool = Array.isArray(monster.skillPool) && monster.skillPool.length > 0;
    const hasActions = Array.isArray(monster.actions) && monster.actions.length > 0;

    if (hasPool) {
      const skillPool = monster.skillPool.map(skill =>
        typeof skill === 'string' ? makeSkill(skill) : cloneSkill(skill)
      );
      const equipped = normalizeEquippedKeys(
        skillPool.map(skill => skill.id),
        monster.equipped,
        3
      );
      const actions = equipped.map(key => {
        const fromPool = skillPool.find(skill => skill.id === key || skill.key === key);
        return fromPool ? cloneSkill(fromPool) : makeSkill(key);
      });
      return { skillPool, equipped, actions };
    }

    if (hasActions) {
      const skillPool = monster.actions.map(skill => cloneSkill(skill));
      const equipped = skillPool.slice(0, 3).map(skill => skill.id);
      const actions = skillPool.slice(0, 3).map(skill => cloneSkill(skill));
      return { skillPool, equipped, actions };
    }

    return { skillPool: [], equipped: [], actions: [] };
  }

  return {
    SKILL_LIBRARY: library,
    SKILL_KEYS: keys,
    SKILL_VALIDATION: validation,
    getSkill,
    listSkills,
    listSkillsByCategory(category) {
      return listSkills().filter(skill => skill.category === category);
    },
    listSkillsByAxis(axis) {
      return listSkills().filter(skill => skill.axis === axis);
    },
    listSkillsByRole,
    makeSkill,
    makeActions,
    createSkillLoadout,
    normalizeSkillLoadout,
  };
}
