// ============================================================
// Skill Card — 하스스톤 스타일 카드 컴포넌트
// 헤더: 아이콘 + 이름 + PP
// 설명: 실시간 수치 → 부가효과 → 경고 → 플레이버
// ============================================================

import { S, lbl } from './theme.js';
import { SKILL_CATEGORY } from '../data/index.js';
import { AXIS_LABEL } from '../monsterRegistry.js';

const D = {
  card: 0x262640, cardHi: 0x2e2e48,
  neon: 0x00d4aa, red: 0xff6b6b, blue: 0x4dabf7,
  text: 0xddddf0, dim: 0x8888aa, dimmer: 0x555577, sep: 0x444466,
  yellow: 0xeebb55, orange: 0xffaa60,
};

export const SKILL_CAT = {
  stimulate: { c: D.neon, bg: 0x1a3330, icon: '💫', dark: 0x009977 },
  capture:   { c: D.red,  bg: 0x33222a, icon: '🤝', dark: 0xcc4444 },
  defend:    { c: D.blue,  bg: 0x1a2a3a, icon: '🛡️', dark: 0x2b7fc4 },
};

const AXIS_ICON = {
  sound: '🔊', temperature: '🌡️', smell: '🌿', behavior: '👁️',
};

const EMOTION_LABEL = {
  calm: '진정', curious: '호기심', fear: '공포',
  charmed: '매혹', rage: '분노', trust: '신뢰',
};

/**
 * @param {object} action  — 스킬 데이터
 * @param {number} w, h    — 카드 크기
 * @param {object} [opts]
 *   .selected, .locked, .ppEmpty, .orderNum — 기존 옵션
 *   .preview — 프리뷰 데이터 (combat에서 계산된 실시간 수치)
 *     stimulate: { taming, escape, effective, saturated, repeated }
 *     capture:   { chance, escape }
 *     defend:    { heal, defense }
 *   .compact — true면 팀 화면용 컴팩트 레이아웃
 */
export function buildSkillCard(action, w, h, opts = {}) {
  const ct = new PIXI.Container();
  const cat = SKILL_CAT[action.category] || SKILL_CAT.stimulate;
  const rd = 8;
  const a = opts.locked ? 0.2 : 1;
  const cardAlpha = opts.ppEmpty ? 0.25 : a;

  // ---- Card background ----
  const bg = new PIXI.Graphics();
  bg.roundRect(0, 0, w, h, rd).fill({ color: opts.selected ? D.cardHi : D.card, alpha: a });
  bg.roundRect(0, 4, 3, h - 8, 1.5).fill({ color: cat.c, alpha: 0.7 * a });
  if (opts.selected) {
    bg.roundRect(0, 0, w, h, rd).stroke({ color: cat.c, width: 2 });
  } else {
    bg.roundRect(0, 0, w, h, rd).stroke({ color: cat.c, width: 1, alpha: 0.3 });
  }
  ct.addChild(bg);

  // ---- Row 1: 아이콘 + 이름 + PP ----
  const axisIcon = AXIS_ICON[action.axis] || '';
  const nameText = `${cat.icon} ${action.name}`;
  const nameLbl = lbl(nameText, 7, opts.ppEmpty ? D.dimmer : D.text, true);
  nameLbl.x = 8; nameLbl.y = 4; nameLbl.alpha = cardAlpha;
  ct.addChild(nameLbl);

  if (action.pp != null) {
    const ppColor = opts.ppEmpty ? D.red : D.dim;
    const ppLbl = lbl(`${action.pp}/${action.maxPp}`, 5, ppColor, true);
    ppLbl.anchor = { x: 1, y: 0 }; ppLbl.x = w - 6; ppLbl.y = 6; ppLbl.alpha = cardAlpha;
    ct.addChild(ppLbl);
  }

  // 축 태그 (이름 옆)
  if (action.axis) {
    const axisTag = lbl(`${axisIcon}${AXIS_LABEL[action.axis] || ''}`, 4.5, D.dim);
    axisTag.anchor = { x: 1, y: 0 }; axisTag.x = w - 6; axisTag.y = 16; axisTag.alpha = cardAlpha;
    ct.addChild(axisTag);
  }

  // Order badge
  if (opts.orderNum != null) {
    const oB = new PIXI.Graphics();
    oB.roundRect(w - 20, 0, 18, 16, 4).fill({ color: cat.c });
    ct.addChild(oB);
    const oL = lbl(String(opts.orderNum), 6, 0x1a1a2e, true);
    oL.anchor = { x: 0.5, y: 0.5 }; oL.x = w - 11; oL.y = 8;
    ct.addChild(oL);
  }

  // ---- 구분선 ----
  const sepY = 24;
  ct.addChild(new PIXI.Graphics()
    .moveTo(8, sepY).lineTo(w - 8, sepY)
    .stroke({ color: D.sep, width: 0.5, alpha: 0.3 * a }));

  // ---- 설명 영역: 프리뷰가 있으면 실시간 수치, 없으면 기본 스탯 ----
  const preview = opts.preview;
  let curY = sepY + 4;

  if (preview && !preview.blocked) {
    curY = _renderLivePreview(ct, preview, action, cat, w, curY, cardAlpha);
  } else if (preview?.blocked) {
    const blockLbl = lbl('⚠ 조건 미충족', 6, D.orange, true);
    blockLbl.x = 10; blockLbl.y = curY; blockLbl.alpha = cardAlpha;
    ct.addChild(blockLbl);
    curY += 14;
  } else {
    // 프리뷰 없음 (팀 화면 등) — 기본 스탯 표시
    curY = _renderStaticDesc(ct, action, cat, w, curY, cardAlpha);
  }

  // ---- 부가효과 (감정 유발) ----
  if (action.effects && action.effects.length > 0 && curY < h - 22) {
    for (const eff of action.effects) {
      const emotionName = EMOTION_LABEL[eff.type] || eff.type;
      const pct = Math.round(eff.chance * 100);
      const effLbl = lbl(`${emotionName} ${pct}%`, 5, D.yellow);
      effLbl.x = 10; effLbl.y = curY; effLbl.alpha = cardAlpha;
      ct.addChild(effLbl);
      curY += 11;
    }
  }

  // ---- 조건부 보너스 (stateBonus) ----
  if (action.stateBonus && curY < h - 20) {
    const sb = action.stateBonus;
    let bonusText = '';
    if (sb.ifEnemyEmotion) bonusText = `${EMOTION_LABEL[sb.ifEnemyEmotion] || sb.ifEnemyEmotion} 시`;
    if (sb.ifEnemyEmotionIn) bonusText = `${sb.ifEnemyEmotionIn.map(e => EMOTION_LABEL[e] || e).join('/')} 시`;
    if (sb.tamingPowerBonus) bonusText += ` 순화 +${sb.tamingPowerBonus}`;
    if (sb.captureChanceBonus) bonusText += ` 교감 +${Math.round(sb.captureChanceBonus * 100)}%`;
    if (bonusText) {
      const bLbl = lbl(`▸ ${bonusText}`, 4.5, D.blue);
      bLbl.x = 10; bLbl.y = curY; bLbl.alpha = cardAlpha * 0.8;
      ct.addChild(bLbl);
      curY += 10;
    }
  }

  // ---- 조건 (condition) ----
  if (action.condition && curY < h - 16) {
    const cond = action.condition;
    const parts = [];
    if (cond.minTamingPercent) parts.push(`순화 ${cond.minTamingPercent}%+`);
    if (cond.maxEscapePercent) parts.push(`도주 ${cond.maxEscapePercent}%↓`);
    if (cond.requireEnemyEmotion) {
      const emotions = Array.isArray(cond.requireEnemyEmotion) ? cond.requireEnemyEmotion : [cond.requireEnemyEmotion];
      parts.push(emotions.map(e => EMOTION_LABEL[e] || e).join('/') + ' 필요');
    }
    if (parts.length > 0) {
      const condLbl = lbl(`조건: ${parts.join(', ')}`, 4.5, D.orange);
      condLbl.x = 10; condLbl.y = curY; condLbl.alpha = cardAlpha * 0.7;
      ct.addChild(condLbl);
      curY += 10;
    }
  }

  // ---- 플레이버 텍스트 (하단, dim) ----
  if (curY < h - 12) {
    const flavorText = new PIXI.Text({ text: action.log || action.desc || '', style: {
      fontFamily: '"M PLUS Rounded 1c", "Noto Sans KR", sans-serif',
      fontSize: 5.5 * S, fill: '#666688', fontWeight: '400',
      wordWrap: true, wordWrapWidth: w - 18,
      lineHeight: 7 * S,
    }});
    flavorText.x = 10; flavorText.y = Math.max(curY + 2, h - 28);
    flavorText.alpha = cardAlpha * 0.6;
    ct.addChild(flavorText);
  }

  return ct;
}

// ---- 실시간 프리뷰 렌더 (전투 중) ----
function _renderLivePreview(ct, preview, action, cat, w, y, alpha) {
  if (preview.type === 'stimulate') {
    // 순화량 + 총 배율 %
    const pctColor = preview.totalPct >= 120 ? 0x00ff88 : preview.totalPct <= 80 ? 0xff6666 : D.dim;
    const tamLbl = lbl(`순화 +${preview.taming}`, 7, D.neon, true);
    tamLbl.x = 10; tamLbl.y = y; tamLbl.alpha = alpha;
    ct.addChild(tamLbl);
    const pctLbl = lbl(`(${preview.totalPct}%)`, 5.5, pctColor, true);
    pctLbl.x = 10 + tamLbl.width / S + 4; pctLbl.y = y + 2; pctLbl.alpha = alpha;
    ct.addChild(pctLbl);
    y += 15;

    // 상성 배율
    if (preview.sensoryPct !== 100) {
      const sColor = preview.sensoryPct > 100 ? 0x00ff88 : 0xff6666;
      const sLbl = lbl(`상성 ${preview.sensoryPct}%`, 5, sColor);
      sLbl.x = 10; sLbl.y = y; sLbl.alpha = alpha;
      ct.addChild(sLbl);
      y += 11;
    }

    // 도주 위험
    const escSign = preview.escape >= 0 ? `+${preview.escape}` : String(preview.escape);
    const escColor = preview.escape > 0 ? D.red : D.neon;
    const escLbl = lbl(`도주 ${escSign}`, 5.5, escColor);
    escLbl.x = 10; escLbl.y = y; escLbl.alpha = alpha;
    ct.addChild(escLbl);
    y += 12;

    // 경고 태그
    if (preview.saturated || preview.repeated) {
      const warns = [];
      if (preview.saturated) warns.push('둔감');
      if (preview.repeated) warns.push('반복↓');
      const warnPill = new PIXI.Graphics();
      warnPill.roundRect(8, y, w - 16, 12, 4).fill({ color: D.orange, alpha: 0.15 });
      ct.addChild(warnPill);
      const warnLbl = lbl(`⚠ ${warns.join(' · ')}`, 4.5, D.orange, true);
      warnLbl.x = 12; warnLbl.y = y + 1; warnLbl.alpha = alpha;
      ct.addChild(warnLbl);
      y += 14;
    }
  }

  else if (preview.type === 'capture') {
    // 성공률 (색상 구간)
    const chanceColor = preview.chance >= 60 ? D.neon : preview.chance >= 30 ? D.yellow : D.red;
    const chanceLbl = lbl(`교감 ${preview.chance}%`, 8, chanceColor, true);
    chanceLbl.x = 10; chanceLbl.y = y; chanceLbl.alpha = alpha;
    ct.addChild(chanceLbl);
    y += 16;

    // 실패 시 도주 위험
    const escLbl = lbl(`실패 시 도주 +${preview.escape}`, 5, D.red);
    escLbl.x = 10; escLbl.y = y; escLbl.alpha = alpha;
    ct.addChild(escLbl);
    y += 12;
  }

  else if (preview.type === 'defend') {
    if (preview.defense) {
      const defLbl = lbl(`방어 +${preview.defense}`, 7, D.blue, true);
      defLbl.x = 10; defLbl.y = y; defLbl.alpha = alpha;
      ct.addChild(defLbl);
      y += 15;
    }
    if (preview.heal) {
      const healLbl = lbl(`회복 +${preview.heal} HP`, 6, D.neon);
      healLbl.x = 10; healLbl.y = y; healLbl.alpha = alpha;
      ct.addChild(healLbl);
      y += 13;
    }
  }

  return y;
}

// ---- 정적 스탯 (팀 화면용) ----
function _renderStaticDesc(ct, action, cat, w, y, alpha) {
  if (action.category === 'stimulate') {
    const pwLbl = lbl(`위력 ${action.power}`, 6, D.text);
    pwLbl.x = 10; pwLbl.y = y; pwLbl.alpha = alpha;
    ct.addChild(pwLbl);
    if (action.escapeRisk) {
      const risk = action.escapeRisk > 0 ? `+${action.escapeRisk}` : String(action.escapeRisk);
      const rLbl = lbl(`도주 ${risk}`, 5, action.escapeRisk > 0 ? D.red : D.neon);
      rLbl.x = 65; rLbl.y = y + 1; rLbl.alpha = alpha;
      ct.addChild(rLbl);
    }
    y += 13;
  } else if (action.category === 'capture') {
    const pwLbl = lbl(`교감 위력 ${action.power}`, 6, D.text);
    pwLbl.x = 10; pwLbl.y = y; pwLbl.alpha = alpha;
    ct.addChild(pwLbl);
    y += 13;
  } else if (action.category === 'defend') {
    const parts = [];
    if (action.defenseBoost) parts.push(`방어 ${action.defenseBoost}`);
    if (action.healAmount) parts.push(`회복 ${action.healAmount}`);
    const defLbl = lbl(parts.join(' · ') || '방어', 6, D.text);
    defLbl.x = 10; defLbl.y = y; defLbl.alpha = alpha;
    ct.addChild(defLbl);
    y += 13;
  }
  return y;
}
