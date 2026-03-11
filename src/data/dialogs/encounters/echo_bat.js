const cx = 240, cy = 280;

export default (img) => [
    { text: '동굴 깊은 곳에서 날카로운 초음파가 울린다...', effects: [
      { type: 'bg', preset: 'cave', dur: 600 },
      { type: 'tint', color: 0x220044, alpha: 0.2, dur: 800 },
      { type: 'shake', dur: 200, intensity: 3 },
    
      { type: 'sprite', img, id: 'mon', x: cx, y: cy - 80, size: 130, alpha: 0.7, silhouette: true },
    ]},
    { text: '초음파 박쥐가 천장에서 내려왔다!', effects: [
      { type: 'reveal', target: 'mon', dur: 400 },
      { type: 'move', target: 'mon', fromY: cy - 80, toY: cy, dur: 500, ease: 'bounce' },
    
      { type: 'emoji', target: 'mon', emoji: 'scared', dur: 1300 },]},
    { text: '겁쟁이지만 기민하다! 초음파를 마구 쏜다.', effects: [
      { type: 'bounce', target: 'mon', height: 20, dur: 500 },
    
      { type: 'emoji', target: 'mon', emoji: 'music', dur: 1200 },]},
  ];
