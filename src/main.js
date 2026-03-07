// ============================================================
// Main Game Controller
// ============================================================

import { BONDING_ACTIONS } from './data.js';
import { CombatSystem } from './combat.js';
import { TeamManager } from './team.js';

// ---- State ----
let teamManager;
let combat;
let currentMode = 'taming'; // taming | bonding
let battleCount = 0;
let capturedCount = 0;
let pendingDevoReveals = [];

// ---- DOM Refs ----
const $ = (id) => document.getElementById(id);

const screens = {
  title: $('title-screen'),
  combat: $('combat-screen'),
  result: $('result-screen'),
  team: $('team-screen'),
  devo: $('devo-screen'),
  gameover: $('gameover-screen'),
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// ---- Title ----
$('start-btn').addEventListener('click', () => {
  teamManager = new TeamManager();
  battleCount = 0;
  capturedCount = 0;
  startBattle();
});

// ---- Combat ----
function startBattle() {
  // Check egg hatches before battle
  const hatchLogs = teamManager.checkEggHatch();
  if (hatchLogs.length > 0) {
    // Show devolution reveal
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
    // All in egg — show team screen, wait for hatches
    showTeamScreen();
    return;
  }

  battleCount++;
  const enemy = teamManager.getRandomEnemy();
  combat = new CombatSystem(battleTeam, enemy);
  currentMode = 'taming';

  showScreen('combat');
  renderEnemy();
  renderLogs();
  renderAllyTabs();
  renderActions();
  updateGauges();
}

function renderEnemy() {
  $('enemy-name').textContent = combat.enemy.name;
  $('enemy-desc').textContent = combat.enemy.desc;
  $('enemy-img').src = combat.enemy.img || '';
  $('enemy-img').alt = combat.enemy.name;
}

function updateGauges() {
  const result = combat.getResult();
  $('taming-fill').style.width = result.tamingPercent + '%';
  $('taming-pct').textContent = result.tamingPercent + '%';
  $('escape-fill').style.width = result.escapePercent + '%';
  $('escape-pct').textContent = result.escapePercent + '%';
}

function renderLogs() {
  const logArea = $('log-area');
  logArea.innerHTML = '';
  for (const msg of combat.logs) {
    const div = document.createElement('div');
    div.className = 'log-entry';
    // Classify log messages
    if (msg.includes('교감') && msg.includes('성공')) div.className += ' success';
    else if (msg.includes('도망') || msg.includes('훈미') || msg.includes('게임 오버') || msg.includes('피해')) div.className += ' danger';
    else if (msg.includes('나타났다') || msg.includes('경험치') || msg.includes('알 상태')) div.className += ' system';
    else if (msg.includes('교감') || msg.includes('순화')) div.className += ' important';
    div.textContent = msg;
    logArea.appendChild(div);
  }
  logArea.scrollTop = logArea.scrollHeight;
}

function renderAllyTabs() {
  const tabs = $('ally-tabs');
  tabs.innerHTML = '';
  combat.team.forEach((ally, i) => {
    const tab = document.createElement('div');
    tab.className = 'ally-tab';
    if (i === combat.activeAllyIndex) tab.className += ' active';
    if (ally.hp <= 0) tab.className += ' fainted';
    if (ally.inEgg) tab.className += ' in-egg';

    tab.innerHTML = `
      <img class="ally-tab-img" src="${ally.img || ''}" alt="${ally.name}" />
      <div class="ally-tab-name">${ally.name}</div>
      <div class="ally-tab-hp">HP ${ally.hp}/${ally.maxHp}</div>
    `;
    tab.addEventListener('click', () => {
      if (ally.hp > 0 && !ally.inEgg && combat.state === 'active') {
        combat.switchAlly(i);
        renderAllyTabs();
        renderActions();
        renderLogs();
      }
    });
    tabs.appendChild(tab);
  });
}

function renderActions() {
  const actionsDiv = $('actions');
  actionsDiv.innerHTML = '';

  // Update mode buttons
  const modeTaming = $('mode-taming');
  const modeBonding = $('mode-bonding');
  modeTaming.className = 'mode-btn' + (currentMode === 'taming' ? ' active' : '');
  modeBonding.className = 'mode-btn' + (currentMode === 'bonding' ? ' active' : '');
  if (!combat.canBond()) {
    modeBonding.className += ' disabled';
  }

  if (currentMode === 'taming') {
    const ally = combat.getActiveAlly();
    if (!ally) return;
    const axisLabels = { sound: '청각', temperature: '온도', smell: '후각', behavior: '행동' };

    ally.actions.forEach((action, i) => {
      const btn = document.createElement('button');
      btn.className = 'action-btn';
      btn.innerHTML = `
        <span class="action-name">${action.name}</span>
        <span class="action-axis">${axisLabels[action.axis]}</span>
        <div class="action-desc">${action.log}</div>
      `;
      btn.addEventListener('click', () => handleAction(i));
      actionsDiv.appendChild(btn);
    });
  } else {
    // Bonding actions
    BONDING_ACTIONS.forEach((bonding, i) => {
      const btn = document.createElement('button');
      btn.className = 'action-btn bonding';
      const canBond = combat.canBond();
      if (!canBond) btn.className += ' disabled';
      btn.innerHTML = `
        <span class="action-name">${bonding.name}</span>
        <div class="action-desc">${bonding.desc}</div>
      `;
      if (canBond) {
        btn.addEventListener('click', () => handleBonding(i));
      }
      actionsDiv.appendChild(btn);
    });
  }
}

$('mode-taming').addEventListener('click', () => {
  currentMode = 'taming';
  renderActions();
});

$('mode-bonding').addEventListener('click', () => {
  if (combat && combat.canBond()) {
    currentMode = 'bonding';
    renderActions();
  }
});

function shakeEnemy() {
  const img = $('enemy-img');
  img.classList.remove('shake');
  void img.offsetWidth; // reflow to retrigger
  img.classList.add('shake');
}

function handleAction(index) {
  if (!combat || combat.state !== 'active') return;

  combat.useAction(index);
  shakeEnemy();
  updateGauges();
  renderLogs();
  renderAllyTabs();
  renderActions();

  if (combat.state !== 'active') {
    setTimeout(() => endBattle(), 800);
  }
}

function handleBonding(index) {
  if (!combat || combat.state !== 'active') return;

  combat.useBonding(index);
  updateGauges();
  renderLogs();
  renderAllyTabs();
  renderActions();

  if (combat.state !== 'active') {
    setTimeout(() => endBattle(), 800);
  }
}

// ---- End Battle ----
function endBattle() {
  const result = combat.getResult();

  // Award XP
  const xpLogs = teamManager.awardXP(result.actedAllies);

  // Check devolution triggers
  const devoLogs = teamManager.checkDevolution();

  // If victory, add to collection
  if (result.state === 'victory') {
    capturedCount++;
    teamManager.addCaptured(combat.enemy);
  }

  // Show result screen
  showScreen('result');

  if (result.state === 'victory') {
    $('result-title').textContent = '교감 성립!';
    $('result-title').style.color = '#7bed9f';
    $('result-desc').textContent = `${combat.enemy.name}과(와) 교감에 성공했습니다.`;
  } else if (result.state === 'escaped') {
    $('result-title').textContent = '도주...';
    $('result-title').style.color = '#ffa502';
    $('result-desc').textContent = `${combat.enemy.name}이(가) 도망쳤습니다.`;
  } else if (result.state === 'defeat') {
    $('result-title').textContent = '전멸';
    $('result-title').style.color = '#ff6b6b';
    $('result-desc').textContent = '모든 아군이 쓰러졌습니다.';
  }

  const xpDiv = $('result-xp-logs');
  xpDiv.innerHTML = '';
  [...xpLogs, ...devoLogs].forEach(log => {
    const div = document.createElement('div');
    div.className = 'log-entry';
    if (log.includes('알 상태')) div.className += ' system';
    div.textContent = log;
    xpDiv.appendChild(div);
  });

  $('result-next-btn').onclick = () => {
    if (result.state === 'defeat') {
      showGameOver();
    } else {
      showTeamScreen();
    }
  };
}

// ---- Team Screen ----
function showTeamScreen() {
  // Heal team between battles
  teamManager.healTeam();

  showScreen('team');
  renderTeamCards();

  // Start checking for egg hatches
  startEggCheckInterval();
}

let eggCheckInterval = null;

function startEggCheckInterval() {
  if (eggCheckInterval) clearInterval(eggCheckInterval);
  eggCheckInterval = setInterval(() => {
    const hatchLogs = teamManager.checkEggHatch();
    if (hatchLogs.length > 0) {
      for (const ally of teamManager.allies) {
        if (ally.devolved && !ally._revealed) {
          ally._revealed = true;
          pendingDevoReveals.push(ally);
        }
      }
      renderTeamCards();
    }
    // Update egg progress bars
    updateEggProgress();
  }, 500);
}

function stopEggCheckInterval() {
  if (eggCheckInterval) {
    clearInterval(eggCheckInterval);
    eggCheckInterval = null;
  }
}

function renderTeamCards() {
  const container = $('team-cards');
  container.innerHTML = '';

  for (const ally of teamManager.allies) {
    const card = document.createElement('div');
    card.className = 'team-card' + (ally.inEgg ? ' egg' : '');

    let statusText = `HP ${ally.hp}/${ally.maxHp} | XP ${ally.xp}/${ally.xpThreshold}`;
    if (ally.inEgg) statusText = '알 상태 (퇴화 중...)';
    if (ally.devolved) statusText += ' | 퇴화 완료';

    card.innerHTML = `
      <div class="team-card-name">${ally.name}</div>
      <div class="team-card-status">${statusText}</div>
      ${ally.inEgg ? `
        <div class="egg-progress-bar">
          <div class="egg-progress-fill" data-ally-id="${ally.id}" style="width:0%"></div>
        </div>
      ` : ''}
    `;
    container.appendChild(card);
  }

  // Collection
  const collList = $('collection-list');
  collList.innerHTML = '';
  if (teamManager.collection.length === 0) {
    collList.innerHTML = '<div class="collection-item">아직 수집한 몬스터가 없습니다.</div>';
  } else {
    teamManager.collection.forEach(c => {
      const div = document.createElement('div');
      div.className = 'collection-item';
      div.textContent = `${c.name} - ${c.desc}`;
      collList.appendChild(div);
    });
  }

  updateEggProgress();
}

function updateEggProgress() {
  for (const ally of teamManager.allies) {
    if (ally.inEgg) {
      const fill = document.querySelector(`[data-ally-id="${ally.id}"]`);
      if (fill) {
        const progress = teamManager.getEggProgress(ally.id);
        fill.style.width = (progress || 0) + '%';
      }
    }
  }
}

$('next-battle-btn').addEventListener('click', () => {
  stopEggCheckInterval();

  // Check for pending reveals
  teamManager.checkEggHatch();
  for (const ally of teamManager.allies) {
    if (ally.devolved && !ally._revealed) {
      ally._revealed = true;
      pendingDevoReveals.push(ally);
    }
  }

  if (pendingDevoReveals.length > 0) {
    showDevoReveal();
    return;
  }

  const battleTeam = teamManager.getActiveTeam();
  if (battleTeam.filter(a => a.hp > 0).length === 0) {
    showGameOver();
    return;
  }

  startBattle();
});

// ---- Devolution Reveal ----
function showDevoReveal() {
  stopEggCheckInterval();
  showScreen('devo');

  const ally = pendingDevoReveals[0];
  const ORIGINAL_NAMES = { water: '이슬요정', fire: '숯뭉이', grass: '잎사귀요정' };

  $('devo-old-img').src = ally._oldImg || '';
  $('devo-new-img').src = ally.img || '';
  $('devo-old-name').textContent = ORIGINAL_NAMES[ally.id] || ally.id;
  $('devo-arrow').textContent = '~ 퇴화 ~';
  $('devo-new-name').textContent = ally.name;
  $('devo-new-desc').textContent = ally.desc;

  $('devo-next-btn').onclick = () => {
    pendingDevoReveals.shift();
    if (pendingDevoReveals.length > 0) {
      showDevoReveal();
    } else {
      startBattle();
    }
  };
}

// ---- Game Over ----
function showGameOver() {
  stopEggCheckInterval();
  showScreen('gameover');
  $('gameover-stats').innerHTML = `
    전투 횟수: ${battleCount}회<br/>
    수집한 몬스터: ${capturedCount}마리<br/><br/>
    다시 도전해보세요!
  `;
}

$('restart-btn').addEventListener('click', () => {
  teamManager = new TeamManager();
  battleCount = 0;
  capturedCount = 0;
  pendingDevoReveals = [];
  startBattle();
});
