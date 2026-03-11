const cx = 240, cy = 280;

export default (img) => [
    { text: '풀잎이 스르륵... 소리 없이 흔들린다.', effects: [
      { type: 'bg', preset: 'shadow', dur: 600 },
      { type: 'tint', color: 0x003322, alpha: 0.2, dur: 600 },
    
      { type: 'sprite', img, id: 'mon', x: cx, y: cy, size: 140, alpha: 0.7, silhouette: true },
    ]},
    { text: '그림자 사마귀가 어느새 바로 앞에 서 있다!', effects: [
      { type: 'reveal', target: 'mon', dur: 200 },
      { type: 'flash', color: 0xffffff, dur: 150 },
      { type: 'shake', dur: 200, intensity: 6 },
    
      { type: 'emoji', target: 'mon', emoji: 'shock', dur: 1300 },]},
    { text: '소리 없는 사냥꾼의 눈빛이 차갑다.', effects: [
      { type: 'bounce', target: 'mon', height: 10, dur: 400 },
    
      { type: 'emoji', target: 'mon', emoji: 'warning', dur: 1200 },]},
  ];
