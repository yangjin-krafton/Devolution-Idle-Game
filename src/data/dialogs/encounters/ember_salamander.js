const cx = 240, cy = 280;

export default (img) => [
    { text: '땅에서 열기가 솟아오른다...', effects: [
      { type: 'bg', preset: 'lava', dur: 600 },
      { type: 'tint', color: 0xff4400, alpha: 0.15, dur: 800 },
    
      { type: 'sprite', img, id: 'mon', x: cx, y: cy + 80, size: 140, alpha: 0.7, silhouette: true },
    ]},
    { text: '용암 도롱뇽이 불꽃을 일렁이며 나타났다!', effects: [
      { type: 'reveal', target: 'mon', dur: 400 },
      { type: 'move', target: 'mon', fromY: cy + 80, toY: cy, dur: 700, ease: 'easeOut' },
      { type: 'flash', color: 0xff6600, dur: 250 },
    
      { type: 'emoji', target: 'mon', emoji: 'fire', dur: 1300 },]},
    { text: '꼬리의 불꽃이 활활 타오른다!', effects: [
      { type: 'shake', dur: 300, intensity: 3 },
    
      { type: 'emoji', target: 'mon', emoji: 'strong', dur: 1200 },]},
  ];
