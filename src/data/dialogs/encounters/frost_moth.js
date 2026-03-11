const cx = 240, cy = 280;

export default (img) => [
    { text: '공기가 차갑게 변하고, 눈꽃이 흩날린다...', effects: [
      { type: 'bg', preset: 'ice', dur: 600 },
      { type: 'tint', color: 0x88ccff, alpha: 0.15, dur: 800 },
    
      { type: 'sprite', img, id: 'mon', x: cx, y: cy, size: 130, alpha: 0.7, silhouette: true },
    ]},
    { text: '서리 나방이 투명한 날개를 펼치며 나타났다!', effects: [
      { type: 'reveal', target: 'mon', dur: 600 },
      { type: 'zoom', target: 'mon', from: 0.5, to: 1, dur: 500 },
    
      { type: 'emoji', target: 'mon', emoji: 'ice', dur: 1300 },]},
    { text: '아름답지만... 너무 차갑다!', effects: [
      { type: 'flash', color: 0xccddff, dur: 300 },
    
      { type: 'emoji', target: 'mon', emoji: 'sparkle', dur: 1200 },]},
  ];
