const cx = 240, cy = 280;

export default (img) => [
    { text: '물속에서 화려한 빛이 반짝인다...', effects: [
      { type: 'bg', preset: 'ocean', dur: 600 },
      { type: 'tint', color: 0xff88aa, alpha: 0.1, dur: 800 },
    
      { type: 'sprite', img, id: 'mon', x: cx - 50, y: cy + 30, size: 120, alpha: 0.7, silhouette: true },
    ]},
    { text: '산호 해마가 우아하게 헤엄치며 나타났다!', effects: [
      { type: 'reveal', target: 'mon', dur: 500 },
      { type: 'move', target: 'mon', fromX: cx - 50, fromY: cy + 30, toX: cx, toY: cy, dur: 700, ease: 'easeInOut' },
    
      { type: 'emoji', target: 'mon', emoji: 'sparkle', dur: 1300 },]},
    { text: '물 온도로 감정 표현 중. 지금은... 수줍은 듯.', effects: [
      { type: 'bounce', target: 'mon', height: 10, dur: 600 },
    
      { type: 'emoji', target: 'mon', emoji: 'love', dur: 1200 },]},
  ];
