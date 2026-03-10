const fs = require('fs');
const path = require('path');

const rosterDir = path.join(__dirname, 'roster');

// ===== 야생형 키메라 베이스 묘사 (각 몬스터별 고유) =====
const wildChimeraBase = {
  1: "늑대의 실루엣 위에 박쥐의 날개막, 뱀의 분열된 턱, 곤충의 더듬이가 뒤엉킨 괴생명체. 등에서 돋아난 가시 같은 돌기, 몸 곳곳에 비정상적으로 배치된 눈들, 관절이 꺾인 방향으로 구부러진 다리",
  2: "도롱뇽 몸통에 갑각류의 딱딱한 껍질, 불꽃 같은 갈기, 지네의 다리가 옆구리에서 줄지어 돋아난 괴생명체. 균열된 피부 사이로 용암 빛이 새어 나오고, 꼬리 끝에 전갈의 독침 구조가 달려 있다",
  3: "두꺼비 체형에 버섯 균사가 피부를 뚫고 자라나고, 오징어 촉수가 입 주변에서 꿈틀거리는 괴생명체. 등에는 곤충의 겹눈이 여러 개 박혀 있고, 갈라진 배에서 독액이 흘러내린다",
  4: "사마귀의 낫팔에 거미의 여러 다리, 전갈의 꼬리, 파충류의 비늘이 뒤섞인 괴생명체. 머리에서 뿔 같은 돌기가 솟아 있고, 투명한 곤충 날개가 찢어진 채 등에 달려 있다",
  5: "박쥐의 거대한 날개에 해파리의 반투명 촉수가 매달리고, 나방의 인분 무늬 눈알이 날개에 박힌 괴생명체. 뱀의 열감지 기관이 얼굴 양옆에 돋아 있고, 갑각류의 집게가 발 대신 달려 있다",
  6: "나방의 거대한 날개에 얼음 결정이 자라나고, 사슴뿔처럼 갈라진 더듬이, 거미줄 무늬의 날개맥이 뒤엉킨 괴생명체. 몸통에 파충류의 비늘이 섞여 있고, 꼬리에 해파리의 촉수가 달려 있다",
  7: "해파리의 반투명 몸체에 오징어의 거대 촉수, 산호의 석회질 갑각, 심해어의 아귀등 발광기가 뒤섞인 괴생명체. 내부에 뱀 같은 구조물이 꿈틀거리고, 가시복어의 독침이 몸 표면을 덮고 있다",
  8: "거미의 다리에 덩굴이 감긴 채 꽃잎 같은 턱이 벌어지고, 도마뱀 꼬리가 여러 갈래로 갈라진 괴생명체. 등에서 균사 같은 실이 뻗어 나오고, 나비의 무늬가 몸통에 기괴하게 분포한다",
  9: "카멜레온의 회전하는 눈에 문어 촉수, 깨진 거울 같은 비늘, 나비의 무늬가 불규칙하게 뒤섞인 괴생명체. 몸 색이 불안정하게 깜빡이며 변하고, 도마뱀의 꼬리가 여러 갈래로 뻗어 있다",
  10: "사슴의 거대한 몸에 수정 기둥이 뿔처럼 솟아나고, 암석 갑각이 몸을 덮으며, 도마뱀의 갈라진 꼬리가 달린 괴생명체. 균열 사이로 차가운 빛이 새어 나오고, 곤충의 겹눈이 이마에 박혀 있다",
  11: "게의 갑각에 용암이 균열처럼 흐르고, 전갈의 여러 집게, 뱀의 꼬리가 꿈틀거리는 괴생명체. 등껍질에서 화산석 돌기가 솟아 있고, 갑각류와 파충류의 특징이 기괴하게 혼합되어 있다",
  12: "여우의 실루엣에 버섯 갓이 갈기처럼 자라나고, 식물 덩굴 촉수가 꼬리에서 뻗어 나오는 괴생명체. 곤충의 더듬이가 귀 대신 솟아 있고, 몸에서 포자 구름이 피어오른다",
  13: "멧돼지의 몸에 금속 광택의 갑각, 코뿔소처럼 갈라진 뿔, 도마뱀의 등판 돌기가 결합된 괴생명체. 관절에서 톱니바퀴 같은 구조물이 돌출되고, 눈이 비정상적으로 작고 많다",
  14: "거북의 등껍질에 암석과 수정이 자라나고, 선인장 가시가 돋아나며, 갑각류의 다리가 뒤섞인 괴생명체. 껍질 틈에서 식물 뿌리 같은 촉수가 나오고, 얼굴에 곤충의 큰턱이 달려 있다",
  15: "곰의 거대한 체형에 암석 갑각이 어깨를 덮고, 두더지의 거대 발톱, 고릴라의 과장된 팔이 결합된 괴생명체. 입에서 진동파가 보이고, 등에 뿔 같은 암석 돌기가 줄지어 솟아 있다",
  16: "고슴도치의 체형에 선인장의 거대 가시, 전갈의 꼬리, 딱정벌레의 광택 갑각이 뒤엉킨 괴생명체. 가시 끝에서 독액이 맺히고, 눈 주변에 갑각류의 돌기가 돋아 있다",
  17: "매의 날개에 번개 무늬의 깃털, 박쥐의 막날개가 겹쳐지고, 뱀의 꼬리가 달린 괴생명체. 부리가 갈라져 뱀의 혀가 보이고, 발톱이 갑각류의 집게처럼 변형되어 있다",
  18: "고양이 실루엣에서 그림자 같은 촉수가 뻗어 나오고, 카멜레온의 독립 회전 눈, 박쥐의 찢어진 날개가 달린 괴생명체. 몸이 반투명하게 일렁이며, 꼬리가 여러 갈래 뱀처럼 갈라져 있다",
  19: "해마의 몸에 산호가 갑각처럼 자라나고, 해파리의 독촉수, 복어의 팽창 가시가 뒤섞인 괴생명체. 몸 표면에서 열기/냉기가 불안정하게 교차하며, 심해어의 발광 기관이 군데군데 박혀 있다",
  20: "뱀의 긴 몸에 새의 깃털 비늘, 곤충의 투명 날개, 도마뱀의 다리가 군데군데 돋아난 괴생명체. 목 주변에 코브라의 후드와 공작의 깃이 혼합된 구조물이 펼쳐져 있다",
  21: "거머리의 연체 몸에 갑각류의 집게, 곰팡이 포자낭, 뱀의 비늘이 뒤섞인 괴생명체. 몸 표면에서 점액 촉수가 사방으로 뻗고, 입이 여러 겹의 이빨 링으로 되어 있다",
  22: "뱀장어의 긴 몸에 전기 방전 촉수, 상어의 지느러미, 해파리의 발광 기관이 결합된 괴생명체. 몸을 감싼 전기장이 불안정하게 깜빡이고, 입에 심해어의 날카로운 이빨이 줄지어 있다",
  23: "족제비의 몸에서 연기 같은 꼬리가 피어오르고, 박쥐의 막날개, 도마뱀의 비늘이 뒤엉킨 괴생명체. 몸 표면에서 유독 가스가 새어 나오고, 눈이 곤충처럼 복안 구조로 되어 있다",
  24: "돌과 이끼로 이루어진 거대한 인형 같은 괴생명체. 나무 뿌리가 팔처럼 뻗어 있고, 버섯 포자가 어깨에서 피어나며, 얼굴에 해당하는 부분에 이끼 사이로 여러 개의 돌 눈이 박혀 있다"
};

// ===== 스킬 축 → 시각적 특징 매핑 =====
const skillTraitMap = {
  'sound-stimulate': '음파 발성기관(공명낭, 울림목)',
  'sound-capture': '음파 감지기관(크고 예민한 귀, 진동막)',
  'sound-defend': '음파 방어구조(진동 흡수 갑각, 공명 보호막)',
  'sound-defend(heal)': '음파 치유기관(회복 진동 공명낭, 치유 울림막)',
  'temperature-stimulate': '열/냉 방출기관(화염 분출구, 얼음 결정 돌기)',
  'temperature-capture': '온도 감지/흡수기관(열감지 피부, 흡열판)',
  'temperature-defend': '단열 방어구조(내열/내한 갑각, 단열 껍질)',
  'temperature-defend(heal)': '온기 치유기관(따뜻한 증기 분출구, 회복열 피부)',
  'smell-stimulate': '화학물질 분사기관(독선, 포자 발사기)',
  'smell-capture': '화학 감지기관(예민한 촉수, 후각 더듬이)',
  'smell-defend': '화학 방어/해독기관(해독 분비선, 방어 포자낭)',
  'smell-defend(heal)': '치유 분비기관(치유 점액선, 회복 포자낭)',
  'behavior-stimulate': '물리 돌격기관(날카로운 발톱, 돌진 뿔)',
  'behavior-capture': '속박/포획기관(포박 촉수, 그물 분사기)',
  'behavior-defend': '물리 방어구조(두꺼운 갑각, 방패 형태 체형)',
  'behavior-defend(heal)': '보호 치유구조(감싸는 날개, 치유 체온 전달 기관)',
};

// ===== 스킬 → 야생 키메라에 녹아든 시각적 힌트 =====
const skillChimeraHint = {
  'sound-stimulate': '기괴하게 벌어진 공명 입에서 음파가 일렁이고',
  'sound-capture': '비정상적으로 큰 귀와 진동막이 머리 양옆에 돋아 있고',
  'sound-defend': '진동을 흡수하는 울퉁불퉁한 갑각 조각이 몸 일부를 덮고',
  'temperature-stimulate': '갈라진 피부 틈에서 불꽃/냉기가 불안정하게 새어 나오고',
  'temperature-capture': '열을 빨아들이는 검붉은 흡열판이 등에 분포하고',
  'temperature-defend': '내열성 껍질 파편이 관절과 등을 부분적으로 감싸고',
  'smell-stimulate': '독액이 맺힌 분사관이 몸 곳곳에서 돌출되어 있고',
  'smell-capture': '냄새를 감지하는 촉수 같은 더듬이가 얼굴에서 꿈틀거리고',
  'smell-defend': '해독 포자를 뿜는 낭이 등에 불규칙하게 자라나 있고',
  'behavior-stimulate': '뼈 돌기와 날카로운 발톱이 사지에서 비정상적으로 자라나 있고',
  'behavior-capture': '먹잇감을 옥죄는 촉수/그물 기관이 몸에서 늘어져 있고',
  'behavior-defend': '방패처럼 두꺼운 갑각 덩어리가 몸 전면에 뭉쳐 있고',
};

// ===== 역할 → 퇴화1 외형 분위기 =====
const roleVibeMap = {
  'attacker': '날렵하고 공격적인 실루엣',
  'tank': '단단하고 육중한 체형',
  'support': '부드럽고 신비로운 분위기',
  'speedster': '날씬하고 유선형의 빠른 체형',
};

// 스킬포커스 파싱
function parseSkillFocus(skillFocus) {
  return skillFocus.split('/').map(s => s.trim());
}

// 스킬에서 축 추출: "sound-defend(heal)" → "sound"
function getAxis(skill) {
  return skill.split('-')[0];
}

// 스킬에서 카테고리 추출: "sound-defend(heal)" → "defend"
function getCategory(skill) {
  if (skill.includes('stimulate')) return 'stimulate';
  if (skill.includes('defend')) return 'defend';
  if (skill.includes('capture')) return 'capture';
  return null;
}

// ===== 야생 스킬 3개 도출: 자극/수비/포획 각 1개 =====
// devo1 branches에서 카테고리별 가장 흔한 축 선택
function deriveWildSkills(devo1List) {
  const byCategory = { stimulate: {}, defend: {}, capture: {} };

  for (const d of devo1List) {
    const skills = parseSkillFocus(d.skillFocus);
    for (const s of skills) {
      const cat = getCategory(s);
      const axis = getAxis(s);
      if (cat && byCategory[cat]) {
        byCategory[cat][axis] = (byCategory[cat][axis] || 0) + 1;
      }
    }
  }

  // 각 카테고리에서 가장 빈도 높은 축 선택
  function topAxis(counts) {
    const entries = Object.entries(counts);
    if (entries.length === 0) return null;
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }

  const stimAxis = topAxis(byCategory.stimulate);
  const defAxis = topAxis(byCategory.defend);
  const capAxis = topAxis(byCategory.capture);

  return [
    stimAxis ? `${stimAxis}-stimulate` : null,
    defAxis ? `${defAxis}-defend` : null,
    capAxis ? `${capAxis}-capture` : null,
  ].filter(Boolean);
}

// ===== 야생 스킬 시각 힌트 텍스트 생성 =====
function getWildSkillHints(wildSkills) {
  const hints = wildSkills
    .map(s => skillChimeraHint[s])
    .filter(Boolean);
  if (hints.length === 0) return '';
  return hints.join(' ');
}

function processMonster(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const id = data.id;
  const wild = data.wild;
  const colors = wild.visual.colors;

  const chimeraBase = wildChimeraBase[id];
  if (!chimeraBase) {
    console.warn(`No chimera desc for id ${id}, skipping.`);
    return;
  }

  // ===== 야생 스킬 도출 & 추가 =====
  const wildSkills = deriveWildSkills(data.devo1);
  wild.skills = wildSkills;

  // ===== 야생형 image_desc =====
  const skillHints = getWildSkillHints(wildSkills);
  const skillLabels = wildSkills.map(s => {
    const trait = skillTraitMap[s];
    return trait ? trait.split('(')[0].trim() : s;
  });

  wild.visual.image_desc = `야생형. 알 수 없는 공포의 괴생명체 — ${chimeraBase}. 이 키메라의 몸에는 세 가지 이질적 기관이 뒤섞여 있다: ${skillHints}. 자극 시 ${skillLabels[0] || '?'}이, 수비 시 ${skillLabels[1] || '?'}이, 포획 시 ${skillLabels[2] || '?'}이 반응하며 빛난다. 퇴화하면 가장 많이 사용한 기관이 남고 나머지는 사라질 것을 암시한다. 위압적이고 불안정한 외형, 어둡고 채도 높은 색감. 기본색 ${colors.primary}, 보조색 ${colors.secondary}, 강조색 ${colors.accent}`;

  // ===== 퇴화1 + 퇴화2 image_desc 업데이트 =====
  for (const devo1 of data.devo1) {
    const d1Colors = devo1.visual.colors;
    const roleVibe = roleVibeMap[devo1.role] || '정돈된 체형';
    const primarySkill = parseSkillFocus(devo1.skillFocus)[0];
    const primaryTrait = skillTraitMap[primarySkill] || primarySkill;

    devo1.visual.image_desc = `퇴화1. ${devo1.name_kr} — 야생형의 키메라적 잡다한 부위가 퇴화하고, ${primaryTrait}이 가장 발달하여 남은 ${roleVibe}. 괴생명체의 공포감은 사라지고 ${devo1.desc_kr.replace(/\.$/, '')}의 멋진 모습. 동일 컬러 팔레트 유지. 기본색 ${d1Colors.primary}, 보조색 ${d1Colors.secondary}, 강조색 ${d1Colors.accent}`;

    for (const devo2 of devo1.devo2) {
      const d2Colors = devo2.visual.colors;
      devo2.visual.image_desc = `퇴화2. ${devo2.name_kr} — ${primaryTrait}의 흔적을 작고 귀엽게 유지한 가장 퇴화된 형태. 동글동글한 체형, 큰 머리, 큰 눈, 짧은 다리. ${devo2.desc_kr.replace(/\.$/, '')}의 아주 귀여운 모습. 동일 컬러 팔레트 유지. 기본색 ${d2Colors.primary}, 보조색 ${d2Colors.secondary}, 강조색 ${d2Colors.accent}`;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated: ${path.basename(filePath)} | skills: [${wildSkills.join(', ')}]`);
}

// ===== 모든 roster 파일 처리 =====
const files = fs.readdirSync(rosterDir)
  .filter(f => f.endsWith('.json'))
  .sort();

for (const file of files) {
  processMonster(path.join(rosterDir, file));
}

console.log(`\nDone! Updated ${files.length} files.`);
