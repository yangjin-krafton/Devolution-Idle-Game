import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'thorn_hedgehog',

  wild: {
    id: 'thorn_hedgehog', name: '가시 고슴도치', desc: '독가시를 세우고 냄새로 영역을 표시하는 고슴도치',
    img: IMG + 'enemy_shadow_cat.png',
    attackPower: 6, tamingThreshold: 72, escapeThreshold: 100,
    sensoryType: ['smell'], personality: 'stubborn',
    habitat: 'forest',
    hp: 32, maxHp: 32, stats: { gentleness: 4, empathy: 3, resilience: 8, agility: 5 },
    wildMechanic: { id: 'thorn_reflect', nameKr: '가시 반사', descKr: '행동 축 자극(물리적 접근) 시 가시에 찔려 자극한 아군이 HP 데미지를 받는다.', trigger: 'on_behavior_stimulate', effect: 'damage_attacker' },
    skills: ['smell-stimulate', 'smell-defend', 'smell-capture'],
    reactions: REACTIONS.stubborn,
  },

  devo1: [
    {
      id: 'thorn_hedgehog_d1_0', name: '꽃가시', desc: '가시 끝에 작은 꽃이 피어난 고슴도치', role: 'tank',
      img: AIMG.tank[0], devolvedImg: AIMG.tank[1],
      hp: 34, maxHp: 34, stats: { gentleness: 3, empathy: 2, resilience: 13, agility: 2 },
      devolvedName: '꽃봉가시', devolvedDesc: '작은 가시에 꽃봉오리가 맺힌 방어형 아기 고슴도치',
      devolvedStats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['smell-defend', 'behavior-defend', 'smell-capture']),
    },
    {
      id: 'thorn_hedgehog_d1_1', name: '향가시', desc: '가시에서 달콤한 향이 나는 고슴도치', role: 'attacker',
      img: AIMG.attacker[0], devolvedImg: AIMG.attacker[1],
      hp: 28, maxHp: 28, stats: { gentleness: 10, empathy: 3, resilience: 5, agility: 2 },
      devolvedName: '달향가시', devolvedDesc: '달콤한 향을 풍기는 공격형 아기 고슴도치',
      devolvedStats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['smell-stimulate', 'temperature-stimulate', 'smell-capture']),
    },
    {
      id: 'thorn_hedgehog_d1_2', name: '약가시', desc: '약초 가시로 아군을 치유하는 고슴도치', role: 'support',
      img: AIMG.support[0], devolvedImg: AIMG.support[1],
      hp: 30, maxHp: 30, stats: { gentleness: 3, empathy: 9, resilience: 6, agility: 2 },
      devolvedName: '약풀가시', devolvedDesc: '가시에서 약효가 나는 치유 전문 아기 고슴도치',
      devolvedStats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['smell-defend', 'smell-stimulate', 'smell-capture']),
    },
  ],

  devo2: [
    { id: 'thorn_hedgehog_d2_0', name: '꽃봉가시', desc: '작은 가시에 꽃봉오리가 맺힌 방어형 아기 고슴도치', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'thorn_hedgehog_d1_0' },
    { id: 'thorn_hedgehog_d2_1', name: '향솔가시', desc: '코를 킁킁거리며 향기를 뿌리는 공격형 아기 고슴도치', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'thorn_hedgehog_d1_0' },
    { id: 'thorn_hedgehog_d2_2', name: '달향가시', desc: '달콤한 향을 풍기는 공격형 아기 고슴도치', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'thorn_hedgehog_d1_1' },
    { id: 'thorn_hedgehog_d2_3', name: '동글가시', desc: '동글게 말려서 방어하는 아기 고슴도치', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'thorn_hedgehog_d1_1' },
    { id: 'thorn_hedgehog_d2_4', name: '약풀가시', desc: '가시에서 약효가 나는 치유 전문 아기 고슴도치', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'thorn_hedgehog_d1_2' },
    { id: 'thorn_hedgehog_d2_5', name: '살랑가시', desc: '살랑살랑 뛰어다니는 빠른 아기 고슴도치', role: 'speedster', hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 }, parentDevo1: 'thorn_hedgehog_d1_2' },
  ],
};
