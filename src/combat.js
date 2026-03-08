// ============================================================
// Combat System — 감정 상태 + 적 AI + 상성 + PP
// ============================================================

import { GENERIC_LOGS, calcSensoryMod } from './data.js';
import { createEmotionState, tryApplyEmotion, checkAutoEmotion, tickEmotion, getEmotionMods, EMOTIONS } from './emotion.js';
import { decideEnemyAction, decideTargeting, calcEnemyDamage, calcAoeDamage } from './enemyAI.js';
import { statScale, previewAction as _previewAction } from './combatPreview.js';

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
    this.selectedActions = {};
    this.emotionState = createEmotionState();
    this._badAxisStreak = 0; // 불리 상성 연속 카운터 (분노 유발용)

    // 어그로
    this.aggro = {};
    this.team.forEach((_, i) => { this.aggro[i] = 0; });
    if (this.team.length > 1) this.aggro[1] = 5;

    this.log(GENERIC_LOGS.encounter(this.enemy.name));
  }

  log(msg) { this.logs.push(msg); }

  getAliveAllies() { return this.team.filter(a => a.hp > 0 && !a.inEgg); }

  getPendingSlots() {
    const pending = [];
    this.team.forEach((ally, i) => {
      if (ally.hp > 0 && !ally.inEgg && this.selectedActions[i] == null) pending.push(i);
    });
    return pending;
  }

  selectAction(allyIndex, actionIndex) {
    if (this.state !== 'active') return null;
    const ally = this.team[allyIndex];
    if (!ally || ally.hp <= 0 || ally.inEgg) return null;
    const action = ally.actions[actionIndex];
    if (action && action.pp <= 0) return null; // PP 없으면 선택 불가

    if (this.selectedActions[allyIndex] === actionIndex) {
      delete this.selectedActions[allyIndex];
    } else {
      this.selectedActions[allyIndex] = actionIndex;
    }
    return this.getResult();
  }

  confirmTurn() {
    if (this.state !== 'active') return null;
    if (this.getPendingSlots().length > 0) return null;
    this._executeTurn();
    return this.getResult();
  }

  // ---- Turn Execution ----
  _executeTurn() {
    this.turn++;
    this.defenseBoost = 0;
    const ordered = this.calcTurnOrder();

    for (const { allyIdx, actionIdx } of ordered) {
      if (this.state !== 'active') break;
      const ally = this.team[allyIdx];
      if (!ally || ally.hp <= 0) continue;
      const action = ally.actions[actionIdx];
      if (!action) continue;

      // PP 소모
      if (action.pp <= 0) {
        this.log(GENERIC_LOGS.ppEmpty(action.name));
        continue;
      }
      action.pp--;

      this.actedThisBattle.add(ally.id);
      this.log(action.log);

      // 어그로
      const aggroGain = { stimulate: action.power, capture: action.power * 1.5, defend: action.power * 0.3 };
      this.aggro[allyIdx] = (this.aggro[allyIdx] || 0) + Math.round(aggroGain[action.category] || action.power);

      if (action.category === 'stimulate') this._handleStimulate(ally, action);
      else if (action.category === 'capture') this._handleCapture(ally, action);
      else if (action.category === 'defend') this._handleDefend(ally, action);

      if (this.escapeGauge >= this.enemy.escapeThreshold) {
        this.state = 'escaped';
        this.log(GENERIC_LOGS.enemyEscape(this.enemy.name));
        break;
      }
      if (this.state === 'victory') break;
    }

    // 턴 종료 페이즈
    if (this.state === 'active') {
      this._enemyAction();
      this._turnEndPhase();
    }

    this.selectedActions = {};
  }

  // ---- Skill Handlers (밸런스 수정 적용) ----

  _handleStimulate(ally, action) {
    const emotionMods = getEmotionMods(this.emotionState);
    // 상성 계산
    const sensoryMod = calcSensoryMod(action.axis, this.enemy.sensoryType);
    const isGood = sensoryMod >= 1.0;
    const stat = ally.stats ? ally.stats.gentleness : 5;
    const tamingGain = Math.round(action.power * sensoryMod * statScale(stat) * emotionMods.tamingMod);
    const escapeChange = Math.round(action.escapeRisk * (isGood ? 0.7 : 1.5) * emotionMods.escapeMod);

    this.tamingGauge = Math.min(this.tamingGauge + tamingGain, this.enemy.tamingThreshold * 1.5);
    this.escapeGauge = Math.max(0, this.escapeGauge + escapeChange);

    // 반응 로그
    const axisKey = { sound: 'sound', temperature: 'temp', smell: 'smell', behavior: 'behav' }[action.axis];
    const reactionKey = `${axisKey}_${isGood ? 'good' : 'bad'}`;
    if (this.enemy.reactions[reactionKey]) this.log(this.enemy.reactions[reactionKey]);

    // 불리 상성 연속 → 분노 유발
    if (!isGood) {
      this._badAxisStreak++;
      if (this._badAxisStreak >= 2) {
        const applied = tryApplyEmotion(this.emotionState, 'rage', 0.5);
        if (applied) this.log(GENERIC_LOGS.emotionApply(this.enemy.name, applied.name));
        this._badAxisStreak = 0;
      }
    } else {
      this._badAxisStreak = 0;
    }

    // 스킬 부가 효과
    this._processEffects(action.effects);
  }

  _handleCapture(ally, action) {
    const tamingRatio = this.tamingGauge / this.enemy.tamingThreshold;
    const stat = ally.stats ? ally.stats.empathy : 5;
    const emotionMods = getEmotionMods(this.emotionState);

    if (tamingRatio < 0.4) {
      this.log(GENERIC_LOGS.captureTooEarly);
      this.escapeGauge += action.escapeRisk;
      return;
    }

    // 개선된 포획 공식: 계수 0.7 → 1.0 + 감정 보정
    let successChance = Math.min(0.9, (tamingRatio - 0.2) * 1.0 * statScale(stat));
    successChance += emotionMods.captureMod;
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
    const boost = (action.defenseBoost || 2) * statScale(stat);
    this.defenseBoost += Math.round(boost);
    this.log(GENERIC_LOGS.defendEffect(ally.name));

    if (action.healAmount) {
      const heal = Math.round(action.healAmount * statScale(stat));
      ally.hp = Math.min(ally.maxHp, ally.hp + heal);
      this.log(GENERIC_LOGS.healEffect(ally.name, heal));
    }

    // 수비 시 순화 감소 제거 — 기회비용만으로 충분
    this.escapeGauge = Math.max(0, this.escapeGauge + action.escapeRisk);

    // 스킬 부가 효과 (진정 유발 등)
    this._processEffects(action.effects);
  }

  // 스킬 부가 효과 처리
  _processEffects(effects) {
    if (!effects) return;
    for (const eff of effects) {
      const applied = tryApplyEmotion(this.emotionState, eff.type, eff.chance);
      if (applied) this.log(GENERIC_LOGS.emotionApply(this.enemy.name, applied.name));
    }
  }

  // ---- Enemy Action (AI 기반) ----

  getAggroTarget() {
    const alive = this.getAliveAllies();
    if (alive.length === 0) return null;
    let maxAggro = -1, target = alive[0];
    for (const a of alive) {
      const idx = this.team.indexOf(a);
      if ((this.aggro[idx] || 0) > maxAggro) { maxAggro = this.aggro[idx]; target = a; }
    }
    return target;
  }

  getAggroTargetIndex() {
    const target = this.getAggroTarget();
    return target ? this.team.indexOf(target) : -1;
  }

  _enemyAction() {
    const alive = this.getAliveAllies();
    if (alive.length === 0) return;

    const emotionMods = getEmotionMods(this.emotionState);
    const tamingPct = this.getTamingPercent();
    const escapePct = this.getEscapePercent();

    const decision = decideEnemyAction(this.enemy, tamingPct, escapePct, emotionMods);

    if (decision.type === 'skip') {
      this.log(decision.log);
      return;
    }

    if (decision.type === 'flee_attempt') {
      this.log(decision.log);
      this.escapeGauge += 15;
      if (this.escapeGauge >= this.enemy.escapeThreshold) {
        this.state = 'escaped';
        this.log(GENERIC_LOGS.enemyEscape(this.enemy.name));
      }
      return;
    }

    // attack or rage_attack
    if (decision.log) this.log(decision.log);
    else this.log(this.enemy.reactions.attack);

    const targeting = decideTargeting(this.enemy, alive.length, this.enemy.personality);

    if (targeting === 'aoe') {
      const dmg = calcAoeDamage(this.enemy.attackPower, decision.atkScale, this.defenseBoost);
      this.log(`${this.enemy.name}의 광역 공격! 전체 ${dmg}의 피해!`);
      for (const target of alive) {
        target.hp = Math.max(0, target.hp - dmg);
        if (target.hp <= 0) this.log(GENERIC_LOGS.allyFaint(target.name));
      }
    } else {
      const target = this.getAggroTarget();
      const dmg = calcEnemyDamage(this.enemy.attackPower, decision.atkScale, this.defenseBoost);
      target.hp = Math.max(0, target.hp - dmg);
      this.log(`${this.enemy.name}이(가) ${target.name}을(를) 공격! ${dmg}의 피해!`);
      if (target.hp <= 0) this.log(GENERIC_LOGS.allyFaint(target.name));
    }

    if (this.getAliveAllies().length === 0) {
      this.state = 'defeat';
      this.log(GENERIC_LOGS.allFaint);
    }
  }

  // 턴 종료 페이즈: 감정 틱 + 자동 감정 체크
  _turnEndPhase() {
    const emotionMods = getEmotionMods(this.emotionState);

    // 공포 시 매 턴 도주 증가
    if (emotionMods.escapePerTurn > 0) {
      this.escapeGauge += emotionMods.escapePerTurn;
    }

    // 감정 지속턴 감소
    const expired = tickEmotion(this.emotionState);
    if (expired) {
      const def = EMOTIONS[expired];
      if (def) this.log(GENERIC_LOGS.emotionExpire(this.enemy.name, def.name));
    }

    // 자동 감정 (순화/도주 기반)
    const autoEmotion = checkAutoEmotion(this.emotionState, this.getTamingPercent(), this.getEscapePercent());
    if (autoEmotion) this.log(GENERIC_LOGS.emotionApply(this.enemy.name, autoEmotion.name));

    // 도주 체크
    if (this.escapeGauge >= this.enemy.escapeThreshold) {
      this.state = 'escaped';
      this.log(GENERIC_LOGS.enemyEscape(this.enemy.name));
    }
  }

  // ---- Queries ----

  canBond() { return this.tamingGauge >= this.enemy.tamingThreshold * 0.4; }

  getTamingPercent() {
    return Math.min(100, Math.round((this.tamingGauge / this.enemy.tamingThreshold) * 100));
  }

  getEscapePercent() {
    return Math.min(100, Math.round((this.escapeGauge / this.enemy.escapeThreshold) * 100));
  }

  previewAction(ally, action) {
    return _previewAction(ally, action, this.enemy, this.tamingGauge, this.emotionState);
  }

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
      aggroTarget: this.getAggroTargetIndex(),
      aggro: { ...this.aggro },
      emotion: this.emotionState.type ? { ...EMOTIONS[this.emotionState.type], turnsLeft: this.emotionState.turnsLeft } : null,
    };
  }
}
