// ============================================================
// Turn Sequence Animation Engine — motion queue, speech bubbles, result VFX
// Extracted from battleFieldUI.js for modularity.
// ============================================================

import { W, C, lbl } from './theme.js';
import {
  playTamingEffect,
  motionDash, motionPulse, motionGuard, motionScan,
  motionEnemyLunge, motionEnemyRoar,
} from '../effects.js';
import { SENSORY_TO_ENV, shakeHud, updateHudFromStep } from './environmentHud.js';
import { crossfadeBackground } from './bgBuilder.js';

// ---- Emoji configs ----

const AXIS_EMOJI = {
  temperature: ['🌡️', '🔥', '❄️', '♨️'],
  brightness: ['☀️', '🌙', '✨', '💡'],
  smell: ['🌿', '🌸', '🍃', '🌺'],
  humidity: ['💧', '🌊', '💦', '🫧'],
  sound: ['🔊', '🎵', '🔔', '🎶'],
};

const CATEGORY_EMOJI = {
  stimulate: ['💫', '⚡', '✨'],
  capture: ['💚', '🤝', '💞', '💖'],
  defend: ['🛡️', '🔵', '💎'],
  survey: ['🔍', '👁️', '🧐'],
  attack: ['💢', '⚔️', '💥', '😤'],
};

// ---- State ----

let _sequencePlaying = false;
export function isSequencePlaying() { return _sequencePlaying; }

// ---- Public API ----

/**
 * Play turn steps sequentially with per-action motion + VFX.
 * @param {Array} steps - from combat.turnSteps
 * @param {object} ctx - { container, refs } shared battlefield context
 * @param {Function} onComplete - called after all steps finish
 */
export function playTurnSequence(steps, ctx, onComplete) {
  if (!steps || steps.length === 0) { onComplete?.(); return; }
  _sequencePlaying = true;

  let idx = 0;
  function next() {
    if (idx >= steps.length) {
      _sequencePlaying = false;
      onComplete?.();
      return;
    }
    const step = steps[idx++];
    playStep(step, ctx, () => {
      setTimeout(next, 250);
    });
  }
  next();
}

// ---- Step execution ----

function playStep(step, ctx, onDone) {
  const MOTION_DUR = 400;
  const { container, refs } = ctx;

  if (step.actor === 'enemy') {
    const sprite = refs.enemySprite;
    if (sprite) showSpeechBubble(container, sprite.x, sprite.y, step.skillName, true);
    playEnemyStep(step, MOTION_DUR, ctx, onDone);
  } else {
    const slot = refs.allySlots?.[step.allyIdx];
    const sprite = slot?.container;
    if (sprite) showSpeechBubble(container, sprite.x, sprite.y, step.skillName, false);
    playAllyStep(step, MOTION_DUR, ctx, onDone);
  }
}

function playEnemyStep(step, dur, ctx, onDone) {
  const { container, refs } = ctx;
  const sprite = refs.enemySprite;
  if (!sprite) { onDone?.(); return; }

  function onMotionDone() {
    playTamingEffect(step.axis || 'behavior', false);
    setTimeout(() => spawnTargetEmoji(container, sprite, 'attack'), 120);
    setTimeout(() => {
      if (step.axis) {
        spawnFieldParticles(container, step.axis, step.delta || -1);
        crossfadeBackground(container, refs.bgLayer);
        if (step.envAfter) updateHudFromStep(refs.enemyHud, step.envAfter);
        shakeHud(step.axis, 10, 800);
      }
    }, 280);
    setTimeout(onDone, 450);
  }

  if (Math.random() > 0.5) {
    motionEnemyLunge(sprite, dur, onMotionDone);
  } else {
    motionEnemyRoar(sprite, dur, onMotionDone);
  }
}

function playAllyStep(step, dur, ctx, onDone) {
  const { container, refs } = ctx;
  const slot = refs.allySlots?.[step.allyIdx];
  const sprite = slot?.container;
  if (!sprite) { onDone?.(); return; }

  const enemyX = refs.enemySprite?.x ?? W * 0.5;
  const enemyY = refs.enemySprite?.y ?? 130;
  const dx = (enemyX - sprite.x) * 0.35;
  const dy = (enemyY - sprite.y) * 0.35;
  const enemySprite = refs.enemySprite;

  function onMotionDone() {
    if (step.category !== 'defend') playTamingEffect(step.axis || 'behavior', true);
    setTimeout(() => {
      if (step.category !== 'defend') {
        spawnTargetEmoji(container, enemySprite, step.category);
      } else {
        spawnTargetEmoji(container, sprite, 'defend');
      }
    }, 150);
    setTimeout(() => {
      if (step.category === 'stimulate' && step.axis) {
        const envAxis = SENSORY_TO_ENV[step.axis] || step.axis;
        spawnFieldParticles(container, step.axis, 1);
        crossfadeBackground(container, refs.bgLayer);
        if (step.envAfter) updateHudFromStep(refs.enemyHud, step.envAfter);
        shakeHud(envAxis, 8, 700);
      }
    }, 300);
    setTimeout(() => flashSkillButton(refs, step.allyIdx, step.category), 450);
    setTimeout(onDone, 600);
  }

  switch (step.category) {
    case 'stimulate':
      motionDash(sprite, dx, dy, dur, onMotionDone); break;
    case 'capture':
      motionPulse(sprite, 1.2, dur, onMotionDone); break;
    case 'defend':
      motionGuard(sprite, 25, dur, onMotionDone); break;
    case 'survey':
      motionScan(sprite, dur, onMotionDone); break;
    default:
      motionDash(sprite, dx, dy, dur, onMotionDone);
  }
}

// ---- Speech Bubble ----

function showSpeechBubble(container, sx, sy, text, isEnemy) {
  if (!container) return;
  const bubble = new PIXI.Container();
  const color = isEnemy ? 0xff6644 : 0x00d4aa;
  const bgColor = isEnemy ? 0x331111 : 0x112233;

  const t = lbl(text, 6.5, color, true);
  t.anchor = { x: 0.5, y: 0.5 };
  const padX = 10, padY = 5;
  const bw = Math.max(50, t.width + padX * 2);
  const bh = t.height + padY * 2;

  const bg = new PIXI.Graphics();
  bg.roundRect(-bw / 2, -bh / 2, bw, bh, 8).fill({ color: bgColor, alpha: 0.92 });
  bg.roundRect(-bw / 2, -bh / 2, bw, bh, 8).stroke({ color, width: 1.5, alpha: 0.6 });
  bg.moveTo(-5, bh / 2).lineTo(0, bh / 2 + 6).lineTo(5, bh / 2).fill({ color: bgColor, alpha: 0.92 });
  bg.moveTo(-5, bh / 2).lineTo(0, bh / 2 + 6).lineTo(5, bh / 2).stroke({ color, width: 1, alpha: 0.4 });
  bubble.addChild(bg);
  bubble.addChild(t);

  bubble.x = Math.max(bw / 2 + 4, Math.min(W - bw / 2 - 4, sx));
  bubble.y = sy - (isEnemy ? 80 : 70);
  bubble.alpha = 0;
  bubble.scale.set(0.7);
  container.addChild(bubble);

  const start = performance.now();
  const dur = 700;
  (function tick() {
    const elapsed = performance.now() - start;
    if (elapsed >= dur) { container.removeChild(bubble); bubble.destroy({ children: true }); return; }
    const p = elapsed / dur;
    if (p < 0.12) {
      const e = p / 0.12;
      bubble.alpha = e; bubble.scale.set(0.7 + e * 0.35);
    } else if (p < 0.2) {
      const e = (p - 0.12) / 0.08;
      bubble.alpha = 1; bubble.scale.set(1.05 - e * 0.05);
    } else if (p < 0.7) {
      bubble.alpha = 1; bubble.scale.set(1);
    } else {
      const e = (p - 0.7) / 0.3;
      bubble.alpha = 1 - e; bubble.y -= 0.3;
    }
    requestAnimationFrame(tick);
  })();
}

// ---- Field Particles ----

function spawnFieldParticles(container, axis, delta) {
  if (!container) return;
  const emojis = AXIS_EMOJI[axis] || AXIS_EMOJI.sound;
  const count = 12 + Math.floor(Math.random() * 6);
  const rising = delta > 0;
  const FIELD_H = 340;

  for (let i = 0; i < count; i++) {
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const p = lbl(emoji, 7 + Math.random() * 7, 0xffffff, false);
    p.anchor = { x: 0.5, y: 0.5 };
    p.x = 10 + Math.random() * (W - 20);
    p.y = rising
      ? (FIELD_H * 0.3 + Math.random() * FIELD_H * 0.7)
      : (Math.random() * FIELD_H * 0.7);
    p.alpha = 0;
    container.addChild(p);

    const delay = i * 35 + Math.random() * 60;
    const dur = 900 + Math.random() * 500;
    const speed = rising ? -(60 + Math.random() * 40) : (60 + Math.random() * 40);
    const drift = (Math.random() - 0.5) * 30;
    const startTime = performance.now() + delay;

    (function animP() {
      const elapsed = performance.now() - startTime;
      if (elapsed < 0) { requestAnimationFrame(animP); return; }
      if (elapsed >= dur) { container.removeChild(p); p.destroy(); return; }
      const t = elapsed / dur;
      p.y += speed * 0.016;
      p.x += drift * 0.016;
      p.rotation += (Math.random() - 0.5) * 0.03;
      if (t < 0.12) p.alpha = t / 0.12 * 0.75;
      else if (t < 0.55) p.alpha = 0.75;
      else p.alpha = 0.75 * (1 - (t - 0.55) / 0.45);
      p.scale.set(1 - t * 0.25);
      requestAnimationFrame(animP);
    })();
  }
}

// ---- Target Emoji ----

function spawnTargetEmoji(container, targetSprite, category) {
  if (!container || !targetSprite) return;
  const emojis = CATEGORY_EMOJI[category] || CATEGORY_EMOJI.stimulate;
  const tx = targetSprite.x;
  const ty = targetSprite.y;

  if (category === 'survey') {
    _orbitEmoji(container, tx, ty, '🔍', 800);
  } else if (category === 'capture') {
    _convergeEmoji(container, tx, ty, ['💚', '💞', '💖'], 600);
  } else {
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    _popEmoji(container, tx, ty - 20, emoji, 500);
  }
}

function _popEmoji(container, x, y, emoji, dur) {
  const p = lbl(emoji, 16, 0xffffff, false);
  p.anchor = { x: 0.5, y: 0.5 }; p.x = x; p.y = y;
  p.alpha = 0; p.scale.set(0.3);
  container.addChild(p);
  const start = performance.now();
  (function tick() {
    const t = (performance.now() - start) / dur;
    if (t >= 1) { container.removeChild(p); p.destroy(); return; }
    if (t < 0.2) {
      p.alpha = t / 0.2; p.scale.set(0.3 + t * 5 * 0.7);
    } else if (t < 0.5) {
      p.alpha = 1; p.scale.set(1 + (t - 0.2) * 0.3);
    } else {
      p.alpha = 1 - (t - 0.5) / 0.5;
      p.scale.set(1.1 + (t - 0.5) * 0.4);
      p.y -= 0.5;
    }
    requestAnimationFrame(tick);
  })();
}

function _orbitEmoji(container, cx, cy, emoji, dur) {
  const p = lbl(emoji, 14, 0xffffff, false);
  p.anchor = { x: 0.5, y: 0.5 }; p.alpha = 0;
  container.addChild(p);
  const radius = 50;
  const start = performance.now();
  (function tick() {
    const t = (performance.now() - start) / dur;
    if (t >= 1) { container.removeChild(p); p.destroy(); return; }
    const angle = t * Math.PI * 2;
    p.x = cx + Math.cos(angle) * radius;
    p.y = cy + Math.sin(angle) * radius * 0.5;
    if (t < 0.15) p.alpha = t / 0.15;
    else if (t < 0.75) p.alpha = 1;
    else p.alpha = 1 - (t - 0.75) / 0.25;
    p.scale.set(0.8 + Math.sin(t * Math.PI) * 0.4);
    requestAnimationFrame(tick);
  })();
}

function _convergeEmoji(container, cx, cy, emojis, dur) {
  emojis.forEach((emoji, i) => {
    const angle = (i / emojis.length) * Math.PI * 2;
    const startR = 70;
    const p = lbl(emoji, 10, 0xffffff, false);
    p.anchor = { x: 0.5, y: 0.5 }; p.alpha = 0;
    container.addChild(p);
    const start = performance.now() + i * 60;
    (function tick() {
      const t = Math.max(0, (performance.now() - start) / dur);
      if (t >= 1) { container.removeChild(p); p.destroy(); return; }
      const r = startR * (1 - t);
      p.x = cx + Math.cos(angle + t * 2) * r;
      p.y = cy + Math.sin(angle + t * 2) * r * 0.6;
      if (t < 0.2) p.alpha = t / 0.2;
      else if (t < 0.7) p.alpha = 1;
      else p.alpha = 1 - (t - 0.7) / 0.3;
      p.scale.set(0.6 + Math.sin(t * Math.PI) * 0.5);
      requestAnimationFrame(tick);
    })();
  });
}

// ---- Skill Button Flash ----

function flashSkillButton(refs, allyIdx, category) {
  if (!refs.actionContainer) return;
  const catColors = { defend: 0x4dabf7, stimulate: 0x00d4aa, capture: 0xff6b6b, survey: 0xccaaee };
  const color = catColors[category] || 0x00d4aa;

  const cols = 3;
  const colW = (W - 20) / cols;
  const cx = 10 + allyIdx * colW + allyIdx * 2;
  const flashG = new PIXI.Graphics();
  flashG.roundRect(cx, 0, colW - 4, 510, 14).fill({ color, alpha: 0.2 });
  refs.actionContainer.addChild(flashG);

  const burstEmojis = category === 'defend' ? ['🛡️', '✨'] :
                      category === 'capture' ? ['💚', '✨'] :
                      category === 'survey' ? ['🔍', '✨'] :
                      ['💫', '⚡', '✨'];
  const burstX = cx + (colW - 4) / 2;
  const burstY = 80;

  for (let i = 0; i < 5; i++) {
    const emoji = burstEmojis[Math.floor(Math.random() * burstEmojis.length)];
    const bp = lbl(emoji, 6 + Math.random() * 4, 0xffffff, false);
    bp.anchor = { x: 0.5, y: 0.5 };
    bp.x = burstX + (Math.random() - 0.5) * 30;
    bp.y = burstY; bp.alpha = 0;
    refs.actionContainer.addChild(bp);
    const delay = i * 30;
    const bStart = performance.now() + delay;
    const vx = (Math.random() - 0.5) * 60;
    const vy = -(30 + Math.random() * 40);
    (function tick() {
      const t = Math.max(0, (performance.now() - bStart) / 500);
      if (t >= 1) { refs.actionContainer.removeChild(bp); bp.destroy(); return; }
      bp.x += vx * 0.016;
      bp.y += vy * 0.016 + t * 50 * 0.016;
      if (t < 0.2) bp.alpha = t / 0.2;
      else bp.alpha = 1 - (t - 0.2) / 0.8;
      bp.scale.set(1 - t * 0.4);
      requestAnimationFrame(tick);
    })();
  }

  const fStart = performance.now();
  (function tick() {
    const t = (performance.now() - fStart) / 400;
    if (t >= 1) { refs.actionContainer.removeChild(flashG); flashG.destroy(); return; }
    flashG.alpha = 1 - t;
    requestAnimationFrame(tick);
  })();
}
