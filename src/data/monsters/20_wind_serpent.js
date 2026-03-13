import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'wind_serpent',

  wild: {
    id: 'wind_serpent', name: '바람 뱀', desc: '바람을 타고 날아다니며 위협적으로 쉿 소리를 내는 뱀',
    img: IMG + 'enemy_dune_stalker.png',
    attackPower: 7, tamingThreshold: 73, escapeThreshold: 85,
    sensoryType: ['behavior', 'sound'], personality: 'aggressive',
    habitat: 'sky',
    environmentPreference: {
      temperature: { ideal: -1, tolerance: 1 }, brightness: { ideal: 1, tolerance: 1 },
      smell: { ideal: 0, tolerance: 1 }, humidity: { ideal: -1, tolerance: 0 }, sound: { ideal: 2, tolerance: 0 },
    },
    fleeProfile: { baseGain: 1, mismatchBonus: 1 },
    environmentSkills: [
      { axis: 'sound', delta: -2, log: '바람 뱀이 공기를 잠재워 적막이 흐른다!' },
      { axis: 'humidity', delta: 2, log: '바람 뱀이 구름을 끌어 습기를 뿌린다!' },
    ],
    captureRule: { sustainTurns: 3 },
    wildMechanic: { id: 'wind_evasion', nameKr: '바람 회피', descKr: '매 턴 첫 번째 자극 시도를 자동 회피한다. 두 번째 자극부터 유효.', trigger: 'first_stimulate_per_turn', effect: 'auto_dodge_first' },
    reactions: REACTIONS.aggressive,
  },

  devo1: [
    {
      id: 'wind_serpent_d1_0', name: '산들뱀', desc: '부드러운 바람 소리를 내며 날아다니는 뱀', role: 'attacker',
      img: AIMG.attacker[0], devolvedImg: AIMG.attacker[1],
      devolvedName: '돌풍이', devolvedDesc: '작은 날개를 퍼덕이며 바람을 일으키는 꼬마 뱀',      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],      skillUnlocks: { 1: ['behavior-stimulate', 'behavior-surge', 'behavior-capture'], 3: 'behavior-play', 5: 'sound-lure', 7: 'behavior-pact', 9: 'sound-defend' },
      skillPool: ['behavior-stimulate', 'behavior-play', 'behavior-surge', 'sound-lure', 'behavior-capture', 'behavior-pact', 'sound-defend', 'survey-gaze'],
      equipped: ['behavior-stimulate', 'behavior-surge', 'behavior-capture'],
      actions: makeActions(['behavior-stimulate', 'behavior-surge', 'behavior-capture']),
    },
    {
      id: 'wind_serpent_d1_1', name: '바람방패', desc: '바람 장벽으로 아군을 보호하는 뱀', role: 'tank',
      img: AIMG.tank[0], devolvedImg: AIMG.tank[1],
      devolvedName: '방패콩', devolvedDesc: '작은 날개로 몸을 감싸 방어하는 꼬마 뱀',      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],      skillUnlocks: { 1: ['behavior-defend', 'behavior-guard', 'behavior-capture'], 3: 'behavior-shelter', 5: 'behavior-mend', 7: 'behavior-stimulate', 9: 'sound-ward' },
      skillPool: ['behavior-defend', 'behavior-guard', 'behavior-shelter', 'behavior-mend', 'behavior-stimulate', 'behavior-capture', 'sound-ward', 'survey-gaze'],
      equipped: ['behavior-defend', 'behavior-guard', 'behavior-capture'],
      actions: makeActions(['behavior-defend', 'behavior-guard', 'behavior-capture']),
    },
    {
      id: 'wind_serpent_d1_2', name: '번개뱀', desc: '번개처럼 빠르게 적을 압박하는 뱀', role: 'speedster',
      img: AIMG.speedster[0], devolvedImg: AIMG.speedster[1],
      devolvedName: '번쩍벌레', devolvedDesc: '몸이 번쩍번쩍 빛나며 빠르게 움직이는 꼬마 뱀',      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],      skillUnlocks: { 1: ['behavior-tether', 'behavior-stimulate', 'sound-capture'], 3: 'behavior-spark', 5: 'sound-sweep', 7: 'behavior-clasp', 9: 'behavior-defend' },
      skillPool: ['behavior-spark', 'behavior-tether', 'behavior-stimulate', 'sound-sweep', 'behavior-clasp', 'sound-capture', 'behavior-defend', 'survey-gaze'],
      equipped: ['behavior-tether', 'behavior-stimulate', 'sound-capture'],
      actions: makeActions(['behavior-tether', 'behavior-stimulate', 'sound-capture']),
    },
  ],

  devo2: [
    {
      id: 'wind_serpent_d2_0', name: '돌풍이', desc: '작은 날개를 퍼덕이며 바람을 일으키는 꼬마 뱀', role: 'attacker',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['behavior-stimulate', 'behavior-capture', 'behavior-defend'], 3: 'behavior-cadence', 5: 'behavior-hush' },
      skillPool: ['behavior-stimulate', 'behavior-cadence', 'behavior-capture', 'behavior-defend', 'behavior-hush'],
      equipped: ['behavior-stimulate', 'behavior-capture', 'behavior-defend'],
      actions: makeActions(['behavior-stimulate', 'behavior-capture', 'behavior-defend']),
      parentDevo1: 'wind_serpent_d1_0',
    },
    {
      id: 'wind_serpent_d2_1', name: '솔솔이', desc: '부드러운 바람으로 아군을 감싸주는 꼬마 뱀', role: 'support',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['behavior-hush', 'behavior-mend', 'behavior-capture'], 3: 'behavior-defend', 5: 'behavior-stimulate' },
      skillPool: ['behavior-hush', 'behavior-mend', 'behavior-defend', 'behavior-capture', 'behavior-stimulate'],
      equipped: ['behavior-hush', 'behavior-mend', 'behavior-capture'],
      actions: makeActions(['behavior-hush', 'behavior-mend', 'behavior-capture']),
      parentDevo1: 'wind_serpent_d1_0',
    },
    {
      id: 'wind_serpent_d2_2', name: '방패콩', desc: '작은 날개로 몸을 감싸 방어하는 꼬마 뱀', role: 'tank',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['behavior-defend', 'behavior-ward', 'behavior-capture'], 3: 'behavior-stimulate', 5: 'behavior-shelter' },
      skillPool: ['behavior-defend', 'behavior-ward', 'behavior-stimulate', 'behavior-capture', 'behavior-shelter'],
      equipped: ['behavior-defend', 'behavior-ward', 'behavior-capture'],
      actions: makeActions(['behavior-defend', 'behavior-ward', 'behavior-capture']),
      parentDevo1: 'wind_serpent_d1_1',
    },
    {
      id: 'wind_serpent_d2_3', name: '찌릿꿈틀', desc: '몸을 꿈틀거리며 전기 바람을 일으키는 꼬마 뱀', role: 'speedster',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['behavior-stimulate', 'behavior-sweep', 'behavior-capture'], 3: 'sound-defend', 5: 'behavior-bridge' },
      skillPool: ['behavior-stimulate', 'behavior-sweep', 'behavior-capture', 'sound-defend', 'behavior-bridge'],
      equipped: ['behavior-stimulate', 'behavior-sweep', 'behavior-capture'],
      actions: makeActions(['behavior-stimulate', 'behavior-sweep', 'behavior-capture']),
      parentDevo1: 'wind_serpent_d1_1',
    },
    {
      id: 'wind_serpent_d2_4', name: '번쩍벌레', desc: '몸이 번쩍번쩍 빛나며 빠르게 움직이는 꼬마 뱀', role: 'speedster',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['behavior-stimulate', 'sound-cadence', 'behavior-capture'], 3: 'behavior-defend', 5: 'behavior-tether' },
      skillPool: ['behavior-stimulate', 'sound-cadence', 'behavior-capture', 'behavior-defend', 'behavior-tether'],
      equipped: ['behavior-stimulate', 'sound-cadence', 'behavior-capture'],
      actions: makeActions(['behavior-stimulate', 'sound-cadence', 'behavior-capture']),
      parentDevo1: 'wind_serpent_d1_2',
    },
    {
      id: 'wind_serpent_d2_5', name: '고요또리', desc: '조용히 또르르 말려있으며 소리로 적을 달래는 꼬마 뱀', role: 'support',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['sound-hush', 'behavior-mend', 'behavior-capture'], 3: 'behavior-defend', 5: 'sound-stimulate' },
      skillPool: ['sound-hush', 'behavior-mend', 'behavior-defend', 'behavior-capture', 'sound-stimulate'],
      equipped: ['sound-hush', 'behavior-mend', 'behavior-capture'],
      actions: makeActions(['sound-hush', 'behavior-mend', 'behavior-capture']),
      parentDevo1: 'wind_serpent_d1_2',
    },
  ],
};
