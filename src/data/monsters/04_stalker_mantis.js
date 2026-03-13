import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix




export default {
  id: 'stalker_mantis',

  wild: {
    id: 'stalker_mantis', name: '그림자 사마귀', desc: '소리 없이 접근해 한순간에 덮치는 거대한 사마귀',
    img: IMG + 'stalker_mantis_wild.png',
    attackPower: 6, tamingThreshold: 70, escapeThreshold: 80,
    sensoryType: ['behavior'], personality: 'aggressive',
    habitat: 'forest',
    environmentPreference: {
      temperature: { ideal: 0, tolerance: 1 }, brightness: { ideal: 1, tolerance: 0 },
      smell: { ideal: 0, tolerance: 1 }, humidity: { ideal: 0, tolerance: 1 }, sound: { ideal: -2, tolerance: 0 },
    },
    fleeProfile: { baseGain: 1, mismatchBonus: 1 },
    environmentSkills: [
      { axis: 'sound', delta: 1, log: '추적 사마귀가 날카로운 울음을 낸다!' },
      { axis: 'brightness', delta: -1, log: '추적 사마귀가 잎사귀를 흔들어 그늘을 만든다!' },
    ],
    captureRule: { sustainTurns: 3 },
    wildMechanic: { id: 'ambush_stealth', nameKr: '은닉 매복', descKr: '무작위 턴에 숨기를 시전한다. 숨은 동안 행동 축 자극만 유효하다.', trigger: 'random_turns', effect: 'stealth_immune_except_behavior' },
    reactions: REACTIONS.aggressive,
  },

  devo1: [
    {
      id: 'stalker_mantis_d1_0', name: '춤사마귀', desc: '위협 대신 춤으로 소통하는 우아한 사마귀', role: 'speedster',
      img: IMG + 'stalker_mantis_d1_0.png', devolvedImg: IMG + 'stalker_mantis_d2_0.png',
      devolvedName: '빙글이', devolvedDesc: '작은 몸으로 빙글빙글 춤추는 꼬마 사마귀',      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],      skillUnlocks: { 1: ['behavior-spark', 'behavior-stimulate', 'behavior-capture'], 3: 'behavior-relay', 5: 'behavior-sweep', 7: 'behavior-pact', 9: 'behavior-defend' },
      skillPool: ['behavior-spark', 'behavior-relay', 'behavior-stimulate', 'behavior-sweep', 'behavior-pact', 'behavior-capture', 'behavior-defend', 'survey-gaze'],
      equipped: ['behavior-spark', 'behavior-stimulate', 'behavior-capture'],
      actions: makeActions(['behavior-spark', 'behavior-stimulate', 'behavior-capture']),
    },
    {
      id: 'stalker_mantis_d1_1', name: '꽃사마귀', desc: '꽃잎 같은 팔로 적을 유인하는 사마귀', role: 'attacker',
      img: IMG + 'stalker_mantis_d1_1.png', devolvedImg: IMG + 'stalker_mantis_d2_2.png',
      devolvedName: '꽃봉이', devolvedDesc: '작은 꽃잎 팔을 흔들어 적을 유혹하는 꼬마 사마귀',      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],      skillUnlocks: { 1: ['behavior-stimulate', 'behavior-surge', 'behavior-capture'], 3: 'behavior-play', 5: 'behavior-lure', 7: 'behavior-vow', 9: 'behavior-defend' },
      skillPool: ['behavior-stimulate', 'behavior-play', 'behavior-surge', 'behavior-lure', 'behavior-capture', 'behavior-vow', 'behavior-defend', 'survey-gaze'],
      equipped: ['behavior-stimulate', 'behavior-surge', 'behavior-capture'],
      actions: makeActions(['behavior-stimulate', 'behavior-surge', 'behavior-capture']),
    },
    {
      id: 'stalker_mantis_d1_2', name: '갑옷사마귀', desc: '단단한 외골격으로 아군을 지키는 사마귀', role: 'tank',
      img: IMG + 'stalker_mantis_d1_2.png', devolvedImg: IMG + 'stalker_mantis_d2_4.png',
      devolvedName: '갑옷꼬미', devolvedDesc: '작은 딱딱한 몸으로 아군을 지키는 꼬마 사마귀',      level: 1, maxLevel: 10, xp: 0, inEgg: false, devolved: false,
      xpCurve: [0, 3, 8, 15, 24, 35, 48, 63, 80, 100],
      ivRange: [0, 4],      skillUnlocks: { 1: ['behavior-defend', 'behavior-ward', 'behavior-capture'], 3: 'behavior-guard', 5: 'behavior-mend', 7: 'behavior-stimulate', 9: 'behavior-bow' },
      skillPool: ['behavior-defend', 'behavior-guard', 'behavior-ward', 'behavior-mend', 'behavior-stimulate', 'behavior-capture', 'behavior-bow', 'survey-gaze'],
      equipped: ['behavior-defend', 'behavior-ward', 'behavior-capture'],
      actions: makeActions(['behavior-defend', 'behavior-ward', 'behavior-capture']),
    },
  ],

  devo2: [
    {
      id: 'stalker_mantis_d2_0', name: '빙글이', desc: '작은 몸으로 빙글빙글 춤추는 꼬마 사마귀', role: 'speedster',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['behavior-stimulate', 'behavior-sweep', 'behavior-capture'], 3: 'behavior-defend', 5: 'behavior-bridge' },
      skillPool: ['behavior-stimulate', 'behavior-sweep', 'behavior-capture', 'behavior-defend', 'behavior-bridge'],
      equipped: ['behavior-stimulate', 'behavior-sweep', 'behavior-capture'],
      actions: makeActions(['behavior-stimulate', 'behavior-sweep', 'behavior-capture']),
      parentDevo1: 'stalker_mantis_d1_0',
    },
    {
      id: 'stalker_mantis_d2_1', name: '지킴이', desc: '작은 팔로 열심히 아군을 지키는 꼬마 사마귀', role: 'tank',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['behavior-defend', 'behavior-ward', 'behavior-capture'], 3: 'behavior-stimulate', 5: 'behavior-shelter' },
      skillPool: ['behavior-defend', 'behavior-ward', 'behavior-stimulate', 'behavior-capture', 'behavior-shelter'],
      equipped: ['behavior-defend', 'behavior-ward', 'behavior-capture'],
      actions: makeActions(['behavior-defend', 'behavior-ward', 'behavior-capture']),
      parentDevo1: 'stalker_mantis_d1_0',
    },
    {
      id: 'stalker_mantis_d2_2', name: '꽃봉이', desc: '작은 꽃잎 팔을 흔들어 적을 유혹하는 꼬마 사마귀', role: 'attacker',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['behavior-stimulate', 'behavior-capture', 'behavior-defend'], 3: 'behavior-cadence', 5: 'behavior-hush' },
      skillPool: ['behavior-stimulate', 'behavior-cadence', 'behavior-capture', 'behavior-defend', 'behavior-hush'],
      equipped: ['behavior-stimulate', 'behavior-capture', 'behavior-defend'],
      actions: makeActions(['behavior-stimulate', 'behavior-capture', 'behavior-defend']),
      parentDevo1: 'stalker_mantis_d1_1',
    },
    {
      id: 'stalker_mantis_d2_3', name: '잎새꼬미', desc: '잎사귀처럼 숨어 아군을 돕는 꼬마 사마귀', role: 'support',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['behavior-hush', 'behavior-mend', 'behavior-capture'], 3: 'behavior-defend', 5: 'behavior-stimulate' },
      skillPool: ['behavior-hush', 'behavior-mend', 'behavior-defend', 'behavior-capture', 'behavior-stimulate'],
      equipped: ['behavior-hush', 'behavior-mend', 'behavior-capture'],
      actions: makeActions(['behavior-hush', 'behavior-mend', 'behavior-capture']),
      parentDevo1: 'stalker_mantis_d1_1',
    },
    {
      id: 'stalker_mantis_d2_4', name: '갑옷꼬미', desc: '작은 딱딱한 몸으로 아군을 지키는 꼬마 사마귀', role: 'tank',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['behavior-defend', 'behavior-ward', 'behavior-capture'], 3: 'behavior-stimulate', 5: 'behavior-reserve' },
      skillPool: ['behavior-defend', 'behavior-ward', 'behavior-stimulate', 'behavior-capture', 'behavior-reserve'],
      equipped: ['behavior-defend', 'behavior-ward', 'behavior-capture'],
      actions: makeActions(['behavior-defend', 'behavior-ward', 'behavior-capture']),
      parentDevo1: 'stalker_mantis_d1_2',
    },
    {
      id: 'stalker_mantis_d2_5', name: '싹둑이', desc: '작은 팔을 휘둘러 열심히 싸우는 꼬마 사마귀', role: 'attacker',
      level: 1, maxLevel: 7, xp: 0,
      xpCurve: [0, 2, 6, 12, 20, 30, 42],
      ivRange: [0, 3],      skillUnlocks: { 1: ['behavior-stimulate', 'behavior-capture', 'behavior-defend'], 3: 'behavior-sweep', 5: 'behavior-veil' },
      skillPool: ['behavior-stimulate', 'behavior-sweep', 'behavior-capture', 'behavior-defend', 'behavior-veil'],
      equipped: ['behavior-stimulate', 'behavior-capture', 'behavior-defend'],
      actions: makeActions(['behavior-stimulate', 'behavior-capture', 'behavior-defend']),
      parentDevo1: 'stalker_mantis_d1_2',
    },
  ],
};
