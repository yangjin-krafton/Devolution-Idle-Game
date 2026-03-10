// ============================================================
// Monster & Action Data — 24종 Roster 기반
// ============================================================

export const SENSORY_AXES = ['sound', 'temperature', 'smell', 'behavior'];

// 감각 상성 테이블: 소리→행동→냄새→온도→소리
export const SENSORY_EFFECTIVENESS = {
  sound:       { sound: 1.0, temperature: 0.5, smell: 1.0, behavior: 1.5 },
  temperature: { sound: 1.5, temperature: 1.0, smell: 0.5, behavior: 1.0 },
  smell:       { sound: 1.0, temperature: 1.5, smell: 1.0, behavior: 0.5 },
  behavior:    { sound: 0.5, temperature: 1.0, smell: 1.5, behavior: 1.0 },
};

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
// Skill Generation
// ============================================================

const SKILL_NAMES = {
  'sound-stimulate': '공명 울음', 'sound-capture': '소리 교감', 'sound-defend': '음파 방벽',
  'temperature-stimulate': '온기 전달', 'temperature-capture': '온도 교감', 'temperature-defend': '온도 보호',
  'smell-stimulate': '향기 유혹', 'smell-capture': '향기 교감', 'smell-defend': '향기 치유',
  'behavior-stimulate': '부드러운 접근', 'behavior-capture': '행동 교감', 'behavior-defend': '행동 수비',
};

const SKILL_LOGS = {
  'sound-stimulate': '음파로 순화도를 올린다.',
  'sound-capture': '소리로 교감을 시도한다!',
  'sound-defend': '음파 방벽으로 아군을 지킨다.',
  'temperature-stimulate': '온기로 순화도를 올린다.',
  'temperature-capture': '온도를 맞추며 교감한다!',
  'temperature-defend': '온도를 조절해 아군을 보호한다.',
  'smell-stimulate': '향기로 순화도를 올린다.',
  'smell-capture': '향기로 교감을 시도한다!',
  'smell-defend': '향기로 아군을 치유한다.',
  'behavior-stimulate': '행동으로 순화도를 올린다.',
  'behavior-capture': '행동으로 교감을 시도한다!',
  'behavior-defend': '행동으로 아군을 수비한다.',
};

function makeSkill(key) {
  const [axis, category] = key.split('-');
  const base = {
    stimulate: { power: 9, escapeRisk: 4, pp: 8, maxPp: 8, effects: [{ type: 'calm', chance: 0.2, turns: 2 }] },
    capture:   { power: 15, escapeRisk: 12, pp: 3, maxPp: 3, effects: [] },
    defend:    { power: 6, escapeRisk: -4, healAmount: 5, defenseBoost: 3, pp: 6, maxPp: 6, effects: [] },
  }[category];
  return { id: key.replace('-', '_'), name: SKILL_NAMES[key], axis, category, ...base, log: SKILL_LOGS[key] };
}

function makeActions(skillFocus) {
  return skillFocus.map(s => makeSkill(s.replace(/\(.*\)/, '').trim()));
}

// ============================================================
// Reaction Templates (by personality)
// ============================================================

const REACTIONS = {
  aggressive: {
    sound_good: '소리에 귀를 기울이며 잠시 멈추었다.',
    sound_bad: '날카로운 소리에 으르렁거린다.',
    temp_good: '따뜻함에 조금 긴장을 풀었다.',
    temp_bad: '온도 변화에 날카롭게 반응한다.',
    smell_good: '냄새를 킁킁거리며 관심을 보인다.',
    smell_bad: '자극적 냄새에 분노하며 달려든다.',
    behav_good: '다가가지 않자 조금 진정했다.',
    behav_bad: '갑작스런 움직임에 공격 자세를 취한다.',
    attack: '맹렬하게 공격했다!',
    calm: '거친 숨을 내쉬며 주저앉았다.',
  },
  timid: {
    sound_good: '소리에 귀를 쫑긋 세운다.',
    sound_bad: '놀라서 몸을 움츠렸다.',
    temp_good: '따뜻함에 살짝 가까이 왔다.',
    temp_bad: '온도 변화에 떨며 물러섰다.',
    smell_good: '향기를 따라 조심스레 다가온다.',
    smell_bad: '강한 냄새에 놀라 숨었다.',
    behav_good: '가만히 있자 조금씩 경계를 풀었다.',
    behav_bad: '갑작스런 동작에 놀라 달아났다.',
    attack: '겁먹은 듯 발버둥 쳤다!',
    calm: '조심스레 가까이 와서 웅크렸다.',
  },
  curious: {
    sound_good: '호기심 가득한 눈으로 소리를 따라간다.',
    sound_bad: '소리에 놀라 고개를 갸웃한다.',
    temp_good: '따뜻함에 몸을 기댄다.',
    temp_bad: '온도 변화에 장난스레 반응한다.',
    smell_good: '냄새를 맡으며 고개를 갸웃한다.',
    smell_bad: '냄새에 코를 찡그리며 뒤로 물러섰다.',
    behav_good: '경계하면서도 꼬리를 흔든다.',
    behav_bad: '갑자기 다가오자 장난기 어린 공격을 한다.',
    attack: '호기심 어린 공격을 날렸다!',
    calm: '관심을 보이며 살금살금 다가왔다.',
  },
  stubborn: {
    sound_good: '눈을 가늘게 뜨고 귀 기울인다.',
    sound_bad: '소리에 꿈쩍도 하지 않는다.',
    temp_good: '따뜻함에 살짝 고개를 내밀었다.',
    temp_bad: '추위에 더 단단히 웅크렸다.',
    smell_good: '냄새에 코를 벌름거린다.',
    smell_bad: '냄새를 무시하고 고개를 돌렸다.',
    behav_good: '느릿느릿 고개를 돌려 바라본다.',
    behav_bad: '꿈쩍도 않고 방어 자세를 취한다.',
    attack: '무거운 몸을 들이밀었다!',
    calm: '편안히 고개를 내밀고 눈을 감았다.',
  },
};

// ============================================================
// Roster Data (24종)
// ============================================================

// Image placeholders (reuse existing assets until proper images are ready)
const EI = 'asset/monsters/'; // enemy image prefix
const AI = 'asset/monsters/'; // ally image prefix
const EIMG = {
  wolf: EI+'enemy_abyss_wolf.png', bat: EI+'enemy_echo_bat.png',
  moth: EI+'enemy_glass_moth.png', jelly: EI+'enemy_fog_jellyfish.png',
  cat: EI+'enemy_shadow_cat.png', deer: EI+'enemy_crystal_deer.png',
  boar: EI+'enemy_iron_boar.png', turtle: EI+'enemy_stone_turtle.png',
  snake: EI+'enemy_dune_stalker.png',
};
const AIMG = {
  attacker: [AI+'fire_ally.png', AI+'fire_devolved.png'],
  tank:     [AI+'grass_ally.png', AI+'grass_devolved.png'],
  support:  [AI+'water_ally.png', AI+'water_devolved.png'],
  speedster:[AI+'fire_ally.png', AI+'fire_devolved.png'],
};

const ROSTER = [
  // #01
  { id: 'howl_wolf', eImg: EIMG.wolf,
    wild: { name: '울부짖는 늑대', desc: '달빛 아래 울부짖으며 음파로 사냥하는 늑대', sensory: ['sound'], pers: 'aggressive', atk: 7, taming: 75, escape: 95, hp: 26, stats: { gentleness:7, empathy:4, resilience:4, agility:5 } },
    d1: { name: '달울림', desc: '울음이 아군을 격려하는 노래꾼', role: 'attacker', hp: 24, stats: { gentleness:12, empathy:3, resilience:3, agility:2 }, skills: ['sound-stimulate','sound-capture','behavior-defend'] },
    d2: { name: '울림이', desc: '작은 입으로 용감하게 울부짖는 꼬마 늑대', hp: 16, stats: { gentleness:7, empathy:2, resilience:2, agility:3 } },
  },
  // #02
  { id: 'ember_salamander', eImg: EIMG.boar,
    wild: { name: '용암 도롱뇽', desc: '용암 속에서 태어나 온몸에 불꽃이 일렁이는 도롱뇽', sensory: ['temperature'], pers: 'aggressive', atk: 8, taming: 80, escape: 100, hp: 24, stats: { gentleness:8, empathy:3, resilience:4, agility:5 } },
    d1: { name: '불씨도롱', desc: '따뜻한 온기를 나누는 불꽃 도롱뇽', role: 'attacker', hp: 22, stats: { gentleness:14, empathy:2, resilience:2, agility:2 }, skills: ['temperature-stimulate','temperature-capture','behavior-defend'] },
    d2: { name: '불씨애', desc: '작은 몸에서 따뜻한 불씨를 피우는 유생', hp: 16, stats: { gentleness:7, empathy:2, resilience:2, agility:3 } },
  },
  // #03
  { id: 'rot_toad', eImg: EIMG.jelly,
    wild: { name: '썩은향 두꺼비', desc: '독한 냄새로 접근하는 모든 것을 내쫓는 두꺼비', sensory: ['smell'], pers: 'aggressive', atk: 7, taming: 78, escape: 110, hp: 35, stats: { gentleness:4, empathy:3, resilience:8, agility:5 } },
    d1: { name: '향기두꺼비', desc: '독기가 약초 향으로 변한 치유의 두꺼비', role: 'tank', hp: 36, stats: { gentleness:3, empathy:3, resilience:12, agility:2 }, skills: ['smell-defend','smell-stimulate','behavior-capture'] },
    d2: { name: '약초올챙이', desc: '몸에서 약초 향이 나는 꼬마 올챙이', hp: 20, stats: { gentleness:2, empathy:2, resilience:8, agility:2 } },
  },
  // #04
  { id: 'stalker_mantis', eImg: EIMG.moth,
    wild: { name: '그림자 사마귀', desc: '소리 없이 접근해 덮치는 거대한 사마귀', sensory: ['behavior'], pers: 'aggressive', atk: 6, taming: 70, escape: 80, hp: 22, stats: { gentleness:5, empathy:5, resilience:2, agility:8 } },
    d1: { name: '춤사마귀', desc: '위협 대신 춤으로 소통하는 우아한 사마귀', role: 'speedster', hp: 20, stats: { gentleness:3, empathy:3, resilience:2, agility:12 }, skills: ['behavior-stimulate','behavior-capture','sound-defend'] },
    d2: { name: '빙글이', desc: '작은 몸으로 빙글빙글 춤추는 꼬마 사마귀', hp: 14, stats: { gentleness:3, empathy:2, resilience:2, agility:7 } },
  },
  // #05
  { id: 'echo_bat', eImg: EIMG.bat,
    wild: { name: '초음파 박쥐', desc: '초음파를 울려 동굴을 지배하는 거대 박쥐', sensory: ['sound'], pers: 'timid', atk: 4, taming: 55, escape: 70, hp: 20, stats: { gentleness:5, empathy:6, resilience:2, agility:7 } },
    d1: { name: '노래박쥐', desc: '초음파가 아름다운 멜로디로 변한 박쥐', role: 'support', hp: 22, stats: { gentleness:3, empathy:10, resilience:2, agility:5 }, skills: ['sound-stimulate','sound-capture','smell-defend'] },
    d2: { name: '흥얼이', desc: '작은 멜로디로 아군을 치유하는 꼬마 박쥐', hp: 18, stats: { gentleness:2, empathy:7, resilience:3, agility:2 } },
  },
  // #06
  { id: 'frost_moth', eImg: EIMG.moth,
    wild: { name: '서리 나방', desc: '날개에 서리가 내려앉은 투명한 거대 나방', sensory: ['temperature'], pers: 'timid', atk: 3, taming: 50, escape: 65, hp: 22, stats: { gentleness:4, empathy:7, resilience:5, agility:4 } },
    d1: { name: '눈꽃나방', desc: '서리가 눈꽃으로 변해 아군을 지키는 나방', role: 'support', hp: 24, stats: { gentleness:2, empathy:12, resilience:3, agility:3 }, skills: ['temperature-defend','temperature-stimulate','behavior-capture'] },
    d2: { name: '눈송이', desc: '작은 눈꽃을 흩뿌리며 치유하는 꼬마 나방', hp: 18, stats: { gentleness:2, empathy:7, resilience:3, agility:2 } },
  },
  // #07
  { id: 'mist_jellyfish', eImg: EIMG.jelly,
    wild: { name: '안개 해파리', desc: '촉수에서 차가운 안개를 뿜는 공중 해파리', sensory: ['smell','temperature'], pers: 'timid', atk: 3, taming: 50, escape: 65, hp: 24, stats: { gentleness:5, empathy:7, resilience:5, agility:3 } },
    d1: { name: '이슬해파리', desc: '이슬방울을 머금은 치유의 해파리', role: 'support', hp: 26, stats: { gentleness:3, empathy:11, resilience:4, agility:2 }, skills: ['smell-defend','temperature-stimulate','smell-capture'] },
    d2: { name: '이슬방울', desc: '작은 방울 모양으로 떠다니는 아기 해파리', hp: 18, stats: { gentleness:2, empathy:7, resilience:3, agility:2 } },
  },
  // #08
  { id: 'vine_spider', eImg: EIMG.moth,
    wild: { name: '덩굴 거미', desc: '냄새나는 덩굴로 거미줄을 치는 거미', sensory: ['smell'], pers: 'timid', atk: 4, taming: 58, escape: 75, hp: 30, stats: { gentleness:3, empathy:5, resilience:7, agility:5 } },
    d1: { name: '꽃거미', desc: '꽃향기 나는 실을 짜서 아군을 보호하는 거미', role: 'tank', hp: 32, stats: { gentleness:2, empathy:3, resilience:12, agility:3 }, skills: ['smell-defend','smell-stimulate','behavior-capture'] },
    d2: { name: '꽃봉이', desc: '등에 작은 꽃봉오리를 달고 다니는 꼬마 거미', hp: 20, stats: { gentleness:2, empathy:2, resilience:8, agility:2 } },
  },
  // #09
  { id: 'mirror_chameleon', eImg: EIMG.cat,
    wild: { name: '거울 카멜레온', desc: '몸을 투명하게 바꿔 관찰하는 카멜레온', sensory: ['behavior'], pers: 'curious', atk: 4, taming: 55, escape: 70, hp: 25, stats: { gentleness:5, empathy:7, resilience:4, agility:4 } },
    d1: { name: '빛도마뱀', desc: '빛을 반사해 스킬을 증폭시키는 도마뱀', role: 'support', hp: 24, stats: { gentleness:3, empathy:12, resilience:2, agility:3 }, skills: ['behavior-stimulate','behavior-capture','temperature-defend'] },
    d2: { name: '반짝이', desc: '몸에서 작은 빛을 반사하며 반짝거리는 도마뱀', hp: 18, stats: { gentleness:2, empathy:7, resilience:3, agility:2 } },
  },
  // #10
  { id: 'crystal_stag', eImg: EIMG.deer,
    wild: { name: '수정 사슴', desc: '수정 뿔에서 맑은 소리가 울려퍼지는 사슴', sensory: ['sound','smell'], pers: 'curious', atk: 5, taming: 65, escape: 75, hp: 26, stats: { gentleness:7, empathy:5, resilience:4, agility:4 } },
    d1: { name: '종소리사슴', desc: '뿔에서 맑은 종소리가 울려 매혹시키는 사슴', role: 'attacker', hp: 24, stats: { gentleness:12, empathy:3, resilience:3, agility:2 }, skills: ['sound-stimulate','smell-stimulate','sound-capture'] },
    d2: { name: '딸랑이', desc: '작은 뿔에서 딸랑딸랑 소리를 내는 아기 사슴', hp: 16, stats: { gentleness:7, empathy:2, resilience:2, agility:3 } },
  },
  // #11
  { id: 'lava_crab', eImg: EIMG.boar,
    wild: { name: '용암 집게', desc: '뜨거운 집게로 바위를 녹이는 화산 게', sensory: ['temperature','behavior'], pers: 'curious', atk: 5, taming: 60, escape: 85, hp: 34, stats: { gentleness:4, empathy:4, resilience:7, agility:5 } },
    d1: { name: '온천게', desc: '집게에서 따뜻한 물이 나오는 온화한 게', role: 'tank', hp: 36, stats: { gentleness:2, empathy:3, resilience:13, agility:2 }, skills: ['temperature-defend','behavior-defend','temperature-capture'] },
    d2: { name: '따끈돌', desc: '따끈한 등딱지에서 김이 나는 꼬마 게', hp: 20, stats: { gentleness:2, empathy:2, resilience:8, agility:2 } },
  },
  // #12
  { id: 'spore_fox', eImg: EIMG.cat,
    wild: { name: '포자 여우', desc: '꼬리에서 환각 포자를 뿌리며 장난치는 여우', sensory: ['smell','behavior'], pers: 'curious', atk: 4, taming: 55, escape: 70, hp: 22, stats: { gentleness:6, empathy:5, resilience:3, agility:6 } },
    d1: { name: '향여우', desc: '달콤한 향기로 적의 경계를 풀어버리는 여우', role: 'attacker', hp: 22, stats: { gentleness:10, empathy:3, resilience:2, agility:5 }, skills: ['smell-stimulate','behavior-stimulate','smell-capture'] },
    d2: { name: '향기꼬마', desc: '달콤한 향을 뿌리는 아기 여우', hp: 16, stats: { gentleness:7, empathy:2, resilience:2, agility:3 } },
  },
  // #13
  { id: 'iron_boar', eImg: EIMG.boar,
    wild: { name: '강철 멧돼지', desc: '강철 갈기를 세우고 돌진하는 멧돼지', sensory: ['smell','temperature'], pers: 'stubborn', atk: 9, taming: 85, escape: 120, hp: 38, stats: { gentleness:3, empathy:3, resilience:9, agility:5 } },
    d1: { name: '철등멧돼지', desc: '강철 등으로 아군을 지키는 방패', role: 'tank', hp: 40, stats: { gentleness:2, empathy:2, resilience:14, agility:2 }, skills: ['smell-defend','temperature-defend','behavior-capture'] },
    d2: { name: '자갈돼지', desc: '작고 단단한 등판으로 뒹구는 아기 멧돼지', hp: 20, stats: { gentleness:2, empathy:2, resilience:8, agility:2 } },
  },
  // #14
  { id: 'stone_tortoise', eImg: EIMG.turtle,
    wild: { name: '바위 거북', desc: '등에 이끼가 자란 거대한 고대 거북', sensory: ['temperature'], pers: 'stubborn', atk: 8, taming: 82, escape: 115, hp: 40, stats: { gentleness:3, empathy:3, resilience:9, agility:5 } },
    d1: { name: '이끼거북', desc: '등의 이끼에서 약초가 자라나는 치유 거북', role: 'tank', hp: 42, stats: { gentleness:2, empathy:2, resilience:14, agility:2 }, skills: ['temperature-defend','smell-defend','temperature-capture'] },
    d2: { name: '조약돌거북', desc: '작고 둥근 돌등판으로 웅크리는 아기 거북', hp: 20, stats: { gentleness:2, empathy:2, resilience:8, agility:2 } },
  },
  // #15
  { id: 'rumble_bear', eImg: EIMG.wolf,
    wild: { name: '진동 곰', desc: '발걸음마다 땅이 울리는 거대한 산악 곰', sensory: ['sound','behavior'], pers: 'stubborn', atk: 8, taming: 80, escape: 105, hp: 34, stats: { gentleness:6, empathy:3, resilience:6, agility:5 } },
    d1: { name: '북소리곰', desc: '배를 두드려 리듬을 만드는 힘센 곰', role: 'attacker', hp: 30, stats: { gentleness:11, empathy:2, resilience:5, agility:2 }, skills: ['sound-stimulate','behavior-stimulate','sound-capture'] },
    d2: { name: '톡톡곰', desc: '작은 배를 톡톡 두드리며 소리를 내는 아기 곰', hp: 16, stats: { gentleness:7, empathy:2, resilience:2, agility:3 } },
  },
  // #16
  { id: 'thorn_hedgehog', eImg: EIMG.cat,
    wild: { name: '가시 고슴도치', desc: '독가시를 세우고 냄새로 영역을 표시하는 고슴도치', sensory: ['smell'], pers: 'stubborn', atk: 6, taming: 72, escape: 100, hp: 32, stats: { gentleness:4, empathy:3, resilience:8, agility:5 } },
    d1: { name: '꽃가시', desc: '가시 끝에 작은 꽃이 피어난 고슴도치', role: 'tank', hp: 34, stats: { gentleness:3, empathy:2, resilience:13, agility:2 }, skills: ['smell-defend','behavior-defend','smell-capture'] },
    d2: { name: '꽃봉가시', desc: '가시에 꽃봉오리가 맺힌 아기 고슴도치', hp: 20, stats: { gentleness:2, empathy:2, resilience:8, agility:2 } },
  },
  // #17
  { id: 'storm_hawk', eImg: EIMG.bat,
    wild: { name: '폭풍 매', desc: '날개짓으로 폭풍을 일으키는 하늘의 사냥꾼', sensory: ['sound','temperature'], pers: 'aggressive', atk: 6, taming: 72, escape: 80, hp: 22, stats: { gentleness:6, empathy:4, resilience:3, agility:7 } },
    d1: { name: '바람매', desc: '부드러운 바람을 일으켜 매혹시키는 매', role: 'attacker', hp: 22, stats: { gentleness:10, empathy:3, resilience:2, agility:5 }, skills: ['sound-stimulate','temperature-stimulate','sound-capture'] },
    d2: { name: '솔바람병아리', desc: '작은 날갯짓으로 미풍을 일으키는 아기 매', hp: 16, stats: { gentleness:7, empathy:2, resilience:2, agility:3 } },
  },
  // #18
  { id: 'shadow_cat', eImg: EIMG.cat,
    wild: { name: '그림자 고양이', desc: '그림자처럼 일렁이며 호기심 가득한 고양이', sensory: ['behavior','temperature'], pers: 'curious', atk: 5, taming: 55, escape: 70, hp: 22, stats: { gentleness:5, empathy:5, resilience:3, agility:7 } },
    d1: { name: '달빛고양이', desc: '달빛처럼 은은하게 빛나며 빠르게 움직이는 고양이', role: 'speedster', hp: 20, stats: { gentleness:3, empathy:4, resilience:2, agility:11 }, skills: ['behavior-stimulate','temperature-stimulate','behavior-capture'] },
    d2: { name: '깜빡냥이', desc: '그림자 속에서 깜빡이며 움직이는 아기 고양이', hp: 14, stats: { gentleness:3, empathy:2, resilience:2, agility:7 } },
  },
  // #19
  { id: 'coral_seahorse', eImg: EIMG.jelly,
    wild: { name: '산호 해마', desc: '산호처럼 화려하고 물 온도로 감정을 표현하는 해마', sensory: ['temperature','smell'], pers: 'timid', atk: 4, taming: 52, escape: 68, hp: 20, stats: { gentleness:7, empathy:5, resilience:3, agility:5 } },
    d1: { name: '온도해마', desc: '몸 색깔로 온도를 전달해 매혹시키는 해마', role: 'attacker', hp: 20, stats: { gentleness:12, empathy:3, resilience:2, agility:3 }, skills: ['temperature-stimulate','smell-stimulate','temperature-capture'] },
    d2: { name: '불씨조랑', desc: '조그만 몸에서 따끈한 온기가 나오는 꼬마 해마', hp: 16, stats: { gentleness:7, empathy:2, resilience:2, agility:3 } },
  },
  // #20
  { id: 'wind_serpent', eImg: EIMG.snake,
    wild: { name: '바람 뱀', desc: '바람을 타고 날아다니며 쉿 소리를 내는 뱀', sensory: ['behavior','sound'], pers: 'aggressive', atk: 7, taming: 73, escape: 85, hp: 24, stats: { gentleness:7, empathy:4, resilience:3, agility:6 } },
    d1: { name: '산들뱀', desc: '부드러운 바람 소리를 내며 날아다니는 뱀', role: 'attacker', hp: 22, stats: { gentleness:12, empathy:3, resilience:2, agility:3 }, skills: ['behavior-stimulate','sound-stimulate','behavior-capture'] },
    d2: { name: '돌풍이', desc: '작은 날개를 퍼덕이며 바람을 일으키는 꼬마 뱀', hp: 16, stats: { gentleness:7, empathy:2, resilience:2, agility:3 } },
  },
  // #21
  { id: 'swamp_leech', eImg: EIMG.jelly,
    wild: { name: '늪지 거머리', desc: '거대한 몸에서 독한 점액을 흘리는 늪의 포식자', sensory: ['smell','behavior'], pers: 'stubborn', atk: 5, taming: 75, escape: 105, hp: 30, stats: { gentleness:4, empathy:6, resilience:6, agility:4 } },
    d1: { name: '약초거머리', desc: '점액이 치유 성분으로 변한 거머리', role: 'support', hp: 28, stats: { gentleness:2, empathy:10, resilience:5, agility:3 }, skills: ['smell-defend','behavior-defend','smell-capture'] },
    d2: { name: '약초방울', desc: '동글동글한 몸에서 약초 향이 나는 꼬마 거머리', hp: 18, stats: { gentleness:2, empathy:7, resilience:3, agility:2 } },
  },
  // #22
  { id: 'thunder_eel', eImg: EIMG.snake,
    wild: { name: '번개 장어', desc: '몸에서 전기를 뿜어 물속을 마비시키는 장어', sensory: ['sound','temperature'], pers: 'timid', atk: 5, taming: 58, escape: 72, hp: 22, stats: { gentleness:8, empathy:4, resilience:3, agility:5 } },
    d1: { name: '불꽃장어', desc: '전기가 따뜻한 빛으로 변해 아군을 비추는 장어', role: 'attacker', hp: 20, stats: { gentleness:14, empathy:2, resilience:2, agility:2 }, skills: ['sound-stimulate','temperature-stimulate','sound-capture'] },
    d2: { name: '불꽃콩', desc: '따끈한 불꽃이 깜빡이는 꼬마 장어', hp: 16, stats: { gentleness:7, empathy:2, resilience:2, agility:3 } },
  },
  // #23
  { id: 'smoke_weasel', eImg: EIMG.cat,
    wild: { name: '연기 족제비', desc: '연기처럼 사라졌다 나타나며 혼란을 주는 족제비', sensory: ['behavior'], pers: 'timid', atk: 4, taming: 52, escape: 65, hp: 20, stats: { gentleness:5, empathy:5, resilience:2, agility:8 } },
    d1: { name: '안개족제비', desc: '부드러운 안개로 아군을 숨겨주는 족제비', role: 'speedster', hp: 18, stats: { gentleness:3, empathy:3, resilience:2, agility:12 }, skills: ['behavior-defend','behavior-stimulate','behavior-capture'] },
    d2: { name: '안개새끼', desc: '안개 속을 뛰어다니는 꼬마 족제비', hp: 14, stats: { gentleness:3, empathy:2, resilience:2, agility:7 } },
  },
  // #24
  { id: 'moss_golem', eImg: EIMG.turtle,
    wild: { name: '이끼 골렘', desc: '오래된 이끼와 바위로 이루어진 거대한 골렘', sensory: ['smell','sound'], pers: 'stubborn', atk: 7, taming: 82, escape: 115, hp: 42, stats: { gentleness:3, empathy:3, resilience:9, agility:5 } },
    d1: { name: '숲골렘', desc: '이끼에서 새싹이 자라나는 수호의 골렘', role: 'tank', hp: 44, stats: { gentleness:2, empathy:2, resilience:14, agility:2 }, skills: ['smell-defend','sound-defend','smell-capture'] },
    d2: { name: '숲조약돌', desc: '동글동글한 돌 위에 이끼가 자라는 꼬마 골렘', hp: 20, stats: { gentleness:2, empathy:2, resilience:8, agility:2 } },
  },
];

// ============================================================
// Expand Roster → ALLY_MONSTERS / ENEMY_MONSTERS
// ============================================================

export const ALLY_MONSTERS = ROSTER.map(r => {
  const d = r.d1;
  const imgs = AIMG[d.role] || AIMG.attacker;
  return {
    id: r.id, name: d.name, desc: d.desc,
    img: imgs[0], devolvedImg: imgs[1],
    hp: d.hp, maxHp: d.hp,
    stats: { ...d.stats },
    devolvedStats: r.d2.stats ? { ...r.d2.stats } : null,
    xp: 0, xpThreshold: 5, inEgg: false, devolved: false,
    devolvedName: r.d2.name, devolvedDesc: r.d2.desc,
    actions: makeActions(d.skills),
  };
});

export const ENEMY_MONSTERS = ROSTER.map(r => {
  const w = r.wild;
  return {
    id: r.id, name: w.name, desc: w.desc,
    img: r.eImg,
    attackPower: w.atk, tamingThreshold: w.taming, escapeThreshold: w.escape,
    sensoryType: w.sensory, personality: w.pers,
    reactions: REACTIONS[w.pers] || REACTIONS.aggressive,
  };
});

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
