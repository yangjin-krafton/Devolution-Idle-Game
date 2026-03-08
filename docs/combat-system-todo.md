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

- [ ] `src/combat.js`에 `emotionState` 필드 추가
  - `{ type: null, turnsLeft: 0 }`
- [ ] 감정 상태 6종 정의 (data.js에 상수로)
  ```
  calm:    적 공격력 -50%, 도주 증가 멈춤, 2턴
  curious: 순화 효율 ×1.5, 2턴
  fear:    매 턴 도주 +5, 공격력 +30%, 자동 (도주 80%+)
  charmed: 포획 성공률 +20%, 3턴
  rage:    공격력 ×2, 순화 -50%, 2턴
  trust:   도주 고정, 순화 ×1.3, 자동 (순화 70%+)
  ```
- [ ] 턴 종료 시 `turnsLeft--`, 0이면 해제
- [ ] 스킬 데이터에 `effects: [{ type, chance, turns }]` 추가
- [ ] `_handleStimulate`에서 부가 효과 발동 체크
- [ ] UI: 적 HUD에 감정 상태 아이콘/텍스트 표시
- [ ] UI: 감정 변화 시 로그 출력 ("심연 늑대가 호기심을 보인다!")

### 1-2. 순화 단계별 적 행동

- [ ] `_enemyAttack()`를 `_enemyAction()`으로 리네임
- [ ] 순화 비율에 따른 행동 분기:
  ```
  0~30%:  풀파워 공격 (현재와 동일)
  30~60%: 공격력 70%, 20% 확률로 행동 스킵
  60~80%: 공격력 40%, 40% 확률로 행동 스킵, 접근 로그
  80%+:   10% 확률로만 공격, 나머지는 관찰/접근
  ```
- [ ] 도주 80%+ 시 공포 행동: 강한 일격 or 즉시 도주 판정
- [ ] 각 단계별 반응 메시지 추가 (data.js의 reactions 확장)

### 예상 작업량

- combat.js: +80줄 수정
- data.js: +40줄 (감정 상수 + 스킬 effects)
- battleFieldUI.js: +20줄 (감정 표시)

---

## Phase 2: 감각 상성 체계화 + PP 시스템

> **목표**: 스킬 선택에 전략적 의미를 부여한다.
> **영향 파일**: `src/data.js`, `src/combat.js`, `src/ui/actionPanelUI.js`

### 2-1. 감각 상성 순환

- [ ] 상성 테이블 정의 (data.js)
  ```js
  const SENSORY_EFFECTIVENESS = {
    sound:       { sound: 1.0, temperature: 0.5, smell: 1.0, behavior: 1.5 },
    temperature: { sound: 1.5, temperature: 1.0, smell: 0.5, behavior: 1.0 },
    smell:       { sound: 1.0, temperature: 1.5, smell: 1.0, behavior: 0.5 },
    behavior:    { sound: 0.5, temperature: 1.0, smell: 1.5, behavior: 1.0 },
  };
  ```
- [ ] 적 몬스터에 `sensoryType: ['sound', 'behavior']` 추가
- [ ] 기존 `preferences` 제거 → 상성 테이블로 자동 계산
- [ ] `_handleStimulate`에서 상성 배율 적용
- [ ] UI: 적 정보에 감각 타입 아이콘 표시
- [ ] UI: 스킬 선택 시 상성 유불리 색상 표시 (초록/빨강)

### 2-2. PP 시스템

- [ ] 스킬 데이터에 `pp`, `maxPp` 필드 추가
  ```
  강한 스킬: pp 2~3 (전격교감, 불꽃교감)
  보통 스킬: pp 5~6 (따뜻한 온기, 숲 냄새)
  약한 스킬: pp 8~10 (빗소리, 이끼 향)
  ```
- [ ] 행동 실행 시 PP 소모
- [ ] PP 0인 스킬은 선택 불가 (UI에서 비활성화)
- [ ] PP 부족 시 기본 행동(발버둥) 자동 선택
- [ ] 전투 종료 시 PP 전체 회복
- [ ] UI: 스킬 카드에 PP 잔량 표시 (예: "3/5")

### 예상 작업량

- data.js: +60줄 (상성 테이블 + PP 데이터)
- combat.js: +30줄 (상성 계산 + PP 소모)
- actionPanelUI.js: +30줄 (PP 표시 + 비활성화)

---

## Phase 3: 적 성격 시스템 + 턴 내 속도순 실행

> **목표**: 적마다 다른 전투 경험 + 속도의 전략적 가치
> **영향 파일**: `src/combat.js`, `src/data.js`

### 3-1. 적 성격

- [ ] 성격 타입 4종 정의 (data.js)
  ```js
  aggressive: { attackMod: 1.3, rageThreshold: 0.3, calmResist: 0.5 }
  timid:      { escapeMod: 1.5, tamingMod: 1.3, fleeAt: 0.7 }
  curious:    { skipChance: 0.3, goodAxisBonus: 2.0 }
  stubborn:   { tamingMod: 0.7, escapeMod: 0.6, defenseMod: 1.3 }
  ```
- [ ] 각 적 몬스터에 `personality` 필드 추가
- [ ] `_enemyAction()`에서 성격별 행동 분기 적용
- [ ] 성격에 따른 감정 상태 저항/취약 반영

### 3-2. 턴 내 속도순 실행 (적 끼어들기)

- [ ] `_executeTurn()` 리워크:
  - 기존: 아군 전부 행동 → 적 1회 공격
  - 변경: 아군 + 적을 속도순으로 정렬 → 교차 실행
- [ ] 적의 행동 속도 값 추가 (data.js)
- [ ] `calcTurnOrder()`에 적 행동 포함
  ```
  수비(우선도 +1) > 적 행동(우선도 0, 속도 기반) > 자극(0) > 포획(-1)
  ```
- [ ] UI: 턴 순서 프리뷰에 적 행동 위치 표시
- [ ] 빠른 수비 → 적 공격(방어 적용됨) → 느린 자극 순서 보장

### 예상 작업량

- data.js: +30줄
- combat.js: +60줄 (턴 구조 리워크가 가장 큰 작업)

---

## Phase 4: 아군 어빌리티 + 스탯 성장

> **목표**: 아군 몬스터의 개성과 장기 성장
> **영향 파일**: `src/data.js`, `src/combat.js`, `src/team.js`

### 4-1. 어빌리티 시스템

- [ ] 아군 몬스터 데이터에 `ability` 필드 추가
  ```js
  { id: 'gentle_wave', name: '잔잔한 물결', desc: '매 턴 도주 -2',
    trigger: 'turnEnd', effect: { escapeReduce: 2 } }
  ```
- [ ] 어빌리티 목록 (6마리 기본 + 6마리 퇴화 후 = 12개)
- [ ] 턴 종료 페이즈에 어빌리티 효과 적용
- [ ] 퇴화 시 `devolvedAbility` 로 교체
- [ ] UI: 팀 화면에 어빌리티 설명 표시
- [ ] UI: 전투 중 어빌리티 발동 시 로그 출력

### 4-2. 6스탯 체계 전환

- [ ] 기존 4스탯 → 6스탯 마이그레이션
  ```
  gentleness → affinity (친화력)
  empathy    → empathy (공감력) - 유지
  resilience → endurance (인내력)
  agility    → agility (민첩성) - 유지
  (신규)     → bond (유대력)
  (신규)     → instinct (직감)
  ```
- [ ] 계산식 업데이트 (combat.js)
- [ ] 전투 중 행동별 스탯 경험치 축적
  ```
  자극 사용 → affinity +1 exp
  포획 사용 → empathy +1 exp
  수비 사용 → endurance +1 exp
  ```
- [ ] 스탯별 경험치 임계치 도달 시 스탯 +1
- [ ] team.js에 스탯 성장 로직 추가
- [ ] UI: 팀 화면에 스탯 상세 + 성장 진행도 표시

### 예상 작업량

- data.js: +80줄 (어빌리티 정의 + 스탯 마이그레이션)
- combat.js: +40줄 (어빌리티 적용)
- team.js: +50줄 (스탯 성장)

---

## Phase 5: 스킬 풀/장착 + UI 확장

> **목표**: 전투 전 빌드 선택의 재미
> **영향 파일**: `src/data.js`, `src/ui/actionPanelUI.js`, `src/ui/teamUI.js`

### 5-1. 스킬 풀 시스템

- [ ] 아군 몬스터에 `skillPool: [...]` (8~12개) + `equipped: [0,1,2]` 구조
- [ ] 퇴화 시 새 스킬 습득 (skillPool에 추가)
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

- [ ] **스탯 스케일 완화**: `stat/5` → `(stat+5)/10` 으로 변경
  - 현재: gentleness 8 → 계수 1.6
  - 변경: gentleness 8 → 계수 1.3
  - 영향: combat.js `_handleStimulate`, `_handleCapture`, `_handleDefend`

- [ ] **자극 escapeRisk 상향**: 강한 자극일수록 위험도 높게
  - 번개꼬리 정전기: escapeRisk 5 → 8
  - 기본 자극: escapeRisk 2 → 3

- [ ] **포획 성공률 공식 개선**:
  - 현재: `(ratio-0.2) × 0.7 × (emp/5)` → 순화 100%에서 56%
  - 변경: `(ratio-0.2) × 1.0 × (emp/5)` → 순화 100%에서 80%
  - 또는 감정 상태(매혹, 신뢰)로 보정

- [ ] **수비의 순화 감소 제거 또는 축소**:
  - 현재: `tamingGauge -= power × 0.3`
  - 변경: 순화 감소 제거, 대신 순화가 오르지 않는 것 자체가 기회비용

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
