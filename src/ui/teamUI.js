// ============================================================
// Title, Result, Team, Devolution, GameOver Screens — Pixi
// ============================================================

import { W, H, C, lbl, softPanel, cuteBar, cuteBtn, star, addSparkles } from './theme.js';
import { monster, egg, allyImg, allyColor } from './sprites.js';
import { playDevolutionEffect } from '../effects.js';

// ============================================================
// TITLE SCREEN
// ============================================================

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
  desc1.anchor = { x: 0.5, y: 0.5 }; desc1.x = W / 2; desc1.y = 410; ct.addChild(desc1);
  const desc2 = lbl('팀에 합류시키세요.', 10, C.dim);
  desc2.anchor = { x: 0.5, y: 0.5 }; desc2.x = W / 2; desc2.y = 430; ct.addChild(desc2);
  const desc3 = lbl('몬스터는 더 귀여운 모습으로 퇴화합니다.', 9, C.dimmer);
  desc3.anchor = { x: 0.5, y: 0.5 }; desc3.x = W / 2; desc3.y = 460; ct.addChild(desc3);

  // Start button — stored for external event binding
  ct._startBtn = cuteBtn(W / 2 - 80, 520, 160, 48, '탐험 시작', C.pink, 0xffffff);
  ct.addChild(ct._startBtn);

  return ct;
}

// ============================================================
// RESULT SCREEN
// ============================================================

let resultContainer;
let resultRefs = {};

export function initResult() {
  resultContainer = new PIXI.Container();
  resultContainer.addChild(new PIXI.Graphics().rect(0, 0, W, H).fill({ color: C.bgAlt }));
  addSparkles(resultContainer, 8, W, H);

  resultRefs.title = lbl('', 16, C.pink, true);
  resultRefs.title.anchor = { x: 0.5, y: 0.5 }; resultRefs.title.x = W / 2; resultRefs.title.y = 80;
  resultContainer.addChild(resultRefs.title);

  resultRefs.desc = lbl('', 10, C.dim);
  resultRefs.desc.anchor = { x: 0.5, y: 0.5 }; resultRefs.desc.x = W / 2; resultRefs.desc.y = 110;
  resultContainer.addChild(resultRefs.desc);

  resultRefs.body = new PIXI.Container();
  resultRefs.body.y = 140;
  resultContainer.addChild(resultRefs.body);

  resultRefs.nextBtn = cuteBtn(W / 2 - 80, 620, 160, 42, '계속', C.taming, 0xffffff);
  resultContainer.addChild(resultRefs.nextBtn);

  return resultContainer;
}

export function renderResult(state, enemy, xpLogs, devoLogs, onNext) {
  resultRefs.body.removeChildren();
  const enemyName = enemy.name || enemy;
  const enemyImg = enemy.img || null;

  if (state === 'victory') {
    resultRefs.title.text = '순화 성공!';
    resultRefs.title.style.fill = '#ff88aa';
    resultRefs.desc.text = enemyName + '을(를) 길들였다!';

    const cm = monster(120, enemyImg);
    cm.x = W / 2; cm.y = 60;
    resultRefs.body.addChild(cm);

    // Hearts
    for (let i = 0; i < 3; i++) {
      const h = lbl('♥', 14, C.pinkLight);
      h.anchor = { x: 0.5, y: 0.5 };
      h.x = W / 2 + Math.cos(i * Math.PI * 2 / 3) * 55;
      h.y = 60 + Math.sin(i * Math.PI * 2 / 3) * 35;
      h.alpha = 0.5;
      resultRefs.body.addChild(h);
    }
  } else if (state === 'escaped') {
    resultRefs.title.text = '도주...';
    resultRefs.title.style.fill = '#ffaa60';
    resultRefs.desc.text = enemyName + '이(가) 도망쳤습니다.';
  } else if (state === 'defeat') {
    resultRefs.title.text = '전멸';
    resultRefs.title.style.fill = '#ff6070';
    resultRefs.desc.text = '모든 아군이 쓰러졌습니다.';
  }

  // XP/Devo logs
  const logPanel = new PIXI.Container(); logPanel.y = 140;
  logPanel.addChild(softPanel(20, 0, W - 40, Math.max(60, (xpLogs.length + devoLogs.length) * 22 + 30), C.white, C.pinkLight));
  logPanel.addChild(Object.assign(lbl('결과', 10, C.pink, true), { x: 36, y: 8 }));

  [...xpLogs, ...devoLogs].forEach((log, i) => {
    const isDevo = log.includes('알 상태');
    const t = lbl(log, 9, isDevo ? C.orange : C.text);
    t.x = 36; t.y = 28 + i * 22;
    logPanel.addChild(t);
  });
  resultRefs.body.addChild(logPanel);

  // Button
  resultRefs.nextBtn.removeAllListeners();
  if (onNext) resultRefs.nextBtn.on('pointerdown', onNext);
}

// ============================================================
// TEAM SCREEN
// ============================================================

let teamContainer;
let teamRefs = {};

export function initTeam() {
  teamContainer = new PIXI.Container();
  teamContainer.addChild(new PIXI.Graphics().rect(0, 0, W, H).fill({ color: C.bgAlt }));

  // Header
  teamContainer.addChild(new PIXI.Graphics().roundRect(0, 0, W, 44, 0).fill({ color: C.pink }));
  teamContainer.addChild(new PIXI.Graphics().roundRect(10, 38, W - 20, 14, 7).fill({ color: C.pink }));
  const ht = lbl('내 팀', 12, 0xffffff, true);
  ht.anchor = { x: 0.5, y: 0.5 }; ht.x = W / 2; ht.y = 22;
  teamContainer.addChild(ht);

  teamRefs.body = new PIXI.Container(); teamRefs.body.y = 60;
  teamContainer.addChild(teamRefs.body);

  teamRefs.nextBtn = cuteBtn(W / 2 - 90, 680, 180, 44, '다음 전투 >', C.mint, 0xffffff);
  teamContainer.addChild(teamRefs.nextBtn);

  teamRefs.healMsg = lbl('', 9, C.mint, true);
  teamRefs.healMsg.anchor = { x: 0.5, y: 0.5 }; teamRefs.healMsg.x = W / 2; teamRefs.healMsg.y = 740;
  teamContainer.addChild(teamRefs.healMsg);

  return teamContainer;
}

export function renderTeamCards(allies, collection, getEggProgress, onNextBattle) {
  teamRefs.body.removeChildren();

  allies.forEach((ally, i) => {
    const y = i * 115;
    const card = new PIXI.Container(); card.y = y;
    card.addChild(softPanel(10, 0, W - 20, 105, C.white, ally.inEgg ? C.orange : C.pinkLight));

    if (ally.inEgg) {
      const e = egg(44, allyColor(ally.id)); e.x = 52; e.y = 50; card.addChild(e);
      // Timer
      const progress = getEggProgress ? getEggProgress(ally.id) : 0;
      card.addChild(new PIXI.Graphics().roundRect(26, 78, 52, 18, 9).fill({ color: C.yellow }));
      const timerText = lbl(progress != null ? Math.round(progress) + '%' : '...', 8, C.text);
      timerText.x = 36; timerText.y = 80;
      card.addChild(timerText);
      card._eggTimer = timerText;
      card._allyId = ally.id;
    } else {
      const s = monster(70, ally.img);
      s.x = 52; s.y = 46; card.addChild(s);
    }

    card.addChild(Object.assign(lbl(ally.name, 12, C.text, true), { x: 90, y: 10 }));
    card.addChild(Object.assign(lbl('Lv.' + (ally.level || 1), 9, C.dim), { x: 90, y: 28 }));

    if (ally.inEgg) {
      card.addChild(new PIXI.Graphics().roundRect(90, 44, 52, 20, 10).fill({ color: C.yellowLight }));
      card.addChild(Object.assign(lbl('EGG', 9, C.orange, true), { x: 102, y: 47 }));
      card.addChild(Object.assign(lbl('퇴화 중...', 8, C.orange), { x: 90, y: 70 }));
    } else {
      card.addChild(Object.assign(lbl('HP', 8, C.hp), { x: 90, y: 46 }));
      card.addChild(cuteBar(116, 48, 150, 10, ally.hp / ally.maxHp, C.hp));
      card.addChild(Object.assign(lbl(ally.hp + '/' + ally.maxHp, 8, C.dim), { x: 270, y: 46 }));
      card.addChild(Object.assign(lbl(ally.hp > 0 ? 'READY' : 'FAINTED', 8, ally.hp > 0 ? C.mint : C.hpLow, true), { x: 90, y: 68 }));
    }

    // XP bar
    card.addChild(Object.assign(lbl('XP', 8, C.yellow), { x: 90, y: 86 }));
    card.addChild(cuteBar(116, 88, 150, 8, ally.xp / ally.xpThreshold, C.yellow));
    if (ally.xp >= ally.xpThreshold) {
      card.addChild(Object.assign(lbl('MAX!', 8, C.orange, true), { x: 272, y: 86 }));
      card.addChild(star(298, 92, 5, C.yellow));
    }

    teamRefs.body.addChild(card);
  });

  // Collection
  const collY = allies.length * 115 + 10;
  teamRefs.body.addChild(Object.assign(lbl('도감', 10, C.pink, true), { x: 20, y: collY }));
  if (collection.length === 0) {
    teamRefs.body.addChild(Object.assign(lbl('아직 수집한 몬스터가 없습니다.', 8, C.dimmer), { x: 20, y: collY + 20 }));
  } else {
    collection.forEach((c, i) => {
      teamRefs.body.addChild(Object.assign(lbl(c.name + ' - ' + c.desc, 8, C.dim), { x: 20, y: collY + 20 + i * 18 }));
    });
  }

  teamRefs.healMsg.text = '팀 HP 자동 회복 완료';

  // Button
  teamRefs.nextBtn.removeAllListeners();
  if (onNextBattle) teamRefs.nextBtn.on('pointerdown', onNextBattle);
}

export function updateEggProgress(allies, getEggProgress) {
  if (!teamRefs.body) return;
  teamRefs.body.children.forEach(card => {
    if (card._eggTimer && card._allyId) {
      const progress = getEggProgress(card._allyId);
      if (progress != null) card._eggTimer.text = Math.round(progress) + '%';
    }
  });
}

// ============================================================
// DEVOLUTION REVEAL SCREEN
// ============================================================

let devoContainer;
let devoRefs = {};

export function initDevo() {
  devoContainer = new PIXI.Container();
  devoContainer.addChild(new PIXI.Graphics().rect(0, 0, W, H).fill({ color: C.yellowLight }));

  devoRefs.sparkles = addSparkles(devoContainer, 15, W, H);

  // Border
  devoContainer.addChild(new PIXI.Graphics().rect(0, 0, W, H).stroke({ color: C.yellow, width: 6 }));

  devoRefs.title = lbl('퇴화 완료!', 18, C.orange, true);
  devoRefs.title.anchor = { x: 0.5, y: 0.5 }; devoRefs.title.x = W / 2; devoRefs.title.y = 80;
  devoContainer.addChild(devoRefs.title);

  [-60, -30, 30, 60].forEach(ox => {
    devoContainer.addChild(star(W / 2 + ox, 55, 7, C.yellow));
  });

  devoRefs.body = new PIXI.Container(); devoRefs.body.y = 110;
  devoContainer.addChild(devoRefs.body);

  devoRefs.okBtn = cuteBtn(W / 2 - 70, 560, 140, 40, '확인', C.pink, 0xffffff);
  devoContainer.addChild(devoRefs.okBtn);

  return devoContainer;
}

export function renderDevoReveal(ally, onOk) {
  devoRefs.body.removeChildren();

  const desc = lbl(ally.name + '이(가) 새로운 형태로!', 10, C.dim);
  desc.anchor = { x: 0.5, y: 0.5 }; desc.x = W / 2; desc.y = 10;
  devoRefs.body.addChild(desc);

  // Before -> After panel
  devoRefs.body.addChild(softPanel(30, 40, W - 60, 160, C.white, C.orange));

  devoRefs.body.addChild(Object.assign(lbl('BEFORE', 8, C.dim), { x: W / 2 - 100, y: 55 }));
  const beforeImg = ally._oldImg || allyImg(ally.id);
  const bm = monster(80, beforeImg);
  bm.x = W / 2 - 80; bm.y = 125; bm.alpha = 0.3;
  devoRefs.body.addChild(bm);

  // Sparkle arrow
  const arrowC = new PIXI.Container(); arrowC.x = W / 2; arrowC.y = 120;
  arrowC.addChild(star(0, 0, 12, C.yellow));
  arrowC.addChild(star(-14, -8, 5, C.pinkLight));
  arrowC.addChild(star(14, 8, 5, C.mintLight));
  devoRefs.body.addChild(arrowC);
  devoRefs.arrowC = arrowC;

  devoRefs.body.addChild(Object.assign(lbl('AFTER', 8, C.orange, true), { x: W / 2 + 50, y: 55 }));
  const am = monster(80, ally.img);
  am.x = W / 2 + 80; am.y = 125;
  devoRefs.body.addChild(am);

  // New name
  devoRefs.body.addChild(softPanel(60, 220, W - 120, 56, C.white, C.orange));
  const nn = lbl(ally.name, 14, C.text, true);
  nn.anchor = { x: 0.5, y: 0.5 }; nn.x = W / 2; nn.y = 240;
  devoRefs.body.addChild(nn);
  const nd = lbl(ally.desc, 9, C.dim);
  nd.anchor = { x: 0.5, y: 0.5 }; nd.x = W / 2; nd.y = 262;
  devoRefs.body.addChild(nd);

  // Stat info
  devoRefs.body.addChild(softPanel(40, 296, W - 80, 80, C.white, C.pinkLight));
  devoRefs.body.addChild(Object.assign(lbl('능력치 변화', 9, C.pink, true), { x: 58, y: 306 }));
  devoRefs.body.addChild(Object.assign(lbl('첫 번째 행동의 순화력이 강화되었습니다!', 8, C.dim), { x: 58, y: 330 }));
  if (ally.actions && ally.actions[0]) {
    devoRefs.body.addChild(Object.assign(lbl(ally.actions[0].name + ': 순화력 +3', 9, C.mint, true), { x: 58, y: 350 }));
  }

  setTimeout(() => playDevolutionEffect(), 300);

  devoRefs.okBtn.removeAllListeners();
  if (onOk) devoRefs.okBtn.on('pointerdown', onOk);
}

// ============================================================
// GAME OVER SCREEN
// ============================================================

let goContainer;
let goRefs = {};

export function initGameOver() {
  goContainer = new PIXI.Container();
  goContainer.addChild(new PIXI.Graphics().rect(0, 0, W, H).fill({ color: 0xf0e0e8 }));

  // Sad cloud
  const sc = new PIXI.Graphics();
  sc.circle(W / 2, 90, 40).fill({ color: 0xeeddee });
  sc.circle(W / 2 - 30, 95, 25).fill({ color: 0xeeddee });
  sc.circle(W / 2 + 28, 97, 22).fill({ color: 0xeeddee });
  goContainer.addChild(sc);

  goRefs.title = lbl('탐험 종료', 18, C.pinkDark, true);
  goRefs.title.anchor = { x: 0.5, y: 0.5 }; goRefs.title.x = W / 2; goRefs.title.y = 160;
  goContainer.addChild(goRefs.title);

  const sub = lbl('모든 아군이 쓰러졌습니다.', 9, C.dim);
  sub.anchor = { x: 0.5, y: 0.5 }; sub.x = W / 2; sub.y = 190;
  goContainer.addChild(sub);

  // Fainted monsters
  ['water', 'fire', 'grass'].forEach((id, i) => {
    const s = monster(50, allyImg(id));
    s.x = W / 2 - 60 + i * 60; s.y = 240; s.alpha = 0.25;
    s.rotation = [0.3, -0.2, 0.25][i];
    goContainer.addChild(s);
  });

  goRefs.statsBody = new PIXI.Container(); goRefs.statsBody.y = 290;
  goContainer.addChild(goRefs.statsBody);

  goRefs.retryBtn = cuteBtn(W / 2 - 80, 530, 160, 44, '다시 시작', C.pinkDark, 0xffffff);
  goContainer.addChild(goRefs.retryBtn);

  return goContainer;
}

export function renderGameOver(battleCount, capturedCount, onRestart) {
  goRefs.statsBody.removeChildren();
  goRefs.statsBody.addChild(softPanel(40, 0, W - 80, 160, C.white, C.pinkLight));
  goRefs.statsBody.addChild(Object.assign(lbl('탐험 기록', 10, C.pink, true), { x: W / 2 - 32, y: 14 }));

  const stats = [
    { l: '총 전투', v: battleCount + '회' },
    { l: '포획 몬스터', v: capturedCount + '마리' },
  ];
  stats.forEach((s, i) => {
    const y = 44 + i * 32;
    goRefs.statsBody.addChild(Object.assign(lbl(s.l, 10, C.dim), { x: 64, y }));
    goRefs.statsBody.addChild(Object.assign(lbl(s.v, 12, C.text, true), { x: W - 130, y }));
  });

  goRefs.retryBtn.removeAllListeners();
  if (onRestart) goRefs.retryBtn.on('pointerdown', onRestart);
}

// ---- Devo Tick (for sparkle animation) ----
export function tickDevo(tick) {
  if (devoRefs.sparkles) {
    devoRefs.sparkles.forEach(s => {
      s.g.alpha = 0.15 + Math.sin(tick * s.speed * 5 + s.phase) * 0.2;
    });
  }
  if (devoRefs.arrowC) {
    devoRefs.arrowC.rotation = Math.sin(tick * 2) * 0.1;
  }
}
