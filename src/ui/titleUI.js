// ============================================================
// Title / Team Formation Screen — Dark/Neon style (matches in-game)
// ============================================================

import { W, H, C, S, hex, lbl, cuteBtn, star, addSparkles } from './theme.js';
import { monster } from './sprites.js';
import { ALLY_MONSTERS, ENEMY_MONSTERS, STARTER_IDS } from '../data/index.js';
import { PERSONALITY_LABEL } from '../monsterRegistry.js';
import { buildSkillCard } from './skillCard.js';

// ---- Dark palette (from actionPanelUI) ----
const D = {
  bg:      0x1a1a2e,  bgAlt:   0x222238,  card:    0x262640,  cardHi:  0x2e2e48,
  neon:    0x00d4aa,   neonDim: 0x009977,
  red:     0xff6b6b,   redDark: 0xcc4444,
  blue:    0x4dabf7,   blueDark:0x2b7fc4,
  text:    0xddddf0,   dim:     0x8888aa,  dimmer:  0x555577,  sep:     0x444466,
  panel:   0x1e1e34,   white:   0xffffff,  black:   0x000000,
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
  codexFilter = 'all'; codexSort = 'default'; filteredList = [];
  codexEntries = {};
  // Only starter monsters are unlocked; rest are locked
  ALLY_MONSTERS.forEach(m => {
    codexEntries[m.id] = STARTER_IDS.includes(m.id) ? 'unlocked' : 'locked';
  });
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
    h.anchor = { x: 0.5, y: 0.5 }; h.x = pw / 2; h.y = DETAIL_H / 2;
    detailBody.addChild(h);
    return;
  }
  const unlocked = codexEntries[mon.id] === 'unlocked';

  if (!unlocked) {
    const spr = monster(60, mon.img); spr.x = pw / 2; spr.y = 50;
    if (spr.children[0]) spr.children[0].tint = 0x333344;
    detailBody.addChild(spr);
    detailBody.addChild(Object.assign(lbl('???', 16, D.dimmer, true), { x: pw / 2 - 20, y: 90 }));
    detailBody.addChild(Object.assign(lbl('영입하면 정보가 공개됩니다', 8, D.dimmer), { x: pw / 2 - 80, y: 120 }));
    return;
  }

  renderPageInfo(pw, mon);
}

// ---- Detail: Stats table + Skills table (single page) ----
function renderPageInfo(pw, mon) {
  const contentH = DETAIL_H;
  const gap = 4;

  // ══ Helper: draw a grid table ══
  function drawTable(x, y, w, h, headers, dataRows, colColors) {
    const cols = headers.length;
    const colW = w / cols;
    const rowCount = dataRows.length + 1; // +1 header
    const rowH = h / rowCount;

    // Outer border
    detailBody.addChild(new PIXI.Graphics()
      .roundRect(x, y, w, h, 6).stroke({ color: D.sep, width: 1, alpha: 0.3 }));

    // Header bg
    detailBody.addChild(new PIXI.Graphics()
      .roundRect(x, y, w, rowH, 6).fill({ color: D.sep, alpha: 0.15 }));

    // Header–body separator
    detailBody.addChild(new PIXI.Graphics()
      .moveTo(x + 1, y + rowH).lineTo(x + w - 1, y + rowH)
      .stroke({ color: D.sep, width: 0.5, alpha: 0.3 }));

    // Column separators
    for (let i = 1; i < cols; i++) {
      detailBody.addChild(new PIXI.Graphics()
        .moveTo(x + colW * i, y + 3).lineTo(x + colW * i, y + h - 3)
        .stroke({ color: D.sep, width: 0.5, alpha: 0.2 }));
    }

    // Headers
    headers.forEach((txt, i) => {
      const t = lbl(txt, 6, colColors?.[i] || D.dim, true);
      t.anchor = { x: 0.5, y: 0.5 };
      t.x = x + colW * i + colW / 2; t.y = y + rowH / 2;
      detailBody.addChild(t);
    });

    // Data rows
    dataRows.forEach((row, ri) => {
      const ry = y + rowH * (ri + 1);
      // Row separator (between data rows)
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

  // ══ Helper: draw skill cards (action panel style) ══
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

  // ══ TOP: Stats Table ══
  if (mon.actions && mon.stats) {
    const STAT = { gentleness: '온화', empathy: '공감', resilience: '인내', agility: '민첩' };
    const SCOL = { gentleness: D.neon, empathy: D.blue, resilience: 0xffaa60, agility: 0x88ddbb };
    const statKeys = Object.keys(mon.stats);
    const total = Object.values(mon.stats).reduce((s, v) => s + v, 0);

    const sHeaders = [...statKeys.map(k => STAT[k]), '총합'];
    const sColors = [...statKeys.map(k => SCOL[k]), D.dim];
    const sRow = [
      [...statKeys.map(k => ({ text: String(mon.stats[k]), size: 9, color: D.text, bold: true })),
       { text: String(total), size: 9, color: D.text, bold: true }]
    ];

    const statH = Math.round(contentH * 0.42);
    drawTable(0, 0, pw, statH, sHeaders, sRow, sColors);

    // ══ BOT: Skill Cards (3 columns) ══
    const skillY = statH + gap;
    const skillH = contentH - skillY;
    drawSkillCards(0, skillY, pw, skillH, mon.actions);
  } else if (mon.actions) {
    // No stats, skills only
    drawSkillCards(0, 0, pw, contentH, mon.actions);
  }

  // ══ Enemy: no skills → show enemy info table ══
  if (!mon.actions) {
    const sensory = (mon.sensoryType || []).map(s => AXIS_LABEL[s] || s).join(', ');
    const pers = PERSONALITY_LABEL[mon.personality] || mon.personality || '';

    const headers = ['감각', '성격', '순화', '도주'];
    const colors = [D.dimmer, D.dimmer, D.neon, D.red];
    const row = [[
      { text: sensory, size: 7, color: D.text, bold: true },
      { text: pers, size: 7, color: D.text, bold: true },
      { text: String(mon.tamingThreshold || '-'), size: 9, color: D.neon, bold: true },
      { text: String(mon.escapeThreshold || '-'), size: 9, color: D.red, bold: true },
    ]];

    drawTable(0, 0, pw, contentH, headers, row, colors);
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

  const sub = lbl('주전 3 + 후보 0/3 준비 완료', 6, D.dim);
  sub.anchor = { x: 0.5, y: 0 }; sub.x = W / 2; sub.y = cy + 50;
  startOverlay.addChild(sub);
  startOverlay._subLabel = sub;

  ct.addChild(startOverlay);
  ct._startBtn = startBtnRef;
}

function refreshStartBtn() {
  if (!startOverlay) return;
  // Show start button when main team (slots 0-2) is full
  const mainFull = teamSlots[0] !== null && teamSlots[1] !== null && teamSlots[2] !== null;
  startOverlay.visible = mainFull;
  if (mainFull && startOverlay._subLabel) {
    const benchCount = [teamSlots[3], teamSlots[4], teamSlots[5]].filter(Boolean).length;
    startOverlay._subLabel.text = `주전 3 + 후보 ${benchCount}/3 준비 완료`;
  }
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
