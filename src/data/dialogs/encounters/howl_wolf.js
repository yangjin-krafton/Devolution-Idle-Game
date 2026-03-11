const cx = 240, cy = 280;

export default (img) => [
    { text: '어둠 속에서 낮고 긴 울음소리가 들린다...', effects: [
      { type: 'bg', preset: 'night', dur: 600 },
      { type: 'tint', color: 0x2222aa, alpha: 0.2, dur: 800 },
    
      { type: 'sprite', img, id: 'mon', x: cx, y: cy + 60, size: 140, alpha: 0.7, silhouette: true },
    ]},
    { text: '달빛 아래, 울부짖는 늑대가 모습을 드러냈다!', effects: [
      { type: 'reveal', target: 'mon', dur: 500 },
      { type: 'move', target: 'mon', fromY: cy + 60, toY: cy, dur: 600, ease: 'easeOut' },
      { type: 'flash', color: 0xccccff, dur: 200 },
    
      { type: 'emoji', target: 'mon', emoji: 'angry', dur: 1300 },]},
    { text: '음파가 공기를 가른다. 늑대의 눈이 이쪽을 노려본다!', effects: [
      { type: 'shake', dur: 400, intensity: 5 },
      { type: 'bounce', target: 'mon', height: 15, dur: 500 },
    
      { type: 'emoji', target: 'mon', emoji: 'music', dur: 1200 },]},
  ];
