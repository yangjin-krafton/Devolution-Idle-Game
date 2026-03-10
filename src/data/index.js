// ============================================================
// Data Index — aggregates all monster data + re-exports constants
// ============================================================

export { SENSORY_AXES, SENSORY_EFFECTIVENESS, calcSensoryMod, SKILL_CATEGORY, AXIS_LABEL, GENERIC_LOGS } from './constants.js';
export { makeSkill, makeActions } from './skills.js';
export { REACTIONS } from './reactions.js';

// ---- Import all 24 monster modules ----
import m01 from './monsters/01_howl_wolf.js';
import m02 from './monsters/02_ember_salamander.js';
import m03 from './monsters/03_rot_toad.js';
import m04 from './monsters/04_stalker_mantis.js';
import m05 from './monsters/05_echo_bat.js';
import m06 from './monsters/06_frost_moth.js';
import m07 from './monsters/07_mist_jellyfish.js';
import m08 from './monsters/08_vine_spider.js';
import m09 from './monsters/09_mirror_chameleon.js';
import m10 from './monsters/10_crystal_stag.js';
import m11 from './monsters/11_lava_crab.js';
import m12 from './monsters/12_spore_fox.js';
import m13 from './monsters/13_iron_boar.js';
import m14 from './monsters/14_stone_tortoise.js';
import m15 from './monsters/15_rumble_bear.js';
import m16 from './monsters/16_thorn_hedgehog.js';
import m17 from './monsters/17_storm_hawk.js';
import m18 from './monsters/18_shadow_cat.js';
import m19 from './monsters/19_coral_seahorse.js';
import m20 from './monsters/20_wind_serpent.js';
import m21 from './monsters/21_swamp_leech.js';
import m22 from './monsters/22_thunder_eel.js';
import m23 from './monsters/23_smoke_weasel.js';
import m24 from './monsters/24_moss_golem.js';

export const ALL_MONSTERS = [m01,m02,m03,m04,m05,m06,m07,m08,m09,m10,m11,m12,m13,m14,m15,m16,m17,m18,m19,m20,m21,m22,m23,m24];

// ---- Derived arrays for backward compatibility ----

// ENEMY_MONSTERS: 24 wild forms (for combat encounters)
export const ENEMY_MONSTERS = ALL_MONSTERS.map(m => m.wild);

// ALLY_MONSTERS: first devo1 of each monster (for team selection)
export const ALLY_MONSTERS = ALL_MONSTERS.map(m => m.devo1[0]);

// ALL_CODEX_ENTRIES: wild + all devo1 + all devo2 (for full codex)
export const ALL_CODEX_ENTRIES = ALL_MONSTERS.flatMap(m => [
  { ...m.wild, type: 'wild', sourceId: m.id },
  ...m.devo1.map(d => ({ ...d, type: 'devo1', sourceId: m.id })),
  ...m.devo2.map(d => ({ ...d, type: 'devo2', sourceId: m.id })),
]);

// Starter monsters: 3 unlocked at game start (attacker + tank + support)
// These match devo1[0].id for howl_wolf (#01), rot_toad (#03), echo_bat (#05)
export const STARTER_IDS = ['howl_wolf_d1_0', 'rot_toad_d1_0', 'echo_bat_d1_0'];
