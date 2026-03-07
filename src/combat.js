// ============================================================
// Combat System
// ============================================================

import { BONDING_ACTIONS, GENERIC_LOGS } from './data.js';

export class CombatSystem {
  constructor(team, enemy) {
    this.team = team;            // array of ally monster refs
    this.enemy = { ...enemy };   // copy enemy data
    this.tamingGauge = 0;
    this.escapeGauge = 0;
    this.turn = 0;
    this.state = 'active';       // active | bonding | victory | defeat | escaped
    this.logs = [];
    this.activeAllyIndex = 0;
    this.actedThisBattle = new Set(); // track which allies acted (for XP)

    this.log(GENERIC_LOGS.encounter(this.enemy.name));
  }

  log(msg) {
    this.logs.push(msg);
  }

  getActiveAlly() {
    return this.team[this.activeAllyIndex];
  }

  getAvailableAllies() {
    return this.team.filter(a => a.hp > 0 && !a.inEgg);
  }

  switchAlly(index) {
    if (this.team[index] && this.team[index].hp > 0 && !this.team[index].inEgg) {
      this.activeAllyIndex = index;
      this.log(`${this.team[index].name}(으)로 교체했다!`);
    }
  }

  // Player uses a taming action
  useAction(actionIndex) {
    if (this.state !== 'active') return null;

    const ally = this.getActiveAlly();
    if (!ally || ally.hp <= 0) return null;

    const action = ally.actions[actionIndex];
    if (!action) return null;

    this.turn++;
    this.actedThisBattle.add(ally.id);

    // Calculate taming effect based on enemy preference for this axis
    const pref = this.enemy.preferences[action.axis] || 1.0;
    const isGood = pref >= 1.0;
    const tamingGain = Math.round(action.power * pref);
    const escapeChange = Math.round(action.escapeRisk * (isGood ? 0.7 : 1.5));

    this.tamingGauge = Math.min(this.tamingGauge + tamingGain, 150);
    this.escapeGauge = Math.max(0, this.escapeGauge + escapeChange);

    // Action log
    this.log(action.log);

    // Reaction log based on axis + preference
    const axisKey = { sound: 'sound', temperature: 'temp', smell: 'smell', behavior: 'behav' }[action.axis];
    const reactionKey = `${axisKey}_${isGood ? 'good' : 'bad'}`;
    if (this.enemy.reactions[reactionKey]) {
      this.log(this.enemy.reactions[reactionKey]);
    }

    // Check escape
    if (this.escapeGauge >= this.enemy.escapeThreshold) {
      this.state = 'escaped';
      this.log(GENERIC_LOGS.enemyEscape(this.enemy.name));
      return this.getResult();
    }

    // Enemy attacks
    this._enemyAttack();

    return this.getResult();
  }

  // Attempt human bonding
  useBonding(bondingIndex) {
    if (this.state !== 'active') return null;

    const bonding = BONDING_ACTIONS[bondingIndex];
    if (!bonding) return null;

    this.turn++;
    this.log(bonding.log.attempt);

    // Success depends on taming gauge and bonding preference match
    const tamingRatio = this.tamingGauge / this.enemy.tamingThreshold;
    const prefMatch = bonding.type === this.enemy.bondingPreference;

    // Too early = guaranteed fail
    if (tamingRatio < 0.5) {
      this.log(GENERIC_LOGS.bondingTooEarly);
      this.escapeGauge += 10;
      this._enemyAttack();
      return this.getResult();
    }

    // Success chance: based on how close taming is to threshold
    // At 100% taming: 70% base (90% with pref match)
    // At 70% taming: 40% base (55% with pref match)
    let successChance = Math.min(0.9, (tamingRatio - 0.3) * 0.8);
    if (prefMatch) successChance += 0.2;
    successChance = Math.min(0.95, Math.max(0.05, successChance));

    if (Math.random() < successChance) {
      // Success!
      this.log(bonding.log.success);
      this.tamingGauge += bonding.successBonus;
      this.state = 'victory';
      this.log(GENERIC_LOGS.tamingSuccess(this.enemy.name));
      this.log(this.enemy.reactions.calm);
      return this.getResult();
    } else {
      // Fail
      this.log(bonding.log.fail);
      this.escapeGauge += bonding.failPenalty;

      // Check escape after failed bonding
      if (this.escapeGauge >= this.enemy.escapeThreshold) {
        this.state = 'escaped';
        this.log(GENERIC_LOGS.enemyEscape(this.enemy.name));
        return this.getResult();
      }

      this._enemyAttack();
      return this.getResult();
    }
  }

  _enemyAttack() {
    const ally = this.getActiveAlly();
    if (!ally || ally.hp <= 0) return;

    // Enemy attack with some variance
    const damage = Math.max(1, this.enemy.attackPower + Math.floor(Math.random() * 3) - 1);
    ally.hp = Math.max(0, ally.hp - damage);

    this.log(this.enemy.reactions.attack);
    this.log(GENERIC_LOGS.enemyAttack(this.enemy.name, damage));

    if (ally.hp <= 0) {
      this.log(GENERIC_LOGS.allyFaint(ally.name));

      // Check if all allies fainted
      const available = this.getAvailableAllies();
      if (available.length === 0) {
        this.state = 'defeat';
        this.log(GENERIC_LOGS.allFaint);
      } else {
        // Auto-switch to next available ally
        const nextIdx = this.team.findIndex(a => a.hp > 0 && !a.inEgg);
        if (nextIdx >= 0) {
          this.activeAllyIndex = nextIdx;
          this.log(`${this.team[nextIdx].name}이(가) 앞으로 나섰다!`);
        }
      }
    }
  }

  canBond() {
    return this.tamingGauge >= this.enemy.tamingThreshold * 0.5;
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
      logs: this.logs,
      canBond: this.canBond(),
      actedAllies: [...this.actedThisBattle],
    };
  }
}
