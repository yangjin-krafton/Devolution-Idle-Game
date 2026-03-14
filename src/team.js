// ============================================================
// Team Management — 팀 + 퇴화 (CSV 기반, XP/레벨 제거)
// ============================================================

import { ALLY_MONSTERS, ENEMY_MONSTERS, ALL_MONSTERS, GENERIC_LOGS } from './data/index.js';

export class TeamManager {
  constructor(orderedIds) {
    const source = orderedIds
      ? orderedIds.map(id => ALLY_MONSTERS.find(a => a.id === id)).filter(Boolean)
      : ALLY_MONSTERS;
    this.allies = source.map(a => ({
      ...a,
      actions: (a.actions || []).map(act => ({ ...act })),
      inEgg: false,
      devolved: false,
    }));
    this.collection = [];
    this.eggTimers = new Map();
    this.activeSlots = [0, 1, 2];
  }

  getActiveTeam() {
    return this.activeSlots
      .map(i => this.allies[i])
      .filter(a => a && !a.inEgg);
  }

  getBattleTeam() { return this.getActiveTeam(); }

  getBenchTeam() {
    return this.allies.filter((a, i) => !this.activeSlots.includes(i));
  }

  getRandomEnemy() {
    const idx = Math.floor(Math.random() * ENEMY_MONSTERS.length);
    return { ...ENEMY_MONSTERS[idx] };
  }

  healTeam() {
    for (const ally of this.allies) {
      if (!ally.inEgg) {
        for (const action of (ally.actions || [])) {
          if (action.maxPp != null) action.pp = action.maxPp;
        }
      }
    }
  }

  // 퇴화: 알 상태 진입 (외부에서 트리거)
  enterEgg(allyId) {
    const ally = this.allies.find(a => a.id === allyId);
    if (!ally || ally.inEgg || ally.devolved) return null;
    ally.inEgg = true;
    this.eggTimers.set(ally.id, { startTime: Date.now(), duration: 15000 });
    return GENERIC_LOGS.eggEnter(ally.name);
  }

  checkEggHatch() {
    const logs = [];
    for (const [allyId, timer] of this.eggTimers) {
      const elapsed = Date.now() - timer.startTime;
      if (elapsed >= timer.duration) {
        const ally = this.allies.find(a => a.id === allyId);
        if (ally) {
          const oldName = ally.name;
          ally._oldImg = ally.img;
          ally.inEgg = false;
          ally.devolved = true;
          ally.name = ally.devolvedName || ally.name;
          ally.desc = ally.devolvedDesc || ally.desc;
          ally.img = ally.devolvedImg || ally.img;
          this.eggTimers.delete(allyId);
          logs.push(GENERIC_LOGS.eggHatch(oldName, ally.name));
        }
      }
    }
    return logs;
  }

  getEggProgress(allyId) {
    const timer = this.eggTimers.get(allyId);
    if (!timer) return null;
    const elapsed = Date.now() - timer.startTime;
    return Math.min(100, Math.round((elapsed / timer.duration) * 100));
  }

  addCaptured(enemy) {
    this.collection.push({ id: enemy.id, name: enemy.name, desc: enemy.desc, captured: true });
  }

  recruitMonster(enemyId) {
    if (this.allies.length >= 6) return null;
    const family = ALL_MONSTERS.find(m => m.wild.id === enemyId);
    if (!family || !family.devo1[0]) return null;
    const template = family.devo1[0];
    const ally = {
      ...template,
      actions: (template.actions || []).map(act => ({ ...act })),
      inEgg: false,
      devolved: false,
    };
    this.allies.push(ally);
    return ally;
  }

  swapSlots(i, j) {
    if (i < 0 || j < 0 || i >= this.allies.length || j >= this.allies.length) return;
    const tmp = this.allies[i];
    this.allies[i] = this.allies[j];
    this.allies[j] = tmp;
  }

  removeFromRoster(idx) {
    if (idx < 0 || idx >= this.allies.length || this.allies.length <= 3) return false;
    this.allies.splice(idx, 1);
    this.activeSlots = this.activeSlots
      .map(s => s > idx ? s - 1 : s)
      .filter(s => s < this.allies.length);
    while (this.activeSlots.length < Math.min(3, this.allies.length)) {
      for (let i = 0; i < this.allies.length; i++) {
        if (!this.activeSlots.includes(i)) { this.activeSlots.push(i); break; }
      }
    }
    return true;
  }

  canRecruit() { return this.allies.length < 6; }
}
