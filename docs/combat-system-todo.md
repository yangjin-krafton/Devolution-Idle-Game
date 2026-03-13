# 전투 시스템 개선 TODO

> 현재 MVP 전투 시스템을 포켓몬급 RPG 깊이로 확장하기 위한 작업 목록.
> 각 Phase는 독립적으로 구현 가능하되, 번호 순서대로 진행하는 것을 권장.

---

## 현재 상태 진단

### 코드 구조

| 파일 | 역할 | 상태 |
|------|------|------|
| `src/combat.js` | 전투 엔진 (~300줄) | 기본 동작, 리워크 필요 |
| `src/data.js` | 몬스터/스킬 데이터 (~290줄) | 구조 변경 필요 |
| `src/team.js` | 팀 관리 (~120줄) | 스탯 성장 추가 필요 |
| `src/ui/actionPanelUI.js` | 스킬 선택 UI | PP 표시 등 확장 필요 |
| `src/ui/battleFieldUI.js` | 전투 화면 UI | 감정 상태 표시 추가 필요 |

### 핵심 문제점

1. **자극 스팸이 최적해**: escapeRisk가 낮아서 자극만 반복하면 됨
2. **적 행동 패턴 없음**: 모든 적이 동일한 공격 로직
3. **순화도 연동 없음**: 순화 80%인 적이나 0%인 적이나 동일 공격
4. **스탯 밸런스 이상**: gentleness 8 + preference 1.6이면 1턴에 순화 70% 가능
5. **수비 사용 동기 부족**: 수비하면 순화도가 깎여서 직관적이지 않음
6. **포획 성공률 낮음**: 순화 100%에서도 empathy 5 기준 56%밖에 안 됨

---

## Phase 1: 적 감정 상태 + 순화 단계별 행동

> **목표**: 적이 살아있는 존재처럼 반응하게 만든다.
> **영향 파일**: `src/combat.js`, `src/data.js`, `src/ui/battleFieldUI.js`

### 1-1. 감정 상태 시스템

- [x] `src/emotion.js` 모듈: emotionState + 6종 감정 정의
- [x] 턴 종료 시 `turnsLeft--`, 0이면 해제
- [x] 스킬 데이터에 `effects: [{ type, chance }]` 추가
- [x] `_handleStimulate`에서 부가 효과 발동 체크
- [x] UI: 감정 변화 시 로그 출력

### 1-2. 순화 단계별 적 행동

- [x] `_enemyAction()` — `src/enemyAI.js`의 `decideEnemyAction()` 사용
- [x] 순화 비율에 따른 4단계 행동 분기 (wary/wavering/interest/bonding)
- [x] 도주 80%+ 시 발악 강공 or 도주 시도
- [x] 각 단계별 반응 메시지

### 예상 작업량

- combat.js: +80줄 수정
- data.js: +40줄 (감정 상수 + 스킬 effects)
- battleFieldUI.js: +20줄 (감정 표시)

---

## Phase 2: 감각 상성 체계화 + PP 시스템

> **목표**: 스킬 선택에 전략적 의미를 부여한다.
> **영향 파일**: `src/data.js`, `src/combat.js`, `src/ui/actionPanelUI.js`

### 2-1. 감각 상성 순환

- [x] 상성 테이블 정의 → `src/data/constants.js` SENSORY_EFFECTIVENESS
- [x] 적 몬스터에 `sensoryType` 배열 추가
- [x] `_handleStimulate`에서 `calcSensoryMod()` 상성 배율 적용
- [x] UI: 스킬 선택 시 상성 유불리 색상 표시

### 2-2. PP 시스템

- [x] 스킬 데이터에 `pp`, `maxPp` 필드 → `src/data/skills/core/schema.js`
- [x] 행동 실행 시 PP 소모
- [x] PP 0인 스킬은 선택 불가
- [x] 전투 종료 시 PP 전체 회복 (team.js healTeam)
- [x] UI: 스킬 카드에 PP 잔량 표시

### 예상 작업량

- data.js: +60줄 (상성 테이블 + PP 데이터)
- combat.js: +30줄 (상성 계산 + PP 소모)
- actionPanelUI.js: +30줄 (PP 표시 + 비활성화)

---

## Phase 3: 적 성격 시스템 + 턴 내 속도순 실행

> **목표**: 적마다 다른 전투 경험 + 속도의 전략적 가치
> **영향 파일**: `src/combat.js`, `src/data.js`

### 3-1. 적 성격

- [x] 성격 타입 4종 정의 → `src/enemyAI.js` PERSONALITY
- [x] 각 적 몬스터에 `personality` 필드 추가
- [x] `_enemyAction()`에서 성격별 행동 분기 적용
- [x] 성격에 따른 감정 상태 저항/취약 반영

### 3-2. 턴 내 속도순 실행 (적 끼어들기)

- [x] `_executeTurn()` 리워크: 아군 + 적 통합 속도순 실행
- [x] 적의 행동 속도 값: `enemy.stats.agility` 사용
- [x] `calcTurnOrder()`에 적 행동 포함 (`type: 'enemy'` 엔트리)
  - 수비(+1) > 적/자극(0, 속도순) > 포획(-1)
- [x] UI: 턴 순서 프리뷰에 적 행동 위치 표시 (actionPanelUI.js)
- [x] 빠른 수비 → 적 공격(방어 적용됨) → 느린 자극 순서 보장

### 예상 작업량

- data.js: +30줄
- combat.js: +60줄 (턴 구조 리워크가 가장 큰 작업)

---

## Phase 4: 아군 어빌리티 + 스탯 성장

> **목표**: 아군 몬스터의 개성과 장기 성장
> **영향 파일**: `src/data.js`, `src/combat.js`, `src/team.js`

### 4-1. 어빌리티 시스템

- [x] `src/ability.js` 신규 모듈: 12종 어빌리티 정의 + 트리거 시스템
- [x] `combat.js`에 어빌리티 연동 (자극/포획/수비/피해경감/턴종료)
- [x] 아군 어빌리티 자동 배정: `resolveAbility()` (역할 기반, team.js에서 호출)
- [x] 퇴화 시 `devolvedAbility` 또는 역할 기반 devo2 어빌리티 자동 교체
- [x] UI: 팀 화면에 어빌리티 설명 표시 (teamEditUI.js)
- [x] UI: 전투 중 어빌리티 발동 시 로그 출력

### 4-2. 6스탯 체계 전환

- [x] 기존 4스탯 → 6스탯 마이그레이션 (`src/statSystem.js`)
  ```
  gentleness → affinity (친화력)
  empathy    → empathy (공감력) - 유지
  resilience → endurance (인내력)
  agility    → agility (민첩성) - 유지
  (신규)     → bond (유대력)
  (신규)     → instinct (직감)
  ```
- [x] 계산식 업데이트 (combat.js — getStat() 사용, 구/신 호환)
- [x] 전투 중 행동별 스탯 경험치 축적 (awardStatXP)
  ```
  자극 사용 → affinity +1 exp
  포획 사용 → empathy +1 exp
  수비 사용 → endurance +1 exp
  ```
- [x] 스탯별 경험치 임계치 도달 시 스탯 +1 (`statSystem.js` awardStatXP)
- [x] `combat.js`에서 행동 수행 시 스탯 경험치 자동 축적
- [x] `team.js`에서 스탯 마이그레이션 자동 적용 (생성/퇴화/모집)
- [x] UI: 팀 화면에 6스탯 + 성장 진행도 표시 (teamEditUI.js)

### 예상 작업량

- data.js: +80줄 (어빌리티 정의 + 스탯 마이그레이션)
- combat.js: +40줄 (어빌리티 적용)
- team.js: +50줄 (스탯 성장)

---

## Phase 5: 스킬 풀/장착 + UI 확장

> **목표**: 전투 전 빌드 선택의 재미
> **영향 파일**: `src/data.js`, `src/ui/actionPanelUI.js`, `src/ui/teamUI.js`

### 5-1. 스킬 풀 시스템

- [x] 아군 몬스터에 `skillPool + equipped` 구조 (data/skills 시스템)
- [x] 퇴화 시 스킬 풀 확장 (각 몬스터 데이터에 정의됨)
- [ ] 전투 전 팀 화면에서 장착 스킬 3개 선택 UI
- [ ] 상대 몬스터 정보 프리뷰 (감각 타입, 성격) → 스킬 선택 참고

### 5-2. 스킬 장착 UI

- [ ] 팀 화면에 스킬 교체 인터페이스
- [ ] 보유 스킬 목록 → 3슬롯에 드래그/클릭 장착
- [ ] 스킬별 상세 정보 팝업 (위력, PP, 감각축, 부가효과)
- [ ] 카테고리별 색 구분 유지

### 예상 작업량

- data.js: +100줄 (스킬 풀 데이터)
- teamUI.js: +80줄 (장착 UI)
- actionPanelUI.js: +20줄 (장착된 스킬 반영)

---

## 밸런스 수치 조정 (Phase 1과 병행)

Phase 구현과 별개로, 현재 데이터의 수치 문제를 즉시 수정해야 합니다.

### 즉시 수정 사항

- [x] **스탯 스케일 완화**: `(stat+5)/10` → `statSystem.js` statScale()
- [ ] **자극 escapeRisk 상향**: 강한 자극일수록 위험도 높게
- [x] **포획 성공률 공식 개선**: `(ratio-0.2) × 1.0 × statScale(emp)` + 감정 보정
- [x] **수비의 순화 감소 제거**: 기회비용만으로 충분

---

## 전체 시스템 의존 관계

```
Phase 1 (감정 상태 + 순화 단계)
  ↓
Phase 2 (감각 상성 + PP)
  ↓
Phase 3 (적 성격 + 속도순 실행)  ← Phase 1, 2에 의존
  ↓
Phase 4 (어빌리티 + 스탯 성장)   ← 독립 가능하나 Phase 1 이후 권장
  ↓
Phase 5 (스킬 풀 + 장착 UI)     ← Phase 2 PP 시스템에 의존
```

---

## 구현 시 주의사항

1. **MVP 정신 유지**: 각 Phase를 구현할 때 최소한의 형태로 먼저 넣고, 플레이 피드백 후 확장
2. **데이터 주도 설계**: 로직은 combat.js에, 수치는 data.js에 분리 유지
3. **UI는 마지막**: 시스템 로직이 정상 작동하면 UI를 붙이는 순서
4. **한 Phase 완료 후 플레이테스트**: 전체를 한 번에 넣지 말고 Phase별로 체감 확인
