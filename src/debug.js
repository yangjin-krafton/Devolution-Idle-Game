// ============================================================
// Debug Console Commands — DEBUG.killTeam(), DEBUG.dialog() etc.
// ============================================================

import { showDialog } from './ui/dialogUI.js';
import { DIALOG_SCENES } from './data/dialogs/index.js';

export function initDebug(getState) {
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
  };
}
