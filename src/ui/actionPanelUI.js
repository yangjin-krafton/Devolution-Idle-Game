// ============================================================
// Action Panel — tabs (taming/bonding) + action cards
// ============================================================

import { W, H, C, lbl, softPanel } from './theme.js';
import { BONDING_ACTIONS } from '../data.js';

const AXIS_LABELS = { sound: '소리', temperature: '온도', smell: '냄새', behavior: '행동' };
const AXIS_COLORS = { sound: C.water, temperature: C.fire, smell: C.mint, behavior: C.lavender };

let container;
let refs = {};
let currentMode = 'taming';
let onAction = null, onBonding = null;

export function initActionPanel(parentContainer, sharedRefs) {
  container = parentContainer;
  refs = sharedRefs;
  buildActionPanel();
}

export function setActionCallbacks({ action, bonding }) {
  onAction = action; onBonding = bonding;
}

export function setMode(mode) { currentMode = mode; }
export function getMode() { return currentMode; }

function buildActionPanel() {
  const actBg = 395;
  container.addChild(new PIXI.Graphics().roundRect(0, actBg, W, H - actBg, 24).fill({ color: C.cream }));

  refs.tabTaming = new PIXI.Container();
  refs.tabBonding = new PIXI.Container();
  container.addChild(refs.tabTaming);
  container.addChild(refs.tabBonding);

  refs.actionContainer = new PIXI.Container();
  refs.actionContainer.y = 470;
  container.addChild(refs.actionContainer);
}

export function renderActions(ally, canBond) {
  refs.actionContainer.removeChildren();
  updateTabVisuals(canBond);

  refs.tabTaming.removeAllListeners();
  refs.tabBonding.removeAllListeners();
  refs.tabTaming.eventMode = 'static';
  refs.tabBonding.eventMode = 'static';
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
      const ic = lbl('교감', 7, 0xffffff, true);
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
    const lockTxt = lbl('순화 50%+', 6, 0xddbbdd);
    lockTxt.anchor = { x: 0.5, y: 0.5 }; lockTxt.x = W * 3 / 4 + 2; lockTxt.y = tabY + 50;
    refs.tabBonding.addChild(lockTxt);
  }
}
