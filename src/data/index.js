// ============================================================
// Data Index — CSV 기반 몬스터 데이터 + 상수 re-export
// ============================================================

export { SENSORY_AXES, SENSORY_EFFECTIVENESS, calcSensoryMod, SKILL_CATEGORY, AXIS_LABEL, GENERIC_LOGS, ENVIRONMENT_AXES, ENV_AXIS_LABEL, ENV_AXIS_ICON, ENV_VALUE_LABEL, ENV_RANGE } from './constants.js';
// skills.js — 이전 카탈로그 stub (하위 호환)
export { REACTIONS } from './reactions.js';
export { initMonsterData, getEnvironmentPreference, getWildMechanic, getAxisMeta, getFormSkills } from './monsterDataLoader.js';

// ---- 몬스터 데이터 (CSV 로드 후 채워짐) ----
export const ALL_MONSTERS = [];
export const ENEMY_MONSTERS = [];
export const ALLY_MONSTERS = [];
export const ALL_CODEX_ENTRIES = [];

export function rebuildDerivedArrays() {
  ENEMY_MONSTERS.length = 0;
  ALLY_MONSTERS.length = 0;
  ALL_CODEX_ENTRIES.length = 0;

  for (const m of ALL_MONSTERS) {
    ENEMY_MONSTERS.push(m.wild);
    if (m.devo1.length > 0) ALLY_MONSTERS.push(m.devo1[0]);

    m.wild.type = 'wild'; m.wild.sourceId = m.id;
    ALL_CODEX_ENTRIES.push(m.wild);
    m.devo1.forEach(d => { d.type = 'devo1'; d.sourceId = m.id; ALL_CODEX_ENTRIES.push(d); });
    m.devo2.forEach(d => { d.type = 'devo2'; d.sourceId = m.id; ALL_CODEX_ENTRIES.push(d); });
  }
}

// Starter monsters: 3 unlocked at game start (attacker + tank + support)
export const STARTER_IDS = ['howl_wolf_d1_0', 'rot_toad_d1_0', 'frost_moth_d1_0'];
