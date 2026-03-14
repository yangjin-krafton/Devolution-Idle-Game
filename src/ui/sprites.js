// ============================================================
// Monster & Egg Sprites — texture-based from PNG assets
// ============================================================

import { C } from './theme.js';
import { ALL_CODEX_ENTRIES } from '../data/index.js';

const textures = {};

// Preload all monster textures (전체 코덱스 엔트리)
export async function loadMonsterTextures() {
  const paths = new Set();
  for (const m of ALL_CODEX_ENTRIES) {
    if (m.img) paths.add(m.img);
    if (m.devolvedImg) paths.add(m.devolvedImg);
  }
  const results = await Promise.allSettled(
    [...paths].map(async p => {
      try { textures[p] = await PIXI.Assets.load(p); }
      catch { /* 이미지 없으면 무시 */ }
    })
  );
}

// Create a monster sprite sized to fit within `size` px
export function monster(size, img) {
  const c = new PIXI.Container();
  const tex = textures[img];
  if (tex) {
    const spr = new PIXI.Sprite(tex);
    spr.anchor.set(0.5);
    const scale = size / Math.max(tex.width, tex.height);
    spr.scale.set(scale);
    c.addChild(spr);
  }
  return c;
}

// Helper: get monster img path from id
export function allyImg(id) {
  const m = ALL_CODEX_ENTRIES.find(a => a.id === id);
  return m ? m.img : null;
}

// Helper: get devolved img path from id
export function allyDevolvedImg(id) {
  const m = ALL_CODEX_ENTRIES.find(a => a.id === id);
  return m ? m.devolvedImg : null;
}

// Map ally id to color (still used for egg color)
export function allyColor(id) {
  return { water: C.water, fire: C.fire, grass: C.leaf, crystal: C.lavender, moss: C.mint, spark: C.yellow }[id] || C.dark;
}

export function egg(size, color) {
  const c = new PIXI.Container();
  const g = new PIXI.Graphics();
  g.ellipse(0, 0, size * 0.32, size * 0.42).fill({ color });
  g.circle(-size * 0.08, -size * 0.05, size * 0.04).fill({ color: 0x554455 });
  g.circle(size * 0.08, -size * 0.05, size * 0.04).fill({ color: 0x554455 });
  g.arc(0, size * 0.05, size * 0.06, 0, Math.PI).stroke({ color: 0x554455, width: 1.2 });
  g.circle(-size * 0.12, -size * 0.2, size * 0.05).fill({ color: 0xffffff, alpha: 0.4 });
  g.moveTo(-size * 0.15, size * 0.15).lineTo(-size * 0.05, size * 0.22).lineTo(size * 0.05, size * 0.15)
    .lineTo(size * 0.12, size * 0.2).stroke({ color: 0xffffff, alpha: 0.5, width: 1.5 });
  c.addChild(g);
  return c;
}
