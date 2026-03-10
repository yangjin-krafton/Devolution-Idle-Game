import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'wind_serpent',

  wild: {
    id: 'wind_serpent', name: '바람 뱀', desc: '바람을 타고 날아다니며 위협적으로 쉿 소리를 내는 뱀',
    img: IMG + 'enemy_dune_stalker.png',
    attackPower: 7, tamingThreshold: 73, escapeThreshold: 85,
    sensoryType: ['behavior', 'sound'], personality: 'aggressive',
    reactions: REACTIONS.aggressive,
  },

  devo1: [
    {
      id: 'wind_serpent_d1_0', name: '산들뱀', desc: '부드러운 바람 소리를 내며 날아다니는 뱀', role: 'attacker',
      img: AIMG.attacker[0], devolvedImg: AIMG.attacker[1],
      hp: 22, maxHp: 22, stats: { gentleness: 12, empathy: 3, resilience: 2, agility: 3 },
      devolvedName: '돌풍이', devolvedDesc: '작은 날개를 퍼덕이며 바람을 일으키는 꼬마 뱀',
      devolvedStats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['behavior-stimulate', 'sound-stimulate', 'behavior-capture']),
    },
    {
      id: 'wind_serpent_d1_1', name: '바람방패', desc: '바람 장벽으로 아군을 보호하는 뱀', role: 'tank',
      img: AIMG.tank[0], devolvedImg: AIMG.tank[1],
      hp: 30, maxHp: 30, stats: { gentleness: 3, empathy: 3, resilience: 10, agility: 4 },
      devolvedName: '방패콩', devolvedDesc: '작은 날개로 몸을 감싸 방어하는 꼬마 뱀',
      devolvedStats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['behavior-defend', 'sound-defend', 'behavior-capture']),
    },
    {
      id: 'wind_serpent_d1_2', name: '번개뱀', desc: '번개처럼 빠르게 적을 압박하는 뱀', role: 'speedster',
      img: AIMG.speedster[0], devolvedImg: AIMG.speedster[1],
      hp: 20, maxHp: 20, stats: { gentleness: 5, empathy: 3, resilience: 2, agility: 10 },
      devolvedName: '번쩍벌레', devolvedDesc: '몸이 번쩍번쩍 빛나며 빠르게 움직이는 꼬마 뱀',
      devolvedStats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['sound-stimulate', 'behavior-stimulate', 'sound-capture']),
    },
  ],

  devo2: [
    { id: 'wind_serpent_d2_0', name: '돌풍이', desc: '작은 날개를 퍼덕이며 바람을 일으키는 꼬마 뱀', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'wind_serpent_d1_0' },
    { id: 'wind_serpent_d2_1', name: '솔솔이', desc: '부드러운 바람으로 아군을 감싸주는 꼬마 뱀', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'wind_serpent_d1_0' },
    { id: 'wind_serpent_d2_2', name: '방패콩', desc: '작은 날개로 몸을 감싸 방어하는 꼬마 뱀', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'wind_serpent_d1_1' },
    { id: 'wind_serpent_d2_3', name: '찌릿꿈틀', desc: '몸을 꿈틀거리며 전기 바람을 일으키는 꼬마 뱀', role: 'speedster', hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 }, parentDevo1: 'wind_serpent_d1_1' },
    { id: 'wind_serpent_d2_4', name: '번쩍벌레', desc: '몸이 번쩍번쩍 빛나며 빠르게 움직이는 꼬마 뱀', role: 'speedster', hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 }, parentDevo1: 'wind_serpent_d1_2' },
    { id: 'wind_serpent_d2_5', name: '고요또리', desc: '조용히 또르르 말려있으며 소리로 적을 달래는 꼬마 뱀', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'wind_serpent_d1_2' },
  ],
};
