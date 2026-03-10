import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'frost_moth',

  wild: {
    id: 'frost_moth', name: '서리 나방', desc: '날개에 서리가 내려앉은 투명한 거대 나방',
    img: IMG + 'enemy_glass_moth.png',
    attackPower: 3, tamingThreshold: 50, escapeThreshold: 65,
    sensoryType: ['temperature'], personality: 'timid',
    reactions: REACTIONS.timid,
  },

  devo1: [
    {
      id: 'frost_moth_d1_0', name: '눈꽃나방', desc: '서리가 눈꽃으로 변해 아군을 지키는 나방', role: 'support',
      img: AIMG.support[0], devolvedImg: AIMG.support[1],
      hp: 24, maxHp: 24, stats: { gentleness: 2, empathy: 12, resilience: 3, agility: 3 },
      devolvedName: '눈송이', devolvedDesc: '작은 눈꽃을 흩뿌리며 아군을 치유하는 꼬마 나방',
      devolvedStats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['temperature-defend', 'temperature-stimulate', 'behavior-capture']),
    },
    {
      id: 'frost_moth_d1_1', name: '얼음나방', desc: '차가운 바람으로 적의 움직임을 늦추는 나방', role: 'tank',
      img: AIMG.tank[0], devolvedImg: AIMG.tank[1],
      hp: 28, maxHp: 28, stats: { gentleness: 3, empathy: 4, resilience: 10, agility: 3 },
      devolvedName: '얼음꼬미', devolvedDesc: '단단한 얼음 껍질로 아군을 지키는 꼬마 나방',
      devolvedStats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['temperature-defend', 'temperature-stimulate', 'temperature-capture']),
    },
  ],

  devo2: [
    { id: 'frost_moth_d2_0', name: '눈송이', desc: '작은 눈꽃을 흩뿌리며 아군을 치유하는 꼬마 나방', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'frost_moth_d1_0' },
    { id: 'frost_moth_d2_1', name: '서늘이', desc: '차가운 바람으로 적의 움직임을 늦추는 꼬마 나방', role: 'speedster', hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 }, parentDevo1: 'frost_moth_d1_0' },
    { id: 'frost_moth_d2_2', name: '얼음꼬미', desc: '단단한 얼음 껍질로 아군을 지키는 꼬마 나방', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'frost_moth_d1_1' },
    { id: 'frost_moth_d2_3', name: '반짝이', desc: '반짝이는 가루를 뿌려 적을 현혹하는 꼬마 나방', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'frost_moth_d1_1' },
  ],
};
