const cx = 240, cy = 220;

export default (img) => [
  { text: '', effects: [
    { type: 'bg', preset: 'light', dur: 600 },
    { type: 'sprite', img, id: 'mon', x: cx, y: cy, size: 130, alpha: 0 },
    { type: 'fade', target: 'mon', from: 0, to: 1, dur: 500 },
    { type: 'bounce', target: 'mon', height: 15, dur: 500 },
  ]},
  { text: '초음파 박쥐(이)가 동료가 되었다!', effects: [
    { type: 'flash', color: 0xffeedd, dur: 250 },
    { type: 'emoji', target: 'mon', emoji: 'happy', dur: 1400 },
  ]},
  { text: '겁이 많지만 동료를 위해선 용감해진다', effects: [
    { type: 'emoji', target: 'mon', emoji: 'sparkle', dur: 1200 },
  ]},
  { text: '\u2764 어둠 속 비행  /  \u2716 강한 빛', effects: [
    { type: 'bounce', target: 'mon', height: 10, dur: 400 },
    { type: 'emoji', target: 'mon', emoji: 'love', dur: 1300 },
  ]},
  { speaker: '\uBC15\uC0AC', text: '소리에 민감하니 초음파로 교감해 보게', effects: [
    { type: 'emoji', target: 'mon', emoji: 'idea', dur: 1200 },
  ]},
];
