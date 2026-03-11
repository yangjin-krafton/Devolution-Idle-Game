// ============================================================
// Main Game Controller — 3v1 전투 + 3분류 스킬 체계
// ============================================================

import { W, H } from './ui/theme.js';
import { initScreens, addScreen, showScreen } from './ui/screens.js';
import { initEffects } from './effects.js';
import {
  initCombat, setCombatCallbacks, renderEnemy,
  updateGauges, renderLogs, renderAllyTabs, renderActions,
  renderAlly, shakeEnemy, applyBackground, setEmotion,
  triggerTamingVFX, triggerAttackVFX,
  triggerBondingAttemptVFX, triggerBondingSuccessVFX,
  triggerBondingFailVFX, triggerEscapeVFX, triggerFaintVFX,
  tickCombat, resetDanmaku,
} from './ui/combatUI.js';
import { randomEnvironment } from './backgrounds.js';
import { initTitle, resetTitle } from './ui/titleUI.js';
import {
  initResult, renderResult,
  initTeam, renderTeamCards, updateEggProgress,
  initDevo, renderDevoReveal, tickDevo,
  initGameOver, renderGameOver,
} from './ui/teamUI.js';
import { loadMonsterTextures } from './ui/sprites.js';
import { initDialog, showDialog, tickDialog } from './ui/dialogUI.js';
import { initDebug } from './debug.js';
import { DIALOG_SCENES } from './data/dialogs/index.js';
import { ENCOUNTER_DIALOGS } from './data/dialogs/encounters/index.js';
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
  const vw = window.visualViewport ? window.visualViewport.width : window.innerWidth;
  const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  const s = Math.min(vw / W, vh / H);
  app.canvas.style.width = W * s + 'px';
  app.canvas.style.height = H * s + 'px';
}
resize();
window.addEventListener('resize', resize);
if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);

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

// Dialog overlay — on top of all screens
const dialogOverlay = initDialog();
app.stage.addChild(dialogOverlay);

// ============================================================
// Game State
// ============================================================
let teamManager;
let combat;
let battleCount = 0;
let capturedCount = 0;
let pendingDevoReveals = [];
let eggCheckInterval = null;
let _currentScreen = 'title'; // 브릿지용 화면 추적

const _origShowScreen = showScreen;
const _showScreenTracked = (name) => { _currentScreen = name; _origShowScreen(name); };

// ============================================================
// Title Screen
// ============================================================
_showScreenTracked('title');

// First-time tutorial dialog
if (!localStorage.getItem('devo_tutorial_done')) {
  showDialog(DIALOG_SCENES.tutorial, () => {
    localStorage.setItem('devo_tutorial_done', '1');
  });
}

titleScr._startBtn.on('pointerdown', () => {
  const selectedIds = titleScr.getSelectedTeam();
  if (selectedIds.length < 3) return; // need at least 3 monsters
  teamManager = new TeamManager(selectedIds);
  battleCount = 0;
  capturedCount = 0;
  pendingDevoReveals = [];

  // First battle dialog (once only)
  if (!localStorage.getItem('devo_first_battle_done')) {
    showDialog(DIALOG_SCENES.first_battle, () => {
      localStorage.setItem('devo_first_battle_done', '1');
      startBattle();
    });
  } else {
    startBattle();
  }
});

// ============================================================
// Combat Flow — 3v1 턴 구조
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

  if (pendingDevoReveals.length > 0) { showDevoRevealScreen(); return; }

  const battleTeam = teamManager.getBattleTeam();
  if (battleTeam.length === 0) { showTeamScreen(); return; }

  battleCount++;
  const enemy = teamManager.getRandomEnemy();
  combat = new CombatSystem(battleTeam, enemy);
  resetDanmaku();
  applyBackground(randomEnvironment());

  setCombatCallbacks({
    action: handleAction,
    confirm: handleConfirm,
  });

  // First encounter dialog for this wild monster (once per species)
  const encKey = `devo_met_${enemy.id}`;
  const encBuilder = ENCOUNTER_DIALOGS[enemy.id];
  if (encBuilder && !localStorage.getItem(encKey)) {
    _showScreenTracked('combat');
    renderEnemy(combat.enemy);
    refreshCombatUI();
    showDialog(encBuilder(enemy.img), () => {
      localStorage.setItem(encKey, '1');
    });
  } else {
    _showScreenTracked('combat');
    renderEnemy(combat.enemy);
    refreshCombatUI();
  }
}

function refreshCombatUI() {
  const r = combat.getResult();
  setEmotion(r.emotion);
  updateGauges(r.tamingPercent, r.escapePercent, r.turn);
  renderLogs(r.logs);

  renderAlly();
  renderAllyTabs(combat.team, r.aggroTarget, combat.state, combat.enemy.attackPower);

  const previews = {};
  combat.team.forEach((ally, i) => {
    if (ally.hp <= 0 || ally.inEgg) return;
    previews[i] = ally.actions.map(action => combat.previewAction(ally, action));
  });

  renderActions(combat.team, {
    tamingPercent: r.tamingPercent,
    escapePercent: r.escapePercent,
    pendingSlots: r.pendingSlots,
    selectedActions: r.selectedActions,
    turnOrder: r.turnOrder,
    _previews: previews,
  });
}

// 카드 선택 / 해제 (턴 실행 안 함)
function handleAction(allyIndex, actionIndex) {
  if (!combat || combat.state !== 'active') return;
  combat.selectAction(allyIndex, actionIndex);
  refreshCombatUI();
}

// [확인] 버튼 → 턴 실행
function handleConfirm() {
  if (!combat || combat.state !== 'active') return;

  const hpBefore = combat.team.map(a => a.hp);
  combat.confirmTurn();

  // VFX
  shakeEnemy();
  triggerTamingVFX('behavior', true);
  if (combat.state === 'victory') setTimeout(() => triggerBondingSuccessVFX(), 200);
  if (combat.state === 'escaped') triggerEscapeVFX();
  combat.team.forEach((a, i) => {
    if (a.hp < hpBefore[i]) setTimeout(() => triggerAttackVFX(), 200);
    if (a.hp <= 0 && hpBefore[i] > 0) setTimeout(() => triggerFaintVFX(), 300);
  });

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

  _showScreenTracked('result');
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
  _showScreenTracked('team');
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
  const battleTeam = teamManager.getBattleTeam();
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
  _showScreenTracked('devo');
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
  _showScreenTracked('gameover');
  renderGameOver(battleCount, capturedCount, () => {
    battleCount = 0;
    capturedCount = 0;
    pendingDevoReveals = [];
    resetTitle();
    _showScreenTracked('title');
  });
}

// ============================================================
// Debug Bridge — 외부 도구(play-reviewer 등)용 상태 노출
// ============================================================
window.__BRIDGE = {
  get ready() { return true; },
  get currentScreen() { return _currentScreen; },
  get combat() { return combat; },
  get teamManager() { return teamManager; },
  handleAction,
  handleConfirm,
  clickStart: () => titleScr._startBtn.emit('pointerdown'),
  clickNext: () => {
    // 각 화면 내 버튼 참조를 사용해 콜백 트리거
    if (_currentScreen === 'result') {
      // renderResult에서 nextBtn에 등록된 pointerdown 콜백 실행
      resultScr.children.forEach(c => { if (c.cursor === 'pointer') c.emit('pointerdown'); });
    } else if (_currentScreen === 'team') {
      onNextBattle();
    } else if (_currentScreen === 'gameover') {
      battleCount = 0; capturedCount = 0; pendingDevoReveals = [];
      resetTitle();
      _showScreenTracked('title');
    }
  },
};

// ============================================================
// Debug Console Commands
// ============================================================
initDebug(() => ({
  combat,
  currentScreen: _currentScreen,
  refreshCombatUI,
  endBattle,
}));

// ============================================================
// Animation Loop
// ============================================================
let tick = 0;
app.ticker.add(() => {
  tick += 0.016;
  tickCombat(tick);
  tickDevo(tick);
  tickDialog(tick);
});

})();
