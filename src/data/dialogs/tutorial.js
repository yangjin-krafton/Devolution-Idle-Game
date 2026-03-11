import { ALLY_MONSTERS, ENEMY_MONSTERS, STARTER_IDS } from '../index.js';

const starters = STARTER_IDS.map(id => ALLY_MONSTERS.find(m => m.id === id)).filter(Boolean);
const wilds = ENEMY_MONSTERS.slice(0, 8);
const cx = 240, cy = 200;

export default [
  // 1) 암전 → 새벽 배경
  { text: '', effects: [
    { type: 'bg', preset: 'dawn', dur: 800 },
  ]},

  // 2) 박사 인사
  { speaker: '박사', text: '어서 오게, 새로운 조련사여!' },

  // 3) 야생 몬스터 실루엣 여럿 — 세계 소개
  { speaker: '박사', text: '이 세계에는 다양한 몬스터들이 살고 있지.', effects: [
    { type: 'sprite', img: wilds[0]?.img, id: 'w0', x: 60,  y: cy - 30, size: 65, alpha: 0.5, silhouette: true },
    { type: 'sprite', img: wilds[1]?.img, id: 'w1', x: 160, y: cy + 25, size: 55, alpha: 0.4, silhouette: true },
    { type: 'sprite', img: wilds[2]?.img, id: 'w2', x: 320, y: cy - 15, size: 60, alpha: 0.45, silhouette: true },
    { type: 'sprite', img: wilds[3]?.img, id: 'w3', x: 420, y: cy + 35, size: 50, alpha: 0.35, silhouette: true },
    { type: 'sprite', img: wilds[4]?.img, id: 'w4', x: 100, y: cy + 65, size: 45, alpha: 0.3, silhouette: true },
    { type: 'sprite', img: wilds[5]?.img, id: 'w5', x: 380, y: cy - 45, size: 45, alpha: 0.3, silhouette: true },
  ]},

  // 4) 공격 금지 — 몬스터들 경계
  { speaker: '박사', text: '하지만 이 세계에서는 몬스터를 공격하지 않아.', effects: [
    { type: 'shake', dur: 300, intensity: 3 },
    { type: 'emoji', target: 'w1', emoji: 'angry', dur: 1400 },
    { type: 'emoji', target: 'w3', emoji: 'scared', dur: 1400, offsetX: 10 },
  ]},

  // 5) 교감 시작 — 한 마리에게 다가감
  { speaker: '박사', text: '대신 감각을 자극해서 마음을 열게 하는 거지.', effects: [
    { type: 'tint', color: 0xffaa55, alpha: 0.08, dur: 600 },
    { type: 'zoom', target: 'w0', from: 1, to: 1.3, dur: 500 },
    { type: 'move', target: 'w0', toX: cx, toY: cy, dur: 600, ease: 'easeOut' },
    { type: 'emoji', target: 'w0', emoji: 'question', dur: 1200 },
  ]},

  // 6) 교감 반응 — 몬스터가 호기심
  { speaker: '박사', text: '처음엔 경계하지만... 서서히 마음을 열지.', effects: [
    { type: 'emoji', target: 'w0', emoji: 'curious', dur: 1200 },
    { type: 'bounce', target: 'w0', height: 10, dur: 500 },
  ]},

  // 7) 교감 성공 — reveal + 신뢰 이모지
  { speaker: '박사', text: '교감이 깊어지면 유대가 생기고...', effects: [
    { type: 'reveal', target: 'w0', dur: 800 },
    { type: 'emoji', target: 'w0', emoji: 'love', dur: 1500 },
    { type: 'flash', color: 0xffeedd, dur: 200 },
  ]},

  // 8) 동료 전환 — 야생 전부 정리, 아군 첫 번째 등장
  { speaker: '박사', text: '야생 몬스터가 동료가 되지!', effects: [
    { type: 'remove', target: 'w0' },
    { type: 'remove', target: 'w1' },
    { type: 'remove', target: 'w2' },
    { type: 'remove', target: 'w3' },
    { type: 'remove', target: 'w4' },
    { type: 'remove', target: 'w5' },
    { type: 'flash', color: 0xffffff, dur: 250 },
    ...(starters[0] ? [
      { type: 'sprite', img: starters[0].img, id: 's0', x: cx, y: cy, size: 100, alpha: 0 },
      { type: 'fade', target: 's0', from: 0, to: 1, dur: 500 },
      { type: 'bounce', target: 's0', height: 15, dur: 600 },
      { type: 'emoji', target: 's0', emoji: 'happy', dur: 1200 },
    ] : []),
  ]},

  // 9) 퇴화 설명 — 나머지 2마리 합류
  { speaker: '박사', text: '동료는 유대가 깊어지면 "퇴화"해서 더 작고 귀여운 모습으로 돌아가네.', effects: [
    { type: 'move', target: 's0', toX: cx - 100, dur: 400, ease: 'easeOut' },
    ...(starters[1] ? [
      { type: 'sprite', img: starters[1].img, id: 's1', x: cx, y: cy, size: 100, alpha: 0 },
      { type: 'fade', target: 's1', from: 0, to: 1, dur: 500 },
      { type: 'emoji', target: 's1', emoji: 'sparkle', dur: 1200 },
    ] : []),
    ...(starters[2] ? [
      { type: 'sprite', img: starters[2].img, id: 's2', x: cx + 100, y: cy, size: 100, alpha: 0 },
      { type: 'fade', target: 's2', from: 0, to: 1, dur: 500 },
      { type: 'emoji', target: 's2', emoji: 'music', dur: 1200 },
    ] : []),
    { type: 'flash', color: 0xffeedd, dur: 200 },
  ]},

  // 10) 선택 안내 — 3마리 바운스 + 하트
  { speaker: '박사', text: '자, 먼저 함께할 동료 3마리를 골라 보게!', effects: [
    ...(starters[0] ? [
      { type: 'bounce', target: 's0', height: 20, dur: 600 },
      { type: 'emoji', target: 's0', emoji: 'heart', dur: 1500 },
    ] : []),
    ...(starters[1] ? [
      { type: 'bounce', target: 's1', height: 20, dur: 600 },
      { type: 'emoji', target: 's1', emoji: 'heart', dur: 1500 },
    ] : []),
    ...(starters[2] ? [
      { type: 'bounce', target: 's2', height: 20, dur: 600 },
      { type: 'emoji', target: 's2', emoji: 'heart', dur: 1500 },
    ] : []),
  ]},
];
