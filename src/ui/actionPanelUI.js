// ============================================================
// Action Panel — 3분류 스킬 (자극/포획/수비) 단일 목록
// ============================================================

import { W, H, C, lbl, softPanel } from './theme.js';

const AXIS_LABELS = { sound: '소리', temperature: '온도', smell: '냄새', behavior: '행동' };

const CATEGORY_STYLE = {
  stimulate: { label: '자극', color: C.taming,   bgColor: C.white },
  capture:   { label: '포획', color: C.orange,   bgColor: 0xfff8ee },
  defend:    { label: '수비', color: C.water,    bgColor: 0xeef8ff },
};

let container;
let refs = {};
let onAction = null;

export function initActionPanel(parentContainer, sharedRefs) {
  container = parentContainer;
  refs = sharedRefs;
  buildActionPanel();
}

export function setActionCallbacks({ action }) {
  onAction = action;
}

function buildActionPanel() {
  const actBg = 395;
  container.addChild(new PIXI.Graphics().roundRect(0, actBg, W, H - actBg, 24).fill({ color: C.cream }));

  // Current ally indicator
  refs.allyTurnLabel = lbl('', 9, C.pink, true);
  refs.allyTurnLabel.x = 16; refs.allyTurnLabel.y = 408;
  container.addChild(refs.allyTurnLabel);

  // Turn phase dots
  refs.turnDotsContainer = new PIXI.Container();
  refs.turnDotsContainer.y = 412;
  container.addChild(refs.turnDotsContainer);

  refs.actionContainer = new PIXI.Container();
  refs.actionContainer.y = 440;
  container.addChild(refs.actionContainer);
}

export function renderActions(ally, combatResult) {
  refs.actionContainer.removeChildren();
  if (!ally) return;

  // Update ally turn indicator
  if (refs.allyTurnLabel) {
    refs.allyTurnLabel.text = ally.name + '의 행동';
  }

  // Render turn phase dots
  if (refs.turnDotsContainer && combatResult) {
    refs.turnDotsContainer.removeChildren();
    const aliveCount = combatResult.aliveCount || 3;
    const phase = combatResult.turnPhase || 0;
    for (let i = 0; i < aliveCount; i++) {
      const dot = new PIXI.Graphics();
      const dx = W - 30 - (aliveCount - 1 - i) * 18;
      dot.circle(dx, 0, 5).fill({ color: i < phase ? C.dim : (i === phase ? C.pink : C.dimmer) });
      refs.turnDotsContainer.addChild(dot);
    }
  }

  ally.actions.forEach((action, i) => {
    const y = i * 100;
    const ct = new PIXI.Container(); ct.y = y;
    ct.eventMode = 'static'; ct.cursor = 'pointer';

    const catStyle = CATEGORY_STYLE[action.category] || CATEGORY_STYLE.stimulate;

    // Card background
    ct.addChild(softPanel(14, 0, W - 28, 90, catStyle.bgColor, catStyle.color));

    // Category circle icon
    ct.addChild(new PIXI.Graphics().circle(44, 45, 24).fill({ color: catStyle.color }));
    const catLbl = lbl(catStyle.label, 7, 0xffffff, true);
    catLbl.anchor = { x: 0.5, y: 0.5 }; catLbl.x = 44; catLbl.y = 38;
    ct.addChild(catLbl);

    // Axis sub-label (for stimulate skills)
    if (action.category === 'stimulate' && action.axis) {
      const axLbl = lbl(AXIS_LABELS[action.axis] || '', 5, 0xffffff);
      axLbl.anchor = { x: 0.5, y: 0.5 }; axLbl.x = 44; axLbl.y = 52;
      ct.addChild(axLbl);
    }

    // Capture risk warning
    if (action.category === 'capture') {
      const riskLbl = lbl('위험', 5, 0xffffff);
      riskLbl.anchor = { x: 0.5, y: 0.5 }; riskLbl.x = 44; riskLbl.y = 52;
      ct.addChild(riskLbl);
    }

    // Defend heal indicator
    if (action.category === 'defend') {
      const healLbl = lbl('방어', 5, 0xffffff);
      healLbl.anchor = { x: 0.5, y: 0.5 }; healLbl.x = 44; healLbl.y = 52;
      ct.addChild(healLbl);
    }

    // Skill name & description
    ct.addChild(Object.assign(lbl(action.name, 12, C.text, true), { x: 80, y: 10 }));
    ct.addChild(Object.assign(lbl(action.log, 8, C.dim), { x: 80, y: 48 }));

    // Capture taming requirement hint
    if (action.category === 'capture' && combatResult && combatResult.tamingPercent < 40) {
      const warnLbl = lbl('순화 40%+ 권장', 6, C.escape);
      warnLbl.x = 80; warnLbl.y = 72;
      ct.addChild(warnLbl);
    }

    ct.on('pointerdown', () => { if (onAction) onAction(i); });
    refs.actionContainer.addChild(ct);
  });
}
