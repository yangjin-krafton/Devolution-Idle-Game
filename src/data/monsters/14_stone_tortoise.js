import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'stone_tortoise',

  wild: {
    id: 'stone_tortoise', name: '바위 거북', desc: '등에 이끼가 자란 거대한 고대 거북',
    img: IMG + 'enemy_stone_turtle.png',
    attackPower: 8, tamingThreshold: 82, escapeThreshold: 115,
    sensoryType: ['temperature'], personality: 'stubborn',
    reactions: REACTIONS.stubborn,
  },

  devo1: [
    {
      id: 'stone_tortoise_d1_0', name: '이끼거북', desc: '등의 이끼에서 약초가 자라나는 치유 거북', role: 'tank',
      img: AIMG.tank[0], devolvedImg: AIMG.tank[1],
      hp: 42, maxHp: 42, stats: { gentleness: 2, empathy: 2, resilience: 14, agility: 2 },
      devolvedName: '조약돌거북', devolvedDesc: '작고 둥근 돌등판으로 웅크리는 아기 거북',
      devolvedStats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['temperature-defend', 'smell-defend', 'temperature-capture']),
    },
    {
      id: 'stone_tortoise_d1_1', name: '온천거북', desc: '따뜻한 등에서 치유의 김이 올라오는 거북', role: 'support',
      img: AIMG.support[0], devolvedImg: AIMG.support[1],
      hp: 36, maxHp: 36, stats: { gentleness: 3, empathy: 10, resilience: 5, agility: 2 },
      devolvedName: '김거북', devolvedDesc: '등에서 따뜻한 김이 솔솔 나는 치유 전문 아기 거북',
      devolvedStats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['temperature-defend', 'smell-defend', 'temperature-capture']),
    },
    {
      id: 'stone_tortoise_d1_2', name: '화석거북', desc: '고대의 힘으로 강렬한 소리를 울리는 거북', role: 'attacker',
      img: AIMG.attacker[0], devolvedImg: AIMG.attacker[1],
      hp: 32, maxHp: 32, stats: { gentleness: 10, empathy: 2, resilience: 6, agility: 2 },
      devolvedName: '뼈거북', devolvedDesc: '등판에 작은 화석 무늬가 있는 공격형 아기 거북',
      devolvedStats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['temperature-stimulate', 'sound-stimulate', 'temperature-capture']),
    },
    {
      id: 'stone_tortoise_d1_3', name: '지진거북', desc: '무거운 발걸음으로 지면을 흔드는 거북', role: 'speedster',
      img: AIMG.speedster[0], devolvedImg: AIMG.speedster[1],
      hp: 30, maxHp: 30, stats: { gentleness: 4, empathy: 3, resilience: 4, agility: 9 },
      devolvedName: '달리거북', devolvedDesc: '작은 다리로 지면을 탁탁 치며 달리는 아기 거북',
      devolvedStats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['behavior-stimulate', 'temperature-stimulate', 'behavior-capture']),
    },
  ],

  devo2: [
    { id: 'stone_tortoise_d2_0', name: '조약돌거북', desc: '작고 둥근 돌등판으로 웅크리는 아기 거북', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'stone_tortoise_d1_0' },
    { id: 'stone_tortoise_d2_1', name: '온기거북', desc: '따뜻한 등판에서 김이 나는 치유형 아기 거북', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'stone_tortoise_d1_0' },
    { id: 'stone_tortoise_d2_2', name: '김거북', desc: '등에서 따뜻한 김이 솔솔 나는 치유 전문 아기 거북', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'stone_tortoise_d1_1' },
    { id: 'stone_tortoise_d2_3', name: '쿵거북', desc: '작은 발로 쿵쿵 걸어다니는 활발한 아기 거북', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'stone_tortoise_d1_1' },
    { id: 'stone_tortoise_d2_4', name: '뼈거북', desc: '등판에 작은 화석 무늬가 있는 공격형 아기 거북', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'stone_tortoise_d1_2' },
    { id: 'stone_tortoise_d2_5', name: '총총거북', desc: '작은 다리로 재빠르게 움직이는 아기 거북', role: 'speedster', hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 }, parentDevo1: 'stone_tortoise_d1_2' },
    { id: 'stone_tortoise_d2_6', name: '달리거북', desc: '작은 다리로 지면을 탁탁 치며 달리는 아기 거북', role: 'speedster', hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 }, parentDevo1: 'stone_tortoise_d1_3' },
    { id: 'stone_tortoise_d2_7', name: '방패거북', desc: '작지만 단단한 등판으로 웅크리는 방어형 아기 거북', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'stone_tortoise_d1_3' },
  ],
};
