import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'lava_crab',

  wild: {
    id: 'lava_crab', name: '용암 집게', desc: '뜨거운 집게로 바위를 녹이는 화산 지대의 게',
    img: IMG + 'enemy_iron_boar.png',
    attackPower: 5, tamingThreshold: 60, escapeThreshold: 85,
    sensoryType: ['temperature', 'behavior'], personality: 'curious',
    habitat: 'volcano',
    hp: 34, maxHp: 34, stats: { gentleness: 4, empathy: 4, resilience: 7, agility: 5 },
    wildMechanic: { id: 'molten_shell', nameKr: '용암 껍질', descKr: 'HP가 50% 이하가 되면 방어력이 2배로 증가한다. 온도 축 자극으로만 해제 가능하다.', trigger: 'hp_below_50', effect: 'double_defense_until_temp_stimulate' },
    skills: ['behavior-stimulate', 'temperature-defend', 'temperature-capture'],
    reactions: REACTIONS.curious,
  },

  devo1: [
    {
      id: 'lava_crab_d1_0', name: '온천게', desc: '집게에서 따뜻한 물이 나오는 온화한 게', role: 'tank',
      img: AIMG.tank[0], devolvedImg: AIMG.tank[1],
      hp: 36, maxHp: 36, stats: { gentleness: 2, empathy: 3, resilience: 13, agility: 2 },
      devolvedName: '따끈돌', devolvedDesc: '따끈따끈한 등딱지에서 김이 모락모락 나는 꼬마 게',
      devolvedStats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['temperature-defend', 'behavior-defend', 'temperature-capture']),
    },
    {
      id: 'lava_crab_d1_1', name: '화염집게', desc: '불타는 집게로 강렬한 자극을 주는 게', role: 'attacker',
      img: AIMG.attacker[0], devolvedImg: AIMG.attacker[1],
      hp: 28, maxHp: 28, stats: { gentleness: 10, empathy: 3, resilience: 5, agility: 2 },
      devolvedName: '불씨꼬마', devolvedDesc: '집게에서 작은 불씨를 톡톡 튀기는 아기 게',
      devolvedStats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['temperature-stimulate', 'behavior-stimulate', 'temperature-capture']),
    },
    {
      id: 'lava_crab_d1_2', name: '조력게', desc: '물과 열을 조절해 아군을 돕는 서포터 게', role: 'support',
      img: AIMG.support[0], devolvedImg: AIMG.support[1],
      hp: 30, maxHp: 30, stats: { gentleness: 3, empathy: 9, resilience: 5, agility: 3 },
      devolvedName: '웅덩이', devolvedDesc: '작은 웅덩이를 만들어 그 안에서 쉬는 꼬마 게',
      devolvedStats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['temperature-defend', 'behavior-stimulate', 'temperature-capture']),
    },
  ],

  devo2: [
    { id: 'lava_crab_d2_0', name: '따끈돌', desc: '따끈따끈한 등딱지에서 김이 모락모락 나는 꼬마 게', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'lava_crab_d1_0' },
    { id: 'lava_crab_d2_1', name: '불꽃집게', desc: '작은 집게를 딱딱 부딪혀 불꽃을 만드는 아기 게', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'lava_crab_d1_0' },
    { id: 'lava_crab_d2_2', name: '불씨꼬마', desc: '집게에서 작은 불씨를 톡톡 튀기는 아기 게', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'lava_crab_d1_1' },
    { id: 'lava_crab_d2_3', name: '김단추', desc: '등딱지에서 뿜뿜 김을 내뿜는 동그란 아기 게', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'lava_crab_d1_1' },
    { id: 'lava_crab_d2_4', name: '웅덩이', desc: '작은 웅덩이를 만들어 그 안에서 쉬는 꼬마 게', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'lava_crab_d1_2' },
    { id: 'lava_crab_d2_5', name: '용암알', desc: '용암 속에서 갓 태어난 것처럼 따끈한 동그란 아기 게', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'lava_crab_d1_2' },
  ],
};
