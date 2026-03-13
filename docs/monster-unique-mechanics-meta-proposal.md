# 24종 몬스터 확장형 고유 메커닉 메타 제안서

작성일: 2026-03-14

## 1. 목적

5축 환경 퍼즐만으로 전투를 구성하면, 몬스터 수가 늘어날수록 플레이가 비슷하게 느껴질 수 있다.
그래서 각 몬스터에게 `고유 메커닉 1개`를 부여하되, 수치만 흔드는 것이 아니라 플레이 리듬, 파티 구성, 혈통 조합까지 건드리는 방향으로 확장한다.

핵심 목표는 아래와 같다.

1. 몬스터마다 다른 생각을 하게 만든다.
2. 전투마다 다른 턴 리듬과 파티 운영을 만든다.
3. 같은 종족/퇴화 트리 자체가 전투 재미로 이어지게 만든다.

---

## 2. 기본 설계 원칙

- 메커닉은 한 줄로 설명 가능해야 한다.
- 메커닉과 강도는 분리한다.
- `difficultyParams[0] / [1] / [2]`는 `wild / devo1 / devo2`에 대응한다.
- 메커닉은 5축 퍼즐을 없애지 말고, 그 위에 다른 문제를 얹어야 한다.
- 몬스터를 수집하고 육성한 의미를 훼손하는 규칙은 피한다.

예시 포맷:

```js
wildMechanic: {
  id: 'opening_lock',
  icon: '🔒',
  category: 'turn_phase',
  nameKr: '초반 봉인',
  summaryKr: '전투 시작 후 {a}턴 동안 특정 계열 행동이 봉인되고, 이후 {b}턴부터 해제된다.',
  difficultyParams: [
    [2, 3],
    [3, 4],
    [4, 5],
  ],
  counterRuleKr: '초반은 준비 턴이고, 핵심 행동은 중반부터 터뜨리는 전투다.',
}
```

---

## 3. 메커닉 라이브러리

메커닉은 아래 6축에서 고른다.

- `charge`: 무언가가 쌓이고 터진다
- `sequence`: 행동 순서가 중요하다
- `formation`: 출전 구조가 바뀐다
- `turn_phase`: 턴 구간별로 룰이 바뀐다
- `tribe`: 같은 종족/같은 트리에서 시너지가 난다
- `bonus`: 한 번 잘 맞추면 크게 터지는 보상이 있다

---

## 4. 24종 기본 메커닉 제안

### 01. howl_wolf

```js
{
  id: 'sonic_buildup',
  icon: '📣',
  category: 'charge',
  nameKr: '울음 누적',
  summaryKr: '소리 축이 목표에서 벗어난 턴마다 울음 카운트가 {a} 쌓이고, {b}이 되면 도주 게이지가 급증한다.',
  difficultyParams: [[1, 4], [1, 3], [1, 2]],
  counterRuleKr: '소리 축 안정화와 유지가 핵심이다.',
}
```

### 02. ember_salamander

```js
{
  id: 'lava_shell',
  icon: '🛡️',
  category: 'charge',
  nameKr: '용암 갑피',
  summaryKr: '온도 축을 직접 바꿀 때마다 갑피가 {a} 쌓이고, {b} 이상이면 직접 온도 조정이 약해진다.',
  difficultyParams: [[1, 3], [1, 2], [2, 2]],
  counterRuleKr: '온도 대신 다른 축을 먼저 맞춰 갑피를 벗긴다.',
}
```

### 03. rot_toad

```js
{
  id: 'checkpoint_turn',
  icon: '🚩',
  category: 'turn_phase',
  nameKr: '체크포인트',
  summaryKr: '{a}턴마다 체크포인트가 오며, 그 순간 조건을 만족하면 보너스, 실패하면 {b}단계 페널티가 붙는다.',
  difficultyParams: [[3, 1], [2, 1], [2, 2]],
  counterRuleKr: '썩은향 두꺼비전은 매턴 평균 운영보다, 특정 타이밍에 맞추는 운영이 더 중요하다.',
}
```

### 04. stalker_mantis

```js
{
  id: 'ambush_pattern',
  icon: '🗡️',
  category: 'sequence',
  nameKr: '매복 패턴 읽기',
  summaryKr: '같은 축을 연속으로 {a}번 쓰면 매복이 발동해 다음 {b}턴 동안 허용 범위가 줄어든다.',
  difficultyParams: [[3, 1], [2, 1], [2, 2]],
  counterRuleKr: '같은 축 반복을 피하고 순서를 섞는다.',
}
```

### 05. echo_bat

```js
{
  id: 'last_skill_echo',
  icon: '🔁',
  category: 'skill_copy',
  nameKr: '기억 반향',
  summaryKr: '직전에 사용한 스킬 {a}개가 다음 턴 다른 몬스터 슬롯에 복제되고, 복제 효과는 {b}턴 지속된다.',
  difficultyParams: [[1, 1], [1, 2], [2, 2]],
  counterRuleKr: '누가 어떤 스킬로 턴을 마무리하느냐가 중요하다.',
}
```

### 06. frost_moth

```js
{
  id: 'frost_pause',
  icon: '❄️',
  category: 'sequence',
  nameKr: '서리 정지',
  summaryKr: '한 턴에 행동을 {a}번 이상 하면 마지막 행동이 무효가 되고, 정지 상태가 {b}턴 유지된다.',
  difficultyParams: [[4, 1], [3, 1], [3, 2]],
  counterRuleKr: '한 턴 행동 수를 압축한다.',
}
```

### 07. mist_jellyfish

```js
{
  id: 'mist_drift',
  icon: '🌫️',
  category: 'bonus',
  nameKr: '안개 밀림',
  summaryKr: '축 하나를 범위 안에 넣을 때마다 다른 축 {a}개가 밀리고, 한 턴 최대 {b}회 발동한다.',
  difficultyParams: [[1, 1], [1, 2], [2, 2]],
  counterRuleKr: '한 축씩 맞추지 말고 동시에 정리한다.',
}
```

### 08. vine_spider

```js
{
  id: 'web_anchor',
  icon: '🕸️',
  category: 'sequence',
  nameKr: '거미줄 말뚝',
  summaryKr: '가장 최근에 건드린 축이 {a}턴마다 {b}턴 동안 잠긴다.',
  difficultyParams: [[3, 1], [2, 1], [2, 2]],
  counterRuleKr: '잠겨도 되는 축을 먼저 건드린다.',
}
```

### 09. mirror_chameleon

```js
{
  id: 'last_skill_echo',
  icon: '🔁',
  category: 'skill_copy',
  nameKr: '기억 반향',
  summaryKr: '직전에 사용한 스킬 {a}개가 다음 턴 다른 몬스터 슬롯에 복제되고, 복제 효과는 {b}턴 지속된다.',
  difficultyParams: [[1, 1], [1, 2], [2, 2]],
  counterRuleKr: '거울 카멜레온전은 마지막에 무엇을 남기느냐와 다음 턴 반향을 어떻게 이용하느냐가 중요하다.',
}
```

### 10. crystal_stag

```js
{
  id: 'resonance_window',
  icon: '💎',
  category: 'bonus',
  nameKr: '공명 구간',
  summaryKr: '같은 턴에 축 {a}개를 함께 맞추면 공명이 생겨 다음 {b}턴 동안 포획 안정도가 보강된다.',
  difficultyParams: [[2, 1], [2, 2], [3, 2]],
  counterRuleKr: '세트 플레이를 노린다.',
}
```

### 11. lava_crab

```js
{
  id: 'phase_molt',
  icon: '🦀',
  category: 'turn_phase',
  nameKr: '탈피 페이즈',
  summaryKr: '{a}턴마다 선호 조건이 바뀌고, 새 페이즈가 {b}턴 유지된다.',
  difficultyParams: [[4, 1], [3, 1], [2, 2]],
  counterRuleKr: '바뀌기 직전에는 과투자하지 않는다.',
}
```

### 12. spore_fox

```js
{
  id: 'prep_then_burst',
  icon: '🕰️',
  category: 'turn_phase',
  nameKr: '준비 후 폭발',
  summaryKr: '앞 {a}턴은 준비 단계라 직접 포획 효율이 낮고, 이후 {b}턴 동안 준비한 값이 한꺼번에 폭발한다.',
  difficultyParams: [[2, 1], [3, 1], [3, 2]],
  counterRuleKr: '포자 여우전은 냄새와 습도를 초반에 천천히 쌓아 두고, 중후반에 포자 확산처럼 한 번에 터뜨리는 식으로 풀어야 한다.',
}
```

### 13. iron_boar

```js
{
  id: 'opening_lock',
  icon: '🔒',
  category: 'turn_phase',
  nameKr: '초반 봉인',
  summaryKr: '전투 시작 후 {a}턴 동안 특정 계열 행동이 봉인되고, 이후 {b}턴부터 해제된다.',
  difficultyParams: [[2, 3], [3, 4], [4, 5]],
  counterRuleKr: '강철 멧돼지전은 초반에 억지로 밀지 말고, 해제 턴 이후를 준비하는 쪽이 강하다.',
}
```

### 14. stone_tortoise

```js
{
  id: 'opening_lock',
  icon: '🔒',
  category: 'turn_phase',
  nameKr: '초반 봉인',
  summaryKr: '전투 시작 후 {a}턴 동안 특정 계열 행동이 봉인되고, 이후 {b}턴부터 해제된다.',
  difficultyParams: [[2, 3], [3, 4], [4, 5]],
  counterRuleKr: '바위 거북전은 어둡고 조용한 환경을 먼저 굳히고, 껍질이 열리는 중반 이후에 핵심 행동을 터뜨리는 흐름이 잘 맞는다.',
}
```

### 15. rumble_bear

```js
{
  id: 'panic_threshold',
  icon: '😤',
  category: 'charge',
  nameKr: '위압 임계',
  summaryKr: '실패 상태인 축이 {a}개 이상이면 포획 안정도가 {b} 감소한다.',
  difficultyParams: [[3, 1], [2, 1], [2, 2]],
  counterRuleKr: '실패 축 수를 먼저 줄인다.',
}
```

### 16. thorn_hedgehog

```js
{
  id: 'thorn_bounce',
  icon: '🌵',
  category: 'sequence',
  nameKr: '가시 튕김',
  summaryKr: '같은 축을 한 턴에 {a}번 이상 건드리면 마지막 변화량의 {b}%가 반사된다.',
  difficultyParams: [[3, 50], [2, 50], [2, 100]],
  counterRuleKr: '같은 축 연타를 피한다.',
}
```

### 17. storm_hawk

```js
{
  id: 'checkpoint_turn',
  icon: '🚩',
  category: 'turn_phase',
  nameKr: '체크포인트',
  summaryKr: '{a}턴마다 체크포인트가 오며, 그 순간 조건을 만족하면 보너스, 실패하면 {b}단계 페널티가 붙는다.',
  difficultyParams: [[3, 1], [2, 1], [2, 2]],
  counterRuleKr: '폭풍 매전은 상승기류가 열리는 타이밍에 맞춰 핵심 축을 정리하는 운영이 중요하다.',
}
```

### 18. shadow_cat

```js
{
  id: 'shadow_escape',
  icon: '🐾',
  category: 'bonus',
  nameKr: '그림자 빠져나감',
  summaryKr: '범위 안에 들어간 축이 {a}개 미만이면 턴 종료 시 그중 {b}개가 다시 빠져나간다.',
  difficultyParams: [[2, 1], [2, 2], [3, 2]],
  counterRuleKr: '동시에 여러 축을 맞추는 마무리 턴이 중요하다.',
}
```

### 19. coral_seahorse

```js
{
  id: 'tidal_rhythm',
  icon: '🌊',
  category: 'turn_phase',
  nameKr: '조류 리듬',
  summaryKr: '{a}턴 주기로 낮은 조류와 높은 조류가 바뀌고, 각 상태는 {b}턴 유지된다.',
  difficultyParams: [[3, 1], [2, 1], [2, 2]],
  counterRuleKr: '2턴 리듬으로 준비와 마무리를 나눈다.',
}
```

### 20. wind_serpent

```js
{
  id: 'opening_lock',
  icon: '🔒',
  category: 'turn_phase',
  nameKr: '초반 봉인',
  summaryKr: '전투 시작 후 {a}턴 동안 특정 계열 행동이 봉인되고, 이후 {b}턴부터 해제된다.',
  difficultyParams: [[2, 3], [3, 4], [4, 5]],
  counterRuleKr: '초반은 준비 턴이고, 핵심 행동은 중반부터 터뜨린다.',
}
```

### 21. swamp_leech

```js
{
  id: 'drain_feast',
  icon: '🩸',
  category: 'charge',
  nameKr: '기생 흡수',
  summaryKr: '범위를 벗어난 축이 {a}개 이상이면 안정도를 {b} 회복한다.',
  difficultyParams: [[3, 1], [2, 1], [2, 2]],
  counterRuleKr: '조금씩 많이 틀리는 상태를 오래 두지 않는다.',
}
```

### 22. thunder_eel

```js
{
  id: 'charge_burst',
  icon: '⚡',
  category: 'charge',
  nameKr: '과충전',
  summaryKr: '큰 변화량 행동을 할 때마다 전하가 {a} 쌓이고, {b}이 되면 전 축 충격이 온다.',
  difficultyParams: [[1, 4], [1, 3], [1, 2]],
  counterRuleKr: '큰 수치 한 방보다 분산된 작은 조정이 유리하다.',
}
```

### 23. smoke_weasel

```js
{
  id: 'prep_then_burst',
  icon: '🕰️',
  category: 'turn_phase',
  nameKr: '준비 후 폭발',
  summaryKr: '앞 {a}턴은 준비 단계라 직접 포획 효율이 낮고, 이후 {b}턴 동안 준비한 값이 한꺼번에 폭발한다.',
  difficultyParams: [[2, 1], [3, 1], [3, 2]],
  counterRuleKr: '연기 족제비전은 초반에 연막을 깔고, 중후반에 한 번에 몰아치는 식으로 풀어야 한다.',
}
```

### 24. moss_golem

```js
{
  id: 'checkpoint_turn',
  icon: '🚩',
  category: 'turn_phase',
  nameKr: '체크포인트',
  summaryKr: '{a}턴마다 체크포인트가 오며, 그 순간 조건을 만족하면 보너스, 실패하면 {b}단계 페널티가 붙는다.',
  difficultyParams: [[3, 1], [2, 1], [2, 2]],
  counterRuleKr: '이끼 골렘전은 냄새와 습도, 정적 상태를 체크포인트마다 유지하고 있느냐가 핵심인 늪지 유지형 전투로 보는 편이 맞다.',
}
```
