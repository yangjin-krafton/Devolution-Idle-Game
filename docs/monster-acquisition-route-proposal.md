# 몬스터 획득 루트/조건 테이블 제안서

작성일: 2026-03-14

## 1. 목적

`src/data/monsters`의 모든 몬스터를 "미리 설계된 순서"대로 획득 가능하게 바꾼다.

핵심 목표는 아래 3가지다.

1. 모든 몬스터는 `wild -> devo1 -> devo2` 루트를 가진다.
2. 야생 출현과 획득은 랜덤이 아니라, 5가지 환경 지표 조건 테이블로 제어한다.
3. 조건 설계 방식은 스플렌더의 카드 비용처럼 한눈에 읽히는 형태여야 한다.

즉, 앞으로는 "이 몬스터가 왜 지금 나타났는지", "왜 아직 못 얻는지", "다음으로 무엇을 맞춰야 하는지"가 데이터만 봐도 바로 드러나야 한다.

---

## 2. 현재 문제

현재 데이터에는 개별 몬스터의 `environmentPreference`, `fleeProfile`, `environmentSkills`가 일부 들어가 있지만, 아래 정보가 시스템적으로 정리되어 있지는 않다.

- 어떤 몬스터가 어떤 순서로 해금되는지
- 어떤 야생 몬스터가 어떤 조건에서 출현 가능한지
- `devo1`, `devo2`까지 포함한 전체 획득 루트
- 출현 조건과 포획 조건의 차이
- 몬스터 간 난이도 상승 곡선

그래서 지금은 "몬스터 개별 설정"은 있어도, "전체 도감 진행 루트"는 없다.

---

## 3. 제안 핵심

각 몬스터 종(`01_howl_wolf.js` 같은 1개 파일 단위)에 대해, 전투 데이터와 별개로 다음 3층 구조를 둔다.

1. `progression`
2. `spawnTable`
3. `acquisitionRoutes`

의도는 명확하다.

- `progression`: 이 몬스터가 전체 게임에서 몇 번째 권역인지
- `spawnTable`: 야생으로 만날 수 있는 조건
- `acquisitionRoutes`: wild, devo1, devo2를 어떤 순서와 비용으로 획득하는지

---

## 4. 5축 환경 비용 모델

모든 출현/획득 조건은 같은 5축을 사용한다.

- `temperature`
- `brightness`
- `smell`
- `humidity`
- `sound`

이 5축은 앞으로 "환경 수치"이면서 동시에 "획득 비용 축"으로도 사용한다.

예시:

```js
{
  temperature: 2,
  brightness: 1,
  smell: 0,
  humidity: 3,
  sound: 1,
}
```

의미:

- 해당 몬스터를 출현시키거나 획득 루트에 진입하려면
- 플레이어가 누적해서 맞춘 환경 조건이
- 각 축에서 이 비용 이상이어야 한다

스플렌더 카드 비용처럼 읽히게 만들려면, UI/문서 표기 역시 항상 같은 순서를 유지한다.

- 온도
- 밝기
- 냄새
- 습도
- 소리

---

## 5. 출현 조건과 포획 조건 분리

이 부분은 반드시 분리하는 것이 좋다.

### 5-1. 출현 조건

"이 몬스터가 야생 후보 풀에 들어오는가"를 결정한다.

예시:

- `brightness >= 1`
- `humidity >= 2`
- `sound <= 1`

### 5-2. 포획 조건

실제 전투에서 "얻을 수 있는가"를 결정한다.

예시:

- 선호 환경 5축 중 4축 이상 일치
- 연속 2턴 유지
- 도주 게이지 6 이하

정리하면:

- 출현 조건은 맵/지역/세션 단위 필터
- 포획 조건은 전투 내 퍼즐 규칙

둘을 합치면 밸런싱이 매우 어렵고, 데이터 가독성도 떨어진다.

---

## 6. 제안 데이터 구조

각 몬스터 파일에 아래 블록을 추가하는 방향을 제안한다.

```js
progression: {
  zone: 1,
  order: 1,
  speciesRank: "common",
},

spawnTable: {
  biome: ["forest"],
  season: ["all"],
  weather: ["clear", "mist"],
  environmentCost: {
    temperature: 0,
    brightness: 1,
    smell: 0,
    humidity: 1,
    sound: 0,
  },
  previousRequiredSpecies: [],
},

acquisitionRoutes: {
  wild: {
    unlockCost: {
      temperature: 0,
      brightness: 1,
      smell: 0,
      humidity: 1,
      sound: 0,
    },
    battleRule: {
      preferredAxisMatch: 4,
      sustainTurns: 2,
      maxEscapeGauge: 6,
    },
  },
  devo1: [
    {
      id: "howl_wolf_d1_0",
      routeOrder: 1,
      unlockCost: {
        temperature: 1,
        brightness: 1,
        smell: 1,
        humidity: 1,
        sound: 2,
      },
      prerequisite: {
        captureWild: true,
      },
    }
  ],
  devo2: [
    {
      id: "howl_wolf_d2_0",
      parent: "howl_wolf_d1_0",
      routeOrder: 1,
      unlockCost: {
        temperature: 2,
        brightness: 1,
        smell: 1,
        humidity: 1,
        sound: 3,
      },
      prerequisite: {
        ownedForms: ["howl_wolf_d1_0"],
      },
    }
  ],
}
```

---

## 7. 루트 설계 원칙

모든 몬스터는 아래 원칙으로 설계한다.

### 7-1. 종 단위 루트 고정

한 종은 항상 아래 순서를 따른다.

`wild -> devo1 가지들 -> 각 devo1에서 파생되는 devo2`

즉, 현재 코드의 파일 구조를 그대로 루트 구조로 사용한다.

### 7-2. 설계 순서 고정

`01`부터 `24`까지는 단순 파일 번호가 아니라 실제 해금 순서의 기본값으로 쓴다.

예시:

- 1권역: 01 ~ 06
- 2권역: 07 ~ 12
- 3권역: 13 ~ 18
- 4권역: 19 ~ 24

이렇게 두면 나중에 도감 진행도, 출현 풀, 난이도 스케일을 모두 같은 기준으로 맞출 수 있다.

### 7-3. 이전 몬스터 달성 조건 지원

후반 몬스터는 환경 수치만으로 열리지 않게 한다.

예시:

- `previousRequiredSpecies: ["frost_moth", "vine_spider"]`
- `requiredOwnedForms: ["ember_salamander_d1_0"]`

이렇게 해야 "설계된 순서대로 획득"이 보장된다.

---

## 8. 테이블 설계 포맷

문서와 시트에서 먼저 아래 표 형식으로 설계한 뒤, 그 결과를 코드로 옮기는 방식이 가장 안전하다.

| species | zone | order | stage | routeId | temp | bright | smell | humidity | sound | extra condition |
|---|---:|---:|---|---|---:|---:|---:|---:|---:|---|
| howl_wolf | 1 | 1 | wild | wild | 0 | 1 | 0 | 1 | 0 | biome=forest |
| howl_wolf | 1 | 1 | devo1 | howl_wolf_d1_0 | 1 | 1 | 1 | 1 | 2 | capture wild |
| howl_wolf | 1 | 1 | devo2 | howl_wolf_d2_0 | 2 | 1 | 1 | 1 | 3 | own d1_0 |

이 표를 기준으로 하면 다음이 가능해진다.

- 밸런스 검토
- 권역별 난이도 곡선 확인
- 특정 축이 과도하게 몰리는지 확인
- 해금 누락 검수
- 코드 자동 생성

---

## 9. 추천 규칙

실제 설계 시 아래 규칙을 추천한다.

### 9-1. 권역별 비용 총합 증가

환경 비용 총합은 권역이 올라갈수록 늘린다.

예시:

- 1권역 wild: 총합 2~4
- 1권역 devo1: 총합 5~7
- 1권역 devo2: 총합 7~9
- 4권역 wild: 총합 8~10
- 4권역 devo2: 총합 12 이상

### 9-2. 종의 대표 축 강조

각 몬스터의 `sensoryType`, `habitat`, `wildMechanic`과 연결된 축 하나는 반드시 높게 준다.

예시:

- 박쥐 계열: `sound`
- 젤리피시 계열: `humidity`
- 화염 계열: `temperature`

### 9-3. 모든 축을 완전히 버리지는 않기

어느 한 축만 계속 올리는 방식은 단조롭다.

권장:

- 주축 1개
- 보조축 1~2개
- 나머지 축도 최소 요구치 0~1 정도는 배치

### 9-4. devo2는 부모 개성이 보여야 함

`devo2` 비용은 단순 상위 호환이 아니라, 부모 `devo1`의 성향이 강화되는 쪽으로 나눠야 한다.

예시:

- 공격형 `devo1`의 `devo2`: 온도/소리 고비용
- 지원형 `devo1`의 `devo2`: 습도/냄새 고비용

---

## 10. 구현 순서 제안

문서 기준으로는 아래 순서가 가장 안전하다.

1. 24종 전체에 대해 표 형식 설계본 작성
2. `zone`, `order`, `stage`, `unlockCost`를 먼저 확정
3. 출현 조건과 포획 조건을 분리 설계
4. `src/data/monsters`에 공통 필드 추가
5. 별도 집계 파일에서 전체 진행 테이블 생성
6. UI에서 "다음 목표 몬스터"와 "필요 환경 비용" 노출

구현 관점에서는 몬스터 파일마다 흩어 쓰기보다, 별도 집계 파일을 두는 것도 좋다.

예시:

- `src/data/monsterProgressionTable.js`
- `src/data/monsterSpawnTable.js`

이유:

- 밸런싱 작업이 쉬움
- 정렬/검증 자동화 가능
- 문서 표와 코드 표의 1:1 대응 가능

---

## 11. 추천 최종 구조

실무적으로는 아래처럼 "개별 몬스터 파일 + 중앙 테이블" 2층 구조를 추천한다.

### 몬스터 파일

- 개성 데이터
- 전투 데이터
- 진화 라인 구조

### 중앙 테이블

- 출현 순서
- 권역
- 해금 비용
- 선행 몬스터 조건
- UI 표시용 요약 데이터

즉, 개별 파일은 "정체성", 중앙 테이블은 "게임 진행 설계"를 맡는다.

---

## 12. 다음 단계 제안

다음 작업은 아래 순서가 적절하다.

1. 이 제안서 기준으로 24종 전체 설계표 초안 작성
2. 권역 1의 6종만 먼저 샘플 밸런싱
3. 이후 `src/data/monsters`와 중앙 테이블 구조 반영

가장 중요한 기준은 하나다.

"몬스터가 랜덤하게 주어지는 느낌"이 아니라,
"플레이어가 환경을 설계해서 원하는 몬스터 루트를 열어가는 느낌"이 나와야 한다.
