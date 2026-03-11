const cx = 240, cy = 280;

export default (img) => [
    { text: '맑은 종소리 같은 울림이 숲에 퍼진다...', effects: [
      { type: 'bg', preset: 'crystal', dur: 600 },
      { type: 'tint', color: 0xaaccff, alpha: 0.1, dur: 800 },
    
      { type: 'sprite', img, id: 'mon', x: cx + 80, y: cy, size: 140, alpha: 0.7, silhouette: true },
    ]},
    { text: '수정 사슴이 기품 있게 걸어 나왔다!', effects: [
      { type: 'reveal', target: 'mon', dur: 500 },
      { type: 'move', target: 'mon', fromX: cx + 80, toX: cx, dur: 600, ease: 'easeOut' },
    
      { type: 'emoji', target: 'mon', emoji: 'sparkle', dur: 1300 },]},
    { text: '수정 뿔의 무지개빛. 왠지 모를 위엄.', effects: [
      { type: 'flash', color: 0xeeddff, dur: 300 },
    
      { type: 'emoji', target: 'mon', emoji: 'calm', dur: 1200 },]},
  ];
