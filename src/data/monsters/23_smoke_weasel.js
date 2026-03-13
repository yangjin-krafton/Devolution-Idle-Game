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
    habitat: 'volcano',
    hp: 20, maxHp: 20, stats: { affinity: 5, empathy: 5, endurance: 2, agility: 8, bond: 3, instinct: 3 },
    wildMechanic: { id: 'smoke_screen', nameKr: '연막 은폐', descKr: '탈출 게이지가 보이지 않는다. 행동 축 자극으로 연막을 걷어낼 수 있다.', trigger: 'passive', effect: 'hide_escape_gauge' },
    reactions: REACTIONS.timid,
  },

  devo1: [
    {
      id: 'smoke_weasel_d1_0', name: '안개족제비', desc: '부드러운 안개로 아군을 숨겨주는 족제비', role: 'speedster',
      img: AIMG.speedster[0], devolvedImg: AIMG.speedster[1],
      hp: 18, maxHp: 18, stats: { affinity: 3, empathy: 3, endurance: 2, agility: 12, bond: 3, instinct: 3 },
      devolvedName: '안개새끼', devolvedDesc: '살금살금 안개 속을 뛰어다니는 꼬마 족제비',
      devolvedStats: { affinity: 3, empathy: 2, endurance: 2, agility: 7, bond: 2, instinct: 2 },
      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],
      statGrowth: { affinity: [0, 1], empathy: [0, 1], endurance: [0, 1], agility: [1, 3], bond: [0, 1], instinct: [0, 1] },
      skillUnlocks: { 1: ['behavior-surge', 'behavior-stimulate', 'behavior-capture'], 3: 'behavior-bridge', 5: 'behavior-sweep', 7: 'behavior-pact', 9: 'behavior-defend' },
      skillPool: ['behavior-surge', 'behavior-bridge', 'behavior-stimulate', 'behavior-sweep', 'behavior-pact', 'behavior-capture', 'behavior-defend'],
      equipped: ['behavior-surge', 'behavior-stimulate', 'behavior-capture'],
      actions: makeActions(['behavior-surge', 'behavior-stimulate', 'behavior-capture']),
    },
    {
      id: 'smoke_weasel_d1_1', name: '그림자족제비', desc: '그림자를 조종해 적을 혼란시키는 족제비', role: 'attacker',
      img: AIMG.attacker[0], devolvedImg: AIMG.attacker[1],
      hp: 20, maxHp: 20, stats: { affinity: 9, empathy: 4, endurance: 2, agility: 5, bond: 3, instinct: 3 },
      devolvedName: '그림자콩', devolvedDesc: '작은 그림자를 만들어 적을 놀라게 하는 꼬마 족제비',
      devolvedStats: { affinity: 7, empathy: 2, endurance: 2, agility: 3, bond: 2, instinct: 2 },
      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],
      statGrowth: { affinity: [1, 3], empathy: [0, 1], endurance: [0, 1], agility: [0, 1], bond: [0, 1], instinct: [0, 1] },
      skillUnlocks: { 1: ['behavior-stimulate', 'behavior-lure', 'behavior-capture'], 3: 'behavior-focus', 5: 'behavior-bloom', 7: 'behavior-snare', 9: 'behavior-defend' },
      skillPool: ['behavior-stimulate', 'behavior-focus', 'behavior-lure', 'behavior-bloom', 'behavior-capture', 'behavior-snare', 'behavior-defend'],
      equipped: ['behavior-stimulate', 'behavior-lure', 'behavior-capture'],
      actions: makeActions(['behavior-stimulate', 'behavior-lure', 'behavior-capture']),
    },
  ],

  devo2: [
    {
      id: 'smoke_weasel_d2_0', name: '안개새끼', desc: '살금살금 안개 속을 뛰어다니는 꼬마 족제비', role: 'speedster',
      hp: 14, maxHp: 14, stats: { affinity: 3, empathy: 2, endurance: 2, agility: 7, bond: 3, instinct: 3 },
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],
      statGrowth: { affinity: [0, 1], empathy: [0, 1], endurance: [0, 1], agility: [1, 2], bond: [0, 1], instinct: [0, 1] },
      skillUnlocks: { 1: ['behavior-stimulate', 'behavior-cadence', 'behavior-capture'], 3: 'behavior-defend', 5: 'behavior-tether' },
      skillPool: ['behavior-stimulate', 'behavior-cadence', 'behavior-capture', 'behavior-defend', 'behavior-tether'],
      equipped: ['behavior-stimulate', 'behavior-cadence', 'behavior-capture'],
      actions: makeActions(['behavior-stimulate', 'behavior-cadence', 'behavior-capture']),
      parentDevo1: 'smoke_weasel_d1_0',
    },
    {
      id: 'smoke_weasel_d2_1', name: '안개솜', desc: '부드러운 안개로 아군의 긴장을 풀어주는 꼬마 족제비', role: 'support',
      hp: 18, maxHp: 18, stats: { affinity: 2, empathy: 7, endurance: 3, agility: 2, bond: 3, instinct: 3 },
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],
      statGrowth: { affinity: [0, 1], empathy: [1, 2], endurance: [0, 1], agility: [0, 1], bond: [0, 1], instinct: [0, 1] },
      skillUnlocks: { 1: ['behavior-hush', 'behavior-mend', 'behavior-capture'], 3: 'behavior-defend', 5: 'behavior-stimulate' },
      skillPool: ['behavior-hush', 'behavior-mend', 'behavior-defend', 'behavior-capture', 'behavior-stimulate'],
      equipped: ['behavior-hush', 'behavior-mend', 'behavior-capture'],
      actions: makeActions(['behavior-hush', 'behavior-mend', 'behavior-capture']),
      parentDevo1: 'smoke_weasel_d1_0',
    },
    {
      id: 'smoke_weasel_d2_2', name: '그림자콩', desc: '작은 그림자를 만들어 적을 놀라게 하는 꼬마 족제비', role: 'attacker',
      hp: 16, maxHp: 16, stats: { affinity: 7, empathy: 2, endurance: 2, agility: 3, bond: 3, instinct: 3 },
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],
      statGrowth: { affinity: [1, 2], empathy: [0, 1], endurance: [0, 1], agility: [0, 1], bond: [0, 1], instinct: [0, 1] },
      skillUnlocks: { 1: ['behavior-stimulate', 'behavior-capture', 'behavior-defend'], 3: 'behavior-sweep', 5: 'behavior-veil' },
      skillPool: ['behavior-stimulate', 'behavior-sweep', 'behavior-capture', 'behavior-defend', 'behavior-veil'],
      equipped: ['behavior-stimulate', 'behavior-capture', 'behavior-defend'],
      actions: makeActions(['behavior-stimulate', 'behavior-capture', 'behavior-defend']),
      parentDevo1: 'smoke_weasel_d1_1',
    },
    {
      id: 'smoke_weasel_d2_3', name: '불씨잠', desc: '따뜻한 불씨를 안고 꾸벅꾸벅 조는 꼬마 족제비', role: 'tank',
      hp: 20, maxHp: 20, stats: { affinity: 2, empathy: 2, endurance: 8, agility: 2, bond: 3, instinct: 3 },
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],
      statGrowth: { affinity: [0, 1], empathy: [0, 1], endurance: [1, 2], agility: [0, 1], bond: [0, 1], instinct: [0, 1] },
      skillUnlocks: { 1: ['behavior-defend', 'behavior-ward', 'behavior-capture'], 3: 'behavior-stimulate', 5: 'behavior-reserve' },
      skillPool: ['behavior-defend', 'behavior-ward', 'behavior-stimulate', 'behavior-capture', 'behavior-reserve'],
      equipped: ['behavior-defend', 'behavior-ward', 'behavior-capture'],
      actions: makeActions(['behavior-defend', 'behavior-ward', 'behavior-capture']),
      parentDevo1: 'smoke_weasel_d1_1',
    },
  ],
};
