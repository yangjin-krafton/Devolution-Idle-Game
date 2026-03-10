import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'moss_golem',

  wild: {
    id: 'moss_golem', name: '이끼 골렘', desc: '오래된 이끼와 바위로 이루어진 거대한 골렘',
    img: IMG + 'enemy_stone_turtle.png',
    attackPower: 7, tamingThreshold: 82, escapeThreshold: 115,
    sensoryType: ['smell', 'sound'], personality: 'stubborn',
    reactions: REACTIONS.stubborn,
  },

  devo1: [
    {
      id: 'moss_golem_d1_0', name: '숲골렘', desc: '이끼에서 새싹이 자라나는 수호의 골렘', role: 'tank',
      img: AIMG.tank[0], devolvedImg: AIMG.tank[1],
      hp: 44, maxHp: 44, stats: { gentleness: 2, empathy: 2, resilience: 14, agility: 2 },
      devolvedName: '숲조약돌', devolvedDesc: '동글동글한 돌 위에 이끼가 자라는 꼬마 골렘',
      devolvedStats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['smell-defend', 'sound-defend', 'smell-capture']),
    },
    {
      id: 'moss_golem_d1_1', name: '울림골렘', desc: '몸을 울려 강한 소리 자극을 주는 골렘', role: 'attacker',
      img: AIMG.attacker[0], devolvedImg: AIMG.attacker[1],
      hp: 36, maxHp: 36, stats: { gentleness: 11, empathy: 2, resilience: 5, agility: 2 },
      devolvedName: '울림알', devolvedDesc: '통통 소리를 내며 굴러다니는 꼬마 골렘',
      devolvedStats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['sound-stimulate', 'smell-stimulate', 'sound-capture']),
    },
    {
      id: 'moss_golem_d1_2', name: '치유골렘', desc: '이끼에서 약효 성분이 스며나오는 골렘', role: 'support',
      img: AIMG.support[0], devolvedImg: AIMG.support[1],
      hp: 38, maxHp: 38, stats: { gentleness: 3, empathy: 9, resilience: 6, agility: 2 },
      devolvedName: '치유솜이끼', devolvedDesc: '동글동글한 이끼 뭉치에서 약효가 퍼지는 꼬마 골렘',
      devolvedStats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['smell-defend', 'sound-defend', 'smell-capture']),
    },
    {
      id: 'moss_golem_d1_3', name: '지진골렘', desc: '무거운 걸음으로 지면을 흔들어 적을 제압하는 골렘', role: 'speedster',
      img: AIMG.speedster[0], devolvedImg: AIMG.speedster[1],
      hp: 32, maxHp: 32, stats: { gentleness: 4, empathy: 3, resilience: 4, agility: 9 },
      devolvedName: '지진콩돌', devolvedDesc: '통통 튀어다니며 땅을 흔드는 꼬마 골렘',
      devolvedStats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['behavior-stimulate', 'sound-stimulate', 'behavior-capture']),
    },
  ],

  devo2: [
    { id: 'moss_golem_d2_0', name: '숲조약돌', desc: '동글동글한 돌 위에 이끼가 자라는 꼬마 골렘', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'moss_golem_d1_0' },
    { id: 'moss_golem_d2_1', name: '수액새싹', desc: '달콤한 수액 향기로 아군을 격려하는 꼬마 골렘', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'moss_golem_d1_0' },
    { id: 'moss_golem_d2_2', name: '울림알', desc: '통통 소리를 내며 굴러다니는 꼬마 골렘', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'moss_golem_d1_1' },
    { id: 'moss_golem_d2_3', name: '이끼자장', desc: '부드러운 울림으로 아군을 편안하게 해주는 꼬마 골렘', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'moss_golem_d1_1' },
    { id: 'moss_golem_d2_4', name: '치유솜이끼', desc: '동글동글한 이끼 뭉치에서 약효가 퍼지는 꼬마 골렘', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'moss_golem_d1_2' },
    { id: 'moss_golem_d2_5', name: '돌멩우르', desc: '작은 몸으로 우르르 굴러가며 적을 자극하는 꼬마 골렘', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'moss_golem_d1_2' },
    { id: 'moss_golem_d2_6', name: '지진콩돌', desc: '통통 튀어다니며 땅을 흔드는 꼬마 골렘', role: 'speedster', hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 }, parentDevo1: 'moss_golem_d1_3' },
    { id: 'moss_golem_d2_7', name: '뿌리닻', desc: '뿌리를 내려 아군을 단단히 보호하는 꼬마 골렘', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'moss_golem_d1_3' },
  ],
};
