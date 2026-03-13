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
    habitat: 'sea',
    hp: 20, maxHp: 20, stats: { affinity: 7, empathy: 5, endurance: 3, agility: 5, bond: 3, instinct: 3 },
    wildMechanic: { id: 'tidal_flux', nameKr: '조류 변동', descKr: '매 턴 무작위로 한 감각축의 자극 효과가 1.5배 또는 0.5배가 된다. 운과 적응력 시험.', trigger: 'every_turn_random', effect: 'random_axis_modifier' },
    skills: ['temperature-stimulate', 'temperature-defend', 'temperature-capture'],
    reactions: REACTIONS.timid,
  },

  devo1: [
    {
      id: 'coral_seahorse_d1_0', name: '온도해마', desc: '몸 색깔로 온도를 전달해 적을 매혹시키는 해마', role: 'attacker',
      img: AIMG.attacker[0], devolvedImg: AIMG.attacker[1],
      hp: 20, maxHp: 20, stats: { affinity: 12, empathy: 3, endurance: 2, agility: 3, bond: 3, instinct: 3 },
      devolvedName: '불씨조랑', devolvedDesc: '조그만 몸에서 따끈한 온기가 나오는 꼬마 해마',
      devolvedStats: { affinity: 7, empathy: 2, endurance: 2, agility: 3, bond: 2, instinct: 2 },
      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],
      statGrowth: { affinity: [1, 3], empathy: [0, 1], endurance: [0, 1], agility: [0, 1], bond: [0, 1], instinct: [0, 1] },
      skillUnlocks: { 1: ['temperature-stimulate', 'temperature-overdrive', 'temperature-capture'], 3: 'temperature-flare', 5: 'smell-lure', 7: 'temperature-snare', 9: 'smell-defend' },
      skillPool: ['temperature-stimulate', 'temperature-flare', 'temperature-overdrive', 'smell-lure', 'temperature-capture', 'temperature-snare', 'smell-defend'],
      equipped: ['temperature-stimulate', 'temperature-overdrive', 'temperature-capture'],
      actions: makeActions(['temperature-stimulate', 'temperature-overdrive', 'temperature-capture']),
    },
    {
      id: 'coral_seahorse_d1_1', name: '치유해마', desc: '따뜻한 물로 아군의 상처를 씻어주는 해마', role: 'support',
      img: AIMG.support[0], devolvedImg: AIMG.support[1],
      hp: 24, maxHp: 24, stats: { affinity: 3, empathy: 11, endurance: 3, agility: 3, bond: 3, instinct: 3 },
      devolvedName: '온기방울', devolvedDesc: '따뜻한 물방울 같은 몸으로 상처를 감싸주는 꼬마 해마',
      devolvedStats: { affinity: 2, empathy: 7, endurance: 3, agility: 2, bond: 2, instinct: 2 },
      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],
      statGrowth: { affinity: [0, 1], empathy: [1, 3], endurance: [0, 1], agility: [0, 1], bond: [0, 1], instinct: [0, 1] },
      skillUnlocks: { 1: ['temperature-mist', 'temperature-heal', 'temperature-capture'], 3: 'temperature-bloom', 5: 'smell-defend', 7: 'temperature-stimulate', 9: 'smell-sanctuary' },
      skillPool: ['temperature-mist', 'temperature-bloom', 'temperature-heal', 'smell-defend', 'temperature-capture', 'temperature-stimulate', 'smell-sanctuary'],
      equipped: ['temperature-mist', 'temperature-heal', 'temperature-capture'],
      actions: makeActions(['temperature-mist', 'temperature-heal', 'temperature-capture']),
    },
  ],

  devo2: [
    {
      id: 'coral_seahorse_d2_0', name: '불씨조랑', desc: '조그만 몸에서 따끈한 온기가 나오는 꼬마 해마', role: 'attacker',
      hp: 16, maxHp: 16, stats: { affinity: 7, empathy: 2, endurance: 2, agility: 3, bond: 3, instinct: 3 },
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],
      statGrowth: { affinity: [1, 2], empathy: [0, 1], endurance: [0, 1], agility: [0, 1], bond: [0, 1], instinct: [0, 1] },
      skillUnlocks: { 1: ['temperature-stimulate', 'temperature-capture', 'temperature-defend'], 3: 'temperature-cadence', 5: 'temperature-veil' },
      skillPool: ['temperature-stimulate', 'temperature-cadence', 'temperature-capture', 'temperature-defend', 'temperature-veil'],
      equipped: ['temperature-stimulate', 'temperature-capture', 'temperature-defend'],
      actions: makeActions(['temperature-stimulate', 'temperature-capture', 'temperature-defend']),
      parentDevo1: 'coral_seahorse_d1_0',
    },
    {
      id: 'coral_seahorse_d2_1', name: '파도알', desc: '물속에서 동글동글 떠다니며 향기를 풍기는 꼬마 해마', role: 'support',
      hp: 18, maxHp: 18, stats: { affinity: 2, empathy: 7, endurance: 3, agility: 2, bond: 3, instinct: 3 },
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],
      statGrowth: { affinity: [0, 1], empathy: [1, 2], endurance: [0, 1], agility: [0, 1], bond: [0, 1], instinct: [0, 1] },
      skillUnlocks: { 1: ['temperature-hush', 'temperature-mend', 'temperature-capture'], 3: 'smell-defend', 5: 'temperature-stimulate' },
      skillPool: ['temperature-hush', 'temperature-mend', 'smell-defend', 'temperature-capture', 'temperature-stimulate'],
      equipped: ['temperature-hush', 'temperature-mend', 'temperature-capture'],
      actions: makeActions(['temperature-hush', 'temperature-mend', 'temperature-capture']),
      parentDevo1: 'coral_seahorse_d1_0',
    },
    {
      id: 'coral_seahorse_d2_2', name: '온기방울', desc: '따뜻한 물방울 같은 몸으로 상처를 감싸주는 꼬마 해마', role: 'support',
      hp: 18, maxHp: 18, stats: { affinity: 2, empathy: 7, endurance: 3, agility: 2, bond: 3, instinct: 3 },
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],
      statGrowth: { affinity: [0, 1], empathy: [1, 2], endurance: [0, 1], agility: [0, 1], bond: [0, 1], instinct: [0, 1] },
      skillUnlocks: { 1: ['temperature-hush', 'temperature-mend', 'temperature-capture'], 3: 'temperature-defend', 5: 'smell-stimulate' },
      skillPool: ['temperature-hush', 'temperature-mend', 'temperature-defend', 'temperature-capture', 'smell-stimulate'],
      equipped: ['temperature-hush', 'temperature-mend', 'temperature-capture'],
      actions: makeActions(['temperature-hush', 'temperature-mend', 'temperature-capture']),
      parentDevo1: 'coral_seahorse_d1_1',
    },
    {
      id: 'coral_seahorse_d2_3', name: '산호불꽃', desc: '작은 몸에서 뜨거운 산호 빛이 번쩍이는 꼬마 해마', role: 'attacker',
      hp: 16, maxHp: 16, stats: { affinity: 7, empathy: 2, endurance: 2, agility: 3, bond: 3, instinct: 3 },
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],
      statGrowth: { affinity: [1, 2], empathy: [0, 1], endurance: [0, 1], agility: [0, 1], bond: [0, 1], instinct: [0, 1] },
      skillUnlocks: { 1: ['temperature-stimulate', 'temperature-capture', 'smell-defend'], 3: 'temperature-sweep', 5: 'temperature-hush' },
      skillPool: ['temperature-stimulate', 'temperature-sweep', 'temperature-capture', 'smell-defend', 'temperature-hush'],
      equipped: ['temperature-stimulate', 'temperature-capture', 'smell-defend'],
      actions: makeActions(['temperature-stimulate', 'temperature-capture', 'smell-defend']),
      parentDevo1: 'coral_seahorse_d1_1',
    },
  ],
};
