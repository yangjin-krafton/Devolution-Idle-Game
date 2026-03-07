// ============================================================
// Battle Background Data — Sky + Ground + Time of Day
// ============================================================

// Time of day tint overlays
export const TIME_OF_DAY = {
  day:   { tint: 0xffffff, alpha: 0,    label: '낮' },
  night: { tint: 0x1a1a44, alpha: 0.35, label: '밤' },
};

// Sky types — each defines gradient colors + optional weather particles
export const SKY_TYPES = {
  clear: {
    id: 'clear',
    label: '맑음',
    colors: [0xc0e8ff, 0xd8f0ff],
    clouds: true,
    particles: null,
  },
  snow: {
    id: 'snow',
    label: '눈',
    colors: [0xd0d8e8, 0xe0e4ee],
    clouds: true,
    particles: { type: 'snow', count: 30, color: 0xffffff, speed: 0.4, size: 3 },
  },
  rain: {
    id: 'rain',
    label: '비',
    colors: [0x8899aa, 0x99aabb],
    clouds: true,
    particles: { type: 'rain', count: 40, color: 0xaaccee, speed: 3.0, size: 2 },
  },
  volcanic: {
    id: 'volcanic',
    label: '화산 열기',
    colors: [0xff9966, 0xffbb88],
    clouds: false,
    particles: { type: 'ember', count: 15, color: 0xff6633, speed: 0.6, size: 3 },
  },
  wind: {
    id: 'wind',
    label: '강풍',
    colors: [0xb0d8c8, 0xc8e8d8],
    clouds: true,
    particles: { type: 'leaf', count: 20, color: 0x66aa44, speed: 2.5, size: 5 },
  },
};

// Ground types — each defines terrain colors and optional decoration
export const GROUND_TYPES = {
  grass: {
    id: 'grass',
    label: '잔디',
    hill: [0x88ddbb, 0x78cc99],
    flat: 0x68bb88,
    deco: 'flowers',
  },
  sand: {
    id: 'sand',
    label: '모래',
    hill: [0xeedd99, 0xddcc77],
    flat: 0xccbb66,
    deco: 'rocks',
  },
  rock: {
    id: 'rock',
    label: '바위',
    hill: [0x99888a, 0x887778],
    flat: 0x776668,
    deco: 'cracks',
  },
  swamp: {
    id: 'swamp',
    label: '습지',
    hill: [0x77aa88, 0x669977],
    flat: 0x558866,
    deco: 'bubbles',
  },
  sea: {
    id: 'sea',
    label: '바다',
    hill: [0x77bbdd, 0x66aacc],
    flat: 0x5599bb,
    deco: 'waves',
  },
  asphalt: {
    id: 'asphalt',
    label: '도시 아스팔트',
    hill: [0x888890, 0x777780],
    flat: 0x666670,
    deco: 'lines',
  },
};

// Pick a random key from an object
function pickRandom(obj) {
  const keys = Object.keys(obj);
  return obj[keys[Math.floor(Math.random() * keys.length)]];
}

// Generate a random battle environment
export function randomEnvironment() {
  return {
    sky: pickRandom(SKY_TYPES),
    ground: pickRandom(GROUND_TYPES),
    time: Math.random() < 0.5 ? TIME_OF_DAY.day : TIME_OF_DAY.night,
  };
}
