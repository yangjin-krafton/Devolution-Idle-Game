// ============================================================
// Stat System — 6스탯 체계 + 성장 + 마이그레이션
// ============================================================

// 스탯 정의
export const STAT_DEFS = {
  affinity:  { id: 'affinity',  name: '친화력', desc: '자극 순화량에 영향', oldKey: 'gentleness' },
  empathy:   { id: 'empathy',   name: '공감력', desc: '포획 성공률에 영향', oldKey: 'empathy' },
  endurance: { id: 'endurance', name: '인내력', desc: '방어력과 회복에 영향', oldKey: 'resilience' },
  agility:   { id: 'agility',   name: '민첩성', desc: '턴 순서에 영향', oldKey: 'agility' },
  bond:      { id: 'bond',      name: '유대력', desc: '감정 유발과 유지에 영향', oldKey: null },
  instinct:  { id: 'instinct',  name: '직감',   desc: '상성 판별과 위기 대응에 영향', oldKey: null },
};

// 스탯 이름 목록
export const STAT_KEYS = Object.keys(STAT_DEFS);

// 기본 스탯값 (신규 스탯용)
const DEFAULT_NEW_STAT = 3;

// 스탯 스케일링: (stat + 5) / 10
export function statScale(stat) {
  return (stat + 5) / 10;
}

// 4스탯 → 6스탯 마이그레이션
// 이미 6스탯이면 그대로 반환
export function migrateStats(stats) {
  if (!stats) return defaultStats();

  // 이미 새 키(affinity)가 있으면 마이그레이션 불필요
  if (stats.affinity != null) return { ...stats };

  return {
    affinity:  stats.gentleness ?? DEFAULT_NEW_STAT,
    empathy:   stats.empathy ?? DEFAULT_NEW_STAT,
    endurance: stats.resilience ?? DEFAULT_NEW_STAT,
    agility:   stats.agility ?? DEFAULT_NEW_STAT,
    bond:      stats.bond ?? DEFAULT_NEW_STAT,
    instinct:  stats.instinct ?? DEFAULT_NEW_STAT,
  };
}

// 기본 스탯
export function defaultStats() {
  return {
    affinity: 5, empathy: 5, endurance: 5,
    agility: 5, bond: 3, instinct: 3,
  };
}

// statGrowth 마이그레이션
export function migrateStatGrowth(growth) {
  if (!growth) return defaultStatGrowth();
  if (growth.affinity != null) return { ...growth };

  return {
    affinity:  growth.gentleness ?? [0, 1],
    empathy:   growth.empathy ?? [0, 1],
    endurance: growth.resilience ?? [0, 1],
    agility:   growth.agility ?? [0, 1],
    bond:      growth.bond ?? [0, 1],
    instinct:  growth.instinct ?? [0, 1],
  };
}

function defaultStatGrowth() {
  return {
    affinity: [0, 1], empathy: [0, 1], endurance: [0, 1],
    agility: [0, 1], bond: [0, 1], instinct: [0, 1],
  };
}

// 전투 행동별 스탯 경험치 매핑
const ACTION_STAT_XP = {
  stimulate: 'affinity',
  capture:   'empathy',
  defend:    'endurance',
};

// 특수 이벤트별 스탯 경험치 매핑
const EVENT_STAT_XP = {
  emotionTrigger: 'bond',     // 감정 상태 유발 성공 시
  goodSensory:    'instinct', // 상성 유리 자극 시
};

// 특수 이벤트로 스탯 경험치 축적 (bond, instinct)
export function awardEventStatXP(ally, eventType) {
  const statKey = EVENT_STAT_XP[eventType];
  if (!statKey) return null;
  return _addStatXP(ally, statKey);
}

// 내부: 스탯 경험치 1 축적 + 레벨업 체크
function _addStatXP(ally, statKey) {
  if (!ally._statXP) {
    ally._statXP = {};
    for (const key of STAT_KEYS) ally._statXP[key] = 0;
  }

  ally._statXP[statKey] = (ally._statXP[statKey] || 0) + 1;

  const threshold = getStatXPThreshold(ally.stats[statKey]);
  if (ally._statXP[statKey] >= threshold) {
    ally._statXP[statKey] -= threshold;
    ally.stats[statKey] += 1;
    return { stat: statKey, name: STAT_DEFS[statKey].name, newValue: ally.stats[statKey] };
  }

  return null;
}

// 행동 수행 시 스탯 경험치 축적
export function awardStatXP(ally, actionCategory) {
  const statKey = ACTION_STAT_XP[actionCategory];
  if (!statKey) return null;
  return _addStatXP(ally, statKey);
}

// 스탯 경험치 임계치 (현재 스탯이 높을수록 더 많은 경험치 필요)
function getStatXPThreshold(currentStat) {
  return 3 + Math.floor(currentStat / 3);
}

// 스탯 접근 헬퍼: 새 이름 또는 구 이름으로 접근 가능
export function getStat(stats, key) {
  if (!stats) return 5;
  // 새 이름으로 시도
  if (stats[key] != null) return stats[key];
  // 구 이름 폴백
  const def = STAT_DEFS[key];
  if (def?.oldKey && stats[def.oldKey] != null) return stats[def.oldKey];
  return 5;
}

// 전투용: 각 카테고리에 사용되는 스탯값 추출
export function getCombatStats(stats) {
  return {
    affinity:  getStat(stats, 'affinity'),
    empathy:   getStat(stats, 'empathy'),
    endurance: getStat(stats, 'endurance'),
    agility:   getStat(stats, 'agility'),
    bond:      getStat(stats, 'bond'),
    instinct:  getStat(stats, 'instinct'),
  };
}
