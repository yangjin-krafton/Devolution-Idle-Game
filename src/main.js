// ============================================================
// Main Game Controller — 3v1 전투 + 3분류 스킬 체계
// ============================================================

import { W, H } from './ui/theme.js';
import { initScreens, addScreen, showScreen } from './ui/screens.js';
import { initEffects } from './effects.js';
import {
  initCombat, setCombatCallbacks, renderEnemy,
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
  });

  showScreen('combat');
  renderEnemy(combat.enemy);
  refreshCombatUI();
}

function refreshCombatUI() {
  const r = combat.getResult();
  updateGauges(r.tamingPercent, r.escapePercent);
  renderLogs(r.logs);

  // 현재 행동 선택 중인 첫 번째 슬롯을 하이라이트
  const pendingIdx = r.pendingSlots.length > 0 ? r.pendingSlots[0] : -1;
  renderAlly();
  renderAllyTabs(combat.team, pendingIdx, combat.state);

  // 스킬 효과 미리보기 계산
  const previews = {};
  combat.team.forEach((ally, i) => {
    if (ally.hp <= 0 || ally.inEgg) return;
    previews[i] = ally.actions.map(action => combat.previewAction(ally, action));
  });

  // 3x3 그리드에 전체 팀 + 선택 상태 + 미리보기 전달
  renderActions(combat.team, {
    tamingPercent: r.tamingPercent,
    escapePercent: r.escapePercent,
    pendingSlots: r.pendingSlots,
    selectedActions: r.selectedActions,
    turnOrder: r.turnOrder,
    _previews: previews,
  });
}

function handleAction(allyIndex, actionIndex) {
  if (!combat || combat.state !== 'active') return;

  const ally = combat.team[allyIndex];
  const action = ally?.actions[actionIndex];
  if (!action) return;

  // 선택 전 HP 스냅샷 (VFX용)
  const hpBefore = combat.team.map(a => a.hp);
  const prevState = combat.state;

  combat.selectAction(allyIndex, actionIndex);

  // 턴 실행 완료 (모든 선택이 끝난 후) → VFX
  const r = combat.getResult();
  if (r.turn > 0 && Object.keys(r.selectedActions).length === 0) {
    // 턴이 실행되었음 — VFX 재생
    shakeEnemy();
    triggerTamingVFX('behavior', true);

    if (combat.state === 'victory') {
      setTimeout(() => triggerBondingSuccessVFX(), 200);
    }
    if (combat.state === 'escaped') triggerEscapeVFX();

    // HP 변화 체크
    combat.team.forEach((a, i) => {
      if (a.hp < hpBefore[i]) setTimeout(() => triggerAttackVFX(), 200);
      if (a.hp <= 0 && hpBefore[i] > 0) setTimeout(() => triggerFaintVFX(), 300);
    });
  }

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
