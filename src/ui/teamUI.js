// ============================================================
// Team, Devolution, GameOver Screens — Pixi
// (Result screen moved to resultUI.js)
// ============================================================

import { W, H, C, lbl, softPanel, cuteBar, cuteBtn, star, addSparkles } from './theme.js';
import { monster, egg, allyImg, allyColor } from './sprites.js';
import { playDevolutionEffect } from '../effects.js';

// ============================================================
// TEAM SCREEN
// ============================================================

let teamContainer;
let teamRefs = {};

export function initTeam() {
  teamContainer = new PIXI.Container();
  teamContainer.addChild(new PIXI.Graphics().rect(0, 0, W, H).fill({ color: C.bgAlt }));

  // Header
  teamContainer.addChild(new PIXI.Graphics().roundRect(0, 0, W, 60, 0).fill({ color: C.pink }));
  teamContainer.addChild(new PIXI.Graphics().roundRect(10, 52, W - 20, 14, 7).fill({ color: C.pink }));
  const ht = lbl('내 팀', 12, 0xffffff, true);
  ht.anchor = { x: 0.5, y: 0.5 }; ht.x = W / 2; ht.y = 30;
  teamContainer.addChild(ht);

  teamRefs.body = new PIXI.Container(); teamRefs.body.y = 74;
  teamContainer.addChild(teamRefs.body);

  teamRefs.nextBtn = cuteBtn(W / 2 - 180, 720, 180, 44, '다음 전투 >', C.mint, 0xffffff);
  teamContainer.addChild(teamRefs.nextBtn);

  teamRefs.healMsg = lbl('', 9, C.mint, true);
  teamRefs.healMsg.anchor = { x: 0.5, y: 0.5 }; teamRefs.healMsg.x = W / 2; teamRefs.healMsg.y = 810;
  teamContainer.addChild(teamRefs.healMsg);

  return teamContainer;
}

export function renderTeamCards(allies, collection, getEggProgress, onNextBattle) {
  teamRefs.body.removeChildren();

  allies.forEach((ally, i) => {
    const y = i * 180;
    const card = new PIXI.Container(); card.y = y;
    card.addChild(softPanel(10, 0, W - 20, 170, C.white, ally.inEgg ? C.orange : C.pinkLight));

    if (ally.inEgg) {
      const e = egg(44, allyColor(ally.id)); e.x = 52; e.y = 60; card.addChild(e);
      // Timer
      const progress = getEggProgress ? getEggProgress(ally.id) : 0;
      card.addChild(new PIXI.Graphics().roundRect(26, 98, 52, 26, 13).fill({ color: C.yellow }));
      const timerText = lbl(progress != null ? Math.round(progress) + '%' : '...', 8, C.text);
      timerText.x = 32; timerText.y = 100;
      card.addChild(timerText);
      card._eggTimer = timerText;
      card._allyId = ally.id;
    } else {
      const s = monster(70, ally.img);
      s.x = 52; s.y = 56; card.addChild(s);
    }

    card.addChild(Object.assign(lbl(ally.name, 12, C.text, true), { x: 100, y: 10 }));
    card.addChild(Object.assign(lbl('레벨' + (ally.level || 1), 9, C.dim), { x: 100, y: 40 }));

    if (ally.inEgg) {
      card.addChild(new PIXI.Graphics().roundRect(100, 68, 70, 28, 14).fill({ color: C.yellowLight }));
      card.addChild(Object.assign(lbl('알', 9, C.orange, true), { x: 112, y: 72 }));
      card.addChild(Object.assign(lbl('퇴화 중...', 8, C.orange), { x: 100, y: 104 }));
    } else {
      card.addChild(Object.assign(lbl('체력', 8, C.hp), { x: 100, y: 72 }));
      card.addChild(cuteBar(140, 76, 180, 14, ally.hp / ally.maxHp, C.hp));
      card.addChild(Object.assign(lbl(ally.hp + '/' + ally.maxHp, 8, C.dim), { x: 330, y: 72 }));
      card.addChild(Object.assign(lbl(ally.hp > 0 ? '준비' : '기절', 8, ally.hp > 0 ? C.mint : C.hpLow, true), { x: 100, y: 100 }));
    }

    // XP bar
    card.addChild(Object.assign(lbl('경험치', 8, C.yellow), { x: 100, y: 132 }));
    card.addChild(cuteBar(140, 136, 180, 12, ally.xp / ally.xpThreshold, C.yellow));
    if (ally.xp >= ally.xpThreshold) {
      card.addChild(Object.assign(lbl('최대!', 8, C.orange, true), { x: 330, y: 132 }));
      card.addChild(star(370, 140, 5, C.yellow));
    }

    teamRefs.body.addChild(card);
  });

  // Collection
  const collY = allies.length * 180 + 10;
  teamRefs.body.addChild(Object.assign(lbl('도감', 10, C.pink, true), { x: 20, y: collY }));
  if (collection.length === 0) {
    teamRefs.body.addChild(Object.assign(lbl('아직 수집한 몬스터가 없습니다.', 8, C.dimmer), { x: 20, y: collY + 30 }));
  } else {
    collection.forEach((c, i) => {
      teamRefs.body.addChild(Object.assign(lbl(c.name + ' - ' + c.desc, 8, C.dim), { x: 20, y: collY + 30 + i * 30 }));
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
    devoContainer.addChild(star(W / 2 + ox, 45, 7, C.yellow));
  });

  devoRefs.body = new PIXI.Container(); devoRefs.body.y = 120;
  devoContainer.addChild(devoRefs.body);

  devoRefs.okBtn = cuteBtn(W / 2 - 140, 620, 140, 40, '확인', C.pink, 0xffffff);
  devoContainer.addChild(devoRefs.okBtn);

  return devoContainer;
}

export function renderDevoReveal(ally, onOk) {
  devoRefs.body.removeChildren();

  const desc = lbl(ally.name + '이(가) 새로운 형태로!', 10, C.dim);
  desc.anchor = { x: 0.5, y: 0.5 }; desc.x = W / 2; desc.y = 10;
  devoRefs.body.addChild(desc);

  // Before -> After panel
  devoRefs.body.addChild(softPanel(20, 40, W - 40, 180, C.white, C.orange));

  devoRefs.body.addChild(Object.assign(lbl('이전', 8, C.dim), { x: W / 2 - 110, y: 55 }));
  const beforeImg = ally._oldImg || allyImg(ally.id);
  const bm = monster(80, beforeImg);
  bm.x = W / 2 - 80; bm.y = 140; bm.alpha = 0.3;
  devoRefs.body.addChild(bm);

  // Sparkle arrow
  const arrowC = new PIXI.Container(); arrowC.x = W / 2; arrowC.y = 135;
  arrowC.addChild(star(0, 0, 12, C.yellow));
  arrowC.addChild(star(-14, -8, 5, C.pinkLight));
  arrowC.addChild(star(14, 8, 5, C.mintLight));
  devoRefs.body.addChild(arrowC);
  devoRefs.arrowC = arrowC;

  devoRefs.body.addChild(Object.assign(lbl('이후', 8, C.orange, true), { x: W / 2 + 40, y: 55 }));
  const am = monster(80, ally.img);
  am.x = W / 2 + 80; am.y = 140;
  devoRefs.body.addChild(am);

  // New name
  devoRefs.body.addChild(softPanel(40, 240, W - 80, 80, C.white, C.orange));
  const nn = lbl(ally.name, 14, C.text, true);
  nn.anchor = { x: 0.5, y: 0.5 }; nn.x = W / 2; nn.y = 265;
  devoRefs.body.addChild(nn);
  const nd = lbl(ally.desc, 9, C.dim);
  nd.anchor = { x: 0.5, y: 0.5 }; nd.x = W / 2; nd.y = 298;
  devoRefs.body.addChild(nd);

  // Stat info
  devoRefs.body.addChild(softPanel(30, 340, W - 60, 110, C.white, C.pinkLight));
  devoRefs.body.addChild(Object.assign(lbl('능력치 변화', 9, C.pink, true), { x: 50, y: 352 }));
  devoRefs.body.addChild(Object.assign(lbl('첫 번째 행동의 순화력이 강화되었습니다!', 8, C.dim), { x: 50, y: 385 }));
  if (ally.actions && ally.actions[0]) {
    devoRefs.body.addChild(Object.assign(lbl(ally.actions[0].name + ': 순화력 +3', 9, C.mint, true), { x: 50, y: 415 }));
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
  sub.anchor = { x: 0.5, y: 0.5 }; sub.x = W / 2; sub.y = 200;
  goContainer.addChild(sub);

  // Fainted monsters
  ['water', 'fire', 'grass'].forEach((id, i) => {
    const s = monster(50, allyImg(id));
    s.x = W / 2 - 60 + i * 60; s.y = 240; s.alpha = 0.25;
    s.rotation = [0.3, -0.2, 0.25][i];
    goContainer.addChild(s);
  });

  goRefs.statsBody = new PIXI.Container(); goRefs.statsBody.y = 300;
  goContainer.addChild(goRefs.statsBody);

  goRefs.retryBtn = cuteBtn(W / 2 - 160, 580, 160, 44, '다시 시작', C.pinkDark, 0xffffff);
  goContainer.addChild(goRefs.retryBtn);

  return goContainer;
}

export function renderGameOver(battleCount, capturedCount, onRestart) {
  goRefs.statsBody.removeChildren();
  goRefs.statsBody.addChild(softPanel(30, 0, W - 60, 200, C.white, C.pinkLight));
  goRefs.statsBody.addChild(Object.assign(lbl('탐험 기록', 10, C.pink, true), { x: W / 2 - 50, y: 14 }));

  const stats = [
    { l: '총 전투', v: battleCount + '회' },
    { l: '포획 몬스터', v: capturedCount + '마리' },
  ];
  stats.forEach((s, i) => {
    const y = 56 + i * 52;
    goRefs.statsBody.addChild(Object.assign(lbl(s.l, 10, C.dim), { x: 54, y }));
    goRefs.statsBody.addChild(Object.assign(lbl(s.v, 12, C.text, true), { x: W - 160, y }));
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
