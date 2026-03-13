import { calcSensoryMod } from './data/index.js';
import { getEmotionMods } from './emotion.js';
import {
  getStimulateAbilityMods,
  getCaptureAbilityBonus,
  getDefendAbilityBonus,
} from './ability.js';

function resolveStateBonus(action, emotionState) {
  const bonus = action?.stateBonus;
  if (!bonus) return {};

  const emotion = emotionState?.type || null;
  if (bonus.ifEnemyEmotion && emotion !== bonus.ifEnemyEmotion) return {};
  if (bonus.ifEnemyEmotionIn && !bonus.ifEnemyEmotionIn.includes(emotion)) return {};

  return bonus;
}

/**
 * 스킬 프리뷰 계산 — combat.js 실제 실행과 동일한 보정 적용
 */
export function previewAction(ally, action, enemy, tamingGauge, emotionState, options = {}) {
  const emotionMods = getEmotionMods(emotionState);
  const stateBonus = resolveStateBonus(action, emotionState);
  const conditionMet = options.conditionMet ?? true;
  const team = options.team || [];

  if (!conditionMet) {
    return {
      type: action.category,
      blocked: true,
      reason: 'condition',
      pp: action.pp,
    };
  }

  if (action.category === 'stimulate') {
    const mod = calcSensoryMod(action.axis, enemy.sensoryType);
    const isGood = mod >= 1.0;

    // 어빌리티 보정
    const abilityMods = getStimulateAbilityMods(team, action, emotionState?.type || null);

    // 포화도 보정
    const usage = options.axisUsage?.[action.axis] || 0;
    const satMod = usage > 2 ? Math.max(0.4, 1.0 - (usage - 2) * 0.15) : 1.0;

    // 반복 감쇠
    const repeatMod = (options.lastActionIdx != null && options.lastActionIdx === options.currentActionIdx) ? 0.7 : 1.0;

    const gain = Math.round(
      (action.power + (stateBonus.tamingPowerBonus || 0))
      * mod
      * emotionMods.tamingMod * abilityMods.tamingMod
      * satMod * repeatMod
    );
    const esc = Math.round(
      (action.escapeRisk + (stateBonus.escapeRiskDelta || 0)) * (isGood ? 0.7 : 1.5) * emotionMods.escapeMod
    );
    // 총 배율 계산 (base power 대비)
    const baseTaming = action.power;
    const totalMod = baseTaming > 0 ? gain / baseTaming : 1;

    return {
      type: 'stimulate', taming: gain, escape: esc, pp: action.pp,
      sensoryPct: Math.round(mod * 100),       // 상성 배율 %
      totalPct: Math.round(totalMod * 100),     // 총 배율 %
      saturated: satMod < 1.0,
      repeated: repeatMod < 1.0,
    };
  }

  if (action.category === 'capture') {
    const ratio = tamingGauge / enemy.tamingThreshold;
    let chance = Math.min(0.9, (ratio - 0.2) * 1.0);
    chance += emotionMods.captureMod;
    chance += stateBonus.captureChanceBonus || 0;
    chance += getCaptureAbilityBonus(team);
    chance = Math.min(0.95, Math.max(ratio < 0.4 ? 0 : 0.05, chance));
    return { type: 'capture', chance: Math.round(chance * 100), escape: action.escapeRisk, pp: action.pp };
  }

  const abilityDefBonus = getDefendAbilityBonus(team, ally);
  const totalHealBase = (action.healAmount || 0) + (stateBonus.healBonus || 0) + abilityDefBonus.healBonus;
  const heal = totalHealBase > 0 ? totalHealBase : 0;
  const defense = (action.defenseBoost || 2) + (stateBonus.defenseBonus || 0);
  return { type: 'defend', heal, defense, pp: action.pp };
}
