// ============================================================
// Action Panel — 3x3 그리드 (닌텐도 스위치 스타일 v2)
// ============================================================

import { W, H, S, lbl } from './theme.js';
import { monster } from './sprites.js';

const CAT = {
  stimulate: { label: '자극', icon: '💫', color: 0x00d4aa, dark: 0x009977 },
  capture:   { label: '포획', icon: '🤝', color: 0xff6b6b, dark: 0xcc4444 },
  defend:    { label: '수비', icon: '🛡️', color: 0x4dabf7, dark: 0x2b7fc4 },
};

let container, refs = {}, onAction = null, onConfirm = null;

export function initActionPanel(parentContainer, sharedRefs) {
  container = parentContainer;
  refs = sharedRefs;
  const pY = 340;
  const bg = new PIXI.Graphics();
  // 메인 다크 패널
  bg.roundRect(0, pY - 6, W, H - pY + 6, 0).fill({ color: 0x1a1a2e });
  // 상단 그라데이션 바
  bg.roundRect(0, pY - 6, W, 12, 0).fill({ color: 0x25253d });
  // 네온 액센트 라인 (JoyCon 느낌)
  bg.moveTo(0, pY - 6).lineTo(W, pY - 6).stroke({ color: 0x00d4aa, width: 2, alpha: 0.4 });
  container.addChild(bg);
  refs.actionContainer = new PIXI.Container();
  refs.actionContainer.y = pY + 4;
  container.addChild(refs.actionContainer);
}

export function setActionCallbacks({ action, confirm }) {
  onAction = action;
  onConfirm = confirm;
}

export function renderActions(team, cr) {
  refs.actionContainer.removeChildren();
  if (!team || team.length === 0) return;

  const cols = Math.min(team.length, 3);
  const colW = (W - 20) / cols;
  const cardH = 146, gap = 5, headH = 32, startX = 10;
  const pending = cr?.pendingSlots || [];
  const sel = cr?.selectedActions || {};
  const order = cr?.turnOrder || {};
  const allChosen = pending.length === 0 && Object.keys(sel).length > 0;

  for (let c = 0; c < cols; c++) {
    const ally = team[c];
    if (!ally) continue;
    const cx = startX + c * colW + c * 2;
    const chosen = sel[c];
    const hasChosen = chosen != null;
    const isPend = pending.includes(c);

    const pH = headH + 3 * (cardH + gap) + 4;
    const colBg = new PIXI.Graphics();
    // 열 배경 — 프로스티드 글래스
    colBg.roundRect(cx, 0, colW - 4, pH, 14)
      .fill({ color: isPend ? 0x2a2a42 : 0x222238 });
    // 선택 대기 시 미세 네온 테두리
    if (isPend) {
      colBg.roundRect(cx, 0, colW - 4, pH, 14)
        .stroke({ color: 0x00d4aa, width: 1, alpha: 0.35 });
    } else if (hasChosen) {
      colBg.roundRect(cx, 0, colW - 4, pH, 14)
        .stroke({ color: 0x4dabf7, width: 1, alpha: 0.25 });
    }
    refs.actionContainer.addChild(colBg);

    // 헤더 — 구분선 스타일
    const hd = new PIXI.Container(); hd.x = cx; hd.y = 0;
    // 몬스터 아이콘
    const pt = monster(20, ally.img); pt.x = 14; pt.y = 13;
    if (ally.hp <= 0) pt.alpha = 0.3;
    hd.addChild(pt);
    // 이름
    hd.addChild(Object.assign(lbl(ally.name, 6, isPend ? 0x00d4aa : 0x8888aa, true), { x: 26, y: 4 }));
    // 하단 구분선
    const sep = new PIXI.Graphics();
    sep.moveTo(6, headH - 2).lineTo(colW - 12, headH - 2)
      .stroke({ color: 0x444466, width: 0.5 });
    hd.addChild(sep);
    refs.actionContainer.addChild(hd);

    // 기절/알
    if (ally.hp <= 0 || ally.inEgg) {
      const fl = lbl(ally.inEgg ? '🥚' : '💤', 14, 0x555577, true);
      fl.anchor = { x: 0.5, y: 0.5 }; fl.x = cx + (colW - 4) / 2; fl.y = headH + cardH;
      refs.actionContainer.addChild(fl);
      continue;
    }

    ally.actions.forEach((action, row) => {
      const x = cx + 4, y = headH + row * (cardH + gap);
      const cW = colW - 12, rd = 10;
      const isChosen = hasChosen && chosen === row;
      const isLocked = hasChosen && !isChosen;

      // [확인] 버튼
      if (allChosen && !isChosen) {
        const btnCt = new PIXI.Container(); btnCt.x = x; btnCt.y = y;
        const btnBg = new PIXI.Graphics();
        btnBg.roundRect(0, 0, cW, cardH, rd).fill({ color: 0x00d4aa });
        btnBg.roundRect(0, 0, cW, cardH * 0.3, rd).fill({ color: 0xffffff, alpha: 0.1 });
        btnCt.addChild(btnBg);
        const bL = lbl('▶ 확인', 11, 0x1a1a2e, true);
        bL.anchor = { x: 0.5, y: 0.5 }; bL.x = cW / 2; bL.y = cardH / 2;
        btnCt.addChild(bL);
        btnCt.eventMode = 'static'; btnCt.cursor = 'pointer';
        btnCt.on('pointerdown', () => { if (onConfirm) onConfirm(); });
        refs.actionContainer.addChild(btnCt);
        return;
      }

      const ct = new PIXI.Container(); ct.x = x; ct.y = y;
      const cat = CAT[action.category] || CAT.stimulate;
      const a = isLocked ? 0.2 : 1;

      // 카드 배경
      const bg = new PIXI.Graphics();
      bg.roundRect(0, 0, cW, cardH, rd).fill({ color: isChosen ? 0x2e2e48 : 0x262640, alpha: a });
      // 좌측 타입 바
      bg.roundRect(0, 4, 3, cardH - 8, 1.5).fill({ color: cat.color, alpha: 0.7 * a });
      // 선택 시 테두리
      if (isChosen) {
        bg.roundRect(0, 0, cW, cardH, rd).stroke({ color: cat.color, width: 2 });
      }
      ct.addChild(bg);

      // 1줄: 아이콘 + 계열 + 수치
      const preview = cr?._previews?.[c]?.[row];
      let pwText = `${cat.icon} ${cat.label}`;
      if (preview) {
        if (preview.type === 'stimulate') pwText = `${cat.icon} ${cat.label} ${preview.taming}`;
        else if (preview.type === 'capture') pwText = `${cat.icon} ${cat.label} ${preview.chance}%`;
        else if (preview.type === 'defend') pwText = `${cat.icon} ${cat.label} +${preview.heal}`;
      }
      const pw = lbl(pwText, 6, cat.color, true);
      pw.x = 10; pw.y = 7; pw.alpha = a;
      ct.addChild(pw);

      // 순서 번호 — 미니 뱃지
      if (isChosen && order[c] != null) {
        const oB = new PIXI.Graphics();
        oB.roundRect(cW - 22, 5, 16, 16, 4).fill({ color: cat.color });
        ct.addChild(oB);
        const oL = lbl(String(order[c]), 6, 0x1a1a2e, true);
        oL.anchor = { x: 0.5, y: 0.5 }; oL.x = cW - 14; oL.y = 13;
        ct.addChild(oL);
      }

      // 2줄: 스킬 이름
      const nL = lbl(action.name, 9, 0xddddf0, true);
      nL.x = 10; nL.y = 26; nL.alpha = a;
      ct.addChild(nL);

      // 구분선
      const cardSep = new PIXI.Graphics();
      cardSep.moveTo(10, 46).lineTo(cW - 10, 46)
        .stroke({ color: 0x444466, width: 0.5, alpha: a });
      ct.addChild(cardSep);

      // 설명
      const descH = cardH - 52;
      const maxCPL = Math.floor(cW / (7 * S));
      const lines = Math.ceil(action.log.length / maxCPL);
      let dSz = 7;
      if (lines * 11 * S > descH * S) dSz = 6;

      const dText = new PIXI.Text({ text: action.log, style: {
        fontFamily: '"M PLUS Rounded 1c", "Noto Sans KR", sans-serif',
        fontSize: dSz * S, fill: '#8888aa', fontWeight: '400',
        wordWrap: true, wordWrapWidth: cW - 18,
        lineHeight: (dSz + 2) * S,
      }});
      dText.x = 10; dText.y = 52; dText.alpha = a;
      ct.addChild(dText);

      // Click
      if (!isLocked || isChosen) {
        ct.eventMode = 'static'; ct.cursor = 'pointer';
        ct.on('pointerdown', () => { if (onAction) onAction(c, row); });
      }

      refs.actionContainer.addChild(ct);
    });
  }
}
