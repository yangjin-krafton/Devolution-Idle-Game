// ============================================================
// Dialog System — Pokemon-style text box overlay
// ============================================================
// Usage:
//   import { initDialog, showDialog } from './dialogUI.js';
//   const overlay = initDialog();
//   app.stage.addChild(overlay); // add LAST so it renders on top
//
//   showDialog([
//     { speaker: '박사', text: '어서 오게! 몬스터의 세계에 온 걸 환영하네.' },
//     { speaker: '박사', text: '자네에게 줄 몬스터를 골라 보게.', portrait: 'asset/monsters/...' },
//     { text: '(세 마리의 몬스터가 눈앞에 있다...)' },
//   ], () => { console.log('dialog done'); });

import { W, H, S, lbl } from './theme.js';
import { D } from './theme-dark.js';
import { monster } from './sprites.js';
import { initEffectsLayer, clearEffects, cleanupBubbles, playEffects, tickEffects } from './dialogEffects.js';

// ---- Layout ----
const BOX_H = 160;
const BOX_Y = H - BOX_H - 12;
const BOX_PAD = 20;
const SPEAKER_H = 24;
const TEXT_SPEED = 35;   // ms per character
const PORTRAIT_SIZE = 80;

// ---- State ----
let overlay, backdrop, dialogBox, speakerLabel, textLabel, indicatorArrow, portraitContainer;
let lines = [];
let lineIdx = 0;
let charIdx = 0;
let revealing = false;
let timer = null;
let onComplete = null;

// ============================================================
// Build
// ============================================================

export function initDialog() {
  overlay = new PIXI.Container();
  overlay.visible = false;
  overlay.eventMode = 'static';
  overlay.zIndex = 9999;

  // Dark backdrop (dims the screen behind)
  backdrop = new PIXI.Graphics();
  backdrop.rect(0, 0, W, H).fill({ color: D.black, alpha: 0.55 });
  backdrop.eventMode = 'static'; // block clicks to screen below
  overlay.addChild(backdrop);

  // Effects layer (sprites, flash, tint — between backdrop and dialog box)
  const effectsLayer = initEffectsLayer();
  overlay.addChild(effectsLayer);

  // Portrait area (left side, above dialog box)
  portraitContainer = new PIXI.Container();
  portraitContainer.x = BOX_PAD + 10;
  portraitContainer.y = BOX_Y - PORTRAIT_SIZE - 8;
  portraitContainer.visible = false;
  overlay.addChild(portraitContainer);

  // Dialog box
  dialogBox = new PIXI.Container();
  dialogBox.y = BOX_Y;
  overlay.addChild(dialogBox);

  // Box background
  const boxBg = new PIXI.Graphics();
  // Shadow
  boxBg.roundRect(2, 3, W - 4, BOX_H, 16).fill({ color: D.black, alpha: 0.3 });
  // Main panel
  boxBg.roundRect(0, 0, W, BOX_H, 16).fill({ color: D.panel });
  boxBg.roundRect(0, 0, W, BOX_H, 16).stroke({ color: D.neon, width: 1.5, alpha: 0.4 });
  // Top frost
  boxBg.roundRect(4, 2, W - 8, BOX_H * 0.12, 14).fill({ color: D.white, alpha: 0.03 });
  dialogBox.addChild(boxBg);

  // Speaker name badge
  speakerLabel = new PIXI.Container();
  speakerLabel.y = -SPEAKER_H + 4;
  speakerLabel.x = BOX_PAD;
  dialogBox.addChild(speakerLabel);

  // Text body
  textLabel = new PIXI.Text({
    text: '',
    style: {
      fontFamily: '"M PLUS Rounded 1c", "Noto Sans KR", sans-serif',
      fontSize: 9 * S,
      fill: '#' + D.text.toString(16).padStart(6, '0'),
      fontWeight: '400',
      wordWrap: true,
      wordWrapWidth: W - BOX_PAD * 2 - 8,
      lineHeight: 13 * S,
    },
  });
  textLabel.x = BOX_PAD;
  textLabel.y = BOX_PAD - 2;
  dialogBox.addChild(textLabel);

  // "▼" advance indicator (blinking)
  indicatorArrow = lbl('▼', 8, D.neon, true);
  indicatorArrow.x = W - BOX_PAD - 8;
  indicatorArrow.y = BOX_H - 24;
  indicatorArrow.visible = false;
  dialogBox.addChild(indicatorArrow);

  // Tap anywhere to advance
  overlay.on('pointerdown', onTap);

  return overlay;
}

// ============================================================
// Show / Advance / Close
// ============================================================

export function showDialog(dialogLines, callback) {
  if (!overlay) return;
  lines = dialogLines || [];
  lineIdx = 0;
  onComplete = callback || null;
  clearEffects();
  overlay.visible = true;
  if (lines.length > 0) {
    startLine(lines[0]);
  } else {
    closeDialog();
  }
}

export function closeDialog() {
  if (timer) { clearInterval(timer); timer = null; }
  revealing = false;
  clearEffects();
  overlay.visible = false;
  if (onComplete) { const cb = onComplete; onComplete = null; cb(); }
}

function startLine(line) {
  // Clean up leftover emoji bubbles from previous line
  cleanupBubbles();

  // Speaker badge
  speakerLabel.removeChildren();
  if (line.speaker) {
    const tw = line.speaker.length * 7 * S + 20;
    speakerLabel.addChild(new PIXI.Graphics()
      .roundRect(0, 0, tw, SPEAKER_H, 8)
      .fill({ color: D.panel }).stroke({ color: D.neon, width: 1, alpha: 0.5 }));
    const st = lbl(line.speaker, 7, D.neon, true);
    st.x = 10; st.y = 4;
    speakerLabel.addChild(st);
    speakerLabel.visible = true;
  } else {
    speakerLabel.visible = false;
  }

  // Portrait
  portraitContainer.removeChildren();
  if (line.portrait) {
    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, PORTRAIT_SIZE + 16, PORTRAIT_SIZE + 16, 12)
      .fill({ color: D.panel }).stroke({ color: D.sep, width: 1, alpha: 0.4 });
    portraitContainer.addChild(bg);
    const spr = monster(PORTRAIT_SIZE, line.portrait);
    spr.x = (PORTRAIT_SIZE + 16) / 2;
    spr.y = (PORTRAIT_SIZE + 16) / 2;
    portraitContainer.addChild(spr);
    portraitContainer.visible = true;
  } else {
    portraitContainer.visible = false;
  }

  // Play effects for this line
  if (line.effects) playEffects(line.effects);

  // Start character-by-character reveal
  const fullText = line.text || '';
  charIdx = 0;
  textLabel.text = '';
  indicatorArrow.visible = false;
  revealing = true;

  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    charIdx++;
    textLabel.text = fullText.slice(0, charIdx);
    if (charIdx >= fullText.length) {
      clearInterval(timer); timer = null;
      revealing = false;
      indicatorArrow.visible = true;
    }
  }, TEXT_SPEED);
}

function onTap() {
  if (revealing) {
    // Skip to full text
    if (timer) { clearInterval(timer); timer = null; }
    const line = lines[lineIdx];
    textLabel.text = line?.text || '';
    revealing = false;
    indicatorArrow.visible = true;
    return;
  }

  // Advance to next line
  lineIdx++;
  if (lineIdx < lines.length) {
    startLine(lines[lineIdx]);
  } else {
    closeDialog();
  }
}

// ============================================================
// Indicator blink animation (call from app ticker)
// ============================================================

export function tickDialog(time) {
  if (!overlay?.visible) return;
  if (indicatorArrow) {
    indicatorArrow.alpha = indicatorArrow.visible
      ? 0.5 + 0.5 * Math.sin(time * 4)
      : 0;
  }
  tickEffects();
}
