// ============================================================
// Team Edit Screen — 전투 후 팀 편성 + 순화 몬스터 합류 결정
// Layout: titleUI 스타일 (Dark/Neon)
//   상단: 선택된 슬롯 상세 (스탯/스킬/족보)
//   중단: 6슬롯 (주전3 + 대기3) — 탭으로 상세보기, 드래그로 교체
//   하단: 포획 몬스터 카드 + 합류/내보내기/다음모험 버튼
// ============================================================

import { W, H, S, lbl, cuteBtn } from './theme.js';
import { monster } from './sprites.js';
import { buildSkillCard } from './skillCard.js';

const D = {
  bg: 0x1a1a2e, bgAlt: 0x222238, card: 0x262640, cardHi: 0x2e2e48,
  neon: 0x00d4aa, neonDim: 0x009977,
  red: 0xff6b6b, blue: 0x4dabf7, yellow: 0xffe060,
  text: 0xddddf0, dim: 0x8888aa, dimmer: 0x555577, sep: 0x444466,
  panel: 0x1e1e34, white: 0xffffff, black: 0x000000,
};

const PAD = 14;
// Detail panel (top) — shows selected monster info
const DETAIL_Y = 8, DETAIL_H = 200;
// Slots area
const SLOT_W = 128, SLOT_H = 105, SLOT_GAP = 16;
const SLOT_LEFT = Math.round((W - (SLOT_W * 3 + SLOT_GAP * 2)) / 2);
const SLOTS_Y = DETAIL_Y + DETAIL_H + 8;
const ACTIVE_SLOTS_Y = SLOTS_Y + 22;
const BENCH_LABEL_Y = ACTIVE_SLOTS_Y + SLOT_H + 6;
const BENCH_SLOTS_Y = BENCH_LABEL_Y + 22;
// Capture + buttons area (bottom)
const BOTTOM_Y = BENCH_SLOTS_Y + SLOT_H + 10;

// ---- State ----
let ct, detailBody, slotGfx = [], captureArea, guideLabel;
let recruitBtn, releaseBtn, nextBtn;
let activeCountLabel, benchCountLabel;
let teamMgr = null, capturedEnemy = null;
let selectedIdx = -1; // which slot is selected for detail view
let onRecruitCb = null, onSkipCb = null;

// ---- Helpers ----
function darkCard(w, h, r, fill, border, shadow) {
  const g = new PIXI.Graphics();
  if (shadow) g.roundRect(2, 3, w, h, r).fill({ color: D.black, alpha: 0.2 });
  g.roundRect(0, 0, w, h, r).fill({ color: fill });
  g.roundRect(0, 0, w, h, r).stroke({ color: border, width: 1.5 });
  g.roundRect(3, 2, w - 6, h * 0.18, r - 1).fill({ color: D.white, alpha: 0.04 });
  return g;
}
function statBar(x, y, w, h, ratio, color) {
  const c = new PIXI.Container(); c.x = x; c.y = y;
  const r = h / 2;
  c.addChild(new PIXI.Graphics().roundRect(0, 0, w, h, r).fill({ color: D.sep, alpha: 0.6 }));
  if (ratio > 0) {
    c.addChild(new PIXI.Graphics()
      .roundRect(0.5, 0.5, Math.max(h, (w - 1) * Math.min(1, ratio)), h - 1, r).fill({ color }));
  }
  return c;
}
function neonBadge(text, color) {
  const c = new PIXI.Container();
  const tw = text.length * 5 * S + 14;
  c.addChild(new PIXI.Graphics().roundRect(0, 0, tw, 14, 7)
    .fill({ color, alpha: 0.2 }).stroke({ color, width: 1, alpha: 0.5 }));
  const t = lbl(text, 5, color, true);
  t.anchor = { x: 0.5, y: 0.5 }; t.x = tw / 2; t.y = 7;
  c.addChild(t);
  return c;
}

// ============================================================
export function initTeamEdit() {
  ct = new PIXI.Container();
  ct.eventMode = 'static';
  ct.hitArea = new PIXI.Rectangle(0, 0, W, H);

  // Background
  const bg = new PIXI.Graphics();
  bg.rect(0, 0, W, H).fill({ color: D.bg });
  bg.roundRect(0, 0, W, 8, 0).fill({ color: D.neon, alpha: 0.3 });
  ct.addChild(bg);

  // Detail panel
  const detailPanel = new PIXI.Container(); detailPanel.y = DETAIL_Y;
  detailPanel.addChild(darkCard(W - PAD * 2, DETAIL_H, 16, D.panel, D.sep, true));
  detailPanel.children[0].x = PAD;
  detailPanel.addChild(new PIXI.Graphics()
    .moveTo(PAD, 0).lineTo(W - PAD, 0).stroke({ color: D.neon, width: 1.5, alpha: 0.3 }));
  detailBody = new PIXI.Container(); detailBody.x = PAD;
  detailPanel.addChild(detailBody);
  ct.addChild(detailPanel);

  // Active team header
  const activeHdr = new PIXI.Container(); activeHdr.y = SLOTS_Y;
  activeHdr.addChild(Object.assign(lbl('주전 팀', 9, D.neon, true), { x: SLOT_LEFT }));
  activeHdr.addChild(new PIXI.Graphics()
    .moveTo(SLOT_LEFT + 72, 10).lineTo(W - SLOT_LEFT, 10).stroke({ color: D.neon, width: 0.5, alpha: 0.3 }));
  activeCountLabel = lbl('0/3', 6, D.dim); activeCountLabel.x = W - SLOT_LEFT - 28; activeCountLabel.y = 2;
  activeHdr.addChild(activeCountLabel);
  ct.addChild(activeHdr);

  // Bench header
  const benchHdr = new PIXI.Container(); benchHdr.y = BENCH_LABEL_Y;
  benchHdr.addChild(Object.assign(lbl('대기석', 9, D.dim, true), { x: SLOT_LEFT }));
  benchHdr.addChild(new PIXI.Graphics()
    .moveTo(SLOT_LEFT + 56, 10).lineTo(W - SLOT_LEFT, 10).stroke({ color: D.sep, width: 0.5, alpha: 0.3 }));
  benchCountLabel = lbl('0/3', 6, D.dimmer); benchCountLabel.x = W - SLOT_LEFT - 28; benchCountLabel.y = 2;
  benchHdr.addChild(benchCountLabel);
  ct.addChild(benchHdr);

  // 6 slots
  slotGfx = [];
  for (let i = 0; i < 6; i++) {
    const c = new PIXI.Container();
    c.x = SLOT_LEFT + (i % 3) * (SLOT_W + SLOT_GAP);
    c.y = i < 3 ? ACTIVE_SLOTS_Y : BENCH_SLOTS_Y;
    c.eventMode = 'static'; c.cursor = 'pointer';
    c.on('pointerdown', () => onSlotTap(i));
    ct.addChild(c); slotGfx.push(c);
  }

  // Bottom area: capture showcase + buttons
  captureArea = new PIXI.Container(); captureArea.y = BOTTOM_Y;
  ct.addChild(captureArea);

  // Guide label
  guideLabel = lbl('', 6, D.dim);
  guideLabel.anchor = { x: 0.5, y: 0 }; guideLabel.x = W / 2; guideLabel.y = BOTTOM_Y + 70;
  ct.addChild(guideLabel);

  // Buttons row
  const btnY = BOTTOM_Y + 86;
  recruitBtn = cuteBtn(SLOT_LEFT, btnY, 90, 36, '▶ 합류', D.neon, D.bg);
  ct.addChild(recruitBtn);

  releaseBtn = cuteBtn(SLOT_LEFT + 200, btnY, 90, 36, '✕ 내보내기', D.red, D.bg);
  ct.addChild(releaseBtn);

  nextBtn = cuteBtn(W / 2 - 90, btnY + 50, 90, 40, '▷ 다음 모험', D.dim, D.bg);
  ct.addChild(nextBtn);

  return ct;
}

// ============================================================
export function renderTeamEdit(mgr, enemy, onRecruit, onSkip) {
  teamMgr = mgr;
  capturedEnemy = enemy;
  onRecruitCb = onRecruit;
  onSkipCb = onSkip;
  selectedIdx = -1;

  refreshAll();
}

function refreshAll() {
  refreshDetail();
  refreshSlots();
  refreshCapture();
  refreshButtons();
}

// ============================================================
// Detail panel — shows selected slot's monster info
// ============================================================
function refreshDetail() {
  detailBody.removeChildren();
  const pw = W - PAD * 2;

  if (selectedIdx < 0 || !teamMgr?.allies[selectedIdx]) {
    const h = lbl('슬롯을 탭해서 상세 정보를 확인하세요', 8, D.dimmer);
    h.anchor = { x: 0.5, y: 0.5 }; h.x = pw / 2; h.y = DETAIL_H / 2;
    detailBody.addChild(h);
    return;
  }

  const ally = teamMgr.allies[selectedIdx];
  const ROLE_LABEL = { attacker: '공격', tank: '방어', support: '지원', speedster: '속도' };
  const ROLE_COLOR = { attacker: D.red, tank: D.blue, support: D.neon, speedster: 0x88ddbb };

  // Name + role
  detailBody.addChild(Object.assign(lbl(ally.name, 10, D.text, true), { x: 2, y: 2 }));
  if (ally.role) {
    const badge = neonBadge(ROLE_LABEL[ally.role] || ally.role, ROLE_COLOR[ally.role] || D.dim);
    const bw = (ROLE_LABEL[ally.role] || ally.role).length * 5 * S + 14;
    badge.x = pw - bw - 4; badge.y = 4;
    detailBody.addChild(badge);
  }

  // HP + status
  const hpR = (ally.hp ?? ally.maxHp) / ally.maxHp;
  detailBody.addChild(Object.assign(lbl(`HP ${ally.hp ?? ally.maxHp}/${ally.maxHp}`, 6, hpR > 0.3 ? D.neon : D.red), { x: 2, y: 22 }));
  detailBody.addChild(statBar(80, 24, 100, 5, hpR, hpR > 0.3 ? D.neon : D.red));

  // Stats table
  if (ally.stats) {
    const STAT = { gentleness: '온화', empathy: '공감', resilience: '인내', agility: '민첩' };
    const SCOL = { gentleness: D.neon, empathy: D.blue, resilience: 0xffaa60, agility: 0x88ddbb };
    const keys = Object.keys(ally.stats);
    let sx = 2;
    keys.forEach(k => {
      detailBody.addChild(Object.assign(lbl(STAT[k], 5, SCOL[k], true), { x: sx, y: 38 }));
      detailBody.addChild(Object.assign(lbl(String(ally.stats[k]), 7, D.text, true), { x: sx + 4, y: 50 }));
      sx += (pw / keys.length);
    });
  }

  // XP
  const xpR = (ally.xp || 0) / (ally.xpThreshold || 5);
  detailBody.addChild(Object.assign(lbl('XP', 5, D.yellow), { x: 2, y: 68 }));
  detailBody.addChild(statBar(30, 70, 100, 4, xpR, D.yellow));

  // Skills
  if (ally.actions) {
    const skillY = 85;
    const gap = 6;
    const cardW = (pw - gap * (ally.actions.length - 1)) / ally.actions.length;
    const cardH = DETAIL_H - skillY - 4;
    ally.actions.forEach((action, i) => {
      const card = buildSkillCard(action, cardW, cardH);
      card.x = i * (cardW + gap); card.y = skillY;
      detailBody.addChild(card);
    });
  }

  // Egg state
  if (ally.inEgg) {
    detailBody.addChild(Object.assign(lbl('퇴화 중... (알 상태)', 8, 0xffaa60, true), { x: 2, y: 85 }));
  }
}

// ============================================================
// 6 Slots (3x2 grid)
// ============================================================
function refreshSlots() {
  let ac = 0, bc = 0;
  const allies = teamMgr?.allies || [];

  for (let i = 0; i < 6; i++) {
    const c = slotGfx[i]; c.removeChildren();
    const ally = allies[i];
    const isActive = i < 3;
    const isSel = i === selectedIdx;
    if (ally) { if (isActive) ac++; else bc++; }

    if (!ally) {
      c.addChild(new PIXI.Graphics()
        .roundRect(0, 0, SLOT_W, SLOT_H, 14).fill({ color: D.bgAlt })
        .stroke({ color: D.sep, width: 1, alpha: 0.3 }));
      const plus = lbl('+', 14, D.dimmer);
      plus.anchor = { x: 0.5, y: 0.5 }; plus.x = SLOT_W / 2; plus.y = SLOT_H / 2 - 4;
      c.addChild(plus);
      c.addChild(Object.assign(lbl('빈 슬롯', 5, D.dimmer), { x: SLOT_W / 2 - 16, y: SLOT_H / 2 + 12 }));
      continue;
    }

    const borderCol = isSel ? D.neon : (isActive ? D.neonDim : D.sep);
    c.addChild(darkCard(SLOT_W, SLOT_H, 14, isSel ? D.cardHi : (isActive ? D.card : D.bgAlt), borderCol, true));
    if (isSel) {
      c.addChild(new PIXI.Graphics()
        .roundRect(-2, -2, SLOT_W + 4, SLOT_H + 4, 16).stroke({ color: D.neon, width: 2, alpha: 0.4 }));
    }

    // HP bar
    if (!ally.inEgg) {
      const hpR = (ally.hp ?? ally.maxHp) / ally.maxHp;
      c.addChild(statBar(SLOT_W / 2 - 30, 6, 60, 5, hpR, hpR > 0.3 ? D.neon : D.red));
    }

    // Sprite
    c.addChild(new PIXI.Graphics().circle(SLOT_W / 2, 47, 22).fill({ color: D.neon, alpha: 0.06 }));
    if (ally.inEgg) {
      const et = lbl('🥚', 16, D.dimmer); et.anchor = { x: 0.5, y: 0.5 }; et.x = SLOT_W / 2; et.y = 47;
      c.addChild(et);
    } else {
      const spr = monster(48, ally.img); spr.x = SLOT_W / 2; spr.y = 47;
      if (ally.hp <= 0) spr.alpha = 0.3;
      c.addChild(spr);
      if (ally.hp <= 0) {
        const z = lbl('zzz', 8, D.dimmer, true); z.anchor = { x: 0.5, y: 0.5 }; z.x = SLOT_W / 2; z.y = 47;
        c.addChild(z);
      }
    }

    // Name
    const nm = lbl(ally.name, 6.5, D.text, true);
    nm.anchor = { x: 0.5, y: 0 }; nm.x = SLOT_W / 2; nm.y = SLOT_H - 24;
    c.addChild(nm);

    // XP bar
    const xpR = (ally.xp || 0) / (ally.xpThreshold || 5);
    c.addChild(statBar(SLOT_W / 2 - 24, SLOT_H - 10, 48, 3, xpR, D.yellow));
  }

  if (activeCountLabel) activeCountLabel.text = `${ac}/3`;
  if (benchCountLabel) benchCountLabel.text = `${bc}/3`;
}

// ============================================================
// Capture showcase (bottom compact bar)
// ============================================================
function refreshCapture() {
  captureArea.removeChildren();
  const pw = W - PAD * 2;

  if (!capturedEnemy) {
    captureArea.addChild(darkCard(pw, 58, 12, D.panel, D.sep, false));
    captureArea.children[0].x = PAD;
    const msg = lbl('포획한 몬스터 없음', 7, D.dimmer);
    msg.anchor = { x: 0.5, y: 0.5 }; msg.x = W / 2; msg.y = 29;
    captureArea.addChild(msg);
    return;
  }

  // Compact capture card
  captureArea.addChild(darkCard(pw, 58, 12, D.panel, D.neon, false));
  captureArea.children[0].x = PAD;

  // Neon accent
  captureArea.addChild(new PIXI.Graphics()
    .moveTo(PAD, 0).lineTo(W - PAD, 0).stroke({ color: D.neon, width: 1, alpha: 0.4 }));

  // Badge
  const badge = neonBadge('NEW', D.neon);
  badge.x = PAD + 6; badge.y = 6;
  captureArea.addChild(badge);

  // Sprite
  const spr = monster(44, capturedEnemy.img);
  spr.x = PAD + 56; spr.y = 30;
  captureArea.addChild(spr);

  // Name + sensory
  captureArea.addChild(Object.assign(lbl(capturedEnemy.name, 8, D.text, true), { x: PAD + 86, y: 10 }));
  if (capturedEnemy.sensoryType) {
    const AXIS = { sound: '소리', temperature: '온도', smell: '냄새', behavior: '행동' };
    const s = capturedEnemy.sensoryType.map(k => AXIS[k] || k).join('/');
    captureArea.addChild(Object.assign(lbl(s, 5, D.dim), { x: PAD + 86, y: 30 }));
  }
  if (capturedEnemy.personality) {
    const P = { aggressive: '공격적', timid: '겁많은', curious: '호기심', stubborn: '완고' };
    captureArea.addChild(Object.assign(lbl(P[capturedEnemy.personality] || '', 5, D.dim), { x: PAD + 86, y: 42 }));
  }
}

// ============================================================
// Buttons + guide
// ============================================================
function refreshButtons() {
  const canAdd = teamMgr?.canRecruit();
  const hasCapture = !!capturedEnemy;
  const hasSel = selectedIdx >= 0 && !!teamMgr?.allies[selectedIdx];
  const allyCount = teamMgr?.allies.length || 0;

  // Guide text
  if (hasCapture && canAdd) {
    guideLabel.text = '포획 몬스터를 합류시키거나 다음 모험으로';
  } else if (hasCapture && !canAdd) {
    guideLabel.text = '팀 가득 (6/6) — 슬롯 선택 후 내보내기로 자리 확보';
  } else {
    guideLabel.text = '다음 모험을 진행하세요';
  }

  // Recruit
  recruitBtn.visible = hasCapture && canAdd;
  recruitBtn.removeAllListeners();
  recruitBtn.on('pointerdown', () => {
    if (onRecruitCb) onRecruitCb();
  });

  // Release (only when a slot is selected and team > 3)
  releaseBtn.visible = hasSel && allyCount > 3;
  releaseBtn.removeAllListeners();
  releaseBtn.on('pointerdown', () => {
    if (!teamMgr || selectedIdx < 0) return;
    teamMgr.removeFromRoster(selectedIdx);
    selectedIdx = -1;
    refreshAll();
    // After release, maybe can recruit now
  });

  // Next battle
  nextBtn.removeAllListeners();
  nextBtn.on('pointerdown', () => {
    if (onSkipCb) onSkipCb();
  });
}

// ============================================================
// Slot tap → select for detail view
// ============================================================
function onSlotTap(idx) {
  if (selectedIdx === idx) {
    selectedIdx = -1; // deselect
  } else {
    selectedIdx = idx;
  }
  refreshAll();
}
