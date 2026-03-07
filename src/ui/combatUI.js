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

// ---- Composable Background (High Quality) ----
export function applyBackground(env) {
  currentEnv = env;
  if (refs.bgLayer) { container.removeChild(refs.bgLayer); refs.bgLayer.destroy({ children: true }); }
  if (refs.timeTint) { container.removeChild(refs.timeTint); refs.timeTint.destroy(); }

  refs.bgLayer = new PIXI.Container();
  weatherParticles = [];
  sparkles = [];

  const { sky, ground, time } = env;

  // === SKY: multi-band gradient ===
  const bands = sky.gradient;
  const bandH = 200 / bands.length;
  for (let i = 0; i < bands.length; i++) {
    const g = new PIXI.Graphics();
    // slight overlap to avoid seams
    g.rect(0, i * bandH - 0.5, W, bandH + 1).fill({ color: bands[i] });
    refs.bgLayer.addChild(g);
  }
  // Horizon glow
  const horizonGlow = new PIXI.Graphics();
  horizonGlow.rect(0, 93, W, 30).fill({ color: sky.horizon, alpha: 0.35 });
  refs.bgLayer.addChild(horizonGlow);

  // === CELESTIAL BODY ===
  if (time.celestial === 'sun') {
    buildSun(refs.bgLayer);
  } else if (time.celestial === 'moon') {
    buildMoon(refs.bgLayer);
  }

  // === STARS (night only) ===
  if (time.starCount > 0) {
    const starsGfx = new PIXI.Graphics();
    for (let i = 0; i < time.starCount; i++) {
      const sx = Math.random() * W, sy = Math.random() * 150;
      const sr = 0.5 + Math.random() * 1.2;
      starsGfx.circle(sx, sy, sr).fill({ color: 0xffffff, alpha: 0.3 + Math.random() * 0.5 });
    }
    refs.bgLayer.addChild(starsGfx);
  }

  // === CLOUDS ===
  if (sky.clouds) buildClouds(refs.bgLayer, sky);

  // === DISTANT SILHOUETTE (mountains/buildings) ===
  buildDistantLayer(refs.bgLayer, ground);

  // === GROUND: 3-layer terrain ===
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
  // Flat base fill
  const base = new PIXI.Graphics();
  base.rect(0, 217, W, 123).fill({ color: ground.flat });
  refs.bgLayer.addChild(base);

  // === GROUND TEXTURE ===
  buildGroundTexture(refs.bgLayer, ground);

  // === GROUND EDGE HIGHLIGHT ===
  const edgeHL = new PIXI.Graphics();
  edgeHL.moveTo(0, 161).quadraticCurveTo(W / 2, 115, W, 153);
  edgeHL.stroke({ color: 0xffffff, width: 1.5, alpha: 0.15 });
  refs.bgLayer.addChild(edgeHL);

  // === DECORATIONS ===
  buildGroundDeco(refs.bgLayer, ground);

  // === WEATHER PARTICLES ===
  if (sky.particles) {
    refs.weatherLayer = new PIXI.Container();
    const p = sky.particles;
    for (let i = 0; i < p.count; i++) {
      weatherParticles.push(createWeatherParticle(p, refs.weatherLayer));
    }
    refs.bgLayer.addChild(refs.weatherLayer);
  }

  sparkles = addSparkles(refs.bgLayer, 5, W, 340);

  // === TIME-OF-DAY TINT ===
  refs.timeTint = new PIXI.Graphics();
  if (time.alpha > 0) {
    refs.timeTint.rect(0, 0, W, 340).fill({ color: time.tint, alpha: time.alpha });
  }

  container.addChildAt(refs.bgLayer, 0);
  const tintIdx = Math.min(1, container.children.length);
  container.addChildAt(refs.timeTint, tintIdx);
}

// --- Sun ---
function buildSun(layer) {
  const sx = W * 0.82, sy = 38;
  const g = new PIXI.Graphics();
  // Outer glow
  g.circle(sx, sy, 28).fill({ color: 0xffee88, alpha: 0.15 });
  g.circle(sx, sy, 20).fill({ color: 0xffee88, alpha: 0.25 });
  // Core
  g.circle(sx, sy, 13).fill({ color: 0xffdd55 });
  g.circle(sx, sy, 10).fill({ color: 0xffee99 });
  // Inner highlight
  g.circle(sx - 3, sy - 3, 4).fill({ color: 0xfffff0, alpha: 0.6 });
  layer.addChild(g);
}

// --- Moon ---
function buildMoon(layer) {
  const mx = W * 0.78, my = 42;
  const g = new PIXI.Graphics();
  // Outer glow
  g.circle(mx, my, 24).fill({ color: 0xccccff, alpha: 0.12 });
  g.circle(mx, my, 16).fill({ color: 0xccccff, alpha: 0.2 });
  // Disc
  g.circle(mx, my, 11).fill({ color: 0xeeeeff });
  // Crescent shadow
  g.circle(mx + 5, my - 2, 9).fill({ color: 0x222244, alpha: 0.25 });
  // Craters
  g.circle(mx - 3, my + 2, 2).fill({ color: 0xccccdd, alpha: 0.4 });
  g.circle(mx + 1, my - 4, 1.5).fill({ color: 0xccccdd, alpha: 0.3 });
  layer.addChild(g);
}

// --- Clouds ---
function buildClouds(layer, sky) {
  const style = sky.clouds; // 'fluffy', 'heavy', 'streaky'
  const isHeavy = style === 'heavy';
  const isStreaky = style === 'streaky';

  const defs = isHeavy
    ? [{ x: 40, y: 35, s: 1.4 }, { x: 150, y: 20, s: 1.1 }, { x: 280, y: 30, s: 1.6 }, { x: 400, y: 18, s: 1.2 }, { x: 460, y: 40, s: 0.9 }]
    : [{ x: 70, y: 38, s: 1.0 }, { x: 240, y: 22, s: 1.4 }, { x: 420, y: 48, s: 0.9 }];

  if (isStreaky) {
    // Wind-streaked clouds — elongated horizontal wisps
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
    // Bottom shadow
    g.ellipse(cl.x, cl.y + 8 * s, 28 * s, 8 * s).fill({ color: 0x000000, alpha: 0.03 });
    // Cloud body — many overlapping circles
    const circles = [
      { dx: 0, dy: 0, r: 18 }, { dx: -20, dy: 4, r: 13 }, { dx: 18, dy: 3, r: 14 },
      { dx: -10, dy: -6, r: 12 }, { dx: 10, dy: -5, r: 13 },
      { dx: -28, dy: 6, r: 9 }, { dx: 26, dy: 5, r: 10 },
    ];
    for (const c of circles) {
      g.circle(cl.x + c.dx * s, cl.y + c.dy * s, c.r * s).fill({ color: 0xffffff, alpha: baseAlpha });
    }
    // Top highlight
    g.circle(cl.x - 4 * s, cl.y - 6 * s, 8 * s).fill({ color: 0xffffff, alpha: baseAlpha + 0.15 });
    layer.addChild(g);
  }
}

// --- Distant Layer (mountains / cityscape silhouette) ---
function buildDistantLayer(layer, ground) {
  const g = new PIXI.Graphics();
  const col = ground.distant;

  if (ground.id === 'asphalt') {
    // City skyline silhouette
    const buildings = [
      { x: 30, w: 25, h: 35 }, { x: 70, w: 18, h: 50 }, { x: 100, w: 30, h: 28 },
      { x: 160, w: 15, h: 55 }, { x: 190, w: 35, h: 32 }, { x: 250, w: 20, h: 45 },
      { x: 290, w: 28, h: 38 }, { x: 340, w: 15, h: 60 }, { x: 370, w: 30, h: 30 },
      { x: 420, w: 22, h: 42 }, { x: 455, w: 18, h: 35 },
    ];
    for (const b of buildings) {
      g.rect(b.x, 127 - b.h, b.w, b.h + 10).fill({ color: col, alpha: 0.25 });
    }
  } else if (ground.id === 'sea') {
    // Distant islands / horizon line
    g.ellipse(80, 125, 40, 8).fill({ color: col, alpha: 0.2 });
    g.ellipse(350, 122, 55, 10).fill({ color: col, alpha: 0.15 });
  } else {
    // Rolling mountains
    g.moveTo(0, 132)
      .quadraticCurveTo(60, 107, 120, 125)
      .quadraticCurveTo(180, 97, 240, 122)
      .quadraticCurveTo(310, 92, 370, 117)
      .quadraticCurveTo(420, 102, W, 127)
      .lineTo(W, 142).lineTo(0, 142).closePath()
      .fill({ color: col, alpha: 0.2 });
    // Second ridge
    g.moveTo(0, 135)
      .quadraticCurveTo(100, 117, 200, 132)
      .quadraticCurveTo(300, 112, 400, 129)
      .quadraticCurveTo(450, 122, W, 135)
      .lineTo(W, 147).lineTo(0, 147).closePath()
      .fill({ color: col, alpha: 0.15 });
  }
  layer.addChild(g);
}

// --- Ground Texture ---
function buildGroundTexture(layer, ground) {
  const g = new PIXI.Graphics();
  switch (ground.texture) {
    case 'grass_blades':
      for (let i = 0; i < 50; i++) {
        const bx = Math.random() * W, by = 165 + Math.random() * 163;
        const bh = 4 + Math.random() * 6;
        g.moveTo(bx, by).lineTo(bx - 1 + Math.random() * 2, by - bh);
        g.stroke({ color: 0x55aa77, width: 1, alpha: 0.2 + Math.random() * 0.15 });
      }
      break;
    case 'sand_dots':
      for (let i = 0; i < 60; i++) {
        const dx = Math.random() * W, dy = 167 + Math.random() * 163;
        const ds = 0.5 + Math.random() * 1.5;
        g.circle(dx, dy, ds).fill({ color: 0xccaa55, alpha: 0.15 + Math.random() * 0.15 });
      }
      // Wind ripple lines
      for (let i = 0; i < 5; i++) {
        const ry = 177 + i * 28 + Math.random() * 5;
        const rx = 20 + Math.random() * 40;
        g.moveTo(rx, ry).quadraticCurveTo(rx + 60, ry - 2, rx + 120, ry);
        g.stroke({ color: 0xbbaa66, width: 0.8, alpha: 0.15 });
      }
      break;
    case 'rock_speckle':
      for (let i = 0; i < 40; i++) {
        const rx = Math.random() * W, ry = 167 + Math.random() * 163;
        g.circle(rx, ry, 0.5 + Math.random() * 1.5).fill({ color: 0x665555, alpha: 0.12 + Math.random() * 0.1 });
      }
      // Subtle layering lines
      for (let i = 0; i < 4; i++) {
        const ly = 185 + i * 31;
        g.moveTo(30 + Math.random() * 50, ly).lineTo(W - 30 - Math.random() * 50, ly + Math.random() * 3);
        g.stroke({ color: 0x554444, width: 0.6, alpha: 0.1 });
      }
      break;
    case 'swamp_murk':
      for (let i = 0; i < 35; i++) {
        const mx = Math.random() * W, my = 169 + Math.random() * 159;
        g.circle(mx, my, 1 + Math.random() * 2).fill({ color: 0x446644, alpha: 0.12 + Math.random() * 0.1 });
      }
      // Dark water patches
      for (let i = 0; i < 4; i++) {
        const px = 40 + Math.random() * (W - 80), py = 187 + Math.random() * 110;
        g.ellipse(px, py, 15 + Math.random() * 20, 4 + Math.random() * 3).fill({ color: 0x335533, alpha: 0.15 });
      }
      break;
    case 'water_ripple':
      for (let i = 0; i < 8; i++) {
        const wy = 169 + i * 19;
        const offset = Math.random() * 30;
        g.moveTo(offset, wy)
          .quadraticCurveTo(offset + W * 0.25, wy - 3, offset + W * 0.5, wy)
          .quadraticCurveTo(offset + W * 0.75, wy + 3, W, wy);
        g.stroke({ color: 0x88ccee, width: 0.8, alpha: 0.12 + Math.random() * 0.08 });
      }
      break;
    case 'asphalt_grain':
      for (let i = 0; i < 50; i++) {
        const ax = Math.random() * W, ay = 167 + Math.random() * 163;
        g.circle(ax, ay, 0.3 + Math.random() * 0.8).fill({ color: 0x555560, alpha: 0.12 + Math.random() * 0.08 });
      }
      break;
  }
  layer.addChild(g);
}

// --- Ground Decorations ---
function buildGroundDeco(layer, ground) {
  switch (ground.deco) {
    case 'flowers': {
      // Flower clusters
      for (let i = 0; i < 10; i++) {
        const fx = 20 + Math.random() * (W - 40), fy = 169 + Math.random() * 130;
        const fl = new PIXI.Graphics();
        const col = [C.pink, C.yellow, C.lavender, 0xffffff, 0xff99bb, 0xaaddff][i % 6];
        // Petals
        for (let p = 0; p < 4; p++) {
          const angle = (p / 4) * Math.PI * 2;
          fl.circle(fx + Math.cos(angle) * 2.5, fy + Math.sin(angle) * 2.5, 2).fill({ color: col, alpha: 0.8 });
        }
        fl.circle(fx, fy, 1.5).fill({ color: C.yellow });
        // Stem
        fl.moveTo(fx, fy + 2).lineTo(fx, fy + 6);
        fl.stroke({ color: 0x66aa77, width: 0.8, alpha: 0.5 });
        layer.addChild(fl);
      }
      // Grass tufts
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
      // Varied rock shapes
      for (let i = 0; i < 8; i++) {
        const rx = 30 + Math.random() * (W - 60), ry = 172 + Math.random() * 125;
        const rk = new PIXI.Graphics();
        const rw = 4 + Math.random() * 8, rh = 3 + Math.random() * 5;
        rk.ellipse(rx, ry, rw, rh).fill({ color: 0xbbaa88, alpha: 0.55 + Math.random() * 0.2 });
        // Highlight
        rk.ellipse(rx - rw * 0.2, ry - rh * 0.3, rw * 0.5, rh * 0.3).fill({ color: 0xddccaa, alpha: 0.3 });
        // Shadow
        rk.ellipse(rx, ry + rh * 0.6, rw * 0.8, 2).fill({ color: 0x000000, alpha: 0.08 });
        layer.addChild(rk);
      }
      // Cacti / dead bushes
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
        cr.moveTo(cx, cy)
          .lineTo(cx + len * 0.4, cy + (Math.random() * 6 - 3))
          .lineTo(cx + len * 0.7, cy + (Math.random() * 8 - 4))
          .lineTo(cx + len, cy + (Math.random() * 6 - 3));
        cr.stroke({ color: 0x443333, width: 1 + Math.random(), alpha: 0.25 + Math.random() * 0.15 });
        // Branch crack
        const branchX = cx + len * (0.3 + Math.random() * 0.3);
        const branchY = cy + (Math.random() * 4 - 2);
        cr.moveTo(branchX, branchY).lineTo(branchX + 6, branchY + (Math.random() * 6 - 3));
        cr.stroke({ color: 0x443333, width: 0.8, alpha: 0.2 });
        layer.addChild(cr);
      }
      // Loose pebbles
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
        // Highlight
        bb.circle(bx - br * 0.3, by - br * 0.3, br * 0.3).fill({ color: 0xffffff, alpha: 0.4 });
        layer.addChild(bb);
      }
      // Lily pads
      for (let i = 0; i < 4; i++) {
        const lx = 60 + Math.random() * (W - 120), ly = 185 + Math.random() * 110;
        const lp = new PIXI.Graphics();
        lp.circle(lx, ly, 5 + Math.random() * 3).fill({ color: 0x55aa66, alpha: 0.35 });
        // Notch
        lp.moveTo(lx, ly).lineTo(lx + 6, ly - 2).lineTo(lx + 6, ly + 2).closePath().fill({ color: 0x669977, alpha: 0.35 });
        layer.addChild(lp);
      }
      // Reeds
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
        const amp = 4 + Math.random() * 4;
        const off = Math.random() * 50;
        wv.moveTo(-off, wy)
          .quadraticCurveTo(W * 0.15 - off, wy - amp, W * 0.3 - off, wy)
          .quadraticCurveTo(W * 0.45 - off, wy + amp, W * 0.6 - off, wy)
          .quadraticCurveTo(W * 0.75 - off, wy - amp * 0.7, W * 0.9 - off, wy)
          .quadraticCurveTo(W * 1.05 - off, wy + amp * 0.5, W + 20, wy);
        wv.stroke({ color: 0xffffff, width: 1 + (i < 2 ? 0.5 : 0), alpha: 0.15 + (i < 2 ? 0.1 : 0) });
        layer.addChild(wv);
      }
      // Foam patches
      for (let i = 0; i < 5; i++) {
        const fx = 30 + Math.random() * (W - 60), fy = 172 + Math.random() * 125;
        const fm = new PIXI.Graphics();
        fm.ellipse(fx, fy, 8 + Math.random() * 6, 2).fill({ color: 0xffffff, alpha: 0.12 + Math.random() * 0.08 });
        layer.addChild(fm);
      }
      break;
    }
    case 'lines': {
      // Road markings
      // Center dashed line
      for (let i = 0; i < 8; i++) {
        const lx = 40 + i * 55, ly = 195;
        const ln = new PIXI.Graphics();
        ln.roundRect(lx, ly, 25, 3, 1.5).fill({ color: 0xdddd88, alpha: 0.35 });
        layer.addChild(ln);
      }
      // Side lines
      for (const ly of [177, 215]) {
        const sl = new PIXI.Graphics();
        sl.moveTo(15, ly).lineTo(W - 15, ly);
        sl.stroke({ color: 0xaaaaaa, width: 1.5, alpha: 0.2 });
        layer.addChild(sl);
      }
      // Manholes
      for (const mx of [W * 0.3, W * 0.7]) {
        const mh = new PIXI.Graphics();
        mh.circle(mx, 202, 7).fill({ color: 0x666670, alpha: 0.4 });
        mh.circle(mx, 202, 5.5).stroke({ color: 0x555560, width: 1.5, alpha: 0.3 });
        // Cross pattern
        mh.moveTo(mx - 3, 202).lineTo(mx + 3, 202);
        mh.moveTo(mx, 199).lineTo(mx, 205);
        mh.stroke({ color: 0x555560, width: 0.8, alpha: 0.25 });
        layer.addChild(mh);
      }
      // Curbstone
      const curb = new PIXI.Graphics();
      curb.roundRect(5, 165, W - 10, 5, 2).fill({ color: 0xaaaaaa, alpha: 0.2 });
      layer.addChild(curb);
      break;
    }
  }
}

// --- Weather Particle ---
function createWeatherParticle(config, layer) {
  const g = new PIXI.Graphics();
  const x = Math.random() * W;
  const y = Math.random() * 340;

  if (config.type === 'rain') {
    // Angled rain drop with gradient thickness
    g.moveTo(0, 0).lineTo(-2, config.size * 5);
    g.stroke({ color: config.color, width: 1.5, alpha: 0.4 + Math.random() * 0.2 });
  } else if (config.type === 'leaf') {
    // Leaf shape with vein
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
    // Bright core
    g.circle(-r * 0.2, -r * 0.2, r * 0.25).fill({ color: 0xffee88, alpha: 0.5 });
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
  const ePlatX = W * 0.68, ePlatY = 70;

  // Foot shadow (ellipse)
  refs.enemyShadow = new PIXI.Graphics();
  refs.enemyShadow.ellipse(ePlatX, ePlatY + 42, 36, 10).fill({ color: 0x000000, alpha: 0.15 });
  container.addChild(refs.enemyShadow);

  refs.enemySprite = new PIXI.Container();
  refs.enemySprite.x = ePlatX; refs.enemySprite.y = ePlatY;
  refs.enemyBaseY = ePlatY;
  container.addChild(refs.enemySprite);

  refs.enemyInfo = new PIXI.Container();
  refs.enemyInfo.x = 10; refs.enemyInfo.y = 35;
  container.addChild(refs.enemyInfo);
}

function buildAllyArea() {
  const aPlatX = W * 0.28, aPlatY = 270;

  // Foot shadow (ellipse)
  refs.allyShadow = new PIXI.Graphics();
  refs.allyShadow.ellipse(aPlatX, aPlatY + 50, 40, 12).fill({ color: 0x000000, alpha: 0.13 });
  container.addChild(refs.allyShadow);

  refs.allySprite = new PIXI.Container();
  refs.allySprite.x = aPlatX; refs.allySprite.y = aPlatY;
  refs.allyBaseY = aPlatY;
  container.addChild(refs.allySprite);

  refs.allyInfo = new PIXI.Container();
  refs.allyInfo.x = W - 290; refs.allyInfo.y = 220;
  container.addChild(refs.allyInfo);
}

function buildPartyBar() {
  const y = 340;
  container.addChild(new PIXI.Graphics().roundRect(8, y, W - 16, 50, 12).fill({ color: 0xffffff, alpha: 0.6 }));
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
  const actBg = 395;
  container.addChild(new PIXI.Graphics().roundRect(0, actBg, W, H - actBg, 24).fill({ color: C.cream }));

  // Mode tabs
  refs.tabTaming = new PIXI.Container();
  refs.tabBonding = new PIXI.Container();
  container.addChild(refs.tabTaming);
  container.addChild(refs.tabBonding);

  // Action card container
  refs.actionContainer = new PIXI.Container();
  refs.actionContainer.y = 470;
  container.addChild(refs.actionContainer);
}

// ============================================================
// Dynamic Rendering
// ============================================================

export function renderEnemy(enemy) {
  refs.enemySprite.removeChildren();
  refs.enemySprite.addChild(monster(130, enemy.img));

  refs.enemyInfo.removeChildren();
  refs.enemyInfo.addChild(softPanel(0, 0, 280, 120, C.white, C.lavender));
  refs.enemyInfo.addChild(Object.assign(lbl(enemy.name, 11, C.text, true), { x: 14, y: 8 }));
  refs.enemyInfo.addChild(Object.assign(lbl('TAME', 8, C.taming), { x: 14, y: 42 }));
  refs.tamingBar = cuteBar(80, 44, 180, 16, 0, C.taming);
  refs.enemyInfo.addChild(refs.tamingBar);
  refs.enemyInfo.addChild(Object.assign(lbl('ESC', 8, C.escape), { x: 14, y: 72 }));
  refs.escapeBar = cuteBar(80, 74, 180, 16, 0, C.escape);
  refs.enemyInfo.addChild(refs.escapeBar);
}

export function updateGauges(tamingPercent, escapePercent) {
  if (refs.tamingBar) {
    const idx = refs.enemyInfo.children.indexOf(refs.tamingBar);
    if (idx >= 0) refs.enemyInfo.removeChildAt(idx);
    refs.tamingBar = cuteBar(80, 44, 180, 16, tamingPercent / 100, C.taming);
    refs.enemyInfo.addChildAt(refs.tamingBar, Math.min(idx, refs.enemyInfo.children.length));
  }
  if (refs.escapeBar) {
    const idx = refs.enemyInfo.children.indexOf(refs.escapeBar);
    if (idx >= 0) refs.enemyInfo.removeChildAt(idx);
    refs.escapeBar = cuteBar(80, 74, 180, 16, escapePercent / 100, C.escape);
    refs.enemyInfo.addChildAt(refs.escapeBar, Math.min(idx, refs.enemyInfo.children.length));
  }
}

export function renderAlly(ally) {
  if (!ally) return;
  refs.allySprite.removeChildren();
  const m = monster(168, ally.img);
  m.scale.x = -1;
  refs.allySprite.addChild(m);

  refs.allyInfo.removeChildren();
  refs.allyInfo.addChild(softPanel(0, 0, 280, 110, C.white, C.pinkLight));
  refs.allyInfo.addChild(Object.assign(lbl(ally.name, 11, C.text, true), { x: 14, y: 8 }));
  refs.allyInfo.addChild(Object.assign(lbl('Lv.' + (ally.level || 1), 9, C.dim), { x: 200, y: 10 }));
  refs.allyInfo.addChild(Object.assign(lbl('HP', 8, C.hp), { x: 14, y: 42 }));
  const hpRatio = ally.hp / ally.maxHp;
  refs.allyInfo.addChild(cuteBar(60, 44, 200, 16, hpRatio, hpRatio > 0.3 ? C.hp : C.hpLow));
  refs.allyInfo.addChild(Object.assign(lbl(ally.hp + '/' + ally.maxHp, 8, C.dim), { x: 200, y: 68 }));
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
    fontSize: 22, fill: hex(color), fontWeight: 'bold',
    dropShadow: { color: '#000000', alpha: 0.5, blur: 2, distance: 1 },
  }});
  t.alpha = 0.85;

  // Stagger Y position across available lanes
  const lanes = [10, 40, 70, 100, 130];
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
      const y = i * 100;
      const ct = new PIXI.Container(); ct.y = y;
      ct.eventMode = 'static'; ct.cursor = 'pointer';

      ct.addChild(softPanel(14, 0, W - 28, 90, C.white, i === 0 ? C.pink : C.border));

      const axColor = AXIS_COLORS[action.axis] || C.lavender;
      ct.addChild(new PIXI.Graphics().circle(44, 45, 24).fill({ color: axColor }));
      const axLbl = lbl(AXIS_LABELS[action.axis] || '?', 7, 0xffffff, true);
      axLbl.anchor = { x: 0.5, y: 0.5 }; axLbl.x = 44; axLbl.y = 45;
      ct.addChild(axLbl);

      ct.addChild(Object.assign(lbl(action.name, 12, C.text, true), { x: 80, y: 10 }));
      ct.addChild(Object.assign(lbl(action.log, 8, C.dim), { x: 80, y: 48 }));

      ct.on('pointerdown', () => { if (onAction) onAction(i); });
      refs.actionContainer.addChild(ct);
    });
  } else {
    BONDING_ACTIONS.forEach((bonding, i) => {
      const y = i * 100;
      const ct = new PIXI.Container(); ct.y = y;
      ct.eventMode = 'static'; ct.cursor = 'pointer';

      ct.addChild(softPanel(14, 0, W - 28, 90, 0xfff8ee, C.orange));

      ct.addChild(new PIXI.Graphics().circle(44, 45, 24).fill({ color: C.orange }));
      const ic = lbl('HB', 7, 0xffffff, true);
      ic.anchor = { x: 0.5, y: 0.5 }; ic.x = 44; ic.y = 45;
      ct.addChild(ic);

      ct.addChild(Object.assign(lbl(bonding.name, 12, C.text, true), { x: 80, y: 10 }));
      ct.addChild(Object.assign(lbl(bonding.desc, 8, C.dim), { x: 80, y: 48 }));

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
  const tabY = 406;

  const tamingActive = currentMode === 'taming';
  refs.tabTaming.addChild(new PIXI.Graphics()
    .roundRect(14, tabY, W / 2 - 18, 50, 20)
    .fill({ color: tamingActive ? C.pink : C.dimmer }));
  const t1 = lbl('순화 행동', 10, 0xffffff, true);
  t1.anchor = { x: 0.5, y: 0.5 }; t1.x = W / 4 + 2; t1.y = tabY + 25;
  refs.tabTaming.addChild(t1);

  const bondActive = currentMode === 'bonding';
  refs.tabBonding.addChild(new PIXI.Graphics()
    .roundRect(W / 2 + 4, tabY, W / 2 - 18, 50, 20)
    .fill({ color: bondActive ? C.orange : (canBond ? C.dimmer : 0xddccdd) }));
  const t2 = lbl('인간 교감', 10, canBond ? 0xffffff : 0xddbbdd, true);
  t2.anchor = { x: 0.5, y: 0.5 }; t2.x = W * 3 / 4 + 2; t2.y = tabY + 25;
  refs.tabBonding.addChild(t2);
  if (!canBond) {
    const lockTxt = lbl('TAME 50%+', 6, 0xddbbdd);
    lockTxt.anchor = { x: 0.5, y: 0.5 }; lockTxt.x = W * 3 / 4 + 2; lockTxt.y = tabY + 50;
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
