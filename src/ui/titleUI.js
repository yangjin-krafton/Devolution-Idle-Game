// ============================================================
// Title / Team Formation Screen — Dark/Neon style (matches in-game)
// ============================================================

import { W, H, C, S, hex, lbl, cuteBtn, star, addSparkles } from './theme.js';
import { D, darkCard, neonBadge } from './theme-dark.js';
import { monster } from './sprites.js';
import { ALLY_MONSTERS, ENEMY_MONSTERS, STARTER_IDS, AXIS_LABEL, ALL_MONSTERS, ALL_CODEX_ENTRIES } from '../data/index.js';
import { PERSONALITY_LABEL } from '../monsterRegistry.js';
import { buildSkillCard } from './skillCard.js';

// ---- Layout ----
const PAD = 14;
const DETAIL_Y = 8, DETAIL_H = 280;
const SLOTS_Y = DETAIL_Y + DETAIL_H + 8;
const SLOT_W = 128, SLOT_H = 105, SLOT_GAP = 16;
const SLOT_LEFT = Math.round((W - (SLOT_W * 3 + SLOT_GAP * 2)) / 2);
const MAIN_SLOTS_Y = SLOTS_Y + 24;
const CODEX_Y = MAIN_SLOTS_Y + SLOT_H + 8;
const CODEX_HEADER_H = 30;
const CODEX_FILTER_H = 46;
const CODEX_GRID_Y = CODEX_Y + CODEX_HEADER_H + CODEX_FILTER_H;
const CODEX_VISIBLE_H = H - CODEX_GRID_Y;
const CODEX_CARD_W = 95, CODEX_CARD_H = 105, CODEX_COLS = 4, CODEX_GAP = 12;
const CODEX_LEFT = Math.round((W - (CODEX_CARD_W * CODEX_COLS + CODEX_GAP * (CODEX_COLS - 1))) / 2);

// ---- State ----
let teamSlots = [null, null, null];
let selectedMonster = null;
let codexEntries = {};
let mode = 'idle';
let pendingSlotIdx = -1;
let startPos = { x: 0, y: 0 };
let dragSprite = null;
const DRAG_THRESHOLD = 8;
let scrollOffset = 0, maxScroll = 0, scrollStartOffset = 0;

// ---- Codex filter/sort state ----
let codexFilter = 'all'; // 'all' | 'wild' | 'devo1' | 'devo2' | family sourceId
let codexSort = 'default'; // 'default' | 'name' | 'family'
let filteredList = [];     // cached for hit testing

// Family name lookup (24 families)
const FAMILY_NAMES = {};
ALL_MONSTERS.forEach(m => { FAMILY_NAMES[m.id] = m.wild.name; });

// ---- UI refs ----
let ct, detailBody, slotGfx = [], codexContent, codexMask;
let startOverlay, startBtnRef, removeIndicator;
let slotsHeaderLabel, filterBarContainer;

// ---- Helpers ----

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
  }
  // 'default' = original data order (no sort)

  return all;
}

// ---- State ----
function resetState() {
  teamSlots = [null, null, null];
  selectedMonster = null; scrollOffset = 0; mode = 'idle';
  codexFilter = 'all'; codexSort = 'default'; filteredList = [];
  codexEntries = {};
  // All 232 monsters unlocked
  ALL_CODEX_ENTRIES.forEach(m => { codexEntries[m.id] = 'unlocked'; });
}

function slotPos(i) {
  return { x: SLOT_LEFT + i * (SLOT_W + SLOT_GAP), y: MAIN_SLOTS_Y };
}
function hitSlot(px, py) {
  for (let i = 0; i < 3; i++) {
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

// ---- Detail: 3-section layout (Stats / Skills / Lineage) ----

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

// ---- Lineage helpers ----

function findMonsterFamily(mon) {
  // Find the ALL_MONSTERS entry this mon belongs to
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

  // Section label
  detailBody.addChild(new PIXI.Graphics()
    .moveTo(x, y).lineTo(x + pw, y).stroke({ color: D.sep, width: 0.5, alpha: 0.3 }));
  const secLabel = lbl('퇴화 족보', 5, D.dim, true);
  secLabel.x = x + 4; secLabel.y = y + 2;
  detailBody.addChild(secLabel);

  const rowY = y + 16;
  const sprSize = 32;
  const nodeW = 44;
  const arrowW = 16;

  // Collect lineage nodes: wild → devo1(s that relate) → devo2(s that relate)
  let nodes = [];

  if (stage === 'wild') {
    // wild(self) → show first few devo1
    nodes.push({ entry: family.wild, current: true, label: '야생' });
    family.devo1.slice(0, 3).forEach(d => nodes.push({ entry: d, current: false, label: '1차' }));
  } else if (stage === 'devo1') {
    // wild → this devo1(highlighted) → devo2 children
    nodes.push({ entry: family.wild, current: false, label: '야생' });
    nodes.push({ entry: info.self, current: true, label: '1차' });
    const children = family.devo2.filter(d => d.parentDevo1 === mon.id);
    children.slice(0, 2).forEach(d => nodes.push({ entry: d, current: false, label: '2차' }));
  } else {
    // devo2: wild → parent devo1 → this devo2(highlighted)
    nodes.push({ entry: family.wild, current: false, label: '야생' });
    const parent = family.devo1.find(d => d.id === info.self.parentDevo1);
    if (parent) nodes.push({ entry: parent, current: false, label: '1차' });
    nodes.push({ entry: info.self, current: true, label: '2차' });
  }

  // Calculate total width and center
  const totalW = nodes.length * nodeW + (nodes.length - 1) * arrowW;
  let nx = x + Math.max(0, (pw - totalW) / 2);

  nodes.forEach((node, i) => {
    const cx = nx + nodeW / 2;
    const cy = rowY + (h - 16) / 2;
    const discovered = codexEntries[node.entry.id] === 'unlocked';

    // Node background
    const bgAlpha = node.current ? 0.12 : 0.04;
    const bgColor = node.current ? D.neon : D.dim;
    detailBody.addChild(new PIXI.Graphics()
      .roundRect(nx, rowY, nodeW, h - 18, 8)
      .fill({ color: bgColor, alpha: bgAlpha })
      .stroke({ color: node.current ? D.neon : D.sep, width: node.current ? 1.5 : 0.5, alpha: node.current ? 0.6 : 0.3 }));

    // Sprite or silhouette
    const spr = monster(sprSize, node.entry.img);
    spr.x = cx; spr.y = cy - 2;
    if (!discovered) {
      spr.alpha = 0.3;
      if (spr.children[0]) spr.children[0].tint = 0x222233;
    }
    detailBody.addChild(spr);

    // Name or ???
    const nameT = lbl(discovered ? node.entry.name : '???', 4.5, discovered ? (node.current ? D.neon : D.text) : D.dimmer, node.current);
    nameT.anchor = { x: 0.5, y: 0 }; nameT.x = cx; nameT.y = cy + sprSize / 2 + 1;
    detailBody.addChild(nameT);

    // Stage label
    const stageT = lbl(node.label, 4, D.dimmer);
    stageT.anchor = { x: 0.5, y: 0 }; stageT.x = cx; stageT.y = rowY + 1;
    detailBody.addChild(stageT);

    nx += nodeW;

    // Arrow between nodes
    if (i < nodes.length - 1) {
      const arrowMid = nx + arrowW / 2;
      const arrowY = cy;
      detailBody.addChild(new PIXI.Graphics()
        .moveTo(arrowMid - 5, arrowY).lineTo(arrowMid + 3, arrowY)
        .stroke({ color: D.dim, width: 1, alpha: 0.4 }));
      // Arrow head
      detailBody.addChild(new PIXI.Graphics()
        .moveTo(arrowMid + 1, arrowY - 3).lineTo(arrowMid + 4, arrowY).lineTo(arrowMid + 1, arrowY + 3)
        .stroke({ color: D.dim, width: 1, alpha: 0.4 }));
      nx += arrowW;
    }
  });
}

// ---- Main render ----

function renderPageInfo(pw, mon) {
  const contentH = DETAIL_H;
  const gap = 4;
  const LINEAGE_H = 90;

  // ══ ALLY MONSTER ══
  if (mon.actions) {
    // --- 1) Name bar ---
    const nameT = lbl(mon.name, 11, D.text, true); nameT.x = 2; nameT.y = 2;
    detailBody.addChild(nameT);

    const descT = lbl(mon.desc || '', 7, D.dim);
    descT.x = 2; descT.y = 28;
    detailBody.addChild(descT);

    // --- 2) Lineage ---
    const lineY = 46 + gap;
    drawLineage(0, lineY, pw, LINEAGE_H, mon);

    // --- 3) Skill cards ---
    const skillY = lineY + LINEAGE_H + gap;
    const skillH = contentH - skillY;
    drawSkillCards(0, skillY, pw, skillH, mon.actions);

  } else if (!mon.actions) {
    drawLineage(0, 0, pw, LINEAGE_H, mon);
    drawSkillCards(0, LINEAGE_H + gap, pw, contentH - LINEAGE_H - gap, mon.actions);
  }

  // ══ Enemy: no skills → show enemy info + lineage ══
  if (!mon.actions) {
    // Name + desc
    const nameT = lbl(mon.name, 11, D.text, true); nameT.x = 2; nameT.y = 2;
    detailBody.addChild(nameT);

    const descT = lbl(mon.desc || '', 7, D.dim);
    descT.x = 2; descT.y = 28;
    detailBody.addChild(descT);

    // Enemy info table
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

    const tableY = 46;
    const tableH = 42;
    drawTable(0, tableY, pw, tableH, headers, row, colors);

    // Lineage (middle)
    const lineY = tableY + tableH + gap;
    drawLineage(0, lineY, pw, LINEAGE_H, mon);
  }
}

// ---- Team Slots ----

function buildTeamSlots() {
  const mainHdr = new PIXI.Container(); mainHdr.y = SLOTS_Y;
  mainHdr.addChild(Object.assign(lbl('모험 팀', 9, D.neon, true), { x: SLOT_LEFT }));
  mainHdr.addChild(new PIXI.Graphics()
    .moveTo(SLOT_LEFT + 80, 10).lineTo(W - SLOT_LEFT, 10).stroke({ color: D.neon, width: 0.5, alpha: 0.3 }));
  slotsHeaderLabel = lbl('0/3', 6, D.dim);
  slotsHeaderLabel.x = W - SLOT_LEFT - 28; slotsHeaderLabel.y = 2;
  mainHdr.addChild(slotsHeaderLabel);
  ct.addChild(mainHdr);

  slotGfx = [];
  for (let i = 0; i < 3; i++) {
    const c = new PIXI.Container();
    const p = slotPos(i); c.x = p.x; c.y = p.y;
    ct.addChild(c); slotGfx.push(c);
  }

  // Remove indicator — built here but added to ct AFTER codex & startOverlay (see initTitle)
  removeIndicator = new PIXI.Container(); removeIndicator.visible = false;

  refreshSlots();
}

function refreshSlots() {
  let count = 0;
  for (let i = 0; i < 3; i++) {
    const c = slotGfx[i]; c.removeChildren();
    const mon = teamSlots[i];
    const sel = selectedMonster && mon && selectedMonster.id === mon.id;
    if (mon) count++;

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

    // Sprite backdrop
    c.addChild(new PIXI.Graphics().circle(SLOT_W / 2, 42, 32).fill({ color: D.neon, alpha: 0.06 }));
    const spr = monster(72, mon.img); spr.x = SLOT_W / 2; spr.y = 42; c.addChild(spr);

    // Name
    const nm = lbl(mon.name, 6.5, D.text, true);
    nm.anchor = { x: 0.5, y: 0 }; nm.x = SLOT_W / 2; nm.y = SLOT_H - 24; c.addChild(nm);

    // Grip handle (⋮⋮) — drag affordance
    const grip = new PIXI.Graphics();
    const gx = SLOT_W - 14, gy = SLOT_H / 2 - 10;
    for (let row = 0; row < 3; row++) {
      grip.circle(gx, gy + row * 7, 1.5).fill({ color: D.dim, alpha: 0.5 });
      grip.circle(gx + 6, gy + row * 7, 1.5).fill({ color: D.dim, alpha: 0.5 });
    }
    c.addChild(grip);
  }

  if (slotsHeaderLabel) slotsHeaderLabel.text = `${count}/3`;
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

  // ── Row 1: [필터] type pills ─── [정렬] sort pills ──
  const typeFilters = [
    { key: 'all',   label: '전체' },
    { key: 'wild',  label: '야생' },
    { key: 'devo1', label: '1차' },
    { key: 'devo2', label: '2차' },
  ];
  const sorts = [
    { key: 'default', label: '기본' },
    { key: 'name',    label: '이름' },
    { key: 'family',  label: '종족' },
  ];

  let x = PAD;

  // "필터" section label
  const filterLabel = lbl('필터', 4.5, D.dimmer, true);
  filterLabel.x = x; filterLabel.y = 5;
  filterBarContainer.addChild(filterLabel);
  x += 28;

  typeFilters.forEach(f => {
    const pill = filterPill(f.label, codexFilter === f.key, D.neon);
    pill.x = x; pill.y = 2;
    pill.eventMode = 'static'; pill.cursor = 'pointer';
    pill.on('pointerdown', (e) => {
      e.stopPropagation();
      codexFilter = f.key;
      scrollOffset = 0;
      buildFilterBar();
      refreshCodex();
    });
    filterBarContainer.addChild(pill);
    x += (pill._pillWidth || 40) + 3;
  });

  // Vertical separator line
  x += 4;
  filterBarContainer.addChild(new PIXI.Graphics()
    .moveTo(x, 3).lineTo(x, 17).stroke({ color: D.sep, width: 1, alpha: 0.4 }));
  x += 8;

  // "정렬" section label
  const sortLabel = lbl('정렬', 4.5, D.dimmer, true);
  sortLabel.x = x; sortLabel.y = 5;
  filterBarContainer.addChild(sortLabel);
  x += 28;

  sorts.forEach(s => {
    const isActive = codexSort === s.key;
    const pill = filterPill(s.label + (isActive ? ' ▼' : ''), isActive, 0x7799ff);
    pill.x = x; pill.y = 2;
    pill.eventMode = 'static'; pill.cursor = 'pointer';
    pill.on('pointerdown', (e) => {
      e.stopPropagation();
      codexSort = s.key;
      scrollOffset = 0;
      buildFilterBar();
      refreshCodex();
    });
    filterBarContainer.addChild(pill);
    x += (pill._pillWidth || 40) + 3;
  });

  // ── Row 2: 24 family pills with "종족" label ──
  const famRow = new PIXI.Container();
  famRow.y = 22;

  const famLabel = lbl('종족', 4.5, D.dimmer, true);
  famLabel.x = PAD; famLabel.y = 3;
  famRow.addChild(famLabel);

  let fx = PAD + 28;
  ALL_MONSTERS.forEach(m => {
    const isActive = codexFilter === 'fam:' + m.id;
    const shortName = m.wild.name.slice(0, 3);
    const pill = filterPill(shortName, isActive, 0xff8844);
    pill.x = fx; pill.y = 0;
    pill.eventMode = 'static'; pill.cursor = 'pointer';
    pill.on('pointerdown', (e) => {
      e.stopPropagation();
      codexFilter = isActive ? 'all' : 'fam:' + m.id;
      scrollOffset = 0;
      buildFilterBar();
      refreshCodex();
    });
    famRow.addChild(pill);
    fx += (pill._pillWidth || 30) + 2;
  });
  filterBarContainer.addChild(famRow);
}

function refreshCodex() {
  codexContent.removeChildren();
  filteredList = getFilteredMonsters();
  const all = filteredList;
  const teamIds = new Set(teamSlots.filter(Boolean).map(m => m.id));
  let unlockedCount = 0;

  // Count total unlocked (from full codex, not filtered)
  ALL_CODEX_ENTRIES.forEach(m => {
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
        .circle(CODEX_CARD_W / 2, 44, 26).fill({ color: D.dimmer, alpha: 0.3 })
        .stroke({ color: D.dimmer, width: 1, alpha: 0.3 }));
      const q = lbl('???', 7, D.dimmer); q.anchor = { x: 0.5, y: 0 };
      q.x = CODEX_CARD_W / 2; q.y = CODEX_CARD_H - 22; card.addChild(q);

    } else if (state === 'seen') {
      card.addChild(darkCard(CODEX_CARD_W, CODEX_CARD_H, 12, D.bgAlt, D.sep, false));
      const s = monster(56, mon.img); s.x = CODEX_CARD_W / 2; s.y = 44; s.alpha = 0.25;
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
        .circle(CODEX_CARD_W / 2, 44, 26).fill({ color: D.neon, alpha: inTeam ? 0.04 : 0.07 }));
      const s = monster(56, mon.img); s.x = CODEX_CARD_W / 2; s.y = 44;
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

  const totalAll = ALL_CODEX_ENTRIES.length;
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

  const hint = lbl('모험 준비 완료!', 10, D.neon, true);
  hint.anchor = { x: 0.5, y: 0.5 }; hint.x = W / 2; hint.y = cy - 35;
  startOverlay.addChild(hint);

  // Neon-styled start button
  startBtnRef = cuteBtn(W / 2 - 180, cy - 5, 180, 48, '▶ 모험 시작', D.neon, D.bg);
  startOverlay.addChild(startBtnRef);

  const sub = lbl('1마리 편성 완료', 6, D.dim);
  sub.anchor = { x: 0.5, y: 0 }; sub.x = W / 2; sub.y = cy + 50;
  startOverlay.addChild(sub);
  startOverlay._subLabel = sub;

  ct.addChild(startOverlay);
  ct._startBtn = startBtnRef;
}

function refreshStartBtn() {
  if (!startOverlay) return;
  const count = teamSlots.filter(Boolean).length;
  startOverlay.visible = count >= 3;
  if (count >= 3 && startOverlay._subLabel) {
    startOverlay._subLabel.text = `${count}마리 편성 완료`;
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
    if (pos.y > CODEX_Y) { teamSlots[pendingSlotIdx] = null; selectedMonster = null; }
    else {
      const target = hitSlot(pos.x, pos.y);
      if (target >= 0 && target !== pendingSlotIdx) {
        const tmp = teamSlots[target];
        teamSlots[target] = teamSlots[pendingSlotIdx];
        teamSlots[pendingSlotIdx] = tmp;
      }
    }
    refreshDetail(); refreshSlots(); refreshCodex();
  }
  if (mode === 'codex-pending') {
    const mon = hitCodexCard(pos.x, pos.y);
    if (mon) onCodexClick(mon);
  }
  mode = 'idle'; pendingSlotIdx = -1;
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
    // Bounce ease: overshoot up then settle
    const ease = t < 0.5
      ? 1 - Math.pow(1 - t * 2, 3) // rise
      : 1 - Math.abs(Math.sin((t - 0.5) * Math.PI * 2)) * (1 - t); // bounce back
    c.y = originY - (1 - t) * 8 * (1 - ease);
    c.scale.set(1 + (1 - t) * 0.04);
    if (t < 1) requestAnimationFrame(tick);
    else { c.y = originY; c.scale.set(1); }
  }
  requestAnimationFrame(tick);
}

function onCodexClick(mon) {
  selectedMonster = mon; refreshDetail();
  const state = codexEntries[mon.id];
  if (state !== 'unlocked' || !mon.actions || teamSlots.some(m => m && m.id === mon.id)) {
    refreshSlots(); refreshCodex(); return;
  }
  const empty = teamSlots.findIndex(s => s === null);
  if (empty >= 0) {
    teamSlots[empty] = { ...mon, actions: mon.actions.map(a => ({ ...a })) };
    refreshSlots(); refreshCodex();
    // Pulse bounce on newly placed slot
    pulseSlot(empty);
  } else {
    refreshSlots(); refreshCodex();
  }
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
