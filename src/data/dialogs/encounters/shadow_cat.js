const cx = 240, cy = 280;

export default (img) => [
    { text: '그림자가 살랑살랑 일렁거린다...', effects: [
      { type: 'bg', preset: 'shadow', dur: 600 },
      { type: 'tint', color: 0x220033, alpha: 0.2, dur: 600 },
    
      { type: 'sprite', img, id: 'mon', x: cx, y: cy, size: 120, alpha: 0.7, silhouette: true },
    ]},
    { text: '그림자 고양이가 호기심 가득한 눈으로 나타났다!', effects: [
      { type: 'reveal', target: 'mon', dur: 600 },
    
      { type: 'emoji', target: 'mon', emoji: 'curious', dur: 1300 },]},
    { text: '장난감을 발견한 듯 바라본다. 냥?', effects: [
      { type: 'fade', target: 'mon', from: 0.8, to: 1, dur: 300 },
      { type: 'bounce', target: 'mon', height: 12, dur: 500 },
    
      { type: 'emoji', target: 'mon', emoji: 'happy', dur: 1200 },]},
  ];
