const cx = 240, cy = 280;

export default (img) => [
    { text: '쉬이이이... 위협적인 소리가 바람을 탄다.', effects: [
      { type: 'bg', preset: 'wind', dur: 600 },
      { type: 'pan', x: -30, dur: 500 },
      { type: 'tint', color: 0x226644, alpha: 0.15, dur: 600 },
    
      { type: 'sprite', img, id: 'mon', x: cx + 60, y: cy - 20, size: 140, alpha: 0.7, silhouette: true },
    ]},
    { text: '바람 뱀이 공중에서 또아리를 틀며 나타났다!', effects: [
      { type: 'reveal', target: 'mon', dur: 400 },
      { type: 'move', target: 'mon', fromX: cx + 60, toX: cx, dur: 500, ease: 'easeOut' },
      { type: 'pan', x: 30, dur: 500 },
    
      { type: 'emoji', target: 'mon', emoji: 'angry', dur: 1300 },]},
    { text: '바람을 타고 날아다니는 몸이 위협적이다.', effects: [
      { type: 'shake', dur: 300, intensity: 5 },
    ]},
  ];
