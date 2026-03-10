import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'crystal_stag',

  wild: {
    id: 'crystal_stag', name: '수정 사슴', desc: '수정 뿔에서 맑은 소리가 울려퍼지는 기품 있는 사슴',
    img: IMG + 'enemy_crystal_deer.png',
    attackPower: 5, tamingThreshold: 65, escapeThreshold: 75,
    sensoryType: ['sound', 'smell'], personality: 'curious',
    reactions: REACTIONS.curious,
  },

  devo1: [
    {
      id: 'crystal_stag_d1_0', name: '종소리사슴', desc: '뿔에서 맑은 종소리가 울려 적을 매혹시키는 사슴', role: 'attacker',
      img: AIMG.attacker[0], devolvedImg: AIMG.attacker[1],
      hp: 24, maxHp: 24, stats: { gentleness: 12, empathy: 3, resilience: 3, agility: 2 },
      devolvedName: '딸랑이', devolvedDesc: '작은 뿔에서 딸랑딸랑 소리를 내는 아기 사슴',
      devolvedStats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['sound-stimulate', 'smell-stimulate', 'sound-capture']),
    },
    {
      id: 'crystal_stag_d1_1', name: '숲지기사슴', desc: '숲의 향기로 아군을 치유하는 수호 사슴', role: 'support',
      img: AIMG.support[0], devolvedImg: AIMG.support[1],
      hp: 26, maxHp: 26, stats: { gentleness: 4, empathy: 10, resilience: 4, agility: 2 },
      devolvedName: '꽃사슴이', devolvedDesc: '이마의 작은 수정꽃에서 은은한 향이 나는 아기 사슴',
      devolvedStats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['smell-defend', 'sound-stimulate', 'smell-capture']),
    },
    {
      id: 'crystal_stag_d1_2', name: '수정갑사슴', desc: '수정 뿔로 아군을 감싸는 방어의 사슴', role: 'tank',
      img: AIMG.tank[0], devolvedImg: AIMG.tank[1],
      hp: 32, maxHp: 32, stats: { gentleness: 3, empathy: 3, resilience: 11, agility: 3 },
      devolvedName: '방패꼬마', devolvedDesc: '이마에 작은 수정 방패를 달고 돌진하는 아기 사슴',
      devolvedStats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['sound-defend', 'smell-defend', 'sound-capture']),
    },
  ],

  devo2: [
    { id: 'crystal_stag_d2_0', name: '딸랑이', desc: '작은 뿔에서 딸랑딸랑 소리를 내는 아기 사슴', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'crystal_stag_d1_0' },
    { id: 'crystal_stag_d2_1', name: '수정솜이', desc: '수정 뿔 대신 동그란 보석 하나를 이마에 달고 있는 꼬마 사슴', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'crystal_stag_d1_0' },
    { id: 'crystal_stag_d2_2', name: '꽃사슴이', desc: '이마의 작은 수정꽃에서 은은한 향이 나는 아기 사슴', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'crystal_stag_d1_1' },
    { id: 'crystal_stag_d2_3', name: '보석깡총', desc: '깡충깡충 뛰어다니며 보석 빛을 흩뿌리는 꼬마 사슴', role: 'speedster', hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 }, parentDevo1: 'crystal_stag_d1_1' },
    { id: 'crystal_stag_d2_4', name: '방패꼬마', desc: '이마에 작은 수정 방패를 달고 돌진하는 아기 사슴', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'crystal_stag_d1_2' },
    { id: 'crystal_stag_d2_5', name: '메아리', desc: '작은 울음소리가 숲에 메아리치는 노래하는 아기 사슴', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'crystal_stag_d1_2' },
  ],
};
