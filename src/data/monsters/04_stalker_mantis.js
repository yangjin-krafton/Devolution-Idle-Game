import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'stalker_mantis',

  wild: {
    id: 'stalker_mantis', name: '그림자 사마귀', desc: '소리 없이 접근해 한순간에 덮치는 거대한 사마귀',
    img: IMG + 'enemy_glass_moth.png',
    attackPower: 6, tamingThreshold: 70, escapeThreshold: 80,
    sensoryType: ['behavior'], personality: 'aggressive',
    reactions: REACTIONS.aggressive,
  },

  devo1: [
    {
      id: 'stalker_mantis_d1_0', name: '춤사마귀', desc: '위협 대신 춤으로 소통하는 우아한 사마귀', role: 'speedster',
      img: AIMG.speedster[0], devolvedImg: AIMG.speedster[1],
      hp: 20, maxHp: 20, stats: { gentleness: 3, empathy: 3, resilience: 2, agility: 12 },
      devolvedName: '빙글이', devolvedDesc: '작은 몸으로 빙글빙글 춤추는 꼬마 사마귀',
      devolvedStats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['behavior-stimulate', 'behavior-capture', 'sound-defend']),
    },
    {
      id: 'stalker_mantis_d1_1', name: '꽃사마귀', desc: '꽃잎 같은 팔로 적을 유인하는 사마귀', role: 'attacker',
      img: AIMG.attacker[0], devolvedImg: AIMG.attacker[1],
      hp: 22, maxHp: 22, stats: { gentleness: 10, empathy: 4, resilience: 2, agility: 4 },
      devolvedName: '꽃봉이', devolvedDesc: '작은 꽃잎 팔을 흔들어 적을 유혹하는 꼬마 사마귀',
      devolvedStats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['behavior-stimulate', 'smell-stimulate', 'behavior-capture']),
    },
    {
      id: 'stalker_mantis_d1_2', name: '갑옷사마귀', desc: '단단한 외골격으로 아군을 지키는 사마귀', role: 'tank',
      img: AIMG.tank[0], devolvedImg: AIMG.tank[1],
      hp: 30, maxHp: 30, stats: { gentleness: 3, empathy: 3, resilience: 10, agility: 4 },
      devolvedName: '갑옷꼬미', devolvedDesc: '작은 딱딱한 몸으로 아군을 지키는 꼬마 사마귀',
      devolvedStats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['behavior-defend', 'sound-defend', 'behavior-capture']),
    },
  ],

  devo2: [
    { id: 'stalker_mantis_d2_0', name: '빙글이', desc: '작은 몸으로 빙글빙글 춤추는 꼬마 사마귀', role: 'speedster', hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 }, parentDevo1: 'stalker_mantis_d1_0' },
    { id: 'stalker_mantis_d2_1', name: '지킴이', desc: '작은 팔로 열심히 아군을 지키는 꼬마 사마귀', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'stalker_mantis_d1_0' },
    { id: 'stalker_mantis_d2_2', name: '꽃봉이', desc: '작은 꽃잎 팔을 흔들어 적을 유혹하는 꼬마 사마귀', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'stalker_mantis_d1_1' },
    { id: 'stalker_mantis_d2_3', name: '잎새꼬미', desc: '잎사귀처럼 숨어 아군을 돕는 꼬마 사마귀', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'stalker_mantis_d1_1' },
    { id: 'stalker_mantis_d2_4', name: '갑옷꼬미', desc: '작은 딱딱한 몸으로 아군을 지키는 꼬마 사마귀', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'stalker_mantis_d1_2' },
    { id: 'stalker_mantis_d2_5', name: '싹둑이', desc: '작은 팔을 휘둘러 열심히 싸우는 꼬마 사마귀', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'stalker_mantis_d1_2' },
  ],
};
