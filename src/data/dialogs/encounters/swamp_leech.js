const cx = 240, cy = 280;

export default (img) => [
    { text: '발밑이 질척이며 독한 점액이 보인다...', effects: [
      { type: 'bg', preset: 'swamp', dur: 600 },
      { type: 'tint', color: 0x334400, alpha: 0.2, dur: 800 },
    
      { type: 'sprite', img, id: 'mon', x: cx, y: cy + 60, size: 140, alpha: 0.7, silhouette: true },
    ]},
    { text: '늪지 거머리가 거대한 몸을 드러냈다!', effects: [
      { type: 'reveal', target: 'mon', dur: 500 },
      { type: 'move', target: 'mon', fromY: cy + 60, toY: cy, dur: 700, ease: 'easeOut' },
    
      { type: 'emoji', target: 'mon', emoji: 'poison', dur: 1300 },]},
    { text: '끈적한 점액이 흘러내리며 악취를 풍긴다.', effects: [
      { type: 'shake', dur: 300, intensity: 4 },
    ]},
  ];
