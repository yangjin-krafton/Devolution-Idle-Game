const cx = 240, cy = 280;

export default (img) => [
    { text: '돌더미인 줄 알았던 것이 움직인다...', effects: [
      { type: 'bg', preset: 'desert', dur: 600 },] },
    { text: '바위 거북이 천천히 고개를 들었다!', effects: [
      { type: 'reveal', target: 'mon', dur: 800 },
      { type: 'move', target: 'mon', fromY: cy + 20, toY: cy, dur: 1000, ease: 'easeOut' },
    
      { type: 'emoji', target: 'mon', emoji: 'sleepy', dur: 1300 },]},
    { text: '이끼에서 오랜 세월이. 100년은 살았을 듯.', effects: [
      { type: 'tint', color: 0x446633, alpha: 0.1, dur: 600 },
    
      { type: 'emoji', target: 'mon', emoji: 'calm', dur: 1200 },]},
  ];
