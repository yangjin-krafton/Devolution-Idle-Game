import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'echo_bat',

  wild: {
    id: 'echo_bat', name: '초음파 박쥐', desc: '초음파를 울려 동굴 전체를 지배하는 거대 박쥐',
    img: IMG + 'enemy_echo_bat.png',
    attackPower: 4, tamingThreshold: 55, escapeThreshold: 70,
    sensoryType: ['sound'], personality: 'timid',
    habitat: 'cave',
    hp: 20, maxHp: 20, stats: { gentleness: 5, empathy: 6, resilience: 2, agility: 7 },
    wildMechanic: { id: 'sonar_disruption', nameKr: '초음파 교란', descKr: '소리 자극이 빗나가면 아군 한 마리가 1턴 혼란 상태에 빠진다.', trigger: 'on_sound_miss', effect: 'ally_confusion' },
    skills: ['sound-stimulate', 'smell-defend', 'sound-capture'],
    reactions: REACTIONS.timid,
  },

  devo1: [
    {
      id: 'echo_bat_d1_0', name: '노래박쥐', desc: '초음파가 아름다운 멜로디로 변한 박쥐', role: 'support',
      img: AIMG.support[0], devolvedImg: AIMG.support[1],
      hp: 22, maxHp: 22, stats: { gentleness: 3, empathy: 10, resilience: 2, agility: 5 },
      devolvedName: '흥얼이', devolvedDesc: '작은 멜로디로 아군을 치유하는 꼬마 박쥐',
      devolvedStats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['sound-stimulate', 'sound-capture', 'smell-defend']),
    },
    {
      id: 'echo_bat_d1_1', name: '질풍박쥐', desc: '누구보다 빠르게 날아 적을 압박하는 박쥐', role: 'speedster',
      img: AIMG.speedster[0], devolvedImg: AIMG.speedster[1],
      hp: 18, maxHp: 18, stats: { gentleness: 4, empathy: 3, resilience: 2, agility: 11 },
      devolvedName: '파닥이', devolvedDesc: '작은 날개를 파닥이며 빠르게 움직이는 꼬마 박쥐',
      devolvedStats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['sound-stimulate', 'behavior-stimulate', 'sound-capture']),
    },
  ],

  devo2: [
    { id: 'echo_bat_d2_0', name: '흥얼이', desc: '작은 멜로디로 아군을 치유하는 꼬마 박쥐', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'echo_bat_d1_0' },
    { id: 'echo_bat_d2_1', name: '삑삑이', desc: '작은 초음파로 적을 놀라게 하는 꼬마 박쥐', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'echo_bat_d1_0' },
    { id: 'echo_bat_d2_2', name: '파닥이', desc: '작은 날개를 파닥이며 빠르게 움직이는 꼬마 박쥐', role: 'speedster', hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 }, parentDevo1: 'echo_bat_d1_1' },
    { id: 'echo_bat_d2_3', name: '포근이', desc: '날개로 아군을 감싸 보호하는 꼬마 박쥐', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'echo_bat_d1_1' },
  ],
};
