import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'thunder_eel',

  wild: {
    id: 'thunder_eel', name: '번개 장어', desc: '몸에서 전기를 뿜어 물속 모든 것을 마비시키는 장어',
    img: IMG + 'enemy_dune_stalker.png',
    attackPower: 5, tamingThreshold: 58, escapeThreshold: 72,
    sensoryType: ['sound', 'temperature'], personality: 'timid',
    habitat: 'sea',
    hp: 22, maxHp: 22, stats: { gentleness: 8, empathy: 4, resilience: 3, agility: 5 },
    wildMechanic: { id: 'electric_charge', nameKr: '전기 충전', descKr: '3턴간 충전 후 방전하여 전체 아군의 스킬 쿨다운이 +1턴 증가한다.', trigger: 'every_3_turns_charge', effect: 'increase_all_cooldowns' },
    skills: ['sound-stimulate', 'temperature-defend', 'temperature-capture'],
    reactions: REACTIONS.timid,
  },

  devo1: [
    {
      id: 'thunder_eel_d1_0', name: '불꽃장어', desc: '전기가 따뜻한 빛으로 변해 아군을 비추는 장어', role: 'attacker',
      img: AIMG.attacker[0], devolvedImg: AIMG.attacker[1],
      hp: 20, maxHp: 20, stats: { gentleness: 14, empathy: 2, resilience: 2, agility: 2 },
      devolvedName: '불꽃콩', devolvedDesc: '조그만 몸에서 따끈한 불꽃이 깜빡이는 꼬마 장어',
      devolvedStats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['sound-stimulate', 'temperature-stimulate', 'sound-capture']),
    },
    {
      id: 'thunder_eel_d1_1', name: '전기뱀장어', desc: '전기 충격으로 적을 놀라게 하는 장어', role: 'speedster',
      img: AIMG.speedster[0], devolvedImg: AIMG.speedster[1],
      hp: 20, maxHp: 20, stats: { gentleness: 5, empathy: 3, resilience: 2, agility: 10 },
      devolvedName: '전기올챙', devolvedDesc: '빠르게 헤엄치며 찌릿찌릿 전기를 내뿜는 꼬마 장어',
      devolvedStats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['sound-stimulate', 'behavior-stimulate', 'temperature-capture']),
    },
    {
      id: 'thunder_eel_d1_2', name: '치유장어', desc: '약한 전류로 아군의 근육을 풀어주는 장어', role: 'support',
      img: AIMG.support[0], devolvedImg: AIMG.support[1],
      hp: 24, maxHp: 24, stats: { gentleness: 3, empathy: 10, resilience: 3, agility: 4 },
      devolvedName: '치유방울', devolvedDesc: '약한 전류로 상처를 감싸주는 동글동글한 꼬마 장어',
      devolvedStats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['temperature-defend', 'sound-defend', 'temperature-capture']),
    },
  ],

  devo2: [
    { id: 'thunder_eel_d2_0', name: '불꽃콩', desc: '조그만 몸에서 따끈한 불꽃이 깜빡이는 꼬마 장어', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'thunder_eel_d1_0' },
    { id: 'thunder_eel_d2_1', name: '따끈꿈틀', desc: '따뜻한 몸으로 꿈틀거리며 아군을 감싸주는 꼬마 장어', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'thunder_eel_d1_0' },
    { id: 'thunder_eel_d2_2', name: '전기올챙', desc: '빠르게 헤엄치며 찌릿찌릿 전기를 내뿜는 꼬마 장어', role: 'speedster', hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 }, parentDevo1: 'thunder_eel_d1_1' },
    { id: 'thunder_eel_d2_3', name: '전기방패', desc: '전기 막으로 아군을 보호하는 꼬마 장어', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'thunder_eel_d1_1' },
    { id: 'thunder_eel_d2_4', name: '치유방울', desc: '약한 전류로 상처를 감싸주는 동글동글한 꼬마 장어', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'thunder_eel_d1_2' },
    { id: 'thunder_eel_d2_5', name: '찌릿톡', desc: '짧은 전기 충격으로 적을 톡톡 자극하는 꼬마 장어', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'thunder_eel_d1_2' },
  ],
};
