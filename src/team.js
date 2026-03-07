// ============================================================
// Team Management & Devolution System
// ============================================================

import { ALLY_MONSTERS, ENEMY_MONSTERS, GENERIC_LOGS } from './data.js';

export class TeamManager {
  constructor() {
    this.allies = ALLY_MONSTERS.map(a => ({ ...a, actions: a.actions.map(ac => ({ ...ac })) }));
    this.collection = [];       // captured enemies (for team replacement)
    this.eggTimers = new Map(); // allyId -> { startTime, duration }
    this.onLog = null;          // callback for logs
  }

  log(msg) {
    if (this.onLog) this.onLog(msg);
  }

  getActiveTeam() {
    return this.allies.filter(a => !a.inEgg);
  }

  getBattleTeam() {
    return this.allies.filter(a => !a.inEgg && a.hp > 0);
  }

  getRandomEnemy() {
    const idx = Math.floor(Math.random() * ENEMY_MONSTERS.length);
    return { ...ENEMY_MONSTERS[idx] };
  }

  // After combat: award XP to allies that acted
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

  // Check and trigger egg state for allies over XP threshold
  checkDevolution() {
    const logs = [];
    for (const ally of this.allies) {
      if (ally.inEgg || ally.devolved) continue;
      if (ally.xp >= ally.xpThreshold) {
        ally.inEgg = true;
        ally.hp = 0;
        this.eggTimers.set(ally.id, {
          startTime: Date.now(),
          duration: 15000, // 15 seconds for MVP (short for testing)
        });
        logs.push(GENERIC_LOGS.eggEnter(ally.name));
      }
    }
    return logs;
  }

  // Check if any eggs are ready to hatch
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
          // Change one action slightly (power boost after devolution)
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

  // Heal all allies between battles (partial heal)
  healTeam() {
    for (const ally of this.allies) {
      if (!ally.inEgg) {
        ally.hp = Math.min(ally.maxHp, ally.hp + Math.ceil(ally.maxHp * 0.3));
      }
    }
  }

  // Add captured enemy as a new ally (simplified for MVP)
  addCaptured(enemy) {
    this.collection.push({
      id: enemy.id,
      name: enemy.name,
      desc: enemy.desc,
      captured: true,
    });
  }
}
