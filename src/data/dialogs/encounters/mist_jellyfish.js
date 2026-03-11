const cx = 240, cy = 280;

export default (img) => [
    { text: '시야가 뿌옇게 흐려진다...', effects: [
      { type: 'bg', preset: 'fog', dur: 600 },
      { type: 'tint', color: 0xaabbcc, alpha: 0.25, dur: 800 },
    
      { type: 'sprite', img, id: 'mon', x: cx, y: cy + 30, size: 130, alpha: 0.7, silhouette: true },
    ]},
    { text: '안개 해파리가 공중에 유유히 떠 있다!', effects: [
      { type: 'reveal', target: 'mon', dur: 700 },
      { type: 'move', target: 'mon', fromY: cy + 30, toY: cy - 10, dur: 800, ease: 'easeInOut' },
    
      { type: 'emoji', target: 'mon', emoji: 'sleepy', dur: 1300 },]},
    { text: '느긋해 보이지만 촉수는 위험!', effects: [
      { type: 'bounce', target: 'mon', height: 12, dur: 600 },
    
      { type: 'emoji', target: 'mon', emoji: 'calm', dur: 1200 },]},
  ];
