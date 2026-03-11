// ============================================================
// Monster Registry — unified data adapter
// Currently wraps data.js; designed to swap to roster JSONs later.
// ============================================================

import { ALLY_MONSTERS, ENEMY_MONSTERS, SENSORY_AXES } from './data/index.js';

// ---- Sensory axis labels ----
const AXIS_LABEL = { sound: '소리', temperature: '온도', smell: '냄새', behavior: '행동' };
const PERSONALITY_LABEL = {
  aggressive: '공격적', timid: '겁많은', curious: '호기심', stubborn: '완고',
};
const ROLE_LABEL = {
  attacker: '어태커', tank: '탱커', support: '서포터', speedster: '스피드',
};

// ---- Normalized monster record ----
// All monsters (ally + enemy) go through this normalizer.
// Fields absent from current data are null — UI should handle gracefully.

function normalizeAlly(a) {
  const skillPool = a.skillPool || a.actions || [];
  const equipped = a.equipped || skillPool.slice(0, 3).map(skill => skill.id);
  return {
    id: a.id,
    name: a.name,
    nameEn: null,            // roster: name_en
    desc: a.desc,
    img: a.img,
    type: 'ally',

    // Combat
    hp: a.hp, maxHp: a.maxHp,
    stats: { ...a.stats },
    actions: a.actions,
    skillPool,
    equipped,

    // Devolution
    devolved: a.devolved,
    devolvedName: a.devolvedName,
    devolvedDesc: a.devolvedDesc,
    devolvedImg: a.devolvedImg,
    devolvedStats: a.devolvedStats ? { ...a.devolvedStats } : null,
    xp: a.xp, xpThreshold: a.xpThreshold,
    inEgg: a.inEgg,

    // Devolution tree (future: populated from roster devo1/devo2 branches)
    devoTree: null,

    // Enemy-only (null for allies)
    attackPower: null,
    tamingThreshold: null,
    escapeThreshold: null,
    sensoryType: null,
    personality: null,
    reactions: null,

    // Roster-only (null until roster integrated)
    role: null,
    habitat: null,
    skillFocus: null,
    wildMechanic: null,
    visual: null,

    // Raw source reference
    _raw: a,
  };
}

function normalizeEnemy(e) {
  return {
    id: e.id,
    name: e.name,
    nameEn: null,
    desc: e.desc,
    img: e.img,
    type: 'enemy',

    hp: null, maxHp: null,
    stats: null,
    actions: null,

    devolved: false,
    devolvedName: null,
    devolvedDesc: null,
    devolvedImg: null,
    devolvedStats: null,
    xp: null, xpThreshold: null,
    inEgg: false,

    devoTree: null,

    attackPower: e.attackPower,
    tamingThreshold: e.tamingThreshold,
    escapeThreshold: e.escapeThreshold,
    sensoryType: e.sensoryType,
    personality: e.personality,
    reactions: e.reactions,

    role: null,
    habitat: null,
    skillFocus: null,
    wildMechanic: null,
    visual: null,

    _raw: e,
  };
}

// ---- Registry ----
let _cache = null;

function buildRegistry() {
  if (_cache) return _cache;
  const allies = ALLY_MONSTERS.map(normalizeAlly);
  const enemies = ENEMY_MONSTERS.map(normalizeEnemy);
  _cache = { allies, enemies, all: [...allies, ...enemies] };
  return _cache;
}

// Public API
export function getAllMonsters() { return buildRegistry().all; }
export function getAllies() { return buildRegistry().allies; }
export function getEnemies() { return buildRegistry().enemies; }

export function getMonsterById(id) {
  return buildRegistry().all.find(m => m.id === id) || null;
}

// Stat total for sorting
export function getStatTotal(mon) {
  if (!mon.stats) return 0;
  return Object.values(mon.stats).reduce((s, v) => s + v, 0);
}

// Labels
export { AXIS_LABEL, PERSONALITY_LABEL, ROLE_LABEL };

// ---- Future: loadRoster(jsonArray) ----
// When roster JSONs are ready, call this to replace the registry.
// Each roster entry has { wild, devo1[], devo1[].devo2[] }.
// normalizeRosterEntry will flatten them into the same shape.

export function loadRoster(rosterEntries) {
  const all = [];
  for (const entry of rosterEntries) {
    const w = entry.wild;
    // Wild form → normalized as enemy-type
    all.push({
      id: `roster_${entry.id}_wild`,
      name: w.name_kr,
      nameEn: w.name_en,
      desc: w.desc_kr,
      img: null, // filled by image pipeline
      type: 'enemy',
      hp: w.hp, maxHp: w.hp,
      stats: w.stats ? { ...w.stats } : null,
      actions: null,
      devolved: false, devolvedName: null, devolvedDesc: null,
      devolvedImg: null, devolvedStats: null,
      xp: null, xpThreshold: null, inEgg: false,
      devoTree: {
        devo1: (entry.devo1 || []).map(d1 => ({
          name: d1.name_kr, nameEn: d1.name_en, desc: d1.desc_kr,
          role: d1.role, hp: d1.hp, stats: d1.stats ? { ...d1.stats } : null,
          skillFocus: d1.skillFocus,
          visual: d1.visual,
          devo2: (d1.devo2 || []).map(d2 => ({
            name: d2.name_kr, nameEn: d2.name_en, desc: d2.desc_kr,
            role: d2.role, hp: d2.hp, stats: d2.stats ? { ...d2.stats } : null,
            skillFocus: d2.skillFocus,
            visual: d2.visual,
          })),
        })),
      },
      attackPower: w.attackPower,
      tamingThreshold: w.tamingThreshold,
      escapeThreshold: w.escapeThreshold,
      sensoryType: w.sensoryType,
      personality: w.personality,
      reactions: null,
      role: null,
      habitat: w.habitat || null,
      skillFocus: null,
      wildMechanic: w.wildMechanic || null,
      visual: w.visual || null,
      _raw: entry,
    });

    // Devo1 forms → normalized as ally-type
    (entry.devo1 || []).forEach((d1, di) => {
      all.push({
        id: `roster_${entry.id}_d1_${di}`,
        name: d1.name_kr, nameEn: d1.name_en, desc: d1.desc_kr,
        img: null, type: 'ally',
        hp: d1.hp, maxHp: d1.hp,
        stats: d1.stats ? { ...d1.stats } : null,
        actions: null, // generated from skillFocus later
        devolved: false, devolvedName: null, devolvedDesc: null,
        devolvedImg: null, devolvedStats: null,
        xp: 0, xpThreshold: 5, inEgg: false,
        devoTree: null,
        attackPower: null, tamingThreshold: null, escapeThreshold: null,
        sensoryType: null, personality: null, reactions: null,
        role: d1.role, habitat: null,
        skillFocus: d1.skillFocus,
        wildMechanic: null,
        visual: d1.visual || null,
        _raw: d1,
      });
    });
  }

  _cache = {
    allies: all.filter(m => m.type === 'ally'),
    enemies: all.filter(m => m.type === 'enemy'),
    all,
  };
}

// Invalidate cache (call after data changes)
export function clearRegistryCache() { _cache = null; }
