import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'thunder_eel',

  wild: {
    id: 'thunder_eel', name: '번개 장어', desc: '몸에서 전기를 뿜어 물속 모든 것을 마비시키는 장어',
    img: IMG + 'enemy_dune_stalker.png',
    attackPower: 5, tamingThreshold: 58, escapeThreshold: 72,
    sensoryType: ['sound', 'temperature'], personality: 'timid',
    habitat: 'sea',
    environmentPreference: {
      temperature: { ideal: -1, tolerance: 0 }, brightness: { ideal: 0, tolerance: 1 },
      smell: { ideal: -1, tolerance: 1 }, humidity: { ideal: 2, tolerance: 0 }, sound: { ideal: 1, tolerance: 0 },
    },
    fleeProfile: { baseGain: 2, mismatchBonus: 1 },
    environmentSkills: [
      { axis: 'temperature', delta: 2, log: '번개 장어가 방전하며 주변이 뜨거워진다!' },
      { axis: 'sound', delta: -2, log: '번개 장어가 물속으로 잠겨 소리가 잦아든다!' },
    ],
    captureRule: { sustainTurns: 3 },
    wildMechanic: { id: 'electric_charge', nameKr: '전기 충전', descKr: '3턴간 충전 후 방전하여 전체 아군의 스킬 쿨다운이 +1턴 증가한다.', trigger: 'every_3_turns_charge', effect: 'increase_all_cooldowns' },
    reactions: REACTIONS.timid,
  },

  devo1: [
    {
      id: 'thunder_eel_d1_0', name: '불꽃장어', desc: '전기가 따뜻한 빛으로 변해 아군을 비추는 장어', role: 'attacker',
      img: AIMG.attacker[0], devolvedImg: AIMG.attacker[1],
      devolvedName: '불꽃콩', devolvedDesc: '조그만 몸에서 따끈한 불꽃이 깜빡이는 꼬마 장어',      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],      skillUnlocks: { 1: ['sound-stimulate', 'sound-surge', 'sound-capture'], 3: 'sound-chorus', 5: 'temperature-flare', 7: 'sound-finale', 9: 'temperature-defend' },
      skillPool: ['sound-stimulate', 'sound-chorus', 'sound-surge', 'temperature-flare', 'sound-capture', 'sound-finale', 'temperature-defend', 'survey-sound'],
      equipped: ['sound-stimulate', 'sound-surge', 'sound-capture'],
      actions: makeActions(['sound-stimulate', 'sound-surge', 'sound-capture']),
    },
    {
      id: 'thunder_eel_d1_1', name: '전기뱀장어', desc: '전기 충격으로 적을 놀라게 하는 장어', role: 'speedster',
      img: AIMG.speedster[0], devolvedImg: AIMG.speedster[1],
      devolvedName: '전기올챙', devolvedDesc: '빠르게 헤엄치며 찌릿찌릿 전기를 내뿜는 꼬마 장어',      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],      skillUnlocks: { 1: ['sound-spark', 'sound-stimulate', 'temperature-capture'], 3: 'sound-bridge', 5: 'temperature-sweep', 7: 'sound-pact', 9: 'sound-defend' },
      skillPool: ['sound-spark', 'sound-bridge', 'sound-stimulate', 'temperature-sweep', 'sound-pact', 'temperature-capture', 'sound-defend', 'survey-sound'],
      equipped: ['sound-spark', 'sound-stimulate', 'temperature-capture'],
      actions: makeActions(['sound-spark', 'sound-stimulate', 'temperature-capture']),
    },
    {
      id: 'thunder_eel_d1_2', name: '치유장어', desc: '약한 전류로 아군의 근육을 풀어주는 장어', role: 'support',
      img: AIMG.support[0], devolvedImg: AIMG.support[1],
      devolvedName: '치유방울', devolvedDesc: '약한 전류로 상처를 감싸주는 동글동글한 꼬마 장어',      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],      skillUnlocks: { 1: ['sound-lullaby', 'sound-recover', 'temperature-capture'], 3: 'temperature-spiral', 5: 'temperature-shelter', 7: 'sound-stimulate', 9: 'sound-guard' },
      skillPool: ['sound-lullaby', 'temperature-spiral', 'sound-recover', 'temperature-shelter', 'temperature-capture', 'sound-stimulate', 'sound-guard', 'survey-sound'],
      equipped: ['sound-lullaby', 'sound-recover', 'temperature-capture'],
      actions: makeActions(['sound-lullaby', 'sound-recover', 'temperature-capture']),
    },
  ],

  devo2: [
    {
      id: 'thunder_eel_d2_0', name: '불꽃콩', desc: '조그만 몸에서 따끈한 불꽃이 깜빡이는 꼬마 장어', role: 'attacker',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['sound-stimulate', 'sound-capture', 'temperature-defend'], 3: 'sound-cadence', 5: 'sound-veil' },
      skillPool: ['sound-stimulate', 'sound-cadence', 'sound-capture', 'temperature-defend', 'sound-veil'],
      equipped: ['sound-stimulate', 'sound-capture', 'temperature-defend'],
      actions: makeActions(['sound-stimulate', 'sound-capture', 'temperature-defend']),
      parentDevo1: 'thunder_eel_d1_0',
    },
    {
      id: 'thunder_eel_d2_1', name: '따끈꿈틀', desc: '따뜻한 몸으로 꿈틀거리며 아군을 감싸주는 꼬마 장어', role: 'support',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['temperature-hush', 'sound-mend', 'sound-capture'], 3: 'sound-defend', 5: 'temperature-stimulate' },
      skillPool: ['temperature-hush', 'sound-mend', 'sound-defend', 'sound-capture', 'temperature-stimulate'],
      equipped: ['temperature-hush', 'sound-mend', 'sound-capture'],
      actions: makeActions(['temperature-hush', 'sound-mend', 'sound-capture']),
      parentDevo1: 'thunder_eel_d1_0',
    },
    {
      id: 'thunder_eel_d2_2', name: '전기올챙', desc: '빠르게 헤엄치며 찌릿찌릿 전기를 내뿜는 꼬마 장어', role: 'speedster',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['sound-stimulate', 'sound-sweep', 'temperature-capture'], 3: 'sound-defend', 5: 'sound-tether' },
      skillPool: ['sound-stimulate', 'sound-sweep', 'temperature-capture', 'sound-defend', 'sound-tether'],
      equipped: ['sound-stimulate', 'sound-sweep', 'temperature-capture'],
      actions: makeActions(['sound-stimulate', 'sound-sweep', 'temperature-capture']),
      parentDevo1: 'thunder_eel_d1_1',
    },
    {
      id: 'thunder_eel_d2_3', name: '전기방패', desc: '전기 막으로 아군을 보호하는 꼬마 장어', role: 'tank',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['sound-defend', 'sound-ward', 'temperature-capture'], 3: 'temperature-stimulate', 5: 'sound-shelter' },
      skillPool: ['sound-defend', 'sound-ward', 'temperature-stimulate', 'temperature-capture', 'sound-shelter'],
      equipped: ['sound-defend', 'sound-ward', 'temperature-capture'],
      actions: makeActions(['sound-defend', 'sound-ward', 'temperature-capture']),
      parentDevo1: 'thunder_eel_d1_1',
    },
    {
      id: 'thunder_eel_d2_4', name: '치유방울', desc: '약한 전류로 상처를 감싸주는 동글동글한 꼬마 장어', role: 'support',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['sound-hush', 'temperature-mend', 'temperature-capture'], 3: 'temperature-defend', 5: 'sound-stimulate' },
      skillPool: ['sound-hush', 'temperature-mend', 'temperature-defend', 'temperature-capture', 'sound-stimulate'],
      equipped: ['sound-hush', 'temperature-mend', 'temperature-capture'],
      actions: makeActions(['sound-hush', 'temperature-mend', 'temperature-capture']),
      parentDevo1: 'thunder_eel_d1_2',
    },
    {
      id: 'thunder_eel_d2_5', name: '찌릿톡', desc: '짧은 전기 충격으로 적을 톡톡 자극하는 꼬마 장어', role: 'attacker',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['sound-stimulate', 'temperature-capture', 'sound-defend'], 3: 'temperature-sweep', 5: 'sound-hush' },
      skillPool: ['sound-stimulate', 'temperature-sweep', 'temperature-capture', 'sound-defend', 'sound-hush'],
      equipped: ['sound-stimulate', 'temperature-capture', 'sound-defend'],
      actions: makeActions(['sound-stimulate', 'temperature-capture', 'sound-defend']),
      parentDevo1: 'thunder_eel_d1_2',
    },
  ],
};
