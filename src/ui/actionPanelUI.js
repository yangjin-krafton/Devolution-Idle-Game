// ============================================================
// Action Panel — 3x3 그리드 (3마리 × 3스킬 동시 선택)
// ============================================================

import { W, H, C, S, lbl, cuteBar } from './theme.js';
import { monster } from './sprites.js';

const CAT = {
  stimulate: { label: '자극', color: C.taming,  dark: 0x5588cc, light: 0xeef4ff },
  capture:   { label: '포획', color: C.orange,  dark: 0xcc7733, light: 0xfff4e8 },
  defend:    { label: '수비', color: C.water,   dark: 0x5599aa, light: 0xeef8ff },
};

let container, refs = {}, onAction = null, onConfirm = null;

export function initActionPanel(parentContainer, sharedRefs) {
  container = parentContainer;
  refs = sharedRefs;
  const panelY = 340;
  // 패널 배경 — 그라데이션 느낌 + 상단 라운드
  const panelBg = new PIXI.Graphics();
  panelBg.roundRect(0, panelY, W, H - panelY, 28).fill({ color: 0xf0e8ee });
  panelBg.roundRect(0, panelY, W, 8, 28).fill({ color: C.pinkLight, alpha: 0.4 });
  panelBg.moveTo(0, panelY + 4).lineTo(W, panelY + 4)
    .stroke({ color: C.border, width: 1.5, alpha: 0.5 });
  container.addChild(panelBg);
  refs.actionContainer = new PIXI.Container();
  refs.actionContainer.y = panelY + 10;
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
  const colW = (W - 8) / cols;
  const cardH = 156, gap = 3, headH = 26, startX = 4;
  const pending = cr?.pendingSlots || [];
  const sel = cr?.selectedActions || {};
  const order = cr?.turnOrder || {};
  const allChosen = pending.length === 0 && Object.keys(sel).length > 0;

  for (let c = 0; c < cols; c++) {
    const ally = team[c];
    if (!ally) continue;
    const cx = startX + c * colW;
    const chosen = sel[c];
    const hasChosen = chosen != null;
    const isPend = pending.includes(c);

    // Column panel — 둥근 카드 묶음
    const pH = headH + 3 * (cardH + gap) + 8;
    const colBg = new PIXI.Graphics();
    // 그림자
    colBg.roundRect(cx + 1, 2, colW - 3, pH, 18).fill({ color: 0x000000, alpha: 0.05 });
    // 배경
    colBg.roundRect(cx, 0, colW - 2, pH, 18).fill({ color: isPend ? 0xfff8fa : 0xffffff });
    // 테두리
    const bCol = isPend ? C.pink : (hasChosen ? C.mint : C.border);
    colBg.roundRect(cx, 0, colW - 2, pH, 18)
      .stroke({ color: bCol, width: isPend ? 2.5 : 1.5 });
    // 상단 헤더 배경
    colBg.roundRect(cx + 1, 1, colW - 4, headH, 17)
      .fill({ color: isPend ? C.pinkLight : 0xf8f0f4, alpha: 0.7 });
    refs.actionContainer.addChild(colBg);

    // Header: portrait + name + HP
    const hd = new PIXI.Container(); hd.x = cx; hd.y = 0;
    const portrait = monster(22, ally.img); portrait.x = 13; portrait.y = 10;
    if (ally.hp <= 0) portrait.alpha = 0.3;
    hd.addChild(portrait);
    const nameL = lbl(ally.name, 6, isPend ? C.pink : C.text, true);
    nameL.x = 26; nameL.y = 3;
    hd.addChild(nameL);
    const hpR = ally.hp / ally.maxHp;
    hd.addChild(cuteBar(26, 16, colW - 40, 5, hpR, hpR > 0.3 ? C.hp : C.hpLow));
    refs.actionContainer.addChild(hd);

    if (ally.hp <= 0 || ally.inEgg) {
      const fl = lbl(ally.inEgg ? '알' : '기절', 8, C.dimmer, true);
      fl.anchor = { x: 0.5, y: 0.5 }; fl.x = cx + colW / 2; fl.y = headH + cardH;
      refs.actionContainer.addChild(fl);
      continue;
    }

    ally.actions.forEach((action, row) => {
      const x = cx + 3, y = headH + row * (cardH + gap);
      const cW = colW - 8, rd = 14;
      const isChosen = hasChosen && chosen === row;
      const isLocked = hasChosen && !isChosen;

      // 모든 선택 완료 + 이 카드가 선택 안 된 곳 → 카드 크기 [확인] 버튼
      if (allChosen && !isChosen) {
        const btnCt = new PIXI.Container(); btnCt.x = x; btnCt.y = y;
        const btnBg = new PIXI.Graphics();
        btnBg.roundRect(1, 2, cW, cardH, rd).fill({ color: 0x000000, alpha: 0.06 });
        btnBg.roundRect(0, 0, cW, cardH, rd).fill({ color: C.pink });
        btnBg.roundRect(0, 0, cW, cardH * 0.35, rd).fill({ color: 0xffffff, alpha: 0.2 });
        btnBg.roundRect(2, 2, cW - 4, cardH - 4, rd - 1)
          .stroke({ color: 0xffffff, width: 1.5, alpha: 0.3 });
        btnCt.addChild(btnBg);
        const btnLbl = lbl('확인', 12, 0xffffff, true);
        btnLbl.anchor = { x: 0.5, y: 0.5 };
        btnLbl.x = cW / 2; btnLbl.y = cardH / 2;
        btnCt.addChild(btnLbl);
        btnCt.eventMode = 'static'; btnCt.cursor = 'pointer';
        btnCt.on('pointerdown', () => { if (onConfirm) onConfirm(); });
        refs.actionContainer.addChild(btnCt);
        return;
      }

      const ct = new PIXI.Container(); ct.x = x; ct.y = y;
      const cat = CAT[action.category] || CAT.stimulate;
      const a = isLocked ? 0.3 : 1;

      // Background — 밝은 배경 + 이중 테두리 + 하이라이트
      const bg = new PIXI.Graphics();
      // 그림자
      bg.roundRect(2, 3, cW, cardH, rd).fill({ color: cat.dark, alpha: 0.12 * a });
      // 메인 배경
      bg.roundRect(0, 0, cW, cardH, rd).fill({ color: isChosen ? cat.light : 0xffffff, alpha: a });
      // 상단 하이라이트 밴드
      bg.roundRect(0, 0, cW, cardH * 0.2, rd).fill({ color: 0xffffff, alpha: 0.5 * a });
      // 외곽 테두리
      bg.roundRect(0, 0, cW, cardH, rd)
        .stroke({ color: cat.color, width: isChosen ? 3 : 1.5, alpha: (isChosen ? 1 : 0.6) * a });
      // 안쪽 테두리 (이중 테두리)
      bg.roundRect(3, 3, cW - 6, cardH - 6, rd - 2)
        .stroke({ color: cat.color, width: 1, alpha: 0.2 * a });
      // 선택 시 외부 글로우
      if (isChosen) {
        bg.roundRect(-2, -2, cW + 4, cardH + 4, rd + 2)
          .stroke({ color: cat.color, width: 2, alpha: 0.35 });
      }
      // 좌측 타입 컬러 바
      bg.roundRect(0, 8, 4, cardH - 16, 2).fill({ color: cat.color, alpha: 0.8 * a });
      ct.addChild(bg);

      // ▸ 1줄: [계열] 위력수치
      const preview = cr?._previews?.[c]?.[row];
      let powerText = cat.label;
      if (preview) {
        if (preview.type === 'stimulate') powerText = `${cat.label} ${preview.taming}`;
        else if (preview.type === 'capture') powerText = `${cat.label} ${preview.chance}%`;
        else if (preview.type === 'defend') powerText = `${cat.label} +${preview.heal}`;
      }
      const pwLbl = lbl(powerText, 8, cat.color, true);
      pwLbl.x = 8; pwLbl.y = 5; pwLbl.alpha = a;
      ct.addChild(pwLbl);

      // ▸ 순서 번호 뱃지 (우상단)
      if (isChosen && order[c] != null) {
        const oBg = new PIXI.Graphics();
        oBg.circle(cW - 12, 12, 10).fill({ color: cat.color, alpha: 0.95 });
        ct.addChild(oBg);
        const oL = lbl(String(order[c]), 7, 0xffffff, true);
        oL.anchor = { x: 0.5, y: 0.5 }; oL.x = cW - 12; oL.y = 12;
        ct.addChild(oL);
      }

      // ▸ 2줄: 스킬 이름
      const nL = lbl(action.name, 9, C.text, true);
      nL.x = 8; nL.y = 26; nL.alpha = a;
      ct.addChild(nL);

      // ▸ 나머지: 설명 (자동 글자 크기, 검정 텍스트)
      const descArea = cardH - 52;
      const maxCharsPerLine = Math.floor(cW / (7 * S));
      const totalLines = Math.ceil(action.log.length / maxCharsPerLine);
      const fitsInArea = totalLines * 11 * S;
      let descSize = 7;
      if (fitsInArea > descArea * S) descSize = 6;

      const dText = new PIXI.Text({ text: action.log, style: {
        fontFamily: '"M PLUS Rounded 1c", "Noto Sans KR", sans-serif',
        fontSize: descSize * S, fill: '#554455', fontWeight: '400',
        wordWrap: true, wordWrapWidth: cW - 12,
        lineHeight: (descSize + 2) * S,
      }});
      dText.x = 6; dText.y = 50; dText.alpha = a;
      ct.addChild(dText);

      // Click: 선택 / 해제 토글
      if (!isLocked || isChosen) {
        ct.eventMode = 'static'; ct.cursor = 'pointer';
        ct.on('pointerdown', () => { if (onAction) onAction(c, row); });
      }

      refs.actionContainer.addChild(ct);
    });
  }
}
