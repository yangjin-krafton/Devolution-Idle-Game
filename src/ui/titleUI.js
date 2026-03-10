// ============================================================
// Title / Team Formation Screen — Dark/Neon style (matches in-game)
// ============================================================

import { W, H, C, S, hex, lbl, cuteBtn, star, addSparkles } from './theme.js';
import { monster } from './sprites.js';
import { ALLY_MONSTERS, ENEMY_MONSTERS, SKILL_CATEGORY } from '../data.js';
import { getMonsterById, getStatTotal, AXIS_LABEL, PERSONALITY_LABEL, ROLE_LABEL } from '../monsterRegistry.js';

// ---- Dark palette (from actionPanelUI) ----
const D = {
  bg:      0x1a1a2e,  bgAlt:   0x222238,  card:    0x262640,  cardHi:  0x2e2e48,
  neon:    0x00d4aa,   neonDim: 0x009977,
  red:     0xff6b6b,   redDark: 0xcc4444,
  blue:    0x4dabf7,   blueDark:0x2b7fc4,
  text:    0xddddf0,   dim:     0x8888aa,  dimmer:  0x555577,  sep:     0x444466,
  panel:   0x1e1e34,   white:   0xffffff,  black:   0x000000,
};

// Category colors matching combat UI
const CAT_COLOR = {
  stimulate: { c: D.neon,  bg: 0x1a3330 },
  capture:   { c: D.red,   bg: 0x33222a },
  defend:    { c: D.blue,  bg: 0x1a2a3a },
};

// ---- Layout ----
const PAD = 14;
const DETAIL_Y = 8, DETAIL_H = 158;
const SLOTS_Y = DETAIL_Y + DETAIL_H + 8;
const SLOT_W = 128, SLOT_H = 105, SLOT_GAP = 16;
const SLOT_LEFT = Math.round((W - (SLOT_W * 3 + SLOT_GAP * 2)) / 2);
const MAIN_SLOTS_Y = SLOTS_Y + 24;
const BENCH_LABEL_Y = MAIN_SLOTS_Y + SLOT_H + 6;
const BENCH_SLOTS_Y = BENCH_LABEL_Y + 22;
const CODEX_Y = BENCH_SLOTS_Y + SLOT_H + 8;
const CODEX_HEADER_H = 30;
const CODEX_FILTER_H = 26;
const CODEX_GRID_Y = CODEX_Y + CODEX_HEADER_H + CODEX_FILTER_H;
const CODEX_VISIBLE_H = H - CODEX_GRID_Y;
const CODEX_CARD_W = 95, CODEX_CARD_H = 105, CODEX_COLS = 4, CODEX_GAP = 12;
const CODEX_LEFT = Math.round((W - (CODEX_CARD_W * CODEX_COLS + CODEX_GAP * (CODEX_COLS - 1))) / 2);

// ---- State ----
let teamSlots = [null, null, null, null, null, null];
let selectedMonster = null;
let codexEntries = {};
let mode = 'idle';
let pendingSlotIdx = -1;
let startPos = { x: 0, y: 0 };
let dragSprite = null;
const DRAG_THRESHOLD = 8;
let scrollOffset = 0, maxScroll = 0, scrollStartOffset = 0;

// ---- Codex filter/sort state ----
let codexFilter = 'all'; // 'all' | 'ally' | 'enemy' | 'unlocked' | 'locked'
let codexSort = 'default'; // 'default' | 'name' | 'hp'
let filteredList = [];     // cached for hit testing
let detailPage = 0; // 0=정보, 1=스킬, 2=퇴화
const DETAIL_PAGES = 3;
const SWIPE_THRESHOLD = 30;

// ---- UI refs ----
let ct, detailBody, slotGfx = [], codexContent, codexMask;
let startOverlay, startBtnRef, removeIndicator;
let slotsHeaderLabel, benchHeaderLabel, filterBarContainer;

// ---- Helpers ----
function darkCard(w, h, r, fill, border, hasShadow) {
  const g = new PIXI.Graphics();
  if (hasShadow) g.roundRect(2, 3, w, h, r).fill({ color: D.black, alpha: 0.2 });
  g.roundRect(0, 0, w, h, r).fill({ color: fill });
  g.roundRect(0, 0, w, h, r).stroke({ color: border, width: 1.5 });
  // Top frost shine
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

function slotNum(num, color) {
  const c = new PIXI.Container();
  c.addChild(new PIXI.Graphics().circle(0, 0, 9)
    .fill({ color, alpha: 0.25 }).stroke({ color, width: 1, alpha: 0.5 }));
  const t = lbl(String(num), 5, color, true);
  t.anchor = { x: 0.5, y: 0.5 };
  c.addChild(t);
  return c;
}

function filterPill(text, isActive, color) {
  const c = new PIXI.Container();
  const tw = text.length * 5.5 * S + 12;
  c.addChild(new PIXI.Graphics().roundRect(0, 0, tw, 18, 9)
    .fill({ color: isActive ? (color || D.neon) : D.bgAlt, alpha: isActive ? 0.3 : 0.5 })
    .stroke({ color: isActive ? (color || D.neon) : D.sep, width: 1, alpha: isActive ? 0.7 : 0.3 }));
  const t = lbl(text, 5, isActive ? (color || D.neon) : D.dim, isActive);
  t.anchor = { x: 0.5, y: 0.5 }; t.x = tw / 2; t.y = 9;
  c.addChild(t);
  c._pillWidth = tw;
  return c;
}

function getFilteredMonsters() {
  let all = [...ALLY_MONSTERS, ...ENEMY_MONSTERS];

  // Filter
  if (codexFilter === 'ally') all = all.filter(m => !!m.actions);
  else if (codexFilter === 'enemy') all = all.filter(m => !m.actions);
  else if (codexFilter === 'unlocked') all = all.filter(m => codexEntries[m.id] === 'unlocked');
  else if (codexFilter === 'locked') all = all.filter(m => codexEntries[m.id] === 'locked');

  // Sort
  if (codexSort === 'name') {
    all.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  } else if (codexSort === 'hp') {
    all.sort((a, b) => (b.maxHp || b.attackPower || 0) - (a.maxHp || a.attackPower || 0));
  }
  // 'default' = original data order (no sort)

  return all;
}

// ---- State ----
function resetState() {
  teamSlots = [null, null, null, null, null, null];
  selectedMonster = null; scrollOffset = 0; mode = 'idle';
  codexFilter = 'all'; codexSort = 'default'; filteredList = []; detailPage = 0;
  codexEntries = {};
  ALLY_MONSTERS.forEach(m => { codexEntries[m.id] = 'unlocked'; });
  ENEMY_MONSTERS.forEach(m => { codexEntries[m.id] = 'locked'; });
}

function slotPos(i) {
  return { x: SLOT_LEFT + (i % 3) * (SLOT_W + SLOT_GAP), y: i < 3 ? MAIN_SLOTS_Y : BENCH_SLOTS_Y };
}
function hitSlot(px, py) {
  for (let i = 0; i < 6; i++) {
    const p = slotPos(i);
    if (px >= p.x && px < p.x + SLOT_W && py >= p.y && py < p.y + SLOT_H) return i;
  }
  return -1;
}
function hitCodexCard(px, py) {
  if (py < CODEX_GRID_Y || py > H) return null;
  const contentY = py + scrollOffset - CODEX_GRID_Y;
  for (let i = 0; i < filteredList.length; i++) {
    const col = i % CODEX_COLS, row = Math.floor(i / CODEX_COLS);
    const cx = CODEX_LEFT + col * (CODEX_CARD_W + CODEX_GAP);
    const cy = 8 + row * (CODEX_CARD_H + CODEX_GAP);
    if (px >= cx && px < cx + CODEX_CARD_W && contentY >= cy && contentY < cy + CODEX_CARD_H) return filteredList[i];
  }
  return null;
}

// ============================================================
// Build UI
// ============================================================

function buildBackground() {
  const bg = new PIXI.Graphics();
  bg.rect(0, 0, W, H).fill({ color: D.bg });
  // Top gradient accent
  bg.roundRect(0, 0, W, 8, 0).fill({ color: D.neon, alpha: 0.3 });
  // Subtle grid dots
  const dots = new PIXI.Graphics();
  for (let dx = 30; dx < W; dx += 50) {
    for (let dy = SLOTS_Y; dy < CODEX_Y; dy += 50) {
      dots.circle(dx, dy, 1).fill({ color: D.dim, alpha: 0.12 });
    }
  }
  ct.addChild(bg);
  ct.addChild(dots);
}

function buildDetailPanel() {
  const panel = new PIXI.Container(); panel.y = DETAIL_Y;
  // Dark frosted panel
  panel.addChild(darkCard(W - PAD * 2, DETAIL_H, 16, D.panel, D.sep, true));
  panel.children[0].x = PAD;
  // Neon accent line top
  panel.addChild(new PIXI.Graphics()
    .moveTo(PAD, 0).lineTo(W - PAD, 0).stroke({ color: D.neon, width: 1.5, alpha: 0.3 }));
  detailBody = new PIXI.Container(); detailBody.x = PAD;
  panel.addChild(detailBody);
  ct.addChild(panel);
  refreshDetail();
}

function refreshDetail() {
  detailBody.removeChildren();
  const mon = selectedMonster;
  const pw = W - PAD * 2;

  if (!mon) {
    const h = lbl('도감에서 몬스터를 선택하세요', 10, D.dimmer);
    h.anchor = { x: 0.5, y: 0.5 }; h.x = pw / 2; h.y = DETAIL_H / 2 - 8;
    detailBody.addChild(h);
    const arrow = lbl('◀  스와이프  ▶', 7, D.neon); arrow.alpha = 0.3;
    arrow.anchor = { x: 0.5, y: 0.5 }; arrow.x = pw / 2; arrow.y = DETAIL_H / 2 + 20;
    detailBody.addChild(arrow);
    return;
  }
  const unlocked = codexEntries[mon.id] === 'unlocked';
  const reg = getMonsterById(mon.id);

  if (!unlocked) {
    const spr = monster(60, mon.img); spr.x = pw / 2; spr.y = 50;
    if (spr.children[0]) spr.children[0].tint = 0x333344;
    detailBody.addChild(spr);
    detailBody.addChild(Object.assign(lbl('???', 16, D.dimmer, true), { x: pw / 2 - 20, y: 90 }));
    detailBody.addChild(Object.assign(lbl('영입하면 정보가 공개됩니다', 8, D.dimmer), { x: pw / 2 - 80, y: 120 }));
    renderPageDots(pw);
    return;
  }

  // Render current page
  if (detailPage === 0) renderPageInfo(pw, mon, reg);
  else if (detailPage === 1) renderPageSkills(pw, mon);
  else if (detailPage === 2) renderPageDevo(pw, mon, reg);

  // Page dots
  renderPageDots(pw);
}

function renderPageDots(pw) {
  const labels = ['정보', '스킬', '퇴화'];
  const dotY = DETAIL_H - 16;
  for (let i = 0; i < DETAIL_PAGES; i++) {
    const active = detailPage === i;
    const dx = pw / 2 + (i - 1) * 42;
    detailBody.addChild(new PIXI.Graphics()
      .circle(dx, dotY, active ? 4 : 3)
      .fill({ color: active ? D.neon : D.dimmer, alpha: active ? 0.8 : 0.4 }));
    const dt = lbl(labels[i], 5, active ? D.neon : D.dimmer, active);
    dt.anchor = { x: 0.5, y: 0 }; dt.x = dx; dt.y = dotY + 6;
    detailBody.addChild(dt);
  }
}

// ---- Page 0: 정보 ----
// Layout: [Sprite 90px] | [Info right column]
//         [──── Stats row (full width) ────]
function renderPageInfo(pw, mon, reg) {
  const isAlly = !!mon.actions;
  const R = 90; // right column start x

  // ── Left: Sprite area (0~85) ──
  detailBody.addChild(new PIXI.Graphics()
    .roundRect(0, 0, 82, 80, 12).fill({ color: D.neon, alpha: 0.04 })
    .stroke({ color: D.neon, width: 1, alpha: 0.1 }));
  const spr = monster(72, mon.img); spr.x = 41; spr.y = 40;
  detailBody.addChild(spr);

  // ── Right: Name row ──
  detailBody.addChild(Object.assign(lbl(mon.name, 14, D.text, true), { x: R, y: 2 }));

  // Badges row (under name)
  let bx = R;
  const tb = neonBadge(isAlly ? '아군' : '적', isAlly ? D.neon : D.red);
  tb.x = bx; tb.y = 28; detailBody.addChild(tb); bx += (tb._pillWidth || 42) + 6;
  if (reg?.role) {
    const rb = neonBadge(ROLE_LABEL[reg.role] || reg.role, D.blue);
    rb.x = bx; rb.y = 28; detailBody.addChild(rb); bx += (rb._pillWidth || 42) + 6;
  }
  if (mon.maxHp) {
    const hb = neonBadge(`HP ${mon.maxHp}`, D.dim);
    hb.x = bx; hb.y = 28; detailBody.addChild(hb);
  }
  if (mon.attackPower != null) {
    const ab = neonBadge(`ATK ${mon.attackPower}`, D.red);
    ab.x = bx; ab.y = 28; detailBody.addChild(ab);
  }

  // Desc (right column, 2 lines max)
  const desc = mon.desc || '';
  detailBody.addChild(Object.assign(lbl(desc, 7, D.dimmer), { x: R, y: 48 }));

  // ── Separator + total ──
  detailBody.addChild(new PIXI.Graphics()
    .moveTo(0, 82).lineTo(pw, 82).stroke({ color: D.sep, width: 0.5, alpha: 0.4 }));
  if (mon.stats) {
    const total = Object.values(mon.stats).reduce((s, v) => s + v, 0);
    detailBody.addChild(Object.assign(lbl(`총합 ${total}`, 6, D.dim), { x: pw - 44, y: 72 }));
  }

  // ── Bottom: Stats — 4 rows single column for clarity ──
  const M = 6; // inner left margin
  if (mon.stats) {
    const STAT = { gentleness: '온화', empathy: '공감', resilience: '인내', agility: '민첩' };
    const SCOL = { gentleness: D.neon, empathy: D.blue, resilience: 0xffaa60, agility: 0x88ddbb };
    const barX = M + 38, barW = pw - barX - 28;

    Object.entries(mon.stats).forEach(([k, v], i) => {
      const y = 88 + i * 16;
      detailBody.addChild(Object.assign(lbl(STAT[k], 7, SCOL[k], true), { x: M, y }));
      detailBody.addChild(statBar(barX, y + 3, barW, 8, v / 10, SCOL[k]));
      detailBody.addChild(Object.assign(lbl(String(v), 8, D.text, true), { x: pw - 14, y }));
    });
  }

  // Enemy stats — 2×2 grid
  if (mon.attackPower != null) {
    const sensory = (mon.sensoryType || []).map(s => AXIS_LABEL[s] || s).join(', ');
    const pers = PERSONALITY_LABEL[mon.personality] || mon.personality || '';
    const rx = pw / 2;
    detailBody.addChild(Object.assign(lbl('감각', 6, D.dimmer), { x: M, y: 88 }));
    detailBody.addChild(Object.assign(lbl(sensory, 8, D.text, true), { x: M + 34, y: 87 }));
    detailBody.addChild(Object.assign(lbl('성격', 6, D.dimmer), { x: rx, y: 88 }));
    detailBody.addChild(Object.assign(lbl(pers, 8, D.text, true), { x: rx + 34, y: 87 }));
    detailBody.addChild(Object.assign(lbl('순화', 6, D.dimmer), { x: M, y: 108 }));
    detailBody.addChild(Object.assign(lbl(String(mon.tamingThreshold), 10, D.neon, true), { x: M + 34, y: 106 }));
    detailBody.addChild(Object.assign(lbl('도주', 6, D.dimmer), { x: rx, y: 108 }));
    detailBody.addChild(Object.assign(lbl(String(mon.escapeThreshold), 10, D.red, true), { x: rx + 34, y: 106 }));
  }
}

// ---- Page 1: 스킬 ----
// Layout: 3 equal columns, structured rows inside each
function renderPageSkills(pw, mon) {
  if (!mon.actions) {
    const t = lbl('스킬 정보 없음', 10, D.dimmer);
    t.anchor = { x: 0.5, y: 0.5 }; t.x = pw / 2; t.y = 65;
    detailBody.addChild(t); return;
  }
  const gap = 6, sw = Math.floor((pw - gap * 2) / 3);
  const sh = DETAIL_H - 24;

  mon.actions.forEach((a, i) => {
    const x = i * (sw + gap);
    const cat = CAT_COLOR[a.category] || CAT_COLOR.stimulate;

    // Card bg
    detailBody.addChild(new PIXI.Graphics()
      .roundRect(x, 0, sw, sh, 12).fill({ color: cat.bg })
      .stroke({ color: cat.c, width: 1, alpha: 0.35 }));
    // Type color bar (left)
    detailBody.addChild(new PIXI.Graphics()
      .roundRect(x, 5, 3, sh - 10, 1.5).fill({ color: cat.c, alpha: 0.6 }));

    const cx = x + 10; // content x
    const cw = sw - 16; // content width

    // Row 1: Category · Axis
    const catName = SKILL_CATEGORY[a.category]?.name || a.category;
    const axisName = AXIS_LABEL[a.axis] || a.axis;
    detailBody.addChild(Object.assign(lbl(`${catName} · ${axisName}`, 6, cat.c, true), { x: cx, y: 5 }));

    // Row 2: Skill name (big, centered)
    const nm = lbl(a.name, 10, D.text, true);
    nm.anchor = { x: 0.5, y: 0 }; nm.x = x + sw / 2; nm.y = 22;
    detailBody.addChild(nm);

    // Separator
    detailBody.addChild(new PIXI.Graphics()
      .moveTo(cx, 46).lineTo(x + sw - 6, 46).stroke({ color: D.sep, width: 0.5 }));

    // Row 3: Power — label + big number
    const mid = x + sw / 2;
    detailBody.addChild(Object.assign(lbl('위력', 6, D.dimmer), { x: cx, y: 50 }));
    const pwN = lbl(String(a.power), 14, D.text, true);
    pwN.anchor = { x: 0.5, y: 0 }; pwN.x = mid; pwN.y = 60;
    detailBody.addChild(pwN);

    // Row 4: PP — label inline with number
    const ppTxt = lbl(`PP ${a.pp}/${a.maxPp}`, 9, cat.c, true);
    ppTxt.anchor = { x: 0.5, y: 0 }; ppTxt.x = mid; ppTxt.y = 90;
    detailBody.addChild(ppTxt);

    // Row 5: Escape risk
    if (a.escapeRisk !== 0) {
      const risk = a.escapeRisk > 0 ? `+${a.escapeRisk}` : String(a.escapeRisk);
      const rc = a.escapeRisk > 0 ? D.red : D.neon;
      const rTxt = lbl(`도주 ${risk}`, 8, rc, true);
      rTxt.anchor = { x: 0.5, y: 0 }; rTxt.x = mid; rTxt.y = 114;
      detailBody.addChild(rTxt);
    }
  });
}

// ---- Page 2: 퇴화 ----
// Layout: [Before | Arrow | After] top row, stat table below
function renderPageDevo(pw, mon, reg) {
  if (!mon.devolvedName && !reg?.devoTree) {
    const t = lbl('퇴화 정보 없음', 10, D.dimmer);
    t.anchor = { x: 0.5, y: 0.5 }; t.x = pw / 2; t.y = 65;
    detailBody.addChild(t); return;
  }

  if (mon.devolvedName) {
    const half = pw / 2 - 16;

    // ── Top row: Before → After ──
    // Before box
    detailBody.addChild(new PIXI.Graphics()
      .roundRect(0, 0, half, 36, 8).fill({ color: D.card })
      .stroke({ color: D.sep, width: 1 }));
    const bn = lbl(mon.name, 9, D.text, true);
    bn.anchor = { x: 0.5, y: 0.5 }; bn.x = half / 2; bn.y = 18;
    detailBody.addChild(bn);

    // Arrow
    const ar = lbl('▶', 10, D.neon, true);
    ar.anchor = { x: 0.5, y: 0.5 }; ar.x = pw / 2; ar.y = 18;
    detailBody.addChild(ar);

    // After box
    const ax = pw / 2 + 16;
    detailBody.addChild(new PIXI.Graphics()
      .roundRect(ax, 0, half, 36, 8).fill({ color: D.neon, alpha: 0.08 })
      .stroke({ color: D.neon, width: 1, alpha: 0.4 }));
    const an = lbl(mon.devolvedName, 9, D.neon, true);
    an.anchor = { x: 0.5, y: 0.5 }; an.x = ax + half / 2; an.y = 18;
    detailBody.addChild(an);

    // Desc
    if (mon.devolvedDesc) {
      detailBody.addChild(Object.assign(lbl(mon.devolvedDesc, 6, D.dimmer), { x: 0, y: 40 }));
    }

    // ── Separator ──
    detailBody.addChild(new PIXI.Graphics()
      .moveTo(0, 56).lineTo(pw, 56).stroke({ color: D.sep, width: 0.5, alpha: 0.4 }));

    // ── Stat comparison table (y=60~130) ──
    if (mon.devolvedStats) {
      const STAT = { gentleness: '온화', empathy: '공감', resilience: '인내', agility: '민첩' };
      const SCOL = { gentleness: D.neon, empathy: D.blue, resilience: 0xffaa60, agility: 0x88ddbb };
      const M = 6; // inner margin

      // Header row
      detailBody.addChild(Object.assign(lbl('스탯', 6, D.dimmer), { x: M, y: 60 }));
      detailBody.addChild(Object.assign(lbl('현재', 6, D.dimmer), { x: M + 58, y: 60 }));
      detailBody.addChild(Object.assign(lbl('퇴화 후', 6, D.dimmer), { x: M + 118, y: 60 }));
      detailBody.addChild(Object.assign(lbl('변화', 6, D.dimmer), { x: M + 188, y: 60 }));

      Object.entries(mon.devolvedStats).forEach(([k, v], i) => {
        const y = 76 + i * 18;
        const orig = mon.stats?.[k] || 0;
        const diff = v - orig;
        const diffStr = diff > 0 ? `+${diff}` : String(diff);
        const diffCol = diff > 0 ? D.neon : diff < 0 ? D.red : D.dim;

        detailBody.addChild(Object.assign(lbl(STAT[k], 7, SCOL[k], true), { x: M, y }));
        detailBody.addChild(Object.assign(lbl(String(orig), 9, D.dimmer), { x: M + 66, y: y - 1 }));
        detailBody.addChild(Object.assign(lbl('→', 7, D.sep), { x: M + 94, y }));
        detailBody.addChild(Object.assign(lbl(String(v), 9, D.text, true), { x: M + 118, y: y - 1 }));

        // Diff with colored bar indicator
        detailBody.addChild(Object.assign(lbl(diffStr, 9, diffCol, true), { x: M + 188, y: y - 1 }));
        const barW = Math.abs(diff) * 6;
        if (barW > 0) {
          detailBody.addChild(new PIXI.Graphics()
            .roundRect(M + 218, y + 4, Math.min(barW, pw - M - 222), 6, 3).fill({ color: diffCol, alpha: 0.4 }));
        }
      });
    }
  }

  // Roster devo tree (future)
  if (reg?.devoTree?.devo1) {
    let dy = mon.devolvedName ? 148 : 4;
    reg.devoTree.devo1.forEach((d1, i) => {
      const role = d1.role ? ` [${ROLE_LABEL[d1.role] || d1.role}]` : '';
      detailBody.addChild(Object.assign(lbl(`퇴화1-${i + 1}: ${d1.name}${role}`, 8, D.neon, true), { x: 4, y: dy }));
      dy += 22;
      (d1.devo2 || []).forEach((d2, j) => {
        const r2 = d2.role ? ` [${ROLE_LABEL[d2.role] || d2.role}]` : '';
        detailBody.addChild(Object.assign(lbl(`  └ ${d2.name}${r2}`, 7, D.blue), { x: 16, y: dy }));
        dy += 18;
      });
    });
  }
}

// ---- Team Slots ----

function buildTeamSlots() {
  const mainHdr = new PIXI.Container(); mainHdr.y = SLOTS_Y;
  mainHdr.addChild(Object.assign(lbl('주전 팀', 9, D.neon, true), { x: SLOT_LEFT }));
  mainHdr.addChild(new PIXI.Graphics()
    .moveTo(SLOT_LEFT + 72, 10).lineTo(W - SLOT_LEFT, 10).stroke({ color: D.neon, width: 0.5, alpha: 0.3 }));
  slotsHeaderLabel = lbl('0/3', 6, D.dim);
  slotsHeaderLabel.x = W - SLOT_LEFT - 28; slotsHeaderLabel.y = 2;
  mainHdr.addChild(slotsHeaderLabel);
  ct.addChild(mainHdr);

  const benchHdr = new PIXI.Container(); benchHdr.y = BENCH_LABEL_Y;
  benchHdr.addChild(Object.assign(lbl('후보', 9, D.dim, true), { x: SLOT_LEFT }));
  benchHdr.addChild(new PIXI.Graphics()
    .moveTo(SLOT_LEFT + 44, 10).lineTo(W - SLOT_LEFT, 10).stroke({ color: D.sep, width: 0.5, alpha: 0.3 }));
  benchHeaderLabel = lbl('0/3', 6, D.dimmer);
  benchHeaderLabel.x = W - SLOT_LEFT - 28; benchHeaderLabel.y = 2;
  benchHdr.addChild(benchHeaderLabel);
  ct.addChild(benchHdr);

  slotGfx = [];
  for (let i = 0; i < 6; i++) {
    const c = new PIXI.Container();
    const p = slotPos(i); c.x = p.x; c.y = p.y;
    ct.addChild(c); slotGfx.push(c);
  }

  // Remove indicator — built here but added to ct AFTER codex & startOverlay (see initTitle)
  removeIndicator = new PIXI.Container(); removeIndicator.visible = false;

  refreshSlots();
}

function refreshSlots() {
  let mainCount = 0, benchCount = 0;
  for (let i = 0; i < 6; i++) {
    const c = slotGfx[i]; c.removeChildren();
    const mon = teamSlots[i];
    const sel = selectedMonster && mon && selectedMonster.id === mon.id;
    if (mon) { if (i < 3) mainCount++; else benchCount++; }

    if (!mon) {
      // Empty slot
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
    const borderCol = sel ? D.neon : D.sep;
    c.addChild(darkCard(SLOT_W, SLOT_H, 14, sel ? D.cardHi : D.card, borderCol, true));
    if (sel) {
      c.addChild(new PIXI.Graphics()
        .roundRect(-2, -2, SLOT_W + 4, SLOT_H + 4, 16)
        .stroke({ color: D.neon, width: 2, alpha: 0.3 }));
    }

    // Slot number
    const numC = slotNum(i + 1, i < 3 ? D.neon : D.dim);
    numC.x = 11; numC.y = 11; c.addChild(numC);

    // HP bar
    const hpR = (mon.hp ?? mon.maxHp) / mon.maxHp;
    c.addChild(statBar(SLOT_W / 2 - 24, 4, 58, 5, hpR, hpR > 0.3 ? D.neon : D.red));
    // XP bar
    const xpR = (mon.xp || 0) / (mon.xpThreshold || 5);
    c.addChild(statBar(SLOT_W / 2 - 24, 11, 58, 3, xpR, 0xffe060));

    // Sprite backdrop
    c.addChild(new PIXI.Graphics().circle(SLOT_W / 2, 47, 22).fill({ color: D.neon, alpha: 0.06 }));
    const spr = monster(48, mon.img); spr.x = SLOT_W / 2; spr.y = 47; c.addChild(spr);

    // Name
    const nm = lbl(mon.name, 6.5, D.text, true);
    nm.anchor = { x: 0.5, y: 0 }; nm.x = SLOT_W / 2; nm.y = SLOT_H - 24; c.addChild(nm);
  }

  if (slotsHeaderLabel) slotsHeaderLabel.text = `${mainCount}/3`;
  if (benchHeaderLabel) benchHeaderLabel.text = `${benchCount}/3`;
  refreshStartBtn();
}

// ---- Codex ----

function buildCodexPanel() {
  // Header
  const hdr = new PIXI.Graphics();
  hdr.rect(0, CODEX_Y, W, CODEX_HEADER_H + CODEX_FILTER_H).fill({ color: D.bgAlt });
  hdr.moveTo(0, CODEX_Y).lineTo(W, CODEX_Y).stroke({ color: D.neon, width: 1, alpha: 0.25 });
  ct.addChild(hdr);

  ct.addChild(Object.assign(lbl('몬스터 도감', 9, D.neon, true), { x: PAD, y: CODEX_Y + 6 }));
  const countLabel = lbl('', 6, D.dim);
  countLabel.x = W - PAD - 60; countLabel.y = CODEX_Y + 8;
  ct.addChild(countLabel);
  ct._codexCountLabel = countLabel;

  // Filter bar
  filterBarContainer = new PIXI.Container();
  filterBarContainer.y = CODEX_Y + CODEX_HEADER_H;
  ct.addChild(filterBarContainer);
  buildFilterBar();

  // Separator below filter
  ct.addChild(new PIXI.Graphics()
    .moveTo(0, CODEX_GRID_Y).lineTo(W, CODEX_GRID_Y).stroke({ color: D.sep, width: 0.5, alpha: 0.4 }));

  codexMask = new PIXI.Graphics().rect(0, CODEX_GRID_Y, W, CODEX_VISIBLE_H).fill({ color: 0xffffff });
  ct.addChild(codexMask);
  codexContent = new PIXI.Container();
  codexContent.y = CODEX_GRID_Y;
  codexContent.mask = codexMask;
  ct.addChild(codexContent);
  refreshCodex();
}

function buildFilterBar() {
  filterBarContainer.removeChildren();

  const filters = [
    { key: 'all',      label: '전체' },
    { key: 'ally',     label: '아군' },
    { key: 'enemy',    label: '적' },
    { key: 'unlocked', label: '언락' },
    { key: 'locked',   label: '잠금' },
  ];
  const sorts = [
    { key: 'default', label: '기본' },
    { key: 'name',    label: '이름' },
    { key: 'hp',      label: 'HP' },
  ];

  let x = PAD;
  // Filter pills
  filters.forEach(f => {
    const pill = filterPill(f.label, codexFilter === f.key, D.neon);
    pill.x = x; pill.y = 4;
    pill.eventMode = 'static'; pill.cursor = 'pointer';
    pill.on('pointerdown', (e) => {
      e.stopPropagation();
      codexFilter = f.key;
      scrollOffset = 0;
      buildFilterBar();
      refreshCodex();
    });
    filterBarContainer.addChild(pill);
    x += (pill._pillWidth || 40) + 4;
  });

  // Separator dot
  x += 4;
  filterBarContainer.addChild(new PIXI.Graphics()
    .circle(x, 13, 1.5).fill({ color: D.sep }));
  x += 8;

  // Sort pills
  sorts.forEach(s => {
    const isActive = codexSort === s.key;
    const pill = filterPill(s.label + (isActive ? ' ▼' : ''), isActive, D.blue);
    pill.x = x; pill.y = 4;
    pill.eventMode = 'static'; pill.cursor = 'pointer';
    pill.on('pointerdown', (e) => {
      e.stopPropagation();
      codexSort = s.key;
      scrollOffset = 0;
      buildFilterBar();
      refreshCodex();
    });
    filterBarContainer.addChild(pill);
    x += (pill._pillWidth || 40) + 4;
  });
}

function refreshCodex() {
  codexContent.removeChildren();
  filteredList = getFilteredMonsters();
  const all = filteredList;
  const teamIds = new Set(teamSlots.filter(Boolean).map(m => m.id));
  let unlockedCount = 0;

  // Count total unlocked (from full list, not filtered)
  [...ALLY_MONSTERS, ...ENEMY_MONSTERS].forEach(m => {
    if (codexEntries[m.id] === 'unlocked') unlockedCount++;
  });

  all.forEach((mon, i) => {
    const col = i % CODEX_COLS, row = Math.floor(i / CODEX_COLS);
    const cx = CODEX_LEFT + col * (CODEX_CARD_W + CODEX_GAP);
    const cy = 8 + row * (CODEX_CARD_H + CODEX_GAP);
    const card = new PIXI.Container(); card.x = cx; card.y = cy;

    const state = codexEntries[mon.id] || 'locked';
    const inTeam = teamIds.has(mon.id);
    const isSel = selectedMonster && selectedMonster.id === mon.id;

    if (state === 'locked') {
      card.addChild(new PIXI.Graphics()
        .roundRect(0, 0, CODEX_CARD_W, CODEX_CARD_H, 12)
        .fill({ color: 0x1a1a28 }).stroke({ color: D.sep, width: 1, alpha: 0.3 }));
      card.addChild(new PIXI.Graphics()
        .circle(CODEX_CARD_W / 2, 40, 18).fill({ color: D.dimmer, alpha: 0.3 })
        .stroke({ color: D.dimmer, width: 1, alpha: 0.3 }));
      const q = lbl('???', 7, D.dimmer); q.anchor = { x: 0.5, y: 0 };
      q.x = CODEX_CARD_W / 2; q.y = CODEX_CARD_H - 22; card.addChild(q);

    } else if (state === 'seen') {
      card.addChild(darkCard(CODEX_CARD_W, CODEX_CARD_H, 12, D.bgAlt, D.sep, false));
      const s = monster(36, mon.img); s.x = CODEX_CARD_W / 2; s.y = 40; s.alpha = 0.25;
      if (s.children[0]) s.children[0].tint = 0x555577;
      card.addChild(s);
      const n = lbl(mon.name, 6, D.dimmer); n.anchor = { x: 0.5, y: 0 };
      n.x = CODEX_CARD_W / 2; n.y = CODEX_CARD_H - 22; card.addChild(n);

    } else {
      // Unlocked
      const bgCol = inTeam ? D.cardHi : D.card;
      const bdCol = isSel ? D.neon : (inTeam ? D.neonDim : D.sep);

      card.addChild(darkCard(CODEX_CARD_W, CODEX_CARD_H, 12, bgCol, bdCol, true));
      if (isSel) {
        card.addChild(new PIXI.Graphics()
          .roundRect(-2, -2, CODEX_CARD_W + 4, CODEX_CARD_H + 4, 14)
          .stroke({ color: D.neon, width: 1.5, alpha: 0.35 }));
      }

      // Sprite
      card.addChild(new PIXI.Graphics()
        .circle(CODEX_CARD_W / 2, 40, 17).fill({ color: D.neon, alpha: inTeam ? 0.04 : 0.07 }));
      const s = monster(36, mon.img); s.x = CODEX_CARD_W / 2; s.y = 40;
      if (inTeam) s.alpha = 0.35;
      card.addChild(s);

      const n = lbl(mon.name, 6, inTeam ? D.dim : D.text, !inTeam);
      n.anchor = { x: 0.5, y: 0 }; n.x = CODEX_CARD_W / 2; n.y = CODEX_CARD_H - 22;
      card.addChild(n);

      if (inTeam) {
        const b = neonBadge('배치중', D.neon);
        b.x = (CODEX_CARD_W - (b.width || 42)) / 2; b.y = 3;
        card.addChild(b);
      }
    }
    codexContent.addChild(card);
  });

  const totalAll = ALLY_MONSTERS.length + ENEMY_MONSTERS.length;
  if (ct._codexCountLabel) ct._codexCountLabel.text = `${unlockedCount}/${totalAll} (${all.length}건)`;
  const rows = Math.ceil(all.length / CODEX_COLS);
  maxScroll = Math.max(0, rows * (CODEX_CARD_H + CODEX_GAP) + 16 - CODEX_VISIBLE_H);
  applyScroll();
}

function applyScroll() {
  scrollOffset = Math.max(0, Math.min(maxScroll, scrollOffset));
  codexContent.y = CODEX_GRID_Y - scrollOffset;
}

// ---- Start Button ----

function buildStartBtn() {
  startOverlay = new PIXI.Container(); startOverlay.visible = false;

  // Dark frosted overlay
  startOverlay.addChild(new PIXI.Graphics()
    .rect(0, CODEX_Y, W, H - CODEX_Y).fill({ color: D.bg, alpha: 0.92 }));

  const cy = CODEX_Y + (H - CODEX_Y) / 2;

  // Neon circle decoration
  startOverlay.addChild(new PIXI.Graphics()
    .circle(W / 2, cy - 5, 75).stroke({ color: D.neon, width: 1.5, alpha: 0.15 }));
  startOverlay.addChild(new PIXI.Graphics()
    .circle(W / 2, cy - 5, 50).stroke({ color: D.neon, width: 1, alpha: 0.1 }));

  const hint = lbl('팀 편성 완료!', 10, D.neon, true);
  hint.anchor = { x: 0.5, y: 0.5 }; hint.x = W / 2; hint.y = cy - 35;
  startOverlay.addChild(hint);

  // Neon-styled start button
  startBtnRef = cuteBtn(W / 2 - 180, cy - 5, 180, 48, '▶ 모험 시작', D.neon, D.bg);
  startOverlay.addChild(startBtnRef);

  const sub = lbl('주전 3 + 후보 3 준비 완료', 6, D.dim);
  sub.anchor = { x: 0.5, y: 0 }; sub.x = W / 2; sub.y = cy + 50;
  startOverlay.addChild(sub);

  ct.addChild(startOverlay);
  ct._startBtn = startBtnRef;
}

function refreshStartBtn() {
  if (!startOverlay) return;
  startOverlay.visible = teamSlots.every(s => s !== null);
}

// ============================================================
// Pointer Interaction
// ============================================================

function onPointerDown(e) {
  const pos = e.getLocalPosition(ct);
  startPos = { x: pos.x, y: pos.y };
  if (startOverlay.visible) {
    const bx = startBtnRef.x, by = startBtnRef.y, bw = 180 * S, bh = 48 * S;
    if (pos.x >= bx && pos.x < bx + bw && pos.y >= by && pos.y < by + bh) return;
  }
  // Detail panel swipe
  if (selectedMonster && pos.y >= DETAIL_Y && pos.y < DETAIL_Y + DETAIL_H + 8) {
    mode = 'detail-swipe'; return;
  }
  const si = hitSlot(pos.x, pos.y);
  if (si >= 0 && teamSlots[si]) { mode = 'slot-pending'; pendingSlotIdx = si; return; }
  if (pos.y >= CODEX_GRID_Y && pos.y <= H && !startOverlay.visible) {
    mode = 'codex-pending'; scrollStartOffset = scrollOffset; return;
  }
}

function onPointerMove(e) {
  const pos = e.getLocalPosition(ct);
  const dx = pos.x - startPos.x, dy = pos.y - startPos.y;
  if (mode === 'slot-pending' && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
    mode = 'dragging';
    dragSprite = monster(55, teamSlots[pendingSlotIdx].img);
    dragSprite.alpha = 0.75; ct.addChild(dragSprite);
    slotGfx[pendingSlotIdx].alpha = 0.3;
    removeIndicator.visible = true;
  }
  if (mode === 'dragging' && dragSprite) {
    dragSprite.x = pos.x; dragSprite.y = pos.y;
    // Full opacity when hovering over codex area, dim when above
    removeIndicator.alpha = pos.y > CODEX_Y ? 1.0 : 0.25;
  }
  if (mode === 'codex-pending' && Math.abs(dy) > 5) mode = 'scrolling';
  if (mode === 'scrolling') { scrollOffset = scrollStartOffset - dy; applyScroll(); }
}

function onPointerUp(e) {
  const pos = e.getLocalPosition(ct);
  if (mode === 'detail-swipe') {
    const dx = pos.x - startPos.x;
    if (dx < -SWIPE_THRESHOLD && detailPage < DETAIL_PAGES - 1) { detailPage++; refreshDetail(); }
    else if (dx > SWIPE_THRESHOLD && detailPage > 0) { detailPage--; refreshDetail(); }
  }
  if (mode === 'slot-pending') {
    selectedMonster = teamSlots[pendingSlotIdx];
    refreshDetail(); refreshSlots(); refreshCodex();
  }
  if (mode === 'dragging') {
    if (dragSprite) { ct.removeChild(dragSprite); dragSprite = null; }
    slotGfx[pendingSlotIdx].alpha = 1;
    removeIndicator.visible = false;
    if (pos.y > CODEX_Y) teamSlots[pendingSlotIdx] = null;
    else {
      const target = hitSlot(pos.x, pos.y);
      if (target >= 0 && target !== pendingSlotIdx) {
        const tmp = teamSlots[target];
        teamSlots[target] = teamSlots[pendingSlotIdx];
        teamSlots[pendingSlotIdx] = tmp;
      }
    }
    refreshSlots(); refreshCodex();
  }
  if (mode === 'codex-pending') {
    const mon = hitCodexCard(pos.x, pos.y);
    if (mon) onCodexClick(mon);
  }
  mode = 'idle'; pendingSlotIdx = -1;
}

function onCodexClick(mon) {
  selectedMonster = mon; refreshDetail();
  const state = codexEntries[mon.id];
  if (state !== 'unlocked' || !mon.actions || teamSlots.some(m => m && m.id === mon.id)) {
    refreshSlots(); refreshCodex(); return;
  }
  const empty = teamSlots.findIndex(s => s === null);
  if (empty >= 0) {
    teamSlots[empty] = { ...mon, actions: mon.actions.map(a => ({ ...a })), stats: { ...mon.stats } };
  }
  refreshSlots(); refreshCodex();
}

// ============================================================
// Public API
// ============================================================

export function initTitle() {
  resetState();
  ct = new PIXI.Container();
  ct.eventMode = 'static';
  ct.hitArea = new PIXI.Rectangle(0, 0, W, H);
  buildBackground();
  buildDetailPanel();
  buildTeamSlots();
  buildCodexPanel();
  buildStartBtn();

  // Remove indicator — on TOP of everything (codex + startOverlay)
  const riBg = new PIXI.Graphics();
  // Full dark overlay covering entire codex + header area
  riBg.rect(0, CODEX_Y, W, H - CODEX_Y).fill({ color: D.bg, alpha: 0.85 });
  // Red tinted zone
  riBg.rect(0, CODEX_Y, W, H - CODEX_Y).fill({ color: D.red, alpha: 0.12 });
  // Neon red border at top
  riBg.moveTo(0, CODEX_Y).lineTo(W, CODEX_Y).stroke({ color: D.red, width: 2, alpha: 0.6 });
  removeIndicator.addChild(riBg);
  // Center box
  const riCy = CODEX_Y + (H - CODEX_Y) / 2;
  removeIndicator.addChild(new PIXI.Graphics()
    .roundRect(W / 2 - 120, riCy - 36, 240, 72, 16)
    .fill({ color: D.red, alpha: 0.12 }).stroke({ color: D.red, width: 1.5, alpha: 0.5 }));
  const riIcon = lbl('✕', 16, D.red, true);
  riIcon.anchor = { x: 0.5, y: 0.5 }; riIcon.x = W / 2; riIcon.y = riCy - 10;
  removeIndicator.addChild(riIcon);
  const riTxt = lbl('팀에서 제거', 9, D.red, true);
  riTxt.anchor = { x: 0.5, y: 0.5 }; riTxt.x = W / 2; riTxt.y = riCy + 16;
  removeIndicator.addChild(riTxt);
  ct.addChild(removeIndicator);

  ct.on('pointerdown', onPointerDown);
  ct.on('pointermove', onPointerMove);
  ct.on('pointerup', onPointerUp);
  ct.on('pointerupoutside', onPointerUp);
  ct.getSelectedTeam = () => teamSlots.filter(Boolean).map(m => m.id);
  return ct;
}

export function resetTitle() {
  resetState(); refreshDetail(); refreshSlots(); refreshCodex();
}
