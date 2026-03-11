import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'rumble_bear',

  wild: {
    id: 'rumble_bear', name: '진동 곰', desc: '발걸음마다 땅이 울리는 거대한 산악 곰',
    img: IMG + 'enemy_abyss_wolf.png',
    attackPower: 8, tamingThreshold: 80, escapeThreshold: 105,
    sensoryType: ['sound', 'behavior'], personality: 'stubborn',
    habitat: 'cave',
    hp: 34, maxHp: 34, stats: { gentleness: 6, empathy: 3, resilience: 6, agility: 5 },
    wildMechanic: { id: 'intimidation_roar', nameKr: '위협 포효', descKr: 'HP가 30% 이하일 때 포효하여 모든 아군의 순화 효율이 1턴간 50% 감소한다.', trigger: 'hp_below_30', effect: 'reduce_all_taming_efficiency' },
    skills: ['sound-stimulate', 'behavior-defend', 'sound-capture'],
    reactions: REACTIONS.stubborn,
  },

  devo1: [
    {
      id: 'rumble_bear_d1_0', name: '북소리곰', desc: '배를 두드려 리듬을 만드는 힘센 곰', role: 'attacker',
      img: AIMG.attacker[0], devolvedImg: AIMG.attacker[1],
      hp: 30, maxHp: 30, stats: { gentleness: 11, empathy: 2, resilience: 5, agility: 2 },
      devolvedName: '톡톡곰', devolvedDesc: '작은 배를 톡톡 두드리며 소리를 내는 아기 곰',
      devolvedStats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['sound-stimulate', 'behavior-stimulate', 'sound-capture']),
    },
    {
      id: 'rumble_bear_d1_1', name: '포옹곰', desc: '따뜻한 포옹으로 아군을 보호하는 곰', role: 'tank',
      img: AIMG.tank[0], devolvedImg: AIMG.tank[1],
      hp: 38, maxHp: 38, stats: { gentleness: 2, empathy: 3, resilience: 13, agility: 2 },
      devolvedName: '안아곰', devolvedDesc: '작은 팔을 벌려 안아주려는 방어형 아기 곰',
      devolvedStats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['behavior-defend', 'sound-defend', 'behavior-capture']),
    },
    {
      id: 'rumble_bear_d1_2', name: '자장곰', desc: '자장가 같은 저음으로 적을 진정시키는 곰', role: 'support',
      img: AIMG.support[0], devolvedImg: AIMG.support[1],
      hp: 32, maxHp: 32, stats: { gentleness: 4, empathy: 10, resilience: 4, agility: 2 },
      devolvedName: '콧노래곰', devolvedDesc: '콧노래를 흥얼거리며 치유하는 아기 곰',
      devolvedStats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['sound-defend', 'behavior-defend', 'sound-capture']),
    },
    {
      id: 'rumble_bear_d1_3', name: '돌진곰', desc: '맹돌진으로 적에게 압도적 존재감을 보여주는 곰', role: 'speedster',
      img: AIMG.speedster[0], devolvedImg: AIMG.speedster[1],
      hp: 26, maxHp: 26, stats: { gentleness: 5, empathy: 3, resilience: 3, agility: 9 },
      devolvedName: '돌진곰아', devolvedDesc: '작은 몸으로 돌진하는 빠른 아기 곰',
      devolvedStats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['behavior-stimulate', 'sound-stimulate', 'behavior-capture']),
    },
  ],

  devo2: [
    { id: 'rumble_bear_d2_0', name: '톡톡곰', desc: '작은 배를 톡톡 두드리며 소리를 내는 아기 곰', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'rumble_bear_d1_0' },
    { id: 'rumble_bear_d2_1', name: '방패곰', desc: '작지만 단단하게 웅크리는 방어형 아기 곰', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'rumble_bear_d1_0' },
    { id: 'rumble_bear_d2_2', name: '안아곰', desc: '작은 팔을 벌려 안아주려는 방어형 아기 곰', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'rumble_bear_d1_1' },
    { id: 'rumble_bear_d2_3', name: '으르렁곰', desc: '작은 입으로 으르렁 소리를 내는 공격형 아기 곰', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'rumble_bear_d1_1' },
    { id: 'rumble_bear_d2_4', name: '콧노래곰', desc: '콧노래를 흥얼거리며 치유하는 아기 곰', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'rumble_bear_d1_2' },
    { id: 'rumble_bear_d2_5', name: '종종곰', desc: '작은 발로 종종 뛰어다니는 빠른 아기 곰', role: 'speedster', hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 }, parentDevo1: 'rumble_bear_d1_2' },
    { id: 'rumble_bear_d2_6', name: '돌진곰아', desc: '작은 몸으로 돌진하는 빠른 아기 곰', role: 'speedster', hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 }, parentDevo1: 'rumble_bear_d1_3' },
    { id: 'rumble_bear_d2_7', name: '노래곰아', desc: '달리면서 콧노래를 흥얼거리는 치유형 아기 곰', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'rumble_bear_d1_3' },
  ],
};
