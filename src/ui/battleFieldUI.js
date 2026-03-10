// ============================================================
// Battle Field — background, enemy/ally sprites, danmaku, party bar, VFX, tick
// ============================================================

import { W, C, hex, lbl, addSparkles } from './theme.js';
import { monster } from './sprites.js';
import {
  playTamingEffect, playAttackEffect,
  playBondingAttempt, playBondingSuccess, playBondingFail,
  playEscapeEffect, playFaintEffect,
} from '../effects.js';

// Mood tag system — maps taming/escape percentages to visible mood
const MOOD_TAGS = [
  { tag: '경계',  color: C.dim,      check: (t, e) => t < 20 && e < 30 },
  { tag: '긴장',  color: C.escape,   check: (t, e) => e >= 60 },
  { tag: '불안',  color: C.orange,   check: (t, e) => e >= 30 && t < 40 },
  { tag: '의심',  color: C.lavender, check: (t, e) => t >= 20 && t < 50 && e < 30 },
  { tag: '관심',  color: C.taming,   check: (t, e) => t >= 50 && t < 75 && e < 40 },
  { tag: '호감',  color: C.mint,     check: (t, e) => t >= 75 && e < 50 },
  { tag: '친근',  color: C.pink,     check: (t, e) => t >= 90 },
];

function getMoodTag(tamingPct, escapePct) {
  for (const m of MOOD_TAGS) {
    if (m.check(tamingPct, escapePct)) return m;
  }
  return { tag: '경계', color: C.dim };
}

// Danmaku log color categorization
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
let currentEmotion = null;

export function setEmotion(emotion) { currentEmotion = emotion; }

export function initBattleField(parentContainer, sharedRefs) {
  container = parentContainer;
  refs = sharedRefs;
  buildEnemyArea();
  buildAllyArea();
  buildDanmaku();
}

export function setSwitchAllyCallback() { /* 3v1 구조에서는 미사용 */ }

// ---- Enemy Area (상단 중앙) ----
function buildEnemyArea() {
  const ePlatX = W * 0.5, ePlatY = 130;

  refs.enemyShadow = new PIXI.Graphics();
  refs.enemyShadow.ellipse(ePlatX, ePlatY + 50, 40, 12).fill({ color: 0x000000, alpha: 0.15 });
  container.addChild(refs.enemyShadow);

  refs.enemySprite = new PIXI.Container();
  refs.enemySprite.x = ePlatX; refs.enemySprite.y = ePlatY;
  refs.enemyBaseY = ePlatY;
  container.addChild(refs.enemySprite);

  // HUD — 좌상단 컴팩트 패널 (적 가리지 않음)
  refs.enemyHud = new PIXI.Container();
  refs.enemyHud.x = 8; refs.enemyHud.y = 6;
  container.addChild(refs.enemyHud);
}

// ---- Ally Area (하단 좌/중/우 — 적을 둘러싸는 배치) ----
function buildAllyArea() {
  refs.allySlots = [];
  const positions = [
    { x: W * 0.18, y: 215, size: 88 },    // 좌 (적 옆 포위)
    { x: W * 0.50, y: 290, size: 105 },   // 중앙 (약간 뒤)
    { x: W * 0.82, y: 215, size: 88 },    // 우 (적 옆 포위)
  ];

  for (let i = 0; i < 3; i++) {
    const pos = positions[i];
    const slot = { baseX: pos.x, baseY: pos.y, size: pos.size };

    slot.shadow = new PIXI.Graphics();
    slot.shadow.ellipse(pos.x, pos.y + pos.size * 0.32, pos.size * 0.22, 7).fill({ color: 0x000000, alpha: 0.12 });
    container.addChild(slot.shadow);

    slot.container = new PIXI.Container();
    slot.container.x = pos.x; slot.container.y = pos.y;
    container.addChild(slot.container);

    refs.allySlots.push(slot);
  }

  // VFX compatibility — default to center ally
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

const SENSORY_ICONS = {
  sound: { icon: '🔊', label: '소리', color: 0x88bbff },
  temperature: { icon: '🌡️', label: '온도', color: 0xffaa77 },
  smell: { icon: '🌿', label: '냄새', color: 0x88cc88 },
  behavior: { icon: '👁️', label: '행동', color: 0xccaaee },
};

export function renderEnemy(enemy) {
  refs.enemySprite.removeChildren();
  refs.enemySprite.addChild(monster(140, enemy.img));

  refs.enemyLevel = Math.max(1, Math.round(enemy.tamingThreshold / 10));
  refs._enemyName = enemy.name;
  refs._enemySensory = enemy.sensoryType || [];

  _renderEnemyHud(0, 0);
}

function _renderEnemyHud(tamingPct, escapePct) {
  if (!refs.enemyHud) return;
  refs.enemyHud.removeChildren();

  const hasEmotion = !!currentEmotion;
  const hasSensory = refs._enemySensory && refs._enemySensory.length > 0;
  const sensoryRowH = hasSensory ? 16 : 0;
  const pw = 200, ph = (hasEmotion ? 82 : 68) + sensoryRowH, bw = 120;
  const mood = getMoodTag(tamingPct, escapePct);

  // 패널 배경 — 둥근 다크 카드
  const bg = new PIXI.Graphics();
  bg.roundRect(0, 0, pw, ph, 14).fill({ color: 0x1a1a2e, alpha: 0.9 });
  bg.roundRect(0, 0, pw, ph, 14).stroke({ color: 0x333355, width: 1 });
  // 좌측 무드 컬러 바
  bg.roundRect(0, 6, 3, ph - 12, 1.5).fill({ color: mood.color, alpha: 0.8 });
  refs.enemyHud.addChild(bg);

  // 1행: 이름 + 무드 pill
  const nameL = lbl(refs._enemyName || '???', 7, 0xeeeeff, true);
  nameL.x = 10; nameL.y = 5;
  refs.enemyHud.addChild(nameL);

  const moodPill = new PIXI.Graphics();
  moodPill.roundRect(pw - 52, 6, 44, 14, 7).fill({ color: mood.color, alpha: 0.2 });
  moodPill.roundRect(pw - 52, 6, 44, 14, 7).stroke({ color: mood.color, width: 0.5, alpha: 0.5 });
  refs.enemyHud.addChild(moodPill);
  const moodL = lbl(mood.tag, 5, mood.color, true);
  moodL.anchor = { x: 0.5, y: 0.5 }; moodL.x = pw - 30; moodL.y = 13;
  refs.enemyHud.addChild(moodL);

  // 2행 (NEW): 감각 타입 힌트 — 적이 민감한 감각을 보여줌
  let rowOffset = 0;
  if (hasSensory) {
    rowOffset = sensoryRowH;
    let sx = 10;
    for (const sType of refs._enemySensory) {
      const info = SENSORY_ICONS[sType];
      if (!info) continue;
      const pill = new PIXI.Graphics();
      const pillW = 42;
      pill.roundRect(sx, 22, pillW, 12, 6).fill({ color: info.color, alpha: 0.15 });
      pill.roundRect(sx, 22, pillW, 12, 6).stroke({ color: info.color, width: 0.5, alpha: 0.4 });
      refs.enemyHud.addChild(pill);
      const sL = lbl(`${info.icon}${info.label}`, 4.5, info.color, true);
      sL.anchor = { x: 0.5, y: 0.5 }; sL.x = sx + pillW / 2; sL.y = 28;
      refs.enemyHud.addChild(sL);
      sx += pillW + 4;
    }
  }

  // 3행: 💫 순화 바
  const tamY = 24 + rowOffset;
  refs.enemyHud.addChild(Object.assign(lbl('💫', 5, 0x00d4aa), { x: 8, y: tamY }));
  const tamBar = new PIXI.Graphics();
  tamBar.roundRect(24, tamY + 2, bw, 8, 4).fill({ color: 0x333355 });
  if (tamingPct > 0) tamBar.roundRect(24, tamY + 2, Math.max(8, bw * tamingPct / 100), 8, 4).fill({ color: 0x00d4aa });
  refs.enemyHud.addChild(tamBar);
  const tamL = lbl(tamingPct + '%', 5, 0xaaccbb, true);
  tamL.x = 24 + bw + 4; tamL.y = tamY;
  refs.enemyHud.addChild(tamL);

  // 4행: 💨 도주 바
  const escY = 40 + rowOffset;
  refs.enemyHud.addChild(Object.assign(lbl('💨', 5, 0xff6b6b), { x: 8, y: escY }));
  const escCol = escapePct >= 70 ? 0xff4444 : 0xff6b6b;
  const escBar = new PIXI.Graphics();
  escBar.roundRect(24, escY + 2, bw, 8, 4).fill({ color: 0x333355 });
  if (escapePct > 0) escBar.roundRect(24, escY + 2, Math.max(8, bw * escapePct / 100), 8, 4).fill({ color: escCol });
  refs.enemyHud.addChild(escBar);
  const escL = lbl(escapePct + '%', 5, escapePct >= 70 ? 0xff6666 : 0xccaaaa, true);
  escL.x = 24 + bw + 4; escL.y = escY;
  refs.enemyHud.addChild(escL);

  // 5행: 감정 상태 (있을 때만)
  let bottomY = 55 + rowOffset;
  if (currentEmotion) {
    const emoText = `${currentEmotion.icon} ${currentEmotion.name}`;
    const turnsText = currentEmotion.turns > 0 ? ` (${currentEmotion.turnsLeft}턴)` : '';
    const emoPill = new PIXI.Graphics();
    emoPill.roundRect(8, bottomY, pw - 16, 14, 7).fill({ color: currentEmotion.color, alpha: 0.15 });
    emoPill.roundRect(8, bottomY, pw - 16, 14, 7).stroke({ color: currentEmotion.color, width: 0.5, alpha: 0.4 });
    refs.enemyHud.addChild(emoPill);
    const emoL = lbl(emoText + turnsText, 5, currentEmotion.color, true);
    emoL.anchor = { x: 0.5, y: 0.5 }; emoL.x = pw / 2; emoL.y = bottomY + 7;
    refs.enemyHud.addChild(emoL);
    bottomY += 15;
  }

  // 하단: 턴 번호
  const turnL = lbl(`Turn ${refs._turn || 0}`, 4, 0x666688);
  turnL.x = 10; turnL.y = bottomY;
  refs.enemyHud.addChild(turnL);
}

export function updateGauges(tamingPercent, escapePercent, turn) {
  if (turn != null) refs._turn = turn;
  _renderEnemyHud(tamingPercent, escapePercent);
}

export function renderAlly() {
  // 3v1 구조: renderAllyTabs에서 3마리 일괄 렌더링
}

export function renderAllyTabs(team, aggroTargetIndex, combatState, enemyPower) {
  if (!refs.allySlots) return;
  const sizes = [88, 105, 88];

  for (let i = 0; i < refs.allySlots.length; i++) {
    const slot = refs.allySlots[i];
    slot.container.removeChildren();
    slot._arrow = null;

    const ally = team[i];
    if (!ally) continue;

    const size = sizes[i];
    const m = monster(size, ally.img);
    m.scale.x = -1;
    if (ally.hp <= 0) m.alpha = 0.3;
    if (ally.inEgg) m.alpha = 0.4;
    slot.container.addChild(m);

    // HP bar — 스위치 스타일 다크 바
    const barW = size * 0.55;
    const barY = -size * 0.42;
    const hpRatio = ally.hp / ally.maxHp;
    const hpBg = new PIXI.Graphics();
    hpBg.roundRect(-barW / 2 - 1, barY - 1, barW + 2, 10, 5)
      .fill({ color: 0x1a1a2e, alpha: 0.8 });
    hpBg.roundRect(-barW / 2, barY, barW, 8, 4)
      .fill({ color: 0x333355 });
    if (hpRatio > 0) {
      const hpCol = hpRatio > 0.3 ? 0x00d4aa : 0xff6b6b;
      hpBg.roundRect(-barW / 2, barY, Math.max(8, barW * hpRatio), 8, 4)
        .fill({ color: hpCol });
    }
    slot.container.addChild(hpBg);

    // 어그로 타겟 — HP바 위에 ⚔️ 표시
    if (i === aggroTargetIndex && combatState === 'active' && ally.hp > 0) {
      const dmg = enemyPower || 0;
      const tag = lbl(`⚔️ ${dmg}`, 8, 0xff6b6b, true);
      tag.anchor.set(0.5, 1);
      tag.x = 0;
      tag.y = barY - 4;
      tag._baseY = barY - 4;
      slot.container.addChild(tag);
      slot._arrow = tag;
    }
  }

  refs.allySprite = refs.allySlots[1].container;
}

// ---- Danmaku (큐 방식 순차 출력) ----

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

  // 배틀필드 전체 높이 사용, 레인 간격 35px
  const laneCount = Math.floor(340 / 35);
  const lane = (nextLane % laneCount) * 35 + 8;
  nextLane++;
  t.x = W + 10;
  t.y = lane;

  refs.danmakuLayer.addChild(t);
  danmakuItems.push({ sprite: t, speed: 0.6 + Math.random() * 0.3 });
}

export function renderLogs(logs) {
  const newLogs = logs.slice(lastLogCount);
  lastLogCount = logs.length;
  for (const msg of newLogs) {
    logQueue.push(msg);
  }
}

function processLogQueue() {
  const now = Date.now();
  if (logQueue.length === 0) return;
  // 간격: 글자 수 기반 (긴 문장은 더 오래 표시)
  const nextMsg = logQueue[0];
  const interval = Math.max(500, Math.min(1200, nextMsg.length * 60));
  if (now - logTimer >= interval) {
    spawnDanmaku(logQueue.shift());
    logTimer = now;
  }
}

export function resetDanmaku() {
  if (refs.danmakuLayer) refs.danmakuLayer.removeChildren();
  danmakuItems = [];
  lastLogCount = 0;
  logQueue = [];
  logTimer = 0;
}

// ---- Background ----

export function applyBackground(env) {
  if (refs.bgLayer) { container.removeChild(refs.bgLayer); refs.bgLayer.destroy({ children: true }); }
  if (refs.timeTint) { container.removeChild(refs.timeTint); refs.timeTint.destroy(); }

  refs.bgLayer = new PIXI.Container();
  weatherParticles = [];
  sparkles = [];

  const { sky, ground, time } = env;

  // SKY gradient
  const bands = sky.gradient;
  const bandH = 200 / bands.length;
  for (let i = 0; i < bands.length; i++) {
    const g = new PIXI.Graphics();
    g.rect(0, i * bandH - 0.5, W, bandH + 1).fill({ color: bands[i] });
    refs.bgLayer.addChild(g);
  }
  const horizonGlow = new PIXI.Graphics();
  horizonGlow.rect(0, 93, W, 30).fill({ color: sky.horizon, alpha: 0.35 });
  refs.bgLayer.addChild(horizonGlow);

  if (time.celestial === 'sun') buildSun(refs.bgLayer);
  else if (time.celestial === 'moon') buildMoon(refs.bgLayer);

  if (time.starCount > 0) {
    const starsGfx = new PIXI.Graphics();
    for (let i = 0; i < time.starCount; i++) {
      const sx = Math.random() * W, sy = Math.random() * 150;
      const sr = 0.5 + Math.random() * 1.2;
      starsGfx.circle(sx, sy, sr).fill({ color: 0xffffff, alpha: 0.3 + Math.random() * 0.5 });
    }
    refs.bgLayer.addChild(starsGfx);
  }

  if (sky.clouds) buildClouds(refs.bgLayer, sky);
  buildDistantLayer(refs.bgLayer, ground);

  // GROUND layers
  const curves = [
    { y0: 137, cp: 77, y1: 129, bottom: 340 },
    { y0: 149, cp: 97, y1: 141, bottom: 340 },
    { y0: 161, cp: 115, y1: 153, bottom: 340 },
  ];
  for (let i = 0; i < 3; i++) {
    const cv = curves[i];
    const hill = new PIXI.Graphics();
    hill.moveTo(0, cv.y0).quadraticCurveTo(W / 2, cv.cp, W, cv.y1)
      .lineTo(W, cv.bottom).lineTo(0, cv.bottom).closePath()
      .fill({ color: ground.layers[i] });
    refs.bgLayer.addChild(hill);
  }
  refs.bgLayer.addChild(new PIXI.Graphics().rect(0, 217, W, 123).fill({ color: ground.flat }));

  buildGroundTexture(refs.bgLayer, ground);

  const edgeHL = new PIXI.Graphics();
  edgeHL.moveTo(0, 161).quadraticCurveTo(W / 2, 115, W, 153);
  edgeHL.stroke({ color: 0xffffff, width: 1.5, alpha: 0.15 });
  refs.bgLayer.addChild(edgeHL);

  buildGroundDeco(refs.bgLayer, ground);

  if (sky.particles) {
    refs.weatherLayer = new PIXI.Container();
    const p = sky.particles;
    for (let i = 0; i < p.count; i++) {
      weatherParticles.push(createWeatherParticle(p, refs.weatherLayer));
    }
    refs.bgLayer.addChild(refs.weatherLayer);
  }

  sparkles = addSparkles(refs.bgLayer, 5, W, 340);

  refs.timeTint = new PIXI.Graphics();
  if (time.alpha > 0) {
    refs.timeTint.rect(0, 0, W, 340).fill({ color: time.tint, alpha: time.alpha });
  }

  container.addChildAt(refs.bgLayer, 0);
  const tintIdx = Math.min(1, container.children.length);
  container.addChildAt(refs.timeTint, tintIdx);
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
  const bounce = Math.sin(tick * 3);
  if (refs.enemySprite && refs.enemyBaseY != null) {
    refs.enemySprite.y = refs.enemyBaseY + bounce * 4;
    refs.enemySprite.scale.set(1 + Math.sin(tick * 3) * 0.02, 1 - Math.sin(tick * 3) * 0.02);
  }
  if (refs.allySlots) {
    refs.allySlots.forEach((slot, i) => {
      const phase = tick * 3 + i * 0.7;
      slot.container.y = slot.baseY - Math.sin(phase) * 3;
      slot.container.scale.set(1 - Math.sin(phase) * 0.015, 1 + Math.sin(phase) * 0.015);
      // Bounce the aggro arrow (offset from base position)
      if (slot._arrow && slot._arrow._baseY != null) {
        slot._arrow.y = slot._arrow._baseY + Math.sin(tick * 5) * 3;
      }
    });
  }
  sparkles.forEach(s => {
    s.g.alpha = 0.1 + Math.sin(tick * s.speed * 5 + s.phase) * 0.15;
  });

  // Weather particles
  for (const p of weatherParticles) {
    if (p.type === 'rain') {
      p.g.y += p.speed * 2; p.g.x -= 0.3;
      if (p.g.y > 340) { p.g.y = -10; p.g.x = Math.random() * W; }
    } else if (p.type === 'snow') {
      p.g.y += p.speed * 0.5; p.g.x += Math.sin(tick * 2 + p.phase) * 0.3;
      if (p.g.y > 340) { p.g.y = -5; p.g.x = Math.random() * W; }
    } else if (p.type === 'ember') {
      p.g.y -= p.speed * 0.4; p.g.x += Math.sin(tick * 3 + p.phase) * 0.5;
      p.g.alpha = 0.3 + Math.sin(tick * 4 + p.phase) * 0.3;
      if (p.g.y < -10) { p.g.y = 340; p.g.x = Math.random() * W; }
    } else if (p.type === 'leaf') {
      p.g.x -= p.speed * 1.5; p.g.y += Math.sin(tick * 3 + p.phase) * 0.8;
      p.g.rotation = tick * 2 + p.phase;
      if (p.g.x < -20) { p.g.x = W + 10; p.g.y = Math.random() * 300; }
    }
  }

  // Danmaku scroll
  for (let i = danmakuItems.length - 1; i >= 0; i--) {
    const d = danmakuItems[i];
    d.sprite.x -= d.speed * 1.2;
    if (d.sprite.x < 60) d.sprite.alpha = Math.max(0, d.sprite.alpha - 0.03);
    if (d.sprite.x < -400 || d.sprite.alpha <= 0) {
      refs.danmakuLayer.removeChild(d.sprite);
      d.sprite.destroy();
      danmakuItems.splice(i, 1);
    }
  }
}

// ============================================================
// Background helpers (private)
// ============================================================

function buildSun(layer) {
  const sx = W * 0.82, sy = 38;
  const g = new PIXI.Graphics();
  g.circle(sx, sy, 28).fill({ color: 0xffee88, alpha: 0.15 });
  g.circle(sx, sy, 20).fill({ color: 0xffee88, alpha: 0.25 });
  g.circle(sx, sy, 13).fill({ color: 0xffdd55 });
  g.circle(sx, sy, 10).fill({ color: 0xffee99 });
  g.circle(sx - 3, sy - 3, 4).fill({ color: 0xfffff0, alpha: 0.6 });
  layer.addChild(g);
}

function buildMoon(layer) {
  const mx = W * 0.78, my = 42;
  const g = new PIXI.Graphics();
  g.circle(mx, my, 24).fill({ color: 0xccccff, alpha: 0.12 });
  g.circle(mx, my, 16).fill({ color: 0xccccff, alpha: 0.2 });
  g.circle(mx, my, 11).fill({ color: 0xeeeeff });
  g.circle(mx + 5, my - 2, 9).fill({ color: 0x222244, alpha: 0.25 });
  g.circle(mx - 3, my + 2, 2).fill({ color: 0xccccdd, alpha: 0.4 });
  g.circle(mx + 1, my - 4, 1.5).fill({ color: 0xccccdd, alpha: 0.3 });
  layer.addChild(g);
}

function buildClouds(layer, sky) {
  const style = sky.clouds;
  const isHeavy = style === 'heavy';
  const isStreaky = style === 'streaky';

  const defs = isHeavy
    ? [{ x: 40, y: 35, s: 1.4 }, { x: 150, y: 20, s: 1.1 }, { x: 280, y: 30, s: 1.6 }, { x: 400, y: 18, s: 1.2 }, { x: 460, y: 40, s: 0.9 }]
    : [{ x: 70, y: 38, s: 1.0 }, { x: 240, y: 22, s: 1.4 }, { x: 420, y: 48, s: 0.9 }];

  if (isStreaky) {
    const wisps = [
      { x: 20, y: 30, w: 120 }, { x: 180, y: 18, w: 100 },
      { x: 320, y: 42, w: 140 }, { x: 440, y: 28, w: 80 },
    ];
    for (const ws of wisps) {
      const g = new PIXI.Graphics();
      g.roundRect(ws.x, ws.y, ws.w, 6, 3).fill({ color: 0xffffff, alpha: 0.4 });
      g.roundRect(ws.x + 10, ws.y + 4, ws.w * 0.7, 4, 2).fill({ color: 0xffffff, alpha: 0.25 });
      layer.addChild(g);
    }
    return;
  }

  const baseAlpha = isHeavy ? 0.5 : 0.55;
  for (const cl of defs) {
    const g = new PIXI.Graphics();
    const s = cl.s;
    g.ellipse(cl.x, cl.y + 8 * s, 28 * s, 8 * s).fill({ color: 0x000000, alpha: 0.03 });
    const circles = [
      { dx: 0, dy: 0, r: 18 }, { dx: -20, dy: 4, r: 13 }, { dx: 18, dy: 3, r: 14 },
      { dx: -10, dy: -6, r: 12 }, { dx: 10, dy: -5, r: 13 },
      { dx: -28, dy: 6, r: 9 }, { dx: 26, dy: 5, r: 10 },
    ];
    for (const c of circles) {
      g.circle(cl.x + c.dx * s, cl.y + c.dy * s, c.r * s).fill({ color: 0xffffff, alpha: baseAlpha });
    }
    g.circle(cl.x - 4 * s, cl.y - 6 * s, 8 * s).fill({ color: 0xffffff, alpha: baseAlpha + 0.15 });
    layer.addChild(g);
  }
}

function buildDistantLayer(layer, ground) {
  const g = new PIXI.Graphics();
  const col = ground.distant;
  if (ground.id === 'asphalt') {
    const buildings = [
      { x: 30, w: 25, h: 35 }, { x: 70, w: 18, h: 50 }, { x: 100, w: 30, h: 28 },
      { x: 160, w: 15, h: 55 }, { x: 190, w: 35, h: 32 }, { x: 250, w: 20, h: 45 },
      { x: 290, w: 28, h: 38 }, { x: 340, w: 15, h: 60 }, { x: 370, w: 30, h: 30 },
      { x: 420, w: 22, h: 42 }, { x: 455, w: 18, h: 35 },
    ];
    for (const b of buildings) g.rect(b.x, 127 - b.h, b.w, b.h + 10).fill({ color: col, alpha: 0.25 });
  } else if (ground.id === 'sea') {
    g.ellipse(80, 125, 40, 8).fill({ color: col, alpha: 0.2 });
    g.ellipse(350, 122, 55, 10).fill({ color: col, alpha: 0.15 });
  } else {
    g.moveTo(0, 132).quadraticCurveTo(60, 107, 120, 125).quadraticCurveTo(180, 97, 240, 122)
      .quadraticCurveTo(310, 92, 370, 117).quadraticCurveTo(420, 102, W, 127)
      .lineTo(W, 142).lineTo(0, 142).closePath().fill({ color: col, alpha: 0.2 });
    g.moveTo(0, 135).quadraticCurveTo(100, 117, 200, 132).quadraticCurveTo(300, 112, 400, 129)
      .quadraticCurveTo(450, 122, W, 135).lineTo(W, 147).lineTo(0, 147).closePath().fill({ color: col, alpha: 0.15 });
  }
  layer.addChild(g);
}

function buildGroundTexture(layer, ground) {
  const g = new PIXI.Graphics();
  switch (ground.texture) {
    case 'grass_blades':
      for (let i = 0; i < 50; i++) {
        const bx = Math.random() * W, by = 165 + Math.random() * 163, bh = 4 + Math.random() * 6;
        g.moveTo(bx, by).lineTo(bx - 1 + Math.random() * 2, by - bh);
        g.stroke({ color: 0x55aa77, width: 1, alpha: 0.2 + Math.random() * 0.15 });
      } break;
    case 'sand_dots':
      for (let i = 0; i < 60; i++) {
        const dx = Math.random() * W, dy = 167 + Math.random() * 163, ds = 0.5 + Math.random() * 1.5;
        g.circle(dx, dy, ds).fill({ color: 0xccaa55, alpha: 0.15 + Math.random() * 0.15 });
      }
      for (let i = 0; i < 5; i++) {
        const ry = 177 + i * 28 + Math.random() * 5, rx = 20 + Math.random() * 40;
        g.moveTo(rx, ry).quadraticCurveTo(rx + 60, ry - 2, rx + 120, ry);
        g.stroke({ color: 0xbbaa66, width: 0.8, alpha: 0.15 });
      } break;
    case 'rock_speckle':
      for (let i = 0; i < 40; i++) {
        const rx = Math.random() * W, ry = 167 + Math.random() * 163;
        g.circle(rx, ry, 0.5 + Math.random() * 1.5).fill({ color: 0x665555, alpha: 0.12 + Math.random() * 0.1 });
      }
      for (let i = 0; i < 4; i++) {
        const ly = 185 + i * 31;
        g.moveTo(30 + Math.random() * 50, ly).lineTo(W - 30 - Math.random() * 50, ly + Math.random() * 3);
        g.stroke({ color: 0x554444, width: 0.6, alpha: 0.1 });
      } break;
    case 'swamp_murk':
      for (let i = 0; i < 35; i++) {
        const mx = Math.random() * W, my = 169 + Math.random() * 159;
        g.circle(mx, my, 1 + Math.random() * 2).fill({ color: 0x446644, alpha: 0.12 + Math.random() * 0.1 });
      }
      for (let i = 0; i < 4; i++) {
        const px = 40 + Math.random() * (W - 80), py = 187 + Math.random() * 110;
        g.ellipse(px, py, 15 + Math.random() * 20, 4 + Math.random() * 3).fill({ color: 0x335533, alpha: 0.15 });
      } break;
    case 'water_ripple':
      for (let i = 0; i < 8; i++) {
        const wy = 169 + i * 19, offset = Math.random() * 30;
        g.moveTo(offset, wy).quadraticCurveTo(offset + W * 0.25, wy - 3, offset + W * 0.5, wy)
          .quadraticCurveTo(offset + W * 0.75, wy + 3, W, wy);
        g.stroke({ color: 0x88ccee, width: 0.8, alpha: 0.12 + Math.random() * 0.08 });
      } break;
    case 'asphalt_grain':
      for (let i = 0; i < 50; i++) {
        const ax = Math.random() * W, ay = 167 + Math.random() * 163;
        g.circle(ax, ay, 0.3 + Math.random() * 0.8).fill({ color: 0x555560, alpha: 0.12 + Math.random() * 0.08 });
      } break;
  }
  layer.addChild(g);
}

function buildGroundDeco(layer, ground) {
  switch (ground.deco) {
    case 'flowers': {
      for (let i = 0; i < 10; i++) {
        const fx = 20 + Math.random() * (W - 40), fy = 169 + Math.random() * 130;
        const fl = new PIXI.Graphics();
        const col = [C.pink, C.yellow, C.lavender, 0xffffff, 0xff99bb, 0xaaddff][i % 6];
        for (let p = 0; p < 4; p++) {
          const angle = (p / 4) * Math.PI * 2;
          fl.circle(fx + Math.cos(angle) * 2.5, fy + Math.sin(angle) * 2.5, 2).fill({ color: col, alpha: 0.8 });
        }
        fl.circle(fx, fy, 1.5).fill({ color: C.yellow });
        fl.moveTo(fx, fy + 2).lineTo(fx, fy + 6);
        fl.stroke({ color: 0x66aa77, width: 0.8, alpha: 0.5 });
        layer.addChild(fl);
      }
      for (let i = 0; i < 6; i++) {
        const tx = 15 + Math.random() * (W - 30), ty = 177 + Math.random() * 115;
        const tg = new PIXI.Graphics();
        for (let b = 0; b < 3; b++) {
          const bx = tx + (b - 1) * 3;
          tg.moveTo(bx, ty).lineTo(bx - 1, ty - 5 - Math.random() * 3);
          tg.stroke({ color: 0x66bb88, width: 1, alpha: 0.4 });
        }
        layer.addChild(tg);
      }
      break;
    }
    case 'rocks': {
      for (let i = 0; i < 8; i++) {
        const rx = 30 + Math.random() * (W - 60), ry = 172 + Math.random() * 125;
        const rk = new PIXI.Graphics();
        const rw = 4 + Math.random() * 8, rh = 3 + Math.random() * 5;
        rk.ellipse(rx, ry, rw, rh).fill({ color: 0xbbaa88, alpha: 0.55 + Math.random() * 0.2 });
        rk.ellipse(rx - rw * 0.2, ry - rh * 0.3, rw * 0.5, rh * 0.3).fill({ color: 0xddccaa, alpha: 0.3 });
        rk.ellipse(rx, ry + rh * 0.6, rw * 0.8, 2).fill({ color: 0x000000, alpha: 0.08 });
        layer.addChild(rk);
      }
      for (let i = 0; i < 3; i++) {
        const cx = 50 + Math.random() * (W - 100), cy = 182 + Math.random() * 100;
        const cb = new PIXI.Graphics();
        cb.moveTo(cx, cy).lineTo(cx, cy - 8);
        cb.moveTo(cx, cy - 5).lineTo(cx - 4, cy - 8);
        cb.moveTo(cx, cy - 5).lineTo(cx + 4, cy - 8);
        cb.stroke({ color: 0x997755, width: 1.2, alpha: 0.4 });
        layer.addChild(cb);
      }
      break;
    }
    case 'cracks': {
      for (let i = 0; i < 7; i++) {
        const cx = 40 + Math.random() * (W - 80), cy = 172 + Math.random() * 125;
        const cr = new PIXI.Graphics();
        const len = 10 + Math.random() * 20;
        cr.moveTo(cx, cy).lineTo(cx + len * 0.4, cy + (Math.random() * 6 - 3))
          .lineTo(cx + len * 0.7, cy + (Math.random() * 8 - 4))
          .lineTo(cx + len, cy + (Math.random() * 6 - 3));
        cr.stroke({ color: 0x443333, width: 1 + Math.random(), alpha: 0.25 + Math.random() * 0.15 });
        const branchX = cx + len * (0.3 + Math.random() * 0.3), branchY = cy + (Math.random() * 4 - 2);
        cr.moveTo(branchX, branchY).lineTo(branchX + 6, branchY + (Math.random() * 6 - 3));
        cr.stroke({ color: 0x443333, width: 0.8, alpha: 0.2 });
        layer.addChild(cr);
      }
      for (let i = 0; i < 6; i++) {
        const px = Math.random() * W, py = 177 + Math.random() * 120;
        const pg = new PIXI.Graphics();
        pg.circle(px, py, 1.5 + Math.random() * 2).fill({ color: 0x776666, alpha: 0.3 });
        layer.addChild(pg);
      }
      break;
    }
    case 'bubbles': {
      for (let i = 0; i < 12; i++) {
        const bx = 20 + Math.random() * (W - 40), by = 169 + Math.random() * 130;
        const bb = new PIXI.Graphics();
        const br = 2 + Math.random() * 4;
        bb.circle(bx, by, br).fill({ color: 0x88ccaa, alpha: 0.2 + Math.random() * 0.2 });
        bb.circle(bx, by, br).stroke({ color: 0x99ddbb, width: 0.5, alpha: 0.3 });
        bb.circle(bx - br * 0.3, by - br * 0.3, br * 0.3).fill({ color: 0xffffff, alpha: 0.4 });
        layer.addChild(bb);
      }
      for (let i = 0; i < 4; i++) {
        const lx = 60 + Math.random() * (W - 120), ly = 185 + Math.random() * 110;
        const lp = new PIXI.Graphics();
        lp.circle(lx, ly, 5 + Math.random() * 3).fill({ color: 0x55aa66, alpha: 0.35 });
        lp.moveTo(lx, ly).lineTo(lx + 6, ly - 2).lineTo(lx + 6, ly + 2).closePath().fill({ color: 0x669977, alpha: 0.35 });
        layer.addChild(lp);
      }
      for (let i = 0; i < 5; i++) {
        const rx = 20 + Math.random() * (W - 40), ry = 217;
        const rd = new PIXI.Graphics();
        rd.moveTo(rx, ry).quadraticCurveTo(rx + 2, ry - 15, rx - 1, ry - 25);
        rd.stroke({ color: 0x558855, width: 1.2, alpha: 0.35 });
        layer.addChild(rd);
      }
      break;
    }
    case 'waves': {
      for (let i = 0; i < 6; i++) {
        const wy = 171 + i * 25;
        const wv = new PIXI.Graphics();
        const amp = 4 + Math.random() * 4, off = Math.random() * 50;
        wv.moveTo(-off, wy).quadraticCurveTo(W * 0.15 - off, wy - amp, W * 0.3 - off, wy)
          .quadraticCurveTo(W * 0.45 - off, wy + amp, W * 0.6 - off, wy)
          .quadraticCurveTo(W * 0.75 - off, wy - amp * 0.7, W * 0.9 - off, wy)
          .quadraticCurveTo(W * 1.05 - off, wy + amp * 0.5, W + 20, wy);
        wv.stroke({ color: 0xffffff, width: 1 + (i < 2 ? 0.5 : 0), alpha: 0.15 + (i < 2 ? 0.1 : 0) });
        layer.addChild(wv);
      }
      for (let i = 0; i < 5; i++) {
        const fx = 30 + Math.random() * (W - 60), fy = 172 + Math.random() * 125;
        const fm = new PIXI.Graphics();
        fm.ellipse(fx, fy, 8 + Math.random() * 6, 2).fill({ color: 0xffffff, alpha: 0.12 + Math.random() * 0.08 });
        layer.addChild(fm);
      }
      break;
    }
    case 'lines': {
      for (let i = 0; i < 8; i++) {
        const lx = 40 + i * 55, ly = 195;
        const ln = new PIXI.Graphics();
        ln.roundRect(lx, ly, 25, 3, 1.5).fill({ color: 0xdddd88, alpha: 0.35 });
        layer.addChild(ln);
      }
      for (const ly of [177, 215]) {
        const sl = new PIXI.Graphics();
        sl.moveTo(15, ly).lineTo(W - 15, ly);
        sl.stroke({ color: 0xaaaaaa, width: 1.5, alpha: 0.2 });
        layer.addChild(sl);
      }
      for (const mx of [W * 0.3, W * 0.7]) {
        const mh = new PIXI.Graphics();
        mh.circle(mx, 202, 7).fill({ color: 0x666670, alpha: 0.4 });
        mh.circle(mx, 202, 5.5).stroke({ color: 0x555560, width: 1.5, alpha: 0.3 });
        mh.moveTo(mx - 3, 202).lineTo(mx + 3, 202);
        mh.moveTo(mx, 199).lineTo(mx, 205);
        mh.stroke({ color: 0x555560, width: 0.8, alpha: 0.25 });
        layer.addChild(mh);
      }
      const curb = new PIXI.Graphics();
      curb.roundRect(5, 165, W - 10, 5, 2).fill({ color: 0xaaaaaa, alpha: 0.2 });
      layer.addChild(curb);
      break;
    }
  }
}

function createWeatherParticle(config, layer) {
  const g = new PIXI.Graphics();
  const x = Math.random() * W, y = Math.random() * 340;

  if (config.type === 'rain') {
    g.moveTo(0, 0).lineTo(-2, config.size * 5);
    g.stroke({ color: config.color, width: 1.5, alpha: 0.4 + Math.random() * 0.2 });
  } else if (config.type === 'leaf') {
    const s = config.size * (0.6 + Math.random() * 0.4);
    const leafCol = [0x66aa44, 0x77bb33, 0x559933, 0x88aa22][Math.floor(Math.random() * 4)];
    g.ellipse(0, 0, s, s * 0.35).fill({ color: leafCol, alpha: 0.7 });
    g.moveTo(-s * 0.6, 0).lineTo(s * 0.6, 0);
    g.stroke({ color: 0x448822, width: 0.5, alpha: 0.4 });
  } else if (config.type === 'snow') {
    const r = config.size * (0.4 + Math.random() * 0.6);
    g.circle(0, 0, r).fill({ color: config.color, alpha: 0.5 + Math.random() * 0.3 });
    g.circle(-r * 0.3, -r * 0.3, r * 0.3).fill({ color: 0xffffff, alpha: 0.3 });
  } else if (config.type === 'ember') {
    const r = config.size * (0.3 + Math.random() * 0.7);
    g.circle(0, 0, r).fill({ color: config.color, alpha: 0.6 });
    g.circle(0, 0, r * 0.5).fill({ color: 0xffaa44, alpha: 0.4 });
    g.circle(-r * 0.2, -r * 0.2, r * 0.25).fill({ color: 0xffee88, alpha: 0.5 });
  }

  g.x = x; g.y = y;
  layer.addChild(g);
  return { g, speed: config.speed, type: config.type, drift: Math.random() * 2 - 1, phase: Math.random() * Math.PI * 2 };
}
