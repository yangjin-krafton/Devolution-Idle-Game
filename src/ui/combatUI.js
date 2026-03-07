// ============================================================
// Combat Screen UI Rendering
// ============================================================

import { BONDING_ACTIONS } from '../data.js';
import { $ } from './screens.js';
import {
  playTamingEffect, playAttackEffect,
  playBondingAttempt, playBondingSuccess, playBondingFail,
  playEscapeEffect, playFaintEffect,
} from '../effects.js';

let onAction = null;   // callback(index)
let onBonding = null;  // callback(index)
let onSwitchAlly = null; // callback(index)
let currentMode = 'taming';

export function setCombatCallbacks({ action, bonding, switchAlly }) {
  onAction = action;
  onBonding = bonding;
  onSwitchAlly = switchAlly;
}

export function setMode(mode) {
  currentMode = mode;
}

export function getMode() {
  return currentMode;
}

// ---- Enemy ----

export function renderEnemy(enemy) {
  $('enemy-name').textContent = enemy.name;
  $('enemy-desc').textContent = enemy.desc;
  $('enemy-img').src = enemy.img || '';
  $('enemy-img').alt = enemy.name;
}

export function updateGauges(tamingPercent, escapePercent) {
  $('taming-fill').style.width = tamingPercent + '%';
  $('taming-pct').textContent = tamingPercent + '%';
  $('escape-fill').style.width = escapePercent + '%';
  $('escape-pct').textContent = escapePercent + '%';
}

// ---- Logs ----

export function renderLogs(logs) {
  const logArea = $('log-area');
  logArea.innerHTML = '';
  for (const msg of logs) {
    const div = document.createElement('div');
    div.className = 'log-entry';
    if (msg.includes('교감') && msg.includes('성공')) div.className += ' success';
    else if (msg.includes('도망') || msg.includes('훈미') || msg.includes('게임 오버') || msg.includes('피해')) div.className += ' danger';
    else if (msg.includes('나타났다') || msg.includes('경험치') || msg.includes('알 상태')) div.className += ' system';
    else if (msg.includes('교감') || msg.includes('순화')) div.className += ' important';
    div.textContent = msg;
    logArea.appendChild(div);
  }
  logArea.scrollTop = logArea.scrollHeight;
}

// ---- Ally Tabs ----

export function renderAllyTabs(team, activeAllyIndex, combatState) {
  const tabs = $('ally-tabs');
  tabs.innerHTML = '';
  team.forEach((ally, i) => {
    const tab = document.createElement('div');
    tab.className = 'ally-tab';
    if (i === activeAllyIndex) tab.className += ' active';
    if (ally.hp <= 0) tab.className += ' fainted';
    if (ally.inEgg) tab.className += ' in-egg';

    tab.innerHTML = `
      <img class="ally-tab-img" src="${ally.img || ''}" alt="${ally.name}" />
      <div class="ally-tab-name">${ally.name}</div>
      <div class="ally-tab-hp">HP ${ally.hp}/${ally.maxHp}</div>
    `;
    tab.addEventListener('click', () => {
      if (ally.hp > 0 && !ally.inEgg && combatState === 'active' && onSwitchAlly) {
        onSwitchAlly(i);
      }
    });
    tabs.appendChild(tab);
  });
}

// ---- Action Buttons ----

const AXIS_LABELS = { sound: '청각', temperature: '온도', smell: '후각', behavior: '행동' };

export function renderActions(ally, canBond) {
  const actionsDiv = $('actions');
  actionsDiv.innerHTML = '';

  // Mode toggle
  const modeTaming = $('mode-taming');
  const modeBonding = $('mode-bonding');
  modeTaming.className = 'mode-btn' + (currentMode === 'taming' ? ' active' : '');
  modeBonding.className = 'mode-btn' + (currentMode === 'bonding' ? ' active' : '');
  if (!canBond) modeBonding.className += ' disabled';

  if (currentMode === 'taming') {
    if (!ally) return;
    ally.actions.forEach((action, i) => {
      const btn = document.createElement('button');
      btn.className = 'action-btn';
      btn.innerHTML = `
        <span class="action-name">${action.name}</span>
        <span class="action-axis">${AXIS_LABELS[action.axis]}</span>
        <div class="action-desc">${action.log}</div>
      `;
      btn.addEventListener('click', () => { if (onAction) onAction(i); });
      actionsDiv.appendChild(btn);
    });
  } else {
    BONDING_ACTIONS.forEach((bonding, i) => {
      const btn = document.createElement('button');
      btn.className = 'action-btn bonding';
      if (!canBond) btn.className += ' disabled';
      btn.innerHTML = `
        <span class="action-name">${bonding.name}</span>
        <div class="action-desc">${bonding.desc}</div>
      `;
      if (canBond) {
        btn.addEventListener('click', () => { if (onBonding) onBonding(i); });
      }
      actionsDiv.appendChild(btn);
    });
  }
}

// ---- VFX triggers ----

export function triggerTamingVFX(axis, isGood) {
  const el = $('enemy-img');
  playTamingEffect(el, axis, isGood);
}

export function triggerAttackVFX() {
  // Play on the active ally tab that is .active
  const activeTab = document.querySelector('.ally-tab.active');
  if (activeTab) playAttackEffect(activeTab);
}

export function triggerBondingAttemptVFX() {
  playBondingAttempt($('enemy-img'));
}

export function triggerBondingSuccessVFX() {
  playBondingSuccess($('enemy-img'));
}

export function triggerBondingFailVFX() {
  playBondingFail($('enemy-img'));
}

export function triggerEscapeVFX() {
  playEscapeEffect($('enemy-img'));
}

export function triggerFaintVFX() {
  const activeTab = document.querySelector('.ally-tab.active');
  if (activeTab) playFaintEffect(activeTab);
}

export function shakeEnemy() {
  const img = $('enemy-img');
  img.classList.remove('shake');
  void img.offsetWidth;
  img.classList.add('shake');
}

// ---- Mode toggle listeners ----

export function initModeToggle(combat) {
  $('mode-taming').addEventListener('click', () => {
    currentMode = 'taming';
    renderActions(combat.getActiveAlly(), combat.canBond());
  });
  $('mode-bonding').addEventListener('click', () => {
    if (combat && combat.canBond()) {
      currentMode = 'bonding';
      renderActions(combat.getActiveAlly(), combat.canBond());
    }
  });
}
