const cx = 240, cy = 280;

export default (img) => [
    { text: '코를 찌르는 독한 냄새가 퍼진다...', effects: [
      { type: 'bg', preset: 'swamp', dur: 600 },
      { type: 'tint', color: 0x44aa00, alpha: 0.15, dur: 800 },
    
      { type: 'sprite', img, id: 'mon', x: cx, y: cy + 40, size: 140, alpha: 0.7, silhouette: true },
    ]},
    { text: '썩은향 두꺼비가 느릿느릿 모습을 드러냈다!', effects: [
      { type: 'reveal', target: 'mon', dur: 600 },
      { type: 'move', target: 'mon', fromY: cy + 40, toY: cy, dur: 800, ease: 'easeOut' },
    
      { type: 'emoji', target: 'mon', emoji: 'poison', dur: 1300 },]},
    { text: '악취가 가득하지만 두꺼비는 태연하다.', effects: [
      { type: 'shake', dur: 300, intensity: 4 },
      { type: 'zoom', target: 'mon', from: 1, to: 1.1, dur: 400 },
    
      { type: 'emoji', target: 'mon', emoji: 'calm', dur: 1200 },]},
  ];
