// ============================================================
// Debug Console Commands — DEBUG.killTeam(), DEBUG.dialog() etc.
// ============================================================

import { showDialog } from './ui/dialogUI.js';
import { DIALOG_SCENES } from './data/dialogs/index.js';
import { ENEMY_MONSTERS, ALLY_MONSTERS } from './data/index.js';
import { getSkill } from './data/skills.js';

export function initDebug(getState) {
  // ---- Mock data helpers ----
  function mockEnemy() {
    const e = ENEMY_MONSTERS[Math.floor(Math.random() * ENEMY_MONSTERS.length)];
    return { id: e.id, name: e.name, img: e.img };
  }

  function mockAlly(overrides = {}) {
    const a = ALLY_MONSTERS[Math.floor(Math.random() * ALLY_MONSTERS.length)];
    return {
      id: a.id, name: a.name, img: a.img,
      xpBefore: 5, xpAfter: 6, xpGain: 1,
      xpBase: 3, xpNeeded: 8,
      leveledUp: false, levelBefore: 2, levelAfter: 2,
      statChanges: {}, newSkills: [], enteredEgg: false,
      actions: a.actions || [
        { name: '기본 자극', category: 'stimulate', axis: 'sound', power: 5, pp: 6, maxPp: 6, escapeRisk: 2, key: 'mock-stim' },
        { name: '기본 포획', category: 'capture', axis: 'sound', power: 4, pp: 3, maxPp: 3, escapeRisk: 1, key: 'mock-cap' },
        { name: '기본 수비', category: 'defend', axis: null, power: 0, pp: 5, maxPp: 5, escapeRisk: -1, key: 'mock-def' },
      ],
      equipped: a.equipped || ['mock-stim', 'mock-cap', 'mock-def'],
      ...overrides,
    };
  }

  window.DEBUG = {
    killTeam() {
      const { combat, currentScreen, refreshCombatUI, endBattle } = getState();
      if (!combat || currentScreen !== 'combat') { console.warn('전투 중에만 사용 가능'); return; }
      combat.team.forEach(a => { a.hp = 0; });
      combat.state = 'defeat';
      combat.log('모든 아군이 쓰러졌다 게임 오버.');
      refreshCombatUI();
      setTimeout(endBattle, 800);
      console.log('아군 전원 HP → 0. 패배 처리 진행 중...');
    },
    dialog(sceneName) {
      const data = DIALOG_SCENES[sceneName];
      if (!data) {
        console.log('사용 가능: ' + Object.keys(DIALOG_SCENES).join(', '));
        return;
      }
      showDialog(data, () => console.log(`[dialog:${sceneName}] 완료`));
    },
    reset() {
      localStorage.clear();
      console.log('localStorage 완전 초기화 완료. 새로고침하면 첫 접속 상태로 시작됩니다.');
      console.log('자동 새로고침...');
      setTimeout(() => location.reload(), 500);
    },

    // ============================================================
    // Result Screen Test Commands
    // ============================================================

    // 승리 — XP만 (레벨업 없음)
    resultVictory() {
      const { showResult } = getState();
      showResult({
        state: 'victory',
        enemy: mockEnemy(),
        allies: [
          mockAlly(),
          mockAlly({ xpBefore: 2, xpAfter: 3, xpBase: 0, xpNeeded: 8 }),
          mockAlly({ xpBefore: 7, xpAfter: 8, xpBase: 3, xpNeeded: 15 }),
        ],
      });
      console.log('[DEBUG] 결과창: 승리 (XP만)');
    },

    // 승리 + 레벨업 + 스탯 성장
    resultLevelUp() {
      const { showResult } = getState();
      showResult({
        state: 'victory',
        enemy: mockEnemy(),
        allies: [
          mockAlly({
            xpBefore: 7, xpAfter: 8, xpBase: 3, xpNeeded: 8,
            leveledUp: true, levelBefore: 2, levelAfter: 3,
            levelUps: [{ from: 2, to: 3, statChanges: { hp: 3, gentleness: 2, empathy: 1, resilience: 0, agility: 1 }, newSkills: [] }],
          }),
          mockAlly({ xpBefore: 1, xpAfter: 2, xpBase: 0, xpNeeded: 3 }),
          mockAlly({ xpBefore: 4, xpAfter: 5, xpBase: 3, xpNeeded: 8 }),
        ],
      });
      console.log('[DEBUG] 결과창: 승리 + 레벨업 (3아군)');
    },

    // 승리 + 레벨업 + 스킬 습득
    resultSkill() {
      const { showResult } = getState();
      const skill = getSkill('sound-pulse') || getSkill('temp-warm-touch')
        || { name: '테스트 스킬', category: 'stimulate', axis: 'sound', power: 5, pp: 3, maxPp: 3, escapeRisk: 1 };
      showResult({
        state: 'victory',
        enemy: mockEnemy(),
        allies: [
          mockAlly({
            xpBefore: 7, xpAfter: 8, xpBase: 3, xpNeeded: 8,
            leveledUp: true, levelBefore: 2, levelAfter: 3,
            levelUps: [{ from: 2, to: 3, statChanges: { hp: 2, gentleness: 3, empathy: 0, resilience: 1, agility: 0 }, newSkills: [skill] }],
          }),
          mockAlly({ xpBefore: 2, xpAfter: 3, xpBase: 0, xpNeeded: 8 }),
          mockAlly({ xpBefore: 5, xpAfter: 6, xpBase: 3, xpNeeded: 15 }),
        ],
      });
      console.log('[DEBUG] 결과창: 승리 + 레벨업 + 스킬 습득 (3아군)');
    },

    // 승리 + 퇴화(알) 진입
    resultEgg() {
      const { showResult } = getState();
      showResult({
        state: 'victory',
        enemy: mockEnemy(),
        allies: [
          mockAlly({
            xpBefore: 99, xpAfter: 100, xpBase: 80, xpNeeded: 100,
            leveledUp: true, levelBefore: 9, levelAfter: 10,
            levelUps: [{ from: 9, to: 10, statChanges: { hp: 2, gentleness: 1 }, newSkills: [] }],
            enteredEgg: true,
          }),
          mockAlly({ xpBefore: 3, xpAfter: 4, xpBase: 0, xpNeeded: 8 }),
          mockAlly({ xpBefore: 6, xpAfter: 7, xpBase: 3, xpNeeded: 15 }),
        ],
      });
      console.log('[DEBUG] 결과창: 승리 + 퇴화 진입 (3아군)');
    },

    // 승리 — 풀 시나리오 (레벨업 + 스킬 + 알)
    resultFull() {
      const { showResult } = getState();
      const skill = getSkill('sound-pulse')
        || { name: '풀 테스트', category: 'stimulate', axis: 'sound', power: 8, pp: 3, maxPp: 3, escapeRisk: 2 };
      showResult({
        state: 'victory',
        enemy: mockEnemy(),
        allies: [
          mockAlly({
            xpBefore: 99, xpAfter: 100, xpBase: 80, xpNeeded: 100,
            leveledUp: true, levelBefore: 9, levelAfter: 10,
            levelUps: [{ from: 9, to: 10, statChanges: { hp: 3, gentleness: 2, empathy: 1, resilience: 1, agility: 0 }, newSkills: [skill] }],
            enteredEgg: true,
          }),
          mockAlly({
            xpBefore: 14, xpAfter: 15, xpBase: 8, xpNeeded: 15,
            leveledUp: true, levelBefore: 3, levelAfter: 4,
            levelUps: [{ from: 3, to: 4, statChanges: { hp: 2, gentleness: 1, empathy: 1 }, newSkills: [] }],
          }),
          mockAlly({ xpBefore: 1, xpAfter: 2, xpBase: 0, xpNeeded: 3 }),
        ],
      });
      console.log('[DEBUG] 결과창: 풀 시나리오 (레벨업 + 스킬 + 퇴화)');
    },


    // 승리 + 다중 레벨업 (Lv.2→5, 3레벨 연속)
    resultMultiLevelUp() {
      const { showResult } = getState();
      const skill1 = getSkill('sound-pulse') || { name: '테스트1', category: 'stimulate', axis: 'sound', power: 5, pp: 3, maxPp: 3, escapeRisk: 1 };
      const skill2 = getSkill('sound-surge') || { name: '테스트2', category: 'stimulate', axis: 'sound', power: 8, pp: 2, maxPp: 2, escapeRisk: 2 };
      showResult({
        state: 'victory',
        enemy: mockEnemy(),
        allies: [
          mockAlly({
            xpBefore: 14, xpAfter: 15, xpBase: 0, xpNeeded: 24,
            leveledUp: true, levelBefore: 2, levelAfter: 5,
            levelUps: [
              { from: 2, to: 3, statChanges: { hp: 2, gentleness: 2, empathy: 1 }, newSkills: [skill1] },
              { from: 3, to: 4, statChanges: { hp: 3, gentleness: 1, resilience: 1, agility: 1 }, newSkills: [] },
              { from: 4, to: 5, statChanges: { hp: 2, gentleness: 3, empathy: 1 }, newSkills: [skill2] },
            ],
          }),
          mockAlly({ xpBefore: 1, xpAfter: 2, xpBase: 0, xpNeeded: 3 }),
          mockAlly({ xpBefore: 7, xpAfter: 8, xpBase: 3, xpNeeded: 15 }),
        ],
      });
      console.log('[DEBUG] 결과창: 다중 레벨업 (Lv.2→5, 3아군)');
    },
    // 도주
    resultEscaped() {
      const { showResult } = getState();
      showResult({
        state: 'escaped',
        enemy: mockEnemy(),
        allies: [
          mockAlly(),
          mockAlly({ xpBefore: 4, xpAfter: 5, xpBase: 3, xpNeeded: 8 }),
          mockAlly({ xpBefore: 2, xpAfter: 3, xpBase: 0, xpNeeded: 8 }),
        ],
      });
      console.log('[DEBUG] 결과창: 도주 (3아군)');
    },

    // 전멸
    resultDefeat() {
      const { showResult } = getState();
      showResult({
        state: 'defeat',
        enemy: mockEnemy(),
        allies: [],
      });
      console.log('[DEBUG] 결과창: 전멸');
    },

    // 도움말
    help() {
      console.log(`
DEBUG 명령어:
  DEBUG.killTeam()        — 전투 중 아군 전원 HP→0 (패배 처리)
  DEBUG.dialog(name)      — 대화 씬 재생
  DEBUG.reset()           — localStorage 초기화 + 새로고침

결과창 테스트:
  DEBUG.resultVictory()   — 승리 (XP만)
  DEBUG.resultLevelUp()   — 승리 + 레벨업 + 스탯 성장
  DEBUG.resultSkill()     — 승리 + 레벨업 + 스킬 습득
  DEBUG.resultEgg()       — 승리 + 퇴화(알) 진입
  DEBUG.resultFull()      — 풀 시나리오 (레벨업+스킬+알, 3아군)
  DEBUG.resultMultiLevelUp() — 다중 레벨업 (Lv.2→5 연속)
  DEBUG.resultEscaped()   — 도주
  DEBUG.resultDefeat()    — 전멸
      `.trim());
    },
  };
}
