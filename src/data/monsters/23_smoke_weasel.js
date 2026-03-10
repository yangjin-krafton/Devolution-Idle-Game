import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'smoke_weasel',

  wild: {
    id: 'smoke_weasel', name: '연기 족제비', desc: '연기처럼 사라졌다 나타나며 혼란을 주는 족제비',
    img: IMG + 'enemy_shadow_cat.png',
    attackPower: 4, tamingThreshold: 52, escapeThreshold: 65,
    sensoryType: ['behavior'], personality: 'timid',
    reactions: REACTIONS.timid,
  },

  devo1: [
    {
      id: 'smoke_weasel_d1_0', name: '안개족제비', desc: '부드러운 안개로 아군을 숨겨주는 족제비', role: 'speedster',
      img: AIMG.speedster[0], devolvedImg: AIMG.speedster[1],
      hp: 18, maxHp: 18, stats: { gentleness: 3, empathy: 3, resilience: 2, agility: 12 },
      devolvedName: '안개새끼', devolvedDesc: '살금살금 안개 속을 뛰어다니는 꼬마 족제비',
      devolvedStats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['behavior-defend', 'behavior-stimulate', 'behavior-capture']),
    },
    {
      id: 'smoke_weasel_d1_1', name: '그림자족제비', desc: '그림자를 조종해 적을 혼란시키는 족제비', role: 'attacker',
      img: AIMG.attacker[0], devolvedImg: AIMG.attacker[1],
      hp: 20, maxHp: 20, stats: { gentleness: 9, empathy: 4, resilience: 2, agility: 5 },
      devolvedName: '그림자콩', devolvedDesc: '작은 그림자를 만들어 적을 놀라게 하는 꼬마 족제비',
      devolvedStats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['behavior-stimulate', 'temperature-stimulate', 'behavior-capture']),
    },
  ],

  devo2: [
    { id: 'smoke_weasel_d2_0', name: '안개새끼', desc: '살금살금 안개 속을 뛰어다니는 꼬마 족제비', role: 'speedster', hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 }, parentDevo1: 'smoke_weasel_d1_0' },
    { id: 'smoke_weasel_d2_1', name: '안개솜', desc: '부드러운 안개로 아군의 긴장을 풀어주는 꼬마 족제비', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'smoke_weasel_d1_0' },
    { id: 'smoke_weasel_d2_2', name: '그림자콩', desc: '작은 그림자를 만들어 적을 놀라게 하는 꼬마 족제비', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'smoke_weasel_d1_1' },
    { id: 'smoke_weasel_d2_3', name: '불씨잠', desc: '따뜻한 불씨를 안고 꾸벅꾸벅 조는 꼬마 족제비', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'smoke_weasel_d1_1' },
  ],
};
