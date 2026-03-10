import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'iron_boar',

  wild: {
    id: 'iron_boar', name: '강철 멧돼지', desc: '강철처럼 단단한 갈기를 세우고 돌진하는 멧돼지',
    img: IMG + 'enemy_iron_boar.png',
    attackPower: 9, tamingThreshold: 85, escapeThreshold: 120,
    sensoryType: ['smell', 'temperature'], personality: 'stubborn',
    reactions: REACTIONS.stubborn,
  },

  devo1: [
    {
      id: 'iron_boar_d1_0', name: '철등멧돼지', desc: '강철 등으로 아군을 지키는 든든한 방패', role: 'tank',
      img: AIMG.tank[0], devolvedImg: AIMG.tank[1],
      hp: 40, maxHp: 40, stats: { gentleness: 2, empathy: 2, resilience: 14, agility: 2 },
      devolvedName: '자갈돼지', devolvedDesc: '작고 단단한 등판으로 뒹굴며 방어하는 아기 멧돼지',
      devolvedStats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['smell-defend', 'temperature-defend', 'behavior-capture']),
    },
    {
      id: 'iron_boar_d1_1', name: '화염멧돼지', desc: '뜨거운 갈기로 순화도를 올리는 공격형', role: 'attacker',
      img: AIMG.attacker[0], devolvedImg: AIMG.attacker[1],
      hp: 30, maxHp: 30, stats: { gentleness: 11, empathy: 2, resilience: 5, agility: 2 },
      devolvedName: '숯불돼지', devolvedDesc: '등에서 따뜻한 열기가 나는 작은 공격형 아기 멧돼지',
      devolvedStats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['temperature-stimulate', 'smell-stimulate', 'temperature-capture']),
    },
    {
      id: 'iron_boar_d1_2', name: '약초멧돼지', desc: '갈기에서 약초 향이 나는 치유의 멧돼지', role: 'support',
      img: AIMG.support[0], devolvedImg: AIMG.support[1],
      hp: 34, maxHp: 34, stats: { gentleness: 3, empathy: 9, resilience: 6, agility: 2 },
      devolvedName: '풀향돼지', devolvedDesc: '콧등에서 약초 냄새가 나는 치유 전문 아기 멧돼지',
      devolvedStats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['smell-defend', 'temperature-defend', 'smell-capture']),
    },
    {
      id: 'iron_boar_d1_3', name: '돌진멧돼지', desc: '맹렬한 돌진으로 적에게 압박을 주는 멧돼지', role: 'speedster',
      img: AIMG.speedster[0], devolvedImg: AIMG.speedster[1],
      hp: 28, maxHp: 28, stats: { gentleness: 4, empathy: 3, resilience: 4, agility: 9 },
      devolvedName: '번개돼지', devolvedDesc: '짧은 다리로 빠르게 돌진하는 작고 빠른 아기 멧돼지',
      devolvedStats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['behavior-stimulate', 'smell-stimulate', 'behavior-capture']),
    },
  ],

  devo2: [
    { id: 'iron_boar_d2_0', name: '자갈돼지', desc: '작고 단단한 등판으로 뒹굴며 방어하는 아기 멧돼지', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'iron_boar_d1_0' },
    { id: 'iron_boar_d2_1', name: '불꽃돼지', desc: '작은 콧김에서 불씨가 튀는 호기심 많은 아기 멧돼지', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'iron_boar_d1_0' },
    { id: 'iron_boar_d2_2', name: '숯불돼지', desc: '등에서 따뜻한 열기가 나는 작은 공격형 아기 멧돼지', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'iron_boar_d1_1' },
    { id: 'iron_boar_d2_3', name: '쇠잠돼지', desc: '따뜻한 몸으로 아군 곁에서 졸며 치유하는 아기 멧돼지', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'iron_boar_d1_1' },
    { id: 'iron_boar_d2_4', name: '풀향돼지', desc: '콧등에서 약초 냄새가 나는 치유 전문 아기 멧돼지', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'iron_boar_d1_2' },
    { id: 'iron_boar_d2_5', name: '쇠달돼지', desc: '짧은 다리로 총총 뛰어다니는 활발한 아기 멧돼지', role: 'speedster', hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 }, parentDevo1: 'iron_boar_d1_2' },
    { id: 'iron_boar_d2_6', name: '번개돼지', desc: '짧은 다리로 빠르게 돌진하는 작고 빠른 아기 멧돼지', role: 'speedster', hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 }, parentDevo1: 'iron_boar_d1_3' },
    { id: 'iron_boar_d2_7', name: '지킴돼지', desc: '작지만 용감하게 앞을 막아서는 아기 멧돼지', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'iron_boar_d1_3' },
  ],
};
