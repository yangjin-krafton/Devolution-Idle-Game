// ============================================================
// Action Panel — 3x3 그리드 (닌텐도 스위치 스타일 v2)
// ============================================================

import { W, H, S, lbl } from './theme.js';
import { monster } from './sprites.js';
import { buildSkillCard, SKILL_CAT } from './skillCard.js';

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
      const cW = colW - 12;
      const isChosen = hasChosen && chosen === row;
      const isLocked = hasChosen && !isChosen;

      // [확인] 버튼
      if (allChosen && !isChosen) {
        const btnCt = new PIXI.Container(); btnCt.x = x; btnCt.y = y;
        const btnBg = new PIXI.Graphics();
        btnBg.roundRect(0, 0, cW, cardH, 10).fill({ color: 0x00d4aa });
        btnBg.roundRect(0, 0, cW, cardH * 0.3, 10).fill({ color: 0xffffff, alpha: 0.1 });
        btnCt.addChild(btnBg);
        const bL = lbl('▶ 확인', 11, 0x1a1a2e, true);
        bL.anchor = { x: 0.5, y: 0.5 }; bL.x = cW / 2; bL.y = cardH / 2;
        btnCt.addChild(bL);
        btnCt.eventMode = 'static'; btnCt.cursor = 'pointer';
        btnCt.on('pointerdown', () => { if (onConfirm) onConfirm(); });
        refs.actionContainer.addChild(btnCt);
        return;
      }

      // Build preview header for combat
      const cat = SKILL_CAT[action.category] || SKILL_CAT.stimulate;
      const preview = cr?._previews?.[c]?.[row];
      let previewOpt = null;
      if (preview) {
        let pwText = `${cat.icon}`;
        let effMarker = '';
        const catLabel = { stimulate: '자극', capture: '포획', defend: '수비' }[action.category] || action.category;
        if (preview.type === 'stimulate') {
          pwText = `${cat.icon} ${catLabel} ${preview.taming}`;
          if (preview.effective === 'good') effMarker = ' ▲';
          else if (preview.effective === 'bad') effMarker = ' ▼';
        }
        else if (preview.type === 'capture') pwText = `${cat.icon} ${catLabel} ${preview.chance}%`;
        else if (preview.type === 'defend') pwText = `${cat.icon} ${catLabel} +${preview.heal}`;
        const effColor = effMarker === ' ▲' ? 0x00ff88 : effMarker === ' ▼' ? 0xff4444 : cat.c;
        previewOpt = { text: (pwText + effMarker), effColor };
      }

      const ppEmpty = action.pp != null && action.pp <= 0;
      const ct = buildSkillCard(action, cW, cardH, {
        selected: isChosen,
        locked: isLocked,
        ppEmpty,
        showDesc: true,
        preview: previewOpt,
        orderNum: (isChosen && order[c] != null) ? order[c] : null,
      });
      ct.x = x; ct.y = y;

      // Click (PP 빈 스킬은 클릭 불가)
      if ((!isLocked || isChosen) && !ppEmpty) {
        ct.eventMode = 'static'; ct.cursor = 'pointer';
        ct.on('pointerdown', () => { if (onAction) onAction(c, row); });
      }

      refs.actionContainer.addChild(ct);
    });
  }
}
