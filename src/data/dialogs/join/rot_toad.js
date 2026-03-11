const cx = 240, cy = 220;

export default (img) => [
  { text: '', effects: [
    { type: 'bg', preset: 'light', dur: 600 },
    { type: 'sprite', img, id: 'mon', x: cx, y: cy, size: 130, alpha: 0 },
    { type: 'fade', target: 'mon', from: 0, to: 1, dur: 500 },
    { type: 'bounce', target: 'mon', height: 15, dur: 500 },
  ]},
  { text: '썩은향 두꺼비(이)가 동료가 되었다!', effects: [
    { type: 'flash', color: 0xffeedd, dur: 250 },
    { type: 'emoji', target: 'mon', emoji: 'happy', dur: 1400 },
  ]},
  { text: '느리지만 한번 믿으면 끝까지 따른다', effects: [
    { type: 'emoji', target: 'mon', emoji: 'sparkle', dur: 1200 },
  ]},
  { text: '\u2764 진흙 목욕  /  \u2716 향수 냄새', effects: [
    { type: 'bounce', target: 'mon', height: 10, dur: 400 },
    { type: 'emoji', target: 'mon', emoji: 'love', dur: 1300 },
  ]},
  { speaker: '\uBC15\uC0AC', text: '냄새에 반응하니 냄새 계열 자극이 잘 통해', effects: [
    { type: 'emoji', target: 'mon', emoji: 'idea', dur: 1200 },
  ]},
];
