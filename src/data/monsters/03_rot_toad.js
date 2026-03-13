import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix




export default {
  id: 'rot_toad',

  wild: {
    id: 'rot_toad', name: '썩은향 두꺼비', desc: '독한 냄새를 뿜어 접근하는 모든 것을 내쫓는 거대 두꺼비',
    img: IMG + 'rot_toad_wild.png',
    attackPower: 7, tamingThreshold: 78, escapeThreshold: 110,
    sensoryType: ['smell'], personality: 'aggressive',
    habitat: 'swamp',
    environmentPreference: {
      temperature: { ideal: 1, tolerance: 1 }, brightness: { ideal: -1, tolerance: 1 },
      smell: { ideal: 2, tolerance: 0 }, humidity: { ideal: 2, tolerance: 0 }, sound: { ideal: -1, tolerance: 1 },
    },
    fleeProfile: { baseGain: 1, mismatchBonus: 1 },
    environmentSkills: [
      { axis: 'smell', delta: -2, log: '부패 두꺼비가 독기를 내뿜어 냄새가 사라진다!' },
      { axis: 'humidity', delta: -1, log: '부패 두꺼비가 수분을 빨아들인다!' },
    ],
    captureRule: { sustainTurns: 3 },
    wildMechanic: { id: 'toxic_spread', nameKr: '독기 확산', descKr: '매 턴 독 안개가 퍼져 순화도가 소량 감소한다. 냄새 계열 스킬로 독기를 중화할 수 있다.', trigger: 'every_turn', effect: 'taming_gauge_decay' },
    reactions: REACTIONS.aggressive,
  },

  devo1: [
    {
      id: 'rot_toad_d1_0', name: '향기두꺼비', desc: '독기가 약초 향으로 변한 치유의 두꺼비', role: 'tank',
      img: IMG + 'rot_toad_d1_0.png', devolvedImg: IMG + 'rot_toad_d2_0.png',
      devolvedName: '약초올챙이', devolvedDesc: '몸에서 약초 향이 솔솔 나는 꼬마 올챙이',      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],      skillUnlocks: { 1: ['smell-defend', 'smell-aroma-wall', 'smell-capture'], 3: 'smell-shelter', 5: 'smell-mend', 7: 'smell-stimulate', 9: 'smell-herb' },
      skillPool: ['smell-defend', 'smell-aroma-wall', 'smell-shelter', 'smell-mend', 'smell-stimulate', 'smell-capture', 'smell-herb', 'survey-scent'],
      equipped: ['smell-defend', 'smell-aroma-wall', 'survey-scent'],
      actions: makeActions(['smell-defend', 'smell-aroma-wall', 'survey-scent']),
    },
    {
      id: 'rot_toad_d1_1', name: '독안개', desc: '독을 역이용해 적의 도주를 막는 전략가', role: 'support',
      img: IMG + 'rot_toad_d1_1.png', devolvedImg: IMG + 'rot_toad_d2_2.png',
      devolvedName: '안개올챙이', devolvedDesc: '작은 안개를 피워 숨바꼭질하는 올챙이',      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],      skillUnlocks: { 1: ['smell-herb', 'smell-mend', 'smell-capture'], 3: 'smell-bloom', 5: 'smell-defend', 7: 'smell-stimulate', 9: 'smell-sanctuary' },
      skillPool: ['smell-herb', 'smell-bloom', 'smell-mend', 'smell-defend', 'smell-capture', 'smell-stimulate', 'smell-sanctuary', 'survey-scent'],
      equipped: ['smell-herb', 'smell-mend', 'smell-capture'],
      actions: makeActions(['smell-herb', 'smell-mend', 'smell-capture']),
    },
    {
      id: 'rot_toad_d1_2', name: '맹독두꺼비', desc: '강렬한 냄새로 순화도를 급격히 올리는 공격형', role: 'attacker',
      img: IMG + 'rot_toad_d1_2.png', devolvedImg: IMG + 'rot_toad_d2_4.png',
      devolvedName: '독침올챙이', devolvedDesc: '작은 독침으로 용감하게 싸우는 올챙이',      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],      skillUnlocks: { 1: ['smell-stimulate', 'smell-trail', 'smell-capture'], 3: 'smell-spore', 5: 'smell-surge', 7: 'smell-clasp', 9: 'smell-defend' },
      skillPool: ['smell-stimulate', 'smell-spore', 'smell-trail', 'smell-surge', 'smell-capture', 'smell-clasp', 'smell-defend', 'survey-scent'],
      equipped: ['smell-stimulate', 'smell-trail', 'smell-capture'],
      actions: makeActions(['smell-stimulate', 'smell-trail', 'smell-capture']),
    },
  ],

  devo2: [
    {
      id: 'rot_toad_d2_0', name: '약초올챙이', desc: '몸에서 약초 향이 솔솔 나는 꼬마 올챙이', role: 'tank',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['smell-defend', 'smell-ward', 'smell-capture'], 3: 'smell-stimulate', 5: 'smell-shelter' },
      skillPool: ['smell-defend', 'smell-ward', 'smell-stimulate', 'smell-capture', 'smell-shelter'],
      equipped: ['smell-defend', 'smell-ward', 'smell-capture'],
      actions: makeActions(['smell-defend', 'smell-ward', 'smell-capture']),
      parentDevo1: 'rot_toad_d1_0',
    },
    {
      id: 'rot_toad_d2_1', name: '향기올챙이', desc: '달콤한 향기를 뿜어 주변을 치유하는 올챙이', role: 'support',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['smell-hush', 'smell-mend', 'smell-capture'], 3: 'smell-defend', 5: 'smell-stimulate' },
      skillPool: ['smell-hush', 'smell-mend', 'smell-defend', 'smell-capture', 'smell-stimulate'],
      equipped: ['smell-hush', 'smell-mend', 'smell-capture'],
      actions: makeActions(['smell-hush', 'smell-mend', 'smell-capture']),
      parentDevo1: 'rot_toad_d1_0',
    },
    {
      id: 'rot_toad_d2_2', name: '안개올챙이', desc: '작은 안개를 피워 숨바꼭질하는 올챙이', role: 'support',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['smell-hush', 'smell-mend', 'smell-capture'], 3: 'smell-sanctuary', 5: 'smell-stimulate' },
      skillPool: ['smell-hush', 'smell-mend', 'smell-sanctuary', 'smell-capture', 'smell-stimulate'],
      equipped: ['smell-hush', 'smell-mend', 'smell-capture'],
      actions: makeActions(['smell-hush', 'smell-mend', 'smell-capture']),
      parentDevo1: 'rot_toad_d1_1',
    },
    {
      id: 'rot_toad_d2_3', name: '짙은올챙이', desc: '짙은 안개 속에서 나타나는 신비로운 올챙이', role: 'speedster',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['smell-stimulate', 'smell-sweep', 'smell-capture'], 3: 'smell-defend', 5: 'smell-tether' },
      skillPool: ['smell-stimulate', 'smell-sweep', 'smell-capture', 'smell-defend', 'smell-tether'],
      equipped: ['smell-stimulate', 'smell-sweep', 'smell-capture'],
      actions: makeActions(['smell-stimulate', 'smell-sweep', 'smell-capture']),
      parentDevo1: 'rot_toad_d1_1',
    },
    {
      id: 'rot_toad_d2_4', name: '독침올챙이', desc: '작은 독침으로 용감하게 싸우는 올챙이', role: 'attacker',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['smell-stimulate', 'smell-capture', 'smell-defend'], 3: 'smell-cadence', 5: 'smell-veil' },
      skillPool: ['smell-stimulate', 'smell-cadence', 'smell-capture', 'smell-defend', 'smell-veil'],
      equipped: ['smell-stimulate', 'smell-capture', 'smell-defend'],
      actions: makeActions(['smell-stimulate', 'smell-capture', 'smell-defend']),
      parentDevo1: 'rot_toad_d1_2',
    },
    {
      id: 'rot_toad_d2_5', name: '물웅올챙이', desc: '웅덩이에서 느긋하게 헤엄치는 올챙이', role: 'tank',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['smell-defend', 'smell-ward', 'smell-capture'], 3: 'smell-stimulate', 5: 'smell-reserve' },
      skillPool: ['smell-defend', 'smell-ward', 'smell-stimulate', 'smell-capture', 'smell-reserve'],
      equipped: ['smell-defend', 'smell-ward', 'smell-capture'],
      actions: makeActions(['smell-defend', 'smell-ward', 'smell-capture']),
      parentDevo1: 'rot_toad_d1_2',
    },
  ],
};
