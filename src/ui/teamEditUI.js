// ============================================================
// Team Edit Screen — 전투 후 팀 편성 (Dark/Neon, titleUI style)
// ============================================================

import { W, H, lbl, cuteBtn } from './theme.js';
import { monster } from './sprites.js';

// ---- Dark palette (same as titleUI) ----
const D = {
  bg: 0x1a1a2e, bgAlt: 0x222238, card: 0x262640, cardHi: 0x2e2e48,
  neon: 0x00d4aa, neonDim: 0x009977,
  red: 0xff6b6b, blue: 0x4dabf7,
  text: 0xddddf0, dim: 0x8888aa, dimmer: 0x555577, sep: 0x444466,
  panel: 0x1e1e34, white: 0xffffff, black: 0x000000,
};

const PAD = 14;
const CAPTURE_Y = 8, CAPTURE_H = 140;
const SLOT_W = 128, SLOT_H = 105, SLOT_GAP = 16;
const SLOT_LEFT = Math.round((W - (SLOT_W * 3 + SLOT_GAP * 2)) / 2);
const ACTIVE_LABEL_Y = CAPTURE_Y + CAPTURE_H + 8;
const ACTIVE_SLOTS_Y = ACTIVE_LABEL_Y + 22;
const BENCH_LABEL_Y = ACTIVE_SLOTS_Y + SLOT_H + 6;
const BENCH_SLOTS_Y = BENCH_LABEL_Y + 22;
const BTN_Y = BENCH_SLOTS_Y + SLOT_H + 16;

let ct, captureArea, slotGfx = [], guideLabel, recruitBtn, skipBtn;
let activeCountLabel, benchCountLabel;
let allies = [], capturedEnemy = null;

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
      .roundRect(0.5, 0.5, Math.max(h, (w - 1) * Math.min(1, ratio)), h - 1, r)
      .fill({ color }));
  }
  return c;
}

// ============================================================
// Init
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

  // Captured monster panel
  captureArea = new PIXI.Container();
  captureArea.y = CAPTURE_Y;
  ct.addChild(captureArea);

  // Active team header
  const activeHdr = new PIXI.Container(); activeHdr.y = ACTIVE_LABEL_Y;
  activeHdr.addChild(Object.assign(lbl('주전 팀', 9, D.neon, true), { x: SLOT_LEFT }));
  activeHdr.addChild(new PIXI.Graphics()
    .moveTo(SLOT_LEFT + 72, 10).lineTo(W - SLOT_LEFT, 10).stroke({ color: D.neon, width: 0.5, alpha: 0.3 }));
  activeCountLabel = lbl('0/3', 6, D.dim);
  activeCountLabel.x = W - SLOT_LEFT - 28; activeCountLabel.y = 2;
  activeHdr.addChild(activeCountLabel);
  ct.addChild(activeHdr);

  // Bench header
  const benchHdr = new PIXI.Container(); benchHdr.y = BENCH_LABEL_Y;
  benchHdr.addChild(Object.assign(lbl('대기석', 9, D.dim, true), { x: SLOT_LEFT }));
  benchHdr.addChild(new PIXI.Graphics()
    .moveTo(SLOT_LEFT + 56, 10).lineTo(W - SLOT_LEFT, 10).stroke({ color: D.sep, width: 0.5, alpha: 0.3 }));
  benchCountLabel = lbl('0/3', 6, D.dimmer);
  benchCountLabel.x = W - SLOT_LEFT - 28; benchCountLabel.y = 2;
  benchHdr.addChild(benchCountLabel);
  ct.addChild(benchHdr);

  // 6 slots
  slotGfx = [];
  for (let i = 0; i < 6; i++) {
    const c = new PIXI.Container();
    c.x = SLOT_LEFT + (i % 3) * (SLOT_W + SLOT_GAP);
    c.y = i < 3 ? ACTIVE_SLOTS_Y : BENCH_SLOTS_Y;
    ct.addChild(c);
    slotGfx.push(c);
  }

  // Guide text
  guideLabel = lbl('', 7, D.dim);
  guideLabel.anchor = { x: 0.5, y: 0 };
  guideLabel.x = W / 2; guideLabel.y = BTN_Y - 18;
  ct.addChild(guideLabel);

  // Buttons
  recruitBtn = cuteBtn(SLOT_LEFT, BTN_Y, 100, 40, '▶ 팀 합류', D.neon, D.bg);
  ct.addChild(recruitBtn);

  skipBtn = cuteBtn(W / 2 + 10, BTN_Y, 100, 40, '▷ 다음 모험', D.dim, D.bg);
  ct.addChild(skipBtn);

  return ct;
}

// ============================================================
// Render
// ============================================================

export function renderTeamEdit(teamManager, enemy, onRecruitCb, onSkipCb) {
  allies = teamManager.allies;
  capturedEnemy = enemy;

  refreshCaptureArea();
  refreshSlots();

  const canAdd = teamManager.canRecruit();

  if (canAdd && enemy) {
    guideLabel.text = '포획한 몬스터를 팀에 합류시키거나 다음 모험을 진행하세요';
  } else if (!canAdd && enemy) {
    guideLabel.text = '팀이 가득 찼습니다 (6/6)';
  } else {
    guideLabel.text = '팀을 확인하고 다음 모험을 진행하세요';
  }

  recruitBtn.visible = canAdd && !!enemy;
  recruitBtn.removeAllListeners();
  if (onRecruitCb) recruitBtn.on('pointerdown', onRecruitCb);

  skipBtn.removeAllListeners();
  if (onSkipCb) skipBtn.on('pointerdown', onSkipCb);
}

// ============================================================
// Captured Monster Panel
// ============================================================

function refreshCaptureArea() {
  captureArea.removeChildren();
  const pw = W - PAD * 2;

  // Panel background
  captureArea.addChild(darkCard(pw, CAPTURE_H, 16, D.panel, D.sep, true));
  captureArea.children[0].x = PAD;

  // Neon accent top
  captureArea.addChild(new PIXI.Graphics()
    .moveTo(PAD, 0).lineTo(W - PAD, 0).stroke({ color: D.neon, width: 1.5, alpha: 0.3 }));

  if (!capturedEnemy) {
    const msg = lbl('도주한 몬스터 — 포획 실패', 9, D.dimmer);
    msg.anchor = { x: 0.5, y: 0.5 }; msg.x = W / 2; msg.y = CAPTURE_H / 2;
    captureArea.addChild(msg);
    return;
  }

  // Badge
  const badge = new PIXI.Graphics();
  badge.roundRect(PAD + 10, 8, 90, 18, 9)
    .fill({ color: D.neon, alpha: 0.2 }).stroke({ color: D.neon, width: 1, alpha: 0.5 });
  captureArea.addChild(badge);
  const bt = lbl('포획 성공!', 6, D.neon, true);
  bt.x = PAD + 18; bt.y = 10;
  captureArea.addChild(bt);

  // Monster sprite + glow
  captureArea.addChild(new PIXI.Graphics()
    .circle(PAD + 58, 80, 34).fill({ color: D.neon, alpha: 0.06 }));
  const spr = monster(70, capturedEnemy.img);
  spr.x = PAD + 58; spr.y = 80;
  captureArea.addChild(spr);

  // Info (right side)
  const ix = PAD + 104;
  const nm = lbl(capturedEnemy.name, 10, D.text, true);
  nm.x = ix; nm.y = 32;
  captureArea.addChild(nm);

  if (capturedEnemy.sensoryType) {
    const AXIS = { sound: '소리', temperature: '온도', smell: '냄새', behavior: '행동' };
    const s = capturedEnemy.sensoryType.map(k => AXIS[k] || k).join(' / ');
    captureArea.addChild(Object.assign(lbl('감각: ' + s, 6, D.dim), { x: ix, y: 56 }));
  }

  if (capturedEnemy.personality) {
    const P = { aggressive: '공격적', timid: '겁많은', curious: '호기심', stubborn: '완고' };
    captureArea.addChild(Object.assign(
      lbl('성격: ' + (P[capturedEnemy.personality] || capturedEnemy.personality), 6, D.dim),
      { x: ix, y: 74 }
    ));
  }

  captureArea.addChild(Object.assign(
    lbl('순화 ' + (capturedEnemy.tamingThreshold || '?') + ' / 도주 ' + (capturedEnemy.escapeThreshold || '?'), 6, D.dimmer),
    { x: ix, y: 92 }
  ));

  // Taming/escape mini bars
  const barX = ix, barY = 110, barW = 100;
  captureArea.addChild(statBar(barX, barY, barW / 2 - 4, 5, 1, D.neon));
  captureArea.addChild(statBar(barX + barW / 2 + 4, barY, barW / 2 - 4, 5, 1, D.red));
  captureArea.addChild(Object.assign(lbl('순화', 4, D.neon), { x: barX, y: barY + 6 }));
  captureArea.addChild(Object.assign(lbl('도주', 4, D.red), { x: barX + barW / 2 + 4, y: barY + 6 }));
}

// ============================================================
// Team Slots (3x2 grid, titleUI style)
// ============================================================

function refreshSlots() {
  let activeCount = 0, benchCount = 0;

  for (let i = 0; i < 6; i++) {
    const c = slotGfx[i]; c.removeChildren();
    const ally = allies[i];
    const isActive = i < 3;
    if (ally) { if (isActive) activeCount++; else benchCount++; }

    if (!ally) {
      c.addChild(new PIXI.Graphics()
        .roundRect(0, 0, SLOT_W, SLOT_H, 14).fill({ color: D.bgAlt })
        .stroke({ color: D.sep, width: 1, alpha: 0.3 }));
      const plus = lbl('+', 14, D.dimmer);
      plus.anchor = { x: 0.5, y: 0.5 }; plus.x = SLOT_W / 2; plus.y = SLOT_H / 2 - 4;
      c.addChild(plus);
      const hint = lbl('빈 슬롯', 5, D.dimmer);
      hint.anchor = { x: 0.5, y: 0 }; hint.x = SLOT_W / 2; hint.y = SLOT_H / 2 + 12;
      c.addChild(hint);
      continue;
    }

    // Filled slot
    const borderCol = isActive ? D.neon : D.sep;
    c.addChild(darkCard(SLOT_W, SLOT_H, 14, isActive ? D.cardHi : D.card, borderCol, true));

    // HP bar (top)
    if (!ally.inEgg) {
      const hpR = (ally.hp ?? ally.maxHp) / ally.maxHp;
      c.addChild(statBar(SLOT_W / 2 - 30, 6, 60, 5, hpR, hpR > 0.3 ? D.neon : D.red));
    }

    // Sprite
    c.addChild(new PIXI.Graphics().circle(SLOT_W / 2, 47, 22).fill({ color: D.neon, alpha: 0.06 }));
    if (ally.inEgg) {
      const eggT = lbl('🥚', 16, D.dimmer);
      eggT.anchor = { x: 0.5, y: 0.5 }; eggT.x = SLOT_W / 2; eggT.y = 47;
      c.addChild(eggT);
    } else {
      const spr = monster(48, ally.img); spr.x = SLOT_W / 2; spr.y = 47;
      if (ally.hp <= 0) spr.alpha = 0.3;
      c.addChild(spr);
      if (ally.hp <= 0) {
        const zzz = lbl('zzz', 8, D.dimmer, true);
        zzz.anchor = { x: 0.5, y: 0.5 }; zzz.x = SLOT_W / 2; zzz.y = 47;
        c.addChild(zzz);
      }
    }

    // Name
    const nm = lbl(ally.name, 6.5, D.text, true);
    nm.anchor = { x: 0.5, y: 0 }; nm.x = SLOT_W / 2; nm.y = SLOT_H - 24;
    c.addChild(nm);

    // XP bar (bottom)
    const xpR = (ally.xp || 0) / (ally.xpThreshold || 5);
    c.addChild(statBar(SLOT_W / 2 - 24, SLOT_H - 10, 48, 3, xpR, 0xffe060));
  }

  if (activeCountLabel) activeCountLabel.text = `${activeCount}/3`;
  if (benchCountLabel) benchCountLabel.text = `${benchCount}/3`;
}
