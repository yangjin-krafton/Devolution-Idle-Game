// ============================================================
// Title Screen — Pixi
// ============================================================

import { W, H, C, lbl, cuteBtn, star, addSparkles } from './theme.js';
import { monster, allyImg } from './sprites.js';

export function initTitle() {
  const ct = new PIXI.Container();
  ct.addChild(new PIXI.Graphics().rect(0, 0, W, H).fill({ color: C.bgAlt }));

  addSparkles(ct, 12, W, H);

  const title = lbl('Devolution', 28, C.pinkDark, true);
  title.anchor = { x: 0.5, y: 0.5 }; title.x = W / 2; title.y = 240;
  ct.addChild(title);

  // Decorative monsters
  const m1 = monster(70, allyImg('water')); m1.x = W / 2 - 80; m1.y = 340; ct.addChild(m1);
  const m2 = monster(65, allyImg('fire')); m2.x = W / 2; m2.y = 330; ct.addChild(m2);
  const m3 = monster(68, allyImg('grass')); m3.x = W / 2 + 80; m3.y = 340; ct.addChild(m3);

  ct.addChild(star(W / 2 - 50, 200, 8, C.yellow));
  ct.addChild(star(W / 2 + 50, 210, 6, C.pinkLight));
  ct.addChild(star(W / 2, 190, 10, C.yellow));

  const desc1 = lbl('야생 몬스터를 순화와 교감으로', 10, C.dim);
  desc1.anchor = { x: 0.5, y: 0.5 }; desc1.x = W / 2; desc1.y = 420; ct.addChild(desc1);
  const desc2 = lbl('팀에 합류시키세요.', 10, C.dim);
  desc2.anchor = { x: 0.5, y: 0.5 }; desc2.x = W / 2; desc2.y = 455; ct.addChild(desc2);
  const desc3 = lbl('몬스터는 더 귀여운 모습으로 퇴화합니다.', 9, C.dimmer);
  desc3.anchor = { x: 0.5, y: 0.5 }; desc3.x = W / 2; desc3.y = 490; ct.addChild(desc3);

  // Start button — stored for external event binding
  ct._startBtn = cuteBtn(W / 2 - 160, 540, 160, 48, '탐험 시작', C.pink, 0xffffff);
  ct.addChild(ct._startBtn);

  return ct;
}
