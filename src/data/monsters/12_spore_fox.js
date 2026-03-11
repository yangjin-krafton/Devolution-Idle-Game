import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'spore_fox',

  wild: {
    id: 'spore_fox', name: '포자 여우', desc: '꼬리에서 환각 포자를 뿌리며 장난치는 여우',
    img: IMG + 'enemy_shadow_cat.png',
    attackPower: 4, tamingThreshold: 55, escapeThreshold: 70,
    sensoryType: ['smell', 'behavior'], personality: 'curious',
    habitat: 'forest',
    hp: 22, maxHp: 22, stats: { gentleness: 6, empathy: 5, resilience: 3, agility: 6 },
    wildMechanic: { id: 'hallucination_spore', nameKr: '환각 포자', descKr: '무작위로 아군 스킬의 대상을 다른 아군으로 변경시킨다. 예측 불가능한 혼란 유발.', trigger: 'random_chance_30', effect: 'redirect_skill_target' },
    skills: ['behavior-stimulate', 'behavior-defend', 'smell-capture'],
    reactions: REACTIONS.curious,
  },

  devo1: [
    {
      id: 'spore_fox_d1_0', name: '향여우', desc: '달콤한 향기로 적의 경계를 풀어버리는 여우', role: 'attacker',
      img: AIMG.attacker[0], devolvedImg: AIMG.attacker[1],
      hp: 22, maxHp: 22, stats: { gentleness: 10, empathy: 3, resilience: 2, agility: 5 },
      devolvedName: '향기꼬마', devolvedDesc: '코를 킁킁거리며 달콤한 향을 뿌리는 아기 여우',
      devolvedStats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 },
      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],
      statGrowth: { gentleness: [1, 3], empathy: [0, 1], resilience: [0, 1], agility: [0, 1] },
      skillUnlocks: { 1: ['smell-stimulate', 'smell-surge', 'smell-capture'], 3: 'smell-sweet', 5: 'behavior-stimulate', 7: 'smell-clasp', 9: 'smell-defend' },
      skillPool: ['smell-stimulate', 'smell-sweet', 'smell-surge', 'behavior-stimulate', 'smell-capture', 'smell-clasp', 'smell-defend'],
      equipped: ['smell-stimulate', 'smell-surge', 'smell-capture'],
      actions: makeActions(['smell-stimulate', 'smell-surge', 'smell-capture']),
    },
    {
      id: 'spore_fox_d1_1', name: '안개여우', desc: '포자 안개로 아군을 숨겨주는 여우', role: 'speedster',
      img: AIMG.speedster[0], devolvedImg: AIMG.speedster[1],
      hp: 20, maxHp: 20, stats: { gentleness: 4, empathy: 4, resilience: 2, agility: 10 },
      devolvedName: '안개솜이', devolvedDesc: '보솜보솜한 꼬리에서 안개가 살짝 피어오르는 아기 여우',
      devolvedStats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 },
      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],
      statGrowth: { gentleness: [0, 1], empathy: [0, 1], resilience: [0, 1], agility: [1, 3] },
      skillUnlocks: { 1: ['behavior-spark', 'behavior-stimulate', 'smell-capture'], 3: 'behavior-bridge', 5: 'behavior-sweep', 7: 'smell-pact', 9: 'behavior-defend' },
      skillPool: ['behavior-spark', 'behavior-bridge', 'behavior-stimulate', 'behavior-sweep', 'smell-pact', 'smell-capture', 'behavior-defend'],
      equipped: ['behavior-spark', 'behavior-stimulate', 'smell-capture'],
      actions: makeActions(['behavior-spark', 'behavior-stimulate', 'smell-capture']),
    },
  ],

  devo2: [
    {
      id: 'spore_fox_d2_0', name: '향기꼬마', desc: '코를 킁킁거리며 달콤한 향을 뿌리는 아기 여우', role: 'attacker',
      hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 },
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],
      statGrowth: { gentleness: [1, 2], empathy: [0, 1], resilience: [0, 1], agility: [0, 1] },
      skillUnlocks: { 1: ['smell-stimulate', 'smell-capture', 'smell-defend'], 3: 'smell-cadence', 5: 'smell-veil' },
      skillPool: ['smell-stimulate', 'smell-cadence', 'smell-capture', 'smell-defend', 'smell-veil'],
      equipped: ['smell-stimulate', 'smell-capture', 'smell-defend'],
      actions: makeActions(['smell-stimulate', 'smell-capture', 'smell-defend']),
      parentDevo1: 'spore_fox_d1_0',
    },
    {
      id: 'spore_fox_d2_1', name: '포자콩', desc: '등에 작은 포자를 하나 달고 뒤뚱뒤뚱 걷는 꼬마 여우', role: 'support',
      hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 },
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],
      statGrowth: { gentleness: [0, 1], empathy: [1, 2], resilience: [0, 1], agility: [0, 1] },
      skillUnlocks: { 1: ['behavior-hush', 'behavior-mend', 'behavior-capture'], 3: 'behavior-defend', 5: 'smell-stimulate' },
      skillPool: ['behavior-hush', 'behavior-defend', 'behavior-mend', 'behavior-capture', 'smell-stimulate'],
      equipped: ['behavior-hush', 'behavior-mend', 'behavior-capture'],
      actions: makeActions(['behavior-hush', 'behavior-mend', 'behavior-capture']),
      parentDevo1: 'spore_fox_d1_0',
    },
    {
      id: 'spore_fox_d2_2', name: '안개솜이', desc: '보솜보솜한 꼬리에서 안개가 살짝 피어오르는 아기 여우', role: 'speedster',
      hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 },
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],
      statGrowth: { gentleness: [0, 1], empathy: [0, 1], resilience: [0, 1], agility: [1, 2] },
      skillUnlocks: { 1: ['behavior-stimulate', 'behavior-sweep', 'behavior-capture'], 3: 'behavior-defend', 5: 'smell-tether' },
      skillPool: ['behavior-stimulate', 'behavior-sweep', 'behavior-capture', 'behavior-defend', 'smell-tether'],
      equipped: ['behavior-stimulate', 'behavior-sweep', 'behavior-capture'],
      actions: makeActions(['behavior-stimulate', 'behavior-sweep', 'behavior-capture']),
      parentDevo1: 'spore_fox_d1_1',
    },
    {
      id: 'spore_fox_d2_3', name: '버섯단추', desc: '머리 위에 작은 버섯 모자를 쓰고 있는 동그란 아기 여우', role: 'tank',
      hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 },
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],
      statGrowth: { gentleness: [0, 1], empathy: [0, 1], resilience: [1, 2], agility: [0, 1] },
      skillUnlocks: { 1: ['smell-defend', 'smell-ward', 'smell-capture'], 3: 'behavior-stimulate', 5: 'smell-shelter' },
      skillPool: ['smell-defend', 'smell-ward', 'behavior-stimulate', 'smell-capture', 'smell-shelter'],
      equipped: ['smell-defend', 'smell-ward', 'smell-capture'],
      actions: makeActions(['smell-defend', 'smell-ward', 'smell-capture']),
      parentDevo1: 'spore_fox_d1_1',
    },
  ],
};
