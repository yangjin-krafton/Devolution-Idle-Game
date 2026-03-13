import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'thorn_hedgehog',

  wild: {
    id: 'thorn_hedgehog', name: '가시 고슴도치', desc: '독가시를 세우고 냄새로 영역을 표시하는 고슴도치',
    img: IMG + 'enemy_shadow_cat.png',
    attackPower: 6, tamingThreshold: 72, escapeThreshold: 100,
    sensoryType: ['smell'], personality: 'stubborn',
    habitat: 'forest',
    environmentPreference: {
      temperature: { ideal: 0, tolerance: 1 }, brightness: { ideal: 0, tolerance: 1 },
      smell: { ideal: 1, tolerance: 0 }, humidity: { ideal: 0, tolerance: 0 }, sound: { ideal: -2, tolerance: 0 },
    },
    fleeProfile: { baseGain: 1, mismatchBonus: 2 },
    environmentSkills: [
      { axis: 'smell', delta: -1, log: '가시 고슴도치가 몸을 떨며 가시가 바람을 가른다!' },
      { axis: 'sound', delta: 2, log: '가시 고슴도치가 뾰족한 가시를 털며 소리가 퍼진다!' },
    ],
    captureRule: { sustainTurns: 3 },
    wildMechanic: { id: 'thorn_reflect', nameKr: '가시 반사', descKr: '행동 축 자극(물리적 접근) 시 가시에 찔려 자극한 아군이 HP 데미지를 받는다.', trigger: 'on_behavior_stimulate', effect: 'damage_attacker' },
    reactions: REACTIONS.stubborn,
  },

  devo1: [
    {
      id: 'thorn_hedgehog_d1_0', name: '꽃가시', desc: '가시 끝에 작은 꽃이 피어난 고슴도치', role: 'tank',
      img: AIMG.tank[0], devolvedImg: AIMG.tank[1],
      devolvedName: '꽃봉가시', devolvedDesc: '작은 가시에 꽃봉오리가 맺힌 방어형 아기 고슴도치',      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],      skillUnlocks: { 1: ['smell-defend', 'smell-ward', 'smell-capture'], 3: 'smell-aroma-wall', 5: 'smell-mend', 7: 'smell-stimulate', 9: 'smell-herb' },
      skillPool: ['smell-defend', 'smell-aroma-wall', 'smell-ward', 'smell-mend', 'smell-stimulate', 'smell-capture', 'smell-herb', 'survey-scent'],
      equipped: ['smell-defend', 'smell-ward', 'smell-capture'],
      actions: makeActions(['smell-defend', 'smell-ward', 'smell-capture']),
    },
    {
      id: 'thorn_hedgehog_d1_1', name: '향가시', desc: '가시에서 달콤한 향이 나는 고슴도치', role: 'attacker',
      img: AIMG.attacker[0], devolvedImg: AIMG.attacker[1],
      devolvedName: '달향가시', devolvedDesc: '달콤한 향을 풍기는 공격형 아기 고슴도치',      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],      skillUnlocks: { 1: ['smell-stimulate', 'smell-trail', 'smell-capture'], 3: 'smell-sweet', 5: 'smell-lure', 7: 'smell-seal', 9: 'smell-defend' },
      skillPool: ['smell-stimulate', 'smell-sweet', 'smell-trail', 'smell-lure', 'smell-capture', 'smell-seal', 'smell-defend', 'survey-scent'],
      equipped: ['smell-stimulate', 'smell-trail', 'smell-capture'],
      actions: makeActions(['smell-stimulate', 'smell-trail', 'smell-capture']),
    },
    {
      id: 'thorn_hedgehog_d1_2', name: '약가시', desc: '약초 가시로 아군을 치유하는 고슴도치', role: 'support',
      img: AIMG.support[0], devolvedImg: AIMG.support[1],
      devolvedName: '약풀가시', devolvedDesc: '가시에서 약효가 나는 치유 전문 아기 고슴도치',      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],      skillUnlocks: { 1: ['smell-herb', 'smell-defend', 'smell-capture'], 3: 'smell-bloom', 5: 'smell-shelter', 7: 'smell-stimulate', 9: 'smell-aroma-wall' },
      skillPool: ['smell-herb', 'smell-bloom', 'smell-defend', 'smell-shelter', 'smell-capture', 'smell-stimulate', 'smell-aroma-wall', 'survey-scent'],
      equipped: ['smell-herb', 'smell-defend', 'smell-capture'],
      actions: makeActions(['smell-herb', 'smell-defend', 'smell-capture']),
    },
  ],

  devo2: [
    {
      id: 'thorn_hedgehog_d2_0', name: '꽃봉가시', desc: '작은 가시에 꽃봉오리가 맺힌 방어형 아기 고슴도치', role: 'tank',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['smell-defend', 'smell-ward', 'smell-capture'], 3: 'smell-stimulate', 5: 'smell-shelter' },
      skillPool: ['smell-defend', 'smell-ward', 'smell-stimulate', 'smell-capture', 'smell-shelter'],
      equipped: ['smell-defend', 'smell-ward', 'smell-capture'],
      actions: makeActions(['smell-defend', 'smell-ward', 'smell-capture']),
      parentDevo1: 'thorn_hedgehog_d1_0',
    },
    {
      id: 'thorn_hedgehog_d2_1', name: '향솔가시', desc: '코를 킁킁거리며 향기를 뿌리는 공격형 아기 고슴도치', role: 'attacker',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['smell-stimulate', 'smell-capture', 'smell-defend'], 3: 'smell-cadence', 5: 'smell-hush' },
      skillPool: ['smell-stimulate', 'smell-cadence', 'smell-capture', 'smell-defend', 'smell-hush'],
      equipped: ['smell-stimulate', 'smell-capture', 'smell-defend'],
      actions: makeActions(['smell-stimulate', 'smell-capture', 'smell-defend']),
      parentDevo1: 'thorn_hedgehog_d1_0',
    },
    {
      id: 'thorn_hedgehog_d2_2', name: '달향가시', desc: '달콤한 향을 풍기는 공격형 아기 고슴도치', role: 'attacker',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['smell-stimulate', 'smell-capture', 'smell-defend'], 3: 'smell-sweep', 5: 'smell-veil' },
      skillPool: ['smell-stimulate', 'smell-sweep', 'smell-capture', 'smell-defend', 'smell-veil'],
      equipped: ['smell-stimulate', 'smell-capture', 'smell-defend'],
      actions: makeActions(['smell-stimulate', 'smell-capture', 'smell-defend']),
      parentDevo1: 'thorn_hedgehog_d1_1',
    },
    {
      id: 'thorn_hedgehog_d2_3', name: '동글가시', desc: '동글게 말려서 방어하는 아기 고슴도치', role: 'tank',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['smell-defend', 'smell-ward', 'smell-capture'], 3: 'smell-stimulate', 5: 'smell-reserve' },
      skillPool: ['smell-defend', 'smell-ward', 'smell-stimulate', 'smell-capture', 'smell-reserve'],
      equipped: ['smell-defend', 'smell-ward', 'smell-capture'],
      actions: makeActions(['smell-defend', 'smell-ward', 'smell-capture']),
      parentDevo1: 'thorn_hedgehog_d1_1',
    },
    {
      id: 'thorn_hedgehog_d2_4', name: '약풀가시', desc: '가시에서 약효가 나는 치유 전문 아기 고슴도치', role: 'support',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['smell-hush', 'smell-mend', 'smell-capture'], 3: 'smell-defend', 5: 'smell-stimulate' },
      skillPool: ['smell-hush', 'smell-defend', 'smell-mend', 'smell-capture', 'smell-stimulate'],
      equipped: ['smell-hush', 'smell-mend', 'smell-capture'],
      actions: makeActions(['smell-hush', 'smell-mend', 'smell-capture']),
      parentDevo1: 'thorn_hedgehog_d1_2',
    },
    {
      id: 'thorn_hedgehog_d2_5', name: '살랑가시', desc: '살랑살랑 뛰어다니는 빠른 아기 고슴도치', role: 'speedster',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['smell-stimulate', 'smell-sweep', 'smell-capture'], 3: 'smell-defend', 5: 'smell-bridge' },
      skillPool: ['smell-stimulate', 'smell-sweep', 'smell-capture', 'smell-defend', 'smell-bridge'],
      equipped: ['smell-stimulate', 'smell-sweep', 'smell-capture'],
      actions: makeActions(['smell-stimulate', 'smell-sweep', 'smell-capture']),
      parentDevo1: 'thorn_hedgehog_d1_2',
    },
  ],
};
