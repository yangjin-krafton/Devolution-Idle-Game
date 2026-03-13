// ============================================================
// Background Builder — sky, ground, weather, decoration helpers
// Extracted from battleFieldUI.js for modularity.
// ============================================================

import { W, C, addSparkles } from './theme.js';

export function buildSun(layer) {
  const sx = W * 0.82, sy = 38;
  const g = new PIXI.Graphics();
  g.circle(sx, sy, 28).fill({ color: 0xffee88, alpha: 0.15 });
  g.circle(sx, sy, 20).fill({ color: 0xffee88, alpha: 0.25 });
  g.circle(sx, sy, 13).fill({ color: 0xffdd55 });
  g.circle(sx, sy, 10).fill({ color: 0xffee99 });
  g.circle(sx - 3, sy - 3, 4).fill({ color: 0xfffff0, alpha: 0.6 });
  layer.addChild(g);
}

export function buildMoon(layer) {
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

export function buildClouds(layer, sky) {
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

export function buildDistantLayer(layer, ground) {
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

export function buildGroundTexture(layer, ground) {
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

export function buildGroundDeco(layer, ground) {
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

export function createWeatherParticle(config, layer) {
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

/**
 * Smoothly crossfade the battlefield background.
 */
export function crossfadeBackground(container, bgLayer) {
  if (!bgLayer || !container) return;
  const fadeDur = 500;
  const start = performance.now();
  const fadeOverlay = new PIXI.Graphics();
  fadeOverlay.rect(0, 0, W, 340).fill({ color: 0x000000, alpha: 0 });
  container.addChildAt(fadeOverlay, container.children.indexOf(bgLayer) + 1);

  (function tick() {
    const t = (performance.now() - start) / fadeDur;
    if (t >= 1) {
      if (fadeOverlay.parent) container.removeChild(fadeOverlay);
      fadeOverlay.destroy();
      return;
    }
    const darkness = t < 0.4
      ? t / 0.4 * 0.5
      : 0.5 * (1 - (t - 0.4) / 0.6);
    fadeOverlay.clear();
    fadeOverlay.rect(0, 0, W, 340).fill({ color: 0x000000, alpha: darkness });
    requestAnimationFrame(tick);
  })();
}
