const cx = 240, cy = 220;

export default (img) => [
  { text: '', effects: [
    { type: 'bg', preset: 'light', dur: 600 },
    { type: 'sprite', img, id: 'mon', x: cx, y: cy, size: 130, alpha: 0 },
    { type: 'fade', target: 'mon', from: 0, to: 1, dur: 500 },
    { type: 'bounce', target: 'mon', height: 15, dur: 500 },
  ]},
  { text: '연기 족제비(이)가 동료가 되었다!', effects: [
    { type: 'flash', color: 0xffeedd, dur: 250 },
    { type: 'emoji', target: 'mon', emoji: 'happy', dur: 1400 },
  ]},
  { text: '최고의 장난꾸러기. 절대 가만히 있지 못한다', effects: [
    { type: 'emoji', target: 'mon', emoji: 'sparkle', dur: 1200 },
  ]},
  { text: '\u2764 숨바꼭질  /  \u2716 잡히기', effects: [
    { type: 'bounce', target: 'mon', height: 10, dur: 400 },
    { type: 'emoji', target: 'mon', emoji: 'love', dur: 1300 },
  ]},
  { speaker: '\uBC15\uC0AC', text: '행동 감각에 민감해. 재치 있게 상대하게', effects: [
    { type: 'emoji', target: 'mon', emoji: 'idea', dur: 1200 },
  ]},
];
