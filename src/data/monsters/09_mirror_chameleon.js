import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix




export default {
  id: 'mirror_chameleon',

  wild: {
    id: 'mirror_chameleon', name: '거울 카멜레온', desc: '몸을 투명하게 바꿔 상대의 행동을 관찰하는 카멜레온',
    img: IMG + 'mirror_chameleon_wild.png',
    attackPower: 4, tamingThreshold: 55, escapeThreshold: 70,
    sensoryType: ['behavior'], personality: 'curious',
    habitat: 'forest',
    environmentPreference: {
      temperature: { ideal: 1, tolerance: 1 }, brightness: { ideal: 0, tolerance: 0 },
      smell: { ideal: 0, tolerance: 1 }, humidity: { ideal: 0, tolerance: 1 }, sound: { ideal: -1, tolerance: 0 },
    },
    fleeProfile: { baseGain: 1, mismatchBonus: 1 },
    environmentSkills: [
      { axis: 'brightness', delta: 2, log: '거울 카멜레온이 빛을 반사해 눈부시게 한다!' },
      { axis: 'brightness', delta: -2, log: '거울 카멜레온이 주변의 빛을 흡수한다!' },
    ],
    captureRule: { sustainTurns: 3 },
    wildMechanic: { id: 'mirror_copy', nameKr: '거울 모방', descKr: '마지막으로 사용된 아군 스킬을 복사해 역으로 사용한다. 순화도 대신 탈출 게이지를 올린다.', trigger: 'after_ally_skill', effect: 'copy_reverse_skill' },
    reactions: REACTIONS.curious,
  },

  devo1: [
    {
      id: 'mirror_chameleon_d1_0', name: '빛도마뱀', desc: '빛을 반사해 아군의 스킬을 증폭시키는 도마뱀', role: 'support',
      img: IMG + 'mirror_chameleon_d1_0.png', devolvedImg: IMG + 'mirror_chameleon_d2_0.png',
      devolvedName: '반짝이', devolvedDesc: '몸에서 작은 빛을 반사하며 반짝거리는 꼬마 도마뱀',      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],      skillUnlocks: { 1: ['behavior-bow', 'behavior-defend', 'behavior-capture'], 3: 'behavior-spiral', 5: 'behavior-stimulate', 7: 'behavior-bloom', 9: 'behavior-guard' },
      skillPool: ['behavior-bow', 'behavior-spiral', 'behavior-stimulate', 'behavior-bloom', 'behavior-capture', 'behavior-defend', 'behavior-guard', 'survey-gaze'],
      equipped: ['behavior-bow', 'behavior-defend', 'behavior-capture'],
      actions: makeActions(['behavior-bow', 'behavior-defend', 'behavior-capture']),
    },
    {
      id: 'mirror_chameleon_d1_1', name: '위장도마뱀', desc: '완벽한 위장으로 적의 공격을 피하는 도마뱀', role: 'speedster',
      img: IMG + 'mirror_chameleon_d1_1.png', devolvedImg: IMG + 'mirror_chameleon_d2_2.png',
      devolvedName: '쏜살이', devolvedDesc: '재빠르게 숨었다 나타났다 하는 장난꾸러기 꼬마 도마뱀',      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],      skillUnlocks: { 1: ['behavior-spark', 'behavior-stimulate', 'behavior-capture'], 3: 'behavior-relay', 5: 'behavior-sweep', 7: 'behavior-clasp', 9: 'behavior-defend' },
      skillPool: ['behavior-spark', 'behavior-relay', 'behavior-stimulate', 'behavior-sweep', 'behavior-clasp', 'behavior-capture', 'behavior-defend', 'survey-gaze'],
      equipped: ['behavior-spark', 'behavior-stimulate', 'behavior-capture'],
      actions: makeActions(['behavior-spark', 'behavior-stimulate', 'behavior-capture']),
    },
  ],

  devo2: [
    {
      id: 'mirror_chameleon_d2_0', name: '반짝이', desc: '몸에서 작은 빛을 반사하며 반짝거리는 꼬마 도마뱀', role: 'support',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['behavior-hush', 'behavior-mend', 'behavior-capture'], 3: 'behavior-defend', 5: 'behavior-stimulate' },
      skillPool: ['behavior-hush', 'behavior-defend', 'behavior-mend', 'behavior-capture', 'behavior-stimulate'],
      equipped: ['behavior-hush', 'behavior-mend', 'behavior-capture'],
      actions: makeActions(['behavior-hush', 'behavior-mend', 'behavior-capture']),
      parentDevo1: 'mirror_chameleon_d1_0',
    },
    {
      id: 'mirror_chameleon_d2_1', name: '섬광이', desc: '꼬리 끝에서 번쩍이는 빛으로 놀라게 하는 아기 도마뱀', role: 'attacker',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['behavior-stimulate', 'behavior-capture', 'behavior-defend'], 3: 'behavior-cadence', 5: 'behavior-veil' },
      skillPool: ['behavior-stimulate', 'behavior-cadence', 'behavior-capture', 'behavior-defend', 'behavior-veil'],
      equipped: ['behavior-stimulate', 'behavior-capture', 'behavior-defend'],
      actions: makeActions(['behavior-stimulate', 'behavior-capture', 'behavior-defend']),
      parentDevo1: 'mirror_chameleon_d1_0',
    },
    {
      id: 'mirror_chameleon_d2_2', name: '쏜살이', desc: '재빠르게 숨었다 나타났다 하는 장난꾸러기 꼬마 도마뱀', role: 'speedster',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['behavior-stimulate', 'behavior-sweep', 'behavior-capture'], 3: 'behavior-defend', 5: 'behavior-bridge' },
      skillPool: ['behavior-stimulate', 'behavior-sweep', 'behavior-capture', 'behavior-defend', 'behavior-bridge'],
      equipped: ['behavior-stimulate', 'behavior-sweep', 'behavior-capture'],
      actions: makeActions(['behavior-stimulate', 'behavior-sweep', 'behavior-capture']),
      parentDevo1: 'mirror_chameleon_d1_1',
    },
    {
      id: 'mirror_chameleon_d2_3', name: '거울콩', desc: '작은 몸에 비친 주변 풍경을 보여주는 동그란 도마뱀', role: 'tank',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['behavior-defend', 'behavior-ward', 'behavior-capture'], 3: 'behavior-stimulate', 5: 'behavior-shelter' },
      skillPool: ['behavior-defend', 'behavior-ward', 'behavior-stimulate', 'behavior-capture', 'behavior-shelter'],
      equipped: ['behavior-defend', 'behavior-ward', 'behavior-capture'],
      actions: makeActions(['behavior-defend', 'behavior-ward', 'behavior-capture']),
      parentDevo1: 'mirror_chameleon_d1_1',
    },
  ],
};
