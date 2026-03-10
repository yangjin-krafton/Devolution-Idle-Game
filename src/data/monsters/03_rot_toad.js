import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'rot_toad',

  wild: {
    id: 'rot_toad', name: '썩은향 두꺼비', desc: '독한 냄새를 뿜어 접근하는 모든 것을 내쫓는 거대 두꺼비',
    img: IMG + 'enemy_fog_jellyfish.png',
    attackPower: 7, tamingThreshold: 78, escapeThreshold: 110,
    sensoryType: ['smell'], personality: 'aggressive',
    reactions: REACTIONS.aggressive,
  },

  devo1: [
    {
      id: 'rot_toad_d1_0', name: '향기두꺼비', desc: '독기가 약초 향으로 변한 치유의 두꺼비', role: 'tank',
      img: AIMG.tank[0], devolvedImg: AIMG.tank[1],
      hp: 36, maxHp: 36, stats: { gentleness: 3, empathy: 3, resilience: 12, agility: 2 },
      devolvedName: '약초올챙이', devolvedDesc: '몸에서 약초 향이 솔솔 나는 꼬마 올챙이',
      devolvedStats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['smell-defend', 'smell-stimulate', 'behavior-capture']),
    },
    {
      id: 'rot_toad_d1_1', name: '독안개', desc: '독을 역이용해 적의 도주를 막는 전략가', role: 'support',
      img: AIMG.support[0], devolvedImg: AIMG.support[1],
      hp: 30, maxHp: 30, stats: { gentleness: 4, empathy: 9, resilience: 5, agility: 2 },
      devolvedName: '안개올챙이', devolvedDesc: '작은 안개를 피워 숨바꼭질하는 올챙이',
      devolvedStats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['smell-stimulate', 'smell-defend', 'smell-capture']),
    },
    {
      id: 'rot_toad_d1_2', name: '맹독두꺼비', desc: '강렬한 냄새로 순화도를 급격히 올리는 공격형', role: 'attacker',
      img: AIMG.attacker[0], devolvedImg: AIMG.attacker[1],
      hp: 28, maxHp: 28, stats: { gentleness: 10, empathy: 3, resilience: 5, agility: 2 },
      devolvedName: '독침올챙이', devolvedDesc: '작은 독침으로 용감하게 싸우는 올챙이',
      devolvedStats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['smell-stimulate', 'temperature-stimulate', 'smell-capture']),
    },
  ],

  devo2: [
    { id: 'rot_toad_d2_0', name: '약초올챙이', desc: '몸에서 약초 향이 솔솔 나는 꼬마 올챙이', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'rot_toad_d1_0' },
    { id: 'rot_toad_d2_1', name: '향기올챙이', desc: '달콤한 향기를 뿜어 주변을 치유하는 올챙이', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'rot_toad_d1_0' },
    { id: 'rot_toad_d2_2', name: '안개올챙이', desc: '작은 안개를 피워 숨바꼭질하는 올챙이', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'rot_toad_d1_1' },
    { id: 'rot_toad_d2_3', name: '짙은올챙이', desc: '짙은 안개 속에서 나타나는 신비로운 올챙이', role: 'speedster', hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 }, parentDevo1: 'rot_toad_d1_1' },
    { id: 'rot_toad_d2_4', name: '독침올챙이', desc: '작은 독침으로 용감하게 싸우는 올챙이', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'rot_toad_d1_2' },
    { id: 'rot_toad_d2_5', name: '물웅올챙이', desc: '웅덩이에서 느긋하게 헤엄치는 올챙이', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'rot_toad_d1_2' },
  ],
};
