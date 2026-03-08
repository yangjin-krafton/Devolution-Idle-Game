// ============================================================
// Emotion System — 적 몬스터 감정 상태 6종
// ============================================================

// 감정 상태 정의
export const EMOTIONS = {
  calm:    { id: 'calm',    name: '진정',   icon: '😌', color: 0x4dabf7, turns: 2 },
  curious: { id: 'curious', name: '호기심', icon: '🔍', color: 0x00d4aa, turns: 2 },
  fear:    { id: 'fear',    name: '공포',   icon: '😨', color: 0xff6b6b, turns: -1 }, // -1 = 자동 (도주 80%+)
  charmed: { id: 'charmed', name: '매혹',   icon: '💖', color: 0xff99cc, turns: 3 },
  rage:    { id: 'rage',    name: '분노',   icon: '🔥', color: 0xff4444, turns: 2 },
  trust:   { id: 'trust',   name: '신뢰',   icon: '🤝', color: 0xffdd55, turns: -1 }, // -1 = 자동 (순화 70%+)
};

// 감정별 전투 보정값
const EMOTION_MODIFIERS = {
  calm:    { attackMod: 0.5, escapeMod: 0, tamingMod: 1.0, captureMod: 0 },
  curious: { attackMod: 1.0, escapeMod: 1, tamingMod: 1.5, captureMod: 0 },
  fear:    { attackMod: 1.3, escapeMod: 1, tamingMod: 1.0, captureMod: 0, escapePerTurn: 5 },
  charmed: { attackMod: 1.0, escapeMod: 1, tamingMod: 1.0, captureMod: 0.2 },
  rage:    { attackMod: 2.0, escapeMod: 1, tamingMod: 0.5, captureMod: 0 },
  trust:   { attackMod: 0.3, escapeMod: 0, tamingMod: 1.3, captureMod: 0.1 },
};

// 빈 감정 상태 생성
export function createEmotionState() {
  return { type: null, turnsLeft: 0 };
}

// 감정 적용 시도 (확률 체크 포함)
export function tryApplyEmotion(emotionState, type, chance) {
  if (Math.random() > chance) return null;
  // 기존 감정이 있으면 덮어쓰기 (분노/공포는 우선)
  if (emotionState.type === 'rage' && type !== 'calm') return null;
  const def = EMOTIONS[type];
  if (!def) return null;
  emotionState.type = type;
  emotionState.turnsLeft = def.turns > 0 ? def.turns : 99;
  return def;
}

// 자동 감정 체크 (순화/도주 비율 기반)
export function checkAutoEmotion(emotionState, tamingPct, escapePct) {
  // 도주 80%+ → 공포 (기존 감정 무시)
  if (escapePct >= 80 && emotionState.type !== 'fear') {
    emotionState.type = 'fear';
    emotionState.turnsLeft = 99;
    return EMOTIONS.fear;
  }
  // 순화 70%+ → 신뢰 (분노/공포 아닐 때만)
  if (tamingPct >= 70 && !emotionState.type && Math.random() < 0.3) {
    emotionState.type = 'trust';
    emotionState.turnsLeft = 99;
    return EMOTIONS.trust;
  }
  return null;
}

// 턴 종료 시 감정 지속턴 감소
export function tickEmotion(emotionState) {
  if (!emotionState.type) return null;
  const def = EMOTIONS[emotionState.type];
  if (!def || def.turns < 0) return null; // 자동 감정은 턴으로 해제 안 됨
  emotionState.turnsLeft--;
  if (emotionState.turnsLeft <= 0) {
    const expired = emotionState.type;
    emotionState.type = null;
    emotionState.turnsLeft = 0;
    return expired;
  }
  return null;
}

// 현재 감정의 전투 보정값 반환
export function getEmotionMods(emotionState) {
  if (!emotionState.type) {
    return { attackMod: 1, escapeMod: 1, tamingMod: 1, captureMod: 0, escapePerTurn: 0 };
  }
  return { escapePerTurn: 0, ...EMOTION_MODIFIERS[emotionState.type] };
}

// 감정 강제 해제
export function clearEmotion(emotionState) {
  emotionState.type = null;
  emotionState.turnsLeft = 0;
}
