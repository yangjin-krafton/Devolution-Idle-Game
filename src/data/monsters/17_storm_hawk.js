import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'storm_hawk',

  wild: {
    id: 'storm_hawk', name: '폭풍 매', desc: '날개짓으로 폭풍을 일으키는 하늘의 사냥꾼',
    img: IMG + 'enemy_echo_bat.png',
    attackPower: 6, tamingThreshold: 72, escapeThreshold: 80,
    sensoryType: ['sound', 'temperature'], personality: 'aggressive',
    reactions: REACTIONS.aggressive,
  },

  devo1: [
    {
      id: 'storm_hawk_d1_0', name: '바람매', desc: '부드러운 바람을 일으켜 적을 매혹시키는 매', role: 'attacker',
      img: AIMG.attacker[0], devolvedImg: AIMG.attacker[1],
      hp: 22, maxHp: 22, stats: { gentleness: 10, empathy: 3, resilience: 2, agility: 5 },
      devolvedName: '솔바람병아리', devolvedDesc: '작은 날갯짓으로 미풍을 일으키는 공격형 아기 매',
      devolvedStats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['sound-stimulate', 'temperature-stimulate', 'sound-capture']),
    },
    {
      id: 'storm_hawk_d1_1', name: '급강하매', desc: '번개처럼 빠른 급강하로 적에게 충격을 주는 매', role: 'speedster',
      img: AIMG.speedster[0], devolvedImg: AIMG.speedster[1],
      hp: 20, maxHp: 20, stats: { gentleness: 5, empathy: 3, resilience: 2, agility: 10 },
      devolvedName: '쏜살병아리', devolvedDesc: '짧은 날개로 빠르게 날아다니는 아기 매',
      devolvedStats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['behavior-stimulate', 'sound-stimulate', 'sound-capture']),
    },
    {
      id: 'storm_hawk_d1_2', name: '둥지매', desc: '날개로 아군을 감싸 보호하는 매', role: 'support',
      img: AIMG.support[0], devolvedImg: AIMG.support[1],
      hp: 24, maxHp: 24, stats: { gentleness: 3, empathy: 9, resilience: 4, agility: 4 },
      devolvedName: '구구병아리', devolvedDesc: '구구 소리로 동료를 치유하는 아기 매',
      devolvedStats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['sound-defend', 'temperature-defend', 'sound-capture']),
    },
  ],

  devo2: [
    { id: 'storm_hawk_d2_0', name: '솔바람병아리', desc: '작은 날갯짓으로 미풍을 일으키는 공격형 아기 매', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'storm_hawk_d1_0' },
    { id: 'storm_hawk_d2_1', name: '보금병아리', desc: '작은 날개로 동료를 감싸 보호하는 아기 매', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'storm_hawk_d1_0' },
    { id: 'storm_hawk_d2_2', name: '쏜살병아리', desc: '짧은 날개로 빠르게 날아다니는 아기 매', role: 'speedster', hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 }, parentDevo1: 'storm_hawk_d1_1' },
    { id: 'storm_hawk_d2_3', name: '뭉게병아리', desc: '뭉게구름처럼 푹신한 방어형 아기 매', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'storm_hawk_d1_1' },
    { id: 'storm_hawk_d2_4', name: '구구병아리', desc: '구구 소리로 동료를 치유하는 아기 매', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'storm_hawk_d1_2' },
    { id: 'storm_hawk_d2_5', name: '째깍병아리', desc: '날카로운 울음소리로 적을 놀라게 하는 공격형 아기 매', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'storm_hawk_d1_2' },
  ],
};
