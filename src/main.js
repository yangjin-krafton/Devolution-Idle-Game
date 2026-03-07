// ============================================================
// Main Game Controller — Pixi bootstrap + game flow
// ============================================================

import { W, H } from './ui/theme.js';
import { initScreens, addScreen, showScreen } from './ui/screens.js';
import { initEffects } from './effects.js';
import {
  initCombat, setCombatCallbacks, setMode, renderEnemy,
  updateGauges, renderLogs, renderAllyTabs, renderActions,
  renderAlly, shakeEnemy, applyBackground,
  triggerTamingVFX, triggerAttackVFX,
  triggerBondingAttemptVFX, triggerBondingSuccessVFX,
  triggerBondingFailVFX, triggerEscapeVFX, triggerFaintVFX,
  tickCombat, resetDanmaku,
} from './ui/combatUI.js';
import { randomEnvironment } from './backgrounds.js';
import { initTitle } from './ui/titleUI.js';
import {
  initResult, renderResult,
  initTeam, renderTeamCards, updateEggProgress,
  initDevo, renderDevoReveal, tickDevo,
  initGameOver, renderGameOver,
} from './ui/teamUI.js';
import { loadMonsterTextures } from './ui/sprites.js';
import { CombatSystem } from './combat.js';
import { TeamManager } from './team.js';

// ============================================================
// Pixi App Init
// ============================================================
(async () => {

const app = new PIXI.Application();
await app.init({
  background: '#ffe8f0', width: W, height: H,
  antialias: true, roundPixels: true,
  resolution: 2, autoDensity: true,
});
document.body.appendChild(app.canvas);

function resize() {
  // Use visualViewport for accurate mobile size (excludes virtual keyboard, address bar)
  const vw = window.visualViewport ? window.visualViewport.width : window.innerWidth;
  const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  const s = Math.min(vw / W, vh / H);
  app.canvas.style.width = W * s + 'px';
  app.canvas.style.height = H * s + 'px';
}
resize();
window.addEventListener('resize', resize);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', resize);
}

// ============================================================
// Init all modules
// ============================================================
await loadMonsterTextures();
initScreens(app);
initEffects(app);

const titleScr = initTitle();
const combatScr = initCombat();
const resultScr = initResult();
const teamScr = initTeam();
const devoScr = initDevo();
const goScr = initGameOver();

addScreen('title', titleScr);
addScreen('combat', combatScr);
addScreen('result', resultScr);
addScreen('team', teamScr);
addScreen('devo', devoScr);
addScreen('gameover', goScr);

// ============================================================
// Game State
// ============================================================
let teamManager;
let combat;
let battleCount = 0;
let capturedCount = 0;
let pendingDevoReveals = [];
let eggCheckInterval = null;

// ============================================================
// Title Screen
// ============================================================
showScreen('title');

titleScr._startBtn.on('pointerdown', () => {
  teamManager = new TeamManager();
  battleCount = 0;
  capturedCount = 0;
  pendingDevoReveals = [];
  startBattle();
});

// ============================================================
// Combat Flow
// ============================================================
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
    showDevoRevealScreen();
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
  resetDanmaku();
  applyBackground(randomEnvironment());

  setCombatCallbacks({
    action: handleAction,
    bonding: handleBonding,
    switchAlly: (i) => {
      combat.switchAlly(i);
      refreshCombatUI();
    },
  });

  showScreen('combat');
  renderEnemy(combat.enemy);
  refreshCombatUI();
}

function refreshCombatUI() {
  const r = combat.getResult();
  updateGauges(r.tamingPercent, r.escapePercent);
  renderLogs(r.logs);
  renderAlly(combat.getActiveAlly());
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

  if (action) {
    const pref = combat.enemy.preferences[action.axis] || 1.0;
    triggerTamingVFX(action.axis, pref >= 1.0);
  }
  if (ally && ally.hp < prevHp) setTimeout(() => triggerAttackVFX(), 200);
  if (ally && ally.hp <= 0) setTimeout(() => triggerFaintVFX(), 300);
  if (combat.state === 'escaped') triggerEscapeVFX();

  refreshCombatUI();
  if (combat.state !== 'active') setTimeout(endBattle, 800);
}

function handleBonding(index) {
  if (!combat || combat.state !== 'active') return;

  triggerBondingAttemptVFX();
  const prevState = combat.state;
  combat.useBonding(index);

  if (combat.state === 'victory') setTimeout(() => triggerBondingSuccessVFX(), 200);
  else if (prevState === 'active' && combat.state === 'active') triggerBondingFailVFX();
  if (combat.state === 'escaped') triggerEscapeVFX();

  refreshCombatUI();
  if (combat.state !== 'active') setTimeout(endBattle, 800);
}

// ============================================================
// End Battle
// ============================================================
function endBattle() {
  const result = combat.getResult();
  const xpLogs = teamManager.awardXP(result.actedAllies);
  const devoLogs = teamManager.checkDevolution();

  if (result.state === 'victory') {
    capturedCount++;
    teamManager.addCaptured(combat.enemy);
  }

  showScreen('result');
  renderResult(result.state, combat.enemy, xpLogs, devoLogs, () => {
    if (result.state === 'defeat') showGameOverScreen();
    else showTeamScreen();
  });
}

// ============================================================
// Team Screen
// ============================================================
function showTeamScreen() {
  teamManager.healTeam();
  showScreen('team');
  renderTeamCards(
    teamManager.allies,
    teamManager.collection,
    (id) => teamManager.getEggProgress(id),
    onNextBattle,
  );
  startEggCheckInterval();
}

function onNextBattle() {
  stopEggCheckInterval();
  teamManager.checkEggHatch();
  for (const ally of teamManager.allies) {
    if (ally.devolved && !ally._revealed) {
      ally._revealed = true;
      pendingDevoReveals.push(ally);
    }
  }
  if (pendingDevoReveals.length > 0) { showDevoRevealScreen(); return; }
  const battleTeam = teamManager.getActiveTeam();
  if (battleTeam.filter(a => a.hp > 0).length === 0) { showGameOverScreen(); return; }
  startBattle();
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
        onNextBattle,
      );
    }
    updateEggProgress(teamManager.allies, (id) => teamManager.getEggProgress(id));
  }, 500);
}

function stopEggCheckInterval() {
  if (eggCheckInterval) { clearInterval(eggCheckInterval); eggCheckInterval = null; }
}

// ============================================================
// Devolution Reveal
// ============================================================
function showDevoRevealScreen() {
  stopEggCheckInterval();
  showScreen('devo');
  renderDevoReveal(pendingDevoReveals[0], () => {
    pendingDevoReveals.shift();
    if (pendingDevoReveals.length > 0) showDevoRevealScreen();
    else startBattle();
  });
}

// ============================================================
// Game Over
// ============================================================
function showGameOverScreen() {
  stopEggCheckInterval();
  showScreen('gameover');
  renderGameOver(battleCount, capturedCount, () => {
    teamManager = new TeamManager();
    battleCount = 0;
    capturedCount = 0;
    pendingDevoReveals = [];
    startBattle();
  });
}

// ============================================================
// Animation Loop
// ============================================================
let tick = 0;
app.ticker.add(() => {
  tick += 0.016;
  tickCombat(tick);
  tickDevo(tick);
});

})();
