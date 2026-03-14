// ============================================================
// Skills — 이전 카탈로그 시스템 제거. CSV skill table로 대체됨.
// 하위 호환용 stub만 남김.
// ============================================================

export const SKILL_LIBRARY = {};
export const SKILL_KEYS = [];
export const SKILL_VALIDATION = { errors: [], warnings: [] };

export function getSkill() { return null; }
export function listSkills() { return []; }
export function listSkillsByCategory() { return []; }
export function listSkillsByAxis() { return []; }
export function listSkillsByRole() { return []; }
export function makeSkill() { return null; }
export function makeActions() { return []; }
export function createSkillLoadout() { return { skillPool: [], equipped: [], actions: [] }; }
export function normalizeSkillLoadout(monster) {
  return {
    skillPool: monster.actions || [],
    equipped: (monster.actions || []).map(a => a.id || a),
    actions: monster.actions || [],
  };
}
