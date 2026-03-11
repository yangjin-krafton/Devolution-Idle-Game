const cx = 240, cy = 280;

export default (img) => [
    { text: '주변 풍경이 살짝 일그러진다...', effects: [
      { type: 'bg', preset: 'twilight', dur: 600 },
      { type: 'flash', color: 0xffffff, dur: 400 },
    
      { type: 'sprite', img, id: 'mon', x: cx, y: cy, size: 130, alpha: 0.7, silhouette: true },
    
      { type: 'emoji', target: 'mon', emoji: 'idea', dur: 1200 },]},
    { text: '거울 카멜레온이 투명함을 풀며 나타났다!', effects: [
      { type: 'reveal', target: 'mon', dur: 800 },
    
      { type: 'emoji', target: 'mon', emoji: 'curious', dur: 1300 },]},
    { text: '뭐가 그렇게 궁금한 걸까?', effects: [
      { type: 'zoom', target: 'mon', from: 1, to: 1.15, dur: 400 },
    
      { type: 'emoji', target: 'mon', emoji: 'question', dur: 1200 },]},
  ];
