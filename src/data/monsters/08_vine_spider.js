import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'vine_spider',

  wild: {
    id: 'vine_spider', name: '덩굴 거미', desc: '냄새나는 덩굴로 거미줄을 치고 먹이를 기다리는 거미',
    img: IMG + 'enemy_glass_moth.png',
    attackPower: 4, tamingThreshold: 58, escapeThreshold: 75,
    sensoryType: ['smell'], personality: 'timid',
    reactions: REACTIONS.timid,
  },

  devo1: [
    {
      id: 'vine_spider_d1_0', name: '꽃거미', desc: '꽃향기 나는 실을 짜서 아군을 보호하는 거미', role: 'tank',
      img: AIMG.tank[0], devolvedImg: AIMG.tank[1],
      hp: 32, maxHp: 32, stats: { gentleness: 2, empathy: 3, resilience: 12, agility: 3 },
      devolvedName: '꽃봉이', devolvedDesc: '등에 작은 꽃봉오리를 달고 다니는 꼬마 거미',
      devolvedStats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['smell-defend', 'smell-stimulate', 'behavior-capture']),
    },
    {
      id: 'vine_spider_d1_1', name: '실뿜이', desc: '빠르게 실을 뿜어 적을 묶는 거미', role: 'speedster',
      img: AIMG.speedster[0], devolvedImg: AIMG.speedster[1],
      hp: 24, maxHp: 24, stats: { gentleness: 4, empathy: 4, resilience: 3, agility: 9 },
      devolvedName: '실뭉치', devolvedDesc: '실을 뭉쳐서 공처럼 데굴데굴 굴러다니는 아기 거미',
      devolvedStats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['smell-stimulate', 'behavior-stimulate', 'smell-capture']),
    },
    {
      id: 'vine_spider_d1_2', name: '약초거미', desc: '거미줄에 약초 성분을 섞어 아군을 치유하는 거미', role: 'support',
      img: AIMG.support[0], devolvedImg: AIMG.support[1],
      hp: 28, maxHp: 28, stats: { gentleness: 3, empathy: 9, resilience: 5, agility: 3 },
      devolvedName: '약콩이', devolvedDesc: '작은 약초 잎을 꼭 안고 있는 동그란 아기 거미',
      devolvedStats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['smell-defend', 'behavior-defend', 'smell-capture']),
    },
  ],

  devo2: [
    { id: 'vine_spider_d2_0', name: '꽃봉이', desc: '등에 작은 꽃봉오리를 달고 다니는 꼬마 거미', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'vine_spider_d1_0' },
    { id: 'vine_spider_d2_1', name: '가시콩', desc: '작은 가시를 세우며 용감하게 으르렁대는 아기 거미', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'vine_spider_d1_0' },
    { id: 'vine_spider_d2_2', name: '실뭉치', desc: '실을 뭉쳐서 공처럼 데굴데굴 굴러다니는 아기 거미', role: 'speedster', hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 }, parentDevo1: 'vine_spider_d1_1' },
    { id: 'vine_spider_d2_3', name: '잎잠이', desc: '나뭇잎 위에서 꾸벅꾸벅 조는 느긋한 아기 거미', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'vine_spider_d1_1' },
    { id: 'vine_spider_d2_4', name: '약콩이', desc: '작은 약초 잎을 꼭 안고 있는 동그란 아기 거미', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'vine_spider_d1_2' },
    { id: 'vine_spider_d2_5', name: '덩굴콩', desc: '짧은 덩굴 다리로 또각또각 걸어다니는 꼬마 거미', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'vine_spider_d1_2' },
  ],
};
