// ============================================================
// Skill Card — 하스스톤/보드게임 카드 스타일
//
// 레이아웃:
//   ┌──────────────────────┐
//   │ [PP] 스킬이름    [순서] │  ← 탑바
//   │──────────────────────│
//   │                      │
//   │   🔊  −3            │  ← 주축: 큰 아이콘 + 큰 수치
//   │   ☀️−1  🌿+1        │  ← 부축: 작은 칩들
//   │                      │
//   │──────────────────────│
//   │ 거친 다축형 / 포획핵심 │  ← 설명 + 역할 태그
//   │              ★☆☆ PP │  ← 순도 + PP잔량
//   └──────────────────────┘
// ============================================================

import { lbl } from './theme.js';
import { ENV_AXIS_ICON } from '../data/index.js';

const D = {
  card: 0x1e1e32, cardHi: 0x2a2a44,
  neon: 0x00d4aa, red: 0xff6b6b, blue: 0x4dabf7,
  text: 0xddddf0, dim: 0x8888aa, dimmer: 0x555577, sep: 0x3a3a55,
  yellow: 0xeebb55, orange: 0xffaa60, purple: 0xccaaee,
  mint: 0x66ddbb,
};

// effectType별 테마
const ET = {
  axis_change:   { icon: '💫', color: D.neon,   bg: 0x1a3330, label: '조율' },
  axis_convert:  { icon: '🔄', color: D.yellow, bg: 0x33301a, label: '변환' },
  mechanic_check:{ icon: '⚙️', color: D.purple, bg: 0x2a2040, label: '대응' },
  axis_lock:     { icon: '🔒', color: D.blue,   bg: 0x1a2a3a, label: '고정' },
};

// 메커닉 ID → 한글 이름
const MECH_NAME = {
  sonic_buildup: '울음 누적', lava_shell: '용암 갑피', checkpoint_turn: '체크포인트',
  ambush_pattern: '매복 패턴', last_skill_echo: '기억 반향', frost_pause: '서리 정지',
  mist_drift: '안개 밀림', web_anchor: '거미줄 말뚝', resonance_window: '공명 구간',
  phase_molt: '탈피 페이즈', prep_then_burst: '준비 폭발', opening_lock: '초반 봉인',
  panic_threshold: '위압 임계', thorn_bounce: '가시 튕김', shadow_escape: '그림자 탈출',
  tidal_rhythm: '조류 리듬', drain_feast: '기생 흡수', charge_burst: '과충전',
};

export const SKILL_CAT = {
  stimulate: { c: D.neon,   icon: '💫' },
  capture:   { c: D.red,    icon: '🤝' },
  defend:    { c: D.blue,   icon: '🛡️' },
  survey:    { c: D.purple, icon: '🔍' },
};

const AXIS_TO_ENV = { sound: 'sound', temperature: 'temperature', smell: 'smell', behavior: 'humidity' };

// ============================================================
// Public: buildSkillCard
// ============================================================

export function buildSkillCard(action, w, h, opts = {}) {
  const ct = new PIXI.Container();
  const a = opts.locked ? 0.2 : 1;
  const alpha = opts.ppEmpty ? 0.25 : a;
  const preview = opts.preview;
  const et = action.effectType || 'axis_change';
  const theme = ET[et] || ET.axis_change;

  // compact 모드: h < 60 → 탑바 축소
  const compact = h < 60;
  const topH = compact ? 14 : 22;

  // ════ 배경 ════
  _drawBackground(ct, w, h, theme, opts, a);

  // ════ 탑바: PP 코스트 + 이름 ════
  _drawTopBar(ct, action, w, topH, theme, opts, alpha, compact);

  // ════ 중앙 영역 ════
  const bodyY = topH;
  const bodyH = h - topH;

  if (preview && !preview.blocked) {
    _renderPreview(ct, preview, action, theme, w, bodyY, bodyH, alpha);
  } else if (preview?.blocked) {
    const bl = lbl('⚠', 7, D.orange, true);
    bl.anchor = { x: 0.5, y: 0.5 };
    bl.x = w / 2; bl.y = bodyY + bodyH / 2; bl.alpha = alpha;
    ct.addChild(bl);
  } else {
    _renderBody(ct, action, theme, w, bodyY, bodyH, alpha, compact);
  }

  // 순도 별 (우하단, 하단바 대신 바디 안에 표시)
  const purity = action.purityLevel || 0;
  if (purity > 0 && !compact) {
    const stars = '★'.repeat(purity) + '☆'.repeat(Math.max(0, 3 - purity));
    const sL = lbl(stars, 4, theme.color);
    sL.anchor = { x: 1, y: 1 };
    sL.x = w - 5; sL.y = h - 3; sL.alpha = alpha * 0.5;
    ct.addChild(sL);
  }

  return ct;
}

// ============================================================
// 배경
// ============================================================

function _drawBackground(ct, w, h, theme, opts, a) {
  const bg = new PIXI.Graphics();
  const rd = 8;

  if (opts.selected) {
    bg.roundRect(1, 2, w - 2, h - 1, rd).fill({ color: 0x000000, alpha: 0.35 });
    bg.roundRect(0, 0, w, h, rd).fill({ color: D.cardHi });
    bg.roundRect(0, 0, w, h, rd).stroke({ color: theme.color, width: 2 });
    // 상단 글로우
    bg.roundRect(2, 1, w - 4, 3, 2).fill({ color: theme.color, alpha: 0.4 });
  } else {
    bg.roundRect(0, 0, w, h, rd).fill({ color: D.card, alpha: a });
    bg.roundRect(0, 0, w, h, rd).stroke({ color: theme.color, width: 1, alpha: 0.25 * a });
  }

  // effectType 색상 바 (좌측)
  bg.roundRect(0, 4, 3, h - 8, 1.5).fill({ color: theme.color, alpha: 0.6 * a });

  ct.addChild(bg);
}

// ============================================================
// 탑바: PP 코스트 뱃지 + 이름 + 턴순서
// ============================================================

function _drawTopBar(ct, action, w, topH, theme, opts, alpha, compact) {
  const midY = topH / 2;

  // PP 코스트 (좌상, 작은 사각 뱃지)
  if (action.pp != null) {
    const bw = compact ? 12 : 16, bh = compact ? 10 : 14;
    const ppBg = new PIXI.Graphics();
    ppBg.roundRect(3, midY - bh / 2, bw, bh, 3)
      .fill({ color: theme.color, alpha: 0.3 })
      .stroke({ color: theme.color, width: 0.5, alpha: 0.5 });
    ct.addChild(ppBg);
    const ppT = lbl(String(action.pp), compact ? 4.5 : 5.5, D.text, true);
    ppT.anchor = { x: 0.5, y: 0.5 }; ppT.x = 3 + bw / 2; ppT.y = midY; ppT.alpha = alpha;
    ct.addChild(ppT);
  }

  // 스킬 이름
  const nameSize = compact ? 5 : 6;
  const nameX = compact ? 16 : 22;
  const nameT = lbl(action.name, nameSize, D.text, true);
  nameT.x = nameX; nameT.y = compact ? 2 : 4; nameT.alpha = alpha;
  ct.addChild(nameT);

  // 턴 순서 뱃지 (우상)
  if (opts.orderNum != null) {
    const oB = new PIXI.Graphics();
    oB.roundRect(w - 18, 1, 16, topH - 4, 4).fill({ color: theme.color });
    ct.addChild(oB);
    const oL = lbl(String(opts.orderNum), 6, 0x1a1a2e, true);
    oL.anchor = { x: 0.5, y: 0.5 }; oL.x = w - 10; oL.y = midY;
    ct.addChild(oL);
  }

  // 탑바 구분선
  ct.addChild(new PIXI.Graphics()
    .moveTo(5, topH - 2).lineTo(w - 5, topH - 2)
    .stroke({ color: D.sep, width: 0.5, alpha: 0.4 }));
}

// (하단바 제거됨 — 순도 별은 buildSkillCard 내에서 직접 표시)

// ============================================================
// 중앙 바디: 정적 표시 (도감/팀 화면)
// ============================================================

function _renderBody(ct, action, theme, w, cy, ch, alpha, compact) {
  const midX = w / 2;
  const et = action.effectType || 'axis_change';

  // ──────── stimulate 계열 ────────
  if (action.category === 'stimulate') {

    // 주축 + 부축 분리
    const allAxes = action.deltas
      ? Object.entries(action.deltas).filter(([, v]) => v && v !== 0)
      : [];

    if (allAxes.length === 0) {
      // 델타 없음 — effectType 아이콘만
      const ic = lbl(theme.icon, 14, theme.color, true);
      ic.anchor = { x: 0.5, y: 0.5 }; ic.x = midX; ic.y = cy + ch / 2;
      ic.alpha = alpha; ct.addChild(ic);
      return;
    }

    // 주축: 절대값 가장 큰 축
    allAxes.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    const [mainAxis, mainDelta] = allAxes[0];
    const sideAxes = allAxes.slice(1);

    // ── 주축: 아이콘 + 수치 (카드 중심) ──
    const iconSize = compact ? 10 : 16;
    const numSize = compact ? 9 : 14;
    const mainY = cy + (compact ? ch * 0.5 : (sideAxes.length > 0 ? ch * 0.35 : ch * 0.45));
    const mainIcon = ENV_AXIS_ICON[mainAxis] || '·';
    const mainSign = mainDelta > 0 ? '+' : '';
    const mainCol = mainDelta > 0 ? D.neon : D.orange;

    // effectType 뱃지 (변환/대응/고정일 때, 라운드 뱃지)
    if (et !== 'axis_change' && !compact) {
      const bText = `${theme.icon} ${theme.label}`;
      const bW = bText.length * 5 + 12;
      ct.addChild(new PIXI.Graphics()
        .roundRect(midX - bW / 2, cy + 1, bW, 12, 6)
        .fill({ color: theme.color, alpha: 0.2 })
        .stroke({ color: theme.color, width: 0.5, alpha: 0.4 }));
      const badge = lbl(bText, 4.5, theme.color, true);
      badge.anchor = { x: 0.5, y: 0.5 };
      badge.x = midX; badge.y = cy + 7; badge.alpha = alpha;
      ct.addChild(badge);
    }

    // 주축 아이콘
    const mI = lbl(mainIcon, iconSize, theme.color, true);
    mI.anchor = { x: 0.5, y: 0.5 };
    mI.x = midX - (compact ? 12 : 18); mI.y = mainY; mI.alpha = alpha;
    ct.addChild(mI);

    // 주축 수치
    const mD = lbl(`${mainSign}${mainDelta}`, numSize, mainCol, true);
    mD.anchor = { x: 0.5, y: 0.5 };
    mD.x = midX + (compact ? 10 : 16); mD.y = mainY; mD.alpha = alpha;
    ct.addChild(mD);

    // ── 부축: 작은 칩 스타일 (compact에서는 생략) ──
    if (sideAxes.length > 0 && !compact) {
      const chipY = mainY + 24;
      const chipW = Math.min(36, (w - 16) / sideAxes.length);
      const chipStartX = midX - (sideAxes.length * chipW) / 2;

      sideAxes.forEach(([axis, delta], i) => {
        const cx = chipStartX + i * chipW + chipW / 2;
        const icon = ENV_AXIS_ICON[axis] || '·';
        const sign = delta > 0 ? '+' : '';
        const col = delta > 0 ? D.mint : D.orange;

        // 칩 배경
        ct.addChild(new PIXI.Graphics()
          .roundRect(cx - chipW / 2 + 2, chipY - 1, chipW - 4, 14, 4)
          .fill({ color: col, alpha: 0.1 }));

        const t = lbl(`${icon}${sign}${delta}`, 5.5, col, true);
        t.anchor = { x: 0.5, y: 0.5 };
        t.x = cx; t.y = chipY + 6; t.alpha = alpha;
        ct.addChild(t);
      });
    }

    // 메커닉 연동 표시 (mechanic_check일 때)
    if (et === 'mechanic_check' && action.mechanicLink) {
      const mechName = MECH_NAME[action.mechanicLink] || action.mechanicLink;
      const mechY = cy + ch - 4;
      const mL = lbl(`⚙️ ${mechName}`, 4.5, D.purple);
      mL.anchor = { x: 0.5, y: 1 };
      mL.x = midX; mL.y = mechY; mL.alpha = alpha * 0.7;
      ct.addChild(mL);
    }

    // 변환 화살표 (axis_convert일 때 주축→부축 사이)
    if (et === 'axis_convert' && sideAxes.length > 0) {
      const arrowY = mainY + 10;
      const aL = lbl('→', 7, D.dim, true);
      aL.anchor = { x: 0.5, y: 0.5 };
      aL.x = midX; aL.y = arrowY; aL.alpha = alpha * 0.4;
      ct.addChild(aL);
    }

    return;
  }

  // ──────── defend ────────
  if (action.category === 'defend') {
    const ic = lbl('🛡️', 14, D.blue, true);
    ic.anchor = { x: 0.5, y: 0.5 }; ic.x = midX; ic.y = cy + ch * 0.4;
    ic.alpha = alpha; ct.addChild(ic);
    const parts = [];
    if (action.defenseBoost) parts.push(`방어 +${action.defenseBoost}`);
    if (action.healAmount) parts.push(`회복 +${action.healAmount}`);
    if (parts.length) {
      const info = lbl(parts.join('  '), 6, D.dim);
      info.anchor = { x: 0.5, y: 0 };
      info.x = midX; info.y = cy + ch * 0.4 + 16; info.alpha = alpha;
      ct.addChild(info);
    }
    return;
  }

  // ──────── capture ────────
  if (action.category === 'capture') {
    const ic = lbl('🤝', 14, D.yellow, true);
    ic.anchor = { x: 0.5, y: 0.5 }; ic.x = midX; ic.y = cy + ch * 0.4;
    ic.alpha = alpha; ct.addChild(ic);
    const info = lbl('도주 억제', 6, D.dim);
    info.anchor = { x: 0.5, y: 0 };
    info.x = midX; info.y = cy + ch * 0.4 + 16; info.alpha = alpha;
    ct.addChild(info);
    return;
  }

  // ──────── survey ────────
  if (action.category === 'survey') {
    const ic = lbl('🔍', 14, D.purple, true);
    ic.anchor = { x: 0.5, y: 0.5 }; ic.x = midX; ic.y = cy + ch * 0.4;
    ic.alpha = alpha; ct.addChild(ic);
    const info = lbl('환경 조사', 6, D.dim);
    info.anchor = { x: 0.5, y: 0 };
    info.x = midX; info.y = cy + ch * 0.4 + 16; info.alpha = alpha;
    ct.addChild(info);
    return;
  }
}

// ============================================================
// 전투 중 프리뷰
// ============================================================

function _renderPreview(ct, preview, action, theme, w, cy, ch, alpha) {
  const midX = w / 2;
  const midY = cy + ch * 0.4;

  if (preview.type === 'stimulate') {
    // 다축 프리뷰
    if (preview.multiAxis && preview.axisChanges) {
      const entries = Object.entries(preview.axisChanges);
      const startY = cy + 2;
      const rowH = Math.min(14, (ch - 4) / Math.max(entries.length, 1));
      entries.forEach(([axis, info], i) => {
        const icon = ENV_AXIS_ICON[axis] || '·';
        const sign = info.delta > 0 ? '+' : '';
        const col = info.delta > 0 ? D.neon : D.orange;
        const hintMap = { low: '▲', high: '▼', ok: '●' };
        const hintCol = info.hint === 'ok' ? D.neon : info.hint === 'low' ? 0xff8866 : 0x66aaff;
        const rowY = startY + i * rowH;

        ct.addChild(Object.assign(lbl(icon, 7, theme.color, true), { x: 6, y: rowY, alpha }));
        ct.addChild(Object.assign(lbl(`${info.current}→${info.newVal}`, 5.5, D.text, true), { x: 20, y: rowY + 1, alpha }));
        const dL = lbl(`${sign}${info.delta}`, 7, col, true);
        dL.anchor = { x: 1, y: 0 }; dL.x = w - 18; dL.y = rowY; dL.alpha = alpha;
        ct.addChild(dL);
        if (info.hint !== 'ok') {
          const hL = lbl(hintMap[info.hint] || '', 6, hintCol, true);
          hL.anchor = { x: 1, y: 0 }; hL.x = w - 5; hL.y = rowY; hL.alpha = alpha;
          ct.addChild(hL);
        }
      });
      return;
    }
    // 단축 프리뷰
    const envAxis = AXIS_TO_ENV[action.axis] || action.axis || 'sound';
    const envIcon = ENV_AXIS_ICON[envAxis] || '💫';
    ct.addChild(Object.assign(lbl(envIcon, 14, theme.color, true),
      { x: midX - 18, y: midY, alpha, anchor: { x: 0.5, y: 0.5 } }));
    const delta = preview.delta || 0;
    ct.addChild(Object.assign(lbl(delta > 0 ? `+${delta}` : String(delta), 14, D.text, true),
      { x: midX + 18, y: midY, alpha, anchor: { x: 0.5, y: 0.5 } }));

    const hintY = midY + 20;
    const hintMap = { low: '▲ 올려야', high: '▼ 내려야', ok: '● 적절' };
    const hintCol = preview.hint === 'ok' ? D.neon : preview.hint === 'low' ? 0xff8866 : 0x66aaff;
    ct.addChild(Object.assign(lbl(hintMap[preview.hint] || '', 5.5, hintCol, true),
      { x: midX, y: hintY, alpha, anchor: { x: 0.5, y: 0 } }));

    if (preview.revealed && preview.idealVal != null) {
      const iSign = preview.idealVal > 0 ? '+' : '';
      const tol = preview.tolerance > 0 ? `±${preview.tolerance}` : '';
      ct.addChild(Object.assign(lbl(`목표 ${iSign}${preview.idealVal}${tol}`, 4.5, D.purple),
        { x: midX, y: hintY + 12, alpha: alpha * 0.7, anchor: { x: 0.5, y: 0 } }));
    }
    return;
  }

  if (preview.type === 'defend') {
    ct.addChild(Object.assign(lbl('🛡️', 14, D.blue, true),
      { x: midX, y: midY - 5, alpha, anchor: { x: 0.5, y: 0.5 } }));
    const infoY = midY + 16;
    if (preview.escapeReduce > 0)
      ct.addChild(Object.assign(lbl(`⏳-${preview.escapeReduce}`, 7, D.neon, true),
        { x: midX, y: infoY, alpha, anchor: { x: 0.5, y: 0 } }));
    else
      ct.addChild(Object.assign(lbl('수비', 7, D.blue, true),
        { x: midX, y: infoY, alpha, anchor: { x: 0.5, y: 0 } }));
    return;
  }

  if (preview.type === 'capture') {
    ct.addChild(Object.assign(lbl('🤝', 14, D.yellow, true),
      { x: midX, y: midY - 5, alpha, anchor: { x: 0.5, y: 0.5 } }));
    const text = preview.escapeReduce > 0 ? `⏳-${preview.escapeReduce}` : '연장전에 효과';
    const col = preview.escapeReduce > 0 ? D.neon : D.dim;
    ct.addChild(Object.assign(lbl(text, 6, col),
      { x: midX, y: midY + 16, alpha, anchor: { x: 0.5, y: 0 } }));
    return;
  }

  if (preview.type === 'survey') {
    ct.addChild(Object.assign(lbl('🔍', 14, D.purple, true),
      { x: midX, y: midY - 5, alpha, anchor: { x: 0.5, y: 0.5 } }));
    const text = preview.unrevealedCount > 0 ? `? → ! (${preview.unrevealedCount}축)` : '모두 공개됨';
    ct.addChild(Object.assign(lbl(text, 6, preview.unrevealedCount > 0 ? D.text : D.dim),
      { x: midX, y: midY + 16, alpha, anchor: { x: 0.5, y: 0 } }));
  }
}
