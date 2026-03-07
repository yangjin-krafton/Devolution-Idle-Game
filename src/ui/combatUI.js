// ============================================================
// Combat Screen — Pixi (Kirby cute + battle-layout structure)
// ============================================================

import { W, H, C, hex, lbl, softPanel, cuteBar, cuteBtn, star, addSparkles } from './theme.js';
import { monster } from './sprites.js';
import { BONDING_ACTIONS } from '../data.js';
import {
  playTamingEffect, playAttackEffect,
  playBondingAttempt, playBondingSuccess, playBondingFail,
  playEscapeEffect, playFaintEffect,
} from '../effects.js';

const AXIS_LABELS = { sound: 'SND', temperature: 'TMP', smell: 'SML', behavior: 'ACT' };
const AXIS_COLORS = { sound: C.water, temperature: C.fire, smell: C.mint, behavior: C.lavender };

let container;
let currentMode = 'taming';
let onAction = null, onBonding = null, onSwitchAlly = null;

// Persistent refs for dynamic updates
let refs = {};
let sparkles = [];
let danmakuItems = [];
let lastLogCount = 0;
let weatherParticles = [];
let currentEnv = null;

export function initCombat() {
  container = new PIXI.Container();
  buildEnemyArea();
  buildAllyArea();
  buildDanmaku();
  buildPartyBar();
  buildActionPanel();
  return container;
}

export function getContainer() { return container; }

// ---- Callbacks ----
export function setCombatCallbacks({ action, bonding, switchAlly }) {
  onAction = action; onBonding = bonding; onSwitchAlly = switchAlly;
}

export function setMode(mode) { currentMode = mode; }
export function getMode() { return currentMode; }

// ---- Composable Background ----
export function applyBackground(env) {
  currentEnv = env;
  // Remove old background layers
  if (refs.bgLayer) { container.removeChild(refs.bgLayer); refs.bgLayer.destroy({ children: true }); }
  if (refs.timeTint) { container.removeChild(refs.timeTint); refs.timeTint.destroy(); }

  refs.bgLayer = new PIXI.Container();
  weatherParticles = [];
  sparkles = [];

  const { sky, ground, time } = env;

  // Sky gradient
  const skyGfx = new PIXI.Graphics();
  skyGfx.rect(0, 0, W, 200).fill({ color: sky.colors[0] });
  skyGfx.rect(0, 100, W, 100).fill({ color: sky.colors[1], alpha: 0.5 });
  refs.bgLayer.addChild(skyGfx);

  // Clouds (if sky has them)
  if (sky.clouds) {
    const cloudAlpha = sky.id === 'rain' ? 0.4 : 0.6;
    [{ x: 60, y: 40, s: 1 }, { x: 280, y: 25, s: 1.3 }, { x: 400, y: 55, s: 0.8 }].forEach(cl => {
      const g = new PIXI.Graphics();
      g.circle(cl.x, cl.y, 20 * cl.s).fill({ color: 0xffffff, alpha: cloudAlpha });
      g.circle(cl.x - 18 * cl.s, cl.y + 5, 14 * cl.s).fill({ color: 0xffffff, alpha: cloudAlpha });
      g.circle(cl.x + 16 * cl.s, cl.y + 3, 16 * cl.s).fill({ color: 0xffffff, alpha: cloudAlpha });
      refs.bgLayer.addChild(g);
    });
  }

  // Ground hills
  const hill = new PIXI.Graphics();
  hill.moveTo(0, 230).quadraticCurveTo(W / 2, 170, W, 220).lineTo(W, 340).lineTo(0, 340).closePath().fill({ color: ground.hill[0] });
  hill.moveTo(0, 240).quadraticCurveTo(W / 2, 190, W, 230).lineTo(W, 340).lineTo(0, 340).closePath().fill({ color: ground.hill[1] });
  refs.bgLayer.addChild(hill);

  // Ground decorations
  buildGroundDeco(refs.bgLayer, ground);

  // Weather particles
  if (sky.particles) {
    refs.weatherLayer = new PIXI.Container();
    const p = sky.particles;
    for (let i = 0; i < p.count; i++) {
      weatherParticles.push(createWeatherParticle(p, refs.weatherLayer));
    }
    refs.bgLayer.addChild(refs.weatherLayer);
  }

  sparkles = addSparkles(refs.bgLayer, 5, W, 340);

  // Time of day tint overlay (on top of everything in the battle area)
  refs.timeTint = new PIXI.Graphics();
  if (time.alpha > 0) {
    refs.timeTint.rect(0, 0, W, 340).fill({ color: time.tint, alpha: time.alpha });
  }

  // Insert bg at index 0, tint after bg
  container.addChildAt(refs.bgLayer, 0);
  // Place tint above bgLayer but below UI elements
  const tintIdx = Math.min(1, container.children.length);
  container.addChildAt(refs.timeTint, tintIdx);
}

function buildGroundDeco(layer, ground) {
  switch (ground.deco) {
    case 'flowers':
      for (let i = 0; i < 6; i++) {
        const fx = 30 + Math.random() * (W - 60), fy = 250 + Math.random() * 50;
        const fl = new PIXI.Graphics();
        fl.circle(fx, fy, 3).fill({ color: [C.pink, C.yellow, C.lavender, 0xffffff][i % 4] });
        fl.circle(fx, fy, 1.5).fill({ color: C.yellow });
        layer.addChild(fl);
      }
      break;
    case 'rocks':
      for (let i = 0; i < 5; i++) {
        const rx = 40 + Math.random() * (W - 80), ry = 255 + Math.random() * 40;
        const rk = new PIXI.Graphics();
        rk.circle(rx, ry, 4 + Math.random() * 4).fill({ color: 0xbbaa88, alpha: 0.7 });
        layer.addChild(rk);
      }
      break;
    case 'cracks':
      for (let i = 0; i < 4; i++) {
        const cx = 60 + Math.random() * (W - 120), cy = 260 + Math.random() * 30;
        const cr = new PIXI.Graphics();
        cr.moveTo(cx, cy).lineTo(cx + 12 + Math.random() * 10, cy + 5).lineTo(cx + 20 + Math.random() * 8, cy - 3);
        cr.stroke({ color: 0x554444, width: 1.5, alpha: 0.4 });
        layer.addChild(cr);
      }
      break;
    case 'bubbles':
      for (let i = 0; i < 8; i++) {
        const bx = 30 + Math.random() * (W - 60), by = 250 + Math.random() * 50;
        const bb = new PIXI.Graphics();
        bb.circle(bx, by, 2 + Math.random() * 3).fill({ color: 0x88ccaa, alpha: 0.4 });
        bb.circle(bx - 1, by - 1, 1).fill({ color: 0xffffff, alpha: 0.5 });
        layer.addChild(bb);
      }
      break;
    case 'waves':
      for (let i = 0; i < 3; i++) {
        const wy = 260 + i * 20;
        const wv = new PIXI.Graphics();
        wv.moveTo(0, wy).quadraticCurveTo(W * 0.25, wy - 6, W * 0.5, wy)
          .quadraticCurveTo(W * 0.75, wy + 6, W, wy);
        wv.stroke({ color: 0xffffff, width: 1.5, alpha: 0.3 });
        layer.addChild(wv);
      }
      break;
    case 'lines':
      for (let i = 0; i < 3; i++) {
        const ly = 265 + i * 18;
        const ln = new PIXI.Graphics();
        ln.moveTo(W * 0.1, ly).lineTo(W * 0.9, ly);
        ln.stroke({ color: 0xaaaa99, width: 1, alpha: 0.3 });
        layer.addChild(ln);
      }
      // Manhole
      const mh = new PIXI.Graphics();
      mh.circle(W * 0.6, 280, 8).fill({ color: 0x777780, alpha: 0.5 });
      mh.circle(W * 0.6, 280, 6).stroke({ color: 0x666670, width: 1 });
      layer.addChild(mh);
      break;
  }
}

function createWeatherParticle(config, layer) {
  const g = new PIXI.Graphics();
  const x = Math.random() * W;
  const y = Math.random() * 340;

  if (config.type === 'rain') {
    g.moveTo(0, 0).lineTo(-1, config.size * 4);
    g.stroke({ color: config.color, width: 1.5, alpha: 0.5 });
  } else if (config.type === 'leaf') {
    g.ellipse(0, 0, config.size, config.size * 0.4).fill({ color: config.color, alpha: 0.7 });
  } else {
    // snow, ember
    g.circle(0, 0, config.size * (0.5 + Math.random() * 0.5)).fill({ color: config.color, alpha: 0.6 });
  }

  g.x = x; g.y = y;
  layer.addChild(g);
  return {
    g, speed: config.speed, type: config.type,
    drift: Math.random() * 2 - 1,
    phase: Math.random() * Math.PI * 2,
  };
}

// ---- Enemy Area ----
function buildEnemyArea() {
  const ePlatX = W * 0.68, ePlatY = 125;

  // Cloud platform
  const eCloud = new PIXI.Graphics();
  eCloud.circle(ePlatX, ePlatY + 38, 30).fill({ color: 0xffffff, alpha: 0.5 });
  eCloud.circle(ePlatX - 22, ePlatY + 42, 20).fill({ color: 0xffffff, alpha: 0.5 });
  eCloud.circle(ePlatX + 20, ePlatY + 44, 18).fill({ color: 0xffffff, alpha: 0.5 });
  container.addChild(eCloud);

  refs.enemySprite = new PIXI.Container();
  refs.enemySprite.x = ePlatX; refs.enemySprite.y = ePlatY;
  refs.enemyBaseY = ePlatY;
  container.addChild(refs.enemySprite);

  refs.enemyInfo = new PIXI.Container();
  refs.enemyInfo.x = 10; refs.enemyInfo.y = 65;
  container.addChild(refs.enemyInfo);
}

function buildAllyArea() {
  const aPlatX = W * 0.28, aPlatY = 270;

  refs.allySprite = new PIXI.Container();
  refs.allySprite.x = aPlatX; refs.allySprite.y = aPlatY;
  refs.allyBaseY = aPlatY;
  container.addChild(refs.allySprite);

  refs.allyInfo = new PIXI.Container();
  refs.allyInfo.x = W - 200; refs.allyInfo.y = 230;
  container.addChild(refs.allyInfo);
}

function buildPartyBar() {
  const y = 340;
  container.addChild(new PIXI.Graphics().roundRect(8, y, W - 16, 34, 12).fill({ color: 0xffffff, alpha: 0.6 }));
  container.addChild(Object.assign(lbl('PARTY', 7, C.dim), { x: 16, y: y + 4 }));
  refs.partyBar = new PIXI.Container();
  refs.partyBar.y = y;
  container.addChild(refs.partyBar);
}

function buildDanmaku() {
  refs.danmakuLayer = new PIXI.Container();
  container.addChild(refs.danmakuLayer);

  // Mask: clip danmaku to the battle field area (sky + hill)
  const danmakuMask = new PIXI.Graphics();
  danmakuMask.rect(0, 0, W, 340).fill({ color: 0xffffff });
  container.addChild(danmakuMask);
  refs.danmakuLayer.mask = danmakuMask;
}

function buildActionPanel() {
  const actBg = 385;
  container.addChild(new PIXI.Graphics().roundRect(0, actBg, W, H - actBg, 24).fill({ color: C.cream }));

  // Mode tabs
  refs.tabTaming = new PIXI.Container();
  refs.tabBonding = new PIXI.Container();
  container.addChild(refs.tabTaming);
  container.addChild(refs.tabBonding);

  // Action card container
  refs.actionContainer = new PIXI.Container();
  refs.actionContainer.y = 440;
  container.addChild(refs.actionContainer);
}

// ============================================================
// Dynamic Rendering
// ============================================================

export function renderEnemy(enemy) {
  refs.enemySprite.removeChildren();
  refs.enemySprite.addChild(monster(100, enemy.img));

  refs.enemyInfo.removeChildren();
  refs.enemyInfo.addChild(softPanel(0, 0, 180, 70, C.white, C.lavender));
  refs.enemyInfo.addChild(Object.assign(lbl(enemy.name, 11, C.text, true), { x: 14, y: 8 }));
  refs.enemyInfo.addChild(Object.assign(lbl('TAME', 8, C.taming), { x: 14, y: 28 }));
  refs.tamingBar = cuteBar(52, 30, 112, 10, 0, C.taming);
  refs.enemyInfo.addChild(refs.tamingBar);
  refs.enemyInfo.addChild(Object.assign(lbl('ESC', 8, C.escape), { x: 14, y: 46 }));
  refs.escapeBar = cuteBar(52, 48, 112, 10, 0, C.escape);
  refs.enemyInfo.addChild(refs.escapeBar);
}

export function updateGauges(tamingPercent, escapePercent) {
  if (refs.tamingBar) {
    const idx = refs.enemyInfo.children.indexOf(refs.tamingBar);
    if (idx >= 0) refs.enemyInfo.removeChildAt(idx);
    refs.tamingBar = cuteBar(52, 30, 112, 10, tamingPercent / 100, C.taming);
    refs.enemyInfo.addChildAt(refs.tamingBar, Math.min(idx, refs.enemyInfo.children.length));
  }
  if (refs.escapeBar) {
    const idx = refs.enemyInfo.children.indexOf(refs.escapeBar);
    if (idx >= 0) refs.enemyInfo.removeChildAt(idx);
    refs.escapeBar = cuteBar(52, 48, 112, 10, escapePercent / 100, C.escape);
    refs.enemyInfo.addChildAt(refs.escapeBar, Math.min(idx, refs.enemyInfo.children.length));
  }
}

export function renderAlly(ally) {
  if (!ally) return;
  refs.allySprite.removeChildren();
  const m = monster(120, ally.img);
  m.scale.x = -1;
  refs.allySprite.addChild(m);

  refs.allyInfo.removeChildren();
  refs.allyInfo.addChild(softPanel(0, 0, 185, 70, C.white, C.pinkLight));
  refs.allyInfo.addChild(Object.assign(lbl(ally.name, 11, C.text, true), { x: 14, y: 8 }));
  refs.allyInfo.addChild(Object.assign(lbl('Lv.' + (ally.level || 1), 9, C.dim), { x: 130, y: 10 }));
  refs.allyInfo.addChild(Object.assign(lbl('HP', 8, C.hp), { x: 14, y: 28 }));
  const hpRatio = ally.hp / ally.maxHp;
  refs.allyInfo.addChild(cuteBar(40, 30, 130, 10, hpRatio, hpRatio > 0.3 ? C.hp : C.hpLow));
  refs.allyInfo.addChild(Object.assign(lbl(ally.hp + '/' + ally.maxHp, 8, C.dim), { x: 130, y: 44 }));
}

// Danmaku log color categorization
const DANMAKU_COLORS = {
  attack: C.escape,       // red — enemy attacks, damage
  taming: C.taming,       // blue — taming actions
  reaction: C.mint,       // green — positive reactions
  bonding: C.orange,      // orange — bonding actions
  system: C.dim,          // grey — system messages
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

function spawnDanmaku(msg) {
  if (!refs.danmakuLayer) return;
  const category = classifyLog(msg);
  const color = DANMAKU_COLORS[category] || C.dim;

  const t = new PIXI.Text({ text: msg, style: {
    fontFamily: '"M PLUS Rounded 1c", "Noto Sans KR", sans-serif',
    fontSize: 11, fill: hex(color), fontWeight: 'bold',
    dropShadow: { color: '#000000', alpha: 0.5, blur: 2, distance: 1 },
  }});
  t.alpha = 0.85;

  // Stagger Y position across available lanes
  const lanes = [10, 30, 50, 70, 90];
  const lane = lanes[danmakuItems.length % lanes.length];
  t.x = W + 10;
  t.y = lane;

  refs.danmakuLayer.addChild(t);
  danmakuItems.push({ sprite: t, speed: 0.8 + Math.random() * 0.4 });
}

export function renderLogs(logs) {
  // Only spawn danmaku for new log entries
  const newLogs = logs.slice(lastLogCount);
  lastLogCount = logs.length;
  for (const msg of newLogs) {
    spawnDanmaku(msg);
  }
}

export function resetDanmaku() {
  if (refs.danmakuLayer) refs.danmakuLayer.removeChildren();
  danmakuItems = [];
  lastLogCount = 0;
}

export function renderAllyTabs(team, activeAllyIndex, combatState) {
  refs.partyBar.removeChildren();
  team.forEach((ally, i) => {
    const x = 65 + i * 55;
    const ct = new PIXI.Container(); ct.x = x; ct.y = 6;

    if (i === activeAllyIndex) {
      ct.addChild(new PIXI.Graphics().circle(0, 12, 14).stroke({ color: C.pink, width: 2 }));
    }

    const m = monster(28, ally.img);
    m.y = 12;
    if (ally.hp <= 0) m.alpha = 0.3;
    if (ally.inEgg) m.alpha = 0.4;
    ct.addChild(m);

    ct.addChild(cuteBar(-12, 24, 24, 3, ally.hp / ally.maxHp, C.hp));

    ct.eventMode = 'static'; ct.cursor = 'pointer';
    ct.on('pointerdown', () => {
      if (ally.hp > 0 && !ally.inEgg && combatState === 'active' && onSwitchAlly) {
        onSwitchAlly(i);
      }
    });
    refs.partyBar.addChild(ct);
  });
}

export function renderActions(ally, canBond) {
  refs.actionContainer.removeChildren();
  updateTabVisuals(canBond);

  refs.tabTaming.removeAllListeners();
  refs.tabBonding.removeAllListeners();
  refs.tabTaming.on('pointerdown', () => {
    currentMode = 'taming';
    renderActions(ally, canBond);
  });
  refs.tabBonding.on('pointerdown', () => {
    if (canBond) { currentMode = 'bonding'; renderActions(ally, canBond); }
  });

  if (currentMode === 'taming') {
    if (!ally) return;
    ally.actions.forEach((action, i) => {
      const y = i * 62;
      const ct = new PIXI.Container(); ct.y = y;
      ct.eventMode = 'static'; ct.cursor = 'pointer';

      ct.addChild(softPanel(14, 0, W - 28, 54, C.white, i === 0 ? C.pink : C.border));

      const axColor = AXIS_COLORS[action.axis] || C.lavender;
      ct.addChild(new PIXI.Graphics().circle(40, 27, 16).fill({ color: axColor }));
      const axLbl = lbl(AXIS_LABELS[action.axis] || '?', 7, 0xffffff, true);
      axLbl.anchor = { x: 0.5, y: 0.5 }; axLbl.x = 40; axLbl.y = 27;
      ct.addChild(axLbl);

      ct.addChild(Object.assign(lbl(action.name, 12, C.text, true), { x: 64, y: 8 }));
      ct.addChild(Object.assign(lbl(action.log, 8, C.dim), { x: 64, y: 30 }));

      ct.on('pointerdown', () => { if (onAction) onAction(i); });
      refs.actionContainer.addChild(ct);
    });
  } else {
    BONDING_ACTIONS.forEach((bonding, i) => {
      const y = i * 62;
      const ct = new PIXI.Container(); ct.y = y;
      ct.eventMode = 'static'; ct.cursor = 'pointer';

      ct.addChild(softPanel(14, 0, W - 28, 54, 0xfff8ee, C.orange));

      ct.addChild(new PIXI.Graphics().circle(40, 27, 16).fill({ color: C.orange }));
      const ic = lbl('HB', 7, 0xffffff, true);
      ic.anchor = { x: 0.5, y: 0.5 }; ic.x = 40; ic.y = 27;
      ct.addChild(ic);

      ct.addChild(Object.assign(lbl(bonding.name, 12, C.text, true), { x: 64, y: 8 }));
      ct.addChild(Object.assign(lbl(bonding.desc, 8, C.dim), { x: 64, y: 30 }));

      if (canBond) {
        ct.on('pointerdown', () => { if (onBonding) onBonding(i); });
      } else {
        ct.alpha = 0.4;
      }
      refs.actionContainer.addChild(ct);
    });
  }
}

function updateTabVisuals(canBond) {
  refs.tabTaming.removeChildren();
  refs.tabBonding.removeChildren();
  const tabY = 396;

  const tamingActive = currentMode === 'taming';
  refs.tabTaming.addChild(new PIXI.Graphics()
    .roundRect(14, tabY, W / 2 - 18, 30, 15)
    .fill({ color: tamingActive ? C.pink : C.dimmer }));
  const t1 = lbl('순화 행동', 10, 0xffffff, true);
  t1.anchor = { x: 0.5, y: 0.5 }; t1.x = W / 4 + 2; t1.y = tabY + 15;
  refs.tabTaming.addChild(t1);

  const bondActive = currentMode === 'bonding';
  refs.tabBonding.addChild(new PIXI.Graphics()
    .roundRect(W / 2 + 4, tabY, W / 2 - 18, 30, 15)
    .fill({ color: bondActive ? C.orange : (canBond ? C.dimmer : 0xddccdd) }));
  const t2 = lbl('인간 교감', 10, canBond ? 0xffffff : 0xddbbdd, true);
  t2.anchor = { x: 0.5, y: 0.5 }; t2.x = W * 3 / 4 + 2; t2.y = tabY + 15;
  refs.tabBonding.addChild(t2);
  if (!canBond) {
    const lockTxt = lbl('TAME 50%+', 6, 0xddbbdd);
    lockTxt.anchor = { x: 0.5, y: 0.5 }; lockTxt.x = W * 3 / 4 + 2; lockTxt.y = tabY + 30;
    refs.tabBonding.addChild(lockTxt);
  }
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
export function tickCombat(tick) {
  const bounce = Math.sin(tick * 3);
  if (refs.enemySprite && refs.enemyBaseY != null) {
    refs.enemySprite.y = refs.enemyBaseY + bounce * 4;
    refs.enemySprite.scale.set(1 + Math.sin(tick * 3) * 0.02, 1 - Math.sin(tick * 3) * 0.02);
  }
  if (refs.allySprite && refs.allyBaseY != null) {
    refs.allySprite.y = refs.allyBaseY - bounce * 3;
    refs.allySprite.scale.set(1 - Math.sin(tick * 3 + 0.5) * 0.02, 1 + Math.sin(tick * 3 + 0.5) * 0.02);
  }
  sparkles.forEach(s => {
    s.g.alpha = 0.1 + Math.sin(tick * s.speed * 5 + s.phase) * 0.15;
  });

  // Weather particles
  for (const p of weatherParticles) {
    if (p.type === 'rain') {
      p.g.y += p.speed * 2;
      p.g.x -= 0.3;
      if (p.g.y > 340) { p.g.y = -10; p.g.x = Math.random() * W; }
    } else if (p.type === 'snow') {
      p.g.y += p.speed * 0.5;
      p.g.x += Math.sin(tick * 2 + p.phase) * 0.3;
      if (p.g.y > 340) { p.g.y = -5; p.g.x = Math.random() * W; }
    } else if (p.type === 'ember') {
      p.g.y -= p.speed * 0.4;
      p.g.x += Math.sin(tick * 3 + p.phase) * 0.5;
      p.g.alpha = 0.3 + Math.sin(tick * 4 + p.phase) * 0.3;
      if (p.g.y < -10) { p.g.y = 340; p.g.x = Math.random() * W; }
    } else if (p.type === 'leaf') {
      p.g.x -= p.speed * 1.5;
      p.g.y += Math.sin(tick * 3 + p.phase) * 0.8;
      p.g.rotation = tick * 2 + p.phase;
      if (p.g.x < -20) { p.g.x = W + 10; p.g.y = Math.random() * 300; }
    }
  }

  // Danmaku scroll (right → left)
  for (let i = danmakuItems.length - 1; i >= 0; i--) {
    const d = danmakuItems[i];
    d.sprite.x -= d.speed * 1.2;
    // Fade out as it approaches left edge
    if (d.sprite.x < 60) {
      d.sprite.alpha = Math.max(0, d.sprite.alpha - 0.03);
    }
    // Remove when fully off-screen or invisible
    if (d.sprite.x < -400 || d.sprite.alpha <= 0) {
      refs.danmakuLayer.removeChild(d.sprite);
      d.sprite.destroy();
      danmakuItems.splice(i, 1);
    }
  }
}
