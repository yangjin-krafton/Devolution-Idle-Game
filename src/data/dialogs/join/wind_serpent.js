const cx = 240, cy = 220;

export default (img) => [
  { text: '', effects: [
    { type: 'bg', preset: 'light', dur: 600 },
    { type: 'sprite', img, id: 'mon', x: cx, y: cy, size: 130, alpha: 0 },
    { type: 'fade', target: 'mon', from: 0, to: 1, dur: 500 },
    { type: 'bounce', target: 'mon', height: 15, dur: 500 },
  ]},
  { text: '바람 뱀(이)가 동료가 되었다!', effects: [
    { type: 'flash', color: 0xffeedd, dur: 250 },
    { type: 'emoji', target: 'mon', emoji: 'happy', dur: 1400 },
  ]},
  { text: '공격적이지만 하늘을 나는 모습은 우아하다', effects: [
    { type: 'emoji', target: 'mon', emoji: 'sparkle', dur: 1200 },
  ]},
  { text: '\u2764 바람 타기  /  \u2716 영역 침범', effects: [
    { type: 'bounce', target: 'mon', height: 10, dur: 400 },
    { type: 'emoji', target: 'mon', emoji: 'love', dur: 1300 },
  ]},
  { speaker: '\uBC15\uC0AC', text: '행동과 소리에 반응해. 대범하게 맞서 봐', effects: [
    { type: 'emoji', target: 'mon', emoji: 'idea', dur: 1200 },
  ]},
];
