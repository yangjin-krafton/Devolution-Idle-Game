// ============================================================
// Skill Card — 보드게임 토큰 카드 스타일
//
// 구조:
//   헤더: 카테고리 아이콘 + 이름
//   중앙: 핵심 효과 (큰 이모지 + 큰 수치)
//   힌트: 방향 힌트 or 상태
// ============================================================

import { lbl } from './theme.js';
import { ENV_AXIS_ICON, ENV_AXIS_LABEL } from '../data/index.js';

const D = {
  card: 0x262640, cardHi: 0x2e2e48,
  neon: 0x00d4aa, red: 0xff6b6b, blue: 0x4dabf7,
  text: 0xddddf0, dim: 0x8888aa, dimmer: 0x555577, sep: 0x444466,
  yellow: 0xeebb55, orange: 0xffaa60, purple: 0xccaaee,
};

export const SKILL_CAT = {
  stimulate: { c: D.neon,   bg: 0x1a3330, icon: '💫', dark: 0x009977 },
  capture:   { c: D.red,    bg: 0x33222a, icon: '🤝', dark: 0xcc4444 },
  defend:    { c: D.blue,   bg: 0x1a2a3a, icon: '🛡️', dark: 0x2b7fc4 },
  survey:    { c: D.purple, bg: 0x2a2040, icon: '🔍', dark: 0x8866bb },
};

// 스킬 axis → 환경 축 매핑 (combat.js와 동일)
const AXIS_TO_ENV = { sound: 'sound', temperature: 'temperature', smell: 'smell', behavior: 'humidity' };

export function buildSkillCard(action, w, h, opts = {}) {
  const ct = new PIXI.Container();
  const cat = SKILL_CAT[action.category] || SKILL_CAT.stimulate;
  const rd = 10;
  const a = opts.locked ? 0.2 : 1;
  const cardAlpha = opts.ppEmpty ? 0.25 : a;
  const preview = opts.preview;

  // ======== 배경 ========
  const bg = new PIXI.Graphics();

  // 선택 시: 살짝 위로 올라간 느낌 (그림자 + 밝은 배경)
  if (opts.selected) {
    bg.roundRect(1, 3, w - 2, h - 2, rd).fill({ color: 0x000000, alpha: 0.3 });
    bg.roundRect(0, 0, w, h, rd).fill({ color: D.cardHi });
    bg.roundRect(0, 0, w, h, rd).stroke({ color: cat.c, width: 2.5 });
    // 상단 glow
    bg.roundRect(2, 1, w - 4, 4, 2).fill({ color: cat.c, alpha: 0.3 });
  } else {
    bg.roundRect(0, 0, w, h, rd).fill({ color: D.card, alpha: a });
    bg.roundRect(0, 0, w, h, rd).stroke({ color: cat.c, width: 1, alpha: 0.3 * a });
  }
  // 좌측 카테고리 바
  bg.roundRect(0, 6, 3, h - 12, 1.5).fill({ color: cat.c, alpha: 0.7 * a });
  ct.addChild(bg);

  // ======== 헤더: 아이콘 + 이름 ========
  const nameL = lbl(action.name, 7, opts.ppEmpty ? D.dimmer : D.text, true);
  nameL.x = 8; nameL.y = 4; nameL.alpha = cardAlpha;
  ct.addChild(nameL);

  // ======== PP 텍스트 (우하단, 포켓몬 스타일) ========
  if (action.pp != null && action.maxPp != null) {
    const ppColor = action.pp === 0 ? D.red : D.dim;
    const ppL = lbl(`${action.pp}/${action.maxPp}`, 6, ppColor);
    ppL.anchor = { x: 1, y: 1 };
    ppL.x = w - 6; ppL.y = h - 4; ppL.alpha = cardAlpha;
    ct.addChild(ppL);
  }

  // ======== 턴 순서 배지 ========
  if (opts.orderNum != null) {
    const oB = new PIXI.Graphics();
    oB.roundRect(w - 20, 0, 18, 16, 4).fill({ color: cat.c });
    ct.addChild(oB);
    const oL = lbl(String(opts.orderNum), 6, 0x1a1a2e, true);
    oL.anchor = { x: 0.5, y: 0.5 }; oL.x = w - 11; oL.y = 8;
    ct.addChild(oL);
  }

  // ======== 구분선 ========
  const sepY = 20;
  ct.addChild(new PIXI.Graphics()
    .moveTo(6, sepY).lineTo(w - 6, sepY)
    .stroke({ color: D.sep, width: 0.5, alpha: 0.3 * a }));

  // ======== 중앙: 핵심 효과 ========
  const centerY = sepY + 4;
  const centerH = h - sepY - 6;

  if (preview && !preview.blocked) {
    _renderPreview(ct, preview, action, cat, w, centerY, centerH, cardAlpha);
  } else if (preview?.blocked) {
    const bl = lbl('⚠ 조건 미충족', 8, D.orange, true);
    bl.anchor = { x: 0.5, y: 0.5 };
    bl.x = w / 2; bl.y = centerY + centerH / 2; bl.alpha = cardAlpha;
    ct.addChild(bl);
  } else {
    _renderStatic(ct, action, cat, w, centerY, centerH, cardAlpha);
  }


  return ct;
}

// ======== 전투 중 프리뷰 ========
function _renderPreview(ct, preview, action, cat, w, cy, ch, alpha) {
  const midX = w / 2;
  const midY = cy + ch * 0.4;

  if (preview.type === 'stimulate') {
    // 환경 축 아이콘 (크게)
    const envAxis = AXIS_TO_ENV[action.axis] || 'sound';
    const envIcon = ENV_AXIS_ICON[envAxis] || '💫';
    const envName = ENV_AXIS_LABEL[envAxis] || '';

    const iconL = lbl(envIcon, 14, cat.c, true);
    iconL.anchor = { x: 0.5, y: 0.5 };
    iconL.x = midX - 20; iconL.y = midY; iconL.alpha = alpha;
    ct.addChild(iconL);

    // 변화량 (크게)
    const delta = preview.delta || 0;
    const deltaText = delta > 0 ? `+${delta}` : String(delta);
    const deltaL = lbl(deltaText, 14, D.text, true);
    deltaL.anchor = { x: 0.5, y: 0.5 };
    deltaL.x = midX + 20; deltaL.y = midY; deltaL.alpha = alpha;
    ct.addChild(deltaL);

    // 힌트 (아래)
    const hintY = midY + 22;
    const hintMap = { low: '▲ 올려야', high: '▼ 내려야', ok: '● 적절' };
    const hintColor = preview.hint === 'ok' ? D.neon : preview.hint === 'low' ? 0xff8866 : 0x66aaff;
    const hintText = hintMap[preview.hint] || envName;
    const hintL = lbl(hintText, 6, hintColor, true);
    hintL.anchor = { x: 0.5, y: 0 };
    hintL.x = midX; hintL.y = hintY; hintL.alpha = alpha;
    ct.addChild(hintL);

    // 공개된 축이면 목표값
    if (preview.revealed && preview.idealVal != null) {
      const iSign = preview.idealVal > 0 ? '+' : '';
      const tolText = preview.tolerance > 0 ? `±${preview.tolerance}` : '';
      const goalL = lbl(`목표 ${iSign}${preview.idealVal}${tolText}`, 5, D.purple);
      goalL.anchor = { x: 0.5, y: 0 };
      goalL.x = midX; goalL.y = hintY + 14; goalL.alpha = alpha * 0.7;
      ct.addChild(goalL);
    }
  }

  else if (preview.type === 'defend') {
    const iconL = lbl('🛡️', 14, D.blue, true);
    iconL.anchor = { x: 0.5, y: 0.5 };
    iconL.x = midX; iconL.y = midY - 5; iconL.alpha = alpha;
    ct.addChild(iconL);

    const infoY = midY + 18;
    if (preview.escapeReduce > 0) {
      const escL = lbl(`⏳-${preview.escapeReduce}`, 7, D.neon, true);
      escL.anchor = { x: 0.5, y: 0 };
      escL.x = midX - (preview.heal ? 25 : 0); escL.y = infoY; escL.alpha = alpha;
      ct.addChild(escL);
    }
    if (preview.heal) {
      const healL = lbl(`💚+${preview.heal}`, 7, D.neon, true);
      healL.anchor = { x: 0.5, y: 0 };
      healL.x = midX + (preview.escapeReduce > 0 ? 25 : 0); healL.y = infoY; healL.alpha = alpha;
      ct.addChild(healL);
    }
    if (!preview.escapeReduce && !preview.heal) {
      const defL = lbl('수비', 8, D.blue, true);
      defL.anchor = { x: 0.5, y: 0 };
      defL.x = midX; defL.y = infoY; defL.alpha = alpha;
      ct.addChild(defL);
    }
  }

  else if (preview.type === 'capture') {
    const iconL = lbl('🤝', 14, D.yellow, true);
    iconL.anchor = { x: 0.5, y: 0.5 };
    iconL.x = midX; iconL.y = midY - 5; iconL.alpha = alpha;
    ct.addChild(iconL);

    const infoY = midY + 18;
    if (preview.escapeReduce > 0) {
      const escL = lbl(`⏳-${preview.escapeReduce}`, 8, D.neon, true);
      escL.anchor = { x: 0.5, y: 0 };
      escL.x = midX; escL.y = infoY; escL.alpha = alpha;
      ct.addChild(escL);
    } else {
      const waitL = lbl('연장전에 효과', 6, D.dim);
      waitL.anchor = { x: 0.5, y: 0 };
      waitL.x = midX; waitL.y = infoY; waitL.alpha = alpha;
      ct.addChild(waitL);
    }
  }

  else if (preview.type === 'survey') {
    const iconL = lbl('🔍', 14, D.purple, true);
    iconL.anchor = { x: 0.5, y: 0.5 };
    iconL.x = midX; iconL.y = midY - 5; iconL.alpha = alpha;
    ct.addChild(iconL);

    const infoY = midY + 18;
    const countText = preview.unrevealedCount > 0
      ? `? → ! (${preview.unrevealedCount}축)`
      : '모두 공개됨';
    const countColor = preview.unrevealedCount > 0 ? D.text : D.dim;
    const infoL = lbl(countText, 7, countColor, true);
    infoL.anchor = { x: 0.5, y: 0 };
    infoL.x = midX; infoL.y = infoY; infoL.alpha = alpha;
    ct.addChild(infoL);
  }
}

// ======== 정적 (팀 화면) ========
function _renderStatic(ct, action, cat, w, cy, ch, alpha) {
  const midX = w / 2;
  const midY = cy + ch * 0.4;

  if (action.category === 'stimulate') {
    const envAxis = AXIS_TO_ENV[action.axis] || 'sound';
    const envIcon = ENV_AXIS_ICON[envAxis] || '💫';

    const iconL = lbl(envIcon, 12, cat.c, true);
    iconL.anchor = { x: 0.5, y: 0.5 };
    iconL.x = midX - 15; iconL.y = midY; iconL.alpha = alpha;
    ct.addChild(iconL);

    const mag = action.power > 5 ? '±2' : '±1';
    const magL = lbl(mag, 10, D.text, true);
    magL.anchor = { x: 0.5, y: 0.5 };
    magL.x = midX + 18; magL.y = midY; magL.alpha = alpha;
    ct.addChild(magL);

    // axis 이름
    const nameL = lbl(ENV_AXIS_LABEL[envAxis] || '', 6, D.dim);
    nameL.anchor = { x: 0.5, y: 0 };
    nameL.x = midX; nameL.y = midY + 18; nameL.alpha = alpha;
    ct.addChild(nameL);
  }

  else if (action.category === 'defend') {
    const iconL = lbl('🛡️', 12, D.blue, true);
    iconL.anchor = { x: 0.5, y: 0.5 };
    iconL.x = midX; iconL.y = midY; iconL.alpha = alpha;
    ct.addChild(iconL);

    const parts = [];
    if (action.defenseBoost) parts.push(`방어 ${action.defenseBoost}`);
    if (action.healAmount) parts.push(`회복 ${action.healAmount}`);
    if (parts.length > 0) {
      const infoL = lbl(parts.join(' · '), 6, D.dim);
      infoL.anchor = { x: 0.5, y: 0 };
      infoL.x = midX; infoL.y = midY + 18; infoL.alpha = alpha;
      ct.addChild(infoL);
    }
  }

  else if (action.category === 'capture') {
    const iconL = lbl('🤝', 12, D.yellow, true);
    iconL.anchor = { x: 0.5, y: 0.5 };
    iconL.x = midX; iconL.y = midY; iconL.alpha = alpha;
    ct.addChild(iconL);

    const infoL = lbl('연장전 도주 감소', 6, D.dim);
    infoL.anchor = { x: 0.5, y: 0 };
    infoL.x = midX; infoL.y = midY + 18; infoL.alpha = alpha;
    ct.addChild(infoL);
  }

  else if (action.category === 'survey') {
    const iconL = lbl('🔍', 12, D.purple, true);
    iconL.anchor = { x: 0.5, y: 0.5 };
    iconL.x = midX; iconL.y = midY; iconL.alpha = alpha;
    ct.addChild(iconL);

    const infoL = lbl('환경 조사', 6, D.dim);
    infoL.anchor = { x: 0.5, y: 0 };
    infoL.x = midX; infoL.y = midY + 18; infoL.alpha = alpha;
    ct.addChild(infoL);
  }
}
