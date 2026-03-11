import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'howl_wolf',

  wild: {
    id: 'howl_wolf', name: '울부짖는 늑대', desc: '달빛 아래 울부짖으며 음파로 사냥하는 어둠의 늑대',
    img: IMG + 'enemy_abyss_wolf.png',
    attackPower: 7, tamingThreshold: 75, escapeThreshold: 95,
    sensoryType: ['sound'], personality: 'aggressive',
    habitat: 'forest',
    hp: 26, maxHp: 26, stats: { gentleness: 7, empathy: 4, resilience: 4, agility: 5 },
    wildMechanic: { id: 'sonic_buildup', nameKr: '음파 축적', descKr: '매 턴 음파 게이지가 쌓이며, 3턴마다 전체 탈출 게이지가 크게 상승한다. 빠른 순화가 필요하다.', trigger: 'every_3_turns', effect: 'escape_gauge_burst' },
    skills: ['sound-stimulate', 'behavior-defend', 'sound-capture'],
    reactions: REACTIONS.aggressive,
  },

  devo1: [
    {
      id: 'howl_wolf_d1_0', name: '달울림', desc: '울음이 아군을 격려하는 전장의 노래꾼', role: 'attacker',
      img: AIMG.attacker[0], devolvedImg: AIMG.attacker[1],
      hp: 24, maxHp: 24, stats: { gentleness: 12, empathy: 3, resilience: 3, agility: 2 },
      devolvedName: '울림이', devolvedDesc: '작은 입으로 용감하게 울부짖는 꼬마 늑대',
      devolvedStats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['sound-stimulate', 'sound-capture', 'behavior-defend']),
    },
    {
      id: 'howl_wolf_d1_1', name: '수호늑대', desc: '울음소리로 적의 접근을 막는 방어의 늑대', role: 'tank',
      img: AIMG.tank[0], devolvedImg: AIMG.tank[1],
      hp: 32, maxHp: 32, stats: { gentleness: 4, empathy: 3, resilience: 11, agility: 2 },
      devolvedName: '방패냥', devolvedDesc: '작은 몸으로 버티며 아군을 지키는 꼬마 늑대',
      devolvedStats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['sound-defend', 'behavior-defend', 'sound-capture']),
    },
    {
      id: 'howl_wolf_d1_2', name: '질풍늑대', desc: '바람처럼 빠르게 달려 적을 압박하는 늑대', role: 'speedster',
      img: AIMG.speedster[0], devolvedImg: AIMG.speedster[1],
      hp: 20, maxHp: 20, stats: { gentleness: 5, empathy: 4, resilience: 2, agility: 9 },
      devolvedName: '쏜살이', devolvedDesc: '짧은 다리로 후다닥 내달리는 꼬마 늑대',
      devolvedStats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['sound-stimulate', 'behavior-stimulate', 'sound-capture']),
    },
  ],

  devo2: [
    { id: 'howl_wolf_d2_0', name: '울림이', desc: '작은 입으로 용감하게 울부짖는 꼬마 늑대', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'howl_wolf_d1_0' },
    { id: 'howl_wolf_d2_1', name: '자장이', desc: '부드러운 울음으로 주변을 달래는 꼬마 늑대', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'howl_wolf_d1_0' },
    { id: 'howl_wolf_d2_2', name: '방패냥', desc: '작은 몸으로 버티며 아군을 지키는 꼬마 늑대', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'howl_wolf_d1_1' },
    { id: 'howl_wolf_d2_3', name: '메아리', desc: '작은 울음이 멀리까지 울려 퍼지는 꼬마 늑대', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'howl_wolf_d1_1' },
    { id: 'howl_wolf_d2_4', name: '쏜살이', desc: '짧은 다리로 후다닥 내달리는 꼬마 늑대', role: 'speedster', hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 }, parentDevo1: 'howl_wolf_d1_2' },
    { id: 'howl_wolf_d2_5', name: '솔솔이', desc: '가볍게 뛰어다니며 바람을 일으키는 꼬마 늑대', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'howl_wolf_d1_2' },
  ],
};
