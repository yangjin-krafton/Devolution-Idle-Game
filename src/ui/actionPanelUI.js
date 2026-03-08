// ============================================================
// Action Panel — 3x3 그리드 (3마리 × 3스킬 동시 선택)
// ============================================================

import { W, H, C, S, lbl, softPanel, cuteBar } from './theme.js';
import { monster } from './sprites.js';

const CATEGORY_STYLE = {
  stimulate: { label: '자극', color: C.taming,  dark: 0x5588cc, light: 0xc0ddff },
  capture:   { label: '포획', color: C.orange,  dark: 0xcc7733, light: 0xffe0b0 },
  defend:    { label: '수비', color: C.water,   dark: 0x5599aa, light: 0xc0eeff },
};

let container;
let refs = {};
let onAction = null;

export function initActionPanel(parentContainer, sharedRefs) {
  container = parentContainer;
  refs = sharedRefs;
  buildActionPanel();
}

export function setActionCallbacks({ action }) {
  onAction = action;
}

function buildActionPanel() {
  const panelY = 340;
  container.addChild(new PIXI.Graphics().roundRect(0, panelY, W, H - panelY, 24).fill({ color: C.cream }));
  refs.actionContainer = new PIXI.Container();
  refs.actionContainer.y = panelY + 6;
  container.addChild(refs.actionContainer);
}

export function renderActions(team, combatResult) {
  refs.actionContainer.removeChildren();
  if (!team || team.length === 0) return;

  const colCount = Math.min(team.length, 3);
  const colW = (W - 12) / colCount;
  const cardH = 156;
  const cardGap = 3;
  const headerH = 28;
  const startX = 6;
  const pending = combatResult?.pendingSlots || [];
  const selected = combatResult?.selectedActions || {};
  const turnOrder = combatResult?.turnOrder || {};

  for (let col = 0; col < colCount; col++) {
    const ally = team[col];
    if (!ally) continue;

    const cx = startX + col * colW;
    const isPending = pending.includes(col);
    const chosenIdx = selected[col];
    const hasChosen = chosenIdx != null;

    // Column wrapper panel
    const panelH = headerH + 3 * (cardH + cardGap) + 6;
    const borderColor = isPending ? C.pink : (hasChosen ? C.mint : C.border);
    refs.actionContainer.addChild(
      softPanel(cx, 0, colW - 2, panelH, isPending ? 0xfff8fa : C.white, borderColor)
    );

    // Column header
    const header = new PIXI.Container();
    header.x = cx; header.y = 0;
    const m = monster(28, ally.img); m.x = 14; m.y = 12;
    if (ally.hp <= 0) m.alpha = 0.3;
    header.addChild(m);
    const nameLbl = lbl(ally.name, 7, isPending ? C.pink : C.dim, true);
    nameLbl.x = 30; nameLbl.y = 4;
    header.addChild(nameLbl);
    const hpRatio = ally.hp / ally.maxHp;
    header.addChild(cuteBar(30, 20, colW - 46, 4, hpRatio, hpRatio > 0.3 ? C.hp : C.hpLow));
    refs.actionContainer.addChild(header);

    // Fainted / Egg
    if (ally.hp <= 0 || ally.inEgg) {
      const faintLbl = lbl(ally.inEgg ? '알' : '기절', 8, C.dimmer, true);
      faintLbl.anchor = { x: 0.5, y: 0.5 };
      faintLbl.x = cx + colW / 2; faintLbl.y = headerH + cardH;
      refs.actionContainer.addChild(faintLbl);
      continue;
    }

    // 3 skill cards
    ally.actions.forEach((action, row) => {
      const cardX = cx + 4;
      const cardY = headerH + row * (cardH + cardGap);
      const cardW = colW - 10;
      const ct = new PIXI.Container();
      ct.x = cardX; ct.y = cardY;

      const cat = CATEGORY_STYLE[action.category] || CATEGORY_STYLE.stimulate;
      const isChosen = hasChosen && chosenIdx === row;
      const isLocked = hasChosen && !isChosen;
      const a = isLocked ? 0.3 : 1;
      const rd = 16;

      // --- Card background ---
      const bg = new PIXI.Graphics();
      bg.roundRect(1, 2, cardW, cardH, rd).fill({ color: cat.dark, alpha: 0.25 * a });
      bg.roundRect(0, 0, cardW, cardH, rd).fill({ color: cat.color, alpha: a });
      bg.roundRect(0, 0, cardW, cardH * 0.35, rd).fill({ color: 0xffffff, alpha: 0.18 * a });
      bg.roundRect(3, 3, cardW - 6, cardH - 6, rd - 2)
        .stroke({ color: 0xffffff, width: 1.5, alpha: 0.3 * a });
      if (isChosen) {
        bg.roundRect(-2, -2, cardW + 4, cardH + 4, rd + 2)
          .stroke({ color: 0xffffff, width: 3, alpha: 0.9 });
      }
      ct.addChild(bg);

      // ▸ 좌상단: 계열 태그 pill
      const pillW = 34, pillH = 14;
      const pill = new PIXI.Graphics();
      pill.roundRect(6, 5, pillW, pillH, 7).fill({ color: cat.dark, alpha: 0.6 * a });
      ct.addChild(pill);
      const tagLbl = lbl(cat.label, 5, 0xffffff, true);
      tagLbl.anchor = { x: 0.5, y: 0.5 };
      tagLbl.x = 6 + pillW / 2; tagLbl.y = 5 + pillH / 2;
      tagLbl.alpha = a;
      ct.addChild(tagLbl);

      // ▸ 우상단: 행동 순서 번호 (선택 시)
      if (isChosen && turnOrder[col] != null) {
        const oBg = new PIXI.Graphics();
        oBg.circle(cardW - 14, 12, 11).fill({ color: 0xffffff, alpha: 0.95 });
        ct.addChild(oBg);
        const oLbl = lbl(String(turnOrder[col]), 8, cat.dark, true);
        oLbl.anchor = { x: 0.5, y: 0.5 };
        oLbl.x = cardW - 14; oLbl.y = 12;
        ct.addChild(oLbl);
      }

      // ▸ 중앙: 스킬 이름 (크게)
      const nLbl = lbl(action.name, 10, 0xffffff, true);
      nLbl.anchor = { x: 0.5, y: 0 };
      nLbl.x = cardW / 2; nLbl.y = 22;
      nLbl.alpha = a;
      ct.addChild(nLbl);

      // ▸ 중앙: 설명 전문 (줄바꿈)
      const dText = new PIXI.Text({ text: action.log, style: {
        fontFamily: '"M PLUS Rounded 1c", "Noto Sans KR", sans-serif',
        fontSize: 8 * S, fill: '#ffffffcc', fontWeight: '400',
        wordWrap: true, wordWrapWidth: cardW - 14,
        lineHeight: 11 * S,
      }});
      dText.x = 7; dText.y = 50;
      dText.alpha = a;
      ct.addChild(dText);

      // ▸ 하단: 효과 수치
      const preview = combatResult?._previews?.[col]?.[row];
      if (preview && !isLocked) {
        let effectText = '';
        if (preview.type === 'stimulate') {
          effectText = `순화+${preview.taming}  도주+${preview.escape}`;
        } else if (preview.type === 'capture') {
          effectText = `성공${preview.chance}%  위험+${preview.escape}`;
          if (combatResult?.tamingPercent < 40) effectText += '  순화부족!';
        } else if (preview.type === 'defend') {
          effectText = `회복+${preview.heal}  방어+${preview.defense}`;
        }
        const eLbl = lbl(effectText, 6, 0xffffffdd, true);
        eLbl.anchor = { x: 0.5, y: 1 };
        eLbl.x = cardW / 2; eLbl.y = cardH - 6;
        eLbl.alpha = a;
        ct.addChild(eLbl);
      }

      // Click handler
      if (isPending && !isLocked) {
        ct.eventMode = 'static'; ct.cursor = 'pointer';
        ct.on('pointerdown', () => { if (onAction) onAction(col, row); });
      }

      refs.actionContainer.addChild(ct);
    });
  }
}
