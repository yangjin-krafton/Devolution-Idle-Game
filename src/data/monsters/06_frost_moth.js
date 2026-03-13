import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix




export default {
  id: 'frost_moth',

  wild: {
    id: 'frost_moth', name: '서리 나방', desc: '날개에 서리가 내려앉은 투명한 거대 나방',
    img: IMG + 'frost_moth_wild.png',
    attackPower: 3, tamingThreshold: 50, escapeThreshold: 65,
    sensoryType: ['temperature'], personality: 'timid',
    habitat: 'sky',
    environmentPreference: {
      temperature: { ideal: -2, tolerance: 0 }, brightness: { ideal: 1, tolerance: 1 },
      smell: { ideal: 0, tolerance: 1 }, humidity: { ideal: 1, tolerance: 0 }, sound: { ideal: -1, tolerance: 1 },
    },
    fleeProfile: { baseGain: 2, mismatchBonus: 1 },
    environmentSkills: [
      { axis: 'temperature', delta: 2, log: '서리 나방이 날갯짓으로 열기를 일으킨다!' },
      { axis: 'humidity', delta: -1, log: '서리 나방의 인분이 수분을 흡수한다!' },
    ],
    captureRule: { sustainTurns: 3 },
    hp: 22, maxHp: 22, stats: { affinity: 4, empathy: 7, endurance: 5, agility: 4, bond: 3, instinct: 3 },
    wildMechanic: { id: 'frost_barrier', nameKr: '서리 결계', descKr: '순화도가 40% 이상이 되면 서리 방벽을 생성해 다음 자극 1회를 무효화한다.', trigger: 'taming_threshold_40', effect: 'block_next_stimulation' },
    reactions: REACTIONS.timid,
  },

  devo1: [
    {
      id: 'frost_moth_d1_0', name: '눈꽃나방', desc: '서리가 눈꽃으로 변해 아군을 지키는 나방', role: 'support',
      img: IMG + 'frost_moth_d1_0.png', devolvedImg: IMG + 'frost_moth_d2_0.png',
      hp: 24, maxHp: 24, stats: { affinity: 2, empathy: 12, endurance: 3, agility: 3, bond: 3, instinct: 3 },
      devolvedName: '눈송이', devolvedDesc: '작은 눈꽃을 흩뿌리며 아군을 치유하는 꼬마 나방',
      devolvedStats: { affinity: 2, empathy: 7, endurance: 3, agility: 2, bond: 2, instinct: 2 },
      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],
      statGrowth: { affinity: [0, 1], empathy: [1, 3], endurance: [0, 1], agility: [0, 1], bond: [0, 1], instinct: [0, 1] },
      skillUnlocks: { 1: ['temperature-breeze', 'temperature-heal', 'temperature-capture'], 3: 'temperature-bloom', 5: 'temperature-defend', 7: 'temperature-stimulate', 9: 'temperature-shelter' },
      skillPool: ['temperature-breeze', 'temperature-bloom', 'temperature-heal', 'temperature-defend', 'temperature-capture', 'temperature-stimulate', 'temperature-shelter', 'survey-warmth'],
      equipped: ['temperature-breeze', 'temperature-heal', 'survey-warmth'],
      actions: makeActions(['temperature-breeze', 'temperature-heal', 'survey-warmth']),
    },
    {
      id: 'frost_moth_d1_1', name: '얼음나방', desc: '차가운 바람으로 적의 움직임을 늦추는 나방', role: 'tank',
      img: IMG + 'frost_moth_d1_1.png', devolvedImg: IMG + 'frost_moth_d2_2.png',
      hp: 28, maxHp: 28, stats: { affinity: 3, empathy: 4, endurance: 10, agility: 3, bond: 3, instinct: 3 },
      devolvedName: '얼음꼬미', devolvedDesc: '단단한 얼음 껍질로 아군을 지키는 꼬마 나방',
      devolvedStats: { affinity: 2, empathy: 2, endurance: 8, agility: 2, bond: 2, instinct: 2 },
      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],
      statGrowth: { affinity: [0, 1], empathy: [0, 1], endurance: [1, 3], agility: [0, 1], bond: [0, 1], instinct: [0, 1] },
      skillUnlocks: { 1: ['temperature-defend', 'temperature-ward', 'temperature-capture'], 3: 'temperature-reserve', 5: 'temperature-mend', 7: 'temperature-stimulate', 9: 'temperature-mist' },
      skillPool: ['temperature-defend', 'temperature-ward', 'temperature-reserve', 'temperature-mend', 'temperature-stimulate', 'temperature-capture', 'temperature-mist', 'survey-warmth'],
      equipped: ['temperature-defend', 'temperature-ward', 'temperature-capture'],
      actions: makeActions(['temperature-defend', 'temperature-ward', 'temperature-capture']),
    },
  ],

  devo2: [
    {
      id: 'frost_moth_d2_0', name: '눈송이', desc: '작은 눈꽃을 흩뿌리며 아군을 치유하는 꼬마 나방', role: 'support',
      hp: 18, maxHp: 18, stats: { affinity: 2, empathy: 7, endurance: 3, agility: 2, bond: 3, instinct: 3 },
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],
      statGrowth: { affinity: [0, 1], empathy: [1, 2], endurance: [0, 1], agility: [0, 1], bond: [0, 1], instinct: [0, 1] },
      skillUnlocks: { 1: ['temperature-hush', 'temperature-mend', 'temperature-capture'], 3: 'temperature-defend', 5: 'temperature-stimulate' },
      skillPool: ['temperature-hush', 'temperature-mend', 'temperature-defend', 'temperature-capture', 'temperature-stimulate'],
      equipped: ['temperature-hush', 'temperature-mend', 'temperature-capture'],
      actions: makeActions(['temperature-hush', 'temperature-mend', 'temperature-capture']),
      parentDevo1: 'frost_moth_d1_0',
    },
    {
      id: 'frost_moth_d2_1', name: '서늘이', desc: '차가운 바람으로 적의 움직임을 늦추는 꼬마 나방', role: 'speedster',
      hp: 14, maxHp: 14, stats: { affinity: 3, empathy: 2, endurance: 2, agility: 7, bond: 3, instinct: 3 },
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],
      statGrowth: { affinity: [0, 1], empathy: [0, 1], endurance: [0, 1], agility: [1, 2], bond: [0, 1], instinct: [0, 1] },
      skillUnlocks: { 1: ['temperature-stimulate', 'temperature-cadence', 'temperature-capture'], 3: 'temperature-defend', 5: 'temperature-bridge' },
      skillPool: ['temperature-stimulate', 'temperature-cadence', 'temperature-capture', 'temperature-defend', 'temperature-bridge'],
      equipped: ['temperature-stimulate', 'temperature-cadence', 'temperature-capture'],
      actions: makeActions(['temperature-stimulate', 'temperature-cadence', 'temperature-capture']),
      parentDevo1: 'frost_moth_d1_0',
    },
    {
      id: 'frost_moth_d2_2', name: '얼음꼬미', desc: '단단한 얼음 껍질로 아군을 지키는 꼬마 나방', role: 'tank',
      hp: 20, maxHp: 20, stats: { affinity: 2, empathy: 2, endurance: 8, agility: 2, bond: 3, instinct: 3 },
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],
      statGrowth: { affinity: [0, 1], empathy: [0, 1], endurance: [1, 2], agility: [0, 1], bond: [0, 1], instinct: [0, 1] },
      skillUnlocks: { 1: ['temperature-defend', 'temperature-ward', 'temperature-capture'], 3: 'temperature-stimulate', 5: 'temperature-shelter' },
      skillPool: ['temperature-defend', 'temperature-ward', 'temperature-stimulate', 'temperature-capture', 'temperature-shelter'],
      equipped: ['temperature-defend', 'temperature-ward', 'temperature-capture'],
      actions: makeActions(['temperature-defend', 'temperature-ward', 'temperature-capture']),
      parentDevo1: 'frost_moth_d1_1',
    },
    {
      id: 'frost_moth_d2_3', name: '반짝이', desc: '반짝이는 가루를 뿌려 적을 현혹하는 꼬마 나방', role: 'attacker',
      hp: 16, maxHp: 16, stats: { affinity: 7, empathy: 2, endurance: 2, agility: 3, bond: 3, instinct: 3 },
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],
      statGrowth: { affinity: [1, 2], empathy: [0, 1], endurance: [0, 1], agility: [0, 1], bond: [0, 1], instinct: [0, 1] },
      skillUnlocks: { 1: ['temperature-stimulate', 'temperature-capture', 'temperature-defend'], 3: 'temperature-sweep', 5: 'temperature-veil' },
      skillPool: ['temperature-stimulate', 'temperature-sweep', 'temperature-capture', 'temperature-defend', 'temperature-veil'],
      equipped: ['temperature-stimulate', 'temperature-capture', 'temperature-defend'],
      actions: makeActions(['temperature-stimulate', 'temperature-capture', 'temperature-defend']),
      parentDevo1: 'frost_moth_d1_1',
    },
  ],
};
