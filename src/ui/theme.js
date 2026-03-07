// ============================================================
// Kirby Cute Theme — colors, text helpers, UI components
// ============================================================

export const W = 480;
export const H = 850;
export const S = 2; // UI text scale factor for mobile readability

export const C = {
  bg: 0xffe8f0, bgAlt: 0xfff4f8,
  pink: 0xff88aa, pinkLight: 0xffb8cc, pinkDark: 0xdd6688,
  cream: 0xfff8e8, yellow: 0xffe060, yellowLight: 0xfff0a0,
  orange: 0xffaa60, red: 0xff6070,
  sky: 0xc0e8ff, skyDark: 0x90c0e8,
  mint: 0x88ddbb, mintLight: 0xb0f0d8,
  lavender: 0xccaaee, lavLight: 0xe0d0ff,
  white: 0xffffff, text: 0x554455, dim: 0x998899, dimmer: 0xccbbcc,
  border: 0xeebbcc,
  water: 0x88bbee, fire: 0xffaa77, leaf: 0x88cc88, dark: 0xbb99dd,
  hp: 0x88dd88, hpLow: 0xff8888,
  taming: 0x88bbff, escape: 0xff8877,
  xp: 0xffe060,
  panel: 0xfff0f4,
};

export function hex(c) {
  return '#' + c.toString(16).padStart(6, '0');
}

export function lbl(text, size, color, bold) {
  return new PIXI.Text({ text, style: {
    fontFamily: '"M PLUS Rounded 1c", "Noto Sans KR", sans-serif',
    fontSize: size * S,
    fill: typeof color === 'number' ? hex(color) : color,
    fontWeight: bold ? '800' : '400',
  }});
}

// Soft rounded panel with shadow + inner highlight
export function softPanel(x, y, w, h, fill, borderCol) {
  const g = new PIXI.Graphics();
  const r = Math.min(20, h / 3);
  g.roundRect(x + 2, y + 3, w, h, r).fill({ color: 0x000000, alpha: 0.06 });
  g.roundRect(x, y, w, h, r).fill({ color: fill || C.white });
  g.roundRect(x, y, w, h, r).stroke({ color: borderCol || C.border, width: 2.5 });
  g.roundRect(x + 4, y + 2, w - 8, h * 0.3, r - 2).fill({ color: 0xffffff, alpha: 0.3 });
  return g;
}

// Cute rounded bar
export function cuteBar(x, y, w, h, ratio, fillColor, bgColor) {
  const c = new PIXI.Container(); c.x = x; c.y = y;
  const r = h / 2;
  c.addChild(new PIXI.Graphics().roundRect(0, 0, w, h, r).fill({ color: bgColor || 0xeedde0 }));
  if (ratio > 0) {
    c.addChild(new PIXI.Graphics().roundRect(1, 1, Math.max(h, (w - 2) * ratio), h - 2, r - 1).fill({ color: fillColor }));
  }
  return c;
}

// Cute pill-shaped button
export function cuteBtn(x, y, w, h, text, bgColor, textColor) {
  const bw = w * S, bh = h * S;
  const c = new PIXI.Container(); c.x = x; c.y = y;
  const r = bh / 2;
  c.addChild(new PIXI.Graphics().roundRect(2, 3, bw, bh, r).fill({ color: 0x000000, alpha: 0.08 }));
  c.addChild(new PIXI.Graphics().roundRect(0, 0, bw, bh, r).fill({ color: bgColor || C.pink }));
  c.addChild(new PIXI.Graphics().roundRect(4, 2, bw - 8, bh * 0.4, r).fill({ color: 0xffffff, alpha: 0.25 }));
  const t = lbl(text, 11, textColor || 0xffffff, true);
  t.anchor = { x: 0.5, y: 0.5 }; t.x = bw / 2; t.y = bh / 2;
  c.addChild(t);
  c.eventMode = 'static'; c.cursor = 'pointer';
  return c;
}

// Star decoration
export function star(x, y, size, color) {
  const g = new PIXI.Graphics();
  const pts = 5, outer = size, inner = size * 0.4;
  for (let i = 0; i < pts * 2; i++) {
    const rad = i % 2 === 0 ? outer : inner;
    const angle = (i * Math.PI / pts) - Math.PI / 2;
    const px = x + Math.cos(angle) * rad;
    const py = y + Math.sin(angle) * rad;
    if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
  }
  g.closePath().fill({ color: color || C.yellow });
  return g;
}

// Add floating sparkle stars to a container, return array for animation
export function addSparkles(container, count, w, h) {
  const sparkles = [];
  for (let i = 0; i < count; i++) {
    const s = star(
      Math.random() * w, Math.random() * h,
      3 + Math.random() * 5,
      [C.yellow, C.pinkLight, C.lavender, C.mintLight][Math.floor(Math.random() * 4)]
    );
    s.alpha = 0.15 + Math.random() * 0.2;
    container.addChild(s);
    sparkles.push({ g: s, speed: 0.2 + Math.random() * 0.3, phase: Math.random() * Math.PI * 2 });
  }
  return sparkles;
}
