// ============================================================
// Monster Data Loader — CSV에서 모든 몬스터 데이터를 빌드
// ============================================================

import { fetchCSV } from './csvLoader.js';
import { REACTIONS } from './reactions.js';

const DATA_BASE = import.meta.url.replace(/\/[^/]+$/, '/');
const IMG_PREFIX = 'asset/monsters/';

/** @type {Map<string, Object>} form_id → 5axis row */
let axisMap = new Map();
/** @type {Map<string, Object[]>} form_id → skill rows (slot 1,2,3) */
let skillMap = new Map();

let _loaded = false;

// ============================================================
// CSV Loading
// ============================================================

export async function loadMonsterCSV() {
  if (_loaded) return;

  const [axisRows, skillRows] = await Promise.all([
    fetchCSV(new URL('monster-5axis-ranges.csv', DATA_BASE).href),
    fetchCSV(new URL('monster-skill-table.csv', DATA_BASE).href),
  ]);

  for (const row of axisRows) {
    axisMap.set(row.form_id, row);
  }

  for (const row of skillRows) {
    const key = row.form_id;
    if (!skillMap.has(key)) skillMap.set(key, []);
    skillMap.get(key).push(row);
  }

  _loaded = true;
}

/** Parse a numeric CSV field, returning 0 if empty/NaN */
function num(val) {
  const n = Number(val);
  return Number.isNaN(n) ? 0 : n;
}

/** Parse optional numeric — returns undefined if empty */
function optNum(val) {
  if (!val && val !== 0) return undefined;
  const n = Number(val);
  return Number.isNaN(n) ? undefined : n;
}

/** Parse mechanic params like "[1, 4]" into an array of numbers */
function parseMechanicParams(val) {
  if (!val) return null;
  const cleaned = val.replace(/[[\]"]/g, '');
  return cleaned.split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n));
}

// ============================================================
// Data Accessors (public)
// ============================================================

export function getEnvironmentPreference(formId) {
  const row = axisMap.get(formId);
  if (!row) return null;
  return {
    temperature: { ideal: num(row.temperature_target), tolerance: num(row.temperature_tolerance), min: num(row.temperature_min), max: num(row.temperature_max) },
    brightness:  { ideal: num(row.brightness_target),  tolerance: num(row.brightness_tolerance),  min: num(row.brightness_min),  max: num(row.brightness_max) },
    smell:       { ideal: num(row.smell_target),        tolerance: num(row.smell_tolerance),        min: num(row.smell_min),        max: num(row.smell_max) },
    humidity:    { ideal: num(row.humidity_target),      tolerance: num(row.humidity_tolerance),      min: num(row.humidity_min),      max: num(row.humidity_max) },
    sound:       { ideal: num(row.sound_target),        tolerance: num(row.sound_tolerance),        min: num(row.sound_min),        max: num(row.sound_max) },
  };
}

export function getWildMechanic(formId) {
  const row = axisMap.get(formId);
  if (!row || !row.recommended_mechanic_id) return null;
  return {
    id: row.recommended_mechanic_id,
    icon: row.mechanic_icon || '',
    category: row.mechanic_category || '',
    nameKr: row.mechanic_name_kr || '',
    difficultyParams: {
      wild: parseMechanicParams(row.mechanic_params_wild),
      devo1: parseMechanicParams(row.mechanic_params_devo1),
      devo2: parseMechanicParams(row.mechanic_params_devo2),
    },
    currentParams: parseMechanicParams(row.mechanic_params_current),
  };
}

export function getAxisMeta(formId) {
  const row = axisMap.get(formId);
  if (!row) return null;
  return {
    speciesId: row.species_id, formId: row.form_id,
    stage: row.stage, stageDepth: num(row.stage_depth),
    tier: num(row.tier), speciesOrder: num(row.species_order),
    routeOrder: num(row.route_order), name: row.name,
    parentFormId: row.parent_form_id || null,
    dominantAxes: row.dominant_axes ? row.dominant_axes.split('|') : [],
    provide: {
      temperature: num(row.provide_temperature), brightness: num(row.provide_brightness),
      smell: num(row.provide_smell), humidity: num(row.provide_humidity), sound: num(row.provide_sound),
    },
    extremeAxisCount: num(row.extreme_axis_count),
    difficultyScore: parseFloat(row.difficulty_score) || 0,
    difficultyRank: row.difficulty_rank || '',
  };
}

export function getFormSkills(formId) {
  const rows = skillMap.get(formId);
  if (!rows) return null;
  return rows
    .sort((a, b) => num(a.skill_slot) - num(b.skill_slot))
    .map(row => ({
      slot: num(row.skill_slot), skillId: row.skill_id,
      nameKr: row.skill_name_kr, role: row.skill_role,
      category: row.category, axisPrimary: row.axis_primary || null,
      axisSecondary: row.axis_secondary ? row.axis_secondary.split('|') : [],
      deltaPattern: row.delta_pattern || '', basePower: num(row.base_power),
      pp: num(row.pp), affectedAxisCount: num(row.affected_axis_count),
      purityLevel: num(row.purity_level), mechanicLink: row.mechanic_link || null,
      mechanicParams: parseMechanicParams(row.mechanic_params),
      routeFunction: row.route_function || '', upgradeRule: row.upgrade_rule || '',
      deltas: {
        temperature: num(row.temperature_delta), brightness: num(row.brightness_delta),
        smell: num(row.smell_delta), humidity: num(row.humidity_delta), sound: num(row.sound_delta),
      },
      designNote: row.design_note || '',
    }));
}

// ============================================================
// CSV → Combat Action 변환
// ============================================================

function csvSkillToAction(sk, formName) {
  const category = _mapCategory(sk.category);
  const pp = sk.pp || _defaultPP(category);

  // effectType: 스킬 효과 분류
  // raise/lower → axis_change (직접 축 조절)
  // convert     → axis_convert (축 간 변환)
  // check       → mechanic_check (메커닉 대응/검사)
  // stabilize   → axis_lock (축 고정)
  const effectType = _mapEffectType(sk.deltaPattern);

  return {
    id: sk.skillId, key: sk.skillId, name: sk.nameKr,
    category, axis: sk.axisPrimary,
    role: sk.role || category, targetType: 'enemy',
    priority: category === 'defend' ? 1 : (category === 'capture' ? -1 : 0),
    power: sk.basePower, pp, maxPp: pp,
    escapeRisk: 0, healAmount: 0,
    defenseBoost: category === 'defend' ? 2 : 0,
    effects: [], condition: null, stateBonus: null, swapSynergy: null,
    log: `${formName}이(가) ${sk.nameKr}을(를) 사용했다!`,
    desc: sk.designNote || sk.nameKr,
    rarity: 'common', tags: [], aliases: [],
    // 효과 데이터
    effectType,
    deltas: sk.deltas,
    deltaPattern: sk.deltaPattern,
    // 메커닉 연동
    mechanicLink: sk.mechanicLink,
    mechanicParams: sk.mechanicParams,
    // 메타
    routeFunction: sk.routeFunction,
    purityLevel: sk.purityLevel,
    affectedAxisCount: sk.affectedAxisCount,
    axisPrimary: sk.axisPrimary,
    axisSecondary: sk.axisSecondary,
  };
}

function _mapEffectType(deltaPattern) {
  switch (deltaPattern) {
    case 'raise': case 'lower': return 'axis_change';
    case 'convert': return 'axis_convert';
    case 'check': return 'mechanic_check';
    case 'stabilize': return 'axis_lock';
    default: return 'axis_change';
  }
}

function _mapCategory(csvCat) {
  if (!csvCat) return 'stimulate';
  const c = csvCat.toLowerCase();
  if (c === 'stimulate' || c === 'capture' || c === 'defend' || c === 'survey') return c;
  return 'stimulate';
}

function _defaultPP(category) {
  return { stimulate: 6, capture: 3, defend: 5, survey: 2 }[category] ?? 5;
}

// ============================================================
// CSV → ALL_MONSTERS 빌드
// ============================================================

function buildAllMonsters() {
  // Group rows by species_id
  const speciesMap = new Map(); // species_id → { wild, devo1[], devo2[] }
  const speciesOrder = [];

  for (const [, row] of axisMap) {
    const sid = row.species_id;
    if (!speciesMap.has(sid)) {
      speciesMap.set(sid, { id: sid, wild: null, devo1: [], devo2: [] });
      speciesOrder.push({ id: sid, order: num(row.species_order) });
    }
    const spec = speciesMap.get(sid);

    const form = _buildForm(row);

    if (row.stage === 'wild') {
      spec.wild = form;
    } else if (row.stage === 'devo1') {
      spec.devo1.push(form);
    } else if (row.stage === 'devo2') {
      spec.devo2.push(form);
    }
  }

  // Sort by species_order
  speciesOrder.sort((a, b) => a.order - b.order);

  // Build devo1 devolvedImg/Name/Desc from first devo2 child
  for (const spec of speciesMap.values()) {
    for (const d1 of spec.devo1) {
      const firstChild = spec.devo2.find(d2 => d2.parentDevo1 === d1.id);
      if (firstChild) {
        d1.devolvedImg = firstChild.img;
        d1.devolvedName = firstChild.name;
        d1.devolvedDesc = firstChild.desc;
      }
    }
  }

  return speciesOrder.map(s => speciesMap.get(s.id));
}

function _buildForm(row) {
  const stage = row.stage;
  const formId = row.form_id;
  const formName = row.name || formId;

  // 공통 필드
  const form = {
    id: formId,
    name: formName,
    desc: row.desc || '',
    img: row.img ? IMG_PREFIX + row.img : '',
    role: stage === 'wild' ? 'wild' : (row.dominant_axes || '').split('|')[0] ? undefined : undefined,
  };

  // role: devo1/devo2는 CSV에 별도 컬럼이 없으므로 스킬 테이블에서 추출하거나 기본값
  // → 나중에 스킬 enrichment에서 처리

  // 5축 환경 데이터
  form.environmentPreference = {
    temperature: { ideal: num(row.temperature_target), tolerance: num(row.temperature_tolerance), min: num(row.temperature_min), max: num(row.temperature_max) },
    brightness:  { ideal: num(row.brightness_target),  tolerance: num(row.brightness_tolerance),  min: num(row.brightness_min),  max: num(row.brightness_max) },
    smell:       { ideal: num(row.smell_target),        tolerance: num(row.smell_tolerance),        min: num(row.smell_min),        max: num(row.smell_max) },
    humidity:    { ideal: num(row.humidity_target),      tolerance: num(row.humidity_tolerance),      min: num(row.humidity_min),      max: num(row.humidity_max) },
    sound:       { ideal: num(row.sound_target),        tolerance: num(row.sound_tolerance),        min: num(row.sound_min),        max: num(row.sound_max) },
  };

  // 축 메타
  form.dominantAxes = row.dominant_axes ? row.dominant_axes.split('|') : [];
  form.tier = num(row.tier);
  form.provide = {
    temperature: num(row.provide_temperature), brightness: num(row.provide_brightness),
    smell: num(row.provide_smell), humidity: num(row.provide_humidity), sound: num(row.provide_sound),
  };
  form.difficultyScore = parseFloat(row.difficulty_score) || 0;
  form.difficultyRank = row.difficulty_rank || '';

  // 메커닉
  if (row.recommended_mechanic_id) {
    form.wildMechanic = {
      id: row.recommended_mechanic_id,
      icon: row.mechanic_icon || '',
      category: row.mechanic_category || '',
      nameKr: row.mechanic_name_kr || '',
      difficultyParams: {
        wild: parseMechanicParams(row.mechanic_params_wild),
        devo1: parseMechanicParams(row.mechanic_params_devo1),
        devo2: parseMechanicParams(row.mechanic_params_devo2),
      },
      currentParams: parseMechanicParams(row.mechanic_params_current),
    };
  }

  // Wild 전용
  if (stage === 'wild') {
    form.attackPower = optNum(row.attack_power) ?? 7;
    form.tamingThreshold = optNum(row.taming_threshold) ?? 75;
    form.escapeThreshold = optNum(row.escape_threshold) ?? 95;
    form.sensoryType = row.sensory_type ? row.sensory_type.split('|') : [];
    form.personality = row.personality || 'aggressive';
    form.habitat = row.habitat || '';
    form.reactions = REACTIONS[row.reaction_type] || REACTIONS[row.personality] || REACTIONS.aggressive;
  }

  // Devo2 전용
  if (stage === 'devo2') {
    form.parentDevo1 = row.parent_form_id || '';
  }

  // 스킬 (모든 폼)
  const skills = getFormSkills(formId);
  if (skills) {
    form.csvSkills = skills;
    if (stage === 'wild') {
      form.environmentSkills = skills.map(sk => ({
        axis: sk.axisPrimary,
        delta: sk.deltas[sk.axisPrimary] || sk.basePower,
        log: `${formName}이(가) ${sk.nameKr}을(를) 사용했다!`,
        skillData: sk,
      }));
    } else {
      form.actions = skills.map(sk => csvSkillToAction(sk, formName));
      form.skillPool = form.actions.map(a => a.id);
      form.equipped = form.actions.map(a => a.id);
    }
  }

  return form;
}

// ============================================================
// Public: 초기화
// ============================================================

export async function initMonsterData(allMonstersArray) {
  await loadMonsterCSV();

  const monsters = buildAllMonsters();

  // ALL_MONSTERS 배열 채우기 (같은 배열 참조 유지)
  allMonstersArray.length = 0;
  for (const m of monsters) {
    allMonstersArray.push(m);
  }

  // Derived arrays 재빌드
  const { rebuildDerivedArrays } = await import('./index.js');
  rebuildDerivedArrays();

  console.log(`[monsterDataLoader] ${allMonstersArray.length} species loaded from CSV`);
}

// Legacy exports for backward compatibility
export function enrichMonster() {}
export function enrichAllMonsters() {}
