// ============================================================
// Skill Card — 하스스톤 스타일 카드 컴포넌트
// 헤더: 아이콘 + 이름 + PP
// 설명: 실시간 수치 → 부가효과 → 경고 → 플레이버
// 설명 영역은 카드 높이에 맞게 자동 스케일
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

const AXIS_ICON = { sound: '🔊', temperature: '🌡️', smell: '🌿', behavior: '👁️' };

const EMOTION_LABEL = {
  calm: '진정', curious: '호기심', fear: '공포',
  charmed: '매혹', rage: '분노', trust: '신뢰',
};

// 기본 폰트 크기 (자동 스케일 전)
const F = { hero: 10, main: 8, sub: 7, tiny: 6 };
// 줄 높이 배율
const LH = 1.8;

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

  // ---- 헤더: 아이콘 + 이름 + PP ----
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

  if (action.axis) {
    const axisTag = lbl(`${AXIS_ICON[action.axis] || ''}${AXIS_LABEL[action.axis] || ''}`, 4.5, D.dim);
    axisTag.anchor = { x: 1, y: 0 }; axisTag.x = w - 6; axisTag.y = 16; axisTag.alpha = cardAlpha;
    ct.addChild(axisTag);
  }

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

  // ---- 설명 영역 → 서브 컨테이너에 렌더 후 자동 스케일 ----
  const descContainer = new PIXI.Container();
  const preview = opts.preview;
  let curY = 0;

  if (preview && !preview.blocked) {
    curY = _renderLivePreview(descContainer, preview, action, cat, w, curY, cardAlpha);
  } else if (preview?.blocked) {
    descContainer.addChild(Object.assign(lbl('⚠ 조건 미충족', F.hero, D.orange, true), { x: 0, y: curY, alpha: cardAlpha }));
    curY += F.hero * S * LH;
  } else {
    curY = _renderStaticDesc(descContainer, action, cat, w, curY, cardAlpha);
  }

  // 부가효과
  if (action.effects?.length > 0) {
    for (const eff of action.effects) {
      const emotionName = EMOTION_LABEL[eff.type] || eff.type;
      const pct = Math.round(eff.chance * 100);
      descContainer.addChild(Object.assign(lbl(`${emotionName} ${pct}%`, F.sub, D.yellow), { x: 0, y: curY, alpha: cardAlpha }));
      curY += F.sub * S * LH;
    }
  }

  // 조건부 보너스
  if (action.stateBonus) {
    const sb = action.stateBonus;
    let bonusText = '';
    if (sb.ifEnemyEmotion) bonusText = `${EMOTION_LABEL[sb.ifEnemyEmotion] || sb.ifEnemyEmotion} 시`;
    if (sb.ifEnemyEmotionIn) bonusText = `${sb.ifEnemyEmotionIn.map(e => EMOTION_LABEL[e] || e).join('/')} 시`;
    if (sb.tamingPowerBonus) bonusText += ` 순화 +${sb.tamingPowerBonus}`;
    if (sb.captureChanceBonus) bonusText += ` 교감 +${Math.round(sb.captureChanceBonus * 100)}%`;
    if (bonusText) {
      descContainer.addChild(Object.assign(lbl(`▸ ${bonusText}`, F.tiny, D.blue), { x: 0, y: curY, alpha: cardAlpha * 0.8 }));
      curY += F.tiny * S * LH;
    }
  }

  // 조건
  if (action.condition) {
    const cond = action.condition;
    const parts = [];
    if (cond.minTamingPercent) parts.push(`순화 ${cond.minTamingPercent}%+`);
    if (cond.maxEscapePercent) parts.push(`도주 ${cond.maxEscapePercent}%↓`);
    if (cond.requireEnemyEmotion) {
      const emotions = Array.isArray(cond.requireEnemyEmotion) ? cond.requireEnemyEmotion : [cond.requireEnemyEmotion];
      parts.push(emotions.map(e => EMOTION_LABEL[e] || e).join('/') + ' 필요');
    }
    if (parts.length > 0) {
      descContainer.addChild(Object.assign(lbl(`조건: ${parts.join(', ')}`, F.tiny, D.orange), { x: 0, y: curY, alpha: cardAlpha * 0.7 }));
      curY += F.tiny * S * LH;
    }
  }

  // 플레이버
  const flavor = action.log || action.desc || '';
  if (flavor) {
    const flavorText = new PIXI.Text({ text: flavor, style: {
      fontFamily: '"M PLUS Rounded 1c", "Noto Sans KR", sans-serif',
      fontSize: F.tiny * S, fill: '#666688', fontWeight: '400',
      wordWrap: true, wordWrapWidth: w - 18,
      lineHeight: F.tiny * S * 1.4,
    }});
    flavorText.y = curY + 2; flavorText.alpha = cardAlpha * 0.5;
    descContainer.addChild(flavorText);
    curY += F.tiny * S * 2.5;
  }

  // ---- 자동 스케일: 설명 영역이 카드에 맞도록 ----
  const availH = h - sepY - 8; // 사용 가능한 높이
  const contentH = curY;
  const scale = contentH > availH ? availH / contentH : 1;

  descContainer.x = 10;
  descContainer.y = sepY + 4;
  descContainer.scale.set(scale);
  ct.addChild(descContainer);

  return ct;
}

// ---- 실시간 프리뷰 (전투 중) ----
function _renderLivePreview(ct, preview, action, cat, w, y, alpha) {
  const line = (size) => size * S * LH;

  if (preview.type === 'stimulate') {
    const pctColor = preview.totalPct >= 120 ? 0x00ff88 : preview.totalPct <= 80 ? 0xff6666 : D.neon;
    ct.addChild(Object.assign(lbl(`순화 +${preview.taming} (${preview.totalPct}%)`, F.hero, pctColor, true), { x: 0, y, alpha }));
    y += line(F.hero);

    if (preview.sensoryPct !== 100) {
      const sColor = preview.sensoryPct > 100 ? 0x00ff88 : 0xff6666;
      ct.addChild(Object.assign(lbl(`상성 ${preview.sensoryPct}%`, F.main, sColor), { x: 0, y, alpha }));
      y += line(F.main);
    }

    const escSign = preview.escape >= 0 ? `+${preview.escape}` : String(preview.escape);
    ct.addChild(Object.assign(lbl(`도주 ${escSign}`, F.main, preview.escape > 0 ? D.red : D.neon), { x: 0, y, alpha }));
    y += line(F.main);

    if (preview.saturated || preview.repeated) {
      const warns = [];
      if (preview.saturated) warns.push('둔감');
      if (preview.repeated) warns.push('반복↓');
      const pill = new PIXI.Graphics();
      pill.roundRect(-2, y, w - 16, F.sub * S * LH, 4).fill({ color: D.orange, alpha: 0.15 });
      ct.addChild(pill);
      ct.addChild(Object.assign(lbl(`⚠ ${warns.join(' · ')}`, F.sub, D.orange, true), { x: 2, y: y + 1, alpha }));
      y += line(F.sub);
    }
  }

  else if (preview.type === 'capture') {
    const chanceColor = preview.chance >= 60 ? D.neon : preview.chance >= 30 ? D.yellow : D.red;
    ct.addChild(Object.assign(lbl(`교감 ${preview.chance}%`, F.hero + 2, chanceColor, true), { x: 0, y, alpha }));
    y += line(F.hero + 2);

    ct.addChild(Object.assign(lbl(`실패 시 도주 +${preview.escape}`, F.main, D.red), { x: 0, y, alpha }));
    y += line(F.main);
  }

  else if (preview.type === 'defend') {
    if (preview.defense) {
      ct.addChild(Object.assign(lbl(`방어 +${preview.defense}`, F.hero, D.blue, true), { x: 0, y, alpha }));
      y += line(F.hero);
    }
    if (preview.heal) {
      ct.addChild(Object.assign(lbl(`회복 +${preview.heal} HP`, F.main + 1, D.neon), { x: 0, y, alpha }));
      y += line(F.main + 1);
    }
  }

  return y;
}

// ---- 정적 스탯 (팀 화면용) ----
function _renderStaticDesc(ct, action, cat, w, y, alpha) {
  const line = (size) => size * S * LH;

  if (action.category === 'stimulate') {
    ct.addChild(Object.assign(lbl(`위력 ${action.power}`, F.main + 1, D.text), { x: 0, y, alpha }));
    y += line(F.main + 1);
    if (action.escapeRisk) {
      const risk = action.escapeRisk > 0 ? `+${action.escapeRisk}` : String(action.escapeRisk);
      ct.addChild(Object.assign(lbl(`도주 ${risk}`, F.main, action.escapeRisk > 0 ? D.red : D.neon), { x: 0, y, alpha }));
      y += line(F.main);
    }
  } else if (action.category === 'capture') {
    ct.addChild(Object.assign(lbl(`교감 위력 ${action.power}`, F.main + 1, D.text), { x: 0, y, alpha }));
    y += line(F.main + 1);
  } else if (action.category === 'defend') {
    if (action.defenseBoost) {
      ct.addChild(Object.assign(lbl(`방어 ${action.defenseBoost}`, F.main + 1, D.text), { x: 0, y, alpha }));
      y += line(F.main + 1);
    }
    if (action.healAmount) {
      ct.addChild(Object.assign(lbl(`회복 ${action.healAmount}`, F.main + 1, D.neon), { x: 0, y, alpha }));
      y += line(F.main + 1);
    }
  }
  return y;
}
