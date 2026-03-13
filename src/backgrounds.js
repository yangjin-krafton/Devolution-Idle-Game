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

// ============================================================
// 환경 5축 → 배경 매핑
//
// temperature: -2 snow → -1 rain → 0 clear → +1 wind → +2 volcanic
// brightness:  -2 night(deep) → -1 night → 0 day(cloudy) → +1 day → +2 day(bright)
// smell:       -2 rock → -1 sand → 0 grass → +1 swamp → +2 swamp(dense)
// humidity:    -2 sand(dry) → -1 rock → 0 grass → +1 sea → +2 sea+rain
// sound:       조용(-2)→파티클 없음, 시끄러움(+2)→파티클 많음+바람
// ============================================================

const TEMP_SKY = [
  SKY_TYPES.snow,      // -2
  SKY_TYPES.rain,      // -1
  SKY_TYPES.clear,     //  0
  SKY_TYPES.wind,      // +1
  SKY_TYPES.volcanic,  // +2
];

const HUMIDITY_GROUND = [
  GROUND_TYPES.sand,    // -2 건조
  GROUND_TYPES.rock,    // -1
  GROUND_TYPES.grass,   //  0
  GROUND_TYPES.swamp,   // +1
  GROUND_TYPES.sea,     // +2 습함
];

const SMELL_GROUND = [
  GROUND_TYPES.rock,     // -2 무취
  GROUND_TYPES.sand,     // -1
  GROUND_TYPES.grass,    //  0
  GROUND_TYPES.swamp,    // +1
  GROUND_TYPES.swamp,    // +2 강한 냄새
];

function envIdx(val) {
  return Math.max(0, Math.min(4, val + 2));
}

/**
 * 환경 5축 값으로 배경 생성
 * @param {{ temperature:number, brightness:number, smell:number, humidity:number, sound:number }} env
 */
export function environmentToBackground(env) {
  // sky: temperature 기반
  const sky = { ...TEMP_SKY[envIdx(env.temperature)] };

  // ground: humidity 우선, smell 보조 블렌드
  const humGround = HUMIDITY_GROUND[envIdx(env.humidity)];
  const smellGround = SMELL_GROUND[envIdx(env.smell)];
  // humidity가 극단이면 humidity 우선, 아니면 smell과 블렌드
  const ground = Math.abs(env.humidity) >= 2 ? humGround : smellGround;

  // time: brightness 기반
  let time;
  if (env.brightness <= -1) {
    time = { ...TIME_OF_DAY.night };
    // -2면 더 어둡게
    if (env.brightness <= -2) {
      time.alpha = 0.5;
      time.starCount = 40;
    }
  } else {
    time = { ...TIME_OF_DAY.day };
    // +2면 더 밝게 (tint 없음)
    if (env.brightness >= 2) {
      time.alpha = 0;
    }
  }

  // sound: 파티클 강도 조절
  if (sky.particles) {
    const soundMul = Math.max(0.2, (env.sound + 2) / 4); // -2→0.2, +2→1.0
    sky.particles = {
      ...sky.particles,
      count: Math.round(sky.particles.count * soundMul),
      speed: sky.particles.speed * (0.5 + soundMul * 0.5),
    };
  }
  // sound +2이고 파티클 없으면 바람 파티클 추가
  if (!sky.particles && env.sound >= 2) {
    sky.particles = { type: 'leaf', count: 15, color: 0x66aa44, speed: 2.0, size: 4 };
  }
  // sound -2이면 파티클 제거 (고요)
  if (env.sound <= -2) {
    sky.particles = null;
  }

  return { sky, ground, time };
}
