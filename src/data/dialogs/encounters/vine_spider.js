const cx = 240, cy = 280;

export default (img) => [
    { text: '발밑에서 덩굴이 꿈틀거린다...', effects: [
      { type: 'bg', preset: 'forest', dur: 600 },
      { type: 'tint', color: 0x224400, alpha: 0.2, dur: 600 },
      { type: 'shake', dur: 300, intensity: 3 },
    
      { type: 'sprite', img, id: 'mon', x: cx, y: cy - 60, size: 130, alpha: 0.7, silhouette: true },
    ]},
    { text: '덩굴 거미가 거미줄 사이에서 모습을 드러냈다!', effects: [
      { type: 'reveal', target: 'mon', dur: 400 },
      { type: 'move', target: 'mon', fromY: cy - 60, toY: cy, dur: 500, ease: 'bounce' },
    
      { type: 'emoji', target: 'mon', emoji: 'curious', dur: 1300 },]},
    { text: '먹잇감을 기다리던 중이었나 보다.', effects: [] },
  ];
