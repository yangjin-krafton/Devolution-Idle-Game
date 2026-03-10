import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'swamp_leech',

  wild: {
    id: 'swamp_leech', name: '늪지 거머리', desc: '거대한 몸에서 독한 점액을 흘리는 늪의 포식자',
    img: IMG + 'enemy_fog_jellyfish.png',
    attackPower: 5, tamingThreshold: 75, escapeThreshold: 105,
    sensoryType: ['smell', 'behavior'], personality: 'stubborn',
    reactions: REACTIONS.stubborn,
  },

  devo1: [
    {
      id: 'swamp_leech_d1_0', name: '약초거머리', desc: '점액이 치유 효과를 가진 약초 성분으로 변한 거머리', role: 'support',
      img: AIMG.support[0], devolvedImg: AIMG.support[1],
      hp: 28, maxHp: 28, stats: { gentleness: 2, empathy: 10, resilience: 5, agility: 3 },
      devolvedName: '약초방울', devolvedDesc: '동글동글한 몸에서 약초 향이 나는 꼬마 거머리',
      devolvedStats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['smell-defend', 'behavior-defend', 'smell-capture']),
    },
    {
      id: 'swamp_leech_d1_1', name: '철갑거머리', desc: '단단한 점액이 갑옷이 된 거머리', role: 'tank',
      img: AIMG.tank[0], devolvedImg: AIMG.tank[1],
      hp: 36, maxHp: 36, stats: { gentleness: 2, empathy: 3, resilience: 12, agility: 3 },
      devolvedName: '갑옷알', devolvedDesc: '조그만 몸이 단단한 껍질로 덮인 꼬마 거머리',
      devolvedStats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['behavior-defend', 'smell-defend', 'smell-capture']),
    },
    {
      id: 'swamp_leech_d1_2', name: '흡수거머리', desc: '적의 에너지를 흡수해 순화도를 올리는 거머리', role: 'attacker',
      img: AIMG.attacker[0], devolvedImg: AIMG.attacker[1],
      hp: 26, maxHp: 26, stats: { gentleness: 9, empathy: 4, resilience: 4, agility: 3 },
      devolvedName: '흡수콩', devolvedDesc: '작은 입으로 쪽쪽 에너지를 빨아들이는 꼬마 거머리',
      devolvedStats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['smell-stimulate', 'behavior-stimulate', 'smell-capture']),
    },
  ],

  devo2: [
    { id: 'swamp_leech_d2_0', name: '약초방울', desc: '동글동글한 몸에서 약초 향이 나는 꼬마 거머리', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'swamp_leech_d1_0' },
    { id: 'swamp_leech_d2_1', name: '늪짹짹', desc: '작은 입으로 짹짹 소리를 내며 적을 자극하는 꼬마 거머리', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'swamp_leech_d1_0' },
    { id: 'swamp_leech_d2_2', name: '갑옷알', desc: '조그만 몸이 단단한 껍질로 덮인 꼬마 거머리', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'swamp_leech_d1_1' },
    { id: 'swamp_leech_d2_3', name: '점액싹', desc: '점액을 뿌려 적의 움직임을 방해하는 꼬마 거머리', role: 'speedster', hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 }, parentDevo1: 'swamp_leech_d1_1' },
    { id: 'swamp_leech_d2_4', name: '흡수콩', desc: '작은 입으로 쪽쪽 에너지를 빨아들이는 꼬마 거머리', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'swamp_leech_d1_2' },
    { id: 'swamp_leech_d2_5', name: '진흙포근', desc: '따뜻한 진흙으로 아군을 감싸주는 꼬마 거머리', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'swamp_leech_d1_2' },
  ],
};
