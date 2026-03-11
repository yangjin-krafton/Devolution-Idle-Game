import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'shadow_cat',

  wild: {
    id: 'shadow_cat', name: '그림자 고양이', desc: '그림자처럼 일렁이며 호기심 가득한 눈으로 관찰하는 고양이',
    img: IMG + 'enemy_shadow_cat.png',
    attackPower: 5, tamingThreshold: 55, escapeThreshold: 70,
    sensoryType: ['behavior', 'temperature'], personality: 'curious',
    habitat: 'cave',
    hp: 22, maxHp: 22, stats: { gentleness: 5, empathy: 5, resilience: 3, agility: 7 },
    wildMechanic: { id: 'shadow_leap', nameKr: '그림자 도약', descKr: '탈출 게이지가 50% 이상이면 매 턴 탈출 시도 확률이 2배가 된다. 탈출 게이지 관리 필수.', trigger: 'escape_above_50', effect: 'double_escape_chance' },
    skills: ['behavior-stimulate', 'behavior-defend', 'behavior-capture'],
    reactions: REACTIONS.curious,
  },

  devo1: [
    {
      id: 'shadow_cat_d1_0', name: '달빛고양이', desc: '달빛처럼 은은하게 빛나며 빠르게 움직이는 고양이', role: 'speedster',
      img: AIMG.speedster[0], devolvedImg: AIMG.speedster[1],
      hp: 20, maxHp: 20, stats: { gentleness: 3, empathy: 4, resilience: 2, agility: 11 },
      devolvedName: '깜빡냥이', devolvedDesc: '그림자 속에서 깜빡이며 빠르게 움직이는 아기 고양이',
      devolvedStats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 },
      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],
      statGrowth: { gentleness: [0, 1], empathy: [0, 1], resilience: [0, 1], agility: [1, 3] },
      skillUnlocks: { 1: ['behavior-spark', 'behavior-stimulate', 'behavior-capture'], 3: 'behavior-relay', 5: 'behavior-sweep', 7: 'behavior-clasp', 9: 'behavior-defend' },
      skillPool: ['behavior-spark', 'behavior-relay', 'behavior-stimulate', 'behavior-sweep', 'behavior-clasp', 'behavior-capture', 'behavior-defend'],
      equipped: ['behavior-spark', 'behavior-stimulate', 'behavior-capture'],
      actions: makeActions(['behavior-spark', 'behavior-stimulate', 'behavior-capture']),
    },
    {
      id: 'shadow_cat_d1_1', name: '그늘고양이', desc: '그림자에 숨어 아군을 치유하는 고양이', role: 'support',
      img: AIMG.support[0], devolvedImg: AIMG.support[1],
      hp: 24, maxHp: 24, stats: { gentleness: 3, empathy: 10, resilience: 4, agility: 3 },
      devolvedName: '그르렁냥이', devolvedDesc: '그르렁 소리로 동료를 치유하는 아기 고양이',
      devolvedStats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 },
      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],
      statGrowth: { gentleness: [0, 1], empathy: [1, 3], resilience: [0, 1], agility: [0, 1] },
      skillUnlocks: { 1: ['behavior-bow', 'behavior-guard', 'behavior-capture'], 3: 'behavior-bloom', 5: 'temperature-defend', 7: 'behavior-stimulate', 9: 'behavior-defend' },
      skillPool: ['behavior-bow', 'behavior-bloom', 'behavior-guard', 'temperature-defend', 'behavior-capture', 'behavior-stimulate', 'behavior-defend'],
      equipped: ['behavior-bow', 'behavior-guard', 'behavior-capture'],
      actions: makeActions(['behavior-bow', 'behavior-guard', 'behavior-capture']),
    },
  ],

  devo2: [
    {
      id: 'shadow_cat_d2_0', name: '깜빡냥이', desc: '그림자 속에서 깜빡이며 빠르게 움직이는 아기 고양이', role: 'speedster',
      hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 },
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],
      statGrowth: { gentleness: [0, 1], empathy: [0, 1], resilience: [0, 1], agility: [1, 2] },
      skillUnlocks: { 1: ['behavior-stimulate', 'behavior-sweep', 'behavior-capture'], 3: 'behavior-defend', 5: 'behavior-bridge' },
      skillPool: ['behavior-stimulate', 'behavior-sweep', 'behavior-capture', 'behavior-defend', 'behavior-bridge'],
      equipped: ['behavior-stimulate', 'behavior-sweep', 'behavior-capture'],
      actions: makeActions(['behavior-stimulate', 'behavior-sweep', 'behavior-capture']),
      parentDevo1: 'shadow_cat_d1_0',
    },
    {
      id: 'shadow_cat_d2_1', name: '속삭냥이', desc: '조용히 다가와 동료를 치유하는 아기 고양이', role: 'support',
      hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 },
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],
      statGrowth: { gentleness: [0, 1], empathy: [1, 2], resilience: [0, 1], agility: [0, 1] },
      skillUnlocks: { 1: ['behavior-hush', 'behavior-mend', 'behavior-capture'], 3: 'behavior-defend', 5: 'behavior-stimulate' },
      skillPool: ['behavior-hush', 'behavior-mend', 'behavior-defend', 'behavior-capture', 'behavior-stimulate'],
      equipped: ['behavior-hush', 'behavior-mend', 'behavior-capture'],
      actions: makeActions(['behavior-hush', 'behavior-mend', 'behavior-capture']),
      parentDevo1: 'shadow_cat_d1_0',
    },
    {
      id: 'shadow_cat_d2_2', name: '그르렁냥이', desc: '그르렁 소리로 동료를 치유하는 아기 고양이', role: 'support',
      hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 },
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],
      statGrowth: { gentleness: [0, 1], empathy: [1, 2], resilience: [0, 1], agility: [0, 1] },
      skillUnlocks: { 1: ['behavior-hush', 'behavior-mend', 'behavior-capture'], 3: 'temperature-defend', 5: 'behavior-stimulate' },
      skillPool: ['behavior-hush', 'behavior-mend', 'temperature-defend', 'behavior-capture', 'behavior-stimulate'],
      equipped: ['behavior-hush', 'behavior-mend', 'behavior-capture'],
      actions: makeActions(['behavior-hush', 'behavior-mend', 'behavior-capture']),
      parentDevo1: 'shadow_cat_d1_1',
    },
    {
      id: 'shadow_cat_d2_3', name: '덮치냥이', desc: '그림자에서 갑자기 튀어나오는 공격형 아기 고양이', role: 'attacker',
      hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 },
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],
      statGrowth: { gentleness: [1, 2], empathy: [0, 1], resilience: [0, 1], agility: [0, 1] },
      skillUnlocks: { 1: ['behavior-stimulate', 'behavior-capture', 'behavior-defend'], 3: 'behavior-cadence', 5: 'behavior-veil' },
      skillPool: ['behavior-stimulate', 'behavior-cadence', 'behavior-capture', 'behavior-defend', 'behavior-veil'],
      equipped: ['behavior-stimulate', 'behavior-capture', 'behavior-defend'],
      actions: makeActions(['behavior-stimulate', 'behavior-capture', 'behavior-defend']),
      parentDevo1: 'shadow_cat_d1_1',
    },
  ],
};
