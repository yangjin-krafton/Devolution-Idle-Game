# Skills Module Framework

## 목적

`src/data/skills/`는 메인게임 전투에서 재사용할 수 있는 스킬 데이터 프레임워크다.

이 모듈의 목표:

- 스킬을 하드코딩이 아니라 데이터 중심으로 관리
- 스킬 파일 추가만으로 확장 가능
- 몬스터별 `skillPool / equipped / actions` 구조 지원
- 전투 엔진, UI, 몬스터 데이터가 같은 스킬 정의를 공유

관련 기획 문서:

- [skill.기록.md](./skill.%EA%B8%B0%EB%A1%9D.md)

## 현재 구조

```text
src/data/skills/
  core/
    schema.js
    registry.js
  catalogs/
    stimulate/
      sound.js
      temperature.js
      smell.js
      behavior.js
      index.js
    capture/
      standard.js
      advanced.js
      index.js
    defend/
      standard.js
      advanced.js
      index.js
    index.js
  index.js
  README.md
  skill.기록.md
```

## 파일 역할

| 파일 | 역할 |
|---|---|
| `core/schema.js` | 스킬 공통 스키마 정의, 기본값 설정, 복제 처리 |
| `core/registry.js` | 스킬 레지스트리 조립, 조회/정규화/로드아웃 API 제공 |
| `catalogs/.../*.js` | 실제 스킬 데이터 정의 |
| `catalogs/index.js` | 모든 카탈로그 소스 묶음 |
| `index.js` | 외부 사용 진입점 |

## 외부 API

메인게임에서 사용하는 기본 진입점:

```js
import {
  SKILL_LIBRARY,
  SKILL_KEYS,
  SKILL_VALIDATION,
  getSkill,
  listSkills,
  listSkillsByCategory,
  listSkillsByAxis,
  listSkillsByRole,
  makeSkill,
  makeActions,
  createSkillLoadout,
  normalizeSkillLoadout,
} from './skills.js';
```

### API 설명

| API | 설명 |
|---|---|
| `getSkill(key)` | 원본 스킬 조회 |
| `makeSkill(key)` | 전투 중 사용 가능한 복제 스킬 생성 |
| `makeActions(keys)` | 키 배열을 액션 배열로 변환 |
| `listSkills()` | 전체 스킬 목록 복제 반환 |
| `listSkillsByCategory(category)` | 카테고리별 조회 |
| `listSkillsByAxis(axis)` | 감각축별 조회 |
| `listSkillsByRole(role)` | 역할군별 조회 |
| `createSkillLoadout(skillPoolKeys, equippedKeys?)` | 스킬 풀과 장착 스킬을 동시에 생성 |
| `normalizeSkillLoadout(monster)` | 기존 `actions` 기반 몬스터도 `skillPool / equipped / actions` 구조로 정규화 |
| `SKILL_VALIDATION` | 현재 스킬 라이브러리 검증 결과 |

## 스킬 공통 스키마

모든 스킬은 `defineSkill(id, config)`로 만든다.

현재 지원 필드:

| 필드 | 설명 |
|---|---|
| `id`, `key` | 스킬 고유 키 |
| `name` | 표시 이름 |
| `category` | `stimulate`, `capture`, `defend` |
| `role` | 기획 역할군 태그 |
| `axis` | `sound`, `temperature`, `smell`, `behavior` |
| `targetType` | 대상 타입 (`enemy`, `self`, `ally_team` 등) |
| `priority` | 행동 우선도 |
| `power` | 기본 위력/효율 값 |
| `pp`, `maxPp` | 사용 가능 횟수 |
| `escapeRisk` | 도주 위험 변화 |
| `healAmount` | 회복량 |
| `defenseBoost` | 방어 상승량 |
| `effects` | 감정/상태 부여 배열 |
| `condition` | 사용 또는 강화 조건 |
| `stateBonus` | 감정 상태 기반 추가 보정 |
| `swapSynergy` | 교체 연계 효과 |
| `log` | 전투 로그 문구 |
| `desc` | 설명 |
| `rarity` | 희귀도 |
| `tags` | 검색/분배용 태그 |
| `aliases` | 별칭 키 |

## 스킬 추가 방법

### 1. 적절한 카탈로그 파일 선택

- 자극 스킬: `catalogs/stimulate/`
- 교감 스킬: `catalogs/capture/`
- 수비 스킬: `catalogs/defend/`

필요하면 새 파일을 만들어도 된다.

### 2. 스킬 정의 추가

```js
import { defineSkill } from '../../core/schema.js';

export default {
  'sound-resonance': defineSkill('sound-resonance', {
    name: '공명 반사',
    category: 'stimulate',
    role: 'emotion_setup',
    axis: 'sound',
    targetType: 'enemy',
    priority: 1,
    power: 9,
    pp: 6,
    escapeRisk: 3,
    effects: [{ type: 'curious', chance: 0.3 }],
    stateBonus: { ifEnemyEmotion: 'calm', tamingPowerBonus: 2 },
    log: '부드러운 공명을 되돌려 보낸다.',
    tags: ['sound'],
  }),
};
```

### 3. 카탈로그 index에 연결

예:

```js
import sound from './sound.js';
import extra from './extra.js';

export default {
  ...sound,
  ...extra,
};
```

## 메인게임 연동 방식

### 몬스터 데이터에서 바로 쓰는 방식

기존 방식 유지 가능:

```js
actions: makeActions(['sound-stimulate', 'sound-capture', 'behavior-defend'])
```

### 장기적으로 권장하는 방식

```js
skillPool: ['sound-stimulate', 'sound-lullaby', 'sound-capture', 'behavior-defend'],
equipped: ['sound-stimulate', 'sound-capture', 'behavior-defend']
```

런타임에서는 `normalizeSkillLoadout(monster)`를 통해:

- `skillPool`
- `equipped`
- `actions`

구조가 같이 생성된다.

## 현재 호환 정책

| 항목 | 상태 |
|---|---|
| 기존 몬스터의 `actions`만 있는 데이터 | 지원 |
| 새 몬스터의 `skillPool / equipped` 구조 | 지원 |
| 전투 중 PP 감소 | 복제 스킬 기준으로 처리 |
| UI 기존 액션 카드 | `actions` 배열 그대로 사용 가능 |

## 메인게임에서 앞으로 연결할 부분

| 항목 | 설명 |
|---|---|
| `condition` 해석 | 순화율, 감정 상태, 턴 조건에 따른 스킬 강화/제한 |
| `stateBonus` 해석 | 적 감정 상태에 따른 추가 효과 |
| `swapSynergy` 해석 | 후보 교체 시 효과 발동 |
| `priority` 반영 | 현재 턴 순서 계산에 연결 가능 |
| `targetType` 반영 | 향후 팀 회복/전체 보호/단일 보호 확장용 |

## 구현 상태

| 항목 | 상태 | 비고 |
|---|---|---|
| 카탈로그 분리 | 구현 완료 | `catalogs/*` 구조 사용 중 |
| 스킬 레지스트리 | 구현 완료 | 조회/복제 API 제공 |
| `skillPool / equipped / actions` 정규화 | 구현 완료 | 팀 초기화에서 사용 중 |
| `condition` 해석 | 구현 완료 | 선택/실행/프리뷰 반영 |
| `stateBonus` 해석 | 구현 완료 | 자극/교감/수비 계산 반영 |
| `priority` 반영 | 구현 완료 | 턴 순서 계산 반영 |
| `targetType` 실효 적용 | 부분 구현 | 데이터는 있음, 실제 타겟 분기 로직은 향후 확장 |
| `swapSynergy` 발동 | 미구현 | 전투 중 후보 교체 시스템 추가 후 연결 예정 |
| 몬스터 원본 데이터의 `skillPool / equipped` 마이그레이션 | 미구현 | 현재는 런타임 정규화로 대응 |

## 배분 작업 전 체크

| 체크 항목 | 이유 |
|---|---|
| `SKILL_VALIDATION.valid === true` 확인 | 정의 누락 스킬 방지 |
| `equipped`가 `skillPool`의 부분집합인지 확인 | 잘못된 장착 키 방지 |
| 마무리기 조건이 실제 전투 흐름과 맞는지 확인 | 사장 스킬 방지 |
| 역할군이 팀 단위로 분산되는지 확인 | 퇴화/교체 메타 유지 |

## 추천 작업 순서

1. 기존 몬스터 데이터에 `skillPool / equipped` 도입
2. 전투 엔진에서 `condition`, `stateBonus`, `priority` 해석
3. 교체 시스템 추가 시 `swapSynergy` 연결
4. 적 행동 설계와 상성 태그를 스킬 데이터에 더 반영

## 유지보수 원칙

- 스킬 1개 추가 때문에 `combat.js`를 수정하지 않는 구조를 목표로 한다.
- 스킬 수치 수정은 카탈로그 파일에서만 처리한다.
- 스킬 메타 확장은 `core/schema.js`에서 먼저 정의한다.
- 몬스터는 스킬 인스턴스를 직접 들지 말고, 가능한 한 키 기반으로 선언한다.

## 전체 스킬 표

### 자극 스킬

| ID | 이름 | 역할군 | 축 | PP | 위력 | 도주위험 | 조건/연계 |
|---|---|---|---|---:|---:|---:|---|
| `sound-stimulate` | 공명 울음 | `basic_stimulate` | sound | 8 | 9 | 4 | calm 20% |
| `sound-lullaby` | 자장 파동 | `emotion_setup` | sound | 6 | 7 | 2 | rage 대상일 때 순화 보너스 |
| `sound-chorus` | 하모니 합창 | `high_risk_stimulate` | sound | 5 | 12 | 6 | priority 1 |
| `sound-pulse` | 맥동 음파 | `basic_stimulate` | sound | 6 | 10 | 5 | curious 20% |
| `sound-echo-mark` | 메아리 낙인 | `emotion_setup` | sound | 5 | 8 | 3 | curious 상태 추가 연계 |
| `temperature-stimulate` | 온기 전달 | `basic_stimulate` | temperature | 8 | 9 | 4 | calm 20% |
| `temperature-mist` | 따스한 김결 | `emotion_setup` | temperature | 7 | 8 | 3 | curious 25% |
| `temperature-flare` | 화르륵 체온 | `high_risk_stimulate` | temperature | 4 | 13 | 7 | rage 15% |
| `temperature-breeze` | 미지근한 산들결 | `basic_stimulate` | temperature | 6 | 10 | 4 | calm 30% |
| `temperature-overdrive` | 과열 몰입 | `high_risk_stimulate` | temperature | 4 | 14 | 8 | 도주 65% 이하에서만 사용 |
| `smell-stimulate` | 향기 유혹 | `basic_stimulate` | smell | 8 | 9 | 4 | curious 20% |
| `smell-herb` | 약초 향연 | `emotion_setup` | smell | 6 | 8 | 2 | calm 35% |
| `smell-spore` | 포자 냄새구름 | `emotion_setup` | smell | 5 | 11 | 5 | charmed 20% |
| `smell-sweet` | 달콤 유인향 | `high_risk_stimulate` | smell | 5 | 12 | 6 | charmed 30% |
| `smell-trail` | 잔향 유도 | `emotion_setup` | smell | 6 | 7 | 2 | swap out 시 curious 연계 |
| `behavior-stimulate` | 부드러운 몸짓 | `basic_stimulate` | behavior | 8 | 9 | 4 | calm 20% |
| `behavior-bow` | 정중한 인사 | `emotion_setup` | behavior | 7 | 8 | 2 | priority 1, swap in 보너스 |
| `behavior-play` | 장난 유도 | `emotion_setup` | behavior | 6 | 11 | 5 | swap out 연계 |
| `behavior-focus` | 시선 고정 | `high_risk_stimulate` | behavior | 4 | 13 | 7 | charmed 15% |
| `behavior-relay` | 바통 몸짓 | `swap_setup` | behavior | 5 | 6 | 1 | priority 1, swap in 순화 보너스 |

### 교감 스킬

| ID | 이름 | 역할군 | 축 | PP | 위력 | 도주위험 | 조건/연계 |
|---|---|---|---|---:|---:|---:|---|
| `sound-capture` | 소리 교감 | `capture_finisher` | sound | 3 | 15 | 12 | 기본 마무리 |
| `temperature-capture` | 체온 교감 | `capture_finisher` | temperature | 3 | 15 | 12 | 기본 마무리 |
| `smell-capture` | 향기 교감 | `capture_finisher` | smell | 3 | 15 | 12 | 기본 마무리 |
| `behavior-capture` | 몸짓 교감 | `capture_finisher` | behavior | 3 | 15 | 12 | 기본 마무리 |
| `sound-finale` | 피날레 약속 | `high_risk_finisher` | sound | 2 | 18 | 16 | 순화 70%+, calm/trust/charmed 보너스 |
| `smell-seal` | 향기 각인 | `high_risk_finisher` | smell | 2 | 17 | 14 | 순화 60%+, curious 보너스 |
| `temperature-embrace` | 온기 포옹 | `conditional_finisher` | temperature | 3 | 16 | 11 | 순화 65%+, 도주 70% 이하 |
| `behavior-vow` | 침착한 약속 | `conditional_finisher` | behavior | 2 | 19 | 13 | 순화 75%+, trust/charmed 필요 |

### 수비 스킬

| ID | 이름 | 역할군 | 축 | PP | 위력 | 도주위험 | 회복/방어 | 조건/연계 |
|---|---|---|---|---:|---:|---:|---|---|
| `sound-defend` | 음파 방벽 | `stabilize` | sound | 6 | 6 | -4 | heal 5 / def 3 | 기본 수비 |
| `temperature-defend` | 온도 보호 | `stabilize` | temperature | 6 | 6 | -4 | heal 5 / def 3 | 기본 수비 |
| `smell-defend` | 향기 치유 | `stabilize` | smell | 6 | 6 | -4 | heal 5 / def 3 | 기본 수비 |
| `behavior-defend` | 행동 수비 | `stabilize` | behavior | 6 | 6 | -4 | heal 5 / def 3 | 기본 수비 |
| `sound-guard` | 리듬 수호 | `guard` | sound | 5 | 5 | -6 | heal 3 / def 5 | team 대상, priority 2 |
| `temperature-heal` | 온열 휴식 | `heal` | temperature | 4 | 4 | -2 | heal 9 / def 2 | self 대상 |
| `smell-aroma-wall` | 아로마 장막 | `guard` | smell | 5 | 5 | -5 | heal 4 / def 4 | curious 15% |
| `behavior-guard` | 철벽 엄호 | `guard` | behavior | 5 | 5 | -6 | heal 2 / def 6 | team 대상, priority 2, swap in 방어 보너스 |
| `sound-recover` | 안정 리듬 | `heal` | sound | 4 | 4 | -3 | heal 7 / def 2 | team 대상, priority 1 |
| `smell-sanctuary` | 향기 은신처 | `stabilize` | smell | 5 | 4 | -7 | heal 2 / def 4 | team 대상, calm 30% |
| `temperature-anchor` | 체온 닻내리기 | `swap_guard` | temperature | 4 | 3 | -5 | heal 4 / def 5 | team 대상, priority 2, swap in 보너스 |

### Expanded combinations

- Total skills expanded from `39` to `123`
- Stimulate: `20 -> 64`
- Capture: `8 -> 28`
- Defend: `11 -> 31`

#### Expanded stimulate skills

| ID | Name | Role | Axis | PP | Power | Escape Risk | Condition / Synergy |
|---|---|---|---|---:|---:|---:|---|
| `sound-cadence` | Resonant Cadence | `basic_stimulate` | sound | 7 | 8 | 3 | calm 22% |
| `sound-hush` | Resonant Hush | `emotion_setup` | sound | 7 | 7 | 2 | calm 30%, bonus vs rage |
| `sound-spiral` | Resonant Spiral | `emotion_setup` | sound | 6 | 9 | 3 | trust 18%, combo on calm |
| `sound-spark` | Resonant Spark | `high_risk_stimulate` | sound | 5 | 12 | 6 | curious 20% |
| `sound-tether` | Resonant Tether | `swap_setup` | sound | 5 | 6 | 1 | calm 15%, swap in bonus |
| `sound-veil` | Resonant Veil | `emotion_setup` | sound | 6 | 8 | 2 | trust 14% |
| `sound-sweep` | Resonant Sweep | `basic_stimulate` | sound | 6 | 10 | 4 | calm 18% |
| `sound-lure` | Resonant Lure | `emotion_setup` | sound | 5 | 10 | 4 | calm 24% |
| `sound-surge` | Resonant Surge | `high_risk_stimulate` | sound | 4 | 13 | 7 | rage 12%, escape <= 75% |
| `sound-bridge` | Resonant Bridge | `swap_setup` | sound | 5 | 7 | 1 | curious 16%, swap out combo |
| `sound-bloom` | Resonant Bloom | `emotion_setup` | sound | 5 | 9 | 3 | trust 20%, same-emotion bonus |
| `temperature-cadence` | Thermal Cadence | `basic_stimulate` | temperature | 7 | 8 | 3 | curious 22% |
| `temperature-hush` | Thermal Hush | `emotion_setup` | temperature | 7 | 7 | 2 | calm 30%, bonus vs rage |
| `temperature-spiral` | Thermal Spiral | `emotion_setup` | temperature | 6 | 9 | 3 | calm 18%, combo on curious |
| `temperature-spark` | Thermal Spark | `high_risk_stimulate` | temperature | 5 | 12 | 6 | curious 20% |
| `temperature-tether` | Thermal Tether | `swap_setup` | temperature | 5 | 6 | 1 | curious 15%, swap in bonus |
| `temperature-veil` | Thermal Veil | `emotion_setup` | temperature | 6 | 8 | 2 | calm 14% |
| `temperature-sweep` | Thermal Sweep | `basic_stimulate` | temperature | 6 | 10 | 4 | calm 18% |
| `temperature-lure` | Thermal Lure | `emotion_setup` | temperature | 5 | 10 | 4 | curious 24% |
| `temperature-surge` | Thermal Surge | `high_risk_stimulate` | temperature | 4 | 13 | 7 | rage 12%, escape <= 75% |
| `temperature-bridge` | Thermal Bridge | `swap_setup` | temperature | 5 | 7 | 1 | curious 16%, swap out combo |
| `temperature-bloom` | Thermal Bloom | `emotion_setup` | temperature | 5 | 9 | 3 | calm 20%, same-emotion bonus |
| `smell-cadence` | Aromatic Cadence | `basic_stimulate` | smell | 7 | 8 | 3 | charmed 22% |
| `smell-hush` | Aromatic Hush | `emotion_setup` | smell | 7 | 7 | 2 | calm 30%, bonus vs rage |
| `smell-spiral` | Aromatic Spiral | `emotion_setup` | smell | 6 | 9 | 3 | curious 18%, combo on charmed |
| `smell-spark` | Aromatic Spark | `high_risk_stimulate` | smell | 5 | 12 | 6 | curious 20% |
| `smell-tether` | Aromatic Tether | `swap_setup` | smell | 5 | 6 | 1 | charmed 15%, swap in bonus |
| `smell-veil` | Aromatic Veil | `emotion_setup` | smell | 6 | 8 | 2 | curious 14% |
| `smell-sweep` | Aromatic Sweep | `basic_stimulate` | smell | 6 | 10 | 4 | calm 18% |
| `smell-lure` | Aromatic Lure | `emotion_setup` | smell | 5 | 10 | 4 | charmed 24% |
| `smell-surge` | Aromatic Surge | `high_risk_stimulate` | smell | 4 | 13 | 7 | rage 12%, escape <= 75% |
| `smell-bridge` | Aromatic Bridge | `swap_setup` | smell | 5 | 7 | 1 | curious 16%, swap out combo |
| `smell-bloom` | Aromatic Bloom | `emotion_setup` | smell | 5 | 9 | 3 | curious 20%, same-emotion bonus |
| `behavior-cadence` | Instinctive Cadence | `basic_stimulate` | behavior | 7 | 8 | 3 | trust 22% |
| `behavior-hush` | Instinctive Hush | `emotion_setup` | behavior | 7 | 7 | 2 | calm 30%, bonus vs rage |
| `behavior-spiral` | Instinctive Spiral | `emotion_setup` | behavior | 6 | 9 | 3 | charmed 18%, combo on trust |
| `behavior-spark` | Instinctive Spark | `high_risk_stimulate` | behavior | 5 | 12 | 6 | curious 20% |
| `behavior-tether` | Instinctive Tether | `swap_setup` | behavior | 5 | 6 | 1 | trust 15%, swap in bonus |
| `behavior-veil` | Instinctive Veil | `emotion_setup` | behavior | 6 | 8 | 2 | charmed 14% |
| `behavior-sweep` | Instinctive Sweep | `basic_stimulate` | behavior | 6 | 10 | 4 | calm 18% |
| `behavior-lure` | Instinctive Lure | `emotion_setup` | behavior | 5 | 10 | 4 | trust 24% |
| `behavior-surge` | Instinctive Surge | `high_risk_stimulate` | behavior | 4 | 13 | 7 | rage 12%, escape <= 75% |
| `behavior-bridge` | Instinctive Bridge | `swap_setup` | behavior | 5 | 7 | 1 | curious 16%, swap out combo |
| `behavior-bloom` | Instinctive Bloom | `emotion_setup` | behavior | 5 | 9 | 3 | charmed 20%, same-emotion bonus |

#### Expanded capture skills

| ID | Name | Role | Axis | PP | Power | Escape Risk | Condition / Synergy |
|---|---|---|---|---:|---:|---:|---|
| `sound-snare` | Resonant Snare | `capture_finisher` | sound | 3 | 16 | 11 | calm bonus |
| `sound-clasp` | Resonant Clasp | `conditional_finisher` | sound | 3 | 17 | 12 | taming 60%+, calm/trust |
| `sound-pact` | Resonant Pact | `conditional_finisher` | sound | 2 | 18 | 13 | taming 70%+, escape <= 75% |
| `sound-sealburst` | Resonant Sealburst | `high_risk_finisher` | sound | 2 | 19 | 15 | taming 72%+, calm/trust bonus |
| `sound-keystone` | Resonant Keystone | `conditional_finisher` | sound | 2 | 18 | 10 | taming 65%+, escape <= 65% |
| `temperature-snare` | Thermal Snare | `capture_finisher` | temperature | 3 | 16 | 11 | curious bonus |
| `temperature-clasp` | Thermal Clasp | `conditional_finisher` | temperature | 3 | 17 | 12 | taming 60%+, calm/curious |
| `temperature-pact` | Thermal Pact | `conditional_finisher` | temperature | 2 | 18 | 13 | taming 70%+, escape <= 75% |
| `temperature-sealburst` | Thermal Sealburst | `high_risk_finisher` | temperature | 2 | 19 | 15 | taming 72%+, calm/curious bonus |
| `temperature-keystone` | Thermal Keystone | `conditional_finisher` | temperature | 2 | 18 | 10 | taming 65%+, escape <= 65% |
| `smell-snare` | Aromatic Snare | `capture_finisher` | smell | 3 | 16 | 11 | charmed bonus |
| `smell-clasp` | Aromatic Clasp | `conditional_finisher` | smell | 3 | 17 | 12 | taming 60%+, curious/charmed |
| `smell-pact` | Aromatic Pact | `conditional_finisher` | smell | 2 | 18 | 13 | taming 70%+, escape <= 75% |
| `smell-sealburst` | Aromatic Sealburst | `high_risk_finisher` | smell | 2 | 19 | 15 | taming 72%+, curious/charmed bonus |
| `smell-keystone` | Aromatic Keystone | `conditional_finisher` | smell | 2 | 18 | 10 | taming 65%+, escape <= 65% |
| `behavior-snare` | Instinctive Snare | `capture_finisher` | behavior | 3 | 16 | 11 | trust bonus |
| `behavior-clasp` | Instinctive Clasp | `conditional_finisher` | behavior | 3 | 17 | 12 | taming 60%+, trust/charmed |
| `behavior-pact` | Instinctive Pact | `conditional_finisher` | behavior | 2 | 18 | 13 | taming 70%+, escape <= 75% |
| `behavior-sealburst` | Instinctive Sealburst | `high_risk_finisher` | behavior | 2 | 19 | 15 | taming 72%+, trust/charmed bonus |
| `behavior-keystone` | Instinctive Keystone | `conditional_finisher` | behavior | 2 | 18 | 10 | taming 65%+, escape <= 65% |

#### Expanded defend skills

| ID | Name | Role | Axis | PP | Power | Escape Risk | Heal / Defense | Condition / Synergy |
|---|---|---|---|---:|---:|---:|---|---|
| `sound-ward` | Resonant Ward | `guard` | sound | 5 | 5 | -5 | heal 3 / def 5 | heal 3 / def 5, calm 18% |
| `sound-shelter` | Resonant Shelter | `stabilize` | sound | 5 | 4 | -6 | heal 4 / def 4 | heal 4 / def 4, calm 22% |
| `sound-mend` | Resonant Mend | `heal` | sound | 4 | 4 | -3 | heal 8 / def 2 | heal 8 / def 2 |
| `sound-pivot` | Resonant Pivot | `swap_guard` | sound | 4 | 3 | -5 | heal 4 / def 5 | heal 4 / def 5, swap in bonus |
| `sound-reserve` | Resonant Reserve | `stabilize` | sound | 4 | 5 | -7 | heal 2 / def 6 | heal 2 / def 6, calm 14% |
| `temperature-ward` | Thermal Ward | `guard` | temperature | 5 | 5 | -5 | heal 3 / def 5 | heal 3 / def 5, curious 18% |
| `temperature-shelter` | Thermal Shelter | `stabilize` | temperature | 5 | 4 | -6 | heal 4 / def 4 | heal 4 / def 4, calm 22% |
| `temperature-mend` | Thermal Mend | `heal` | temperature | 4 | 4 | -3 | heal 8 / def 2 | heal 8 / def 2 |
| `temperature-pivot` | Thermal Pivot | `swap_guard` | temperature | 4 | 3 | -5 | heal 4 / def 5 | heal 4 / def 5, swap in bonus |
| `temperature-reserve` | Thermal Reserve | `stabilize` | temperature | 4 | 5 | -7 | heal 2 / def 6 | heal 2 / def 6, curious 14% |
| `smell-ward` | Aromatic Ward | `guard` | smell | 5 | 5 | -5 | heal 3 / def 5 | heal 3 / def 5, trust 18% |
| `smell-shelter` | Aromatic Shelter | `stabilize` | smell | 5 | 4 | -6 | heal 4 / def 4 | heal 4 / def 4, calm 22% |
| `smell-mend` | Aromatic Mend | `heal` | smell | 4 | 4 | -3 | heal 8 / def 2 | heal 8 / def 2 |
| `smell-pivot` | Aromatic Pivot | `swap_guard` | smell | 4 | 3 | -5 | heal 4 / def 5 | heal 4 / def 5, swap in bonus |
| `smell-reserve` | Aromatic Reserve | `stabilize` | smell | 4 | 5 | -7 | heal 2 / def 6 | heal 2 / def 6, trust 14% |
| `behavior-ward` | Instinctive Ward | `guard` | behavior | 5 | 5 | -5 | heal 3 / def 5 | heal 3 / def 5, calm 18% |
| `behavior-shelter` | Instinctive Shelter | `stabilize` | behavior | 5 | 4 | -6 | heal 4 / def 4 | heal 4 / def 4, calm 22% |
| `behavior-mend` | Instinctive Mend | `heal` | behavior | 4 | 4 | -3 | heal 8 / def 2 | heal 8 / def 2 |
| `behavior-pivot` | Instinctive Pivot | `swap_guard` | behavior | 4 | 3 | -5 | heal 4 / def 5 | heal 4 / def 5, swap in bonus |
| `behavior-reserve` | Instinctive Reserve | `stabilize` | behavior | 4 | 5 | -7 | heal 2 / def 6 | heal 2 / def 6, calm 14% |
