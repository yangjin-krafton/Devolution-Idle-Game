const cx = 240, cy = 280;

export default (img) => [
    { text: '쿵... 쿵... 무거운 발소리가 다가온다.', effects: [
      { type: 'bg', preset: 'mountain', dur: 600 },
      { type: 'shake', dur: 500, intensity: 4 },
    
      { type: 'sprite', img, id: 'mon', x: cx + 100, y: cy, size: 140, alpha: 0.7, silhouette: true },
    ]},
    { text: '강철 멧돼지가 갈기를 세우며 길을 막았다!', effects: [
      { type: 'reveal', target: 'mon', dur: 300 },
      { type: 'move', target: 'mon', fromX: cx + 100, toX: cx, dur: 400, ease: 'easeOut' },
      { type: 'shake', dur: 300, intensity: 8 },
    
      { type: 'emoji', target: 'mon', emoji: 'angry', dur: 1300 },]},
    { text: '강철처럼 단단한 몸이 햇빛을 반사한다.', effects: [
      { type: 'flash', color: 0xcccccc, dur: 200 },
    
      { type: 'sprite', img, id: 'mon', x: cx, y: cy + 20, size: 140, alpha: 0.7, silhouette: true },
    ]},
  ];
