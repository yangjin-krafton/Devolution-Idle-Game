// ============================================================
// Dialog Effects Engine — 다이얼로그 연출 모션 시스템
// ============================================================
//
// dialog line에 effects 배열을 추가하면 자동 실행:
//
// { text: '...', effects: [
//   { type: 'sprite', img: 'asset/...', x: 240, y: 300, size: 120, id: 'enemy' },
//   { type: 'zoom',   target: 'enemy', from: 0.5, to: 1.0, dur: 500 },
//   { type: 'move',   target: 'enemy', toX: 240, toY: 200, dur: 600, ease: 'bounce' },
//   { type: 'shake',  dur: 300, intensity: 8 },
//   { type: 'pan',    x: -30, y: 0, dur: 500 },
//   { type: 'fade',   target: 'enemy', from: 0, to: 1, dur: 400 },
//   { type: 'bounce', target: 'enemy', height: 20, dur: 400 },
//   { type: 'tint',   color: 0xff0000, alpha: 0.3, dur: 300 },
//   { type: 'flash',  color: 0xffffff, dur: 200 },
//   { type: 'wait',   dur: 500 },
//   { type: 'remove',  target: 'enemy' },
// ]}

import { W, H } from './theme.js';
import { monster } from './sprites.js';

// ---- Easing functions ----
const EASE = {
  linear: t => t,
  easeOut: t => 1 - Math.pow(1 - t, 3),
  easeIn: t => t * t * t,
  easeInOut: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  bounce: t => {
    if (t < 0.5) return EASE.easeOut(t * 2);
    const b = (t - 0.5) * 2;
    return 1 - Math.abs(Math.sin(b * Math.PI * 2)) * (1 - b) * 0.3;
  },
  elastic: t => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
  },
};

// ---- State ----
let stageContainer = null;   // the effects layer (PIXI.Container)
let sprites = {};             // named sprites: { id: PIXI.Container }
let activeTweens = [];        // running animations
let flashOverlay = null;
let tintOverlay = null;

// ============================================================
// Init — call once, returns container to add to dialog overlay
// ============================================================

export function initEffectsLayer() {
  stageContainer = new PIXI.Container();

  // Flash overlay (full screen white/color flash)
  flashOverlay = new PIXI.Graphics();
  flashOverlay.rect(0, 0, W, H).fill({ color: 0xffffff });
  flashOverlay.alpha = 0;
  flashOverlay.visible = false;

  // Tint overlay (color wash)
  tintOverlay = new PIXI.Graphics();
  tintOverlay.rect(0, 0, W, H).fill({ color: 0xff0000 });
  tintOverlay.alpha = 0;
  tintOverlay.visible = false;

  stageContainer.addChild(tintOverlay);
  stageContainer.addChild(flashOverlay);

  return stageContainer;
}

// ============================================================
// Clear — reset all effects between dialogs
// ============================================================

export function clearEffects() {
  activeTweens = [];
  Object.values(sprites).forEach(s => {
    if (s.parent) s.parent.removeChild(s);
  });
  sprites = {};
  flashOverlay.alpha = 0; flashOverlay.visible = false;
  tintOverlay.alpha = 0; tintOverlay.visible = false;
  stageContainer.x = 0; stageContainer.y = 0;
  stageContainer.scale.set(1);
}

// ============================================================
// Play effects for a dialog line
// ============================================================

export function playEffects(effects) {
  if (!effects || !stageContainer) return;

  for (const fx of effects) {
    switch (fx.type) {
      case 'sprite': spawnSprite(fx); break;
      case 'remove': removeSprite(fx); break;
      case 'zoom':   tweenZoom(fx); break;
      case 'move':   tweenMove(fx); break;
      case 'fade':   tweenFade(fx); break;
      case 'bounce': tweenBounce(fx); break;
      case 'shake':  tweenShake(fx); break;
      case 'pan':    tweenPan(fx); break;
      case 'flash':  tweenFlash(fx); break;
      case 'tint':   tweenTint(fx); break;
    }
  }
}

// ============================================================
// Tick — call from app ticker
// ============================================================

export function tickEffects() {
  const now = performance.now();
  activeTweens = activeTweens.filter(tw => {
    const t = Math.min(1, (now - tw.start) / tw.dur);
    const e = (EASE[tw.ease] || EASE.easeOut)(t);
    tw.update(e, t);
    return t < 1;
  });
}

// ============================================================
// Effect implementations
// ============================================================

function spawnSprite(fx) {
  const id = fx.id || `_spr_${Date.now()}`;
  const spr = monster(fx.size || 100, fx.img);
  spr.x = fx.x ?? W / 2;
  spr.y = fx.y ?? H / 2 - 100;
  spr.alpha = fx.alpha ?? 1;
  if (fx.scale) spr.scale.set(fx.scale);
  // Insert before overlays (flash/tint are last children)
  const insertIdx = Math.max(0, stageContainer.children.length - 2);
  stageContainer.addChildAt(spr, insertIdx);
  sprites[id] = spr;
}

function removeSprite(fx) {
  const spr = sprites[fx.target];
  if (spr && spr.parent) spr.parent.removeChild(spr);
  delete sprites[fx.target];
}

function getTarget(fx) {
  if (fx.target === 'stage') return stageContainer;
  return sprites[fx.target] || stageContainer;
}

function addTween(dur, ease, update) {
  activeTweens.push({ start: performance.now(), dur, ease: ease || 'easeOut', update });
}

// ---- Zoom ----
function tweenZoom(fx) {
  const target = getTarget(fx);
  const from = fx.from ?? target.scale.x;
  const to = fx.to ?? 1;
  addTween(fx.dur || 500, fx.ease, (e) => {
    const s = from + (to - from) * e;
    target.scale.set(s);
  });
}

// ---- Move ----
function tweenMove(fx) {
  const target = getTarget(fx);
  const fromX = fx.fromX ?? target.x;
  const fromY = fx.fromY ?? target.y;
  const toX = fx.toX ?? target.x;
  const toY = fx.toY ?? target.y;
  addTween(fx.dur || 500, fx.ease, (e) => {
    target.x = fromX + (toX - fromX) * e;
    target.y = fromY + (toY - fromY) * e;
  });
}

// ---- Fade ----
function tweenFade(fx) {
  const target = getTarget(fx);
  const from = fx.from ?? target.alpha;
  const to = fx.to ?? 1;
  addTween(fx.dur || 400, fx.ease, (e) => {
    target.alpha = from + (to - from) * e;
  });
}

// ---- Bounce (up then settle) ----
function tweenBounce(fx) {
  const target = getTarget(fx);
  const originY = target.y;
  const h = fx.height || 20;
  addTween(fx.dur || 400, 'bounce', (e, t) => {
    target.y = originY - h * (1 - t) * Math.abs(Math.sin(t * Math.PI));
  });
}

// ---- Shake (screen or target) ----
function tweenShake(fx) {
  const target = getTarget(fx);
  const ox = target.x, oy = target.y;
  const intensity = fx.intensity || 6;
  addTween(fx.dur || 300, 'linear', (e, t) => {
    const fade = 1 - t;
    target.x = ox + (Math.random() - 0.5) * intensity * 2 * fade;
    target.y = oy + (Math.random() - 0.5) * intensity * 2 * fade;
    if (t >= 1) { target.x = ox; target.y = oy; }
  });
}

// ---- Pan (camera slide) ----
function tweenPan(fx) {
  const ox = stageContainer.x, oy = stageContainer.y;
  const dx = fx.x || 0, dy = fx.y || 0;
  addTween(fx.dur || 500, fx.ease, (e) => {
    stageContainer.x = ox + dx * e;
    stageContainer.y = oy + dy * e;
  });
}

// ---- Flash (full screen) ----
function tweenFlash(fx) {
  flashOverlay.visible = true;
  if (fx.color != null) {
    flashOverlay.clear();
    flashOverlay.rect(0, 0, W, H).fill({ color: fx.color });
  }
  addTween(fx.dur || 200, 'linear', (e) => {
    flashOverlay.alpha = e < 0.5 ? e * 2 : (1 - e) * 2;
    if (e >= 1) flashOverlay.visible = false;
  });
}

// ---- Tint (color wash overlay) ----
function tweenTint(fx) {
  tintOverlay.visible = true;
  tintOverlay.clear();
  tintOverlay.rect(0, 0, W, H).fill({ color: fx.color || 0xff0000 });
  const targetAlpha = fx.alpha ?? 0.3;
  addTween(fx.dur || 300, fx.ease, (e) => {
    tintOverlay.alpha = targetAlpha * e;
  });
}
