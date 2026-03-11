const cx = 240, cy = 280;

export default (img) => [
    { text: '땅이 크게 흔들리고, 바위가 일어선다...', effects: [
      { type: 'bg', preset: 'ruins', dur: 600 },
      { type: 'shake', dur: 700, intensity: 8 },
      { type: 'tint', color: 0x334422, alpha: 0.15, dur: 800 },
    
      { type: 'sprite', img, id: 'mon', x: cx, y: cy + 80, size: 160, alpha: 0.7, silhouette: true },
    ]},
    { text: '이끼 골렘이 거대한 몸을 일으켰다!', effects: [
      { type: 'reveal', target: 'mon', dur: 500 },
      { type: 'move', target: 'mon', fromY: cy + 80, toY: cy, dur: 800, ease: 'easeOut' },
      { type: 'zoom', target: 'mon', from: 0.6, to: 1, dur: 700 },
    
      { type: 'emoji', target: 'mon', emoji: 'sleepy', dur: 1300 },]},
    { text: '오래된 이끼와 바위 사이에서 깊은 숨소리가 들린다.', effects: [
      { type: 'shake', dur: 300, intensity: 3 },
    ]},
  ];
