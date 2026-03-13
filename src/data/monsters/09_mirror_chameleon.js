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
    hp: 25, maxHp: 25, stats: { affinity: 5, empathy: 7, endurance: 4, agility: 4, bond: 3, instinct: 3 },
    wildMechanic: { id: 'mirror_copy', nameKr: '거울 모방', descKr: '마지막으로 사용된 아군 스킬을 복사해 역으로 사용한다. 순화도 대신 탈출 게이지를 올린다.', trigger: 'after_ally_skill', effect: 'copy_reverse_skill' },
    reactions: REACTIONS.curious,
  },

  devo1: [
    {
      id: 'mirror_chameleon_d1_0', name: '빛도마뱀', desc: '빛을 반사해 아군의 스킬을 증폭시키는 도마뱀', role: 'support',
      img: AIMG.support[0], devolvedImg: AIMG.support[1],
      hp: 24, maxHp: 24, stats: { affinity: 3, empathy: 12, endurance: 2, agility: 3, bond: 3, instinct: 3 },
      devolvedName: '반짝이', devolvedDesc: '몸에서 작은 빛을 반사하며 반짝거리는 꼬마 도마뱀',
      devolvedStats: { affinity: 2, empathy: 7, endurance: 3, agility: 2, bond: 2, instinct: 2 },
      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],
      statGrowth: { affinity: [0, 1], empathy: [1, 3], endurance: [0, 1], agility: [0, 1], bond: [0, 1], instinct: [0, 1] },
      skillUnlocks: { 1: ['behavior-bow', 'behavior-defend', 'behavior-capture'], 3: 'behavior-spiral', 5: 'behavior-stimulate', 7: 'behavior-bloom', 9: 'behavior-guard' },
      skillPool: ['behavior-bow', 'behavior-spiral', 'behavior-stimulate', 'behavior-bloom', 'behavior-capture', 'behavior-defend', 'behavior-guard'],
      equipped: ['behavior-bow', 'behavior-defend', 'behavior-capture'],
      actions: makeActions(['behavior-bow', 'behavior-defend', 'behavior-capture']),
    },
    {
      id: 'mirror_chameleon_d1_1', name: '위장도마뱀', desc: '완벽한 위장으로 적의 공격을 피하는 도마뱀', role: 'speedster',
      img: AIMG.speedster[0], devolvedImg: AIMG.speedster[1],
      hp: 20, maxHp: 20, stats: { affinity: 4, empathy: 4, endurance: 2, agility: 10, bond: 3, instinct: 3 },
      devolvedName: '쏜살이', devolvedDesc: '재빠르게 숨었다 나타났다 하는 장난꾸러기 꼬마 도마뱀',
      devolvedStats: { affinity: 3, empathy: 2, endurance: 2, agility: 7, bond: 2, instinct: 2 },
      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],
      statGrowth: { affinity: [0, 1], empathy: [0, 1], endurance: [0, 1], agility: [1, 3], bond: [0, 1], instinct: [0, 1] },
      skillUnlocks: { 1: ['behavior-spark', 'behavior-stimulate', 'behavior-capture'], 3: 'behavior-relay', 5: 'behavior-sweep', 7: 'behavior-clasp', 9: 'behavior-defend' },
      skillPool: ['behavior-spark', 'behavior-relay', 'behavior-stimulate', 'behavior-sweep', 'behavior-clasp', 'behavior-capture', 'behavior-defend'],
      equipped: ['behavior-spark', 'behavior-stimulate', 'behavior-capture'],
      actions: makeActions(['behavior-spark', 'behavior-stimulate', 'behavior-capture']),
    },
  ],

  devo2: [
    {
      id: 'mirror_chameleon_d2_0', name: '반짝이', desc: '몸에서 작은 빛을 반사하며 반짝거리는 꼬마 도마뱀', role: 'support',
      hp: 18, maxHp: 18, stats: { affinity: 2, empathy: 7, endurance: 3, agility: 2, bond: 3, instinct: 3 },
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],
      statGrowth: { affinity: [0, 1], empathy: [1, 2], endurance: [0, 1], agility: [0, 1], bond: [0, 1], instinct: [0, 1] },
      skillUnlocks: { 1: ['behavior-hush', 'behavior-mend', 'behavior-capture'], 3: 'behavior-defend', 5: 'behavior-stimulate' },
      skillPool: ['behavior-hush', 'behavior-defend', 'behavior-mend', 'behavior-capture', 'behavior-stimulate'],
      equipped: ['behavior-hush', 'behavior-mend', 'behavior-capture'],
      actions: makeActions(['behavior-hush', 'behavior-mend', 'behavior-capture']),
      parentDevo1: 'mirror_chameleon_d1_0',
    },
    {
      id: 'mirror_chameleon_d2_1', name: '섬광이', desc: '꼬리 끝에서 번쩍이는 빛으로 놀라게 하는 아기 도마뱀', role: 'attacker',
      hp: 16, maxHp: 16, stats: { affinity: 7, empathy: 2, endurance: 2, agility: 3, bond: 3, instinct: 3 },
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],
      statGrowth: { affinity: [1, 2], empathy: [0, 1], endurance: [0, 1], agility: [0, 1], bond: [0, 1], instinct: [0, 1] },
      skillUnlocks: { 1: ['behavior-stimulate', 'behavior-capture', 'behavior-defend'], 3: 'behavior-cadence', 5: 'behavior-veil' },
      skillPool: ['behavior-stimulate', 'behavior-cadence', 'behavior-capture', 'behavior-defend', 'behavior-veil'],
      equipped: ['behavior-stimulate', 'behavior-capture', 'behavior-defend'],
      actions: makeActions(['behavior-stimulate', 'behavior-capture', 'behavior-defend']),
      parentDevo1: 'mirror_chameleon_d1_0',
    },
    {
      id: 'mirror_chameleon_d2_2', name: '쏜살이', desc: '재빠르게 숨었다 나타났다 하는 장난꾸러기 꼬마 도마뱀', role: 'speedster',
      hp: 14, maxHp: 14, stats: { affinity: 3, empathy: 2, endurance: 2, agility: 7, bond: 3, instinct: 3 },
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],
      statGrowth: { affinity: [0, 1], empathy: [0, 1], endurance: [0, 1], agility: [1, 2], bond: [0, 1], instinct: [0, 1] },
      skillUnlocks: { 1: ['behavior-stimulate', 'behavior-sweep', 'behavior-capture'], 3: 'behavior-defend', 5: 'behavior-bridge' },
      skillPool: ['behavior-stimulate', 'behavior-sweep', 'behavior-capture', 'behavior-defend', 'behavior-bridge'],
      equipped: ['behavior-stimulate', 'behavior-sweep', 'behavior-capture'],
      actions: makeActions(['behavior-stimulate', 'behavior-sweep', 'behavior-capture']),
      parentDevo1: 'mirror_chameleon_d1_1',
    },
    {
      id: 'mirror_chameleon_d2_3', name: '거울콩', desc: '작은 몸에 비친 주변 풍경을 보여주는 동그란 도마뱀', role: 'tank',
      hp: 20, maxHp: 20, stats: { affinity: 2, empathy: 2, endurance: 8, agility: 2, bond: 3, instinct: 3 },
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],
      statGrowth: { affinity: [0, 1], empathy: [0, 1], endurance: [1, 2], agility: [0, 1], bond: [0, 1], instinct: [0, 1] },
      skillUnlocks: { 1: ['behavior-defend', 'behavior-ward', 'behavior-capture'], 3: 'behavior-stimulate', 5: 'behavior-shelter' },
      skillPool: ['behavior-defend', 'behavior-ward', 'behavior-stimulate', 'behavior-capture', 'behavior-shelter'],
      equipped: ['behavior-defend', 'behavior-ward', 'behavior-capture'],
      actions: makeActions(['behavior-defend', 'behavior-ward', 'behavior-capture']),
      parentDevo1: 'mirror_chameleon_d1_1',
    },
  ],
};
