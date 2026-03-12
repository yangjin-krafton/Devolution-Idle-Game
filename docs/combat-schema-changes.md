# 전투 스키마 변경안

> 작성일: 2026-03-13
> 목적: 전투 개선안에서 실제 데이터/엔진에 반영해야 할 스키마 변경 사항만 분리 정리한다.

---

## 1. 목표

현재 스키마는 `power`, `escapeRisk`, `effects`, `condition`, `stateBonus` 중심이다.  
앞으로는 아래를 담을 수 있어야 한다.

- 초기 전투 상태 변주
- 자극 취향/선호 시스템
- 지연 발동 자극
- 자극 버프/디버프
- 포획의 도주 제어, 위치 조작, 문맥 보너스
- 방어의 `guardPoints`, 대상 보호, 지속 버프, PP 회복, 함정형 반응
- 적 intent 및 행동 풀

---

## 2. 전투 상태 스키마

### 2-1. CombatSystem 상태 필드 추가

권장 필드:

```js
{
  initialTamingGauge: 0,
  initialEscapeGauge: 0,
  guardPoints: 0,
  activeBuffs: [],
  pendingEffects: [],
  enemyIntent: null,
  enemyIntentHistory: [],
  captureFocusStacks: 0,
}
```

설명:

- `initialTamingGauge`: 전투 시작 시 랜덤 부여된 초기 호감도
- `initialEscapeGauge`: 전투 시작 시 랜덤 부여된 초기 도주 게이지
- `guardPoints`: 이번 턴에만 유지되는 피해 흡수 포인트
- `activeBuffs`: 아군/적에게 걸린 지속 버프 목록
- `pendingEffects`: 지연 발동 효과 목록
- `enemyIntent`: 현재 공개된 적 intent
- `enemyIntentHistory`: 이전 intent 기록
- `captureFocusStacks`: 포획 실패 누적 보정값

---

## 3. 적 몬스터 스키마

### 3-1. 기존 필드

현재 주요 필드:

```js
{
  sensoryType: ['sound'],
  personality: 'aggressive',
  reactions: REACTIONS.aggressive,
}
```

### 3-2. 추가 필드

권장 필드:

```js
{
  preferredStimulus: ['sound'],
  wantedStimulusRules: [],
  encounterGaugeRoll: {
    taming: [0, 20],
    escape: [0, 15],
  },
  enemyBehaviorPool: [],
}
```

설명:

- `preferredStimulus`: 항상 좋아하는 자극 축
- `wantedStimulusRules`: 현재 상황에 따라 원하는 자극을 정하는 규칙
- `encounterGaugeRoll`: 전투 시작 시 초기 게이지 랜덤 범위
- `enemyBehaviorPool`: 몬스터별 행동 풀

예시:

```js
{
  preferredStimulus: ['smell'],
  wantedStimulusRules: [
    { whenIntentIn: ['observe'], axis: 'behavior' },
    { whenEscapeAbove: 50, axis: 'sound' },
  ],
  encounterGaugeRoll: {
    taming: [10, 25],
    escape: [5, 18],
  },
  enemyBehaviorPool: [
    { id: 'bite', type: 'attack', weight: 4 },
    { id: 'watch', type: 'observe', weight: 2 },
    { id: 'panic_run', type: 'panic', weight: 3, whenEscapeAbove: 60 },
  ],
}
```

---

## 4. 적 intent 스키마

권장 구조:

```js
{
  id: 'heavy_strike',
  type: 'heavy_attack',
  powerScale: 1.5,
  targetRule: 'highest_aggro',
  telegraph: '강공 준비',
  tags: ['attack'],
}
```

필드 설명:

- `id`: 행동 고유 ID
- `type`: `attack`, `heavy_attack`, `aoe_attack`, `guard`, `observe`, `panic` 등
- `powerScale`: 공격 배율
- `targetRule`: 타겟 선정 규칙
- `telegraph`: UI 표시 문구
- `tags`: 검색/조건용 태그

---

## 5. 스킬 공통 스키마 변경안

### 5-1. 현재 공통 필드

현재 주요 필드:

```js
{
  id,
  key,
  name,
  category,
  role,
  axis,
  targetType,
  priority,
  power,
  pp,
  maxPp,
  escapeRisk,
  healAmount,
  defenseBoost,
  effects,
  condition,
  stateBonus,
  swapSynergy,
  log,
  desc,
  rarity,
  tags,
}
```

### 5-2. 추가 공통 필드

권장 추가:

```js
{
  previewHints: null,
  intentBonus: null,
  teamConditionBonus: null,
  aggroBonus: null,
  lineageBonus: null,
  delayedEffect: null,
  durationBuff: null,
  onHitTrigger: null,
}
```

설명:

- `previewHints`: 프리뷰용 설명 데이터
- `intentBonus`: 적 intent 조건 보너스
- `teamConditionBonus`: 아군 전체 행동 조건 보너스
- `aggroBonus`: 공격 대상/어그로 조건 보너스
- `lineageBonus`: 같은 혈맥/계열 조건 보너스
- `delayedEffect`: n턴 뒤 발동하는 효과
- `durationBuff`: n턴 유지 버프
- `onHitTrigger`: 공격당했을 때 발동하는 반응

---

## 6. 자극 스킬 스키마 변경안

### 6-1. 권장 역할

```js
type StimulateRole =
  | 'baseline_stimulate'
  | 'preference_probe'
  | 'combo_buffer'
  | 'stim_debuffer'
  | 'delayed_payoff'
  | 'conditional_payoff'
  | 'stabilize_stimulate'
  | 'bridge_stimulate';
```

### 6-2. 추가 필드

권장 필드:

```js
{
  preferenceBonus: null,
  stimBuff: null,
  stimDebuff: null,
}
```

설명:

- `preferenceBonus`: 좋아함/원하는 자극 보정
- `stimBuff`: 다음 자극을 강화하는 효과
- `stimDebuff`: 적 행동/도주/감정을 약화하는 효과

예시:

```js
{
  role: 'delayed_payoff',
  preferenceBonus: {
    liked: 0.25,
    wanted: 0.4,
  },
  delayedEffect: {
    delayTurns: 2,
    tamingPower: 14,
    escapeRisk: 3,
    cancelOnUserDown: true,
    cancelOnEnemyEscape: true,
  },
  stimBuff: {
    nextAxis: 'temperature',
    tamingMultiplier: 1.5,
    guaranteedGoodResponse: true,
  },
  stimDebuff: {
    enemyIntentWeightDown: ['panic'],
    escapeGainMultiplier: 0.7,
  },
  intentBonus: {
    ifEnemyIntentIn: ['observe', 'target_select'],
    tamingPowerBonus: 4,
  },
  teamConditionBonus: {
    ifAllAlliesCategoryUsed: 'stimulate',
    tamingPowerBonus: 3,
  },
}
```

---

## 7. 포획 스킬 스키마 변경안

### 7-1. 권장 역할

```js
type CaptureRole =
  | 'early_capture'
  | 'lock_capture'
  | 'tactical_capture'
  | 'context_capture'
  | 'mid_capture'
  | 'finisher_capture'
  | 'all_in_capture';
```

### 7-2. 추가 필드

권장 필드:

```js
{
  escapeControl: null,
  captureWindowBonus: null,
  repositionEffect: null,
}
```

설명:

- `escapeControl`: 도주 게이지 직접 증감
- `captureWindowBonus`: 특정 순화도/도주 구간에서의 보너스
- `repositionEffect`: 자리 이동, 교대, 어그로 이동

예시:

```js
{
  role: 'context_capture',
  escapeControl: {
    escapeGaugeDelta: -8,
    likedBonusMultiplier: 1.3,
  },
  captureWindowBonus: {
    maxTamingPercent: 50,
    captureChanceMultiplier: 2.0,
    minEscapePercent: 50,
    captureChanceBonus: 0.08,
  },
  aggroBonus: {
    ifTargetedByEnemy: true,
    captureChanceBonus: 0.08,
  },
  lineageBonus: {
    ifSameLineage: true,
    captureChanceBonus: 0.12,
  },
  intentBonus: {
    ifEnemyIntentIn: ['panic', 'observe'],
    captureChanceBonus: 0.06,
  },
  repositionEffect: {
    swapPositions: [0, 2],
    pullReserveToFront: false,
    aggroShiftTo: 1,
  },
}
```

### 7-3. 포획 확률 계산용 메타 필드

포획 확률식은 공통 계산을 쓰되, 스킬 메타로 보정한다.

```js
{
  skillBonus: 0.05,
  captureChanceCap: 0.93,
}
```

---

## 8. 방어 스킬 스키마 변경안

### 8-1. 권장 역할

```js
type DefendRole =
  | 'guard_points'
  | 'ally_guard'
  | 'sustain_buff'
  | 'resource_recover'
  | 'trap_guard'
  | 'counter_guard'
  | 'support_cover';
```

### 8-2. 필드 변경 원칙

- 기존 `escapeRisk: -값` 기반 도주 감소는 제거
- 방어는 `guardPoints`, 버프, 회복, 함정 효과 중심으로 재정의

### 8-3. 추가 필드

권장 필드:

```js
{
  guardPoints: 0,
  guardTargetRule: null,
  ppRecover: 0,
  hpRecover: 0,
  protectTags: [],
}
```

설명:

- `guardPoints`: 이번 턴 피해 흡수량
- `guardTargetRule`: 보호 대상 규칙
- `ppRecover`: PP 회복량
- `hpRecover`: HP 회복량
- `protectTags`: 보호 대상 필터 태그

예시:

```js
{
  role: 'trap_guard',
  guardPoints: 3,
  guardTargetRule: {
    target: 'enemy_targeted_ally',
  },
  durationBuff: {
    turns: 2,
    captureFailPenaltyReduction: 0.2,
  },
  hpRecover: 4,
  ppRecover: 1,
  onHitTrigger: {
    tamingGaugeDelta: 6,
    tryEmotion: { type: 'trust', chance: 0.2 },
  },
  intentBonus: {
    ifEnemyIntentIn: ['heavy_attack'],
    guardPointsBonus: 3,
  },
}
```

---

## 9. 버프/지속효과 스키마

권장 구조:

```js
{
  id: 'quiet_shelter',
  sourceSkill: 'sound-shelter',
  target: 'ally_team',
  turns: 2,
  effects: {
    stimulateSuccessBonus: 0.1,
    captureFailPenaltyReduction: 0.2,
    extraGuardPointsPerTurn: 2,
    axisBonus: { smell: 0.15 },
  },
}
```

---

## 10. 지연 발동 효과 스키마

권장 구조:

```js
{
  id: 'charged-chorus',
  sourceSkill: 'sound-chorus',
  ownerId: 'ally_01',
  delayTurns: 2,
  payload: {
    category: 'stimulate',
    axis: 'sound',
    tamingPower: 14,
    escapeRisk: 3,
  },
  cancelRules: {
    cancelOnUserDown: true,
    cancelOnEnemyEscape: true,
  },
}
```

---

## 11. 프리뷰 계산 결과 스키마

실시간 프리뷰는 확정값과 조건부 예측을 분리한다.

권장 구조:

```js
{
  type: 'stimulate',
  guaranteed: {
    tamingDelta: 4,
    escapeDelta: 1,
    guardPointsDelta: 0,
    ppDelta: 0,
  },
  conditional: [
    '앞선 아군이 calm 유발 시 추가 호감도 +3',
    '공격당하면 다음 포획 보너스 발동',
  ],
  reasons: [
    'preferred stimulus bonus 적용',
    'enemy intent observe bonus 적용',
  ],
  blockedReason: null,
}
```

---

## 12. 우선 적용 순서

1. `CombatSystem` 상태 필드 추가
2. 적 몬스터 `encounterGaugeRoll`, `enemyBehaviorPool` 추가
3. 스킬 공통 필드 확장
4. 자극 스키마 확장
5. 포획 스키마 확장
6. 방어 스키마 확장
7. 버프/지연효과/프리뷰 결과 스키마 추가

---

## 13. 요약

핵심 스키마 추가 포인트는 아래다.

- 적: `preferredStimulus`, `wantedStimulusRules`, `encounterGaugeRoll`, `enemyBehaviorPool`
- 자극: `preferenceBonus`, `stimBuff`, `stimDebuff`, `delayedEffect`
- 포획: `escapeControl`, `captureWindowBonus`, `repositionEffect`
- 방어: `guardPoints`, `guardTargetRule`, `durationBuff`, `ppRecover`, `onHitTrigger`
- 전투 상태: `guardPoints`, `activeBuffs`, `pendingEffects`, `enemyIntent`
- 프리뷰: `guaranteed`, `conditional`, `reasons`

이 문서를 기준으로 다음 단계에서는 `core/schema.js`와 전투 엔진 데이터 해석기를 실제로 바꾸면 된다.
