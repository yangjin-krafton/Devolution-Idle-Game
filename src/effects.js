// ============================================================
// Visual Effects - Pure CSS/DOM (no external library)
// Screen flash, sprite blink, screen shake, hit freeze
// Same export API — drop-in replacement for mo.js version
// ============================================================

const game = () => document.getElementById('game');

// ---- Core Utility Effects ----

function screenFlash(color = '#fff', duration = 120) {
  const el = document.getElementById('vfx-flash');
  if (!el) return;
  el.style.background = color;
  el.style.opacity = '0.6';
  el.style.display = 'block';
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => { el.style.display = 'none'; }, duration);
  }, duration);
}

function screenShake(intensity = 4, duration = 300) {
  const g = game();
  let start = Date.now();
  function frame() {
    const elapsed = Date.now() - start;
    if (elapsed > duration) { g.style.translate = ''; return; }
    const decay = 1 - elapsed / duration;
    const x = (Math.random() - 0.5) * intensity * 2 * decay;
    const y = (Math.random() - 0.5) * intensity * 2 * decay;
    g.style.translate = `${x}px ${y}px`;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function spriteBlink(el, times = 3, interval = 80) {
  if (!el) return;
  let count = 0;
  const id = setInterval(() => {
    el.style.opacity = count % 2 === 0 ? '0.2' : '1';
    count++;
    if (count >= times * 2) { clearInterval(id); el.style.opacity = '1'; }
  }, interval);
}

function hitFreeze(duration = 50) {
  const g = game();
  g.style.filter = 'brightness(2)';
  return new Promise(r => setTimeout(() => { g.style.filter = ''; r(); }, duration));
}

// ---- Taming Action Effects ----

export function playTamingEffect(targetEl, axis, isGood) {
  const FLASH = {
    sound: '#e0f4ff', temperature: '#fff3e0',
    smell: '#e8fce8', behavior: '#f0ecff',
  };
  if (isGood) {
    screenFlash(FLASH[axis] || '#f0ecff', 150);
  } else {
    screenFlash('#440000', 100);
    screenShake(2, 150);
  }
}

// ---- Enemy Attack Effect ----

export async function playAttackEffect(targetEl) {
  await hitFreeze(50);
  screenFlash('#ff0000', 80);
  screenShake(6, 250);
  spriteBlink(targetEl, 4, 70);
}

// ---- Bonding Attempt ----

export function playBondingAttempt(targetEl) {
  screenFlash('#e0f0ff', 200);
}

// ---- Bonding Success ----

export function playBondingSuccess(targetEl) {
  screenFlash('#ffffff', 250);
  screenShake(3, 200);
}

// ---- Bonding Fail ----

export function playBondingFail(targetEl) {
  screenFlash('#220000', 150);
  screenShake(4, 200);
}

// ---- Enemy Escape ----

export function playEscapeEffect(targetEl) {
  if (targetEl) {
    targetEl.style.transition = 'all 0.5s ease';
    targetEl.style.opacity = '0';
    targetEl.style.translate = '0 -30px';
    setTimeout(() => {
      targetEl.style.transition = '';
      targetEl.style.opacity = '1';
      targetEl.style.translate = '';
    }, 600);
  }
  screenFlash('#333', 200);
}

// ---- Devolution Reveal ----

export function playDevolutionEffect(targetEl) {
  screenFlash('#fffde0', 300);
  screenShake(2, 300);
}

// ---- Ally Faint ----

export function playFaintEffect(targetEl) {
  spriteBlink(targetEl, 3, 100);
  screenFlash('#000', 100);
  screenShake(3, 150);
}
