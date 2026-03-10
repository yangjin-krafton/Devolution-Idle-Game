// ============================================================
// Team Management — 6마리 팀 + 퇴화 + 스탯 시스템
// ============================================================

import { ALLY_MONSTERS, ENEMY_MONSTERS, GENERIC_LOGS } from './data/index.js';

export class TeamManager {
  constructor(orderedIds) {
    const source = orderedIds
      ? orderedIds.map(id => ALLY_MONSTERS.find(a => a.id === id)).filter(Boolean)
      : ALLY_MONSTERS;
    this.allies = source.map(a => ({
      ...a,
      actions: a.actions.map(ac => ({ ...ac })),
      stats: { ...a.stats },
    }));
    this.collection = [];
    this.eggTimers = new Map();
    // First 3 are active, last 3 are bench
    this.activeSlots = [0, 1, 2];
  }

  getActiveTeam() {
    return this.activeSlots
      .map(i => this.allies[i])
      .filter(a => a && !a.inEgg);
  }

  getBattleTeam() {
    return this.getActiveTeam().filter(a => a.hp > 0);
  }

  getBenchTeam() {
    return this.allies.filter((a, i) => !this.activeSlots.includes(i));
  }

  getRandomEnemy() {
    const idx = Math.floor(Math.random() * ENEMY_MONSTERS.length);
    return { ...ENEMY_MONSTERS[idx] };
  }

  awardXP(actedAllyIds) {
    const logs = [];
    for (const id of actedAllyIds) {
      const ally = this.allies.find(a => a.id === id);
      if (!ally || ally.inEgg || ally.devolved) continue;
      ally.xp += 1;
      logs.push(GENERIC_LOGS.xpGain(ally.name, `${ally.xp}/${ally.xpThreshold}`));
    }
    return logs;
  }

  checkDevolution() {
    const logs = [];
    for (const ally of this.allies) {
      if (ally.inEgg || ally.devolved) continue;
      if (ally.xp >= ally.xpThreshold) {
        ally.inEgg = true;
        ally.hp = 0;
        this.eggTimers.set(ally.id, {
          startTime: Date.now(),
          duration: 15000,
        });
        logs.push(GENERIC_LOGS.eggEnter(ally.name));
      }
    }
    return logs;
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
          ally.name = ally.devolvedName;
          ally.desc = ally.devolvedDesc;
          ally.img = ally.devolvedImg || ally.img;
          ally.hp = ally.maxHp;
          ally.xp = 0;
          // Apply devolved stats (concentrated)
          if (ally.devolvedStats) {
            ally.stats = { ...ally.devolvedStats };
          }
          // Boost first action power
          if (ally.actions[0]) {
            ally.actions[0].power += 3;
          }
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

  healTeam() {
    for (const ally of this.allies) {
      if (!ally.inEgg) {
        ally.hp = Math.min(ally.maxHp, ally.hp + Math.ceil(ally.maxHp * 0.3));
        // PP 전체 회복
        for (const action of ally.actions) {
          if (action.maxPp != null) action.pp = action.maxPp;
        }
      }
    }
  }

  addCaptured(enemy) {
    this.collection.push({
      id: enemy.id,
      name: enemy.name,
      desc: enemy.desc,
      captured: true,
    });
  }
}
