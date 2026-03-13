// ============================================================
// Pixi-based Visual Effects
// ============================================================

import { W, H } from './ui/theme.js';

let _app = null;
let _flashOverlay = null;

export function initEffects(app) {
  _app = app;
  _flashOverlay = new PIXI.Graphics();
  _flashOverlay.zIndex = 9999;
  _flashOverlay.visible = false;
  app.stage.addChild(_flashOverlay);
}

function screenFlash(color, duration = 120, alpha = 0.5) {
  if (!_flashOverlay) return;
  _flashOverlay.clear();
  _flashOverlay.rect(0, 0, W, H).fill({ color, alpha });
  _flashOverlay.visible = true;
  setTimeout(() => { _flashOverlay.visible = false; }, duration);
}

function screenShake(intensity = 4, duration = 300) {
  if (!_app) return;
  const stage = _app.stage;
  const start = Date.now();
  function frame() {
    const elapsed = Date.now() - start;
    if (elapsed > duration) { stage.x = 0; stage.y = 0; return; }
    const decay = 1 - elapsed / duration;
    stage.x = (Math.random() - 0.5) * intensity * 2 * decay;
    stage.y = (Math.random() - 0.5) * intensity * 2 * decay;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function spriteBlink(container, times = 3, interval = 80) {
  if (!container) return;
  let count = 0;
  const id = setInterval(() => {
    container.alpha = count % 2 === 0 ? 0.2 : 1;
    count++;
    if (count >= times * 2) { clearInterval(id); container.alpha = 1; }
  }, interval);
}

// ---- Exported Effect Functions ----

const FLASH_COLORS = {
  sound: 0xc0e8ff, temperature: 0xfff0d0,
  smell: 0xd8fcd8, behavior: 0xe8e0ff,
};

export function playTamingEffect(axis, isGood) {
  if (isGood) {
    screenFlash(FLASH_COLORS[axis] || 0xe8e0ff, 150, 0.3);
  } else {
    screenFlash(0x440000, 100, 0.3);
    screenShake(2, 150);
  }
}

export function playAttackEffect(targetContainer) {
  screenFlash(0xff0000, 80, 0.3);
  screenShake(5, 250);
  spriteBlink(targetContainer, 3, 70);
}

export function playBondingAttempt() {
  screenFlash(0xc0e0ff, 200, 0.25);
}

export function playBondingSuccess() {
  screenFlash(0xffffff, 300, 0.5);
  screenShake(3, 200);
}

export function playBondingFail() {
  screenFlash(0x220000, 150, 0.3);
  screenShake(4, 200);
}

export function playEscapeEffect(targetContainer) {
  if (targetContainer) {
    let frame = 0;
    const id = setInterval(() => {
      targetContainer.alpha = Math.max(0, 1 - frame * 0.1);
      targetContainer.y -= 2;
      frame++;
      if (frame > 10) { clearInterval(id); }
    }, 30);
  }
  screenFlash(0x333333, 200, 0.3);
}

export function playFaintEffect(targetContainer) {
  spriteBlink(targetContainer, 3, 100);
  screenFlash(0x000000, 100, 0.3);
  screenShake(3, 150);
}

export function playDevolutionEffect() {
  screenFlash(0xfff8c0, 300, 0.4);
  screenShake(2, 300);
}

// ============================================================
// Turn Sequence Motion Primitives
// ============================================================

/**
 * Dash forward toward target then return.
 * @param {PIXI.Container} sprite - the actor sprite container
 * @param {number} dx - horizontal distance to dash (negative = left)
 * @param {number} dy - vertical distance to dash (negative = up)
 * @param {number} duration - total ms (forward + hold + return)
 * @param {Function} onDone - callback when complete
 */
export function motionDash(sprite, dx, dy, duration, onDone) {
  if (!sprite) { onDone?.(); return; }
  const ox = sprite.x, oy = sprite.y;
  const fwd = duration * 0.3, hold = duration * 0.15, ret = duration * 0.55;
  const start = performance.now();
  function tick() {
    const elapsed = performance.now() - start;
    if (elapsed < fwd) {
      const t = elapsed / fwd;
      const ease = t * t * (3 - 2 * t); // smoothstep
      sprite.x = ox + dx * ease;
      sprite.y = oy + dy * ease;
    } else if (elapsed < fwd + hold) {
      sprite.x = ox + dx;
      sprite.y = oy + dy;
    } else if (elapsed < fwd + hold + ret) {
      const t = (elapsed - fwd - hold) / ret;
      const ease = t * t * (3 - 2 * t);
      sprite.x = ox + dx * (1 - ease);
      sprite.y = oy + dy * (1 - ease);
    } else {
      sprite.x = ox; sprite.y = oy;
      onDone?.(); return;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/**
 * Pulse (scale up then back) in place — for capture/bonding.
 */
export function motionPulse(sprite, scale, duration, onDone) {
  if (!sprite) { onDone?.(); return; }
  const start = performance.now();
  function tick() {
    const elapsed = performance.now() - start;
    if (elapsed >= duration) { sprite.scale.set(1); onDone?.(); return; }
    const t = elapsed / duration;
    const s = 1 + Math.sin(t * Math.PI) * (scale - 1);
    sprite.scale.set(s);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/**
 * Guard motion — step back slightly then return + brief flash.
 */
export function motionGuard(sprite, distance, duration, onDone) {
  if (!sprite) { onDone?.(); return; }
  const ox = sprite.y;
  const osx = sprite.scale.x, osy = sprite.scale.y;
  const back = duration * 0.25, hold = duration * 0.35, ret = duration * 0.4;
  const start = performance.now();
  screenFlash(0x88ccff, 200, 0.22);
  function tick() {
    const elapsed = performance.now() - start;
    if (elapsed < back) {
      const t = elapsed / back;
      sprite.y = ox + distance * t;
      sprite.scale.set(osx * (1 + t * 0.12), osy * (1 + t * 0.12));
    } else if (elapsed < back + hold) {
      sprite.y = ox + distance;
      sprite.scale.set(osx * 1.12, osy * 1.12);
    } else if (elapsed < back + hold + ret) {
      const t = (elapsed - back - hold) / ret;
      sprite.y = ox + distance * (1 - t);
      const s = 1.12 - t * 0.12;
      sprite.scale.set(osx * s, osy * s);
    } else {
      sprite.y = ox;
      sprite.scale.set(osx, osy);
      onDone?.(); return;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/**
 * Scan motion — brief "eye flash" scale pulse on Y axis.
 */
export function motionScan(sprite, duration, onDone) {
  if (!sprite) { onDone?.(); return; }
  const start = performance.now();
  screenFlash(0xffff88, 150, 0.18);
  function tick() {
    const elapsed = performance.now() - start;
    if (elapsed >= duration) { sprite.scale.set(1); onDone?.(); return; }
    const t = elapsed / duration;
    const sy = 1 + Math.sin(t * Math.PI * 2) * 0.15;
    const sx = 1 - Math.sin(t * Math.PI * 2) * 0.08;
    sprite.scale.set(sx, sy);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/**
 * Enemy lunge — dash toward allies (downward) then return.
 */
export function motionEnemyLunge(sprite, duration, onDone) {
  motionDash(sprite, 0, 30, duration, onDone);
}

/**
 * Enemy roar — scale up with shake.
 */
export function motionEnemyRoar(sprite, duration, onDone) {
  if (!sprite) { onDone?.(); return; }
  screenShake(3, Math.min(200, duration * 0.6));
  motionPulse(sprite, 1.15, duration, onDone);
}
