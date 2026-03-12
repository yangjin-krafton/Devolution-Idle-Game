// ============================================================
// Team Management — 6마리 팀 + 퇴화 + 스탯 시스템
// ============================================================

import { ALLY_MONSTERS, ENEMY_MONSTERS, ALL_MONSTERS, GENERIC_LOGS } from './data/index.js';
import { normalizeSkillLoadout, getSkill } from './data/skills.js';

export class TeamManager {
  constructor(orderedIds) {
    const source = orderedIds
      ? orderedIds.map(id => ALLY_MONSTERS.find(a => a.id === id)).filter(Boolean)
      : ALLY_MONSTERS;
    this.allies = source.map(a => {
      const loadout = normalizeSkillLoadout(a);
      return {
        ...a,
        skillPool: loadout.skillPool,
        equipped: [...loadout.equipped],
        actions: loadout.actions,
        stats: { ...a.stats },
      };
    });
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

  // Structured battle rewards — xpCurve-based level-up, statGrowth, skillUnlocks
  computeBattleRewards(actedAllyIds) {
    const allyResults = [];
    for (const id of actedAllyIds) {
      const ally = this.allies.find(a => a.id === id);
      if (!ally || ally.inEgg || ally.devolved) continue;

      const xpBefore = ally.xp;
      const levelBefore = ally.level || 1;
      const xpGain = 1;
      ally.xp += xpGain;

      let leveledUp = false;
      let levelAfter = ally.level || 1;
      const statChanges = {};
      const newSkills = [];
      let enteredEgg = false;

      // xpCurve-based level-up (may level multiple times)
      const curve = ally.xpCurve;
      if (curve) {
        while (levelAfter < (ally.maxLevel || curve.length) && ally.xp >= curve[levelAfter]) {
          levelAfter++;
          leveledUp = true;

          // Stat growth
          if (ally.statGrowth) {
            for (const [stat, [min, max]] of Object.entries(ally.statGrowth)) {
              const gain = min + Math.floor(Math.random() * (max - min + 1));
              if (gain > 0) {
                ally.stats[stat] = (ally.stats[stat] || 0) + gain;
                statChanges[stat] = (statChanges[stat] || 0) + gain;
              }
            }
          }

          // HP growth (10% per level)
          const hpGain = Math.ceil(ally.maxHp * 0.1);
          ally.maxHp += hpGain;
          ally.hp = Math.min(ally.hp + hpGain, ally.maxHp);
          statChanges.hp = (statChanges.hp || 0) + hpGain;

          // Skill unlocks
          if (ally.skillUnlocks && ally.skillUnlocks[levelAfter]) {
            const unlockKeys = ally.skillUnlocks[levelAfter];
            const keys = Array.isArray(unlockKeys) ? unlockKeys : [unlockKeys];
            for (const key of keys) {
              const skill = getSkill(key);
              if (skill && !ally.skillPool.some(s => s.key === key || s === key)) {
                ally.skillPool.push(skill);
                newSkills.push(skill);
              }
            }
          }
        }
      } else {
        // Fallback: old threshold system
        const threshold = ally.xpThreshold || 5;
        if (ally.xp >= threshold) {
          levelAfter = levelBefore + 1;
          leveledUp = true;
        }
      }

      ally.level = levelAfter;

      // Devolution check: maxLevel reached
      const maxLvl = ally.maxLevel || (curve ? curve.length : 10);
      if (levelAfter >= maxLvl && !ally.inEgg) {
        ally.inEgg = true;
        ally.hp = 0;
        enteredEgg = true;
        this.eggTimers.set(ally.id, {
          startTime: Date.now(),
          duration: 15000,
        });
      }

      // xpNeeded for current level's bar display
      const xpNeeded = curve ? (curve[levelAfter] || curve[curve.length - 1]) : (ally.xpThreshold || 5);
      const xpBase = curve ? (curve[levelAfter - 1] || 0) : 0;

      allyResults.push({
        id: ally.id,
        name: ally.name,
        img: ally.img,
        xpBefore, xpAfter: ally.xp, xpGain,
        xpBase, xpNeeded,
        leveledUp,
        levelBefore, levelAfter,
        statChanges,
        newSkills,
        enteredEgg,
      });
    }
    return allyResults;
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

  // Convert wild enemy to ally and add to roster (returns ally entry or null if full)
  recruitMonster(enemyId) {
    if (this.allies.length >= 6) return null;
    // Find the monster family and get devo1[0] as the ally form
    const family = ALL_MONSTERS.find(m => m.wild.id === enemyId);
    if (!family || !family.devo1[0]) return null;
    const template = family.devo1[0];
    const loadout = normalizeSkillLoadout(template);
    const ally = {
      ...template,
      skillPool: loadout.skillPool,
      equipped: [...loadout.equipped],
      actions: loadout.actions,
      stats: { ...template.stats },
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
    // Fix activeSlots references
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
