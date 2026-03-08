// ============================================================
// Combat System — 3분류 스킬 + 3v1 턴 구조
// ============================================================

import { GENERIC_LOGS } from './data.js';

export class CombatSystem {
  constructor(team, enemy) {
    this.team = team;            // array of ally monster refs (active 3)
    this.enemy = { ...enemy };
    this.tamingGauge = 0;
    this.escapeGauge = 0;
    this.turn = 0;
    this.state = 'active';       // active | victory | defeat | escaped
    this.logs = [];
    this.actedThisBattle = new Set();

    // 3v1 turn tracking
    this.turnPhase = 0;          // 0,1,2 = ally turn index, 3 = enemy turn
    this.defenseBoost = 0;       // accumulated defense from defend skills this turn

    this.log(GENERIC_LOGS.encounter(this.enemy.name));
  }

  log(msg) { this.logs.push(msg); }

  getActiveAlly() {
    // Current ally in the turn sequence
    const alive = this.getAliveAllies();
    if (alive.length === 0) return null;
    return alive[Math.min(this.turnPhase, alive.length - 1)];
  }

  getAliveAllies() {
    return this.team.filter(a => a.hp > 0 && !a.inEgg);
  }

  getCurrentTurnAllyIndex() {
    const alive = this.getAliveAllies();
    if (alive.length === 0) return -1;
    const idx = Math.min(this.turnPhase, alive.length - 1);
    return this.team.indexOf(alive[idx]);
  }

  // Use any skill (stimulate / capture / defend)
  useAction(actionIndex) {
    if (this.state !== 'active') return null;

    const ally = this.getActiveAlly();
    if (!ally || ally.hp <= 0) return null;

    const action = ally.actions[actionIndex];
    if (!action) return null;

    this.actedThisBattle.add(ally.id);
    this.log(action.log);

    // Dispatch by category
    if (action.category === 'stimulate') {
      this._handleStimulate(ally, action);
    } else if (action.category === 'capture') {
      this._handleCapture(ally, action);
    } else if (action.category === 'defend') {
      this._handleDefend(ally, action);
    }

    // Check escape
    if (this.escapeGauge >= this.enemy.escapeThreshold) {
      this.state = 'escaped';
      this.log(GENERIC_LOGS.enemyEscape(this.enemy.name));
      return this.getResult();
    }

    // Check victory
    if (this.state === 'victory') return this.getResult();

    // Advance turn phase
    this._advanceTurn();

    return this.getResult();
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

    // Reaction
    const axisKey = { sound: 'sound', temperature: 'temp', smell: 'smell', behavior: 'behav' }[action.axis];
    const reactionKey = `${axisKey}_${isGood ? 'good' : 'bad'}`;
    if (this.enemy.reactions[reactionKey]) this.log(this.enemy.reactions[reactionKey]);
  }

  _handleCapture(ally, action) {
    const tamingRatio = this.tamingGauge / this.enemy.tamingThreshold;
    const stat = ally.stats ? ally.stats.empathy : 5;

    // Too early = guaranteed fail
    if (tamingRatio < 0.4) {
      this.log(GENERIC_LOGS.captureTooEarly);
      this.escapeGauge += action.escapeRisk;
      return;
    }

    // Success chance based on taming ratio + empathy stat
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

    // Defense boost for this turn
    const boost = (action.defenseBoost || 2) * (stat / 5);
    this.defenseBoost += Math.round(boost);
    this.log(GENERIC_LOGS.defendEffect(ally.name));

    // Heal ally
    if (action.healAmount) {
      const heal = Math.round(action.healAmount * (stat / 5));
      ally.hp = Math.min(ally.maxHp, ally.hp + heal);
      this.log(GENERIC_LOGS.healEffect(ally.name, heal));
    }

    // Reduce both gauges (stabilize)
    const tamingReduce = Math.round(action.power * 0.3);
    const escapeReduce = Math.round(action.power * 0.5 + action.escapeRisk * -1);
    this.tamingGauge = Math.max(0, this.tamingGauge - tamingReduce);
    this.escapeGauge = Math.max(0, this.escapeGauge + action.escapeRisk);
  }

  // ---- Turn Flow ----

  _advanceTurn() {
    const alive = this.getAliveAllies();
    this.turnPhase++;

    // All allies acted → enemy attacks → next turn
    if (this.turnPhase >= alive.length) {
      this.turn++;
      this._enemyAttack();
      this.turnPhase = 0;
      this.defenseBoost = 0; // reset defense at turn end
    }
  }

  _enemyAttack() {
    // Pick a random alive ally to attack
    const alive = this.getAliveAllies();
    if (alive.length === 0) return;
    const target = alive[Math.floor(Math.random() * alive.length)];

    const baseDamage = this.enemy.attackPower + Math.floor(Math.random() * 3) - 1;
    const damage = Math.max(1, baseDamage - this.defenseBoost);
    target.hp = Math.max(0, target.hp - damage);

    this.log(this.enemy.reactions.attack);
    this.log(GENERIC_LOGS.enemyAttack(this.enemy.name, damage));

    if (target.hp <= 0) {
      this.log(GENERIC_LOGS.allyFaint(target.name));
      if (this.getAliveAllies().length === 0) {
        this.state = 'defeat';
        this.log(GENERIC_LOGS.allFaint);
      }
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

  getResult() {
    return {
      state: this.state,
      tamingGauge: this.tamingGauge,
      escapeGauge: this.escapeGauge,
      tamingPercent: this.getTamingPercent(),
      escapePercent: this.getEscapePercent(),
      turn: this.turn,
      turnPhase: this.turnPhase,
      logs: this.logs,
      canBond: this.canBond(),
      actedAllies: [...this.actedThisBattle],
      currentAllyIndex: this.getCurrentTurnAllyIndex(),
    };
  }
}
