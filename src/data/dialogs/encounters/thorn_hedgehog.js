const cx = 240, cy = 280;

export default (img) => [
    { text: '발밑에서 뭔가 바스락거린다...', effects: [
      { type: 'bg', preset: 'forest', dur: 600 },
      { type: 'tint', color: 0x443300, alpha: 0.1, dur: 600 },
    
      { type: 'sprite', img, id: 'mon', x: cx, y: cy + 40, size: 120, alpha: 0.7, silhouette: true },
    ]},
    { text: '가시 고슴도치가 독가시를 곤두세우며 나타났다!', effects: [
      { type: 'reveal', target: 'mon', dur: 400 },
      { type: 'move', target: 'mon', fromY: cy + 40, toY: cy, dur: 400 },
      { type: 'zoom', target: 'mon', from: 0.8, to: 1.1, dur: 300 },
    
      { type: 'emoji', target: 'mon', emoji: 'warning', dur: 1300 },]},
    { text: '강렬한 냄새로 영역을 표시하고 있다.', effects: [
      { type: 'zoom', target: 'mon', from: 1.1, to: 1, dur: 300 },
    ]},
  ];
