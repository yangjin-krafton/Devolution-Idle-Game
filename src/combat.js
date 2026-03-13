import { GENERIC_LOGS, ENVIRONMENT_AXES, ENV_AXIS_LABEL } from './data/index.js';
import {
  createEmotionState,
  tickEmotion,
  EMOTIONS,
} from './emotion.js';
import {
  applyPassiveAbilities,
  getDamageReduceAbility,
} from './ability.js';

// ============================================================
// 환경 5축 조율형 전투 엔진 — 정규전 + 연장전
//
// 정규전: 환경이 맞은 상태로 시작 → 적이 매턴 교란
//         → checkTurn(3~5) 도달 시 5축 전부 맞으면 승리
// 연장전: 정규전 실패 시 진입 → 도주 게이지 등장(가속)
//         → 5축 달성 즉시 승리 / 도주 가득 차면 실패
// ============================================================

const AXIS_TO_ENV = {
  sound: 'sound',
  temperature: 'temperature',
  smell: 'smell',
  behavior: 'humidity',
};

export class CombatSystem {
  constructor(team, enemy) {
    this.team = team;
    this.enemy = { ...enemy };
    this.turn = 0;
    this.state = 'active';   // active | overtime | victory | escaped
    this.phase = 'regular';  // regular | overtime
    this.logs = [];
    this.actedThisBattle = new Set();
    this.defenseBoost = 0;
    this.selectedActions = {};
    this.emotionState = createEmotionState();

    // 환경 5축
    this.environment = { temperature: 0, brightness: 0, smell: 0, humidity: 0, sound: 0 };
    this.environmentLocks = { temperature: 0, brightness: 0, smell: 0, humidity: 0, sound: 0 };

    // 공개된 축
    this.revealedAxes = new Set();

    // 정규전: 확인 턴 (3~5 중 랜덤, captureRule에서 설정 가능)
    const rule = enemy.captureRule || {};
    this.checkTurn = rule.checkTurn || (3 + Math.floor(Math.random() * 3));  // 3,4,5

    // 연장전: 도주 게이지
    this.escapeGauge = 0;
    this.escapeMax = 10;
    this.overtimeTurns = 0;  // 연장전 진입 후 경과 턴

    // 어그로
    this.aggro = {};
    this.team.forEach((_, i) => { this.aggro[i] = 0; });
    if (this.team.length > 1) this.aggro[1] = 5;

    this.lastActions = {};

    // 환경을 적 선호에 맞춰서 시작
    this._generateMatchedEnvironment();
    this.log(GENERIC_LOGS.encounter(this.enemy.name));
    this.log(`🔍 ${this.enemy.name}이(가) ${this.checkTurn}턴 뒤 주변을 살핀다...`);
  }

  log(msg) { this.logs.push(msg); }

  // ---- 환경 초기화: 적 선호에 완전 일치 ----
  _generateMatchedEnvironment() {
    const pref = this.enemy.environmentPreference;
    if (!pref) return;
    for (const axis of ENVIRONMENT_AXES) {
      this.environment[axis] = pref[axis]?.ideal ?? 0;
    }
  }

  _axisMatches(axis) {
    const pref = this.enemy.environmentPreference?.[axis];
    if (!pref) return true;
    return Math.abs(this.environment[axis] - pref.ideal) <= pref.tolerance;
  }

  _checkEnvironmentMatch() {
    for (const axis of ENVIRONMENT_AXES) {
      if (!this._axisMatches(axis)) return false;
    }
    return true;
  }

  _getMatchCount() {
    let count = 0;
    for (const axis of ENVIRONMENT_AXES) {
      if (this._axisMatches(axis)) count++;
    }
    return count;
  }

  _getAxisHint(axis) {
    const pref = this.enemy.environmentPreference?.[axis];
    if (!pref) return 'ok';
    const diff = pref.ideal - this.environment[axis];
    if (Math.abs(diff) <= pref.tolerance) return 'ok';
    return diff > 0 ? 'low' : 'high';
  }

  _changeEnvironment(axis, delta) {
    if (this.environmentLocks[axis] > 0) {
      this.log(`${ENV_AXIS_LABEL[axis]}이(가) 잠겨 있어 변하지 않는다!`);
      return;
    }
    this.environment[axis] = Math.max(-2, Math.min(2, this.environment[axis] + delta));
  }

  // ---- 적 교란 ----
  _enemyEnvironmentAction() {
    const skills = this.enemy.environmentSkills;
    if (!skills || skills.length === 0) return;
    const skill = skills[Math.floor(Math.random() * skills.length)];
    this.log(skill.log);
    this._changeEnvironment(skill.axis, skill.delta);
  }

  // ---- 연장전 도주 게이지 (가속) ----
  _updateOvertimeEscape() {
    this.overtimeTurns++;
    // 1턴: +1, 2턴: +2, 3턴: +3 ... 가속
    const gain = this.overtimeTurns;
    this.escapeGauge += gain;
    this.log(`⏳ 도주 위험 +${gain}! (${this.escapeGauge}/${this.escapeMax})`);
  }

  getAliveAllies() {
    return this.team.filter(ally => !ally.inEgg);
  }

  getPendingSlots() {
    const pending = [];
    this.team.forEach((ally, i) => {
      if (!ally.inEgg && this.selectedActions[i] == null) pending.push(i);
    });
    return pending;
  }

  _meetsCondition(action) {
    const cond = action?.condition;
    if (!cond) return true;
    if (cond.turnGte != null && this.turn < cond.turnGte) return false;
    if (cond.turnLte != null && this.turn > cond.turnLte) return false;
    return true;
  }

  canUseAction(ally, action) {
    if (!ally || !action) return false;
    if (ally.inEgg) return false;
    if (action.pp <= 0) return false;
    return this._meetsCondition(action);
  }

  selectAction(allyIndex, actionIndex) {
    if (this.state !== 'active') return null;
    const ally = this.team[allyIndex];
    if (!ally || ally.inEgg) return null;
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

    const startContext = { enemyAtkMod: 1.0 };
    const startLogs = applyPassiveAbilities(this.team, 'turnStart', startContext);
    for (const log of startLogs) this.log(log);

    const ordered = this.calcTurnOrder();
    let enemyActed = false;

    for (const entry of ordered) {
      if (this.state !== 'active') break;

      if (entry.type === 'enemy') {
        this._enemyEnvironmentAction();
        enemyActed = true;
        continue;
      }

      const { allyIdx, actionIdx } = entry;
      const ally = this.team[allyIdx];
      if (!ally || ally.inEgg) continue;

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

      const aggroGain = { stimulate: action.power, capture: action.power * 1.5, defend: action.power * 0.3, survey: 0 };
      this.aggro[allyIdx] = (this.aggro[allyIdx] || 0) + Math.round(aggroGain[action.category] ?? action.power);

      this._handleEnvironmentAction(ally, action);

    }

    if (this.state === 'active' && !enemyActed) {
      this._enemyEnvironmentAction();
    }

    if (this.state === 'active') {
      this._turnEndPhase();
    }

    for (const entry of ordered) {
      if (entry.type === 'ally') this.lastActions[entry.allyIdx] = entry.actionIdx;
    }
    this.selectedActions = {};
  }

  _handleEnvironmentAction(ally, action) {
    if (action.category === 'stimulate') this._handleStimulateAsEnv(ally, action);
    else if (action.category === 'defend') this._handleDefendAsEnv(ally, action);
    else if (action.category === 'capture') {
      // 연장전에서 도주 감소
      if (this.phase === 'overtime') {
        this.escapeGauge = Math.max(0, this.escapeGauge - 2);
        this.log('교감 시도로 도주 의지를 크게 누그러뜨린다! (-2)');
      } else {
        this.log('아직 확인 시간이 아니다...');
      }
    }
    else if (action.category === 'survey') this._handleSurvey(ally, action);
  }

  _handleStimulateAsEnv(ally, action) {
    const envAxis = AXIS_TO_ENV[action.axis] || 'sound';
    const magnitude = action.power > 5 ? 2 : 1;
    const delta = (action.escapeRisk < 0) ? -magnitude : magnitude;
    this._changeEnvironment(envAxis, delta);
    const dirLabel = delta > 0 ? '높아졌다' : '낮아졌다';
    this.log(`${ENV_AXIS_LABEL[envAxis]}이(가) ${dirLabel}. (${this.environment[envAxis]})`);
  }

  _handleDefendAsEnv(ally, action) {
    this.defenseBoost += (action.defenseBoost || 2);
    this.log(GENERIC_LOGS.defendEffect(ally.name));

    if (this.phase === 'overtime') {
      this.escapeGauge = Math.max(0, this.escapeGauge - 1);
      this.log('도주 위험이 줄어든다. (-1)');
    }

  }

  _handleSurvey(ally, action) {
    const pref = this.enemy.environmentPreference;
    if (!pref) return;
    const unrevealed = ENVIRONMENT_AXES.filter(a => !this.revealedAxes.has(a));
    if (unrevealed.length === 0) {
      this.log('이미 모든 환경 선호가 밝혀졌다!');
      return;
    }
    const target = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    this.revealedAxes.add(target);
    const p = pref[target];
    const tolText = p.tolerance > 0 ? ` (±${p.tolerance})` : '';
    const sign = p.ideal > 0 ? '+' : '';
    this.log(`🔍 ${this.enemy.name}의 ${ENV_AXIS_LABEL[target]} 선호: ${sign}${p.ideal}${tolText}`);
  }

  // ---- 턴 종료 ----
  _turnEndPhase() {
    // 어빌리티
    const abilityContext = { escapeGauge: this.escapeGauge, tamingGauge: 0, emotionState: this.emotionState };
    const abilityLogs = applyPassiveAbilities(this.team, 'turnEnd', abilityContext);
    this.escapeGauge = abilityContext.escapeGauge;
    for (const log of abilityLogs) this.log(log);

    const expired = tickEmotion(this.emotionState);
    if (expired) {
      const def = EMOTIONS[expired];
      if (def) this.log(GENERIC_LOGS.emotionExpire(this.enemy.name, def.name));
    }

    // ---- 페이즈 분기 ----
    if (this.phase === 'regular') {
      this._regularTurnEnd();
    } else {
      this._overtimeTurnEnd();
    }
  }

  // ---- 정규전 턴 종료 ----
  _regularTurnEnd() {
    const remaining = this.checkTurn - this.turn;

    if (remaining > 0) {
      // 아직 확인 안 됨 — 카운트다운만 표시
      this.log(`🔍 확인까지 ${remaining}턴 남음...`);
      return;
    }

    // 확인 턴 도달!
    this.log(`🔍 ${this.enemy.name}이(가) 주변을 살핀다!`);

    if (this._checkEnvironmentMatch()) {
      // 5축 모두 맞음 → 승리!
      this.state = 'victory';
      this.log(`✨ 환경이 완벽하다! ${this.enemy.name}이(가) 마음을 연다!`);
      this.log(GENERIC_LOGS.tamingSuccess(this.enemy.name));
      if (this.enemy.reactions?.calm) this.log(this.enemy.reactions.calm);
    } else {
      // 실패 → 연장전 진입
      this.phase = 'overtime';
      const mismatch = ENVIRONMENT_AXES.length - this._getMatchCount();
      this.log(`⚠️ ${mismatch}개 축이 어긋났다! 연장전 돌입!`);
      this.log(`⏳ ${this.enemy.name}이(가) 불안해하기 시작한다...`);
    }
  }

  // ---- 연장전 턴 종료 ----
  _overtimeTurnEnd() {
    // 5축 모두 맞으면 즉시 승리
    if (this._checkEnvironmentMatch()) {
      this.state = 'victory';
      this.log(`✨ 환경을 되찾았다! ${this.enemy.name}이(가) 마음을 연다!`);
      this.log(GENERIC_LOGS.tamingSuccess(this.enemy.name));
      if (this.enemy.reactions?.calm) this.log(this.enemy.reactions.calm);
      return;
    }

    // 도주 게이지 가속 상승
    this._updateOvertimeEscape();

    if (this.escapeGauge >= this.escapeMax) {
      this.state = 'escaped';
      this.log(GENERIC_LOGS.enemyEscape(this.enemy.name));
    }
  }

  getEscapePercent() {
    return Math.min(100, Math.round((this.escapeGauge / this.escapeMax) * 100));
  }

  getAggroTarget() {
    const alive = this.getAliveAllies();
    if (alive.length === 0) return null;
    let maxAggro = -1, target = alive[0];
    for (const ally of alive) {
      const idx = this.team.indexOf(ally);
      if ((this.aggro[idx] || 0) > maxAggro) { maxAggro = this.aggro[idx]; target = ally; }
    }
    return target;
  }

  getAggroTargetIndex() {
    const target = this.getAggroTarget();
    return target ? this.team.indexOf(target) : -1;
  }

  previewAction(ally, action) {
    if (action.category === 'stimulate') {
      const envAxis = AXIS_TO_ENV[action.axis] || 'sound';
      const current = this.environment[envAxis];
      const magnitude = action.power > 5 ? 2 : 1;
      const delta = (action.escapeRisk < 0) ? -magnitude : magnitude;
      const newVal = Math.max(-2, Math.min(2, current + delta));
      const hint = this._getAxisHint(envAxis);
      const revealed = this.revealedAxes.has(envAxis);
      const pref = this.enemy.environmentPreference?.[envAxis];
      return {
        type: 'stimulate', envAxis, envAxisLabel: ENV_AXIS_LABEL[envAxis],
        currentVal: current, delta, newVal, hint, revealed,
        idealVal: revealed ? pref?.ideal : null, tolerance: revealed ? pref?.tolerance : null,
        pp: action.pp, conditionMet: this._meetsCondition(action),
      };
    }
    if (action.category === 'defend') {
      return { type: 'defend', escapeReduce: this.phase === 'overtime' ? 1 : 0, heal: action.healAmount || 0, pp: action.pp, conditionMet: this._meetsCondition(action) };
    }
    if (action.category === 'survey') {
      return { type: 'survey', unrevealedCount: ENVIRONMENT_AXES.filter(a => !this.revealedAxes.has(a)).length, pp: action.pp, conditionMet: this._meetsCondition(action) };
    }
    return { type: 'capture', escapeReduce: this.phase === 'overtime' ? 2 : 0, pp: action.pp, conditionMet: this._meetsCondition(action) };
  }

  calcTurnOrder() {
    const catPriority = { defend: 1, survey: 1, stimulate: 0, capture: -1 };
    const entries = [];
    for (const [i, ai] of Object.entries(this.selectedActions)) {
      const idx = Number(i);
      const ally = this.team[idx];
      const action = ally?.actions[ai];
      const category = action?.category || 'stimulate';
      entries.push({ type: 'ally', allyIdx: idx, actionIdx: ai, priority: action?.priority ?? catPriority[category] ?? 0, agility: 5 });
    }
    entries.push({ type: 'enemy', allyIdx: -1, actionIdx: -1, priority: 0, agility: 5 });
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

    const envStatus = {};
    for (const axis of ENVIRONMENT_AXES) {
      const pref = this.enemy.environmentPreference?.[axis];
      const revealed = this.revealedAxes.has(axis);
      envStatus[axis] = {
        current: this.environment[axis],
        hint: this._getAxisHint(axis),
        matched: this._axisMatches(axis),
        revealed,
        ideal: revealed ? pref?.ideal ?? 0 : null,
        tolerance: revealed ? pref?.tolerance ?? 0 : null,
      };
    }

    return {
      state: this.state,
      phase: this.phase,
      turn: this.turn,
      checkTurn: this.checkTurn,
      turnsRemaining: Math.max(0, this.checkTurn - this.turn),
      escapeGauge: this.escapeGauge,
      escapeMax: this.escapeMax,
      escapePercent: this.getEscapePercent(),
      overtimeTurns: this.overtimeTurns,
      logs: this.logs,
      actedAllies: [...this.actedThisBattle],
      pendingSlots: this.getPendingSlots(),
      selectedActions: { ...this.selectedActions },
      turnOrder: orderMap,
      enemyOrder,
      aggroTarget: this.getAggroTargetIndex(),
      aggro: { ...this.aggro },
      environment: { ...this.environment },
      envStatus,
      matchCount: this._getMatchCount(),
      revealedCount: this.revealedAxes.size,
      emotion: this.emotionState.type
        ? { ...EMOTIONS[this.emotionState.type], turnsLeft: this.emotionState.turnsLeft }
        : null,
    };
  }
}
