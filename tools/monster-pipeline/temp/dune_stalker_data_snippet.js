// ============================================================
// Auto-generated monster: 모래 사냥꾼 (dune_stalker)
// Generated: 2026-03-09T10:42:39.251Z
// ============================================================

// ENEMY_MONSTERS 배열에 추가:
{
  id: 'dune_stalker', name: '모래 사냥꾼',
  img: 'asset/monsters/enemy_dune_stalker.png',
  desc: '붉은 모래와 바위 조각으로 이루어진 용 모양의 괴물, 날카로운 등뼈가 있음.',
  attackPower: 5, tamingThreshold: 65, escapeThreshold: 80,
  sensoryType: ["smell","behavior"], personality: 'aggressive',
  reactions: {
    sound_good: '', sound_bad: '',
    temp_good: '', temp_bad: '',
    smell_good: '', smell_bad: '',
    behav_good: '', behav_bad: '',
    attack: '', calm: '',
  },
},

// --- 퇴화 트리 ---
// Base: 모래 사냥꾼 (dune_stalker)
//   └─ 퇴화1-A: 모래 더미 (sand_mound) → asset/monsters/sand_mound.png
//       └─ 퇴화2: 모래 알갱이 (mound_grain) → ?
//       └─ 퇴화2: 모래 구슬 (mound_beat) → ?
//   └─ 퇴화1-B: 바위 조각 (rock_chip) → ?
//       └─ 퇴화2: 바위 먼지 (chip_dust) → ?
//       └─ 퇴화2: 자갈 파편 (chip_grit) → ?
//   └─ 퇴화1-C: 먼지 방울 (dust_puff) → ?
//       └─ 퇴화2: 공기 입자 (puff_particle) → ?
//       └─ 퇴화2: 먼지 꽃 (puff_flower) → ?
