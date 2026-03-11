const cx = 240, cy = 220;

export default (img) => [
  { text: '', effects: [
    { type: 'bg', preset: 'light', dur: 600 },
    { type: 'sprite', img, id: 'mon', x: cx, y: cy, size: 130, alpha: 0 },
    { type: 'fade', target: 'mon', from: 0, to: 1, dur: 500 },
    { type: 'bounce', target: 'mon', height: 15, dur: 500 },
  ]},
  { text: '그림자 고양이(이)가 동료가 되었다!', effects: [
    { type: 'flash', color: 0xffeedd, dur: 250 },
    { type: 'emoji', target: 'mon', emoji: 'happy', dur: 1400 },
  ]},
  { text: '도도하지만 관심받는 걸 은근히 좋아한다', effects: [
    { type: 'emoji', target: 'mon', emoji: 'sparkle', dur: 1200 },
  ]},
  { text: '\u2764 장난감 쫓기  /  \u2716 시끄러운 환경', effects: [
    { type: 'bounce', target: 'mon', height: 10, dur: 400 },
    { type: 'emoji', target: 'mon', emoji: 'love', dur: 1300 },
  ]},
  { speaker: '\uBC15\uC0AC', text: '행동과 온도에 반응해. 놀아주면 마음을 연다', effects: [
    { type: 'emoji', target: 'mon', emoji: 'idea', dur: 1200 },
  ]},
];
