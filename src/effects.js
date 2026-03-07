// ============================================================
// Visual Effects (mo.js)
// Provides combat, bonding, devolution VFX
// ============================================================

const mojs = window.mojs;

// Helper: get element center position relative to #game
function getCenter(el) {
  const rect = el.getBoundingClientRect();
  const gameRect = document.getElementById('game').getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 - gameRect.left,
    y: rect.top + rect.height / 2 - gameRect.top,
  };
}

// ---- Taming action effects (by sensory axis) ----

const AXIS_COLORS = {
  sound:       ['#7fdbff', '#4a9eff', '#b0e0ff'],
  temperature: ['#ff9f43', '#ff6348', '#ffdd57'],
  smell:       ['#7bed9f', '#2ed573', '#a4e0a4'],
  behavior:    ['#dfe6e9', '#b2bec3', '#a29bfe'],
};

export function playTamingEffect(targetEl, axis, isGood) {
  if (!mojs) return;
  const colors = AXIS_COLORS[axis] || AXIS_COLORS.behavior;
  const pos = getCenter(targetEl);

  if (isGood) {
    // Positive: gentle burst of soft particles
    new mojs.Burst({
      left: pos.x, top: pos.y,
      parent: document.getElementById('game'),
      radius: { 4: 40 },
      count: 6,
      children: {
        shape: 'circle',
        fill: colors,
        radius: { 5: 0 },
        opacity: { 1: 0 },
        duration: 700,
        easing: 'quad.out',
      },
    }).play();

    // Soft ring expanding
    new mojs.Shape({
      left: pos.x, top: pos.y,
      parent: document.getElementById('game'),
      shape: 'circle',
      fill: 'none',
      stroke: colors[0],
      radius: { 8: 35 },
      strokeWidth: { 3: 0 },
      opacity: { 0.6: 0 },
      duration: 600,
      easing: 'quad.out',
    }).play();
  } else {
    // Negative: sharp jagged shapes
    new mojs.Burst({
      left: pos.x, top: pos.y,
      parent: document.getElementById('game'),
      radius: { 0: 30 },
      count: 5,
      children: {
        shape: 'zigzag',
        fill: 'none',
        stroke: '#ff6b6b',
        strokeWidth: 2,
        radius: { 6: 0 },
        opacity: { 1: 0 },
        duration: 500,
      },
    }).play();
  }
}

// ---- Enemy attack effect ----

export function playAttackEffect(targetEl) {
  if (!mojs) return;
  const pos = getCenter(targetEl);
  const game = document.getElementById('game');

  // Red impact flash
  new mojs.Shape({
    left: pos.x, top: pos.y,
    parent: game,
    shape: 'circle',
    fill: '#ff6b6b',
    radius: { 0: 20 },
    opacity: { 0.8: 0 },
    duration: 300,
    easing: 'quad.out',
  }).play();

  // Hit sparks
  new mojs.Burst({
    left: pos.x, top: pos.y,
    parent: game,
    radius: { 6: 35 },
    count: 8,
    children: {
      shape: 'line',
      stroke: ['#ff6b6b', '#ff4757', '#ffa502'],
      strokeWidth: 2,
      radius: { 8: 0 },
      opacity: { 1: 0 },
      duration: 400,
      angle: { 0: 90 },
    },
  }).play();
}

// ---- Bonding attempt effect ----

export function playBondingAttempt(targetEl) {
  if (!mojs) return;
  const pos = getCenter(targetEl);
  const game = document.getElementById('game');

  // Pulsing ring (anticipation)
  new mojs.Shape({
    left: pos.x, top: pos.y,
    parent: game,
    shape: 'circle',
    fill: 'none',
    stroke: '#7fdbff',
    radius: { 15: 50 },
    strokeWidth: { 4: 0 },
    opacity: { 0.7: 0 },
    duration: 800,
    easing: 'sine.out',
  }).play();
}

// ---- Bonding success effect ----

export function playBondingSuccess(targetEl) {
  if (!mojs) return;
  const pos = getCenter(targetEl);
  const game = document.getElementById('game');

  // Large celebratory burst
  new mojs.Burst({
    left: pos.x, top: pos.y,
    parent: game,
    radius: { 10: 70 },
    count: 12,
    children: {
      shape: 'circle',
      fill: ['#7bed9f', '#7fdbff', '#ffdd57', '#a29bfe'],
      radius: { 6: 0 },
      opacity: { 1: 0 },
      duration: 900,
      easing: 'quad.out',
    },
  }).play();

  // Inner glow ring
  new mojs.Shape({
    left: pos.x, top: pos.y,
    parent: game,
    shape: 'circle',
    fill: 'none',
    stroke: '#7bed9f',
    radius: { 0: 60 },
    strokeWidth: { 6: 0 },
    opacity: { 1: 0 },
    duration: 1000,
    easing: 'sine.out',
  }).play();

  // Second delayed ring
  new mojs.Shape({
    left: pos.x, top: pos.y,
    parent: game,
    shape: 'circle',
    fill: 'none',
    stroke: '#ffdd57',
    radius: { 0: 45 },
    strokeWidth: { 4: 0 },
    opacity: { 0.8: 0 },
    duration: 800,
    delay: 200,
    easing: 'sine.out',
  }).play();
}

// ---- Bonding fail effect ----

export function playBondingFail(targetEl) {
  if (!mojs) return;
  const pos = getCenter(targetEl);
  const game = document.getElementById('game');

  new mojs.Burst({
    left: pos.x, top: pos.y,
    parent: game,
    radius: { 0: 40 },
    count: 6,
    children: {
      shape: 'cross',
      stroke: '#ff6b6b',
      strokeWidth: 2,
      radius: { 8: 0 },
      opacity: { 1: 0 },
      duration: 500,
      angle: { 0: 45 },
    },
  }).play();
}

// ---- Enemy escape effect ----

export function playEscapeEffect(targetEl) {
  if (!mojs) return;
  const pos = getCenter(targetEl);
  const game = document.getElementById('game');

  // Scatter upward
  new mojs.Burst({
    left: pos.x, top: pos.y,
    parent: game,
    radius: { 10: 60 },
    count: 10,
    degree: 120,
    angle: -150,
    children: {
      shape: 'circle',
      fill: ['#dfe6e9', '#b2bec3'],
      radius: { 4: 0 },
      opacity: { 0.8: 0 },
      duration: 600,
      pathScale: 'rand(0.5, 1.2)',
    },
  }).play();
}

// ---- Devolution reveal effect ----

export function playDevolutionEffect(targetEl) {
  if (!mojs) return;
  const pos = getCenter(targetEl);
  const game = document.getElementById('game');

  // Golden sparkle burst
  new mojs.Burst({
    left: pos.x, top: pos.y,
    parent: game,
    radius: { 15: 80 },
    count: 16,
    children: {
      shape: 'circle',
      fill: ['#ffdd57', '#ffa502', '#7bed9f', '#fff'],
      radius: { 'rand(4,8)': 0 },
      opacity: { 1: 0 },
      duration: 1200,
      delay: 'rand(0, 300)',
      easing: 'quad.out',
    },
  }).play();

  // Growing ring
  new mojs.Shape({
    left: pos.x, top: pos.y,
    parent: game,
    shape: 'circle',
    fill: 'none',
    stroke: '#ffdd57',
    radius: { 0: 70 },
    strokeWidth: { 5: 0 },
    opacity: { 1: 0 },
    duration: 1000,
    easing: 'sine.out',
  }).play();
}

// ---- Ally faint effect ----

export function playFaintEffect(targetEl) {
  if (!mojs) return;
  const pos = getCenter(targetEl);
  const game = document.getElementById('game');

  new mojs.Burst({
    left: pos.x, top: pos.y,
    parent: game,
    radius: { 5: 30 },
    count: 5,
    children: {
      shape: 'circle',
      fill: '#636e72',
      radius: { 4: 0 },
      opacity: { 0.6: 0 },
      duration: 600,
      pathScale: 'rand(0.5, 1)',
    },
  }).play();
}
