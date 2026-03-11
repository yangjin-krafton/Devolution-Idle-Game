const cx = 240, cy = 280;

export default (img) => [
    { text: '바위가 녹아내리는 소리가 들린다...', effects: [
      { type: 'bg', preset: 'lava', dur: 600 },
      { type: 'tint', color: 0xff2200, alpha: 0.15, dur: 600 },
    
      { type: 'sprite', img, id: 'mon', x: cx, y: cy + 50, size: 130, alpha: 0.7, silhouette: true },
    ]},
    { text: '용암 집게가 뜨거운 집게를 딱딱 부딪히며 나타났다!', effects: [
      { type: 'reveal', target: 'mon', dur: 400 },
      { type: 'move', target: 'mon', fromY: cy + 50, toY: cy, dur: 500 },
      { type: 'shake', dur: 300, intensity: 5 },
    
      { type: 'emoji', target: 'mon', emoji: 'angry', dur: 1300 },]},
    { text: '발밑의 돌이 빨갛게 달아오르고 있다.', effects: [
      { type: 'bounce', target: 'mon', height: 10, dur: 400 },
    ]},
  ];
