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
  playTurnSequence,
} from './ui/combatUI.js';
import { randomEnvironment, environmentToBackground } from './backgrounds.js';
import { initTitle, resetTitle } from './ui/titleUI.js';
import {
  initTeam, renderTeamCards, updateEggProgress,
  initDevo, renderDevoReveal, tickDevo,
  initGameOver, renderGameOver,
} from './ui/teamUI.js';
import { initResult, renderResult } from './ui/resultUI.js';
import { loadMonsterTextures } from './ui/sprites.js';
import { initTeamEdit, renderTeamEdit } from './ui/teamEditUI.js';
import { initDialog, showDialog, tickDialog } from './ui/dialogUI.js';
import { initDebug } from './debug.js';
import { DIALOG_SCENES } from './data/dialogs/index.js';
import { ENCOUNTER_DIALOGS } from './data/dialogs/encounters/index.js';
import { JOIN_DIALOGS } from './data/dialogs/join/index.js';
import { CombatSystem } from './combat.js';
import { TeamManager } from './team.js';
import { initMonsterData, ALL_MONSTERS } from './data/index.js';

// ============================================================
// Game Version — 구 세이브 자동 삭제
// ============================================================
const GAME_VERSION = '0.3.0'; // 환경 5축 조율형 전투 시스템
const SAVE_VERSION_KEY = 'devo_version';

if (localStorage.getItem(SAVE_VERSION_KEY) !== GAME_VERSION) {
  localStorage.clear();
  localStorage.setItem(SAVE_VERSION_KEY, GAME_VERSION);
}

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
// CSV 데이터 로드 → 몬스터 데이터 enrichment
await initMonsterData(ALL_MONSTERS);
await loadMonsterTextures();
initScreens(app);
initEffects(app);

const titleScr = initTitle();
const combatScr = initCombat();
const resultScr = initResult();
const teamScr = initTeam();
const devoScr = initDevo();
const goScr = initGameOver();
const teamEditScr = initTeamEdit();

addScreen('title', titleScr);
addScreen('combat', combatScr);
addScreen('result', resultScr);
addScreen('team', teamScr);
addScreen('devo', devoScr);
addScreen('teamEdit', teamEditScr);
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
  applyBackground(environmentToBackground(combat.getResult().environment));

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
  updateGauges(r);
  renderLogs(r.logs);

  // 환경 변화에 따라 배경 갱신
  applyBackground(environmentToBackground(r.environment));

  renderAlly();
  renderAllyTabs(combat.team, r.aggroTarget, combat.state, combat.enemy.attackPower);

  const previews = {};
  combat.team.forEach((ally, i) => {
    if (ally.inEgg) return;
    previews[i] = ally.actions.map(action => combat.previewAction(ally, action));
  });

  renderActions(combat.team, {
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
  if (_turnAnimating) return; // 연출 중 입력 차단
  combat.selectAction(allyIndex, actionIndex);
  refreshCombatUI();
}

// [확인] 버튼 → 턴 실행 (연출 큐 기반)
let _turnAnimating = false;

function handleConfirm() {
  if (!combat || combat.state !== 'active') return;
  if (_turnAnimating) return; // 연출 중 중복 방지

  const result = combat.confirmTurn();
  const steps = result?.turnSteps || [];

  _turnAnimating = true;

  // 연출 큐 재생
  playTurnSequence(steps, () => {
    // 연출 완료 후 결과 반영
    if (combat.state === 'victory') triggerBondingSuccessVFX();
    if (combat.state === 'escaped') triggerEscapeVFX();

    refreshCombatUI();
    _turnAnimating = false;

    if (combat.state !== 'active') setTimeout(endBattle, 600);
  });
}

// ============================================================
// End Battle
// ============================================================
function endBattle() {
  const result = combat.getResult();

  if (result.state === 'victory') {
    capturedCount++;
    teamManager.addCaptured(combat.enemy);
  }

  // 전투 결과 (XP/레벨 시스템 제거됨)
  const allyRewards = result.state !== 'defeat'
    ? teamManager.getActiveTeam().map(a => ({ id: a.id, name: a.name, img: a.img }))
    : [];

  const rewards = {
    state: result.state,
    enemy: combat.enemy,
    allies: allyRewards,
  };

  _showScreenTracked('result');
  renderResult(rewards, () => {
    if (result.state === 'defeat') { showGameOverScreen(); return; }

    if (result.state === 'victory') {
      // First join dialog, then team edit screen
      const joinKey = `devo_joined_${combat.enemy.id}`;
      const joinBuilder = JOIN_DIALOGS[combat.enemy.id];
      if (joinBuilder && !localStorage.getItem(joinKey)) {
        showDialog(joinBuilder(combat.enemy.img), () => {
          localStorage.setItem(joinKey, '1');
          showTeamEditScreen(combat.enemy);
        });
      } else {
        showTeamEditScreen(combat.enemy);
      }
    } else {
      // Escaped — go to team edit without captured monster
      showTeamEditScreen(null);
    }
  });
}

function showTeamEditScreen(capturedEnemy) {
  teamManager.healTeam();
  _showScreenTracked('teamEdit');
  renderTeamEdit(teamManager, capturedEnemy,
    // onRecruit — add captured monster to team
    () => {
      if (capturedEnemy && teamManager.canRecruit()) {
        teamManager.recruitMonster(capturedEnemy.id);
        renderTeamEdit(teamManager, null, null, onNextBattle);
      }
    },
    // onSkip — proceed to next battle
    onNextBattle,
  );
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
  if (battleTeam.length === 0) { showGameOverScreen(); return; }
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
      // New feed-style result screen: emit tap to skip/continue
      resultScr.emit('pointerdown', { getLocalPosition: () => ({ x: W / 2, y: H / 2 }) });
      resultScr.emit('pointerup', { getLocalPosition: () => ({ x: W / 2, y: H / 2 }) });
    } else if (_currentScreen === 'team' || _currentScreen === 'teamEdit') {
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
  showResult: (rewards, onDone) => {
    _showScreenTracked('result');
    renderResult(rewards, onDone || (() => {
      _showScreenTracked('title');
      console.log('[DEBUG] 결과창 닫힘 → 타이틀로 복귀');
    }));
  },
  teamManager,
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
