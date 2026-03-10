import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'ember_salamander',

  wild: {
    id: 'ember_salamander', name: '용암 도롱뇽', desc: '용암 속에서 태어나 온몸에 불꽃이 일렁이는 도롱뇽',
    img: IMG + 'enemy_iron_boar.png',
    attackPower: 8, tamingThreshold: 80, escapeThreshold: 100,
    sensoryType: ['temperature'], personality: 'aggressive',
    reactions: REACTIONS.aggressive,
  },

  devo1: [
    {
      id: 'ember_salamander_d1_0', name: '불씨도롱', desc: '따뜻한 온기를 나누는 작은 불꽃 도롱뇽', role: 'attacker',
      img: AIMG.attacker[0], devolvedImg: AIMG.attacker[1],
      hp: 22, maxHp: 22, stats: { gentleness: 14, empathy: 2, resilience: 2, agility: 2 },
      devolvedName: '불씨애', devolvedDesc: '작은 몸에서 따뜻한 불씨를 피우는 도롱뇽 유생',
      devolvedStats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['temperature-stimulate', 'temperature-capture', 'behavior-defend']),
    },
    {
      id: 'ember_salamander_d1_1', name: '용암방패', desc: '굳은 용암으로 아군을 감싸는 수호 도롱뇽', role: 'tank',
      img: AIMG.tank[0], devolvedImg: AIMG.tank[1],
      hp: 34, maxHp: 34, stats: { gentleness: 3, empathy: 2, resilience: 13, agility: 2 },
      devolvedName: '바위애', devolvedDesc: '단단한 등껍질로 꿋꿋이 버티는 도롱뇽 유생',
      devolvedStats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['temperature-defend', 'smell-defend', 'temperature-capture']),
    },
    {
      id: 'ember_salamander_d1_2', name: '온천도롱', desc: '치유의 온천수를 몸에서 흘리는 도롱뇽', role: 'support',
      img: AIMG.support[0], devolvedImg: AIMG.support[1],
      hp: 26, maxHp: 26, stats: { gentleness: 4, empathy: 10, resilience: 4, agility: 2 },
      devolvedName: '김이애', devolvedDesc: '작은 몸에서 따뜻한 김이 모락모락 피어오르는 유생',
      devolvedStats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['temperature-defend', 'smell-stimulate', 'temperature-capture']),
    },
    {
      id: 'ember_salamander_d1_3', name: '섬광도롱', desc: '불꽃을 순간적으로 터뜨려 적을 놀라게 하는 도롱뇽', role: 'speedster',
      img: AIMG.speedster[0], devolvedImg: AIMG.speedster[1],
      hp: 20, maxHp: 20, stats: { gentleness: 6, empathy: 3, resilience: 2, agility: 9 },
      devolvedName: '번쩍애', devolvedDesc: '작은 몸으로 재빨리 움직이는 도롱뇽 유생',
      devolvedStats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['temperature-stimulate', 'behavior-stimulate', 'temperature-capture']),
    },
  ],

  devo2: [
    { id: 'ember_salamander_d2_0', name: '불씨애', desc: '작은 몸에서 따뜻한 불씨를 피우는 도롱뇽 유생', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'ember_salamander_d1_0' },
    { id: 'ember_salamander_d2_1', name: '온기애', desc: '포근한 온기로 주위를 감싸는 도롱뇽 유생', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'ember_salamander_d1_0' },
    { id: 'ember_salamander_d2_2', name: '바위애', desc: '단단한 등껍질로 꿋꿋이 버티는 도롱뇽 유생', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'ember_salamander_d1_1' },
    { id: 'ember_salamander_d2_3', name: '섬광애', desc: '등 틈새에서 작은 불꽃을 내뿜는 도롱뇽 유생', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'ember_salamander_d1_1' },
    { id: 'ember_salamander_d2_4', name: '김이애', desc: '작은 몸에서 따뜻한 김이 모락모락 피어오르는 유생', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'ember_salamander_d1_2' },
    { id: 'ember_salamander_d2_5', name: '웅덩이애', desc: '작은 물웅덩이에 웅크리고 앉아 온기를 나누는 유생', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'ember_salamander_d1_2' },
    { id: 'ember_salamander_d2_6', name: '번쩍애', desc: '작은 몸으로 재빨리 움직이는 도롱뇽 유생', role: 'speedster', hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 }, parentDevo1: 'ember_salamander_d1_3' },
    { id: 'ember_salamander_d2_7', name: '반딧애', desc: '어둠 속에서 은은하게 빛나는 도롱뇽 유생', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'ember_salamander_d1_3' },
  ],
};
