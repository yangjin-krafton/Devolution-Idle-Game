const cx = 240, cy = 280;

export default (img) => [
    { text: '물속에서 파직! 전기 불꽃이 튄다.', effects: [
      { type: 'bg', preset: 'ocean', dur: 600 },
      { type: 'flash', color: 0xffff00, dur: 150 },
      { type: 'shake', dur: 200, intensity: 5 },
    
      { type: 'sprite', img, id: 'mon', x: cx, y: cy, size: 140, alpha: 0.7, silhouette: true },
    ]},
    { text: '번개 장어가 전류를 뿜으며 나타났다!', effects: [
      { type: 'reveal', target: 'mon', dur: 300 },
      { type: 'flash', color: 0xffffaa, dur: 200 },
    
      { type: 'emoji', target: 'mon', emoji: 'shock', dur: 1300 },]},
    { text: '주변 물이 전기로 부글부글 끓어오른다.', effects: [
      { type: 'shake', dur: 400, intensity: 6 },
      { type: 'tint', color: 0xffff44, alpha: 0.15, dur: 400 },
    ]},
  ];
