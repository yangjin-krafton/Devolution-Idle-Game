// ============================================================
// Dark / Neon Theme — shared palette & components
// ============================================================

import { S, lbl } from './theme.js';

// ---- Dark palette ----
export const D = {
  bg:      0x1a1a2e,  bgAlt:   0x222238,  card:    0x262640,  cardHi:  0x2e2e48,
  neon:    0x00d4aa,   neonDim: 0x009977,
  red:     0xff6b6b,   redDark: 0xcc4444,
  blue:    0x4dabf7,   blueDark:0x2b7fc4,
  orange:  0xffaa60,
  text:    0xddddf0,   dim:     0x8888aa,  dimmer:  0x555577,  sep:     0x444466,
  panel:   0x1e1e34,   white:   0xffffff,  black:   0x000000,
};

// ---- Dark card with shadow + frost ----
export function darkCard(w, h, r, fill, border, hasShadow) {
  const g = new PIXI.Graphics();
  if (hasShadow) g.roundRect(2, 3, w, h, r).fill({ color: D.black, alpha: 0.2 });
  g.roundRect(0, 0, w, h, r).fill({ color: fill });
  g.roundRect(0, 0, w, h, r).stroke({ color: border, width: 1.5 });
  g.roundRect(3, 2, w - 6, h * 0.18, r - 1).fill({ color: D.white, alpha: 0.04 });
  return g;
}

// ---- Stat bar ----
export function statBar(x, y, w, h, ratio, color) {
  const c = new PIXI.Container(); c.x = x; c.y = y;
  const r = h / 2;
  c.addChild(new PIXI.Graphics().roundRect(0, 0, w, h, r).fill({ color: D.sep, alpha: 0.6 }));
  if (ratio > 0) {
    c.addChild(new PIXI.Graphics()
      .roundRect(0.5, 0.5, Math.max(h, (w - 1) * Math.min(1, ratio)), h - 1, r)
      .fill({ color }));
  }
  return c;
}

// ---- Neon badge ----
export function neonBadge(text, color) {
  const c = new PIXI.Container();
  const tw = text.length * 5 * S + 14;
  c.addChild(new PIXI.Graphics().roundRect(0, 0, tw, 14, 7)
    .fill({ color, alpha: 0.2 }).stroke({ color, width: 1, alpha: 0.5 }));
  const t = lbl(text, 5, color, true);
  t.anchor = { x: 0.5, y: 0.5 }; t.x = tw / 2; t.y = 7;
  c.addChild(t);
  return c;
}

// ---- Feed card (messenger-style with left accent line) ----
export function feedCard(w, h, accentColor) {
  const r = 14;
  const g = new PIXI.Graphics();
  g.roundRect(2, 3, w, h, r).fill({ color: D.black, alpha: 0.2 });
  g.roundRect(0, 0, w, h, r).fill({ color: D.panel });
  g.roundRect(0, 0, w, h, r).stroke({ color: D.sep, width: 1, alpha: 0.4 });
  g.roundRect(0, 4, 4, h - 8, 2).fill({ color: accentColor, alpha: 0.6 });
  g.roundRect(6, 2, w - 12, h * 0.08, r - 2).fill({ color: D.white, alpha: 0.03 });
  return g;
}
