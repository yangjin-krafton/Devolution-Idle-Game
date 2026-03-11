const cx = 240, cy = 280;

export default (img) => [
    { text: '연기가 피어오르더니... 사라졌다?', effects: [
      { type: 'bg', preset: 'fog', dur: 600 },
      { type: 'tint', color: 0x666666, alpha: 0.3, dur: 600 },
    
      { type: 'sprite', img, id: 'mon', x: cx, y: cy, size: 120, alpha: 0.7, silhouette: true },
    ]},
    { text: '연기 족제비가 어느새 뒤에 나타났다!', effects: [
      { type: 'reveal', target: 'mon', dur: 200 },
      { type: 'flash', color: 0xffffff, dur: 100 },
      { type: 'tint', color: 0x666666, alpha: 0, dur: 300 },
    
      { type: 'emoji', target: 'mon', emoji: 'happy', dur: 1300 },]},
    { text: '연기처럼 사라졌다 나타나며 혼란을 준다.', effects: [
      { type: 'fade', target: 'mon', from: 1, to: 0.5, dur: 300 },
      { type: 'fade', target: 'mon', from: 0.5, to: 1, dur: 300 },
    ]},
  ];
