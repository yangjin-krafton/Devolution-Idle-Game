const cx = 240, cy = 280;

export default (img) => [
    { text: '알록달록한 포자가 공중에 흩날린다...', effects: [
      { type: 'bg', preset: 'spirit', dur: 600 },
      { type: 'tint', color: 0xaa44cc, alpha: 0.15, dur: 800 },
    
      { type: 'sprite', img, id: 'mon', x: cx - 60, y: cy, size: 130, alpha: 0.7, silhouette: true },
    ]},
    { text: '포자 여우가 꼬리를 흔들며 장난스럽게 나타났다!', effects: [
      { type: 'reveal', target: 'mon', dur: 400 },
      { type: 'move', target: 'mon', fromX: cx - 60, toX: cx, dur: 500, ease: 'bounce' },
    
      { type: 'emoji', target: 'mon', emoji: 'happy', dur: 1300 },]},
    { text: '환각 포자에 정신이 살짝 흐려진다.', effects: [
      { type: 'shake', dur: 400, intensity: 4 },
      { type: 'tint', color: 0xcc66ff, alpha: 0.2, dur: 500 },
    ]},
  ];
