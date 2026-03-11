const cx = 240, cy = 280;

export default (img) => [
    { text: '땅이 크게 진동한다... 쿵, 쿵!', effects: [
      { type: 'bg', preset: 'mountain', dur: 600 },
      { type: 'shake', dur: 600, intensity: 8 },
    
      { type: 'sprite', img, id: 'mon', x: cx, y: cy + 60, size: 150, alpha: 0.7, silhouette: true },
    ]},
    { text: '진동 곰이 거대한 몸을 일으켜 세웠다!', effects: [
      { type: 'reveal', target: 'mon', dur: 400 },
      { type: 'move', target: 'mon', fromY: cy + 60, toY: cy, dur: 500, ease: 'easeOut' },
      { type: 'zoom', target: 'mon', from: 0.7, to: 1, dur: 500 },
    
      { type: 'emoji', target: 'mon', emoji: 'angry', dur: 1300 },]},
    { text: '발걸음 하나에 주변이 흔들린다.', effects: [
      { type: 'shake', dur: 400, intensity: 6 },
      { type: 'bounce', target: 'mon', height: 8, dur: 400 },
    ]},
  ];
