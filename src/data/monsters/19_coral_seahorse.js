import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'coral_seahorse',

  wild: {
    id: 'coral_seahorse', name: '산호 해마', desc: '산호처럼 화려하고 물 온도로 감정을 표현하는 해마',
    img: IMG + 'enemy_fog_jellyfish.png',
    attackPower: 4, tamingThreshold: 52, escapeThreshold: 68,
    sensoryType: ['temperature', 'smell'], personality: 'timid',
    reactions: REACTIONS.timid,
  },

  devo1: [
    {
      id: 'coral_seahorse_d1_0', name: '온도해마', desc: '몸 색깔로 온도를 전달해 적을 매혹시키는 해마', role: 'attacker',
      img: AIMG.attacker[0], devolvedImg: AIMG.attacker[1],
      hp: 20, maxHp: 20, stats: { gentleness: 12, empathy: 3, resilience: 2, agility: 3 },
      devolvedName: '불씨조랑', devolvedDesc: '조그만 몸에서 따끈한 온기가 나오는 꼬마 해마',
      devolvedStats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['temperature-stimulate', 'smell-stimulate', 'temperature-capture']),
    },
    {
      id: 'coral_seahorse_d1_1', name: '치유해마', desc: '따뜻한 물로 아군의 상처를 씻어주는 해마', role: 'support',
      img: AIMG.support[0], devolvedImg: AIMG.support[1],
      hp: 24, maxHp: 24, stats: { gentleness: 3, empathy: 11, resilience: 3, agility: 3 },
      devolvedName: '온기방울', devolvedDesc: '따뜻한 물방울 같은 몸으로 상처를 감싸주는 꼬마 해마',
      devolvedStats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['temperature-defend', 'smell-defend', 'temperature-capture']),
    },
  ],

  devo2: [
    { id: 'coral_seahorse_d2_0', name: '불씨조랑', desc: '조그만 몸에서 따끈한 온기가 나오는 꼬마 해마', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'coral_seahorse_d1_0' },
    { id: 'coral_seahorse_d2_1', name: '파도알', desc: '물속에서 동글동글 떠다니며 향기를 풍기는 꼬마 해마', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'coral_seahorse_d1_0' },
    { id: 'coral_seahorse_d2_2', name: '온기방울', desc: '따뜻한 물방울 같은 몸으로 상처를 감싸주는 꼬마 해마', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'coral_seahorse_d1_1' },
    { id: 'coral_seahorse_d2_3', name: '산호불꽃', desc: '작은 몸에서 뜨거운 산호 빛이 번쩍이는 꼬마 해마', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'coral_seahorse_d1_1' },
  ],
};
