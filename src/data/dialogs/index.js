// ============================================================
// Dialog Scenes Index — 씬 파일 자동 집계
// ============================================================
// 새 씬 추가: 1) dialogs/씬이름.js 파일 생성  2) 아래 import + SCENES에 추가

import encounter from './encounter.js';
import defeat from './defeat.js';
import devo from './devo.js';
import challenger from './challenger.js';
import tutorial from './tutorial.js';
import first_battle from './first_battle.js';

export const DIALOG_SCENES = {
  encounter,
  defeat,
  devo,
  challenger,
  tutorial,
  first_battle,
};
