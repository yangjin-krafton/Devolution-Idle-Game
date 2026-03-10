// ============================================================
// Skill Card — reusable card component for action/skill display
// ============================================================

import { S, lbl } from './theme.js';
import { SKILL_CATEGORY } from '../data/index.js';
import { AXIS_LABEL } from '../monsterRegistry.js';

// Dark palette (shared with actionPanelUI / titleUI)
const D = {
  card: 0x262640, cardHi: 0x2e2e48,
  neon: 0x00d4aa, red: 0xff6b6b, blue: 0x4dabf7,
  text: 0xddddf0, dim: 0x8888aa, dimmer: 0x555577, sep: 0x444466,
};

export const SKILL_CAT = {
  stimulate: { c: D.neon, bg: 0x1a3330, icon: '💫', dark: 0x009977 },
  capture:   { c: D.red,  bg: 0x33222a, icon: '🤝', dark: 0xcc4444 },
  defend:    { c: D.blue,  bg: 0x1a2a3a, icon: '🛡️', dark: 0x2b7fc4 },
};

/**
 * Build a single skill card as a PIXI.Container.
 *
 * @param {object} action  — skill data ({ name, category, axis, power, pp, maxPp, escapeRisk, log })
 * @param {number} w       — card width
 * @param {number} h       — card height
 * @param {object} [opts]  — optional overrides
 *   opts.selected    — highlight border (chosen in combat)
 *   opts.locked      — dim the card (another skill chosen)
 *   opts.ppEmpty     — PP depleted style
 *   opts.showDesc    — show action.log description text (combat panel)
 *   opts.preview     — { text, effColor } preview line override
 *   opts.orderNum    — turn order badge number
 * @returns {PIXI.Container}
 */
export function buildSkillCard(action, w, h, opts = {}) {
  const ct = new PIXI.Container();
  const cat = SKILL_CAT[action.category] || SKILL_CAT.stimulate;
  const catName = SKILL_CATEGORY[action.category]?.name || action.category;
  const axisName = AXIS_LABEL[action.axis] || action.axis;
  const rd = 8;
  const a = opts.locked ? 0.2 : 1;
  const cardAlpha = opts.ppEmpty ? 0.25 : a;

  // Card background
  const bg = new PIXI.Graphics();
  bg.roundRect(0, 0, w, h, rd).fill({ color: opts.selected ? D.cardHi : D.card, alpha: a });
  // Left type bar
  bg.roundRect(0, 4, 3, h - 8, 1.5).fill({ color: cat.c, alpha: 0.7 * a });
  // Selected border
  if (opts.selected) {
    bg.roundRect(0, 0, w, h, rd).stroke({ color: cat.c, width: 2 });
  } else {
    bg.roundRect(0, 0, w, h, rd).stroke({ color: cat.c, width: 1, alpha: 0.3 });
  }
  ct.addChild(bg);

  // Row 1: category icon + label · axis
  const headerText = opts.preview
    ? opts.preview.text
    : `${cat.icon} ${catName} · ${axisName}`;
  const headerColor = opts.preview ? opts.preview.effColor : cat.c;
  const catLbl = lbl(headerText, 5.5, headerColor, true);
  catLbl.x = 10; catLbl.y = 5; catLbl.alpha = cardAlpha;
  ct.addChild(catLbl);

  // PP (top-right)
  if (action.pp != null) {
    const ppColor = opts.ppEmpty ? D.red : D.dim;
    const ppLbl = lbl(`${action.pp}/${action.maxPp}`, 5, ppColor, true);
    ppLbl.anchor = { x: 1, y: 0 }; ppLbl.x = w - 6; ppLbl.y = 5; ppLbl.alpha = cardAlpha;
    ct.addChild(ppLbl);
  }

  // Order badge (combat)
  if (opts.orderNum != null) {
    const oB = new PIXI.Graphics();
    oB.roundRect(w - 22, 18, 16, 16, 4).fill({ color: cat.c });
    ct.addChild(oB);
    const oL = lbl(String(opts.orderNum), 6, 0x1a1a2e, true);
    oL.anchor = { x: 0.5, y: 0.5 }; oL.x = w - 14; oL.y = 26;
    ct.addChild(oL);
  }

  // Separator
  ct.addChild(new PIXI.Graphics()
    .moveTo(8, 18).lineTo(w - 8, 18)
    .stroke({ color: D.sep, width: 0.5, alpha: 0.3 * a }));

  // Row 2: skill name
  const nameLbl = lbl(action.name, opts.showDesc ? 9 : 8,
    opts.ppEmpty ? D.dimmer : D.text, true);
  nameLbl.x = 10; nameLbl.y = 22; nameLbl.alpha = cardAlpha;
  ct.addChild(nameLbl);

  if (opts.showDesc) {
    // Description text (combat panel style)
    const descTop = 42;
    ct.addChild(new PIXI.Graphics()
      .moveTo(10, descTop - 2).lineTo(w - 10, descTop - 2)
      .stroke({ color: D.sep, width: 0.5, alpha: a }));

    const dText = new PIXI.Text({ text: action.log, style: {
      fontFamily: '"M PLUS Rounded 1c", "Noto Sans KR", sans-serif',
      fontSize: 7 * S, fill: '#8888aa', fontWeight: '400',
      wordWrap: true, wordWrapWidth: w - 18,
      lineHeight: 9 * S,
    }});
    dText.x = 10; dText.y = descTop; dText.alpha = a;
    ct.addChild(dText);
  } else {
    // Compact: power + escape risk at bottom
    const pwLbl = lbl(`위력 ${action.power}`, 7, D.text);
    pwLbl.x = 10; pwLbl.y = h - 22; pwLbl.alpha = cardAlpha;
    ct.addChild(pwLbl);

    if (action.escapeRisk !== 0) {
      const risk = action.escapeRisk > 0 ? `+${action.escapeRisk}` : String(action.escapeRisk);
      const riskColor = action.escapeRisk > 0 ? D.red : D.neon;
      const riskLbl = lbl(`도주 ${risk}`, 6, riskColor, true);
      riskLbl.anchor = { x: 1, y: 0 };
      riskLbl.x = w - 5; riskLbl.y = h - 20; riskLbl.alpha = cardAlpha;
      ct.addChild(riskLbl);
    }
  }

  return ct;
}
