// ============================================================
// Team Edit Screen — 전투 후 팀 편성 + 순화 몬스터 합류 결정
// Layout: titleUI 스타일 (Dark/Neon)
//   상단: 포획 몬스터 쇼케이스
//   중단: 6슬롯 (주전3 + 대기3) — 탭으로 상세, 드래그로 교체
//   하단: 선택 슬롯 상세 (titleUI renderPageInfo 동일 포맷)
//   최하단: 고정 액션 바
// ============================================================

import { W, H, S, lbl, cuteBtn } from './theme.js';
import { D, darkCard, neonBadge, statBar } from './theme-dark.js';
import { monster } from './sprites.js';
import { buildSkillCard } from './skillCard.js';
import { getAbility } from '../ability.js';
import { ALL_MONSTERS, AXIS_LABEL } from '../data/index.js';

const PAD = 14;

// ---- Layout (top-down) ----
const CAPTURE_Y = 8, CAPTURE_H_FULL = 130, CAPTURE_H_EMPTY = 58;
const SLOT_W = 128, SLOT_H = 105, SLOT_GAP = 16;
const SLOT_LEFT = Math.round((W - (SLOT_W * 3 + SLOT_GAP * 2)) / 2);
const DETAIL_H = 280;
const ACTION_BAR_H = 70;
const ACTION_BAR_Y = H - ACTION_BAR_H;
const DRAG_THRESHOLD = 8;

// ---- Dynamic Y positions (recalculated when capture state changes) ----
let GUIDE_Y, ACTIVE_HDR_Y, ACTIVE_SLOTS_Y, BENCH_HDR_Y, BENCH_SLOTS_Y, DETAIL_Y;

function recalcLayout() {
  const captureH = capturedEnemy ? CAPTURE_H_FULL : CAPTURE_H_EMPTY;
  GUIDE_Y = CAPTURE_Y + captureH + 6;
  ACTIVE_HDR_Y = GUIDE_Y + 22;
  ACTIVE_SLOTS_Y = ACTIVE_HDR_Y + 20;
  BENCH_HDR_Y = ACTIVE_SLOTS_Y + SLOT_H + 6;
  BENCH_SLOTS_Y = BENCH_HDR_Y + 20;
  DETAIL_Y = BENCH_SLOTS_Y + SLOT_H + 10;
}

// ---- State ----
let ct, detailBody, detailPanel, slotGfx = [], captureArea, guideLabel;
let activeHdr, benchHdr;
let actionBar, recruitBtn, releaseBtn, nextBtn;
let activeCountLabel, benchCountLabel;
let removeIndicator;
let teamMgr = null, capturedEnemy = null;
let selectedIdx = -1;
let onRecruitCb = null, onSkipCb = null;

// Drag state (titleUI pattern)
let mode = 'idle';       // 'idle' | 'slot-pending' | 'dragging'
let pendingSlotIdx = -1;
let startPos = { x: 0, y: 0 };
let dragSprite = null;

// ---- Slot hit testing (titleUI pattern) ----
function slotPos(i) {
  return {
    x: SLOT_LEFT + (i % 3) * (SLOT_W + SLOT_GAP),
    y: i < 3 ? ACTIVE_SLOTS_Y : BENCH_SLOTS_Y,
  };
}

function hitSlot(px, py) {
  const allies = teamMgr?.allies || [];
  for (let i = 0; i < 6; i++) {
    if (i >= allies.length && !allies[i]) {
      // still check empty slots for drop target
    }
    const p = slotPos(i);
    if (px >= p.x && px < p.x + SLOT_W && py >= p.y && py < p.y + SLOT_H) return i;
  }
  return -1;
}

// ---- Detail helpers (titleUI 동일 포맷) ----

const ROLE_LABEL = { attacker: '공격', tank: '방어', support: '지원', speedster: '속도' };
const ROLE_COLOR = { attacker: D.red, tank: D.blue, support: D.neon, speedster: 0x88ddbb };

function drawTable(x, y, w, h, headers, dataRows, colColors) {
  const cols = headers.length;
  const colW = w / cols;
  const rowCount = dataRows.length + 1;
  const rowH = h / rowCount;

  detailBody.addChild(new PIXI.Graphics()
    .roundRect(x, y, w, h, 6).stroke({ color: D.sep, width: 1, alpha: 0.3 }));
  detailBody.addChild(new PIXI.Graphics()
    .roundRect(x, y, w, rowH, 6).fill({ color: D.sep, alpha: 0.15 }));
  detailBody.addChild(new PIXI.Graphics()
    .moveTo(x + 1, y + rowH).lineTo(x + w - 1, y + rowH)
    .stroke({ color: D.sep, width: 0.5, alpha: 0.3 }));

  for (let i = 1; i < cols; i++) {
    detailBody.addChild(new PIXI.Graphics()
      .moveTo(x + colW * i, y + 3).lineTo(x + colW * i, y + h - 3)
      .stroke({ color: D.sep, width: 0.5, alpha: 0.2 }));
  }

  headers.forEach((txt, i) => {
    const t = lbl(txt, 6, colColors?.[i] || D.dim, true);
    t.anchor = { x: 0.5, y: 0.5 };
    t.x = x + colW * i + colW / 2; t.y = y + rowH / 2;
    detailBody.addChild(t);
  });

  dataRows.forEach((row, ri) => {
    const ry = y + rowH * (ri + 1);
    if (ri > 0) {
      detailBody.addChild(new PIXI.Graphics()
        .moveTo(x + 1, ry).lineTo(x + w - 1, ry)
        .stroke({ color: D.sep, width: 0.5, alpha: 0.15 }));
    }
    row.forEach((cell, ci) => {
      const t = lbl(cell.text, cell.size || 7, cell.color || D.text, cell.bold ?? false);
      t.anchor = { x: 0.5, y: 0.5 };
      t.x = x + colW * ci + colW / 2; t.y = ry + rowH / 2;
      detailBody.addChild(t);
    });
  });
}

function drawSkillCards(x, y, w, h, actions) {
  const cols = actions.length;
  const cardGap = 6;
  const cardW = (w - cardGap * (cols - 1)) / cols;
  actions.forEach((action, i) => {
    const card = buildSkillCard(action, cardW, h);
    card.x = x + i * (cardW + cardGap);
    card.y = y;
    detailBody.addChild(card);
  });
}

function findMonsterFamily(mon) {
  for (const fam of ALL_MONSTERS) {
    if (fam.wild.id === mon.id) return { family: fam, stage: 'wild', self: fam.wild };
    const d1 = fam.devo1.find(d => d.id === mon.id);
    if (d1) return { family: fam, stage: 'devo1', self: d1 };
    const d2 = fam.devo2.find(d => d.id === mon.id);
    if (d2) return { family: fam, stage: 'devo2', self: d2 };
  }
  return null;
}

function drawLineage(x, y, pw, h, mon) {
  const info = findMonsterFamily(mon);
  if (!info) return;
  const { family, stage } = info;

  detailBody.addChild(new PIXI.Graphics()
    .moveTo(x, y).lineTo(x + pw, y).stroke({ color: D.sep, width: 0.5, alpha: 0.3 }));
  const secLabel = lbl('퇴화 족보', 5, D.dim, true);
  secLabel.x = x + 4; secLabel.y = y + 2;
  detailBody.addChild(secLabel);

  const rowY = y + 16;
  const sprSize = 32;
  const nodeW = 44;
  const arrowW = 16;

  let nodes = [];
  if (stage === 'wild') {
    nodes.push({ entry: family.wild, current: true, label: '야생' });
    family.devo1.slice(0, 3).forEach(d => nodes.push({ entry: d, current: false, label: '1차' }));
  } else if (stage === 'devo1') {
    nodes.push({ entry: family.wild, current: false, label: '야생' });
    nodes.push({ entry: info.self, current: true, label: '1차' });
    const children = family.devo2.filter(d => d.parentDevo1 === mon.id);
    children.slice(0, 2).forEach(d => nodes.push({ entry: d, current: false, label: '2차' }));
  } else {
    nodes.push({ entry: family.wild, current: false, label: '야생' });
    const parent = family.devo1.find(d => d.id === info.self.parentDevo1);
    if (parent) nodes.push({ entry: parent, current: false, label: '1차' });
    nodes.push({ entry: info.self, current: true, label: '2차' });
  }

  const totalW = nodes.length * nodeW + (nodes.length - 1) * arrowW;
  let nx = x + Math.max(0, (pw - totalW) / 2);

  nodes.forEach((node, i) => {
    const cx = nx + nodeW / 2;
    const cy = rowY + (h - 16) / 2;

    const bgAlpha = node.current ? 0.12 : 0.04;
    const bgColor = node.current ? D.neon : D.dim;
    detailBody.addChild(new PIXI.Graphics()
      .roundRect(nx, rowY, nodeW, h - 18, 8)
      .fill({ color: bgColor, alpha: bgAlpha })
      .stroke({ color: node.current ? D.neon : D.sep, width: node.current ? 1.5 : 0.5, alpha: node.current ? 0.6 : 0.3 }));

    const spr = monster(sprSize, node.entry.img);
    spr.x = cx; spr.y = cy - 2;
    detailBody.addChild(spr);

    const nameT = lbl(node.entry.name, 4.5, node.current ? D.neon : D.text, node.current);
    nameT.anchor = { x: 0.5, y: 0 }; nameT.x = cx; nameT.y = cy + sprSize / 2 + 1;
    detailBody.addChild(nameT);

    const stageT = lbl(node.label, 4, D.dimmer);
    stageT.anchor = { x: 0.5, y: 0 }; stageT.x = cx; stageT.y = rowY + 1;
    detailBody.addChild(stageT);

    nx += nodeW;
    if (i < nodes.length - 1) {
      const arrowMid = nx + arrowW / 2;
      const arrowY = cy;
      detailBody.addChild(new PIXI.Graphics()
        .moveTo(arrowMid - 5, arrowY).lineTo(arrowMid + 3, arrowY)
        .stroke({ color: D.dim, width: 1, alpha: 0.4 }));
      detailBody.addChild(new PIXI.Graphics()
        .moveTo(arrowMid + 1, arrowY - 3).lineTo(arrowMid + 4, arrowY).lineTo(arrowMid + 1, arrowY + 3)
        .stroke({ color: D.dim, width: 1, alpha: 0.4 }));
      nx += arrowW;
    }
  });
}

// ============================================================
// Build UI
// ============================================================
export function initTeamEdit() {
  ct = new PIXI.Container();
  ct.eventMode = 'static';
  ct.hitArea = new PIXI.Rectangle(0, 0, W, H);

  // Background
  const bg = new PIXI.Graphics();
  bg.rect(0, 0, W, H).fill({ color: D.bg });
  ct.addChild(bg);

  // Capture area (top)
  captureArea = new PIXI.Container(); captureArea.y = CAPTURE_Y;
  ct.addChild(captureArea);

  // Guide label
  guideLabel = lbl('', 8, D.dim);
  guideLabel.anchor = { x: 0.5, y: 0 }; guideLabel.x = W / 2;
  ct.addChild(guideLabel);

  // Active team header
  activeHdr = new PIXI.Container();
  activeHdr.addChild(Object.assign(lbl('주전 팀', 9, D.neon, true), { x: SLOT_LEFT }));
  activeHdr.addChild(new PIXI.Graphics()
    .moveTo(SLOT_LEFT + 72, 10).lineTo(W - SLOT_LEFT, 10).stroke({ color: D.neon, width: 0.5, alpha: 0.3 }));
  activeCountLabel = lbl('0/3', 6, D.dim); activeCountLabel.x = W - SLOT_LEFT - 28; activeCountLabel.y = 2;
  activeHdr.addChild(activeCountLabel);
  ct.addChild(activeHdr);

  // Bench header
  benchHdr = new PIXI.Container();
  benchHdr.addChild(Object.assign(lbl('대기석', 9, D.dim, true), { x: SLOT_LEFT }));
  benchHdr.addChild(new PIXI.Graphics()
    .moveTo(SLOT_LEFT + 56, 10).lineTo(W - SLOT_LEFT, 10).stroke({ color: D.sep, width: 0.5, alpha: 0.3 }));
  benchCountLabel = lbl('0/3', 6, D.dimmer); benchCountLabel.x = W - SLOT_LEFT - 28; benchCountLabel.y = 2;
  benchHdr.addChild(benchCountLabel);
  ct.addChild(benchHdr);

  // 6 slots (containers — repositioned each refresh)
  slotGfx = [];
  for (let i = 0; i < 6; i++) {
    const c = new PIXI.Container();
    ct.addChild(c); slotGfx.push(c);
  }

  // Detail panel
  detailPanel = new PIXI.Container();
  detailBody = new PIXI.Container(); detailBody.x = PAD;
  detailPanel.addChild(detailBody);
  ct.addChild(detailPanel);

  // Remove indicator (drag-to-remove zone — titleUI pattern)
  removeIndicator = new PIXI.Container(); removeIndicator.visible = false;
  const riY = 0; // will be positioned dynamically over detail area
  ct.addChild(removeIndicator);

  // Fixed action bar (bottom)
  actionBar = new PIXI.Container(); actionBar.y = ACTION_BAR_Y;
  const barBg = new PIXI.Graphics();
  barBg.rect(0, 0, W, ACTION_BAR_H).fill({ color: D.bg });
  barBg.moveTo(0, 0).lineTo(W, 0).stroke({ color: D.sep, width: 1, alpha: 0.5 });
  actionBar.addChild(barBg);

  const btnW = 120, btnH = 42;
  const btnY = (ACTION_BAR_H - btnH) / 2;
  releaseBtn = cuteBtn(PAD, btnY, btnW / S, btnH / S, '✕ 내보내기', D.red, D.bg);
  actionBar.addChild(releaseBtn);
  recruitBtn = cuteBtn(W / 2 - btnW / 2, btnY, btnW / S, btnH / S, '▶ 합류', D.neon, D.bg);
  actionBar.addChild(recruitBtn);
  nextBtn = cuteBtn(W - PAD - btnW, btnY, btnW / S, btnH / S, '다음 모험 ▷', D.dim, D.bg);
  actionBar.addChild(nextBtn);
  ct.addChild(actionBar);

  // Pointer events (titleUI drag pattern)
  ct.on('pointerdown', onPointerDown);
  ct.on('pointermove', onPointerMove);
  ct.on('pointerup', onPointerUp);
  ct.on('pointerupoutside', onPointerUp);

  return ct;
}

// ============================================================
export function renderTeamEdit(mgr, enemy, onRecruit, onSkip) {
  teamMgr = mgr;
  capturedEnemy = enemy;
  onRecruitCb = onRecruit;
  onSkipCb = onSkip;
  selectedIdx = -1;
  mode = 'idle';

  refreshAll();
}

function refreshAll() {
  recalcLayout();
  repositionLayout();
  refreshCapture();
  refreshGuide();
  refreshSlots();
  refreshDetail();
  refreshRemoveIndicator();
  refreshButtons();
}

function repositionLayout() {
  guideLabel.y = GUIDE_Y;
  activeHdr.y = ACTIVE_HDR_Y;
  benchHdr.y = BENCH_HDR_Y;
  for (let i = 0; i < 6; i++) {
    const p = slotPos(i);
    slotGfx[i].x = p.x; slotGfx[i].y = p.y;
  }
  detailPanel.y = DETAIL_Y;
}

// ============================================================
// Capture showcase (top — hero position)
// ============================================================
function refreshCapture() {
  captureArea.removeChildren();
  const pw = W - PAD * 2;

  if (!capturedEnemy) {
    captureArea.addChild(darkCard(pw, CAPTURE_H_EMPTY, 12, D.panel, D.sep, false));
    captureArea.children[0].x = PAD;
    const msg = lbl('포획한 몬스터 없음', 7, D.dimmer);
    msg.anchor = { x: 0.5, y: 0.5 }; msg.x = W / 2; msg.y = CAPTURE_H_EMPTY / 2;
    captureArea.addChild(msg);
    return;
  }

  const cardH = CAPTURE_H_FULL;
  const card = new PIXI.Graphics();
  card.roundRect(PAD, 0, pw, cardH, 16).fill({ color: D.panel });
  card.roundRect(PAD, 0, pw, cardH, 16).stroke({ color: D.neon, width: 2, alpha: 0.6 });
  card.roundRect(PAD - 2, -2, pw + 4, cardH + 4, 18).stroke({ color: D.neon, width: 3, alpha: 0.15 });
  captureArea.addChild(card);

  captureArea.addChild(new PIXI.Graphics()
    .moveTo(PAD, 0).lineTo(W - PAD, 0).stroke({ color: D.neon, width: 2, alpha: 0.6 }));

  const badge = neonBadge('NEW', D.neon);
  badge.x = PAD + 10; badge.y = 8;
  captureArea.addChild(badge);

  const sprCx = PAD + 66, sprCy = cardH / 2 + 4;
  captureArea.addChild(new PIXI.Graphics().circle(sprCx, sprCy, 36).fill({ color: D.neon, alpha: 0.08 }));
  captureArea.addChild(new PIXI.Graphics().circle(sprCx, sprCy, 36).stroke({ color: D.neon, width: 1, alpha: 0.2 }));
  const spr = monster(72, capturedEnemy.img);
  spr.x = sprCx; spr.y = sprCy;
  captureArea.addChild(spr);

  const infoX = PAD + 120;
  captureArea.addChild(Object.assign(lbl(capturedEnemy.name, 12, D.text, true), { x: infoX, y: 12 }));

  if (capturedEnemy.sensoryType) {
    const AXIS = { sound: '🔊 소리', temperature: '🌡️ 온도', smell: '🌿 냄새', behavior: '👁️ 행동' };
    const s = capturedEnemy.sensoryType.map(k => AXIS[k] || k).join(' / ');
    captureArea.addChild(Object.assign(lbl(s, 6, D.dim), { x: infoX, y: 40 }));
  }

  if (capturedEnemy.personality) {
    const P = { aggressive: '공격적', timid: '겁많은', curious: '호기심', stubborn: '완고' };
    const pBadge = neonBadge(P[capturedEnemy.personality] || capturedEnemy.personality, D.orange);
    pBadge.x = infoX; pBadge.y = 58;
    captureArea.addChild(pBadge);
  }

}

// ============================================================
// Guide text
// ============================================================
function refreshGuide() {
  const canAdd = teamMgr?.canRecruit();
  const hasCapture = !!capturedEnemy;

  if (hasCapture && canAdd) {
    guideLabel.text = '새로운 동료! 합류시키거나 다음 모험으로 진행하세요';
    guideLabel.style.fill = '#00d4aa';
  } else if (hasCapture && !canAdd) {
    guideLabel.text = '⚠ 팀이 가득 찼습니다 — 내보내기로 자리를 확보하세요';
    guideLabel.style.fill = '#ffaa60';
  } else {
    guideLabel.text = '팀을 확인하고 다음 모험을 진행하세요';
    guideLabel.style.fill = '#8888aa';
  }
}

// ============================================================
// 6 Slots (3+3 grid)
// ============================================================
function refreshSlots() {
  let ac = 0, bc = 0;
  const allies = teamMgr?.allies || [];

  for (let i = 0; i < 6; i++) {
    const c = slotGfx[i]; c.removeChildren();
    const p = slotPos(i);
    c.x = p.x; c.y = p.y;
    c.alpha = 1; c.scale.set(1);

    const ally = allies[i];
    const isActive = i < 3;
    const isSel = i === selectedIdx;
    if (ally) { if (isActive) ac++; else bc++; }

    if (!ally) {
      const hasCapture = !!capturedEnemy && teamMgr?.canRecruit();
      c.addChild(new PIXI.Graphics()
        .roundRect(0, 0, SLOT_W, SLOT_H, 14).fill({ color: D.bgAlt })
        .stroke({ color: hasCapture ? D.neon : D.sep, width: hasCapture ? 1.5 : 1, alpha: hasCapture ? 0.5 : 0.3 }));
      if (hasCapture) {
        const hint = lbl('+ 합류 가능', 6, D.neon);
        hint.anchor = { x: 0.5, y: 0.5 }; hint.x = SLOT_W / 2; hint.y = SLOT_H / 2;
        c.addChild(hint);
      } else {
        const plus = lbl('+', 14, D.dimmer);
        plus.anchor = { x: 0.5, y: 0.5 }; plus.x = SLOT_W / 2; plus.y = SLOT_H / 2 - 4;
        c.addChild(plus);
        c.addChild(Object.assign(lbl('빈 슬롯', 5, D.dimmer), { x: SLOT_W / 2 - 16, y: SLOT_H / 2 + 12 }));
      }
      continue;
    }

    // Card background
    const borderCol = isSel ? D.neon : (isActive ? D.neonDim : D.sep);
    c.addChild(darkCard(SLOT_W, SLOT_H, 14, isSel ? D.cardHi : (isActive ? D.card : D.bgAlt), borderCol, true));
    if (isSel) {
      c.addChild(new PIXI.Graphics()
        .roundRect(-2, -2, SLOT_W + 4, SLOT_H + 4, 16)
        .stroke({ color: D.neon, width: 2, alpha: 0.3 }));
    }

    // Sprite area
    c.addChild(new PIXI.Graphics().circle(SLOT_W / 2, 47, 22).fill({ color: D.neon, alpha: 0.06 }));

    if (ally.inEgg) {
      const et = lbl('🥚', 16, D.dimmer); et.anchor = { x: 0.5, y: 0.5 }; et.x = SLOT_W / 2; et.y = 47;
      c.addChild(et);
      const eggProgress = teamMgr?.getEggProgress?.(ally.id);
      if (eggProgress != null) {
        const ring = new PIXI.Graphics();
        const cx = SLOT_W / 2, cy = 47, radius = 24;
        ring.circle(cx, cy, radius).stroke({ color: D.sep, width: 2, alpha: 0.3 });
        if (eggProgress > 0) {
          const startAngle = -Math.PI / 2;
          const endAngle = startAngle + (Math.PI * 2) * (eggProgress / 100);
          ring.arc(cx, cy, radius, startAngle, endAngle).stroke({ color: 0xffaa60, width: 2.5 });
        }
        c.addChild(ring);
        const pctLabel = lbl(`${eggProgress}%`, 5, 0xffaa60, true);
        pctLabel.anchor = { x: 0.5, y: 0 }; pctLabel.x = SLOT_W / 2; pctLabel.y = 70;
        c.addChild(pctLabel);
      }
      const eggBadge = neonBadge('퇴화중', 0xffaa60);
      eggBadge.x = SLOT_W / 2 - 22; eggBadge.y = SLOT_H - 36;
      c.addChild(eggBadge);
    } else {
      const spr = monster(48, ally.img); spr.x = SLOT_W / 2; spr.y = 47;
      c.addChild(spr);
    }

    // Name
    const nm = lbl(ally.name, 6.5, D.text, true);
    nm.anchor = { x: 0.5, y: 0 }; nm.x = SLOT_W / 2; nm.y = SLOT_H - 24;
    c.addChild(nm);

    // Grip handle (⋮⋮) — drag affordance (titleUI pattern)
    const grip = new PIXI.Graphics();
    const gx = SLOT_W - 14, gy = SLOT_H / 2 - 10;
    for (let row = 0; row < 3; row++) {
      grip.circle(gx, gy + row * 7, 1.5).fill({ color: D.dim, alpha: 0.5 });
      grip.circle(gx + 6, gy + row * 7, 1.5).fill({ color: D.dim, alpha: 0.5 });
    }
    c.addChild(grip);

    // XP bar
    if (!ally.inEgg) {
      const xpR = (ally.xp || 0) / (ally.xpThreshold || 5);
      c.addChild(statBar(SLOT_W / 2 - 24, SLOT_H - 10, 48, 3, xpR, 0xeebb55));
    }
  }

  if (activeCountLabel) activeCountLabel.text = `${ac}/3`;
  if (benchCountLabel) benchCountLabel.text = `${bc}/3`;
}

// ============================================================
// Remove indicator (titleUI pattern — drag-to-remove zone over detail area)
// ============================================================
function refreshRemoveIndicator() {
  removeIndicator.removeChildren();
  const riY = DETAIL_Y;
  const riH = ACTION_BAR_Y - DETAIL_Y;

  // Dark overlay
  const riBg = new PIXI.Graphics();
  riBg.rect(0, riY, W, riH).fill({ color: D.bg, alpha: 0.85 });
  riBg.rect(0, riY, W, riH).fill({ color: D.red, alpha: 0.12 });
  riBg.moveTo(0, riY).lineTo(W, riY).stroke({ color: D.red, width: 2, alpha: 0.6 });
  removeIndicator.addChild(riBg);

  // Center box
  const riCy = riY + riH / 2;
  removeIndicator.addChild(new PIXI.Graphics()
    .roundRect(W / 2 - 120, riCy - 36, 240, 72, 16)
    .fill({ color: D.red, alpha: 0.12 }).stroke({ color: D.red, width: 1.5, alpha: 0.5 }));
  const riIcon = lbl('✕', 16, D.red, true);
  riIcon.anchor = { x: 0.5, y: 0.5 }; riIcon.x = W / 2; riIcon.y = riCy - 10;
  removeIndicator.addChild(riIcon);
  const riTxt = lbl('팀에서 제거', 9, D.red, true);
  riTxt.anchor = { x: 0.5, y: 0.5 }; riTxt.x = W / 2; riTxt.y = riCy + 16;
  removeIndicator.addChild(riTxt);
}

// ============================================================
// Detail panel — titleUI renderPageInfo 동일 포맷
// ============================================================
function refreshDetail() {
  // Rebuild detail panel card
  while (detailPanel.children.length > 1) detailPanel.removeChildAt(0);
  detailBody.removeChildren();
  const pw = W - PAD * 2;

  if (selectedIdx < 0 || !teamMgr?.allies[selectedIdx]) {
    detailPanel.addChildAt(darkCard(pw, DETAIL_H, 16, D.panel, D.sep, true), 0);
    detailPanel.children[0].x = PAD;
    // Neon accent line
    const accent = new PIXI.Graphics()
      .moveTo(PAD, 0).lineTo(W - PAD, 0).stroke({ color: D.neon, width: 1.5, alpha: 0.3 });
    detailPanel.addChildAt(accent, 1);
    const h = lbl('슬롯을 탭해서 상세 정보를 확인하세요', 10, D.dimmer);
    h.anchor = { x: 0.5, y: 0.5 }; h.x = pw / 2; h.y = DETAIL_H / 2;
    detailBody.addChild(h);
    return;
  }

  // Panel with neon border
  detailPanel.addChildAt(darkCard(pw, DETAIL_H, 16, D.panel, D.neon, true), 0);
  detailPanel.children[0].x = PAD;
  const accent = new PIXI.Graphics()
    .moveTo(PAD, 0).lineTo(W - PAD, 0).stroke({ color: D.neon, width: 1.5, alpha: 0.3 });
  detailPanel.addChildAt(accent, 1);

  const ally = teamMgr.allies[selectedIdx];

  // ══ Egg state — simplified view ══
  if (ally.inEgg) {
    const eggProgress = teamMgr?.getEggProgress?.(ally.id);
    detailBody.addChild(Object.assign(lbl(ally.name, 10, D.text, true), { x: 2, y: 2 }));
    detailBody.addChild(Object.assign(lbl('퇴화 중... (알 상태)', 9, 0xffaa60, true), { x: 2, y: 30 }));
    if (eggProgress != null) {
      detailBody.addChild(Object.assign(lbl(`${eggProgress}%`, 12, 0xffaa60, true), { x: pw / 2 - 20, y: 60 }));
      detailBody.addChild(statBar(2, 90, pw - 4, 8, eggProgress / 100, 0xffaa60));
    }
    // Lineage still visible
    drawLineage(0, 110, pw, 68, ally);
    return;
  }

  // ══ Normal ally — titleUI renderPageInfo 포맷 ══
  const gap = 4;
  const LINEAGE_H = 90;

  // --- 1) Name bar ---
  const levelText = ally.level ? ` Lv.${ally.level}` : '';
  detailBody.addChild(Object.assign(lbl(ally.name + levelText, 10, D.text, true), { x: 2, y: 2 }));

  const descText = ally.desc || '';
  if (descText) {
    detailBody.addChild(Object.assign(lbl(descText, 5.5, D.dim), { x: 2, y: 22 }));
  }

  // 어빌리티 표시
  if (ally.ability) {
    const ab = getAbility(ally.ability);
    if (ab) {
      const abY = descText ? 34 : 22;
      const abBadge = new PIXI.Graphics();
      abBadge.roundRect(0, abY - 2, pw, 14, 7).fill({ color: D.neon, alpha: 0.1 });
      abBadge.roundRect(0, abY - 2, pw, 14, 7).stroke({ color: D.neon, width: 0.5, alpha: 0.3 });
      detailBody.addChild(abBadge);
      detailBody.addChild(Object.assign(lbl(`✦ ${ab.name}`, 5, D.neon, true), { x: 6, y: abY }));
      detailBody.addChild(Object.assign(lbl(ab.desc, 4.5, D.dim), { x: 6 + (ab.name.length + 2) * 5 * S + 4, y: abY + 1 }));
    }
  }

  // --- 2) XP bar ---
  const xpY = 50;
  const xpR = (ally.xp || 0) / (ally.xpThreshold || 5);
  detailBody.addChild(Object.assign(lbl('XP', 5, 0xeebb55, true), { x: 2, y: xpY }));
  detailBody.addChild(statBar(26, xpY + 2, 100, 4, xpR, 0xeebb55));
  const xpText = `${ally.xp || 0}/${ally.xpThreshold || 5}`;
  detailBody.addChild(Object.assign(lbl(xpText, 4.5, D.dim), { x: 130, y: xpY }));

  // --- 3) Lineage ---
  const lineY = xpY + 16 + gap;
  drawLineage(0, lineY, pw, LINEAGE_H, ally);

  // --- 4) Skill cards ---
  if (ally.actions) {
    const skillY = lineY + LINEAGE_H + gap;
    const skillH = DETAIL_H - skillY;
    drawSkillCards(0, skillY, pw, skillH, ally.actions);
  }
}

// ============================================================
// Buttons
// ============================================================
function refreshButtons() {
  const canAdd = teamMgr?.canRecruit();
  const hasCapture = !!capturedEnemy;
  const hasSel = selectedIdx >= 0 && !!teamMgr?.allies[selectedIdx];
  const allyCount = teamMgr?.allies.length || 0;

  recruitBtn.visible = hasCapture && canAdd;
  recruitBtn.removeAllListeners();
  recruitBtn.on('pointerdown', () => { if (onRecruitCb) onRecruitCb(); });

  releaseBtn.visible = hasSel && allyCount > 3;
  releaseBtn.removeAllListeners();
  releaseBtn.on('pointerdown', () => {
    if (!teamMgr || selectedIdx < 0) return;
    teamMgr.removeFromRoster(selectedIdx);
    selectedIdx = -1;
    refreshAll();
  });

  nextBtn.removeAllListeners();
  nextBtn.on('pointerdown', () => { if (onSkipCb) onSkipCb(); });
}

// ============================================================
// Pointer interaction (titleUI drag & drop pattern)
// ============================================================
function onPointerDown(e) {
  const pos = e.getLocalPosition(ct);
  startPos = { x: pos.x, y: pos.y };

  const si = hitSlot(pos.x, pos.y);
  const allies = teamMgr?.allies || [];
  if (si >= 0 && allies[si]) {
    mode = 'slot-pending';
    pendingSlotIdx = si;
    return;
  }
  mode = 'idle';
}

function onPointerMove(e) {
  const pos = e.getLocalPosition(ct);
  const dx = pos.x - startPos.x, dy = pos.y - startPos.y;

  if (mode === 'slot-pending' && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
    mode = 'dragging';
    const ally = teamMgr.allies[pendingSlotIdx];
    dragSprite = monster(55, ally.img);
    dragSprite.alpha = 0.75;
    ct.addChild(dragSprite);
    slotGfx[pendingSlotIdx].alpha = 0.3;
    // Show remove indicator only if team > 3
    if (teamMgr.allies.length > 3) {
      removeIndicator.visible = true;
    }
  }

  if (mode === 'dragging' && dragSprite) {
    dragSprite.x = pos.x; dragSprite.y = pos.y;
    // Highlight remove zone when hovering over detail area
    if (removeIndicator.visible) {
      removeIndicator.alpha = pos.y > DETAIL_Y ? 1.0 : 0.25;
    }
  }
}

function onPointerUp(e) {
  const pos = e.getLocalPosition(ct);

  if (mode === 'slot-pending') {
    // Tap — select for detail view
    if (selectedIdx === pendingSlotIdx) {
      selectedIdx = -1; // deselect on re-tap
    } else {
      selectedIdx = pendingSlotIdx;
    }
    refreshAll();
  }

  if (mode === 'dragging') {
    if (dragSprite) { ct.removeChild(dragSprite); dragSprite = null; }
    slotGfx[pendingSlotIdx].alpha = 1;
    removeIndicator.visible = false;

    // Drop on detail area (remove zone) — remove from roster
    if (pos.y > DETAIL_Y && teamMgr.allies.length > 3) {
      teamMgr.removeFromRoster(pendingSlotIdx);
      selectedIdx = -1;
    } else {
      // Drop on another slot — swap
      const target = hitSlot(pos.x, pos.y);
      if (target >= 0 && target !== pendingSlotIdx) {
        teamMgr.swapSlots(pendingSlotIdx, target);
        selectedIdx = target;
        // Pulse animation on swapped slot
        pulseSlot(target);
      }
    }
    refreshAll();
  }

  mode = 'idle';
  pendingSlotIdx = -1;
}

function pulseSlot(idx) {
  const c = slotGfx[idx];
  if (!c) return;
  const p = slotPos(idx);
  const dur = 300;
  const start = performance.now();
  const originY = p.y;
  function tick() {
    const t = Math.min(1, (performance.now() - start) / dur);
    const ease = t < 0.5
      ? 1 - Math.pow(1 - t * 2, 3)
      : 1 - Math.abs(Math.sin((t - 0.5) * Math.PI * 2)) * (1 - t);
    c.y = originY - (1 - t) * 8 * (1 - ease);
    c.scale.set(1 + (1 - t) * 0.04);
    if (t < 1) requestAnimationFrame(tick);
    else { c.y = originY; c.scale.set(1); }
  }
  requestAnimationFrame(tick);
}
