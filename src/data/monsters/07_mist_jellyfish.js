import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/'; // placeholder prefix

// Image assignments by role (temporary placeholders)
const AIMG = { attacker: [IMG+'fire_ally.png', IMG+'fire_devolved.png'], tank: [IMG+'grass_ally.png', IMG+'grass_devolved.png'], support: [IMG+'water_ally.png', IMG+'water_devolved.png'], speedster: [IMG+'fire_ally.png', IMG+'fire_devolved.png'] };

export default {
  id: 'mist_jellyfish',

  wild: {
    id: 'mist_jellyfish', name: '안개 해파리', desc: '공중에 떠다니며 촉수에서 차가운 안개를 뿜는 해파리',
    img: IMG + 'enemy_fog_jellyfish.png',
    attackPower: 3, tamingThreshold: 50, escapeThreshold: 65,
    sensoryType: ['smell', 'temperature'], personality: 'timid',
    habitat: 'sea',
    hp: 24, maxHp: 24, stats: { gentleness: 5, empathy: 7, resilience: 5, agility: 3 },
    wildMechanic: { id: 'tentacle_counter', nameKr: '촉수 반격', descKr: '행동 축 자극 시 30% 확률로 촉수가 반격해 자극한 아군의 HP를 감소시킨다.', trigger: 'on_behavior_stimulate', effect: 'counter_hp_damage' },
    skills: ['temperature-stimulate', 'smell-defend', 'smell-capture'],
    reactions: REACTIONS.timid,
  },

  devo1: [
    {
      id: 'mist_jellyfish_d1_0', name: '이슬해파리', desc: '이슬방울을 머금은 치유의 해파리', role: 'support',
      img: AIMG.support[0], devolvedImg: AIMG.support[1],
      hp: 26, maxHp: 26, stats: { gentleness: 3, empathy: 11, resilience: 4, agility: 2 },
      devolvedName: '이슬방울', devolvedDesc: '작은 방울 모양으로 떠다니며 촉촉한 이슬을 뿌리는 아기 해파리',
      devolvedStats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['smell-defend', 'temperature-stimulate', 'smell-capture']),
    },
    {
      id: 'mist_jellyfish_d1_1', name: '독촉수', desc: '독촉수로 적의 도주를 억제하는 해파리', role: 'attacker',
      img: AIMG.attacker[0], devolvedImg: AIMG.attacker[1],
      hp: 22, maxHp: 22, stats: { gentleness: 9, empathy: 4, resilience: 4, agility: 3 },
      devolvedName: '쏘기방울', devolvedDesc: '작은 촉수로 살짝 찌르는 동그란 아기 해파리',
      devolvedStats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 },
      xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
      actions: makeActions(['smell-stimulate', 'temperature-stimulate', 'smell-capture']),
    },
  ],

  devo2: [
    { id: 'mist_jellyfish_d2_0', name: '이슬방울', desc: '작은 방울 모양으로 떠다니며 촉촉한 이슬을 뿌리는 아기 해파리', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'mist_jellyfish_d1_0' },
    { id: 'mist_jellyfish_d2_1', name: '한기방울', desc: '차가운 안개를 살짝 내뿜는 동그란 젤리 덩어리', role: 'tank', hp: 20, maxHp: 20, stats: { gentleness: 2, empathy: 2, resilience: 8, agility: 2 }, parentDevo1: 'mist_jellyfish_d1_0' },
    { id: 'mist_jellyfish_d2_2', name: '쏘기방울', desc: '작은 촉수로 살짝 찌르는 동그란 아기 해파리', role: 'attacker', hp: 16, maxHp: 16, stats: { gentleness: 7, empathy: 2, resilience: 2, agility: 3 }, parentDevo1: 'mist_jellyfish_d1_1' },
    { id: 'mist_jellyfish_d2_3', name: '안개솜', desc: '안개를 살짝 내뿜으며 둥실 떠다니는 솜뭉치 해파리', role: 'support', hp: 18, maxHp: 18, stats: { gentleness: 2, empathy: 7, resilience: 3, agility: 2 }, parentDevo1: 'mist_jellyfish_d1_1' },
  ],
};
