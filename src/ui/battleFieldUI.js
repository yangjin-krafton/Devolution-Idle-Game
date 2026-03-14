// ============================================================
// Battle Field — orchestrator (init, render, tick, VFX wrappers)
// Sub-modules: bgBuilder, environmentHud, turnSequence
// ============================================================

import { W, C, hex, addSparkles } from './theme.js';
import { monster } from './sprites.js';
import {
  playTamingEffect, playAttackEffect,
  playBondingAttempt, playBondingSuccess, playBondingFail,
  playEscapeEffect, playFaintEffect,
} from '../effects.js';
import {
  buildSun, buildMoon, buildClouds, buildDistantLayer,
  buildGroundTexture, buildGroundDeco, createWeatherParticle,
} from './bgBuilder.js';
import {
  renderEnvironmentHud, setEnemyPref,
} from './environmentHud.js';
import {
  playTurnSequence as _playTurnSequence,
  isSequencePlaying,
} from './turnSequence.js';

// ---- Danmaku log color categorization ----
const DANMAKU_COLORS = {
  attack: C.escape, taming: C.taming, reaction: C.mint, bonding: C.orange, system: C.white,
};

function classifyLog(msg) {
  if (msg.includes('공격') || msg.includes('피해') || msg.includes('휘둘') || msg.includes('들이') || msg.includes('쏘') || msg.includes('뿌'))
    return 'attack';
  if (msg.includes('교감') || msg.includes('길들') || msg.includes('부르') || msg.includes('앉') || msg.includes('손을'))
    return 'bonding';
  if (msg.includes('풀었') || msg.includes('기울') || msg.includes('다가') || msg.includes('내밀') || msg.includes('끄덕') || msg.includes('머문') || msg.includes('울린'))
    return 'reaction';
  if (msg.includes('퍼진') || msg.includes('감싼') || msg.includes('지켜') || msg.includes('온기') || msg.includes('냄새') || msg.includes('향기') || msg.includes('숨기') || msg.includes('흔들'))
    return 'taming';
  return 'system';
}

// ---- Module state ----
let container;
let refs = {};
let sparkles = [];
let danmakuItems = [];
let lastLogCount = 0;
let weatherParticles = [];

// 적 감정 파티클 시스템
let enemyMood = 'happy';
let moodParticles = [];
let moodEmitTimer = 0;
let moodFaceTimer = 0;

const MOOD_CONFIG = {
  happy:   { face: '😊', particles: ['💚', '💚', '✨', '🌿'], color: 0x00d4aa, interval: 3.0, faceInterval: 5.0 },
  neutral: { face: '😐', particles: ['💛', '...'],             color: 0xffe060, interval: 3.5, faceInterval: 4.0 },
  uneasy:  { face: '😟', particles: ['💧', '❓', '💦'],       color: 0xff8866, interval: 2.5, faceInterval: 3.0 },
  angry:   { face: '😠', particles: ['💢', '🔥', '💢', '💥'], color: 0xff4444, interval: 1.5, faceInterval: 2.0 },
  overtime:{ face: '😰', particles: ['💨', '⚡', '💢', '😱'], color: 0xff2222, interval: 1.0, faceInterval: 1.5 },
};

export function setEmotion() { /* reserved */ }

export function initBattleField(parentContainer, sharedRefs) {
  container = parentContainer;
  refs = sharedRefs;
  buildEnemyArea();
  buildAllyArea();
  buildDanmaku();
}

export function setSwitchAllyCallback() { /* 3v1 unused */ }

// ---- Enemy Area ----
function buildEnemyArea() {
  const ePlatX = W * 0.5, ePlatY = 130;

  refs.enemyShadow = new PIXI.Container();
  refs.enemyShadow.x = ePlatX; refs.enemyShadow.y = ePlatY + 50;
  refs.enemyShadowBaseY = ePlatY + 50;
  container.addChild(refs.enemyShadow);

  refs.enemySprite = new PIXI.Container();
  refs.enemySprite.x = ePlatX; refs.enemySprite.y = ePlatY;
  refs.enemyBaseY = ePlatY;
  container.addChild(refs.enemySprite);

  refs.enemyHud = new PIXI.Container();
  refs.enemyHud.x = 0; refs.enemyHud.y = 2;
  container.addChild(refs.enemyHud);
}

// ---- Ally Area ----
function buildAllyArea() {
  refs.allySlots = [];
  const positions = [
    { x: W * 0.18, y: 235, size: 88 },
    { x: W * 0.50, y: 268, size: 105 },
    { x: W * 0.82, y: 235, size: 88 },
  ];

  for (let i = 0; i < 3; i++) {
    const pos = positions[i];
    const slot = { baseX: pos.x, baseY: pos.y, size: pos.size };

    slot.shadow = new PIXI.Container();
    slot.shadow.x = pos.x; slot.shadow.y = pos.y + pos.size * 0.32;
    slot.shadowBaseY = pos.y + pos.size * 0.32;
    container.addChild(slot.shadow);

    slot.container = new PIXI.Container();
    slot.container.x = pos.x; slot.container.y = pos.y;
    container.addChild(slot.container);

    refs.allySlots.push(slot);
  }

  refs.allySprite = refs.allySlots[1].container;
  refs.allyBaseY = positions[1].y;
}

function buildDanmaku() {
  refs.danmakuLayer = new PIXI.Container();
  container.addChild(refs.danmakuLayer);
  const danmakuMask = new PIXI.Graphics();
  danmakuMask.rect(0, 0, W, 340).fill({ color: 0xffffff });
  container.addChild(danmakuMask);
  refs.danmakuLayer.mask = danmakuMask;
}

// ---- Dynamic Rendering ----

export function renderEnemy(enemy) {
  refs.enemySprite.removeChildren();
  refs.enemySprite.alpha = 1;
  refs.enemySprite.y = refs.enemyBaseY;
  refs.enemySprite.addChild(monster(140, enemy.img));

  refs.enemyShadow.removeChildren();
  const sh = monster(140, enemy.img);
  sh.scale.y = 0.25; sh.alpha = 0.18;
  if (sh.children[0]) sh.children[0].tint = 0x000000;
  refs.enemyShadow.addChild(sh);

  refs._enemyName = enemy.name;
  refs._enemyPref = enemy.environmentPreference || null;
  setEnemyPref(refs._enemyPref);
  renderEnvironmentHud(refs.enemyHud, {});
}

export function updateGauges(result) {
  renderEnvironmentHud(refs.enemyHud, result);
  _updateEnemyMood(result);
}

function _updateEnemyMood(result) {
  const phase = result.phase || 'regular';
  const matchCount = result.matchCount || 0;
  if (phase === 'overtime') enemyMood = 'overtime';
  else if (matchCount >= 5) enemyMood = 'happy';
  else if (matchCount >= 4) enemyMood = 'neutral';
  else if (matchCount >= 2) enemyMood = 'uneasy';
  else enemyMood = 'angry';
}

export function renderAlly() { /* 3v1: renderAllyTabs handles this */ }

export function renderAllyTabs(team, aggroTargetIndex, combatState, enemyPower) {
  if (!refs.allySlots) return;
  const sizes = [106, 126, 106];

  for (let i = 0; i < refs.allySlots.length; i++) {
    const slot = refs.allySlots[i];
    slot.container.removeChildren();
    slot.shadow.removeChildren();
    slot._arrow = null;

    const ally = team[i];
    if (!ally) continue;

    const size = sizes[i];
    const m = monster(size, ally.img);
    m.scale.x = -1;
    if (ally.inEgg) m.alpha = 0.4;
    slot.container.addChild(m);

    const sh = monster(size, ally.img);
    sh.scale.x = -1; sh.scale.y = 0.25;
    sh.alpha = ally.inEgg ? 0.08 : 0.15;
    if (sh.children[0]) sh.children[0].tint = 0x000000;
    slot.shadow.addChild(sh);
  }

  refs.allySprite = refs.allySlots[1].container;
}

// ---- Danmaku ----

let logQueue = [];
let logTimer = 0;
let nextLane = 0;

function spawnDanmaku(msg) {
  if (!refs.danmakuLayer) return;
  const category = classifyLog(msg);
  const color = DANMAKU_COLORS[category] || C.dim;

  const t = new PIXI.Text({ text: msg, style: {
    fontFamily: '"M PLUS Rounded 1c", "Noto Sans KR", sans-serif',
    fontSize: 22, fill: hex(color), fontWeight: 'bold',
    dropShadow: { color: '#000000', alpha: 0.5, blur: 2, distance: 1 },
  }});
  t.alpha = 0.85;

  const laneCount = Math.floor(340 / 35);
  const lane = (nextLane % laneCount) * 35 + 8;
  nextLane++;
  t.x = W + 10; t.y = lane;

  refs.danmakuLayer.addChild(t);
  danmakuItems.push({ sprite: t, speed: 0.6 + Math.random() * 0.3 });
}

export function renderLogs(logs) {
  const newLogs = logs.slice(lastLogCount);
  lastLogCount = logs.length;
  for (const msg of newLogs) logQueue.push(msg);
}

function processLogQueue() {
  const now = Date.now();
  if (logQueue.length === 0) return;
  const nextMsg = logQueue[0];
  const interval = Math.max(500, Math.min(1200, nextMsg.length * 60));
  if (now - logTimer >= interval) {
    spawnDanmaku(logQueue.shift());
    logTimer = now;
  }
}

export function resetDanmaku() {
  if (refs.danmakuLayer) refs.danmakuLayer.removeChildren();
  danmakuItems = []; lastLogCount = 0; logQueue = []; logTimer = 0;
  for (const p of moodParticles) { if (container) container.removeChild(p.sprite); p.sprite.destroy(); }
  moodParticles = []; moodEmitTimer = 0; moodFaceTimer = 0; enemyMood = 'happy';
}

// ---- Background ----

export function applyBackground(env) {
  if (refs.bgLayer) { container.removeChild(refs.bgLayer); refs.bgLayer.destroy({ children: true }); }
  if (refs.timeTint) { container.removeChild(refs.timeTint); refs.timeTint.destroy(); }

  refs.bgLayer = new PIXI.Container();
  weatherParticles = []; sparkles = [];

  const { sky, ground, time } = env;

  const bands = sky.gradient;
  const bandH = 200 / bands.length;
  for (let i = 0; i < bands.length; i++) {
    const g = new PIXI.Graphics();
    g.rect(0, i * bandH - 0.5, W, bandH + 1).fill({ color: bands[i] });
    refs.bgLayer.addChild(g);
  }
  refs.bgLayer.addChild(new PIXI.Graphics().rect(0, 93, W, 30).fill({ color: sky.horizon, alpha: 0.35 }));

  if (time.celestial === 'sun') buildSun(refs.bgLayer);
  else if (time.celestial === 'moon') buildMoon(refs.bgLayer);

  if (time.starCount > 0) {
    const starsGfx = new PIXI.Graphics();
    for (let i = 0; i < time.starCount; i++) {
      const sx = Math.random() * W, sy = Math.random() * 150;
      starsGfx.circle(sx, sy, 0.5 + Math.random() * 1.2).fill({ color: 0xffffff, alpha: 0.3 + Math.random() * 0.5 });
    }
    refs.bgLayer.addChild(starsGfx);
  }

  if (sky.clouds) buildClouds(refs.bgLayer, sky);
  buildDistantLayer(refs.bgLayer, ground);

  const curves = [
    { y0: 137, cp: 77, y1: 129, bottom: 340 },
    { y0: 149, cp: 97, y1: 141, bottom: 340 },
    { y0: 161, cp: 115, y1: 153, bottom: 340 },
  ];
  for (let i = 0; i < 3; i++) {
    const cv = curves[i];
    const hill = new PIXI.Graphics();
    hill.moveTo(0, cv.y0).quadraticCurveTo(W / 2, cv.cp, W, cv.y1)
      .lineTo(W, cv.bottom).lineTo(0, cv.bottom).closePath().fill({ color: ground.layers[i] });
    refs.bgLayer.addChild(hill);
  }
  refs.bgLayer.addChild(new PIXI.Graphics().rect(0, 217, W, 123).fill({ color: ground.flat }));

  buildGroundTexture(refs.bgLayer, ground);
  refs.bgLayer.addChild((() => { const g = new PIXI.Graphics(); g.moveTo(0, 161).quadraticCurveTo(W / 2, 115, W, 153); g.stroke({ color: 0xffffff, width: 1.5, alpha: 0.15 }); return g; })());
  buildGroundDeco(refs.bgLayer, ground);

  if (sky.particles) {
    refs.weatherLayer = new PIXI.Container();
    for (let i = 0; i < sky.particles.count; i++) weatherParticles.push(createWeatherParticle(sky.particles, refs.weatherLayer));
    refs.bgLayer.addChild(refs.weatherLayer);
  }

  sparkles = addSparkles(refs.bgLayer, 5, W, 340);

  refs.timeTint = new PIXI.Graphics();
  if (time.alpha > 0) refs.timeTint.rect(0, 0, W, 340).fill({ color: time.tint, alpha: time.alpha });

  container.addChildAt(refs.bgLayer, 0);
  container.addChildAt(refs.timeTint, Math.min(1, container.children.length));
}

// ---- Enemy Mood Particles ----

// Cache emoji textures to avoid costly PIXI.Text creation each frame
const _emojiTexCache = {};
function _getEmojiTex(emoji, fontSize) {
  const key = emoji + '|' + fontSize;
  if (_emojiTexCache[key]) return _emojiTexCache[key];
  const t = new PIXI.Text({ text: emoji, style: { fontFamily: '"M PLUS Rounded 1c", "Noto Sans KR", sans-serif', fontSize, fill: '#ffffff' }});
  const tex = PIXI.RenderTexture.create({ width: Math.ceil(t.width) + 2, height: Math.ceil(t.height) + 2 });
  // Can't use app.renderer here, draw to canvas instead
  _emojiTexCache[key] = t;  // keep the Text object, but reuse via Sprite clone
  return t.texture;
}

function _spawnMoodParticle(emoji, x, y) {
  if (!container) return;
  const fontSize = 20 + Math.floor(Math.random() * 3) * 5;  // 20, 25, or 30 (3 sizes only)
  const key = emoji + '|' + fontSize;
  if (!_emojiTexCache[key]) {
    _emojiTexCache[key] = new PIXI.Text({ text: emoji, style: { fontFamily: '"M PLUS Rounded 1c", "Noto Sans KR", sans-serif', fontSize, fill: '#ffffff' }});
  }
  const src = _emojiTexCache[key];
  const s = new PIXI.Sprite(src.texture);
  s.anchor.set(0.5); s.x = x + (Math.random() - 0.5) * 60; s.y = y - 20 - Math.random() * 20; s.alpha = 0.9;
  container.addChild(s);
  moodParticles.push({ sprite: s, vx: (Math.random() - 0.5) * 0.5, vy: -0.3 - Math.random() * 0.3, life: 1.5 + Math.random() * 0.5, age: 0 });
}

function _spawnFaceEmoji(emoji, x, y) {
  if (!container) return;
  const key = emoji + '|36';
  if (!_emojiTexCache[key]) {
    _emojiTexCache[key] = new PIXI.Text({ text: emoji, style: { fontFamily: '"M PLUS Rounded 1c", "Noto Sans KR", sans-serif', fontSize: 36, fill: '#ffffff' }});
  }
  const src = _emojiTexCache[key];
  const s = new PIXI.Sprite(src.texture);
  s.anchor.set(0.5); s.x = x + 30; s.y = y - 50; s.alpha = 0;
  container.addChild(s);
  moodParticles.push({ sprite: s, vx: 0, vy: -0.15, life: 2.0, age: 0, isFace: true });
}

function _tickEnemyMood() {
  const dt = 0.016;
  const cfg = MOOD_CONFIG[enemyMood] || MOOD_CONFIG.happy;
  const ex = refs.enemySprite?.x ?? W * 0.5;
  const ey = refs.enemySprite?.y ?? 130;

  moodEmitTimer -= dt;
  if (moodEmitTimer <= 0) {
    _spawnMoodParticle(cfg.particles[Math.floor(Math.random() * cfg.particles.length)], ex, ey);
    moodEmitTimer = cfg.interval * (0.7 + Math.random() * 0.6);
  }
  moodFaceTimer -= dt;
  if (moodFaceTimer <= 0) {
    _spawnFaceEmoji(cfg.face, ex, ey);
    moodFaceTimer = cfg.faceInterval * (0.8 + Math.random() * 0.4);
  }

  for (let i = moodParticles.length - 1; i >= 0; i--) {
    const p = moodParticles[i];
    p.age += dt; p.sprite.x += p.vx; p.sprite.y += p.vy;
    if (p.isFace) {
      const fi = Math.min(1, p.age / 0.3), fo = Math.max(0, 1 - (p.age - p.life + 0.5) / 0.5);
      p.sprite.alpha = Math.min(fi, fo) * 0.85; p.sprite.scale.set(0.8 + fi * 0.2);
    } else {
      p.sprite.alpha = Math.max(0, 0.9 * (1 - p.age / p.life));
      p.sprite.scale.set(0.6 + (1 - p.age / p.life) * 0.4);
    }
    if (p.age >= p.life) { container.removeChild(p.sprite); p.sprite.destroy(); moodParticles.splice(i, 1); }
  }
}

// ---- Turn Sequence (delegates to turnSequence.js) ----

export { isSequencePlaying };

export function playTurnSequence(steps, onComplete) {
  _playTurnSequence(steps, { container, refs }, onComplete);
}

// ---- VFX Wrappers ----

export function shakeEnemy() {
  if (!refs.enemySprite) return;
  const baseX = refs.enemySprite.x;
  let frame = 0;
  const id = setInterval(() => {
    refs.enemySprite.x = baseX + (frame % 2 === 0 ? 4 : -4);
    frame++;
    if (frame > 6) { clearInterval(id); refs.enemySprite.x = baseX; }
  }, 40);
}

export function triggerTamingVFX(axis, isGood) { playTamingEffect(axis, isGood); }
export function triggerAttackVFX() { playAttackEffect(refs.allySprite); }
export function triggerBondingAttemptVFX() { playBondingAttempt(); }
export function triggerBondingSuccessVFX() { playBondingSuccess(); }
export function triggerBondingFailVFX() { playBondingFail(); }
export function triggerEscapeVFX() { playEscapeEffect(refs.enemySprite); }
export function triggerFaintVFX() { playFaintEffect(refs.allySprite); }

// ---- Animation Tick ----

export function tickBattleField(tick) {
  processLogQueue();
  _tickEnemyMood();
  const bounce = Math.sin(tick * 3);

  if (!isSequencePlaying()) {
    if (refs.enemySprite && refs.enemyBaseY != null) {
      refs.enemySprite.y = refs.enemyBaseY + bounce * 4;
      refs.enemySprite.scale.set(1 + Math.sin(tick * 3) * 0.02, 1 - Math.sin(tick * 3) * 0.02);
      if (refs.enemyShadow) {
        refs.enemyShadow.scale.x = 1 + Math.sin(tick * 3) * 0.02;
        refs.enemyShadow.y = refs.enemyShadowBaseY + bounce * 1.5;
      }
    }
    if (refs.allySlots) {
      refs.allySlots.forEach((slot, i) => {
        const phase = tick * 3 + i * 0.7;
        slot.container.y = slot.baseY - Math.sin(phase) * 3;
        slot.container.scale.set(1 - Math.sin(phase) * 0.015, 1 + Math.sin(phase) * 0.015);
        slot.shadow.scale.x = 1 - Math.sin(phase) * 0.015;
        slot.shadow.y = slot.shadowBaseY - Math.sin(phase) * 1.2;
        if (slot._arrow && slot._arrow._baseY != null) slot._arrow.y = slot._arrow._baseY + Math.sin(tick * 5) * 3;
      });
    }
  }

  sparkles.forEach(s => { s.g.alpha = 0.1 + Math.sin(tick * s.speed * 5 + s.phase) * 0.15; });

  for (const p of weatherParticles) {
    if (p.type === 'rain') { p.g.y += p.speed * 2; p.g.x -= 0.3; if (p.g.y > 340) { p.g.y = -10; p.g.x = Math.random() * W; } }
    else if (p.type === 'snow') { p.g.y += p.speed * 0.5; p.g.x += Math.sin(tick * 2 + p.phase) * 0.3; if (p.g.y > 340) { p.g.y = -5; p.g.x = Math.random() * W; } }
    else if (p.type === 'ember') { p.g.y -= p.speed * 0.4; p.g.x += Math.sin(tick * 3 + p.phase) * 0.5; p.g.alpha = 0.3 + Math.sin(tick * 4 + p.phase) * 0.3; if (p.g.y < -10) { p.g.y = 340; p.g.x = Math.random() * W; } }
    else if (p.type === 'leaf') { p.g.x -= p.speed * 1.5; p.g.y += Math.sin(tick * 3 + p.phase) * 0.8; p.g.rotation = tick * 2 + p.phase; if (p.g.x < -20) { p.g.x = W + 10; p.g.y = Math.random() * 300; } }
  }

  for (let i = danmakuItems.length - 1; i >= 0; i--) {
    const d = danmakuItems[i];
    d.sprite.x -= d.speed * 1.2;
    if (d.sprite.x < 60) d.sprite.alpha = Math.max(0, d.sprite.alpha - 0.03);
    if (d.sprite.x < -400 || d.sprite.alpha <= 0) { refs.danmakuLayer.removeChild(d.sprite); d.sprite.destroy(); danmakuItems.splice(i, 1); }
  }
}
