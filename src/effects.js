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
