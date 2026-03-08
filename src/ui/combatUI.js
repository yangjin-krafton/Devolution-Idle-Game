// ============================================================
// Combat Screen — Orchestrator
// Delegates to battleFieldUI (top area) and actionPanelUI (bottom area)
// ============================================================

import {
  initBattleField,
  renderEnemy, updateGauges, renderAlly, renderAllyTabs,
  renderLogs, resetDanmaku, applyBackground,
  shakeEnemy, triggerTamingVFX, triggerAttackVFX,
  triggerBondingAttemptVFX, triggerBondingSuccessVFX,
  triggerBondingFailVFX, triggerEscapeVFX, triggerFaintVFX,
  tickBattleField,
} from './battleFieldUI.js';

import {
  initActionPanel, setActionCallbacks,
  renderActions,
} from './actionPanelUI.js';

let container;
let refs = {};

export function initCombat() {
  container = new PIXI.Container();
  refs = {};
  initBattleField(container, refs);
  initActionPanel(container, refs);
  return container;
}

export function getContainer() { return container; }

// ---- Callbacks ----
export function setCombatCallbacks({ action, confirm }) {
  setActionCallbacks({ action, confirm });
}

// ---- Re-exports from battleFieldUI ----
export {
  renderEnemy, updateGauges, renderAlly, renderAllyTabs,
  renderLogs, resetDanmaku, applyBackground,
  shakeEnemy, triggerTamingVFX, triggerAttackVFX,
  triggerBondingAttemptVFX, triggerBondingSuccessVFX,
  triggerBondingFailVFX, triggerEscapeVFX, triggerFaintVFX,
};

// ---- Re-exports from actionPanelUI ----
export { renderActions };

// ---- Animation Tick ----
export function tickCombat(tick) {
  tickBattleField(tick);
}
