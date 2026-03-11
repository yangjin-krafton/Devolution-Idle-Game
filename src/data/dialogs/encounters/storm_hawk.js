const cx = 240, cy = 280;

export default (img) => [
    { text: '갑자기 돌풍이 몰아친다!', effects: [
      { type: 'bg', preset: 'storm', dur: 600 },
      { type: 'shake', dur: 400, intensity: 7 },
      { type: 'pan', x: -20, dur: 300 },
    
      { type: 'sprite', img, id: 'mon', x: cx, y: cy - 100, size: 140, alpha: 0.7, silhouette: true },
    ]},
    { text: '폭풍 매가 하늘에서 급강하했다!', effects: [
      { type: 'reveal', target: 'mon', dur: 200 },
      { type: 'move', target: 'mon', fromY: cy - 100, toY: cy, dur: 300, ease: 'easeIn' },
      { type: 'flash', color: 0xffffff, dur: 150 },
      { type: 'shake', dur: 200, intensity: 6 },
    
      { type: 'emoji', target: 'mon', emoji: 'shock', dur: 1300 },]},
    { text: '날개짓 한 번에 바람이 소용돌이친다.', effects: [
      { type: 'bounce', target: 'mon', height: 25, dur: 500 },
      { type: 'pan', x: 20, dur: 400 },
    ]},
  ];
