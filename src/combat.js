import { GENERIC_LOGS, calcSensoryMod } from './data/index.js';
import {
  createEmotionState,
  tryApplyEmotion,
  checkAutoEmotion,
  tickEmotion,
  getEmotionMods,
  EMOTIONS,
} from './emotion.js';
import {
  decideEnemyAction,
  decideTargeting,
  calcEnemyDamage,
  calcAoeDamage,
  PERSONALITY,
} from './enemyAI.js';
import { previewAction as buildPreviewAction } from './combatPreview.js';
import { statScale, getStat, awardStatXP, awardEventStatXP } from './statSystem.js';
import {
  applyPassiveAbilities,
  getStimulateAbilityMods,
  checkStimulateEmotionAbility,
  getCaptureAbilityBonus,
  getDefendAbilityBonus,
  getDamageReduceAbility,
} from './ability.js';

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
    this._badAxisStreak = 0;

    this.aggro = {};
    this.team.forEach((_, i) => { this.aggro[i] = 0; });
    if (this.team.length > 1) this.aggro[1] = 5;

    this.axisUsage = { sound: 0, temperature: 0, smell: 0, behavior: 0 };
    this.lastActions = {};

    this.log(GENERIC_LOGS.encounter(this.enemy.name));
  }

  log(msg) {
    this.logs.push(msg);
  }

  getAliveAllies() {
    return this.team.filter(ally => ally.hp > 0 && !ally.inEgg);
  }

  getPendingSlots() {
    const pending = [];
    this.team.forEach((ally, i) => {
      if (ally.hp > 0 && !ally.inEgg && this.selectedActions[i] == null) pending.push(i);
    });
    return pending;
  }

  getEnemyEmotionType() {
    return this.emotionState?.type || null;
  }

  _matchesEmotionCondition(rule) {
    const emotion = this.getEnemyEmotionType();
    if (rule == null) return true;
    if (Array.isArray(rule)) return rule.includes(emotion);
    return emotion === rule;
  }

  _meetsCondition(action) {
    const cond = action?.condition;
    if (!cond) return true;

    const taming = this.getTamingPercent();
    const escape = this.getEscapePercent();

    if (cond.minTamingPercent != null && taming < cond.minTamingPercent) return false;
    if (cond.maxTamingPercent != null && taming > cond.maxTamingPercent) return false;
    if (cond.minEscapePercent != null && escape < cond.minEscapePercent) return false;
    if (cond.maxEscapePercent != null && escape > cond.maxEscapePercent) return false;
    if (cond.turnGte != null && this.turn < cond.turnGte) return false;
    if (cond.turnLte != null && this.turn > cond.turnLte) return false;
    if (cond.requireEnemyEmotion && !this._matchesEmotionCondition(cond.requireEnemyEmotion)) return false;
    if (cond.forbidEnemyEmotion && this._matchesEmotionCondition(cond.forbidEnemyEmotion)) return false;

    return true;
  }

  canUseAction(ally, action) {
    if (!ally || !action) return false;
    if (ally.hp <= 0 || ally.inEgg) return false;
    if (action.pp <= 0) return false;
    return this._meetsCondition(action);
  }

  _resolveStateBonus(action) {
    const bonus = action?.stateBonus;
    if (!bonus) return {};
    if (bonus.ifEnemyEmotion && this.getEnemyEmotionType() !== bonus.ifEnemyEmotion) return {};
    if (bonus.ifEnemyEmotionIn && !bonus.ifEnemyEmotionIn.includes(this.getEnemyEmotionType())) return {};
    return bonus;
  }

  selectAction(allyIndex, actionIndex) {
    if (this.state !== 'active') return null;
    const ally = this.team[allyIndex];
    if (!ally || ally.hp <= 0 || ally.inEgg) return null;

    const action = ally.actions[actionIndex];
    if (!action || !this.canUseAction(ally, action)) return null;

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

  _executeTurn() {
    this.turn++;
    this.defenseBoost = 0;
    this._enemyAtkMod = 1.0;

    // 어빌리티: 턴 시작 패시브
    const startContext = { enemyAtkMod: 1.0 };
    const startLogs = applyPassiveAbilities(this.team, 'turnStart', startContext);
    this._enemyAtkMod = startContext.enemyAtkMod;
    for (const log of startLogs) this.log(log);

    const ordered = this.calcTurnOrder();
    let enemyActed = false;

    for (const entry of ordered) {
      if (this.state !== 'active') break;

      // 적 행동 (통합 턴 순서)
      if (entry.type === 'enemy') {
        this._enemyAction();
        enemyActed = true;
        if (this.state !== 'active') break;
        continue;
      }

      // 아군 행동
      const { allyIdx, actionIdx } = entry;
      const ally = this.team[allyIdx];
      if (!ally || ally.hp <= 0 || ally.inEgg) continue;

      const action = ally.actions[actionIdx];
      if (!action) continue;

      if (!this._meetsCondition(action)) {
        this.log(`${action.name}은(는) 지금 쓰기엔 타이밍이 맞지 않는다.`);
        continue;
      }

      if (action.pp <= 0) {
        this.log(GENERIC_LOGS.ppEmpty(action.name));
        continue;
      }
      action.pp--;

      this.actedThisBattle.add(ally.id);
      this.log(action.log);

      const aggroGain = {
        stimulate: action.power,
        capture: action.power * 1.5,
        defend: action.power * 0.3,
      };
      this.aggro[allyIdx] = (this.aggro[allyIdx] || 0) + Math.round(aggroGain[action.category] || action.power);

      if (action.category === 'stimulate') this._handleStimulate(ally, action);
      else if (action.category === 'capture') this._handleCapture(ally, action);
      else if (action.category === 'defend') this._handleDefend(ally, action);

      // 스탯 경험치 축적
      const statUp = awardStatXP(ally, action.category);
      if (statUp) this.log(`${ally.name}의 ${statUp.name}이(가) ${statUp.newValue}(으)로 올랐다!`);

      if (this.escapeGauge >= this.enemy.escapeThreshold) {
        this.state = 'escaped';
        this.log(GENERIC_LOGS.enemyEscape(this.enemy.name));
        break;
      }
      if (this.state === 'victory') break;
    }

    // 적이 턴 순서에서 행동하지 못한 경우 (전원 수비로 밀림 등) 보장
    if (this.state === 'active' && !enemyActed) {
      this._enemyAction();
    }

    if (this.state === 'active') {
      this._turnEndPhase();
    }

    for (const entry of ordered) {
      if (entry.type === 'ally') this.lastActions[entry.allyIdx] = entry.actionIdx;
    }
    this.selectedActions = {};
  }

  _handleStimulate(ally, action) {
    const emotionMods = getEmotionMods(this.emotionState);
    const stateBonus = this._resolveStateBonus(action);
    const sensoryMod = calcSensoryMod(action.axis, this.enemy.sensoryType);
    const isGood = sensoryMod >= 1.0;
    const stat = getStat(ally.stats, 'affinity');

    this.axisUsage[action.axis] = (this.axisUsage[action.axis] || 0) + 1;
    const usage = this.axisUsage[action.axis];
    const satMod = usage > 2 ? Math.max(0.4, 1.0 - (usage - 2) * 0.15) : 1.0;

    const allyIdx = this.team.indexOf(ally);
    const repeatMod = this.lastActions[allyIdx] === this.team[allyIdx]?.actions.indexOf(action) ? 0.7 : 1.0;

    // 어빌리티 보정
    const abilityMods = getStimulateAbilityMods(this.team, action, this.getEnemyEmotionType());

    const actionPower = action.power + (stateBonus.tamingPowerBonus || 0);
    const actionRisk = action.escapeRisk + (stateBonus.escapeRiskDelta || 0);
    const tamingGain = Math.round(actionPower * sensoryMod * statScale(stat) * emotionMods.tamingMod * abilityMods.tamingMod * satMod * repeatMod);
    const escapeChange = Math.round(actionRisk * (isGood ? 0.7 : 1.5) * emotionMods.escapeMod);

    if (satMod < 1.0) {
      const axisLabel = {
        sound: '소리',
        temperature: '온도',
        smell: '냄새',
        behavior: '행동',
      }[action.axis] || action.axis;
      this.log(`${axisLabel} 자극에 둔감해지고 있다...`);
    }

    this.tamingGauge = Math.min(this.tamingGauge + tamingGain, this.enemy.tamingThreshold * 1.5);
    this.escapeGauge = Math.max(0, this.escapeGauge + escapeChange);

    // instinct 스탯 성장: 상성 유리 자극 시
    if (isGood && sensoryMod > 1.0) {
      const instUp = awardEventStatXP(ally, 'goodSensory');
      if (instUp) this.log(`${ally.name}의 ${instUp.name}이(가) ${instUp.newValue}(으)로 올랐다!`);
    }

    const axisKey = { sound: 'sound', temperature: 'temp', smell: 'smell', behavior: 'behav' }[action.axis];
    const reactionKey = `${axisKey}_${isGood ? 'good' : 'bad'}`;
    if (this.enemy.reactions[reactionKey]) this.log(this.enemy.reactions[reactionKey]);

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

    this._processEffects(action.effects, ally);

    // 어빌리티: 자극 시 감정 유발
    const abilityEmotion = checkStimulateEmotionAbility(this.team, action);
    if (abilityEmotion) {
      const applied = tryApplyEmotion(this.emotionState, abilityEmotion.type, abilityEmotion.chance);
      if (applied) this.log(GENERIC_LOGS.emotionApply(this.enemy.name, applied.name));
    }
  }

  _handleCapture(ally, action) {
    const tamingRatio = this.tamingGauge / this.enemy.tamingThreshold;
    const stat = getStat(ally.stats, 'empathy');
    const emotionMods = getEmotionMods(this.emotionState);
    const stateBonus = this._resolveStateBonus(action);

    if (tamingRatio < 0.4) {
      this.log(GENERIC_LOGS.captureTooEarly);
      this.escapeGauge += action.escapeRisk;
      return;
    }

    let successChance = Math.min(0.9, (tamingRatio - 0.2) * 1.0 * statScale(stat));
    successChance += emotionMods.captureMod;
    successChance += stateBonus.captureChanceBonus || 0;
    successChance += getCaptureAbilityBonus(this.team);
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
    const stat = getStat(ally.stats, 'endurance');
    const stateBonus = this._resolveStateBonus(action);
    const abilityBonus = getDefendAbilityBonus(this.team, ally);
    const boost = ((action.defenseBoost || 2) + (stateBonus.defenseBonus || 0)) * statScale(stat);
    this.defenseBoost += Math.round(boost);
    this.log(GENERIC_LOGS.defendEffect(ally.name));

    const totalHealBase = (action.healAmount || 0) + (stateBonus.healBonus || 0) + abilityBonus.healBonus;
    if (totalHealBase > 0) {
      const heal = Math.round(totalHealBase * statScale(stat));
      ally.hp = Math.min(ally.maxHp, ally.hp + heal);
      this.log(GENERIC_LOGS.healEffect(ally.name, heal));
    }

    this.escapeGauge = Math.max(0, this.escapeGauge + action.escapeRisk + (stateBonus.escapeRiskDelta || 0));
    this._processEffects(action.effects, ally);
  }

  _processEffects(effects, ally) {
    if (!effects) return;
    for (const eff of effects) {
      const applied = tryApplyEmotion(this.emotionState, eff.type, eff.chance);
      if (applied) {
        this.log(GENERIC_LOGS.emotionApply(this.enemy.name, applied.name));
        // bond 스탯 성장: 감정 유발 성공 시
        if (ally) {
          const bondUp = awardEventStatXP(ally, 'emotionTrigger');
          if (bondUp) this.log(`${ally.name}의 ${bondUp.name}이(가) ${bondUp.newValue}(으)로 올랐다!`);
        }
      }
    }
  }

  getAggroTarget() {
    const alive = this.getAliveAllies();
    if (alive.length === 0) return null;

    let maxAggro = -1;
    let target = alive[0];
    for (const ally of alive) {
      const idx = this.team.indexOf(ally);
      if ((this.aggro[idx] || 0) > maxAggro) {
        maxAggro = this.aggro[idx];
        target = ally;
      }
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

    if (decision.log) this.log(decision.log);
    else this.log(this.enemy.reactions.attack);

    const atkMod = this._enemyAtkMod ?? 1.0;
    const targeting = decideTargeting(this.enemy, alive.length, this.enemy.personality);
    if (targeting === 'aoe') {
      const baseDmg = calcAoeDamage(this.enemy.attackPower * atkMod, decision.atkScale, this.defenseBoost);
      this.log(`${this.enemy.name}의 광역 공격! 전체 ${baseDmg}의 피해!`);
      for (const target of alive) {
        const reduce = getDamageReduceAbility(this.team, target);
        const dmg = Math.max(1, baseDmg - reduce);
        target.hp = Math.max(0, target.hp - dmg);
        if (target.hp <= 0) this.log(GENERIC_LOGS.allyFaint(target.name));
      }
    } else {
      const target = this.getAggroTarget();
      const baseDmg = calcEnemyDamage(this.enemy.attackPower * atkMod, decision.atkScale, this.defenseBoost);
      const reduce = getDamageReduceAbility(this.team, target);
      const dmg = Math.max(1, baseDmg - reduce);
      target.hp = Math.max(0, target.hp - dmg);
      this.log(`${this.enemy.name}이(가) ${target.name}을(를) 공격! ${dmg}의 피해!`);
      if (target.hp <= 0) this.log(GENERIC_LOGS.allyFaint(target.name));
    }

    if (this.getAliveAllies().length === 0) {
      this.state = 'defeat';
      this.log(GENERIC_LOGS.allFaint);
    }
  }

  _turnEndPhase() {
    // 어빌리티: 턴 종료 패시브 (도주 감소, 순화 증가, 감정 해제 등)
    const abilityContext = {
      escapeGauge: this.escapeGauge,
      tamingGauge: this.tamingGauge,
      emotionState: this.emotionState,
    };
    const abilityLogs = applyPassiveAbilities(this.team, 'turnEnd', abilityContext);
    this.escapeGauge = abilityContext.escapeGauge;
    this.tamingGauge = Math.min(abilityContext.tamingGauge, this.enemy.tamingThreshold * 1.5);
    for (const log of abilityLogs) this.log(log);

    const emotionMods = getEmotionMods(this.emotionState);
    const personality = PERSONALITY[this.enemy.personality] || PERSONALITY.curious;
    const turnBonus = Math.min(3, Math.max(0, this.turn - 3));
    const naturalEscape = personality.naturalEscape + turnBonus;
    this.escapeGauge += naturalEscape;

    if (emotionMods.escapePerTurn > 0) {
      this.escapeGauge += emotionMods.escapePerTurn;
    }

    const expired = tickEmotion(this.emotionState);
    if (expired) {
      const def = EMOTIONS[expired];
      if (def) this.log(GENERIC_LOGS.emotionExpire(this.enemy.name, def.name));
    }

    const autoEmotion = checkAutoEmotion(this.emotionState, this.getTamingPercent(), this.getEscapePercent());
    if (autoEmotion) this.log(GENERIC_LOGS.emotionApply(this.enemy.name, autoEmotion.name));

    if (this.escapeGauge >= this.enemy.escapeThreshold) {
      this.state = 'escaped';
      this.log(GENERIC_LOGS.enemyEscape(this.enemy.name));
    }
  }

  canBond() {
    return this.tamingGauge >= this.enemy.tamingThreshold * 0.4;
  }

  getTamingPercent() {
    return Math.min(100, Math.round((this.tamingGauge / this.enemy.tamingThreshold) * 100));
  }

  getEscapePercent() {
    return Math.min(100, Math.round((this.escapeGauge / this.enemy.escapeThreshold) * 100));
  }

  previewAction(ally, action) {
    const allyIdx = this.team.indexOf(ally);
    const actionIdx = ally.actions.indexOf(action);
    return buildPreviewAction(ally, action, this.enemy, this.tamingGauge, this.emotionState, {
      turn: this.turn,
      conditionMet: this._meetsCondition(action),
      team: this.team,
      axisUsage: this.axisUsage,
      lastActionIdx: this.lastActions[allyIdx] ?? null,
      currentActionIdx: actionIdx,
    });
  }

  calcTurnOrder() {
    // 우선도: 수비(+1) > 적/자극(0, 속도순) > 포획(-1)
    const catPriority = { defend: 1, stimulate: 0, capture: -1 };
    const entries = [];

    // 아군 엔트리
    for (const [i, ai] of Object.entries(this.selectedActions)) {
      const idx = Number(i);
      const ally = this.team[idx];
      const action = ally?.actions[ai];
      const agility = getStat(ally?.stats, 'agility');
      const category = action?.category || 'stimulate';
      entries.push({
        type: 'ally',
        allyIdx: idx,
        actionIdx: ai,
        priority: action?.priority ?? catPriority[category] ?? 0,
        agility,
      });
    }

    // 적 엔트리 (우선도 0 = 자극과 속도 경쟁)
    entries.push({
      type: 'enemy',
      allyIdx: -1,
      actionIdx: -1,
      priority: 0,
      agility: getStat(this.enemy.stats, 'agility'),
    });

    // 높은 우선도 → 높은 민첩 순
    entries.sort((a, b) => b.priority - a.priority || b.agility - a.agility);

    return entries.map((entry, order) => ({ ...entry, order: order + 1 }));
  }

  getResult() {
    const order = this.calcTurnOrder();
    const orderMap = {};
    let enemyOrder = -1;
    for (const entry of order) {
      if (entry.type === 'enemy') { enemyOrder = entry.order; continue; }
      orderMap[entry.allyIdx] = entry.order;
    }

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
      enemyOrder,
      aggroTarget: this.getAggroTargetIndex(),
      aggro: { ...this.aggro },
      emotion: this.emotionState.type
        ? { ...EMOTIONS[this.emotionState.type], turnsLeft: this.emotionState.turnsLeft }
        : null,
    };
  }
}
