import { calcSensoryMod } from './data/index.js';
import { getEmotionMods } from './emotion.js';

export function statScale(stat) {
  return (stat + 5) / 10;
}

function resolveStateBonus(action, emotionState) {
  const bonus = action?.stateBonus;
  if (!bonus) return {};

  const emotion = emotionState?.type || null;
  if (bonus.ifEnemyEmotion && emotion !== bonus.ifEnemyEmotion) return {};
  if (bonus.ifEnemyEmotionIn && !bonus.ifEnemyEmotionIn.includes(emotion)) return {};

  return bonus;
}

export function previewAction(ally, action, enemy, tamingGauge, emotionState, options = {}) {
  const stat = ally.stats || { gentleness: 5, empathy: 5, resilience: 5, agility: 5 };
  const emotionMods = getEmotionMods(emotionState);
  const stateBonus = resolveStateBonus(action, emotionState);
  const conditionMet = options.conditionMet ?? true;

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
    const gain = Math.round(
      (action.power + (stateBonus.tamingPowerBonus || 0)) * mod * statScale(stat.gentleness) * emotionMods.tamingMod
    );
    const esc = Math.round(
      (action.escapeRisk + (stateBonus.escapeRiskDelta || 0)) * (mod >= 1.0 ? 0.7 : 1.5) * emotionMods.escapeMod
    );
    const effective = mod >= 1.2 ? 'good' : mod <= 0.8 ? 'bad' : 'neutral';
    return { type: 'stimulate', taming: gain, escape: esc, pp: action.pp, effective };
  }

  if (action.category === 'capture') {
    const ratio = tamingGauge / enemy.tamingThreshold;
    let chance = Math.min(0.9, (ratio - 0.2) * 1.0 * statScale(stat.empathy));
    chance += emotionMods.captureMod;
    chance += stateBonus.captureChanceBonus || 0;
    chance = Math.min(0.95, Math.max(ratio < 0.4 ? 0 : 0.05, chance));
    return { type: 'capture', chance: Math.round(chance * 100), escape: action.escapeRisk, pp: action.pp };
  }

  const heal = action.healAmount
    ? Math.round((action.healAmount + (stateBonus.healBonus || 0)) * statScale(stat.resilience))
    : 0;
  const defense = Math.round(((action.defenseBoost || 2) + (stateBonus.defenseBonus || 0)) * statScale(stat.resilience));
  return { type: 'defend', heal, defense, pp: action.pp };
}
