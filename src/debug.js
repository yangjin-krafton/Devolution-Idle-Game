// ============================================================
// Debug Console Commands
// ============================================================

import { showDialog } from './ui/dialogUI.js';
import { DIALOG_SCENES } from './data/dialogs/index.js';
import { ENEMY_MONSTERS, ALLY_MONSTERS } from './data/index.js';

export function initDebug(getState) {
  function mockEnemy() {
    const e = ENEMY_MONSTERS[Math.floor(Math.random() * ENEMY_MONSTERS.length)];
    return e ? { id: e.id, name: e.name, img: e.img } : { id: 'test', name: '테스트', img: '' };
  }

  function mockAlly(overrides = {}) {
    const a = ALLY_MONSTERS[Math.floor(Math.random() * ALLY_MONSTERS.length)];
    if (!a) return { id: 'test', name: '테스트', img: '', actions: [], ...overrides };
    return {
      id: a.id, name: a.name, img: a.img,
      actions: a.actions || [],
      enteredEgg: false,
      ...overrides,
    };
  }

  window.DEBUG = {
    killTeam() {
      const { combat, currentScreen, refreshCombatUI, endBattle } = getState();
      if (!combat || currentScreen !== 'combat') { console.warn('전투 중에만 사용 가능'); return; }
      combat.state = 'defeat';
      combat.log('모든 아군이 쓰러졌다 게임 오버.');
      refreshCombatUI();
      setTimeout(endBattle, 800);
    },
    dialog(sceneName) {
      const data = DIALOG_SCENES[sceneName];
      if (!data) { console.log('사용 가능: ' + Object.keys(DIALOG_SCENES).join(', ')); return; }
      showDialog(data, () => console.log(`[dialog:${sceneName}] 완료`));
    },
    reset() {
      localStorage.clear();
      console.log('localStorage 초기화 완료. 새로고침...');
      setTimeout(() => location.reload(), 500);
    },

    resultVictory() {
      const { showResult } = getState();
      showResult({
        state: 'victory', enemy: mockEnemy(),
        allies: [mockAlly(), mockAlly(), mockAlly()],
      });
    },
    resultEscaped() {
      const { showResult } = getState();
      showResult({
        state: 'escaped', enemy: mockEnemy(),
        allies: [mockAlly(), mockAlly(), mockAlly()],
      });
    },
    resultDefeat() {
      const { showResult } = getState();
      showResult({ state: 'defeat', enemy: mockEnemy(), allies: [] });
    },

    help() {
      console.log(`DEBUG 명령어:
  DEBUG.killTeam()        — 전투 중 패배 처리
  DEBUG.dialog(name)      — 대화 씬 재생
  DEBUG.reset()           — localStorage 초기화
  DEBUG.resultVictory()   — 승리 결과창
  DEBUG.resultEscaped()   — 도주 결과창
  DEBUG.resultDefeat()    — 전멸 결과창`);
    },
  };
}
