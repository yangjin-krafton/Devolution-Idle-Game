// ============================================================
// Monster & Action Data — 감정/상성/PP 확장
// ============================================================

export const SENSORY_AXES = ['sound', 'temperature', 'smell', 'behavior'];

// 감각 상성 테이블: 소리→행동→냄새→온도→소리
export const SENSORY_EFFECTIVENESS = {
  sound:       { sound: 1.0, temperature: 0.5, smell: 1.0, behavior: 1.5 },
  temperature: { sound: 1.5, temperature: 1.0, smell: 0.5, behavior: 1.0 },
  smell:       { sound: 1.0, temperature: 1.5, smell: 1.0, behavior: 0.5 },
  behavior:    { sound: 0.5, temperature: 1.0, smell: 1.5, behavior: 1.0 },
};

// 적의 감각 타입으로 상성 배율 계산
export function calcSensoryMod(skillAxis, enemySensoryTypes) {
  if (!enemySensoryTypes || enemySensoryTypes.length === 0) return 1.0;
  let total = 0;
  for (const eType of enemySensoryTypes) {
    total += SENSORY_EFFECTIVENESS[skillAxis]?.[eType] ?? 1.0;
  }
  return total / enemySensoryTypes.length;
}

export const SKILL_CATEGORY = {
  stimulate: { id: 'stimulate', name: '자극', color: 'axis' },
  capture:   { id: 'capture',   name: '포획', color: 'orange' },
  defend:    { id: 'defend',    name: '수비', color: 'water' },
};

// ============================================================
// Ally Monsters (6마리)
// ============================================================
export const ALLY_MONSTERS = [
  {
    id: 'water', name: '이슬요정',
    img: 'asset/monsters/water_ally.png', devolvedImg: 'asset/monsters/water_devolved.png',
    desc: '잔잔한 물방울을 다루는 온화한 요정',
    hp: 30, maxHp: 30,
    stats: { gentleness: 6, empathy: 5, resilience: 5, agility: 4 },
    devolvedStats: { gentleness: 12, empathy: 3, resilience: 3, agility: 2 },
    xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
    devolvedName: '물방울콩', devolvedDesc: '아주 작고 투명한 콩 모양의 존재',
    actions: [
      { id: 'rain_sound', name: '빗소리', axis: 'sound', category: 'stimulate',
        power: 9, escapeRisk: 4, pp: 8, maxPp: 8,
        effects: [{ type: 'calm', chance: 0.2, turns: 2 }],
        log: '빗소리로 순화도를 올린다.' },
      { id: 'cool_mist', name: '서늘한 안개', axis: 'temperature', category: 'defend',
        power: 10, escapeRisk: -3, healAmount: 5, defenseBoost: 2, pp: 6, maxPp: 6,
        effects: [{ type: 'calm', chance: 0.3, turns: 2 }],
        log: '아군 회복 + 방어. 도주 감소.' },
      { id: 'water_bond', name: '물결 교감', axis: 'behavior', category: 'capture',
        power: 15, escapeRisk: 12, pp: 3, maxPp: 3,
        effects: [],
        log: '교감 시도. 실패 시 도주 급상승!' },
    ],
  },
  {
    id: 'fire', name: '숯뭉이',
    img: 'asset/monsters/fire_ally.png', devolvedImg: 'asset/monsters/fire_devolved.png',
    desc: '따뜻한 온기를 품은 작은 불씨 생물',
    hp: 25, maxHp: 25,
    stats: { gentleness: 7, empathy: 4, resilience: 4, agility: 5 },
    devolvedStats: { gentleness: 3, empathy: 12, resilience: 2, agility: 3 },
    xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
    devolvedName: '꺼지지않는불씨', devolvedDesc: '손바닥 위에 올라오는 아주 작은 불씨',
    actions: [
      { id: 'warm_aura', name: '따뜻한 온기', axis: 'temperature', category: 'stimulate',
        power: 9, escapeRisk: 4, pp: 8, maxPp: 8,
        effects: [{ type: 'curious', chance: 0.15, turns: 2 }],
        log: '온도 자극으로 순화도를 올린다.' },
      { id: 'gentle_glow', name: '은은한 존재감', axis: 'behavior', category: 'defend',
        power: 8, escapeRisk: -4, healAmount: 4, defenseBoost: 3, pp: 6, maxPp: 6,
        effects: [{ type: 'calm', chance: 0.25, turns: 2 }],
        log: '아군 회복 + 방어. 경계심 감소.' },
      { id: 'fire_bond', name: '불꽃 교감', axis: 'temperature', category: 'capture',
        power: 18, escapeRisk: 15, pp: 2, maxPp: 2,
        effects: [],
        log: '강한 교감. 실패 시 도주 크게 상승.' },
    ],
  },
  {
    id: 'grass', name: '잎사귀요정',
    img: 'asset/monsters/grass_ally.png', devolvedImg: 'asset/monsters/grass_devolved.png',
    desc: '숲의 향기를 가진 수줍은 요정',
    hp: 28, maxHp: 28,
    stats: { gentleness: 5, empathy: 6, resilience: 6, agility: 3 },
    devolvedStats: { gentleness: 2, empathy: 3, resilience: 12, agility: 3 },
    xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
    devolvedName: '씨앗눈', devolvedDesc: '눈처럼 작은 씨앗에서 눈이 반짝이는 존재',
    actions: [
      { id: 'forest_scent', name: '숲 냄새', axis: 'smell', category: 'stimulate',
        power: 9, escapeRisk: 4, pp: 8, maxPp: 8,
        effects: [{ type: 'charmed', chance: 0.1, turns: 3 }],
        log: '후각 자극으로 순화도를 올린다.' },
      { id: 'hide', name: '숨기기', axis: 'behavior', category: 'defend',
        power: 6, escapeRisk: -6, healAmount: 6, defenseBoost: 4, pp: 5, maxPp: 5,
        effects: [],
        log: '높은 회복 + 강한 방어. 도주 크게 감소.' },
      { id: 'grass_bond', name: '부드러운 교감', axis: 'smell', category: 'capture',
        power: 14, escapeRisk: 10, pp: 3, maxPp: 3,
        effects: [],
        log: '안정적 교감. 중간 위험, 중간 보상.' },
    ],
  },
  {
    id: 'crystal', name: '수정벌레',
    img: 'asset/monsters/water_ally.png', devolvedImg: 'asset/monsters/water_devolved.png',
    desc: '단단한 수정 껍질로 아군을 지키는 벌레',
    hp: 35, maxHp: 35,
    stats: { gentleness: 3, empathy: 3, resilience: 8, agility: 6 },
    devolvedStats: { gentleness: 2, empathy: 2, resilience: 14, agility: 2 },
    xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
    devolvedName: '수정알갱이', devolvedDesc: '투명하고 단단한 작은 구슬 같은 존재',
    actions: [
      { id: 'crystal_hum', name: '수정 울림', axis: 'sound', category: 'stimulate',
        power: 8, escapeRisk: 4, pp: 7, maxPp: 7,
        effects: [{ type: 'curious', chance: 0.2, turns: 2 }],
        log: '청각 자극으로 순화도 상승.' },
      { id: 'crystal_guard', name: '수정 방벽', axis: 'behavior', category: 'defend',
        power: 4, escapeRisk: -5, healAmount: 3, defenseBoost: 6, pp: 5, maxPp: 5,
        effects: [{ type: 'calm', chance: 0.35, turns: 2 }],
        log: '최강 방어. 도주 감소.' },
      { id: 'crystal_bond', name: '수정 교감', axis: 'sound', category: 'capture',
        power: 12, escapeRisk: 10, pp: 3, maxPp: 3,
        effects: [],
        log: '교감 시도. 안정적인 중간 위험.' },
    ],
  },
  {
    id: 'moss', name: '이끼도롱',
    img: 'asset/monsters/grass_ally.png', devolvedImg: 'asset/monsters/grass_devolved.png',
    desc: '이끼로 뒤덮인 느릿느릿한 치유사',
    hp: 32, maxHp: 32,
    stats: { gentleness: 4, empathy: 4, resilience: 7, agility: 5 },
    devolvedStats: { gentleness: 3, empathy: 3, resilience: 12, agility: 2 },
    xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
    devolvedName: '이끼솜', devolvedDesc: '폭신한 이끼 뭉치에서 눈이 깜빡이는 존재',
    actions: [
      { id: 'moss_scent', name: '이끼 향', axis: 'smell', category: 'stimulate',
        power: 8, escapeRisk: 3, pp: 9, maxPp: 9,
        effects: [{ type: 'charmed', chance: 0.12, turns: 3 }],
        log: '가장 안전한 순화. 도주 거의 없음.' },
      { id: 'moss_heal', name: '이끼 치유', axis: 'smell', category: 'defend',
        power: 3, escapeRisk: -4, healAmount: 8, defenseBoost: 2, pp: 5, maxPp: 5,
        effects: [],
        log: '최고 회복. 아군 체력을 크게 채운다.' },
      { id: 'moss_bond', name: '이끼 교감', axis: 'behavior', category: 'capture',
        power: 13, escapeRisk: 11, pp: 3, maxPp: 3,
        effects: [],
        log: '교감 시도. 중간 성공률.' },
    ],
  },
  {
    id: 'spark', name: '번개꼬리',
    img: 'asset/monsters/fire_ally.png', devolvedImg: 'asset/monsters/fire_devolved.png',
    desc: '꼬리에서 전기가 튀는 빠른 사냥꾼',
    hp: 22, maxHp: 22,
    stats: { gentleness: 8, empathy: 5, resilience: 2, agility: 5 },
    devolvedStats: { gentleness: 14, empathy: 3, resilience: 1, agility: 2 },
    xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
    devolvedName: '전기콩', devolvedDesc: '찌릿찌릿한 작은 콩 모양의 존재',
    actions: [
      { id: 'spark_crackle', name: '정전기 소리', axis: 'sound', category: 'stimulate',
        power: 11, escapeRisk: 7, pp: 5, maxPp: 5,
        effects: [{ type: 'curious', chance: 0.25, turns: 2 }],
        log: '최강 순화력. 도주 위험도 높음.' },
      { id: 'spark_calm', name: '방전 안정', axis: 'temperature', category: 'defend',
        power: 5, escapeRisk: -3, healAmount: 3, defenseBoost: 1, pp: 6, maxPp: 6,
        effects: [],
        log: '약한 회복 + 방어. 딜러의 임시 방어.' },
      { id: 'spark_bond', name: '전격 교감', axis: 'sound', category: 'capture',
        power: 20, escapeRisk: 18, pp: 2, maxPp: 2,
        effects: [],
        log: '최고 보너스! 실패 시 도주 폭발.' },
    ],
  },
];

// ============================================================
// Enemy Monsters (8종) — sensoryType + personality 추가
// ============================================================
export const ENEMY_MONSTERS = [
  {
    id: 'abyss_wolf', name: '심연 늑대',
    img: 'asset/monsters/enemy_abyss_wolf.png',
    desc: '어둠 속에서 눈만 빛나는 거대한 늑대',
    attackPower: 6, tamingThreshold: 70, escapeThreshold: 100,
    sensoryType: ['sound', 'behavior'], personality: 'aggressive',
    reactions: {
      sound_good: '귀가 빗소리 쪽으로 기울었다.', sound_bad: '날카로운 소리에 으르렁거린다.',
      temp_good: '따뜻함에 조금 몸을 풀었다.', temp_bad: '추위에 털이 곤두선다.',
      smell_good: '코를 킁킁거리며 냄새를 맡는다.', smell_bad: '불쾌한 듯 코를 돌린다.',
      behav_good: '경계를 조금 풀었다.', behav_bad: '위협을 느끼고 이빨을 드러낸다.',
      attack: '날카로운 발톱을 휘둘렀다!', calm: '조용히 바닥에 엎드렸다.',
    },
  },
  {
    id: 'glass_moth', name: '유리 나방',
    img: 'asset/monsters/enemy_glass_moth.png',
    desc: '투명한 날개가 달빛에 반짝이는 거대한 나방',
    attackPower: 4, tamingThreshold: 60, escapeThreshold: 80,
    sensoryType: ['behavior', 'sound'], personality: 'timid',
    reactions: {
      sound_good: '허밍에 맞춰 날개가 떨린다.', sound_bad: '놀라 날개를 접었다.',
      temp_good: '서늘함에 날개가 느리게 펄럭인다.', temp_bad: '열기에 날개가 오그라든다.',
      smell_good: '꽃향기 쪽으로 더듬이가 향한다.', smell_bad: '강한 냄새에 날개를 감쌌다.',
      behav_good: '조용한 태도에 살짝 가까이 왔다.', behav_bad: '갑작스런 움직임에 높이 떴다.',
      attack: '날카로운 비늘 가루를 뿌렸다!', calm: '천천히 날개를 접고 내려앉았다.',
    },
  },
  {
    id: 'stone_turtle', name: '바위 거북',
    img: 'asset/monsters/enemy_stone_turtle.png',
    desc: '등에 이끼가 자란 느린 거대 거북',
    attackPower: 8, tamingThreshold: 80, escapeThreshold: 120,
    sensoryType: ['smell', 'temperature'], personality: 'stubborn',
    reactions: {
      sound_good: '눈을 가늘게 뜨고 귀 기울인다.', sound_bad: '등껍질 안으로 움츠러든다.',
      temp_good: '따뜻함에 고개를 살짝 내밀었다.', temp_bad: '추위에 더 깊이 들어갔다.',
      smell_good: '이끼 냄새에 코를 벌름거린다.', smell_bad: '역한 냄새에 고개를 돌렸다.',
      behav_good: '느릿느릿 고개를 돌려 바라본다.', behav_bad: '등껍질로 완전히 숨었다.',
      attack: '무거운 몸을 들이밀었다!', calm: '편안히 고개를 내밀고 눈을 감았다.',
    },
  },
  {
    id: 'shadow_cat', name: '그림자 고양이',
    img: 'asset/monsters/enemy_shadow_cat.png',
    desc: '그림자처럼 일렁이는 검은 고양이',
    attackPower: 5, tamingThreshold: 55, escapeThreshold: 70,
    sensoryType: ['temperature', 'behavior'], personality: 'curious',
    reactions: {
      sound_good: '귀를 쫑긋 세우고 소리를 따라간다.', sound_bad: '소리에 놀라 그림자 속으로 스며든다.',
      temp_good: '따뜻한 곳에 몸을 웅크린다.', temp_bad: '차가움에 털을 곤두세운다.',
      smell_good: '냄새를 맡으며 고개를 갸웃.', smell_bad: '불쾌한 듯 하악 소리를 낸다.',
      behav_good: '경계하면서도 꼬리를 느리게 흔든다.', behav_bad: '등을 활처럼 굽히며 경계한다.',
      attack: '그림자 발톱을 날렸다!', calm: '그르릉, 작게 목을 울린다.',
    },
  },
  {
    id: 'crystal_deer', name: '수정 사슴',
    img: 'asset/monsters/enemy_crystal_deer.png',
    desc: '뿔이 수정처럼 빛나는 기품 있는 사슴',
    attackPower: 5, tamingThreshold: 65, escapeThreshold: 75,
    sensoryType: ['sound', 'smell'], personality: 'curious',
    reactions: {
      sound_good: '수정 뿔이 맑은 소리에 공명한다.', sound_bad: '뿔의 빛이 날카롭게 번쩍인다.',
      temp_good: '따뜻함에 코에서 하얀 김이 나온다.', temp_bad: '추위에 발굽으로 땅을 찬다.',
      smell_good: '숲 향기에 눈을 감고 들이마신다.', smell_bad: '강한 냄새에 고개를 들어 올린다.',
      behav_good: '조심스러운 태도에 발걸음을 멈추었다.', behav_bad: '경계하며 뒷걸음친다.',
      attack: '수정 뿔에서 빛이 쏟아진다!', calm: '천천히 고개를 숙이고 다가왔다.',
    },
  },
  {
    id: 'fog_jellyfish', name: '안개 해파리',
    img: 'asset/monsters/enemy_fog_jellyfish.png',
    desc: '공중에 떠다니는 반투명 해파리',
    attackPower: 3, tamingThreshold: 50, escapeThreshold: 65,
    sensoryType: ['temperature'], personality: 'timid',
    reactions: {
      sound_good: '촉수가 소리에 맞춰 리듬을 탄다.', sound_bad: '촉수를 바짝 움츠렸다.',
      temp_good: '서늘함에 몸이 더 투명해졌다.', temp_bad: '열기에 불안하게 떨린다.',
      smell_good: '향기를 따라 천천히 떠온다.', smell_bad: '냄새에서 멀어지며 높이 떠올랐다.',
      behav_good: '가만히 있는 모습에 촉수를 늘어뜨렸다.', behav_bad: '급한 움직임에 전기가 스파크친다.',
      attack: '촉수에서 미약한 전기가 흐른다!', calm: '천천히 내려와 곁에 떠있다.',
    },
  },
  {
    id: 'iron_boar', name: '강철 멧돼지',
    img: 'asset/monsters/enemy_iron_boar.png',
    desc: '금속처럼 단단한 갈기를 세운 멧돼지',
    attackPower: 9, tamingThreshold: 85, escapeThreshold: 110,
    sensoryType: ['smell', 'temperature'], personality: 'aggressive',
    reactions: {
      sound_good: '소리에 귀를 접고 잠시 멈추었다.', sound_bad: '소음에 분노하며 발굽으로 땅을 찼다.',
      temp_good: '따뜻함에 강철 갈기가 눕는다.', temp_bad: '추위에 강철 갈기가 바짝 섰다.',
      smell_good: '숲 냄새에 코를 땅에 대고 킁킁거린다.', smell_bad: '자극적 냄새에 굉음을 내며 달려든다.',
      behav_good: '다가가지 않자 조금 안심한 듯하다.', behav_bad: '갑자기 다가오자 돌진 자세를 취한다.',
      attack: '강철 갈기로 들이받았다!', calm: '거친 숨을 내쉬며 옆으로 누웠다.',
    },
  },
  {
    id: 'echo_bat', name: '메아리 박쥐',
    img: 'asset/monsters/enemy_echo_bat.png',
    desc: '초음파를 울리는 거대한 보라색 박쥐',
    attackPower: 4, tamingThreshold: 55, escapeThreshold: 70,
    sensoryType: ['sound'], personality: 'timid',
    reactions: {
      sound_good: '소리를 따라 귀가 크게 펼쳐졌다.', sound_bad: '날카로운 초음파를 쏘아 보낸다.',
      temp_good: '서늘함에 날개를 접고 매달렸다.', temp_bad: '열기에 불안하게 원을 그리며 난다.',
      smell_good: '향기를 따라 낮게 날았다.', smell_bad: '코를 찡그리며 높이 올라갔다.',
      behav_good: '가만히 있자 거꾸로 매달려 관찰한다.', behav_bad: '급한 동작에 날카롭게 울었다.',
      attack: '초음파 파동을 내보냈다!', calm: '날개를 접고 조용히 매달려 있다.',
    },
  },
];

// ============================================================
// Generic Log Templates
// ============================================================
export const GENERIC_LOGS = {
  encounter: (name) => `야생 ${name}이(가) 나타났다!`,
  enemyAttack: (name, damage) => `${name}의 공격! ${damage}의 피해!`,
  allyFaint: (name) => `${name}이(가) 기절했다`,
  allFaint: '모든 아군이 쓰러졌다 게임 오버.',
  enemyEscape: (name) => `${name}이(가) 도망쳤다!`,
  tamingSuccess: (name) => `${name}과(와)의 교감에 성공했다!`,
  captureTooEarly: '아직 이르다 순화가 더 필요하다.',
  captureSuccess: (name) => `${name}이(가) 마음을 열었다!`,
  captureFail: '교감에 실패했다 도주 위험이 높아진다!',
  defendEffect: (name) => `${name}이(가) 아군을 보호한다.`,
  healEffect: (name, amount) => `${name}이(가) 체력을 ${amount} 회복했다.`,
  xpGain: (name, xp) => `${name}: 경험치 +1 (${xp})`,
  eggEnter: (name) => `${name}이(가) 알 상태에 들어갔다! 잠시 전투에 나설 수 없다.`,
  eggHatch: (name, newName) => `알에서 ${newName}이(가) 나왔다! ${name}이(가) 퇴화했다!`,
  emotionApply: (name, emotion) => `${name}이(가) ${emotion} 상태가 되었다!`,
  emotionExpire: (name, emotion) => `${name}의 ${emotion} 상태가 풀렸다.`,
  ppEmpty: (name) => `${name}은(는) 더 이상 쓸 수 없다!`,
};
