import { ALLY_MONSTERS, ENEMY_MONSTERS, STARTER_IDS } from '../index.js';

const starters = STARTER_IDS.map(id => ALLY_MONSTERS.find(m => m.id === id)).filter(Boolean);
// Pick 6 wild monsters for background silhouettes
const wilds = ENEMY_MONSTERS.slice(0, 6);
const cx = 240, cy = 200;

export default [
  // 1) 암전 → 새벽 배경
  { text: '', effects: [
    { type: 'bg', preset: 'dawn', dur: 800 },
  ]},

  // 2) 박사 인사
  { speaker: '박사', text: '어서 오게, 새로운 조련사여!' },

  // 3) 야생 몬스터 실루엣 여럿 등장 — "이 세계에는 몬스터가 가득해"
  { speaker: '박사', text: '이 세계에는 다양한 몬스터들이 살고 있지.', effects: [
    { type: 'sprite', img: wilds[0]?.img, id: 'w0', x: 60,  y: cy - 40, size: 70, alpha: 0.5, silhouette: true },
    { type: 'sprite', img: wilds[1]?.img, id: 'w1', x: 160, y: cy + 20, size: 60, alpha: 0.4, silhouette: true },
    { type: 'sprite', img: wilds[2]?.img, id: 'w2', x: 320, y: cy - 20, size: 65, alpha: 0.45, silhouette: true },
    { type: 'sprite', img: wilds[3]?.img, id: 'w3', x: 420, y: cy + 30, size: 55, alpha: 0.35, silhouette: true },
    { type: 'sprite', img: wilds[4]?.img, id: 'w4', x: 100, y: cy + 60, size: 50, alpha: 0.3, silhouette: true },
    { type: 'sprite', img: wilds[5]?.img, id: 'w5', x: 380, y: cy - 50, size: 50, alpha: 0.3, silhouette: true },
  ]},

  // 4) "하지만 공격하지 않아" — 야생 몬스터들 살짝 흔들림
  { speaker: '박사', text: '하지만 이 세계에서는 몬스터를 공격하지 않아.', effects: [
    { type: 'shake', dur: 300, intensity: 3 },
  ]},

  // 5) "감각으로 교감" — 야생 실루엣 중 하나가 밝아지며 반응
  { speaker: '박사', text: '대신 감각을 자극해서 마음을 열게 하는 거지.', effects: [
    { type: 'tint', color: 0xffaa55, alpha: 0.08, dur: 600 },
    { type: 'zoom', target: 'w0', from: 1, to: 1.2, dur: 500 },
    { type: 'reveal', target: 'w0', dur: 800 },
  ]},

  // 6) "교감이 깊어지면 동료가 돼" — 밝아진 야생이 아군 형태로 전환
  { speaker: '박사', text: '교감이 깊어지면, 야생 몬스터가 동료가 되지!', effects: [
    { type: 'flash', color: 0xffeedd, dur: 300 },
    { type: 'remove', target: 'w0' },
    { type: 'remove', target: 'w1' },
    { type: 'remove', target: 'w2' },
    { type: 'remove', target: 'w3' },
    { type: 'remove', target: 'w4' },
    { type: 'remove', target: 'w5' },
    ...(starters[0] ? [
      { type: 'sprite', img: starters[0].img, id: 's0', x: cx - 100, y: cy, size: 90, alpha: 0, silhouette: false },
      { type: 'fade', target: 's0', from: 0, to: 1, dur: 500 },
      { type: 'bounce', target: 's0', height: 12, dur: 500 },
    ] : []),
  ]},

  // 7) "퇴화" 설명 — 나머지 2마리 등장
  { speaker: '박사', text: '동료 몬스터는 교감이 깊어지면 "퇴화"해서 더 작고 귀여운 모습으로 돌아가네.', effects: [
    ...(starters[1] ? [
      { type: 'sprite', img: starters[1].img, id: 's1', x: cx, y: cy, size: 90, alpha: 0 },
      { type: 'fade', target: 's1', from: 0, to: 1, dur: 500 },
      { type: 'bounce', target: 's1', height: 12, dur: 500 },
    ] : []),
    ...(starters[2] ? [
      { type: 'sprite', img: starters[2].img, id: 's2', x: cx + 100, y: cy, size: 90, alpha: 0 },
      { type: 'fade', target: 's2', from: 0, to: 1, dur: 500 },
      { type: 'bounce', target: 's2', height: 12, dur: 500 },
    ] : []),
    { type: 'flash', color: 0xffeedd, dur: 200 },
  ]},

  // 8) 선택 안내 — 3마리 전원 바운스
  { speaker: '박사', text: '자, 먼저 함께할 동료 3마리를 골라 보게!', effects: [
    ...(starters[0] ? [{ type: 'bounce', target: 's0', height: 18, dur: 600 }] : []),
    ...(starters[1] ? [{ type: 'bounce', target: 's1', height: 18, dur: 600 }] : []),
    ...(starters[2] ? [{ type: 'bounce', target: 's2', height: 18, dur: 600 }] : []),
  ]},
];
