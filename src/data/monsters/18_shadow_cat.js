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
    reactions: REACTIONS.curious,
  },

  devo1: [
    {
      id: 'shadow_cat_d1_0', name: '달빛고양이', desc: '달빛처럼 은은하게 빛나며 빠르게 움직이는 고양이', role: 'speedster',
      img: AIMG.speedster[0], devolvedImg: AIMG.speedster[1],
      hp: 20, maxHp: 20, stats: { gentleness: 3, empathy: 4, resilience: 2, agility: 11 },
      devolvedName: '깜빡냥이', devolvedDesc: '그림자 속에서 깜빡이며 빠르게 움직이는 아기 고양이',
      devolvedStats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['behavior-stimulate', 'temperature-stimulate', 'behavior-capture']),
    },
    {
      id: 'shadow_cat_d1_1', name: '그늘고양이', desc: '그림자에 숨어 아군을 치유하는 고양이', role: 'support',
      img: AIMG.support[0], devolvedImg: AIMG.support[1],
      hp: 24, maxHp: 24, stats: { gentleness: 3, empathy: 10, resilience: 4, agility: 3 },
      devolvedName: '그르렁냥이', devolvedDesc: '그르렁 소리로 동료를 치유하는 아기 고양이',
      devolvedStats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['behavior-defend', 'temperature-defend', 'behavior-capture']),
    },
  ],

  devo2: [
    { id: 'shadow_cat_d2_0', name: '깜빡냥이', desc: '그림자 속에서 깜빡이며 빠르게 움직이는 아기 고양이', role: 'speedster', hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 }, parentDevo1: 'shadow_cat_d1_0' },
    { id: 'shadow_cat_d2_1', name: '속삭냥이', desc: '조용히 다가와 동료를 치유하는 아기 고양이', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'shadow_cat_d1_0' },
    { id: 'shadow_cat_d2_2', name: '그르렁냥이', desc: '그르렁 소리로 동료를 치유하는 아기 고양이', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'shadow_cat_d1_1' },
    { id: 'shadow_cat_d2_3', name: '덮치냥이', desc: '그림자에서 갑자기 튀어나오는 공격형 아기 고양이', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'shadow_cat_d1_1' },
  ],
};
