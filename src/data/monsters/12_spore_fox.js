import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix




export default {
  id: 'spore_fox',

  wild: {
    id: 'spore_fox', name: '포자 여우', desc: '꼬리에서 환각 포자를 뿌리며 장난치는 여우',
    img: IMG + 'spore_fox_wild.png',
    attackPower: 4, tamingThreshold: 55, escapeThreshold: 70,
    sensoryType: ['smell', 'behavior'], personality: 'curious',
    habitat: 'forest',
    environmentPreference: {
      temperature: { ideal: 0, tolerance: 1 }, brightness: { ideal: -1, tolerance: 1 },
      smell: { ideal: 2, tolerance: 0 }, humidity: { ideal: 1, tolerance: 0 }, sound: { ideal: -1, tolerance: 1 },
    },
    fleeProfile: { baseGain: 1, mismatchBonus: 1 },
    environmentSkills: [
      { axis: 'smell', delta: -2, log: '포자 여우가 포자를 날려 냄새를 제거한다!' },
      { axis: 'humidity', delta: -1, log: '포자 여우가 주변의 습기를 흡수한다!' },
    ],
    captureRule: { sustainTurns: 3 },
    wildMechanic: { id: 'hallucination_spore', nameKr: '환각 포자', descKr: '무작위로 아군 스킬의 대상을 다른 아군으로 변경시킨다. 예측 불가능한 혼란 유발.', trigger: 'random_chance_30', effect: 'redirect_skill_target' },
    reactions: REACTIONS.curious,
  },

  devo1: [
    {
      id: 'spore_fox_d1_0', name: '향여우', desc: '달콤한 향기로 적의 경계를 풀어버리는 여우', role: 'attacker',
      img: IMG + 'spore_fox_d1_0.png', devolvedImg: IMG + 'spore_fox_d2_0.png',
      devolvedName: '향기꼬마', devolvedDesc: '코를 킁킁거리며 달콤한 향을 뿌리는 아기 여우',      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],      skillUnlocks: { 1: ['smell-stimulate', 'smell-surge', 'smell-capture'], 3: 'smell-sweet', 5: 'behavior-stimulate', 7: 'smell-clasp', 9: 'smell-defend' },
      skillPool: ['smell-stimulate', 'smell-sweet', 'smell-surge', 'behavior-stimulate', 'smell-capture', 'smell-clasp', 'smell-defend', 'survey-scent'],
      equipped: ['smell-stimulate', 'smell-surge', 'smell-capture'],
      actions: makeActions(['smell-stimulate', 'smell-surge', 'smell-capture']),
    },
    {
      id: 'spore_fox_d1_1', name: '안개여우', desc: '포자 안개로 아군을 숨겨주는 여우', role: 'speedster',
      img: IMG + 'spore_fox_d1_1.png', devolvedImg: IMG + 'spore_fox_d2_2.png',
      devolvedName: '안개솜이', devolvedDesc: '보솜보솜한 꼬리에서 안개가 살짝 피어오르는 아기 여우',      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],      skillUnlocks: { 1: ['behavior-spark', 'behavior-stimulate', 'smell-capture'], 3: 'behavior-bridge', 5: 'behavior-sweep', 7: 'smell-pact', 9: 'behavior-defend' },
      skillPool: ['behavior-spark', 'behavior-bridge', 'behavior-stimulate', 'behavior-sweep', 'smell-pact', 'smell-capture', 'behavior-defend', 'survey-scent'],
      equipped: ['behavior-spark', 'behavior-stimulate', 'smell-capture'],
      actions: makeActions(['behavior-spark', 'behavior-stimulate', 'smell-capture']),
    },
  ],

  devo2: [
    {
      id: 'spore_fox_d2_0', name: '향기꼬마', desc: '코를 킁킁거리며 달콤한 향을 뿌리는 아기 여우', role: 'attacker',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['smell-stimulate', 'smell-capture', 'smell-defend'], 3: 'smell-cadence', 5: 'smell-veil' },
      skillPool: ['smell-stimulate', 'smell-cadence', 'smell-capture', 'smell-defend', 'smell-veil'],
      equipped: ['smell-stimulate', 'smell-capture', 'smell-defend'],
      actions: makeActions(['smell-stimulate', 'smell-capture', 'smell-defend']),
      parentDevo1: 'spore_fox_d1_0',
    },
    {
      id: 'spore_fox_d2_1', name: '포자콩', desc: '등에 작은 포자를 하나 달고 뒤뚱뒤뚱 걷는 꼬마 여우', role: 'support',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['behavior-hush', 'behavior-mend', 'behavior-capture'], 3: 'behavior-defend', 5: 'smell-stimulate' },
      skillPool: ['behavior-hush', 'behavior-defend', 'behavior-mend', 'behavior-capture', 'smell-stimulate'],
      equipped: ['behavior-hush', 'behavior-mend', 'behavior-capture'],
      actions: makeActions(['behavior-hush', 'behavior-mend', 'behavior-capture']),
      parentDevo1: 'spore_fox_d1_0',
    },
    {
      id: 'spore_fox_d2_2', name: '안개솜이', desc: '보솜보솜한 꼬리에서 안개가 살짝 피어오르는 아기 여우', role: 'speedster',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['behavior-stimulate', 'behavior-sweep', 'behavior-capture'], 3: 'behavior-defend', 5: 'smell-tether' },
      skillPool: ['behavior-stimulate', 'behavior-sweep', 'behavior-capture', 'behavior-defend', 'smell-tether'],
      equipped: ['behavior-stimulate', 'behavior-sweep', 'behavior-capture'],
      actions: makeActions(['behavior-stimulate', 'behavior-sweep', 'behavior-capture']),
      parentDevo1: 'spore_fox_d1_1',
    },
    {
      id: 'spore_fox_d2_3', name: '버섯단추', desc: '머리 위에 작은 버섯 모자를 쓰고 있는 동그란 아기 여우', role: 'tank',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['smell-defend', 'smell-ward', 'smell-capture'], 3: 'behavior-stimulate', 5: 'smell-shelter' },
      skillPool: ['smell-defend', 'smell-ward', 'behavior-stimulate', 'smell-capture', 'smell-shelter'],
      equipped: ['smell-defend', 'smell-ward', 'smell-capture'],
      actions: makeActions(['smell-defend', 'smell-ward', 'smell-capture']),
      parentDevo1: 'spore_fox_d1_1',
    },
  ],
};
