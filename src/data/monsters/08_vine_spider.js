import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix




export default {
  id: 'vine_spider',

  wild: {
    id: 'vine_spider', name: '덩굴 거미', desc: '냄새나는 덩굴로 거미줄을 치고 먹이를 기다리는 거미',
    img: IMG + 'vine_spider_wild.png',
    attackPower: 4, tamingThreshold: 58, escapeThreshold: 75,
    sensoryType: ['smell'], personality: 'timid',
    habitat: 'forest',
    environmentPreference: {
      temperature: { ideal: 0, tolerance: 1 }, brightness: { ideal: -1, tolerance: 0 },
      smell: { ideal: 1, tolerance: 0 }, humidity: { ideal: 1, tolerance: 1 }, sound: { ideal: -2, tolerance: 0 },
    },
    fleeProfile: { baseGain: 2, mismatchBonus: 1 },
    environmentSkills: [
      { axis: 'smell', delta: -1, log: '덩굴 거미가 꽃가루를 날려 냄새를 흩뜨린다!' },
      { axis: 'sound', delta: 1, log: '덩굴 거미가 줄을 튕기며 소리를 낸다!' },
    ],
    captureRule: { sustainTurns: 3 },
    wildMechanic: { id: 'web_trap', nameKr: '거미줄 속박', descKr: '매 2턴마다 앞 줄 아군 한 마리를 거미줄로 구속해 1턴 행동불가로 만든다.', trigger: 'every_2_turns', effect: 'bind_front_ally' },
    reactions: REACTIONS.timid,
  },

  devo1: [
    {
      id: 'vine_spider_d1_0', name: '꽃거미', desc: '꽃향기 나는 실을 짜서 아군을 보호하는 거미', role: 'tank',
      img: IMG + 'vine_spider_d1_0.png', devolvedImg: IMG + 'vine_spider_d2_0.png',
      devolvedName: '꽃봉이', devolvedDesc: '등에 작은 꽃봉오리를 달고 다니는 꼬마 거미',      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],      skillUnlocks: { 1: ['smell-defend', 'smell-ward', 'smell-capture'], 3: 'smell-reserve', 5: 'smell-mend', 7: 'smell-stimulate', 9: 'smell-sweet' },
      skillPool: ['smell-defend', 'smell-ward', 'smell-reserve', 'smell-mend', 'smell-stimulate', 'smell-capture', 'smell-sweet', 'survey-scent'],
      equipped: ['smell-defend', 'smell-ward', 'smell-capture'],
      actions: makeActions(['smell-defend', 'smell-ward', 'smell-capture']),
    },
    {
      id: 'vine_spider_d1_1', name: '실뿜이', desc: '빠르게 실을 뿜어 적을 묶는 거미', role: 'speedster',
      img: IMG + 'vine_spider_d1_1.png', devolvedImg: IMG + 'vine_spider_d2_2.png',
      devolvedName: '실뭉치', devolvedDesc: '실을 뭉쳐서 공처럼 데굴데굴 굴러다니는 아기 거미',      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],      skillUnlocks: { 1: ['smell-spark', 'smell-stimulate', 'smell-capture'], 3: 'smell-bridge', 5: 'smell-sweep', 7: 'smell-pact', 9: 'smell-defend' },
      skillPool: ['smell-spark', 'smell-bridge', 'smell-stimulate', 'smell-sweep', 'smell-pact', 'smell-capture', 'smell-defend', 'survey-scent'],
      equipped: ['smell-spark', 'smell-stimulate', 'smell-capture'],
      actions: makeActions(['smell-spark', 'smell-stimulate', 'smell-capture']),
    },
    {
      id: 'vine_spider_d1_2', name: '약초거미', desc: '거미줄에 약초 성분을 섞어 아군을 치유하는 거미', role: 'support',
      img: IMG + 'vine_spider_d1_2.png', devolvedImg: IMG + 'vine_spider_d2_4.png',
      devolvedName: '약콩이', devolvedDesc: '작은 약초 잎을 꼭 안고 있는 동그란 아기 거미',      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],      skillUnlocks: { 1: ['smell-sweet', 'smell-sanctuary', 'smell-capture'], 3: 'smell-spiral', 5: 'smell-defend', 7: 'smell-stimulate', 9: 'smell-aroma-wall' },
      skillPool: ['smell-sweet', 'smell-spiral', 'smell-sanctuary', 'smell-defend', 'smell-capture', 'smell-stimulate', 'smell-aroma-wall', 'survey-scent'],
      equipped: ['smell-sweet', 'smell-sanctuary', 'smell-capture'],
      actions: makeActions(['smell-sweet', 'smell-sanctuary', 'smell-capture']),
    },
  ],

  devo2: [
    {
      id: 'vine_spider_d2_0', name: '꽃봉이', desc: '등에 작은 꽃봉오리를 달고 다니는 꼬마 거미', role: 'tank',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['smell-defend', 'smell-ward', 'smell-capture'], 3: 'smell-stimulate', 5: 'smell-reserve' },
      skillPool: ['smell-defend', 'smell-ward', 'smell-stimulate', 'smell-capture', 'smell-reserve'],
      equipped: ['smell-defend', 'smell-ward', 'smell-capture'],
      actions: makeActions(['smell-defend', 'smell-ward', 'smell-capture']),
      parentDevo1: 'vine_spider_d1_0',
    },
    {
      id: 'vine_spider_d2_1', name: '가시콩', desc: '작은 가시를 세우며 용감하게 으르렁대는 아기 거미', role: 'attacker',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['smell-stimulate', 'smell-capture', 'smell-defend'], 3: 'smell-cadence', 5: 'smell-veil' },
      skillPool: ['smell-stimulate', 'smell-cadence', 'smell-capture', 'smell-defend', 'smell-veil'],
      equipped: ['smell-stimulate', 'smell-capture', 'smell-defend'],
      actions: makeActions(['smell-stimulate', 'smell-capture', 'smell-defend']),
      parentDevo1: 'vine_spider_d1_0',
    },
    {
      id: 'vine_spider_d2_2', name: '실뭉치', desc: '실을 뭉쳐서 공처럼 데굴데굴 굴러다니는 아기 거미', role: 'speedster',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['smell-stimulate', 'smell-sweep', 'smell-capture'], 3: 'smell-defend', 5: 'smell-bridge' },
      skillPool: ['smell-stimulate', 'smell-sweep', 'smell-capture', 'smell-defend', 'smell-bridge'],
      equipped: ['smell-stimulate', 'smell-sweep', 'smell-capture'],
      actions: makeActions(['smell-stimulate', 'smell-sweep', 'smell-capture']),
      parentDevo1: 'vine_spider_d1_1',
    },
    {
      id: 'vine_spider_d2_3', name: '잎잠이', desc: '나뭇잎 위에서 꾸벅꾸벅 조는 느긋한 아기 거미', role: 'support',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['smell-hush', 'smell-mend', 'smell-capture'], 3: 'smell-defend', 5: 'smell-stimulate' },
      skillPool: ['smell-hush', 'smell-mend', 'smell-defend', 'smell-capture', 'smell-stimulate'],
      equipped: ['smell-hush', 'smell-mend', 'smell-capture'],
      actions: makeActions(['smell-hush', 'smell-mend', 'smell-capture']),
      parentDevo1: 'vine_spider_d1_1',
    },
    {
      id: 'vine_spider_d2_4', name: '약콩이', desc: '작은 약초 잎을 꼭 안고 있는 동그란 아기 거미', role: 'support',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['smell-hush', 'smell-mend', 'smell-capture'], 3: 'smell-sanctuary', 5: 'smell-stimulate' },
      skillPool: ['smell-hush', 'smell-mend', 'smell-sanctuary', 'smell-capture', 'smell-stimulate'],
      equipped: ['smell-hush', 'smell-mend', 'smell-capture'],
      actions: makeActions(['smell-hush', 'smell-mend', 'smell-capture']),
      parentDevo1: 'vine_spider_d1_2',
    },
    {
      id: 'vine_spider_d2_5', name: '덩굴콩', desc: '짧은 덩굴 다리로 또각또각 걸어다니는 꼬마 거미', role: 'tank',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['smell-defend', 'smell-ward', 'smell-capture'], 3: 'smell-stimulate', 5: 'smell-shelter' },
      skillPool: ['smell-defend', 'smell-ward', 'smell-stimulate', 'smell-capture', 'smell-shelter'],
      equipped: ['smell-defend', 'smell-ward', 'smell-capture'],
      actions: makeActions(['smell-defend', 'smell-ward', 'smell-capture']),
      parentDevo1: 'vine_spider_d1_2',
    },
  ],
};
