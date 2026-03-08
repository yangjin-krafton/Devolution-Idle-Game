// ============================================================
// Combat System — 3분류 스킬 + 3마리 동시 선택 턴 구조
// ============================================================

import { GENERIC_LOGS } from './data.js';

export class CombatSystem {
  constructor(team, enemy) {
    this.team = team;
    this.enemy = { ...enemy };
    this.tamingGauge = 0;
    this.escapeGauge = 0;
    this.turn = 0;
    this.state = 'active';
    this.logs = [];
    this.actedThisBattle = new Set();
    this.defenseBoost = 0;

    // 동시 선택: { allyIndex: actionIndex }
    this.selectedActions = {};

    this.log(GENERIC_LOGS.encounter(this.enemy.name));
  }

  log(msg) { this.logs.push(msg); }

  getAliveAllies() {
    return this.team.filter(a => a.hp > 0 && !a.inEgg);
  }

  // 아직 행동을 선택하지 않은 아군 슬롯 인덱스 목록
  getPendingSlots() {
    const pending = [];
    this.team.forEach((ally, i) => {
      if (ally.hp > 0 && !ally.inEgg && this.selectedActions[i] == null) {
        pending.push(i);
      }
    });
    return pending;
  }

  // 한 마리의 행동 선택
  selectAction(allyIndex, actionIndex) {
    if (this.state !== 'active') return null;
    const ally = this.team[allyIndex];
    if (!ally || ally.hp <= 0 || ally.inEgg) return null;

    this.selectedActions[allyIndex] = actionIndex;

    // 모든 생존 아군이 선택 완료 → 턴 실행
    if (this.getPendingSlots().length === 0) {
      this._executeTurn();
    }

    return this.getResult();
  }

  // ---- Turn Execution (모든 선택 후 일괄 실행) ----

  _executeTurn() {
    this.turn++;
    this.defenseBoost = 0;

    // 우선순위 순 실행: 수비 → 자극 → 포획 (동순위는 agility 높은 순)
    const ordered = this.calcTurnOrder();

    for (const { allyIdx, actionIdx } of ordered) {
      if (this.state !== 'active') break;
      const ally = this.team[allyIdx];
      if (!ally || ally.hp <= 0) continue;

      const action = ally.actions[actionIdx];
      if (!action) continue;

      this.actedThisBattle.add(ally.id);
      this.log(action.log);

      if (action.category === 'stimulate') this._handleStimulate(ally, action);
      else if (action.category === 'capture') this._handleCapture(ally, action);
      else if (action.category === 'defend') this._handleDefend(ally, action);

      // Check escape mid-turn
      if (this.escapeGauge >= this.enemy.escapeThreshold) {
        this.state = 'escaped';
        this.log(GENERIC_LOGS.enemyEscape(this.enemy.name));
        break;
      }
      if (this.state === 'victory') break;
    }

    // Enemy attacks after all allies acted
    if (this.state === 'active') {
      this._enemyAttack();
    }

    // Reset for next turn
    this.selectedActions = {};
  }

  // ---- Skill Category Handlers ----

  _handleStimulate(ally, action) {
    const pref = this.enemy.preferences[action.axis] || 1.0;
    const isGood = pref >= 1.0;
    const stat = ally.stats ? ally.stats.gentleness : 5;
    const tamingGain = Math.round(action.power * pref * (stat / 5));
    const escapeChange = Math.round(action.escapeRisk * (isGood ? 0.7 : 1.5));

    this.tamingGauge = Math.min(this.tamingGauge + tamingGain, 150);
    this.escapeGauge = Math.max(0, this.escapeGauge + escapeChange);

    const axisKey = { sound: 'sound', temperature: 'temp', smell: 'smell', behavior: 'behav' }[action.axis];
    const reactionKey = `${axisKey}_${isGood ? 'good' : 'bad'}`;
    if (this.enemy.reactions[reactionKey]) this.log(this.enemy.reactions[reactionKey]);
  }

  _handleCapture(ally, action) {
    const tamingRatio = this.tamingGauge / this.enemy.tamingThreshold;
    const stat = ally.stats ? ally.stats.empathy : 5;

    if (tamingRatio < 0.4) {
      this.log(GENERIC_LOGS.captureTooEarly);
      this.escapeGauge += action.escapeRisk;
      return;
    }

    let successChance = Math.min(0.9, (tamingRatio - 0.2) * 0.7 * (stat / 5));
    successChance = Math.min(0.95, Math.max(0.05, successChance));

    if (Math.random() < successChance) {
      this.log(GENERIC_LOGS.captureSuccess(this.enemy.name));
      this.state = 'victory';
      this.log(GENERIC_LOGS.tamingSuccess(this.enemy.name));
      if (this.enemy.reactions.calm) this.log(this.enemy.reactions.calm);
    } else {
      this.log(GENERIC_LOGS.captureFail);
      this.escapeGauge += action.escapeRisk;
    }
  }

  _handleDefend(ally, action) {
    const stat = ally.stats ? ally.stats.resilience : 5;
    const boost = (action.defenseBoost || 2) * (stat / 5);
    this.defenseBoost += Math.round(boost);
    this.log(GENERIC_LOGS.defendEffect(ally.name));

    if (action.healAmount) {
      const heal = Math.round(action.healAmount * (stat / 5));
      ally.hp = Math.min(ally.maxHp, ally.hp + heal);
      this.log(GENERIC_LOGS.healEffect(ally.name, heal));
    }

    this.tamingGauge = Math.max(0, this.tamingGauge - Math.round(action.power * 0.3));
    this.escapeGauge = Math.max(0, this.escapeGauge + action.escapeRisk);
  }

  // ---- Enemy Attack ----

  _enemyAttack() {
    const alive = this.getAliveAllies();
    if (alive.length === 0) return;

    const isAoe = alive.length >= 2 && Math.random() < 0.3;
    this.log(this.enemy.reactions.attack);

    if (isAoe) {
      const aoeDmg = Math.max(1, Math.round(this.enemy.attackPower * 0.6) - this.defenseBoost);
      this.log(`${this.enemy.name}의 광역 공격! 전체 ${aoeDmg}의 피해!`);
      for (const target of alive) {
        target.hp = Math.max(0, target.hp - aoeDmg);
        if (target.hp <= 0) this.log(GENERIC_LOGS.allyFaint(target.name));
      }
    } else {
      const target = alive[Math.floor(Math.random() * alive.length)];
      const baseDamage = this.enemy.attackPower + Math.floor(Math.random() * 3) - 1;
      const damage = Math.max(1, baseDamage - this.defenseBoost);
      target.hp = Math.max(0, target.hp - damage);
      this.log(GENERIC_LOGS.enemyAttack(this.enemy.name, damage));
      if (target.hp <= 0) this.log(GENERIC_LOGS.allyFaint(target.name));
    }

    if (this.getAliveAllies().length === 0) {
      this.state = 'defeat';
      this.log(GENERIC_LOGS.allFaint);
    }
  }

  // ---- Queries ----

  canBond() {
    return this.tamingGauge >= this.enemy.tamingThreshold * 0.4;
  }

  getTamingPercent() {
    return Math.min(100, Math.round((this.tamingGauge / this.enemy.tamingThreshold) * 100));
  }

  getEscapePercent() {
    return Math.min(100, Math.round((this.escapeGauge / this.enemy.escapeThreshold) * 100));
  }

  // Preview skill effect for UI display
  previewAction(ally, action) {
    const stat = ally.stats || { gentleness: 5, empathy: 5, resilience: 5, agility: 5 };
    if (action.category === 'stimulate') {
      const pref = this.enemy.preferences[action.axis] || 1.0;
      const gain = Math.round(action.power * pref * (stat.gentleness / 5));
      const esc = Math.round(action.escapeRisk * (pref >= 1.0 ? 0.7 : 1.5));
      return { type: 'stimulate', taming: gain, escape: esc };
    } else if (action.category === 'capture') {
      const ratio = this.tamingGauge / this.enemy.tamingThreshold;
      let chance = Math.min(0.9, (ratio - 0.2) * 0.7 * (stat.empathy / 5));
      chance = Math.min(0.95, Math.max(ratio < 0.4 ? 0 : 0.05, chance));
      return { type: 'capture', chance: Math.round(chance * 100), escape: action.escapeRisk };
    } else {
      const heal = action.healAmount ? Math.round(action.healAmount * (stat.resilience / 5)) : 0;
      const def = Math.round((action.defenseBoost || 2) * (stat.resilience / 5));
      return { type: 'defend', heal, defense: def, tamingCost: Math.round(action.power * 0.3) };
    }
  }

  // Calculate turn execution order based on agility + category priority
  // defend(0) → stimulate(1) → capture(2), ties broken by agility
  calcTurnOrder() {
    const catPriority = { defend: 0, stimulate: 1, capture: 2 };
    const entries = Object.entries(this.selectedActions).map(([i, ai]) => {
      const idx = Number(i);
      const ally = this.team[idx];
      const action = ally?.actions[ai];
      const agi = ally?.stats?.agility || 5;
      const cat = action?.category || 'stimulate';
      return { allyIdx: idx, actionIdx: ai, priority: catPriority[cat] ?? 1, agility: agi };
    });
    entries.sort((a, b) => a.priority - b.priority || b.agility - a.agility);
    return entries.map((e, order) => ({ ...e, order: order + 1 }));
  }

  getResult() {
    const order = this.calcTurnOrder();
    // Build order map: allyIdx → order number
    const orderMap = {};
    for (const e of order) orderMap[e.allyIdx] = e.order;

    return {
      state: this.state,
      tamingPercent: this.getTamingPercent(),
      escapePercent: this.getEscapePercent(),
      turn: this.turn,
      logs: this.logs,
      canBond: this.canBond(),
      actedAllies: [...this.actedThisBattle],
      pendingSlots: this.getPendingSlots(),
      selectedActions: { ...this.selectedActions },
      turnOrder: orderMap,
    };
  }
}
