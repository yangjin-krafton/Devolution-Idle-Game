import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'storm_hawk',

  wild: {
    id: 'storm_hawk', name: '폭풍 매', desc: '날개짓으로 폭풍을 일으키는 하늘의 사냥꾼',
    img: IMG + 'enemy_echo_bat.png',
    attackPower: 6, tamingThreshold: 72, escapeThreshold: 80,
    sensoryType: ['sound', 'temperature'], personality: 'aggressive',
    habitat: 'sky',
    environmentPreference: {
      temperature: { ideal: -1, tolerance: 0 }, brightness: { ideal: 2, tolerance: 0 },
      smell: { ideal: 0, tolerance: 1 }, humidity: { ideal: 1, tolerance: 1 }, sound: { ideal: 1, tolerance: 0 },
    },
    fleeProfile: { baseGain: 1, mismatchBonus: 1 },
    environmentSkills: [
      { axis: 'brightness', delta: -2, log: '폭풍 매가 구름을 몰고 와 하늘이 어두워진다!' },
      { axis: 'sound', delta: -2, log: '폭풍 매가 날갯짓으로 바람을 잠재운다!' },
    ],
    captureRule: { sustainTurns: 3 },
    wildMechanic: { id: 'wind_shift', nameKr: '기류 전환', descKr: '매 2턴마다 유효한 감각축이 바뀐다 (소리↔온도). 상황에 맞춰 전략 변경 필요.', trigger: 'every_2_turns', effect: 'swap_effective_sensory_axis' },
    reactions: REACTIONS.aggressive,
  },

  devo1: [
    {
      id: 'storm_hawk_d1_0', name: '바람매', desc: '부드러운 바람을 일으켜 적을 매혹시키는 매', role: 'attacker',
      img: AIMG.attacker[0], devolvedImg: AIMG.attacker[1],
      devolvedName: '솔바람병아리', devolvedDesc: '작은 날갯짓으로 미풍을 일으키는 공격형 아기 매',      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],      skillUnlocks: { 1: ['sound-stimulate', 'sound-echo-mark', 'sound-capture'], 3: 'sound-pulse', 5: 'temperature-surge', 7: 'sound-snare', 9: 'temperature-defend' },
      skillPool: ['sound-stimulate', 'sound-pulse', 'sound-echo-mark', 'temperature-surge', 'sound-capture', 'sound-snare', 'temperature-defend', 'survey-sound'],
      equipped: ['sound-stimulate', 'sound-echo-mark', 'sound-capture'],
      actions: makeActions(['sound-stimulate', 'sound-echo-mark', 'sound-capture']),
    },
    {
      id: 'storm_hawk_d1_1', name: '급강하매', desc: '번개처럼 빠른 급강하로 적에게 충격을 주는 매', role: 'speedster',
      img: AIMG.speedster[0], devolvedImg: AIMG.speedster[1],
      devolvedName: '쏜살병아리', devolvedDesc: '짧은 날개로 빠르게 날아다니는 아기 매',      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],      skillUnlocks: { 1: ['sound-spark', 'sound-stimulate', 'sound-capture'], 3: 'sound-bridge', 5: 'sound-sweep', 7: 'temperature-clasp', 9: 'temperature-defend' },
      skillPool: ['sound-spark', 'sound-bridge', 'sound-stimulate', 'sound-sweep', 'temperature-clasp', 'sound-capture', 'temperature-defend', 'survey-sound'],
      equipped: ['sound-spark', 'sound-stimulate', 'sound-capture'],
      actions: makeActions(['sound-spark', 'sound-stimulate', 'sound-capture']),
    },
    {
      id: 'storm_hawk_d1_2', name: '둥지매', desc: '날개로 아군을 감싸 보호하는 매', role: 'support',
      img: AIMG.support[0], devolvedImg: AIMG.support[1],
      devolvedName: '구구병아리', devolvedDesc: '구구 소리로 동료를 치유하는 아기 매',      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],      skillUnlocks: { 1: ['sound-lullaby', 'sound-recover', 'sound-capture'], 3: 'sound-bloom', 5: 'temperature-defend', 7: 'sound-stimulate', 9: 'temperature-guard' },
      skillPool: ['sound-lullaby', 'sound-bloom', 'sound-recover', 'temperature-defend', 'sound-capture', 'sound-stimulate', 'temperature-guard', 'survey-sound'],
      equipped: ['sound-lullaby', 'sound-recover', 'sound-capture'],
      actions: makeActions(['sound-lullaby', 'sound-recover', 'sound-capture']),
    },
  ],

  devo2: [
    {
      id: 'storm_hawk_d2_0', name: '솔바람병아리', desc: '작은 날갯짓으로 미풍을 일으키는 공격형 아기 매', role: 'attacker',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['sound-stimulate', 'sound-capture', 'sound-defend'], 3: 'sound-cadence', 5: 'sound-hush' },
      skillPool: ['sound-stimulate', 'sound-cadence', 'sound-capture', 'sound-defend', 'sound-hush'],
      equipped: ['sound-stimulate', 'sound-capture', 'sound-defend'],
      actions: makeActions(['sound-stimulate', 'sound-capture', 'sound-defend']),
      parentDevo1: 'storm_hawk_d1_0',
    },
    {
      id: 'storm_hawk_d2_1', name: '보금병아리', desc: '작은 날개로 동료를 감싸 보호하는 아기 매', role: 'support',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['sound-hush', 'sound-mend', 'sound-capture'], 3: 'sound-defend', 5: 'sound-stimulate' },
      skillPool: ['sound-hush', 'sound-mend', 'sound-defend', 'sound-capture', 'sound-stimulate'],
      equipped: ['sound-hush', 'sound-mend', 'sound-capture'],
      actions: makeActions(['sound-hush', 'sound-mend', 'sound-capture']),
      parentDevo1: 'storm_hawk_d1_0',
    },
    {
      id: 'storm_hawk_d2_2', name: '쏜살병아리', desc: '짧은 날개로 빠르게 날아다니는 아기 매', role: 'speedster',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['sound-stimulate', 'sound-sweep', 'sound-capture'], 3: 'sound-defend', 5: 'sound-tether' },
      skillPool: ['sound-stimulate', 'sound-sweep', 'sound-capture', 'sound-defend', 'sound-tether'],
      equipped: ['sound-stimulate', 'sound-sweep', 'sound-capture'],
      actions: makeActions(['sound-stimulate', 'sound-sweep', 'sound-capture']),
      parentDevo1: 'storm_hawk_d1_1',
    },
    {
      id: 'storm_hawk_d2_3', name: '뭉게병아리', desc: '뭉게구름처럼 푹신한 방어형 아기 매', role: 'tank',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['sound-defend', 'sound-ward', 'sound-capture'], 3: 'sound-stimulate', 5: 'sound-shelter' },
      skillPool: ['sound-defend', 'sound-ward', 'sound-stimulate', 'sound-capture', 'sound-shelter'],
      equipped: ['sound-defend', 'sound-ward', 'sound-capture'],
      actions: makeActions(['sound-defend', 'sound-ward', 'sound-capture']),
      parentDevo1: 'storm_hawk_d1_1',
    },
    {
      id: 'storm_hawk_d2_4', name: '구구병아리', desc: '구구 소리로 동료를 치유하는 아기 매', role: 'support',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['sound-hush', 'sound-mend', 'sound-capture'], 3: 'temperature-defend', 5: 'sound-stimulate' },
      skillPool: ['sound-hush', 'sound-mend', 'temperature-defend', 'sound-capture', 'sound-stimulate'],
      equipped: ['sound-hush', 'sound-mend', 'sound-capture'],
      actions: makeActions(['sound-hush', 'sound-mend', 'sound-capture']),
      parentDevo1: 'storm_hawk_d1_2',
    },
    {
      id: 'storm_hawk_d2_5', name: '째깍병아리', desc: '날카로운 울음소리로 적을 놀라게 하는 공격형 아기 매', role: 'attacker',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['sound-stimulate', 'sound-capture', 'temperature-defend'], 3: 'sound-sweep', 5: 'sound-veil' },
      skillPool: ['sound-stimulate', 'sound-sweep', 'sound-capture', 'temperature-defend', 'sound-veil'],
      equipped: ['sound-stimulate', 'sound-capture', 'temperature-defend'],
      actions: makeActions(['sound-stimulate', 'sound-capture', 'temperature-defend']),
      parentDevo1: 'storm_hawk_d1_2',
    },
  ],
};
