import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'mirror_chameleon',

  wild: {
    id: 'mirror_chameleon', name: '거울 카멜레온', desc: '몸을 투명하게 바꿔 상대의 행동을 관찰하는 카멜레온',
    img: IMG + 'enemy_shadow_cat.png',
    attackPower: 4, tamingThreshold: 55, escapeThreshold: 70,
    sensoryType: ['behavior'], personality: 'curious',
    habitat: 'forest',
    hp: 25, maxHp: 25, stats: { gentleness: 5, empathy: 7, resilience: 4, agility: 4 },
    wildMechanic: { id: 'mirror_copy', nameKr: '거울 모방', descKr: '마지막으로 사용된 아군 스킬을 복사해 역으로 사용한다. 순화도 대신 탈출 게이지를 올린다.', trigger: 'after_ally_skill', effect: 'copy_reverse_skill' },
    skills: ['behavior-stimulate', 'temperature-defend', 'behavior-capture'],
    reactions: REACTIONS.curious,
  },

  devo1: [
    {
      id: 'mirror_chameleon_d1_0', name: '빛도마뱀', desc: '빛을 반사해 아군의 스킬을 증폭시키는 도마뱀', role: 'support',
      img: AIMG.support[0], devolvedImg: AIMG.support[1],
      hp: 24, maxHp: 24, stats: { gentleness: 3, empathy: 12, resilience: 2, agility: 3 },
      devolvedName: '반짝이', devolvedDesc: '몸에서 작은 빛을 반사하며 반짝거리는 꼬마 도마뱀',
      devolvedStats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['behavior-stimulate', 'behavior-capture', 'temperature-defend']),
    },
    {
      id: 'mirror_chameleon_d1_1', name: '위장도마뱀', desc: '완벽한 위장으로 적의 공격을 피하는 도마뱀', role: 'speedster',
      img: AIMG.speedster[0], devolvedImg: AIMG.speedster[1],
      hp: 20, maxHp: 20, stats: { gentleness: 4, empathy: 4, resilience: 2, agility: 10 },
      devolvedName: '쏜살이', devolvedDesc: '재빠르게 숨었다 나타났다 하는 장난꾸러기 꼬마 도마뱀',
      devolvedStats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['behavior-stimulate', 'behavior-defend', 'behavior-capture']),
    },
  ],

  devo2: [
    { id: 'mirror_chameleon_d2_0', name: '반짝이', desc: '몸에서 작은 빛을 반사하며 반짝거리는 꼬마 도마뱀', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'mirror_chameleon_d1_0' },
    { id: 'mirror_chameleon_d2_1', name: '섬광이', desc: '꼬리 끝에서 번쩍이는 빛으로 놀라게 하는 아기 도마뱀', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'mirror_chameleon_d1_0' },
    { id: 'mirror_chameleon_d2_2', name: '쏜살이', desc: '재빠르게 숨었다 나타났다 하는 장난꾸러기 꼬마 도마뱀', role: 'speedster', hp: 14, maxHp: 14, stats: { gentleness: 3, empathy: 2, resilience: 2, agility: 7 }, parentDevo1: 'mirror_chameleon_d1_1' },
    { id: 'mirror_chameleon_d2_3', name: '거울콩', desc: '작은 몸에 비친 주변 풍경을 보여주는 동그란 도마뱀', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'mirror_chameleon_d1_1' },
  ],
};
