// ============================================================
// Battle Background Data — Sky + Ground + Time of Day
// ============================================================

// Time of day
export const TIME_OF_DAY = {
  day: {
    id: 'day', label: '낮',
    tint: 0xffffff, alpha: 0,
    skyMul: [1, 1, 1],           // no color shift
    celestial: 'sun',
    starCount: 0,
  },
  night: {
    id: 'night', label: '밤',
    tint: 0x0a0a2e, alpha: 0.38,
    skyMul: [0.55, 0.55, 0.75],  // blue-shift darken
    celestial: 'moon',
    starCount: 25,
  },
};

// Sky types — gradient stops (top→horizon), cloud style, particles
export const SKY_TYPES = {
  clear: {
    id: 'clear', label: '맑음',
    gradient: [0x5599dd, 0x88bbee, 0xaaddff, 0xc0e8ff, 0xd8f0ff, 0xe8f6ff],
    horizon: 0xffeedd,
    clouds: 'fluffy',
    particles: null,
  },
  snow: {
    id: 'snow', label: '눈',
    gradient: [0x8899aa, 0x99aabb, 0xaabbcc, 0xbbc8d8, 0xd0d8e8, 0xe0e4ee],
    horizon: 0xdde0e8,
    clouds: 'heavy',
    particles: { type: 'snow', count: 35, color: 0xffffff, speed: 0.4, size: 3 },
  },
  rain: {
    id: 'rain', label: '비',
    gradient: [0x556677, 0x667788, 0x778899, 0x8899aa, 0x99aabb, 0xaabbcc],
    horizon: 0x99aabb,
    clouds: 'heavy',
    particles: { type: 'rain', count: 50, color: 0xaaccee, speed: 3.0, size: 2 },
  },
  volcanic: {
    id: 'volcanic', label: '화산 열기',
    gradient: [0xcc4422, 0xdd6633, 0xee7744, 0xff9966, 0xffaa77, 0xffcc99],
    horizon: 0xffddaa,
    clouds: null,
    particles: { type: 'ember', count: 20, color: 0xff6633, speed: 0.6, size: 3 },
  },
  wind: {
    id: 'wind', label: '강풍',
    gradient: [0x6699aa, 0x88bbbb, 0x99ccbb, 0xb0d8c8, 0xc0e0d0, 0xd8f0e0],
    horizon: 0xe8f8e8,
    clouds: 'streaky',
    particles: { type: 'leaf', count: 25, color: 0x66aa44, speed: 2.5, size: 5 },
  },
};

// Ground types — 3 terrain layers + flat base + texture + deco
export const GROUND_TYPES = {
  grass: {
    id: 'grass', label: '잔디',
    layers: [0x99eebb, 0x88ddbb, 0x78cc99],
    flat: 0x68bb88,
    texture: 'grass_blades',
    deco: 'flowers',
    distant: 0x77bb99,
  },
  sand: {
    id: 'sand', label: '모래',
    layers: [0xeedd99, 0xddcc77, 0xccbb66],
    flat: 0xbbaa55,
    texture: 'sand_dots',
    deco: 'rocks',
    distant: 0xccbb88,
  },
  rock: {
    id: 'rock', label: '바위',
    layers: [0xaa9999, 0x99888a, 0x887778],
    flat: 0x776668,
    texture: 'rock_speckle',
    deco: 'cracks',
    distant: 0x998888,
  },
  swamp: {
    id: 'swamp', label: '습지',
    layers: [0x88bb99, 0x77aa88, 0x669977],
    flat: 0x558866,
    texture: 'swamp_murk',
    deco: 'bubbles',
    distant: 0x77aa88,
  },
  sea: {
    id: 'sea', label: '바다',
    layers: [0x88ccee, 0x77bbdd, 0x66aacc],
    flat: 0x5599bb,
    texture: 'water_ripple',
    deco: 'waves',
    distant: 0x88bbcc,
  },
  asphalt: {
    id: 'asphalt', label: '도시 아스팔트',
    layers: [0x999999, 0x888890, 0x777780],
    flat: 0x666670,
    texture: 'asphalt_grain',
    deco: 'lines',
    distant: 0x888888,
  },
};

function pickRandom(obj) {
  const keys = Object.keys(obj);
  return obj[keys[Math.floor(Math.random() * keys.length)]];
}

export function randomEnvironment() {
  return {
    sky: pickRandom(SKY_TYPES),
    ground: pickRandom(GROUND_TYPES),
    time: Math.random() < 0.5 ? TIME_OF_DAY.day : TIME_OF_DAY.night,
  };
}
