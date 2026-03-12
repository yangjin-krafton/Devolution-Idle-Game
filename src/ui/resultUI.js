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
let allCardsShown = false;

// ============================================================
// Init — called once
// ============================================================

export function initResult() {
  ct = new PIXI.Container();
  ct.eventMode = 'static';
  ct.hitArea = new PIXI.Rectangle(0, 0, W, H);

  // Background
  const bg = new PIXI.Graphics();
  bg.rect(0, 0, W, H).fill({ color: D.bg });
  bg.roundRect(0, 0, W, 4, 0).fill({ color: D.neon, alpha: 0.25 });
  ct.addChild(bg);

  // Header
  const hdr = new PIXI.Graphics();
  hdr.rect(0, 0, W, HEADER_H).fill({ color: D.panel });
  hdr.moveTo(0, HEADER_H).lineTo(W, HEADER_H).stroke({ color: D.sep, width: 1, alpha: 0.4 });
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
  ftr.moveTo(0, FEED_BOTTOM).lineTo(W, FEED_BOTTOM).stroke({ color: D.sep, width: 1, alpha: 0.4 });
  ct.addChild(ftr);

  footerBtn = cuteBtn(W / 2 - 180, FEED_BOTTOM + 10, 180, 44, '▶ 계속', D.neon, D.bg);
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

export function renderResult(rewards, onNext) {
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
  footerBtn.alpha = 0.3;
  footerBtn.removeAllListeners();
  applyScroll();

  // Build card queue
  cardQueue.push(buildBannerCard(rewards.state, rewards.enemy));

  if (rewards.state !== 'defeat') {
    for (const ally of rewards.allies) {
      cardQueue.push(buildXPCard(ally));
      if (ally.leveledUp) {
        cardQueue.push(buildLevelUpCard(ally));
        if (ally.newSkills && ally.newSkills.length > 0) {
          for (const skill of ally.newSkills) {
            cardQueue.push(buildSkillAcquireCard(ally, skill));
          }
        }
      }
      if (ally.enteredEgg) {
        cardQueue.push(buildEggCard(ally));
      }
    }
  }

  // Show first card (banner) automatically
  showNextCard();
}

// ============================================================
// Card Builders
// ============================================================

function buildBannerCard(state, enemy) {
  const h = 140;
  const card = new PIXI.Container();
  const accentColor = state === 'victory' ? D.neon : state === 'escaped' ? D.orange : D.red;
  card.addChild(feedCard(CARD_W, h, accentColor));

  if (state === 'victory') {
    const spr = monster(70, enemy.img || null);
    spr.x = CARD_W / 2; spr.y = 45;
    card.addChild(spr);

    // Hearts
    for (let i = 0; i < 3; i++) {
      const heart = lbl('\u2665', 10, D.neon);
      heart.anchor = { x: 0.5, y: 0.5 };
      heart.alpha = 0.5;
      heart.x = CARD_W / 2 + Math.cos(i * Math.PI * 2 / 3) * 50;
      heart.y = 45 + Math.sin(i * Math.PI * 2 / 3) * 28;
      card.addChild(heart);
    }

    const t = lbl('순화 성공!', 14, D.neon, true);
    t.anchor = { x: 0.5, y: 0 }; t.x = CARD_W / 2; t.y = 88;
    card.addChild(t);
    const sub = lbl((enemy.name || '???') + '을(를) 길들였다!', 8, D.dim);
    sub.anchor = { x: 0.5, y: 0 }; sub.x = CARD_W / 2; sub.y = 116;
    card.addChild(sub);

  } else if (state === 'escaped') {
    const spr = monster(60, enemy.img || null);
    spr.x = CARD_W / 2; spr.y = 40; spr.alpha = 0.4;
    card.addChild(spr);
    const t = lbl('도주...', 14, D.orange, true);
    t.anchor = { x: 0.5, y: 0 }; t.x = CARD_W / 2; t.y = 88;
    card.addChild(t);
    const sub = lbl((enemy.name || '???') + '이(가) 도망쳤습니다.', 8, D.dim);
    sub.anchor = { x: 0.5, y: 0 }; sub.x = CARD_W / 2; sub.y = 116;
    card.addChild(sub);

  } else {
    const t = lbl('전멸', 14, D.red, true);
    t.anchor = { x: 0.5, y: 0.5 }; t.x = CARD_W / 2; t.y = 50;
    card.addChild(t);
    const sub = lbl('모든 아군이 쓰러졌습니다.', 8, D.dim);
    sub.anchor = { x: 0.5, y: 0 }; sub.x = CARD_W / 2; sub.y = 80;
    card.addChild(sub);
  }

  return { container: card, height: h };
}

function buildXPCard(ally) {
  const h = 80;
  const card = new PIXI.Container();
  card.addChild(feedCard(CARD_W, h, D.blue));

  // Sprite
  const spr = monster(40, ally.img);
  spr.x = 36; spr.y = 28;
  card.addChild(spr);

  // Name + Level
  const name = lbl(ally.name, 9, D.text, true);
  name.x = 66; name.y = 8;
  card.addChild(name);

  const lvl = lbl('Lv.' + ally.levelAfter, 7, D.dim);
  lvl.x = 66; lvl.y = 30;
  card.addChild(lvl);

  // XP badge
  const badge = neonBadge('+' + ally.xpGain + ' XP', D.blue);
  badge.x = CARD_W - 70; badge.y = 10;
  card.addChild(badge);

  // XP bar
  const barW = CARD_W - 80;
  const barX = 66;
  const barY = 52;
  const barH = 10;

  // Calculate ratio within current level
  const range = ally.xpNeeded - ally.xpBase;
  const ratioBefore = range > 0 ? Math.min(1, (ally.xpBefore - ally.xpBase) / range) : 0;
  const ratioAfter = range > 0 ? Math.min(1, (ally.xpAfter - ally.xpBase) / range) : 1;

  // Background bar
  const barBg = new PIXI.Graphics()
    .roundRect(barX, barY, barW, barH, barH / 2)
    .fill({ color: D.sep, alpha: 0.6 });
  card.addChild(barBg);

  // Fill bar (will animate)
  const barFill = new PIXI.Graphics();
  card.addChild(barFill);
  card._barFill = barFill;
  card._barX = barX;
  card._barY = barY;
  card._barW = barW;
  card._barH = barH;
  card._ratioBefore = ratioBefore;
  card._ratioAfter = ally.leveledUp ? 1 : ratioAfter;

  // XP text
  const xpText = lbl(ally.xpAfter + '/' + ally.xpNeeded, 6, D.dim);
  xpText.x = barX + barW + 4; xpText.y = barY - 1;
  card.addChild(xpText);

  // Draw initial state
  drawBarFill(barFill, barX, barY, barW, barH, ratioBefore);

  return { container: card, height: h, animate: 'xp', ratioBefore, ratioAfter: card._ratioAfter, barRef: card };
}

function drawBarFill(gfx, x, y, w, h, ratio) {
  gfx.clear();
  if (ratio > 0) {
    gfx.roundRect(x + 0.5, y + 0.5, Math.max(h, (w - 1) * Math.min(1, ratio)), h - 1, (h - 1) / 2)
      .fill({ color: D.blue });
  }
}

function buildLevelUpCard(ally) {
  const stats = Object.keys(ally.statChanges).filter(k => k !== 'hp');
  const rowCount = stats.length + 1; // +1 for HP
  const h = 60 + rowCount * 22;
  const card = new PIXI.Container();
  card.addChild(feedCard(CARD_W, h, D.neon));

  const title = lbl('\u2605 LEVEL UP!', 11, D.neon, true);
  title.x = 16; title.y = 10;
  card.addChild(title);

  const lvlText = lbl('Lv.' + ally.levelBefore + '  \u2192  Lv.' + ally.levelAfter, 8, D.text);
  lvlText.x = 16; lvlText.y = 34;
  card.addChild(lvlText);

  // Stat changes
  let y = 58;
  // HP
  if (ally.statChanges.hp) {
    addStatRow(card, 'HP', ally.statChanges.hp, D.red, y);
    y += 22;
  }
  for (const stat of stats) {
    const gain = ally.statChanges[stat];
    const label = STAT_LABEL[stat] || stat;
    const color = STAT_COLOR[stat] || D.dim;
    addStatRow(card, label, gain, color, y);
    y += 22;
  }

  return { container: card, height: h };
}

function addStatRow(card, label, gain, color, y) {
  const name = lbl(label, 7, D.dim, true);
  name.x = 24; name.y = y;
  card.addChild(name);

  if (gain > 0) {
    const val = lbl('+' + gain, 8, D.neon, true);
    val.x = 120; val.y = y;
    card.addChild(val);
  } else {
    const val = lbl('\u2500\u2500', 7, D.dimmer);
    val.x = 120; val.y = y;
    card.addChild(val);
  }
}

function buildSkillAcquireCard(ally, skill) {
  const h = 100;
  const card = new PIXI.Container();
  card.addChild(feedCard(CARD_W, h, D.blue));

  const title = lbl('\u2726 새로운 스킬!', 10, D.blue, true);
  title.x = 16; title.y = 10;
  card.addChild(title);

  // Use buildSkillCard for the preview
  const skillPreview = buildSkillCard(skill, CARD_W - 40, 52);
  skillPreview.x = 20; skillPreview.y = 36;
  card.addChild(skillPreview);

  return { container: card, height: h };
}

function buildEggCard(ally) {
  const h = 90;
  const card = new PIXI.Container();
  card.addChild(feedCard(CARD_W, h, D.orange));

  const eggIcon = egg(30, allyColor(ally.id));
  eggIcon.x = 36; eggIcon.y = 35;
  card.addChild(eggIcon);

  const title = lbl('\ud83e\udd5a 퇴화 시작!', 10, D.orange, true);
  title.x = 66; title.y = 12;
  card.addChild(title);

  const desc = lbl(ally.name + '이(가) 알 상태에 진입합니다...', 8, D.dim);
  desc.x = 66; desc.y = 40;
  card.addChild(desc);

  const hint = lbl('알에서 새로운 형태로 돌아옵니다', 6, D.dimmer);
  hint.x = 66; hint.y = 62;
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
      feedY += entry.height + CARD_GAP;
      updateMaxScroll();
      autoScrollToBottom();

      // If this card has XP bar animation, play it then wait for tap
      if (entry.animate === 'xp') {
        animateXPBar(entry, () => {
          currentCardIdx++;
          onCardFinished();
        });
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
  card.x = PAD;
  card.y = feedY;
  card.alpha = 1;

  // Finish XP bar
  if (entry.animate === 'xp' && entry.barRef) {
    drawBarFill(entry.barRef._barFill, entry.barRef._barX, entry.barRef._barY,
      entry.barRef._barW, entry.barRef._barH, entry.ratioAfter);
  }

  feedY += entry.height + CARD_GAP;
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

function autoScrollToBottom() {
  const target = maxScroll;
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
    // Tap detected
    if (waitingForTap) {
      // Show next card
      waitingForTap = false;
      showNextCard();
    } else if (animating) {
      // Finish current card animation instantly
      finishCurrentCard();
    } else if (allCardsShown) {
      if (onNextCallback) onNextCallback();
    }
  }
  scrollMode = 'idle';
}
