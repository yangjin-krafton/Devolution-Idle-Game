// ============================================================
// Battle Field — background, enemy/ally sprites, danmaku, party bar, VFX, tick
// ============================================================

import { W, C, hex, lbl, addSparkles } from './theme.js';
import { monster } from './sprites.js';
import {
  playTamingEffect, playAttackEffect,
  playBondingAttempt, playBondingSuccess, playBondingFail,
  playEscapeEffect, playFaintEffect,
  motionDash, motionPulse, motionGuard, motionScan,
  motionEnemyLunge, motionEnemyRoar,
} from '../effects.js';
import { ENVIRONMENT_AXES, ENV_AXIS_LABEL, ENV_AXIS_ICON, ENV_VALUE_LABEL } from '../data/index.js';

// 환경 축 색상 매핑
const ENV_AXIS_COLOR = {
  temperature: 0xffaa77,
  brightness: 0xffe060,
  smell: 0x88cc88,
  humidity: 0x88bbee,
  sound: 0xccaaee,
};

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

// 적 감정 파티클 시스템
let enemyMood = 'happy';      // 'happy' | 'neutral' | 'uneasy' | 'angry' | 'overtime'
let moodParticles = [];        // 떠다니는 이모지 파티클들
let moodEmitTimer = 0;         // 다음 파티클 스폰까지 남은 시간
let moodFaceTimer = 0;         // 얼굴 이모지 전환 타이머
let moodFaceVisible = false;   // 현재 얼굴 이모지 표시 중?

const MOOD_CONFIG = {
  happy:   { face: '😊', particles: ['💚', '💚', '✨', '🌿'], color: 0x00d4aa, interval: 3.0, faceInterval: 5.0 },
  neutral: { face: '😐', particles: ['💛', '...'],             color: 0xffe060, interval: 3.5, faceInterval: 4.0 },
  uneasy:  { face: '😟', particles: ['💧', '❓', '💦'],       color: 0xff8866, interval: 2.5, faceInterval: 3.0 },
  angry:   { face: '😠', particles: ['💢', '🔥', '💢', '💥'], color: 0xff4444, interval: 1.5, faceInterval: 2.0 },
  overtime:{ face: '😰', particles: ['💨', '⚡', '💢', '😱'], color: 0xff2222, interval: 1.0, faceInterval: 1.5 },
};

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

  refs.enemyShadow = new PIXI.Container();
  refs.enemyShadow.x = ePlatX; refs.enemyShadow.y = ePlatY + 50;
  refs.enemyShadowBaseY = ePlatY + 50;
  container.addChild(refs.enemyShadow);

  refs.enemySprite = new PIXI.Container();
  refs.enemySprite.x = ePlatX; refs.enemySprite.y = ePlatY;
  refs.enemyBaseY = ePlatY;
  container.addChild(refs.enemySprite);

  // HUD — 좌측 패널 + 5축 프레임
  refs.enemyHud = new PIXI.Container();
  refs.enemyHud.x = 0; refs.enemyHud.y = 2;
  container.addChild(refs.enemyHud);
}

// ---- Ally Area (하단 좌/중/우 — 적을 둘러싸는 배치) ----
function buildAllyArea() {
  refs.allySlots = [];
  const positions = [
    { x: W * 0.18, y: 235, size: 88 },    // 좌 (적 옆 포위, 살짝 아래)
    { x: W * 0.50, y: 268, size: 105 },   // 중앙 (살짝 위로)
    { x: W * 0.82, y: 235, size: 88 },    // 우 (적 옆 포위, 살짝 아래)
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

export function renderEnemy(enemy) {
  refs.enemySprite.removeChildren();
  refs.enemySprite.alpha = 1;
  refs.enemySprite.y = refs.enemyBaseY;
  refs.enemySprite.addChild(monster(140, enemy.img));

  // Planar shadow — flattened copy of the sprite
  refs.enemyShadow.removeChildren();
  const sh = monster(140, enemy.img);
  sh.scale.y = 0.25;
  sh.alpha = 0.18;
  if (sh.children[0]) sh.children[0].tint = 0x000000;
  refs.enemyShadow.addChild(sh);

  refs._enemyName = enemy.name;
  _renderEnvironmentHud({});
}

// ============================================================
// 환경 대시보드 — 좌측 상태 패널 + 5축 프레임
//
// 좌측: 턴/타이머 프레임 + 도주 프레임 (연장전)
// 우측: 5축 프레임 (이모지 + 이름 + 수치 + ✔️/힌트)
// ============================================================

const HINT_ICON = {
  low:  { arrow: '▲', color: 0xff8866 },
  high: { arrow: '▼', color: 0x66aaff },
  ok:   { arrow: '',  color: 0x00d4aa },
};

function _renderEnvironmentHud(result) {
  if (!refs.enemyHud) return;
  refs.enemyHud.removeChildren();

  const envStatus = result.envStatus || {};
  const phase = result.phase || 'regular';
  const turn = result.turn || refs._turn || 0;
  const turnsRemaining = result.turnsRemaining ?? 0;
  const matchCount = result.matchCount || 0;
  const escapeGauge = result.escapeGauge || 0;
  const escapeMax = result.escapeMax || 10;
  const escapePct = result.escapePercent || 0;
  refs._turn = turn;

  const isOvertime = phase === 'overtime';

  // ---- 레이아웃 ----
  const leftW = 72;
  const leftGap = 5;
  const envGap = 3;
  const envFrameW = Math.floor((W - leftW - leftGap - 8 - envGap * 4) / 5);
  const envFrameH = 24;
  const envStartX = leftW + leftGap + 4;
  const leftH = envFrameH;

  // ======== 좌측: 통합 프레임 ========
  const lx = 3, ly = 0;
  const lg = new PIXI.Graphics();
  const leftBorderCol = isOvertime ? 0xff4444 : 0xffe060;
  lg.roundRect(lx, ly, leftW, leftH, 6)
    .fill({ color: 0x13132a });
  lg.roundRect(lx, ly, leftW, leftH, 6)
    .stroke({ color: leftBorderCol, width: 1.5, alpha: 0.7 });
  refs.enemyHud.addChild(lg);

  if (!isOvertime) {
    // 정규전: ⌛️ 남은턴 T턴 일치수
    const urgent = turnsRemaining <= 1;
    const col = urgent ? 0xff4444 : 0xffe060;
    const textL = lbl(`⌛️${turnsRemaining}  T${turn}  ${matchCount}/5`, 5, col, true);
    textL.anchor = { x: 0.5, y: 0.5 };
    textL.x = lx + leftW / 2; textL.y = ly + leftH / 2;
    refs.enemyHud.addChild(textL);
  } else {
    // 연장전: ⏰ + 도주바 + 수치
    const barX = lx + 18, barY = ly + 4;
    const barW = leftW - 22, barH = 8;
    const ratio = Math.min(1, escapeGauge / escapeMax);
    const barG = new PIXI.Graphics();
    barG.roundRect(barX, barY, barW, barH, 4).fill({ color: 0x331122 });
    if (ratio > 0) {
      const fillCol = escapePct >= 70 ? 0xff2222 : 0xff6644;
      barG.roundRect(barX + 1, barY + 1, Math.max(4, (barW - 2) * ratio), barH - 2, 3)
        .fill({ color: fillCol, alpha: 0.9 });
    }
    refs.enemyHud.addChild(barG);

    const otIcon = lbl('⏰', 5, 0xff4444, true);
    otIcon.x = lx + 3; otIcon.y = ly + 3;
    refs.enemyHud.addChild(otIcon);

    const escL = lbl(`${escapeGauge}/${escapeMax}  T${turn}`, 4, escapePct >= 70 ? 0xff4444 : 0xaa7777, true);
    escL.x = lx + 18; escL.y = ly + 14;
    refs.enemyHud.addChild(escL);
  }

  // ======== 5축 프레임 (한 줄: 이모지 이름 수치 힌트) ========
  for (let ai = 0; ai < ENVIRONMENT_AXES.length; ai++) {
    const axis = ENVIRONMENT_AXES[ai];
    const info = envStatus[axis];
    const current = info?.current ?? 0;
    const hint = info?.hint ?? 'ok';
    const matched = info?.matched ?? false;
    const revealed = info?.revealed ?? false;
    const ideal = info?.ideal;
    const color = ENV_AXIS_COLOR[axis] || 0xaaaaaa;
    const hd = HINT_ICON[hint] || HINT_ICON.ok;

    const fx = envStartX + ai * (envFrameW + envGap);
    const fy = 0;

    // 프레임 배경
    const g = new PIXI.Graphics();
    let borderCol = matched ? 0x00d4aa : 0x333355;
    if (isOvertime && !matched) borderCol = 0xff4444;
    g.roundRect(fx, fy, envFrameW, envFrameH, 6)
      .fill({ color: 0x13132a });
    g.roundRect(fx, fy, envFrameW, envFrameH, 6)
      .stroke({ color: borderCol, width: matched ? 1.5 : 1, alpha: matched ? 0.8 : (isOvertime && !matched ? 0.9 : 0.5) });
    refs.enemyHud.addChild(g);

    // 한 줄: 이모지 + 이름 + 수치 + 힌트
    const icon = lbl(ENV_AXIS_ICON[axis], 6, color, true);
    icon.x = fx + 2; icon.y = fy + 3;
    refs.enemyHud.addChild(icon);

    const valSign = current > 0 ? '+' : '';
    let valText = `${ENV_AXIS_LABEL[axis]} ${valSign}${current}`;
    if (revealed && ideal != null) {
      const iSign = ideal > 0 ? '+' : '';
      valText += `→${iSign}${ideal}`;
    }
    const valL = lbl(valText, 5, matched ? 0x00d4aa : 0xaaaacc, true);
    valL.x = fx + 16; valL.y = fy + 5;
    refs.enemyHud.addChild(valL);

    // 우측: 힌트 화살표 (불일치 시)
    if (!matched && hd.arrow) {
      const arr = lbl(hd.arrow, 6, hd.color, true);
      arr.anchor = { x: 1, y: 0 }; arr.x = fx + envFrameW - 3; arr.y = fy + 3;
      refs.enemyHud.addChild(arr);
    }

    // ✔️ 오버레이: 일치 시 반투명 초록 덮기 + 큰 체크마크
    if (matched) {
      const overlay = new PIXI.Graphics();
      overlay.roundRect(fx, fy, envFrameW, envFrameH, 6)
        .fill({ color: 0x00d4aa, alpha: 0.15 });
      refs.enemyHud.addChild(overlay);

      const chk = lbl('✔', 10, 0x00d4aa, true);
      chk.anchor = { x: 0.5, y: 0.5 };
      chk.x = fx + envFrameW / 2; chk.y = fy + envFrameH / 2;
      chk.alpha = 0.5;
      refs.enemyHud.addChild(chk);
    }
  }
}

export function updateGauges(result) {
  _renderEnvironmentHud(result);
  _updateEnemyMood(result);
}

function _updateEnemyMood(result) {
  const phase = result.phase || 'regular';
  const matchCount = result.matchCount || 0;

  if (phase === 'overtime') {
    enemyMood = 'overtime';
  } else if (matchCount >= 5) {
    enemyMood = 'happy';
  } else if (matchCount >= 4) {
    enemyMood = 'neutral';
  } else if (matchCount >= 2) {
    enemyMood = 'uneasy';
  } else {
    enemyMood = 'angry';
  }
}

export function renderAlly() {
  // 3v1 구조: renderAllyTabs에서 3마리 일괄 렌더링
}

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

    // Planar shadow — flattened copy of the sprite
    const sh = monster(size, ally.img);
    sh.scale.x = -1;
    sh.scale.y = 0.25;
    sh.alpha = ally.inEgg ? 0.08 : 0.15;
    if (sh.children[0]) sh.children[0].tint = 0x000000;
    slot.shadow.addChild(sh);
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
  // mood 파티클 정리
  for (const p of moodParticles) {
    if (container) container.removeChild(p.sprite);
    p.sprite.destroy();
  }
  moodParticles = [];
  moodEmitTimer = 0;
  moodFaceTimer = 0;
  enemyMood = 'happy';
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

// ---- Enemy Mood Particles ----

function _spawnMoodParticle(emoji, x, y) {
  if (!container) return;
  const t = new PIXI.Text({ text: emoji, style: {
    fontFamily: '"M PLUS Rounded 1c", "Noto Sans KR", sans-serif',
    fontSize: 20 + Math.random() * 10,
    fill: '#ffffff',
  }});
  t.anchor.set(0.5);
  t.x = x + (Math.random() - 0.5) * 60;
  t.y = y - 20 - Math.random() * 20;
  t.alpha = 0.9;
  container.addChild(t);
  moodParticles.push({
    sprite: t,
    vx: (Math.random() - 0.5) * 0.5,
    vy: -0.3 - Math.random() * 0.3,
    life: 1.5 + Math.random() * 0.5,  // 초
    age: 0,
  });
}

function _spawnFaceEmoji(emoji, x, y) {
  if (!container) return;
  const t = new PIXI.Text({ text: emoji, style: {
    fontFamily: '"M PLUS Rounded 1c", "Noto Sans KR", sans-serif',
    fontSize: 36,
    fill: '#ffffff',
  }});
  t.anchor.set(0.5);
  t.x = x + 30;
  t.y = y - 50;
  t.alpha = 0;
  container.addChild(t);
  moodParticles.push({
    sprite: t,
    vx: 0,
    vy: -0.15,
    life: 2.0,
    age: 0,
    isFace: true,  // 페이드인→유지→페이드아웃
  });
}

function _tickEnemyMood(tick) {
  const dt = 0.016;  // ~60fps
  const cfg = MOOD_CONFIG[enemyMood] || MOOD_CONFIG.happy;
  const ex = refs.enemySprite?.x ?? W * 0.5;
  const ey = refs.enemySprite?.y ?? 130;

  // 파티클 스폰 타이머
  moodEmitTimer -= dt;
  if (moodEmitTimer <= 0) {
    const emoji = cfg.particles[Math.floor(Math.random() * cfg.particles.length)];
    _spawnMoodParticle(emoji, ex, ey);
    moodEmitTimer = cfg.interval * (0.7 + Math.random() * 0.6);
  }

  // 얼굴 이모지 타이머
  moodFaceTimer -= dt;
  if (moodFaceTimer <= 0) {
    _spawnFaceEmoji(cfg.face, ex, ey);
    moodFaceTimer = cfg.faceInterval * (0.8 + Math.random() * 0.4);
  }

  // 파티클 업데이트
  for (let i = moodParticles.length - 1; i >= 0; i--) {
    const p = moodParticles[i];
    p.age += dt;
    p.sprite.x += p.vx;
    p.sprite.y += p.vy;

    if (p.isFace) {
      // 페이드인(0~0.3s) → 유지 → 페이드아웃(마지막 0.5s)
      const fadeIn = Math.min(1, p.age / 0.3);
      const fadeOut = Math.max(0, 1 - (p.age - p.life + 0.5) / 0.5);
      p.sprite.alpha = Math.min(fadeIn, fadeOut) * 0.85;
      p.sprite.scale.set(0.8 + fadeIn * 0.2);
    } else {
      // 일반 파티클: 서서히 페이드아웃 + 위로 부유
      p.sprite.alpha = Math.max(0, 0.9 * (1 - p.age / p.life));
      p.sprite.scale.set(0.6 + (1 - p.age / p.life) * 0.4);
    }

    if (p.age >= p.life) {
      container.removeChild(p.sprite);
      p.sprite.destroy();
      moodParticles.splice(i, 1);
    }
  }
}

// ---- Turn Sequence Animation Engine ----

let _sequencePlaying = false;
export function isSequencePlaying() { return _sequencePlaying; }

/**
 * Play turn steps sequentially with per-action motion + VFX.
 * @param {Array} steps - from combat.turnSteps
 * @param {Function} onComplete - called after all steps finish
 */
export function playTurnSequence(steps, onComplete) {
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
    playStep(step, () => {
      // Gap between steps
      setTimeout(next, 180);
    });
  }
  next();
}

function playStep(step, onDone) {
  const MOTION_DUR = 400;

  // ── Skill name label (brief cut-in) ──
  showSkillLabel(step.name, step.skillName, step.actor === 'enemy');

  if (step.actor === 'enemy') {
    playEnemyStep(step, MOTION_DUR, onDone);
  } else {
    playAllyStep(step, MOTION_DUR, onDone);
  }
}

function playEnemyStep(step, dur, onDone) {
  const sprite = refs.enemySprite;
  if (!sprite) { onDone?.(); return; }

  // Random: lunge or roar
  if (Math.random() > 0.5) {
    motionEnemyLunge(sprite, dur, () => {
      playTamingEffect(step.axis || 'behavior', false);
      onDone?.();
    });
  } else {
    motionEnemyRoar(sprite, dur, () => {
      playTamingEffect(step.axis || 'behavior', false);
      onDone?.();
    });
  }
}

function playAllyStep(step, dur, onDone) {
  const slot = refs.allySlots?.[step.allyIdx];
  const sprite = slot?.container;
  if (!sprite) { onDone?.(); return; }

  const enemyX = refs.enemySprite?.x ?? W * 0.5;
  const enemyY = refs.enemySprite?.y ?? 130;
  const dx = (enemyX - sprite.x) * 0.35;
  const dy = (enemyY - sprite.y) * 0.35;

  switch (step.category) {
    case 'stimulate':
      motionDash(sprite, dx, dy, dur, () => {
        playTamingEffect(step.axis || 'behavior', true);
        onDone?.();
      });
      break;
    case 'capture':
      motionPulse(sprite, 1.2, dur, () => {
        playTamingEffect('behavior', true);
        onDone?.();
      });
      break;
    case 'defend':
      motionGuard(sprite, 25, dur, () => {
        onDone?.();
      });
      break;
    case 'survey':
      motionScan(sprite, dur, () => {
        onDone?.();
      });
      break;
    default:
      motionDash(sprite, dx, dy, dur, onDone);
  }
}

function showSkillLabel(actorName, skillName, isEnemy) {
  if (!container) return;
  const color = isEnemy ? 0xff6644 : 0x00d4aa;
  const label = lbl(`${actorName} — ${skillName}`, 8, color, true);
  label.anchor = { x: 0.5, y: 0.5 };
  label.x = W / 2;
  label.y = isEnemy ? 60 : 260;
  label.alpha = 0;
  container.addChild(label);

  const start = performance.now();
  const dur = 600;
  function tick() {
    const elapsed = performance.now() - start;
    if (elapsed >= dur) { container.removeChild(label); label.destroy(); return; }
    const t = elapsed / dur;
    if (t < 0.15) label.alpha = t / 0.15;
    else if (t < 0.7) label.alpha = 1;
    else label.alpha = 1 - (t - 0.7) / 0.3;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
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
  _tickEnemyMood(tick);
  const bounce = Math.sin(tick * 3);
  // Skip idle animations during turn sequence playback
  if (!_sequencePlaying) {
    if (refs.enemySprite && refs.enemyBaseY != null) {
      refs.enemySprite.y = refs.enemyBaseY + bounce * 4;
      refs.enemySprite.scale.set(1 + Math.sin(tick * 3) * 0.02, 1 - Math.sin(tick * 3) * 0.02);
      // Shadow follows sprite X-scale breathing + slight Y shift
      if (refs.enemyShadow) {
        const breathScale = 1 + Math.sin(tick * 3) * 0.02;
        refs.enemyShadow.scale.x = breathScale;
        refs.enemyShadow.y = refs.enemyShadowBaseY + bounce * 1.5;
      }
    }
    if (refs.allySlots) {
      refs.allySlots.forEach((slot, i) => {
        const phase = tick * 3 + i * 0.7;
        slot.container.y = slot.baseY - Math.sin(phase) * 3;
        slot.container.scale.set(1 - Math.sin(phase) * 0.015, 1 + Math.sin(phase) * 0.015);
        // Shadow follows ally idle motion
        const sBreath = 1 - Math.sin(phase) * 0.015;
        slot.shadow.scale.x = sBreath;
        slot.shadow.y = slot.shadowBaseY - Math.sin(phase) * 1.2;
        // Bounce the aggro arrow (offset from base position)
        if (slot._arrow && slot._arrow._baseY != null) {
          slot._arrow.y = slot._arrow._baseY + Math.sin(tick * 5) * 3;
        }
      });
    }
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
