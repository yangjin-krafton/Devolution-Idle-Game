// ============================================================
// Combat Preview — UI용 스킬 효과 미리보기 계산
// ============================================================

import { calcSensoryMod } from './data/index.js';
import { getEmotionMods } from './emotion.js';

// 스탯 스케일 함수 (combat.js와 동일)
export function statScale(stat) { return (stat + 5) / 10; }

// 스킬 효과 미리보기 (UI 표시용)
export function previewAction(ally, action, enemy, tamingGauge, emotionState) {
  const stat = ally.stats || { gentleness: 5, empathy: 5, resilience: 5, agility: 5 };
  const emotionMods = getEmotionMods(emotionState);

  if (action.category === 'stimulate') {
    const mod = calcSensoryMod(action.axis, enemy.sensoryType);
    const gain = Math.round(action.power * mod * statScale(stat.gentleness) * emotionMods.tamingMod);
    const esc = Math.round(action.escapeRisk * (mod >= 1.0 ? 0.7 : 1.5) * emotionMods.escapeMod);
    const effective = mod >= 1.2 ? 'good' : mod <= 0.8 ? 'bad' : 'neutral';
    return { type: 'stimulate', taming: gain, escape: esc, pp: action.pp, effective };
  } else if (action.category === 'capture') {
    const ratio = tamingGauge / enemy.tamingThreshold;
    let chance = Math.min(0.9, (ratio - 0.2) * 1.0 * statScale(stat.empathy));
    chance += emotionMods.captureMod;
    chance = Math.min(0.95, Math.max(ratio < 0.4 ? 0 : 0.05, chance));
    return { type: 'capture', chance: Math.round(chance * 100), escape: action.escapeRisk, pp: action.pp };
  } else {
    const heal = action.healAmount ? Math.round(action.healAmount * statScale(stat.resilience)) : 0;
    const def = Math.round((action.defenseBoost || 2) * statScale(stat.resilience));
    return { type: 'defend', heal, defense: def, pp: action.pp };
  }
}
