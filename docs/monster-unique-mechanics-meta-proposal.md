# 24종 몬스터 확장형 고유 메커닉 메타 제안서

작성일: 2026-03-14

## 1. 목적

지금까지의 메커닉은 주로 5축 환경값 자체를 흔들거나 잠그는 방식이었다.
이 방식은 기본 퍼즐로는 좋지만, 계속 이어지면 결국 "숫자를 더 정밀하게 맞추는 게임"으로만 느껴질 가능성이 크다.

그래서 앞으로는 고유 메커닉을 `축 수치` 밖으로 확장해야 한다.

목표는 아래와 같다.

1. 몬스터마다 다른 종류의 생각을 요구한다.
2. 전투마다 다른 리듬, 다른 우선순위, 다른 파티 구성을 유도한다.
3. 단순 계산뿐 아니라 예측, 타이밍, 희생, 정보전, 폭발 턴 설계를 만들게 한다.
4. 그래도 데이터는 단순하게 유지한다.

즉, 플레이어가 "이번엔 어느 축을 맞출까?"만 고민하는 게 아니라,

- 지금 정리할지, 모을지
- 지금 교체할지, 참을지
- 정보 확인을 먼저 할지
- 다음 턴 폭발을 준비할지
- 일부러 하나를 포기하고 다른 이득을 취할지

까지 고민하게 만들어야 한다.

---

## 2. 외부 게임에서 가져올 핵심 문법

비슷한 장르에서 실제로 재미를 만드는 문법은 대부분 아래에 모인다.
우리 게임에서는 이것들을 데미지/하수인/맵 포지셔닝이 아니라 `환경 5축 포획 퍼즐`로 번역하면 된다.

### 2-1. 예고된 위협

`Slay the Spire`, `Into the Breach`류의 핵심은 "무슨 일이 일어날지 보여주고, 거기에 대응하게 만든다"는 점이다.

우리 게임 번역:

- 다음 턴 교란 축 예고
- 2턴 뒤 페이즈 전환 예고
- 특정 행동을 하면 반격이 온다는 경고

### 2-2. 필드 오브젝트

`Hearthstone`, `Monster Train`, `Inscryption`은 본체 외에 남아 있는 장치가 재미를 만든다.

우리 게임 번역:

- 안개 기둥
- 포자 구름
- 메아리 수정
- 거미줄 토큰
- 용암 균열

즉, 몬스터를 직접 상대하는 것과 별개로 `전장 기믹 관리`가 생긴다.

### 2-3. 차징과 폭발 턴

많은 카드게임은 "지금 약하지만 모으면 크게 터지는 상태"가 재미를 만든다.

우리 게임 번역:

- 전하
- 울음
- 포자 농도
- 공명 스택
- 갑피 스택

유저는 지금 턴 최적이 아니라 `다음 턴 폭발`까지 본다.

### 2-4. 숨겨진 정보와 정찰

재미는 항상 완전정보에서만 나오지 않는다.
일부 정보가 숨겨지고, 그걸 읽거나 확인하는 행동이 있으면 플레이가 훨씬 다층화된다.

우리 게임 번역:

- 실제 목표 축 일부 숨김
- 추천 축 중 가짜 포함
- 다음 행동 후보 2개 중 하나만 공개
- 탐색 스킬 사용 시 진실 공개

### 2-5. 순서 제약

같은 행동도 어떤 순서로 하느냐에 따라 결과가 달라질 때 플레이가 살아난다.

우리 게임 번역:

- 첫 행동만 무효
- 마지막 행동만 반향
- 같은 축 연타 시 반사
- 두 축을 같은 턴에 같이 맞추면 보너스

### 2-6. 대가를 치르는 선택

좋은 게임은 "정답 행동"보다 "무엇을 포기할지"를 묻게 만든다.

우리 게임 번역:

- 교체하면 안전하지만 적이 강화
- 정보를 보면 턴 효율 손해
- 이번 턴 안정도를 깎고 다음 턴 공명 보너스를 준비
- 한 축을 일부러 포기하고 다른 세 축을 고정

---

## 3. 우리 게임용 메커닉 라이브러리

앞으로 24종을 설계할 때는 아래 라이브러리에서 하나를 고르는 방식이 가장 안전하다.
한 몬스터는 한 개의 핵심 문법만 강하게 가진다.

### A. 예고형

- 다음 턴 적 행동 공개
- 2턴 뒤 필드 변화 예고
- 특정 조건 충족 시 다음 패턴 고정

유저 사고:

- 지금 맞출지
- 다음 턴 대비할지

### B. 차징형

- 무언가가 쌓이고 터짐
- 쌓이는 속도와 터지는 임계치가 메커닉 핵심

유저 사고:

- 지금 막을지
- 일부러 늦출지

### C. 필드형

- 맵에 남는 오브젝트 관리
- 방치하면 누적 페널티

유저 사고:

- 적 본체를 먼저 볼지
- 전장부터 청소할지

### D. 정보형

- 정보가 일부 가려짐
- 탐색/정찰/확인 행동 가치 상승

유저 사고:

- 지금 확인할지
- 감으로 밀지

### E. 순서형

- 같은 행동도 순서가 중요
- 첫 행동, 마지막 행동, 연속 행동에 의미 부여

유저 사고:

- 어떤 카드부터 쓸지
- 어떤 카드로 마무리할지

### F. 희생형

- 당장 손해를 감수하면 나중에 큰 보상
- 일부 축 포기, 일부 상태 소모

유저 사고:

- 짧게 이길지
- 크게 준비할지

### G. 동시완성형

- 한 축씩 맞추면 불리
- 2~3축 동시 정리가 핵심

유저 사고:

- 폭발 턴 설계
- 교체 후 콤보

### H. 반사형

- 플레이어 행동 일부가 되돌아옴
- 큰 수치 연타, 같은 축 연타를 억제

유저 사고:

- 우회 루트
- 분산 운영

### I. 교체압박형

- 후보 3마리 교체가 핵심 리소스가 됨
- 교체는 강하지만 리스크 존재

유저 사고:

- 지금 교체할지
- 끝까지 참을지

### J. 페이즈형

- 턴이 지나며 몬스터 규칙이 바뀜
- 초반/중반/마무리의 공략법이 달라짐

유저 사고:

- 지금은 준비 페이즈인지
- 마무리 페이즈인지

---

## 4. 데이터 형식

복잡한 규칙도 결국 데이터는 단순하게 유지한다.

```js
wildMechanic: {
  id: 'sonic_buildup',
  category: 'charge',
  nameKr: '울음 누적',
  summaryKr: '소리 축이 목표에서 벗어난 턴마다 울음 카운트가 {a} 쌓이고, {b}이 되면 도주 게이지가 급증한다.',
  difficultyParams: [
    [1, 4],
    [1, 3],
    [1, 2],
  ],
  counterRuleKr: '소리 축을 안정화하거나 소리 잠금 스킬로 누적을 끊는다.',
}
```

규칙:

- `difficultyParams[0]`: wild
- `difficultyParams[1]`: devo1
- `difficultyParams[2]`: devo2

한 메커닉당 숫자는 가능하면 2개 또는 3개만 사용한다.

---

## 5. 24종 확장형 고유 메커닉 제안

아래 제안은 일부는 축 직접 조정이고, 일부는 정보, 턴 순서, 필드, 교체, 폭발 턴, 희생 구조를 다룬다.
즉 "축을 맞추는 게임" 위에 "다른 종류의 사고"를 얹는 형태다.

### 01. howl_wolf

```js
{
  id: 'sonic_buildup',
  category: 'charge',
  nameKr: '울음 누적',
  summaryKr: '소리 축이 목표에서 벗어난 턴마다 울음 카운트가 {a} 쌓이고, {b}이 되면 도주 게이지가 급증한다.',
  difficultyParams: [
    [1, 4],
    [1, 3],
    [1, 2],
  ],
  counterRuleKr: '소리 축 안정화와 유지가 핵심이다.',
}
```

### 02. ember_salamander

```js
{
  id: 'lava_shell',
  category: 'shield',
  nameKr: '용암 갑피',
  summaryKr: '온도 축을 직접 바꿀 때마다 갑피가 {a} 쌓이고, {b} 이상이면 직접 온도 조정이 약해진다.',
  difficultyParams: [
    [1, 3],
    [1, 2],
    [2, 2],
  ],
  counterRuleKr: '온도 대신 다른 축을 먼저 맞춰 갑피를 벗긴다.',
}
```

### 03. rot_toad

```js
{
  id: 'rot_puddle',
  category: 'field',
  nameKr: '오염 웅덩이',
  summaryKr: '매 턴 전장에 오염 웅덩이가 {a}개 생기고, {b}개 이상 방치하면 냄새 축이 크게 흔들린다.',
  difficultyParams: [
    [1, 3],
    [1, 2],
    [2, 2],
  ],
  counterRuleKr: '오염을 치우거나 짧은 턴 안에 끝낸다.',
}
```

### 04. stalker_mantis

```js
{
  id: 'ambush_pattern',
  category: 'sequence',
  nameKr: '매복 패턴 읽기',
  summaryKr: '같은 축을 연속으로 {a}번 쓰면 매복이 발동해 다음 {b}턴 동안 허용 범위가 줄어든다.',
  difficultyParams: [
    [3, 1],
    [2, 1],
    [2, 2],
  ],
  counterRuleKr: '같은 축 반복을 피하고 조정 순서를 섞는다.',
}
```

### 05. echo_bat

```js
{
  id: 'echo_tail',
  category: 'sequence',
  nameKr: '마지막 메아리',
  summaryKr: '이번 턴 마지막 행동의 효과가 {a}% 강도로 다음 턴 한 번 더 반복되고, 최대 {b}회 저장된다.',
  difficultyParams: [
    [50, 1],
    [75, 1],
    [100, 2],
  ],
  counterRuleKr: '턴 마지막 행동을 의도적으로 설계한다.',
}
```

### 06. frost_moth

```js
{
  id: 'frost_pause',
  category: 'limit',
  nameKr: '서리 정지',
  summaryKr: '한 턴에 행동을 {a}번 이상 하면 마지막 행동이 무효가 되고, 정지 상태가 {b}턴 유지된다.',
  difficultyParams: [
    [4, 1],
    [3, 1],
    [3, 2],
  ],
  counterRuleKr: '한 턴에 너무 많이 하지 말고 압축해서 움직인다.',
}
```

### 07. mist_jellyfish

```js
{
  id: 'mist_drift',
  category: 'simultaneous',
  nameKr: '안개 밀림',
  summaryKr: '축 하나를 범위 안에 넣을 때마다 다른 축 {a}개가 밀리고, 한 턴 최대 {b}회 발동한다.',
  difficultyParams: [
    [1, 1],
    [1, 2],
    [2, 2],
  ],
  counterRuleKr: '한 축씩 맞추지 말고 동시에 정리하는 턴을 만든다.',
}
```

### 08. vine_spider

```js
{
  id: 'web_anchor',
  category: 'lock',
  nameKr: '거미줄 말뚝',
  summaryKr: '가장 최근에 건드린 축이 {a}턴마다 {b}턴 동안 잠긴다.',
  difficultyParams: [
    [3, 1],
    [2, 1],
    [2, 2],
  ],
  counterRuleKr: '잠겨도 괜찮은 축을 먼저 건드린다.',
}
```

### 09. mirror_chameleon

```js
{
  id: 'fake_intent',
  category: 'information',
  nameKr: '거울 위장',
  summaryKr: '다음 턴 예고 정보 {a}개 중 {b}개가 거짓일 수 있다.',
  difficultyParams: [
    [2, 1],
    [2, 1],
    [3, 1],
  ],
  counterRuleKr: '예고를 맹신하지 말고 안전한 축부터 맞춘다.',
}
```

### 10. crystal_stag

```js
{
  id: 'resonance_window',
  category: 'bonus',
  nameKr: '공명 구간',
  summaryKr: '같은 턴에 축 {a}개를 함께 맞추면 공명이 생겨 다음 {b}턴 동안 포획 안정도가 보강된다.',
  difficultyParams: [
    [2, 1],
    [2, 2],
    [3, 2],
  ],
  counterRuleKr: '세트 플레이가 강한 보상을 주는 상대다.',
}
```

### 11. lava_crab

```js
{
  id: 'phase_molt',
  category: 'phase',
  nameKr: '탈피 페이즈',
  summaryKr: '{a}턴마다 선호 조건이 바뀌고, 새 페이즈가 {b}턴 유지된다.',
  difficultyParams: [
    [4, 1],
    [3, 1],
    [2, 2],
  ],
  counterRuleKr: '바뀌기 직전에는 큰 투자보다 준비에 집중한다.',
}
```

### 12. spore_fox

```js
{
  id: 'false_hint',
  category: 'information',
  nameKr: '가짜 단서',
  summaryKr: '전투 중 표시되는 추천 정보 {a}개 중 일부가 거짓이며, {b}턴마다 바뀐다.',
  difficultyParams: [
    [1, 3],
    [1, 2],
    [2, 2],
  ],
  counterRuleKr: '탐색 행동의 가치가 높은 정보전 상대다.',
}
```

### 13. iron_boar

```js
{
  id: 'swap_punish',
  category: 'swap',
  nameKr: '돌진 응징',
  summaryKr: '후보 교체를 할 때마다 돌진 수치가 {a} 쌓이고, {b}이 되면 큰 교란이 발생한다.',
  difficultyParams: [
    [1, 3],
    [1, 2],
    [2, 2],
  ],
  counterRuleKr: '교체를 리소스로 아껴야 하는 전투다.',
}
```

### 14. stone_tortoise

```js
{
  id: 'shell_hide',
  category: 'stall',
  nameKr: '껍질 웅크림',
  summaryKr: '범위 근처까지 오면 변화량이 {a}% 줄고, 그 상태가 {b}턴 지속된다.',
  difficultyParams: [
    [50, 1],
    [60, 1],
    [70, 2],
  ],
  counterRuleKr: '막판 한 방이 중요하고, 미세조정만 반복하면 손해다.',
}
```

### 15. rumble_bear

```js
{
  id: 'panic_threshold',
  category: 'pressure',
  nameKr: '위압 임계',
  summaryKr: '실패 상태인 축이 {a}개 이상이면 포획 안정도가 {b} 감소한다.',
  difficultyParams: [
    [3, 1],
    [2, 1],
    [2, 2],
  ],
  counterRuleKr: '정답값보다 실패 축 개수 관리가 더 중요하다.',
}
```

### 16. thorn_hedgehog

```js
{
  id: 'thorn_bounce',
  category: 'reflect',
  nameKr: '가시 튕김',
  summaryKr: '같은 축을 한 턴에 {a}번 이상 건드리면 마지막 변화량의 {b}%가 반사된다.',
  difficultyParams: [
    [3, 50],
    [2, 50],
    [2, 100],
  ],
  counterRuleKr: '같은 축 연타를 포기하고 다른 루트를 찾는다.',
}
```

### 17. storm_hawk

```js
{
  id: 'shifted_wind',
  category: 'forecast',
  nameKr: '이동하는 기류',
  summaryKr: '다음에 중요해질 축이 미리 {a}턴 전 예고되고, 한 번에 {b}축까지 바뀐다.',
  difficultyParams: [
    [1, 1],
    [1, 2],
    [2, 2],
  ],
  counterRuleKr: '지금 턴보다 다음 턴 준비가 중요한 상대다.',
}
```

### 18. shadow_cat

```js
{
  id: 'shadow_escape',
  category: 'simultaneous',
  nameKr: '그림자 빠져나감',
  summaryKr: '범위 안에 들어간 축이 {a}개 미만이면 턴 종료 시 그중 {b}개가 다시 빠져나간다.',
  difficultyParams: [
    [2, 1],
    [2, 2],
    [3, 2],
  ],
  counterRuleKr: '동시에 여러 축을 맞추는 마무리 턴이 중요하다.',
}
```

### 19. coral_seahorse

```js
{
  id: 'tidal_rhythm',
  category: 'phase',
  nameKr: '조류 리듬',
  summaryKr: '{a}턴 주기로 낮은 조류와 높은 조류가 바뀌고, 각 상태는 {b}턴 유지된다.',
  difficultyParams: [
    [3, 1],
    [2, 1],
    [2, 2],
  ],
  counterRuleKr: '2턴 리듬으로 준비와 마무리를 나눠서 본다.',
}
```

### 20. wind_serpent

```js
{
  id: 'big_move_dodge',
  category: 'spread',
  nameKr: '큰 움직임 회피',
  summaryKr: '가장 큰 변화량을 준 행동 {a}개를 무효화하고, 그 영향이 다른 축 {b}개로 흩어진다.',
  difficultyParams: [
    [1, 1],
    [1, 2],
    [2, 2],
  ],
  counterRuleKr: '작고 안정적인 연속 조정이 강한 전투다.',
}
```

### 21. swamp_leech

```js
{
  id: 'drain_feast',
  category: 'drain',
  nameKr: '기생 흡수',
  summaryKr: '범위를 벗어난 축이 {a}개 이상이면 안정도를 {b} 회복한다.',
  difficultyParams: [
    [3, 1],
    [2, 1],
    [2, 2],
  ],
  counterRuleKr: '조금씩 많이 틀리는 상태를 절대 오래 두면 안 된다.',
}
```

### 22. thunder_eel

```js
{
  id: 'charge_burst',
  category: 'charge',
  nameKr: '과충전',
  summaryKr: '큰 변화량 행동을 할 때마다 전하가 {a} 쌓이고, {b}이 되면 전 축 충격이 온다.',
  difficultyParams: [
    [1, 4],
    [1, 3],
    [1, 2],
  ],
  counterRuleKr: '큰 수치 한 방보다 분산된 작은 조정이 유리하다.',
}
```

### 23. smoke_weasel

```js
{
  id: 'smoke_guess',
  category: 'hidden_info',
  nameKr: '연막 추정',
  summaryKr: '실제 목표값이 표시값에서 최대 {a}만큼 어긋나며, 그 오차가 {b}턴마다 바뀐다.',
  difficultyParams: [
    [1, 3],
    [2, 2],
    [2, 1],
  ],
  counterRuleKr: '평균값 운영과 안전 범위 확보가 중요하다.',
}
```

### 24. moss_golem

```js
{
  id: 'regen_field',
  category: 'regen',
  nameKr: '재생 지대',
  summaryKr: '매 턴 재생 수치가 {a}만큼 차오르고, 필드 오브젝트가 {b}개 이상 남아 있으면 추가 회복한다.',
  difficultyParams: [
    [1, 2],
    [1, 1],
    [2, 1],
  ],
  counterRuleKr: '본체보다 필드를 먼저 정리할 이유가 생기는 상대다.',
}
```

---

## 6. 메타적으로 좋은 이유

이 구조가 좋은 이유는 몬스터마다 다른 종류의 사고를 요구하기 때문이다.

### 계산형

- howl_wolf
- thunder_eel
- rumble_bear

유저는 누적과 임계치를 계산한다.

### 리듬형

- coral_seahorse
- lava_crab
- storm_hawk

유저는 타이밍과 예고를 읽는다.

### 정보형

- mirror_chameleon
- spore_fox
- smoke_weasel

유저는 불완전한 정보를 다룬다.

### 폭발형

- crystal_stag
- mist_jellyfish
- shadow_cat

유저는 한 턴에 동시 완성을 설계한다.

### 운영형

- vine_spider
- iron_boar
- stone_tortoise
- frost_moth

유저는 순서, 교체, 리소스 절약을 고민한다.

### 필드형

- rot_toad
- moss_golem

유저는 본체와 전장을 동시에 본다.

---

## 7. 실제 구현 우선순위

전부 한 번에 넣지 말고 아래 순서가 좋다.

### 1차

- howl_wolf
- iron_boar
- vine_spider
- crystal_stag
- smoke_weasel
- moss_golem

이 6개만으로도

- 차징
- 교체 압박
- 잠금
- 동시 완성 보너스
- 숨겨진 정보
- 필드 관리

가 모두 들어온다.

### 2차

- lava_crab
- storm_hawk
- shadow_cat
- thunder_eel
- thorn_hedgehog
- rot_toad

여기서부터 예고, 폭발, 반사, 장기 압박이 추가된다.

---

## 8. 결론

이제 필요한 것은 "축을 더 어렵게 만드는 것"이 아니다.
"축 바깥의 전투 문법"을 늘리는 것이다.

우리 게임은 기본적으로 5축 환경 퍼즐이 이미 독특하다.
그러니 고유 메커닉은 그 위에 아래 같은 생각을 얹어야 한다.

- 예고를 읽는 생각
- 오브젝트를 정리하는 생각
- 한 턴을 참는 생각
- 교체를 아끼는 생각
- 동시에 끝내는 생각
- 일부러 손해를 감수하는 생각

이런 문법이 쌓일수록 유저는 단순 계산이 아니라
상황 판단, 패턴 학습, 폭발 턴 설계, 리스크 감수로 플레이하게 된다.
그게 반복 피로를 줄이고, 전투마다 도파민 포인트를 만드는 가장 현실적인 방향이다.
