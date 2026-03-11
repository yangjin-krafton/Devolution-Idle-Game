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
let bgLayer = null;           // gradient background layer

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

  // Gradient background layer (behind everything)
  bgLayer = new PIXI.Container();
  bgLayer.visible = false;
  stageContainer.addChildAt(bgLayer, 0);

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
  bgLayer.removeChildren(); bgLayer.visible = false;
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
      case 'bg':     setBg(fx); break;
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

// ---- Background gradient (Pokemon-style) ----
// { type: 'bg', colors: [topColor, bottomColor] }
// { type: 'bg', colors: [top, mid, bottom] }  — 3-stop gradient
// { type: 'bg', preset: 'dark' | 'fire' | 'ice' | 'poison' | 'electric' | 'forest' | 'ocean' | 'night' | 'dawn' }
const BG_PRESETS = {
  // 기본
  dark:     [0x0a0a1e, 0x1a1a3e, 0x0d0d22],
  light:    [0x3a4466, 0x556688, 0x445577],

  // 시간대
  day:      [0x4488cc, 0x66aadd, 0x88ccee],
  night:    [0x05051a, 0x10103a, 0x080822],
  dawn:     [0x2a1530, 0x553344, 0xff8855],
  sunset:   [0x1a0a22, 0x662244, 0xff6633],
  twilight: [0x110a2a, 0x331a55, 0x221144],

  // 날씨
  rain:     [0x1a2233, 0x2a3344, 0x1a2838],
  snow:     [0x3a4455, 0x556677, 0x667788],
  storm:    [0x0a0a1a, 0x222244, 0x111133],
  wind:     [0x2a3344, 0x445566, 0x334455],
  fog:      [0x3a3a44, 0x555566, 0x444455],

  // 지형
  forest:   [0x0a1a0d, 0x1a3322, 0x0d2215],
  ocean:    [0x0a0a2e, 0x102244, 0x0d1530],
  cave:     [0x0a0a0f, 0x1a1a22, 0x0d0d15],
  lava:     [0x1a0500, 0x441100, 0x2a0800],
  swamp:    [0x0d1a0a, 0x1a2a11, 0x112208],
  mountain: [0x2a2a33, 0x445566, 0x334455],
  desert:   [0x3a2a10, 0x554422, 0x443316],
  space:    [0x000008, 0x0a0a22, 0x000010],
  ruins:    [0x1a1a1a, 0x2a2a2e, 0x1a1a20],

  // 속성
  fire:     [0x1a0500, 0x441100, 0x2a0800],
  ice:      [0x0a1a2e, 0x1a3a5e, 0x0e2240],
  poison:   [0x0a1a0a, 0x1a3a1a, 0x0d220d],
  electric: [0x1a1a00, 0x3a3a10, 0x22220a],
  shadow:   [0x080810, 0x15152a, 0x0a0a18],
  crystal:  [0x1a2233, 0x334466, 0x223355],
  spirit:   [0x1a0a22, 0x331a44, 0x220d33],
};

function setBg(fx) {
  bgLayer.removeChildren();

  let colors;
  if (fx.preset && BG_PRESETS[fx.preset]) {
    colors = BG_PRESETS[fx.preset];
  } else if (fx.colors) {
    colors = fx.colors;
  } else {
    colors = BG_PRESETS.dark;
  }

  // Draw gradient using horizontal strips
  const strips = 32;
  const stripH = Math.ceil(H / strips);
  const g = new PIXI.Graphics();

  for (let i = 0; i < strips; i++) {
    const t = i / (strips - 1);
    const color = lerpGradient(colors, t);
    g.rect(0, i * stripH, W, stripH + 1).fill({ color });
  }

  bgLayer.addChild(g);
  bgLayer.alpha = 0;
  bgLayer.visible = true;

  // Fade in
  addTween(fx.dur || 500, fx.ease || 'easeOut', (e) => {
    bgLayer.alpha = e;
  });
}

function lerpGradient(colors, t) {
  if (colors.length === 2) return lerpColor(colors[0], colors[1], t);
  // 3+ stop gradient
  const segments = colors.length - 1;
  const seg = Math.min(Math.floor(t * segments), segments - 1);
  const localT = (t * segments) - seg;
  return lerpColor(colors[seg], colors[seg + 1], localT);
}

function lerpColor(a, b, t) {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}
