import { ALLY_MONSTERS, ENEMY_MONSTERS, STARTER_IDS } from '../index.js';

const starters = STARTER_IDS.map(id => ALLY_MONSTERS.find(m => m.id === id)).filter(Boolean);
const wildExample = ENEMY_MONSTERS[0]; // howl_wolf as demo enemy
const cx = 240, cy = 220;

export default [
  // 1) Forest background + team assembled
  { speaker: '박사', text: '좋아, 훌륭한 선택이야!', effects: [
    { type: 'bg', preset: 'forest', dur: 600 },
    ...(starters[0] ? [
      { type: 'sprite', img: starters[0].img, id: 'a0', x: cx - 100, y: cy + 20, size: 80, alpha: 0 },
      { type: 'fade', target: 'a0', from: 0, to: 1, dur: 400 },
    ] : []),
    ...(starters[1] ? [
      { type: 'sprite', img: starters[1].img, id: 'a1', x: cx, y: cy + 20, size: 80, alpha: 0 },
      { type: 'fade', target: 'a1', from: 0, to: 1, dur: 400 },
    ] : []),
    ...(starters[2] ? [
      { type: 'sprite', img: starters[2].img, id: 'a2', x: cx + 100, y: cy + 20, size: 80, alpha: 0 },
      { type: 'fade', target: 'a2', from: 0, to: 1, dur: 400 },
    ] : []),
  ]},

  // 2) Battle tips - sensory stimulation
  { speaker: '박사', text: '야생 몬스터를 만나면 감각을 자극해서 교감을 시도하게.', effects: [
    { type: 'emoji', target: 'a0', emoji: 'idea', dur: 1300 },
    { type: 'bounce', target: 'a0', height: 10, dur: 500 },
  ]},

  // 3) Taming gauge explanation + wild silhouette appears
  { speaker: '박사', text: '순화 게이지를 채우면 "인간 교감"을 시도할 수 있어.', effects: [
    { type: 'sprite', img: wildExample?.img, id: 'wild', x: cx, y: cy - 60, size: 90, alpha: 0.6, silhouette: true },
    { type: 'emoji', target: 'a1', emoji: 'music', dur: 1200 },
    { type: 'tint', color: 0x00ddaa, alpha: 0.06, dur: 500 },
  ]},

  // 4) Escape gauge warning + wild reacts
  { speaker: '박사', text: '하지만 도주 게이지가 먼저 차면 몬스터가 도망가니 주의!', effects: [
    { type: 'shake', dur: 300, intensity: 4 },
    { type: 'emoji', target: 'wild', emoji: 'scared', dur: 1300 },
    { type: 'emoji', target: 'a2', emoji: 'warning', dur: 1200 },
  ]},

  // 5) Encouragement + team ready pose
  { speaker: '박사', text: '자, 첫 전투를 시작해 보게! 자네 동료들을 믿어!', effects: [
    { type: 'remove', target: 'wild' },
    { type: 'bounce', target: 'a0', height: 15, dur: 500 },
    { type: 'bounce', target: 'a1', height: 15, dur: 500 },
    { type: 'bounce', target: 'a2', height: 15, dur: 500 },
    { type: 'emoji', target: 'a0', emoji: 'strong', dur: 1400 },
    { type: 'emoji', target: 'a1', emoji: 'excited', dur: 1400 },
    { type: 'emoji', target: 'a2', emoji: 'trust', dur: 1400 },
  ]},

  // 6) Transition to battle
  { text: '풀숲에서 기척이 느껴진다...', effects: [
    { type: 'remove', target: 'a0' },
    { type: 'remove', target: 'a1' },
    { type: 'remove', target: 'a2' },
    { type: 'shake', dur: 400, intensity: 3 },
    { type: 'tint', color: 0x000000, alpha: 0.3, dur: 600 },
  ]},
];
