import skillSources from './catalogs/index.js';
import { buildSkillRegistry } from './core/registry.js';

const registry = buildSkillRegistry(skillSources);

export const {
  SKILL_LIBRARY,
  SKILL_KEYS,
  SKILL_VALIDATION,
  getSkill,
  listSkills,
  listSkillsByCategory,
  listSkillsByAxis,
  listSkillsByRole,
  makeSkill,
  makeActions,
  createSkillLoadout,
  normalizeSkillLoadout,
} = registry;
