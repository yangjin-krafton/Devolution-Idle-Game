// ============================================================
// Environment HUD — 5-axis dashboard + shake + live update
// Extracted from battleFieldUI.js for modularity.
// ============================================================

import { W, lbl } from './theme.js';
import { ENVIRONMENT_AXES, ENV_AXIS_LABEL, ENV_AXIS_ICON } from '../data/index.js';

const ENV_AXIS_COLOR = {
  temperature: 0xffaa77,
  brightness: 0xffe060,
  smell: 0x88cc88,
  humidity: 0x88bbee,
  sound: 0xccaaee,
};

const HINT_ICON = {
  low:  { arrow: '▲', color: 0xff8866 },
  high: { arrow: '▼', color: 0x66aaff },
  ok:   { arrow: '',  color: 0x00d4aa },
};

// Sensory axis → Environment axis mapping (mirrors combat.js AXIS_TO_ENV)
export const SENSORY_TO_ENV = {
  sound: 'sound', temperature: 'temperature', smell: 'smell', behavior: 'humidity',
};

let _axisFrames = {};
let _lastHudResult = null;
let _enemyPref = null;
let _turn = 0;

export function setEnemyPref(pref) { _enemyPref = pref; }
export function getAxisFrames() { return _axisFrames; }

export function renderEnvironmentHud(hudContainer, result) {
  if (!hudContainer) return;
  hudContainer.removeChildren();

  const envStatus = result.envStatus || {};
  const phase = result.phase || 'regular';
  const turn = result.turn || _turn || 0;
  const turnsRemaining = result.turnsRemaining ?? 0;
  const matchCount = result.matchCount || 0;
  const escapeGauge = result.escapeGauge || 0;
  const escapeMax = result.escapeMax || 10;
  const escapePct = result.escapePercent || 0;
  _turn = turn;
  _lastHudResult = { ...result, _enemyPref };

  const isOvertime = phase === 'overtime';

  // ---- Layout ----
  const leftW = 72;
  const leftGap = 5;
  const envGap = 3;
  const envFrameW = Math.floor((W - leftW - leftGap - 8 - envGap * 4) / 5);
  const envFrameH = 24;
  const envStartX = leftW + leftGap + 4;
  const leftH = envFrameH;

  // ======== Left: combined frame ========
  const lx = 3, ly = 0;
  const lg = new PIXI.Graphics();
  const leftBorderCol = isOvertime ? 0xff4444 : 0xffe060;
  lg.roundRect(lx, ly, leftW, leftH, 6).fill({ color: 0x13132a });
  lg.roundRect(lx, ly, leftW, leftH, 6).stroke({ color: leftBorderCol, width: 1.5, alpha: 0.7 });
  hudContainer.addChild(lg);

  if (!isOvertime) {
    const urgent = turnsRemaining <= 1;
    const col = urgent ? 0xff4444 : 0xffe060;
    const textL = lbl(`⌛️${turnsRemaining}  T${turn}  ${matchCount}/5`, 5, col, true);
    textL.anchor = { x: 0.5, y: 0.5 };
    textL.x = lx + leftW / 2; textL.y = ly + leftH / 2;
    hudContainer.addChild(textL);
  } else {
    const barX = lx + 18, barY = ly + 4;
    const barW = leftW - 22, barH = 8;
    const ratio = Math.min(1, escapeGauge / escapeMax);
    const barG = new PIXI.Graphics();
    barG.roundRect(barX, barY, barW, barH, 4).fill({ color: 0x331122 });
    if (ratio > 0) {
      const fillCol = escapePct >= 70 ? 0xff2222 : 0xff6644;
      barG.roundRect(barX + 1, barY + 1, Math.max(4, (barW - 2) * ratio), barH - 2, 3)
        .fill({ color: fillCol, alpha: 0.9 });
    }
    hudContainer.addChild(barG);

    const otIcon = lbl('⏰', 5, 0xff4444, true);
    otIcon.x = lx + 3; otIcon.y = ly + 3;
    hudContainer.addChild(otIcon);

    const escL = lbl(`${escapeGauge}/${escapeMax}  T${turn}`, 4, escapePct >= 70 ? 0xff4444 : 0xaa7777, true);
    escL.x = lx + 18; escL.y = ly + 14;
    hudContainer.addChild(escL);
  }

  // ======== 5-axis frames ========
  _axisFrames = {};
  for (let ai = 0; ai < ENVIRONMENT_AXES.length; ai++) {
    const axis = ENVIRONMENT_AXES[ai];
    const info = envStatus[axis];
    const current = info?.current ?? 0;
    const hint = info?.hint ?? 'ok';
    const matched = info?.matched ?? false;
    const revealed = info?.revealed ?? false;
    const ideal = info?.ideal;
    const color = ENV_AXIS_COLOR[axis] || 0xaaaaaa;
    const hd = HINT_ICON[hint] || HINT_ICON.ok;

    const fx = envStartX + ai * (envFrameW + envGap);
    const fy = 0;

    const axisC = new PIXI.Container();
    axisC.x = 0; axisC.y = 0;
    _axisFrames[axis] = axisC;

    const g = new PIXI.Graphics();
    let borderCol = matched ? 0x00d4aa : 0x333355;
    if (isOvertime && !matched) borderCol = 0xff4444;
    g.roundRect(fx, fy, envFrameW, envFrameH, 6).fill({ color: 0x13132a });
    g.roundRect(fx, fy, envFrameW, envFrameH, 6)
      .stroke({ color: borderCol, width: matched ? 1.5 : 1, alpha: matched ? 0.8 : (isOvertime && !matched ? 0.9 : 0.5) });
    axisC.addChild(g);

    const icon = lbl(ENV_AXIS_ICON[axis], 6, color, true);
    icon.x = fx + 2; icon.y = fy + 3;
    axisC.addChild(icon);

    const valSign = current > 0 ? '+' : '';
    let valText = `${ENV_AXIS_LABEL[axis]} ${valSign}${current}`;
    if (revealed && ideal != null) {
      const iSign = ideal > 0 ? '+' : '';
      valText += `→${iSign}${ideal}`;
    }
    const valL = lbl(valText, 5, matched ? 0x00d4aa : 0xaaaacc, true);
    valL.x = fx + 16; valL.y = fy + 5;
    axisC.addChild(valL);

    if (!matched && hd.arrow) {
      const arr = lbl(hd.arrow, 6, hd.color, true);
      arr.anchor = { x: 1, y: 0 }; arr.x = fx + envFrameW - 3; arr.y = fy + 3;
      axisC.addChild(arr);
    }

    if (matched) {
      const overlay = new PIXI.Graphics();
      overlay.roundRect(fx, fy, envFrameW, envFrameH, 6).fill({ color: 0x00d4aa, alpha: 0.15 });
      axisC.addChild(overlay);
      const chk = lbl('✔', 10, 0x00d4aa, true);
      chk.anchor = { x: 0.5, y: 0.5 };
      chk.x = fx + envFrameW / 2; chk.y = fy + envFrameH / 2;
      chk.alpha = 0.5;
      axisC.addChild(chk);
    }

    hudContainer.addChild(axisC);
  }
}

/**
 * Shake a specific axis frame in the HUD.
 */
export function shakeHud(axisName, intensity = 8, duration = 700) {
  const frame = _axisFrames[axisName];
  if (!frame) return;
  const ox = frame.x, oy = frame.y;
  const start = performance.now();
  (function tick() {
    const elapsed = performance.now() - start;
    if (elapsed >= duration) { frame.x = ox; frame.y = oy; return; }
    const t = elapsed / duration;
    const decay = 1 - (1 - Math.pow(1 - t, 4));
    frame.x = ox + (Math.random() - 0.5) * intensity * 2 * decay;
    frame.y = oy + (Math.random() - 0.5) * intensity * 1.5 * decay;
    requestAnimationFrame(tick);
  })();
}

/**
 * Rebuild HUD with a partial env snapshot from a turnStep.
 */
export function updateHudFromStep(hudContainer, envAfter) {
  if (!envAfter || !_lastHudResult) return;
  const patched = { ..._lastHudResult, environment: { ...envAfter } };
  const pref = _enemyPref;
  if (pref) {
    const envStatus = {};
    for (const axis of ENVIRONMENT_AXES) {
      const p = pref[axis];
      const current = envAfter[axis] ?? 0;
      const matched = p ? Math.abs(current - p.ideal) <= p.tolerance : true;
      const diff = p ? p.ideal - current : 0;
      const hint = !p || matched ? 'ok' : (diff > 0 ? 'low' : 'high');
      const revealed = _lastHudResult.envStatus?.[axis]?.revealed ?? false;
      envStatus[axis] = {
        current, hint, matched, revealed,
        ideal: revealed ? p?.ideal ?? 0 : null,
        tolerance: revealed ? p?.tolerance ?? 0 : null,
      };
    }
    patched.envStatus = envStatus;
    patched.matchCount = ENVIRONMENT_AXES.filter(a => envStatus[a]?.matched).length;
  }
  renderEnvironmentHud(hudContainer, patched);
}
