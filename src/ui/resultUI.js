// ============================================================
// Result Screen — Messenger-feed style card UI (Dark/Neon)
// ============================================================

import { W, H, S, lbl, cuteBtn } from './theme.js';
import { D, feedCard, neonBadge, statBar } from './theme-dark.js';
import { monster, egg, allyColor } from './sprites.js';
import { buildSkillCard } from './skillCard.js';

// ---- Layout ----
const PAD = 14;
const HEADER_H = 44;
const FOOTER_H = 64;
const FEED_TOP = HEADER_H;
const FEED_BOTTOM = H - FOOTER_H;
const FEED_H = FEED_BOTTOM - FEED_TOP;
const CARD_W = W - PAD * 2;
const CARD_GAP = 12;

const STAT_LABEL = { gentleness: '온화', empathy: '공감', resilience: '인내', agility: '민첩' };
const STAT_COLOR = { gentleness: D.neon, empathy: D.blue, resilience: 0xffaa60, agility: 0x88ddbb };

// ---- State ----
let ct, feedContainer, feedMask, footerBtn;
let cardQueue = [];
let currentCardIdx = 0;
let feedY = 0; // total stacked height in feed
let scrollOffset = 0, maxScroll = 0;
let scrollMode = 'idle', scrollStartY = 0, scrollStartOffset = 0;
let animating = false;
let waitingForTap = false; // true = card finished, waiting for user tap to show next
let animGeneration = 0; // incremented to cancel stale rAF loops
let onNextCallback = null;
let onSkillSwapCallback = null;
let allCardsShown = false;

// ============================================================
// Init — called once
// ============================================================

export function initResult() {
  ct = new PIXI.Container();
  ct.eventMode = 'static';
  ct.hitArea = new PIXI.Rectangle(0, 0, W, H);

  // Background with subtle grid dots
  const bg = new PIXI.Graphics();
  bg.rect(0, 0, W, H).fill({ color: D.bg });
  ct.addChild(bg);
  const dots = new PIXI.Graphics();
  for (let dx = 30; dx < W; dx += 50) {
    for (let dy = FEED_TOP + 20; dy < FEED_BOTTOM; dy += 50) {
      dots.circle(dx, dy, 1).fill({ color: D.dim, alpha: 0.06 });
    }
  }
  ct.addChild(dots);

  // Header
  const hdr = new PIXI.Graphics();
  hdr.rect(0, 0, W, HEADER_H).fill({ color: D.panel });
  // Neon accent line top
  hdr.roundRect(0, 0, W, 3, 0).fill({ color: D.neon, alpha: 0.3 });
  // Bottom border
  hdr.moveTo(0, HEADER_H).lineTo(W, HEADER_H).stroke({ color: D.neon, width: 1, alpha: 0.2 });
  ct.addChild(hdr);
  const title = lbl('전투 결과', 10, D.neon, true);
  title.anchor = { x: 0.5, y: 0.5 }; title.x = W / 2; title.y = HEADER_H / 2;
  ct.addChild(title);

  // Feed area
  feedMask = new PIXI.Graphics().rect(0, FEED_TOP, W, FEED_H).fill({ color: 0xffffff });
  ct.addChild(feedMask);
  feedContainer = new PIXI.Container();
  feedContainer.y = FEED_TOP;
  feedContainer.mask = feedMask;
  ct.addChild(feedContainer);

  // Footer
  const ftr = new PIXI.Graphics();
  ftr.rect(0, FEED_BOTTOM, W, FOOTER_H).fill({ color: D.panel });
  ftr.moveTo(0, FEED_BOTTOM).lineTo(W, FEED_BOTTOM).stroke({ color: D.neon, width: 1, alpha: 0.15 });
  ct.addChild(ftr);

  // "탭하여 계속" hint centered above button
  const tapHint = lbl('화면을 탭하세요', 6, D.dimmer);
  tapHint.anchor = { x: 0.5, y: 0 }; tapHint.x = W / 2; tapHint.y = FEED_BOTTOM + 4;
  ct.addChild(tapHint);

  footerBtn = cuteBtn(W / 2 - 180, FEED_BOTTOM + 16, 180, 40, '\u25B6 계속', D.neon, D.bg);
  footerBtn.alpha = 0.3;
  ct.addChild(footerBtn);

  // Pointer events
  ct.on('pointerdown', onPointerDown);
  ct.on('pointermove', onPointerMove);
  ct.on('pointerup', onPointerUp);
  ct.on('pointerupoutside', onPointerUp);

  return ct;
}

// ============================================================
// Render — called each battle end
// ============================================================

export function renderResult(rewards, onNext, onSkillSwap) {
  // Reset
  feedContainer.removeChildren();
  cardQueue = [];
  currentCardIdx = 0;
  feedY = CARD_GAP;
  scrollOffset = 0;
  maxScroll = 0;
  animating = false;
  waitingForTap = false;
  allCardsShown = false;
  onNextCallback = onNext;
  onSkillSwapCallback = onSkillSwap || null;
  footerBtn.alpha = 0.3;
  footerBtn.removeAllListeners();
  applyScroll();

  // Build card queue with error protection per card
  cardQueue.push(buildBannerCard(rewards.state, rewards.enemy));

  if (rewards.state !== 'defeat') {
    for (const ally of rewards.allies) {
      try {
        cardQueue.push(buildXPCard(ally));
        const lvUps = ally.levelUps || [];
        for (const lv of lvUps) {
          cardQueue.push(buildLevelUpCard(ally, lv));
          if (lv.newSkills && lv.newSkills.length > 0) {
            for (const skill of lv.newSkills) {
              cardQueue.push(buildSkillAcquireCard(ally, skill));
            }
          }
        }
        // Backwards compat: old format
        if (lvUps.length === 0 && ally.leveledUp) {
          cardQueue.push(buildLevelUpCard(ally, { from: ally.levelBefore, to: ally.levelAfter, statChanges: ally.statChanges || {}, newSkills: ally.newSkills || [] }));
          for (const skill of (ally.newSkills || [])) { cardQueue.push(buildSkillAcquireCard(ally, skill)); }
        }
        if (ally.enteredEgg) {
          cardQueue.push(buildEggCard(ally));
        }
      } catch (e) {
        console.error('[resultUI] card build error for', ally.name, e);
      }
    }
  }

  console.log('[resultUI] cardQueue:', cardQueue.length, 'cards | allies:', rewards.allies.length,
    '|', rewards.allies.map(a => a.name + ' Lv' + a.levelBefore + '→' + a.levelAfter + ' lvUps:' + (a.levelUps||[]).length).join(', '));

  // Show first card (banner) automatically
  showNextCard();
}

// ============================================================
// Card Builders
// ============================================================

// ---- Shared decorative helpers ----

function glowCircle(x, y, r, color, alpha) {
  const g = new PIXI.Graphics();
  g.circle(x, y, r).fill({ color, alpha: alpha || 0.08 });
  g.circle(x, y, r * 0.6).fill({ color, alpha: (alpha || 0.08) * 0.7 });
  return g;
}

function sep(x1, x2, y, color) {
  return new PIXI.Graphics()
    .moveTo(x1, y).lineTo(x2, y)
    .stroke({ color: color || D.sep, width: 0.5, alpha: 0.35 });
}

// ---- Banner Card ----

function buildBannerCard(state, enemy) {
  const h = state === 'defeat' ? 120 : 170;
  const card = new PIXI.Container();
  const accent = state === 'victory' ? D.neon : state === 'escaped' ? D.orange : D.red;
  card.addChild(feedCard(CARD_W, h, accent));

  if (state === 'victory') {
    // Layered glow behind sprite
    card.addChild(glowCircle(CARD_W / 2, 52, 48, D.neon, 0.07));
    card.addChild(glowCircle(CARD_W / 2, 52, 28, D.neon, 0.05));
    // Decorative ring
    card.addChild(new PIXI.Graphics()
      .circle(CARD_W / 2, 52, 44).stroke({ color: D.neon, width: 1, alpha: 0.08 }));

    const spr = monster(80, enemy.img || null);
    spr.x = CARD_W / 2; spr.y = 52;
    card.addChild(spr);

    // Orbiting hearts (varied sizes & colors)
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const heart = lbl('\u2665', 7 + (i % 3) * 2, i % 2 === 0 ? D.neon : D.blue);
      heart.anchor = { x: 0.5, y: 0.5 };
      heart.alpha = 0.3 + (i % 3) * 0.12;
      heart.x = CARD_W / 2 + Math.cos(angle) * (50 + i * 4);
      heart.y = 52 + Math.sin(angle) * (30 + i * 3);
      card.addChild(heart);
    }

    // Corner sparkle dots
    [[24, 16], [CARD_W - 24, 20], [40, 98], [CARD_W - 36, 94]].forEach(([sx, sy]) => {
      card.addChild(new PIXI.Graphics().circle(sx, sy, 1.5).fill({ color: D.neon, alpha: 0.2 }));
    });

    card.addChild(sep(24, CARD_W - 24, 102, accent));

    const t = lbl('순화 성공!', 14, D.neon, true);
    t.anchor = { x: 0.5, y: 0 }; t.x = CARD_W / 2; t.y = 110;
    card.addChild(t);
    const sub = lbl((enemy.name || '???') + '을(를) 길들였다!', 8, D.dim);
    sub.anchor = { x: 0.5, y: 0 }; sub.x = CARD_W / 2; sub.y = 140;
    card.addChild(sub);

  } else if (state === 'escaped') {
    card.addChild(glowCircle(CARD_W / 2, 48, 38, D.orange, 0.06));

    const spr = monster(65, enemy.img || null);
    spr.x = CARD_W / 2; spr.y = 48; spr.alpha = 0.35;
    card.addChild(spr);

    // Speed streaks
    for (let i = 0; i < 3; i++) {
      const sy = 34 + i * 14;
      card.addChild(new PIXI.Graphics()
        .moveTo(CARD_W / 2 + 38 + i * 8, sy)
        .lineTo(CARD_W / 2 + 68 + i * 14, sy)
        .stroke({ color: D.orange, width: 1.5, alpha: 0.2 - i * 0.05 }));
    }

    card.addChild(sep(24, CARD_W - 24, 98, D.orange));
    const t = lbl('도주...', 14, D.orange, true);
    t.anchor = { x: 0.5, y: 0 }; t.x = CARD_W / 2; t.y = 106;
    card.addChild(t);
    const sub = lbl((enemy.name || '???') + '이(가) 도망쳤습니다.', 8, D.dim);
    sub.anchor = { x: 0.5, y: 0 }; sub.x = CARD_W / 2; sub.y = 136;
    card.addChild(sub);

  } else {
    // Defeat — somber
    card.addChild(glowCircle(CARD_W / 2, 38, 28, D.red, 0.06));
    const cross = new PIXI.Graphics();
    cross.moveTo(CARD_W / 2 - 12, 26).lineTo(CARD_W / 2 + 12, 50).stroke({ color: D.red, width: 2, alpha: 0.15 });
    cross.moveTo(CARD_W / 2 + 12, 26).lineTo(CARD_W / 2 - 12, 50).stroke({ color: D.red, width: 2, alpha: 0.15 });
    card.addChild(cross);

    card.addChild(sep(24, CARD_W - 24, 62, D.red));
    const t = lbl('전멸', 14, D.red, true);
    t.anchor = { x: 0.5, y: 0 }; t.x = CARD_W / 2; t.y = 70;
    card.addChild(t);
    const sub = lbl('모든 아군이 쓰러졌습니다.', 8, D.dim);
    sub.anchor = { x: 0.5, y: 0 }; sub.x = CARD_W / 2; sub.y = 94;
    card.addChild(sub);
  }

  return { container: card, height: h };
}

// ---- XP Card ----

function buildXPCard(ally) {
  const h = 90;
  const card = new PIXI.Container();
  card.addChild(feedCard(CARD_W, h, D.blue));

  // Sprite backdrop circle
  card.addChild(new PIXI.Graphics().circle(40, 36, 24).fill({ color: D.blue, alpha: 0.06 }));
  card.addChild(new PIXI.Graphics().circle(40, 36, 24).stroke({ color: D.blue, width: 0.5, alpha: 0.1 }));
  const spr = monster(46, ally.img);
  spr.x = 40; spr.y = 36;
  card.addChild(spr);

  // Name
  const name = lbl(ally.name, 9, D.text, true);
  name.x = 74; name.y = 10;
  card.addChild(name);

  // Level badge
  const lvlBadge = neonBadge('Lv.' + ally.levelAfter, D.dim);
  lvlBadge.x = 74 + (ally.name.length * 9 * S) + 6; lvlBadge.y = 13;
  card.addChild(lvlBadge);

  // XP gain badge (top-right)
  const xpBadge = neonBadge('+' + ally.xpGain + ' XP', D.blue);
  xpBadge.x = CARD_W - 72; xpBadge.y = 13;
  card.addChild(xpBadge);

  // Separator
  card.addChild(sep(74, CARD_W - 14, 34));

  // XP bar — fits within card with 16px right margin
  const barX = 74;
  const barY = 42;
  const barH = 12;
  const barW = CARD_W - barX - 16;
  const range = ally.xpNeeded - ally.xpBase;
  const ratioBefore = range > 0 ? Math.min(1, (ally.xpBefore - ally.xpBase) / range) : 0;
  const ratioAfter = range > 0 ? Math.min(1, (ally.xpAfter - ally.xpBase) / range) : 1;

  // Bar track
  card.addChild(new PIXI.Graphics()
    .roundRect(barX, barY, barW, barH, barH / 2).fill({ color: D.sep, alpha: 0.5 }));
  // Inner track shine
  card.addChild(new PIXI.Graphics()
    .roundRect(barX + 0.5, barY + 0.5, barW - 1, barH * 0.35, barH / 2).fill({ color: D.white, alpha: 0.03 }));

  // Fill bar (animated)
  const barFill = new PIXI.Graphics();
  card.addChild(barFill);
  card._barFill = barFill;
  card._barX = barX; card._barY = barY; card._barW = barW; card._barH = barH;
  card._ratioBefore = ratioBefore;
  card._ratioAfter = ally.leveledUp ? 1 : ratioAfter;
  drawBarFill(barFill, barX, barY, barW, barH, ratioBefore);

  // XP text (right-aligned under bar)
  const xpText = lbl(ally.xpAfter + ' / ' + ally.xpNeeded, 6, D.dim);
  xpText.anchor = { x: 1, y: 0 };
  xpText.x = barX + barW; xpText.y = barY + barH + 4;
  card.addChild(xpText);

  // TAP hint (bottom right)
  const hint = lbl('TAP \u25B6', 5, D.dimmer);
  hint.anchor = { x: 1, y: 0 }; hint.x = CARD_W - 14; hint.y = h - 20;
  card.addChild(hint);

  return { container: card, height: h, animate: 'xp', ratioBefore, ratioAfter: card._ratioAfter, barRef: card };
}

function drawBarFill(gfx, x, y, w, h, ratio) {
  gfx.clear();
  if (ratio > 0) {
    const fw = Math.max(h, (w - 1) * Math.min(1, ratio));
    const r = (h - 1) / 2;
    gfx.roundRect(x + 0.5, y + 0.5, fw, h - 1, r).fill({ color: D.blue });
    // Shine highlight
    gfx.roundRect(x + 1, y + 1, fw - 1, (h - 2) * 0.4, r).fill({ color: D.white, alpha: 0.15 });
  }
}

// ---- Level Up Card ----

function buildLevelUpCard(ally, lv) {
  const sc = lv.statChanges || {};
  const stats = Object.keys(sc).filter(k => k !== 'hp');
  const hasHp = !!sc.hp;
  const rowCount = stats.length + (hasHp ? 1 : 0);
  const STAT_Y = 62;
  const h = STAT_Y + 10 + Math.max(rowCount * 28, 70);
  const card = new PIXI.Container();
  card.addChild(feedCard(CARD_W, h, D.neon));

  // Right side: Monster sprite + name
  const SPR_CX = CARD_W - 60;
  const SPR_CY = 32;
  card.addChild(glowCircle(SPR_CX, SPR_CY, 28, D.neon, 0.06));
  card.addChild(new PIXI.Graphics()
    .circle(SPR_CX, SPR_CY, 26).stroke({ color: D.neon, width: 0.5, alpha: 0.1 }));
  const spr = monster(50, ally.img);
  spr.x = SPR_CX; spr.y = SPR_CY;
  card.addChild(spr);
  const nameT = lbl(ally.name, 6, D.dim, true);
  nameT.anchor = { x: 0.5, y: 0 }; nameT.x = SPR_CX; nameT.y = SPR_CY + 28;
  card.addChild(nameT);

  // Left side: Star + title
  const starIcon = lbl('★', 14, D.neon);
  starIcon.x = 14; starIcon.y = 6;
  card.addChild(starIcon);
  const title = lbl('LEVEL UP!', 12, D.neon, true);
  title.x = 40; title.y = 8;
  card.addChild(title);

  // Level badges
  const lvlFrom = neonBadge('Lv.' + lv.from, D.dimmer);
  lvlFrom.x = 16; lvlFrom.y = 38;
  card.addChild(lvlFrom);
  const arrow = lbl('→', 9, D.neon, true);
  arrow.x = 74; arrow.y = 36;
  card.addChild(arrow);
  const lvlTo = neonBadge('Lv.' + lv.to, D.neon);
  lvlTo.x = 96; lvlTo.y = 38;
  card.addChild(lvlTo);

  // Stat section (full width bars)
  card.addChild(sep(14, CARD_W - 14, STAT_Y, D.neon));

  let y = STAT_Y + 10;
  const allStats = [];
  if (hasHp) allStats.push({ label: 'HP', gain: sc.hp, color: D.red });
  stats.forEach(s => allStats.push({
    label: STAT_LABEL[s] || s,
    gain: sc[s],
    color: STAT_COLOR[s] || D.dim,
  }));

  const LABEL_X = 20;
  const BAR_X = 76;
  const BAR_W = CARD_W - BAR_X - 56;

  allStats.forEach(({ label, gain, color }) => {
    const n = lbl(label, 7, D.dim, true);
    n.x = LABEL_X; n.y = y;
    card.addChild(n);

    const maxG = 5;
    const ratio = Math.min(1, gain / maxG);
    card.addChild(new PIXI.Graphics()
      .roundRect(BAR_X, y + 4, BAR_W, 8, 4).fill({ color: D.sep, alpha: 0.3 }));
    if (ratio > 0) {
      const bw = Math.max(8, BAR_W * ratio);
      card.addChild(new PIXI.Graphics()
        .roundRect(BAR_X, y + 4, bw, 8, 4).fill({ color, alpha: 0.55 }));
      card.addChild(new PIXI.Graphics()
        .roundRect(BAR_X + 0.5, y + 4.5, bw - 1, 3.5, 2).fill({ color: D.white, alpha: 0.1 }));
    }

    if (gain > 0) {
      const v = lbl('+' + gain, 8, D.neon, true);
      v.anchor = { x: 1, y: 0 }; v.x = CARD_W - 16; v.y = y;
      card.addChild(v);
    } else {
      const v = lbl('─', 7, D.dimmer);
      v.anchor = { x: 1, y: 0 }; v.x = CARD_W - 16; v.y = y + 1;
      card.addChild(v);
    }
    y += 28;
  });

  return { container: card, height: h };
}

// ---- Skill Acquire Card ----

function buildSkillAcquireCard(ally, skill) {
  const actions = ally.actions || [];
  const newCat = skill.category;
  const SLOT_H = 78; // taller slots for full skill card preview
  const NEW_H = 80;  // new skill preview height (with desc)
  const PROMPT_Y = 36 + NEW_H + 8;
  const slotStartY = PROMPT_Y + 26;
  const h = slotStartY + actions.length * (SLOT_H + 6) + 44;
  const card = new PIXI.Container();
  card.addChild(feedCard(CARD_W, h, D.blue));

  // Glow + Title
  card.addChild(glowCircle(30, 22, 16, D.blue, 0.08));
  const icon = lbl('\u2726', 12, D.blue);
  icon.x = 14; icon.y = 6;
  card.addChild(icon);
  const title = lbl('\uc0c8\ub85c\uc6b4 \uc2a4\ud0ac!', 10, D.blue, true);
  title.x = 38; title.y = 8;
  card.addChild(title);

  // Monster name badge (top-right)
  const nameTag = neonBadge(ally.name, D.dim);
  nameTag.x = CARD_W - (ally.name.length * 5 * S + 14) - 14; nameTag.y = 10;
  card.addChild(nameTag);

  card.addChild(sep(14, CARD_W - 14, 30, D.blue));

  // NEW skill preview (with description)
  const newBadge = neonBadge('NEW', D.neon);
  newBadge.x = 16; newBadge.y = 36;
  card.addChild(newBadge);
  const newPreview = buildSkillCard(skill, CARD_W - 32, NEW_H, { showDesc: true });
  newPreview.x = 16; newPreview.y = 52;
  card.addChild(newPreview);

  // Prompt
  card.addChild(sep(14, CARD_W - 14, PROMPT_Y, D.sep));
  const prompt = lbl('\uad50\uccb4\ud560 \uc2a4\ud0ac\uc744 \uc120\ud0dd\ud558\uc138\uc694', 7, D.dim);
  prompt.anchor = { x: 0.5, y: 0 }; prompt.x = CARD_W / 2; prompt.y = PROMPT_Y + 4;
  card.addChild(prompt);

  // --- Slot state management ---
  card._selectedSlot = -1;
  const slotBgs = [];

  function resetAllSlots() {
    actions.forEach((action, idx) => {
      const sy = slotStartY + idx * (SLOT_H + 6);
      const sameCat = action.category === newCat;
      const bg = slotBgs[idx];
      bg.clear();
      bg.roundRect(16, sy, CARD_W - 32, SLOT_H, 10)
        .fill({ color: D.card })
        .stroke({ color: sameCat ? D.blue : D.sep, width: sameCat ? 1.5 : 0.5, alpha: sameCat ? 0.6 : 0.3 });
    });
    skipBg.clear();
    skipBg.roundRect(CARD_W / 2 - 80, skipY, 160, 32, 16)
      .fill({ color: D.bgAlt, alpha: 0.5 })
      .stroke({ color: D.sep, width: 0.5, alpha: 0.3 });
  }

  function selectSlot(idx) {
    resetAllSlots();
    card._selectedSlot = idx;
    if (idx >= 0) {
      const sy = slotStartY + idx * (SLOT_H + 6);
      slotBgs[idx].clear();
      slotBgs[idx].roundRect(16, sy, CARD_W - 32, SLOT_H, 10)
        .fill({ color: D.neon, alpha: 0.1 }).stroke({ color: D.neon, width: 2 });
      if (onSkillSwapCallback) onSkillSwapCallback(ally.id, idx, skill.key || skill.id);
      prompt.text = actions[idx].name + ' \u2192 ' + skill.name + ' \uad50\uccb4!';
      prompt.style.fill = '#00d4aa';
    } else {
      skipBg.clear();
      skipBg.roundRect(CARD_W / 2 - 80, skipY, 160, 32, 16)
        .fill({ color: D.neon, alpha: 0.08 })
        .stroke({ color: D.neon, width: 1, alpha: 0.3 });
      prompt.text = '\uc2a4\ud0ac \ud480\uc5d0 \ubcf4\uad00\ub428';
      prompt.style.fill = '#8888aa';
    }
    if (!card._resolved) {
      card._resolved = true;
      resolveInteractiveCard();
    }
  }

  // Equipped skill slots — each uses buildSkillCard for full detail
  actions.forEach((action, i) => {
    const sy = slotStartY + i * (SLOT_H + 6);
    const sameCat = action.category === newCat;

    const slotBg = new PIXI.Graphics();
    slotBg.roundRect(16, sy, CARD_W - 32, SLOT_H, 10)
      .fill({ color: D.card })
      .stroke({ color: sameCat ? D.blue : D.sep, width: sameCat ? 1.5 : 0.5, alpha: sameCat ? 0.6 : 0.3 });
    card.addChild(slotBg);
    slotBgs.push(slotBg);

    // Slot number badge
    const numBg = new PIXI.Graphics();
    numBg.roundRect(20, sy + 4, 18, 18, 4)
      .fill({ color: sameCat ? D.blue : D.sep, alpha: 0.2 });
    card.addChild(numBg);
    const num = lbl(String(i + 1), 7, sameCat ? D.blue : D.dimmer, true);
    num.anchor = { x: 0.5, y: 0.5 }; num.x = 29; num.y = sy + 13;
    card.addChild(num);

    // Recommend badge
    if (sameCat) {
      const rec = neonBadge('\ucd94\ucc9c', D.blue);
      rec.x = CARD_W - 62; rec.y = sy + 4;
      card.addChild(rec);
    }

    // Embedded skill card (compact with desc)
    const slotCard = buildSkillCard(action, CARD_W - 72, SLOT_H - 8, { showDesc: true });
    slotCard.x = 42; slotCard.y = sy + 4;
    if (!sameCat) slotCard.alpha = 0.6;
    card.addChild(slotCard);

    // Tap target
    const hit = new PIXI.Graphics();
    hit.roundRect(16, sy, CARD_W - 32, SLOT_H, 10).fill({ color: 0xffffff, alpha: 0.001 });
    hit.eventMode = 'static'; hit.cursor = 'pointer';
    hit.on('pointerdown', () => selectSlot(i));
    card.addChild(hit);
  });

  // Skip button
  const skipY = slotStartY + actions.length * (SLOT_H + 6) + 4;
  const skipBg = new PIXI.Graphics();
  skipBg.roundRect(CARD_W / 2 - 80, skipY, 160, 32, 16)
    .fill({ color: D.bgAlt, alpha: 0.5 })
    .stroke({ color: D.sep, width: 0.5, alpha: 0.3 });
  card.addChild(skipBg);
  const skipT = lbl('\uac74\ub108\ub6f0\uae30', 7, D.dim);
  skipT.anchor = { x: 0.5, y: 0.5 }; skipT.x = CARD_W / 2; skipT.y = skipY + 16;
  card.addChild(skipT);
  const skipHit = new PIXI.Graphics();
  skipHit.roundRect(CARD_W / 2 - 80, skipY, 160, 32, 16).fill({ color: 0xffffff, alpha: 0.001 });
  skipHit.eventMode = 'static'; skipHit.cursor = 'pointer';
  skipHit.on('pointerdown', () => selectSlot(-1));
  card.addChild(skipHit);

  return { container: card, height: h, interactive: true };
}



// ---- Egg / Devolution Card ----

function buildEggCard(ally) {
  const h = 115;
  const card = new PIXI.Container();
  card.addChild(feedCard(CARD_W, h, D.orange));

  // Warm layered glow behind egg
  card.addChild(glowCircle(52, 52, 32, D.orange, 0.07));
  card.addChild(glowCircle(52, 52, 18, D.orange, 0.05));
  // Decorative ring
  card.addChild(new PIXI.Graphics()
    .circle(52, 52, 30).stroke({ color: D.orange, width: 0.5, alpha: 0.1 }));

  // Egg sprite
  const eggIcon = egg(38, allyColor(ally.id));
  eggIcon.x = 52; eggIcon.y = 50;
  card.addChild(eggIcon);

  // Title
  const title = lbl('퇴화 시작!', 10, D.orange, true);
  title.x = 96; title.y = 14;
  card.addChild(title);

  card.addChild(sep(96, CARD_W - 14, 36, D.orange));

  // Monster name (bold)
  const nameText = lbl(ally.name, 9, D.text, true);
  nameText.x = 96; nameText.y = 44;
  card.addChild(nameText);

  // Description
  const desc = lbl('알 상태에 진입합니다...', 7, D.dim);
  desc.x = 96; desc.y = 68;
  card.addChild(desc);

  // Hint with arrow
  const hint = lbl('새로운 형태로 돌아옵니다  \u2192', 6, D.dimmer);
  hint.x = 96; hint.y = 90;
  card.addChild(hint);

  return { container: card, height: h };
}

// ============================================================
// Feed Controller
// ============================================================

function showNextCard() {
  if (currentCardIdx >= cardQueue.length) {
    // All cards shown
    allCardsShown = true;
    activateFooterBtn();
    return;
  }

  animating = true;
  animGeneration++;
  const gen = animGeneration;
  const entry = cardQueue[currentCardIdx];
  const card = entry.container;
  entry._entryDone = false; // track if entry animation completed
  card.x = PAD;
  card.y = feedY;

  // Start offscreen (slide up + fade in)
  card.alpha = 0;
  const targetY = feedY;
  card.y = targetY + 30;

  feedContainer.addChild(card);

  const duration = 250;
  const start = performance.now();

  function animateEntry() {
    if (gen !== animGeneration) return; // cancelled
    const t = Math.min(1, (performance.now() - start) / duration);
    const ease = 1 - Math.pow(1 - t, 3); // easeOut
    card.y = targetY + 30 * (1 - ease);
    card.alpha = ease;

    if (t < 1) {
      requestAnimationFrame(animateEntry);
    } else {
      card.y = targetY;
      card.alpha = 1;
      entry._entryDone = true;
      feedY += entry.height + CARD_GAP;
      updateMaxScroll();
      autoScrollToBottom();

      // If this card has XP bar animation, play it then wait for tap
      if (entry.animate === 'xp') {
        animateXPBar(entry, () => {
          currentCardIdx++;
          onCardFinished();
        });
      } else if (entry.interactive) {
        // Interactive card: scroll so card top is visible, wait for user choice
        autoScrollToCardTop(targetY);
        animating = false;
      } else {
        currentCardIdx++;
        onCardFinished();
      }
    }
  }

  requestAnimationFrame(animateEntry);
}

function animateXPBar(entry, onDone) {
  const gen = animGeneration;
  const ref = entry.barRef;
  const from = entry.ratioBefore;
  const to = entry.ratioAfter;
  const duration = 800;
  const start = performance.now();

  function tick() {
    if (gen !== animGeneration) return; // cancelled
    const t = Math.min(1, (performance.now() - start) / duration);
    // easeInOut
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const ratio = from + (to - from) * ease;
    drawBarFill(ref._barFill, ref._barX, ref._barY, ref._barW, ref._barH, ratio);

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      animating = false;
      onDone();
    }
  }

  requestAnimationFrame(tick);
}

function resolveInteractiveCard() {
  // Called when user makes a choice on an interactive card
  currentCardIdx++;
  animating = false;
  waitingForTap = false;
  onCardFinished();
}

function onCardFinished() {
  animating = false;
  if (currentCardIdx >= cardQueue.length) {
    allCardsShown = true;
    waitingForTap = false;
    activateFooterBtn();
    return;
  }
  // Wait for user tap to show next card
  waitingForTap = true;
}

function finishCurrentCard() {
  // Cancel any running rAF animations
  animGeneration++;
  const idx = currentCardIdx;
  if (idx >= cardQueue.length) return;

  const entry = cardQueue[idx];
  const card = entry.container;

  // Ensure card is in feed and fully visible
  if (!card.parent) feedContainer.addChild(card);
  card.alpha = 1;

  // Only advance feedY if entry animation hadn't completed yet
  if (!entry._entryDone) {
    card.x = PAD;
    card.y = feedY;
    entry._entryDone = true;
    feedY += entry.height + CARD_GAP;
  }

  // Finish XP bar
  if (entry.animate === 'xp' && entry.barRef) {
    drawBarFill(entry.barRef._barFill, entry.barRef._barX, entry.barRef._barY,
      entry.barRef._barW, entry.barRef._barH, entry.ratioAfter);
  }

  currentCardIdx = idx + 1;
  animating = false;

  updateMaxScroll();
  autoScrollToBottom();
  onCardFinished();
}

function activateFooterBtn() {
  footerBtn.alpha = 1;
  footerBtn.removeAllListeners();
  footerBtn.on('pointerdown', () => {
    if (onNextCallback) onNextCallback();
  });
}

// ============================================================
// Scroll
// ============================================================

function updateMaxScroll() {
  maxScroll = Math.max(0, feedY - FEED_H);
}

function applyScroll() {
  scrollOffset = Math.max(0, Math.min(maxScroll, scrollOffset));
  feedContainer.y = FEED_TOP - scrollOffset;
}

function autoScrollToBottom() { animateScrollTo(maxScroll); }

function autoScrollToCardTop(cardY) {
  // Scroll so that cardY sits at the top of the feed viewport (with small padding)
  const target = Math.max(0, Math.min(maxScroll, cardY - 8));
  animateScrollTo(target);
}

function animateScrollTo(target) {
  target = Math.max(0, Math.min(maxScroll, target));
  if (Math.abs(scrollOffset - target) < 2) {
    scrollOffset = target;
    applyScroll();
    return;
  }

  const from = scrollOffset;
  const duration = 300;
  const start = performance.now();

  function tick() {
    const t = Math.min(1, (performance.now() - start) / duration);
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    scrollOffset = from + (target - from) * ease;
    applyScroll();
    if (t < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// ============================================================
// Pointer
// ============================================================

function onPointerDown(e) {
  const pos = e.getLocalPosition(ct);
  if (pos.y >= FEED_TOP && pos.y <= FEED_BOTTOM) {
    scrollMode = 'pending';
    scrollStartY = pos.y;
    scrollStartOffset = scrollOffset;
  }
}

function onPointerMove(e) {
  if (scrollMode === 'idle') return;
  const pos = e.getLocalPosition(ct);
  const dy = pos.y - scrollStartY;
  if (scrollMode === 'pending' && Math.abs(dy) > 5) {
    scrollMode = 'scrolling';
  }
  if (scrollMode === 'scrolling') {
    scrollOffset = scrollStartOffset - dy;
    applyScroll();
  }
}

function onPointerUp(e) {
  if (scrollMode === 'pending') {
    // Tap detected — only advance cards, never call onNext from here
    if (waitingForTap) {
      // Show next card
      waitingForTap = false;
      showNextCard();
    } else if (animating) {
      // Finish current card animation instantly
      finishCurrentCard();
    }
    // When allCardsShown: do nothing here — user must use footer "계속" button
  }
  scrollMode = 'idle';
}
