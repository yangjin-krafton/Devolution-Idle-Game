// ============================================================
// Main Game Controller (bootstrap + flow)
// ============================================================

import { CombatSystem } from './combat.js';
import { TeamManager } from './team.js';
import { showScreen, $ } from './ui/screens.js';
import {
  setCombatCallbacks, setMode, renderEnemy, updateGauges,
  renderLogs, renderAllyTabs, renderActions, shakeEnemy,
  triggerTamingVFX, triggerAttackVFX,
  triggerBondingAttemptVFX, triggerBondingSuccessVFX,
  triggerBondingFailVFX, triggerEscapeVFX, triggerFaintVFX,
} from './ui/combatUI.js';
import {
  renderResult, renderTeamCards, updateEggProgress,
  renderDevoReveal, renderGameOver,
} from './ui/teamUI.js';

// ---- State ----
let teamManager;
let combat;
let battleCount = 0;
let capturedCount = 0;
let pendingDevoReveals = [];
let eggCheckInterval = null;

// ---- Title ----
$('start-btn').addEventListener('click', () => {
  teamManager = new TeamManager();
  battleCount = 0;
  capturedCount = 0;
  startBattle();
});

// ---- Combat Flow ----
function startBattle() {
  const hatchLogs = teamManager.checkEggHatch();
  if (hatchLogs.length > 0) {
    for (const ally of teamManager.allies) {
      if (ally.devolved && !ally._revealed) {
        ally._revealed = true;
        pendingDevoReveals.push(ally);
      }
    }
  }

  if (pendingDevoReveals.length > 0) {
    showDevoReveal();
    return;
  }

  const battleTeam = teamManager.getActiveTeam();
  if (battleTeam.length === 0) {
    showTeamScreen();
    return;
  }

  battleCount++;
  const enemy = teamManager.getRandomEnemy();
  combat = new CombatSystem(battleTeam, enemy);
  setMode('taming');

  // Wire up combat UI callbacks
  setCombatCallbacks({
    action: handleAction,
    bonding: handleBonding,
    switchAlly: (i) => {
      combat.switchAlly(i);
      refreshCombatUI();
    },
  });

  // Wire up mode toggle
  $('mode-taming').onclick = () => {
    setMode('taming');
    renderActions(combat.getActiveAlly(), combat.canBond());
  };
  $('mode-bonding').onclick = () => {
    if (combat && combat.canBond()) {
      setMode('bonding');
      renderActions(combat.getActiveAlly(), combat.canBond());
    }
  };

  showScreen('combat');
  renderEnemy(combat.enemy);
  refreshCombatUI();
}

function refreshCombatUI() {
  const r = combat.getResult();
  updateGauges(r.tamingPercent, r.escapePercent);
  renderLogs(r.logs);
  renderAllyTabs(combat.team, combat.activeAllyIndex, combat.state);
  renderActions(combat.getActiveAlly(), r.canBond);
}

function handleAction(index) {
  if (!combat || combat.state !== 'active') return;

  const ally = combat.getActiveAlly();
  const action = ally?.actions[index];
  const prevHp = ally ? ally.hp : 0;

  combat.useAction(index);
  shakeEnemy();

  // VFX: taming effect
  if (action) {
    const pref = combat.enemy.preferences[action.axis] || 1.0;
    triggerTamingVFX(action.axis, pref >= 1.0);
  }

  // VFX: attack if ally took damage
  if (ally && ally.hp < prevHp) {
    setTimeout(() => triggerAttackVFX(), 200);
  }
  if (ally && ally.hp <= 0) {
    setTimeout(() => triggerFaintVFX(), 300);
  }

  // VFX: escape
  if (combat.state === 'escaped') triggerEscapeVFX();

  refreshCombatUI();
  if (combat.state !== 'active') setTimeout(endBattle, 800);
}

function handleBonding(index) {
  if (!combat || combat.state !== 'active') return;

  triggerBondingAttemptVFX();
  const prevState = combat.state;
  combat.useBonding(index);

  if (combat.state === 'victory') {
    setTimeout(() => triggerBondingSuccessVFX(), 200);
  } else if (prevState === 'active' && combat.state === 'active') {
    triggerBondingFailVFX();
  }
  if (combat.state === 'escaped') triggerEscapeVFX();

  refreshCombatUI();
  if (combat.state !== 'active') setTimeout(endBattle, 800);
}

// ---- End Battle ----
function endBattle() {
  const result = combat.getResult();
  const xpLogs = teamManager.awardXP(result.actedAllies);
  const devoLogs = teamManager.checkDevolution();

  if (result.state === 'victory') {
    capturedCount++;
    teamManager.addCaptured(combat.enemy);
  }

  showScreen('result');
  renderResult(result.state, combat.enemy.name, xpLogs, devoLogs);

  $('result-next-btn').onclick = () => {
    if (result.state === 'defeat') showGameOver();
    else showTeamScreen();
  };
}

// ---- Team Screen ----
function showTeamScreen() {
  teamManager.healTeam();
  showScreen('team');
  renderTeamCards(
    teamManager.allies,
    teamManager.collection,
    (id) => teamManager.getEggProgress(id),
  );
  startEggCheckInterval();
}

function startEggCheckInterval() {
  stopEggCheckInterval();
  eggCheckInterval = setInterval(() => {
    const hatchLogs = teamManager.checkEggHatch();
    if (hatchLogs.length > 0) {
      for (const ally of teamManager.allies) {
        if (ally.devolved && !ally._revealed) {
          ally._revealed = true;
          pendingDevoReveals.push(ally);
        }
      }
      renderTeamCards(
        teamManager.allies,
        teamManager.collection,
        (id) => teamManager.getEggProgress(id),
      );
    }
    updateEggProgress(teamManager.allies, (id) => teamManager.getEggProgress(id));
  }, 500);
}

function stopEggCheckInterval() {
  if (eggCheckInterval) { clearInterval(eggCheckInterval); eggCheckInterval = null; }
}

$('next-battle-btn').addEventListener('click', () => {
  stopEggCheckInterval();
  teamManager.checkEggHatch();
  for (const ally of teamManager.allies) {
    if (ally.devolved && !ally._revealed) {
      ally._revealed = true;
      pendingDevoReveals.push(ally);
    }
  }
  if (pendingDevoReveals.length > 0) { showDevoReveal(); return; }
  const battleTeam = teamManager.getActiveTeam();
  if (battleTeam.filter(a => a.hp > 0).length === 0) { showGameOver(); return; }
  startBattle();
});

// ---- Devolution Reveal ----
function showDevoReveal() {
  stopEggCheckInterval();
  showScreen('devo');
  renderDevoReveal(pendingDevoReveals[0]);

  $('devo-next-btn').onclick = () => {
    pendingDevoReveals.shift();
    if (pendingDevoReveals.length > 0) showDevoReveal();
    else startBattle();
  };
}

// ---- Game Over ----
function showGameOver() {
  stopEggCheckInterval();
  showScreen('gameover');
  renderGameOver(battleCount, capturedCount);
}

$('restart-btn').addEventListener('click', () => {
  teamManager = new TeamManager();
  battleCount = 0;
  capturedCount = 0;
  pendingDevoReveals = [];
  startBattle();
});
