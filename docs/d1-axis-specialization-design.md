# D1 변형별 5축 지향 설계표

작성일: 2026-03-15

## 목적

현재 같은 종의 d1 변형들(d1_0, d1_1, d1_2...)이 동일한 스킬/5축 테이블을 공유하는 문제를 해결한다.
각 d1 변형의 이름과 컨셉에 맞게 5축 스텟을 차별화하고, d2는 부모 d1의 개성을 더 강화한다.

## 설계 원칙

1. **wild**: 산만한 다축형 (purity 1)
2. **d1**: 부모 wild에서 특정 축 방향으로 분화 시작 (purity 2)
3. **d2**: 부모 d1의 지향축을 극한까지 정제 (purity 3)
4. 같은 종의 d1 변형 간 **주축이 겹치지 않도록** 분배
5. 스킬 delta 총합(절대값)은 기존과 유사하게 유지하되 축 분포만 재배분

## 축 약어

| 약어 | 축 | 한글 |
|------|-----|------|
| T | temperature | 온도 |
| B | brightness | 밝기 |
| Sm | smell | 냄새 |
| H | humidity | 습도 |
| So | sound | 소리 |

---

## 1권역 (species 01~06)

### 01. howl_wolf (종 주축: sound|brightness)

| form | 이름 | 컨셉 | 지향 주축 | 지향 보조축 | 역할 |
|------|------|-------|-----------|-------------|------|
| d1_0 | 달울림 | 전장의 노래꾼 | **sound** | brightness | 순수 소리 특화 공격형 |
| d1_1 | 수호늑대 | 방어의 늑대 | **brightness** | humidity | 빛+습도 방어/서포트형 |
| d1_2 | 질풍늑대 | 바람처럼 빠르게 | **sound** | temperature | 소리+온도(바람) 속공형 |

d2 계보:
- d2_0 울림이 ← d1_0: sound 극정제
- d2_1 자장이 ← d1_0: sound(부드러운) 극정제
- d2_2 방패냥 ← d1_1: brightness 극정제
- d2_3 메아리 ← d1_1: brightness+sound 극정제
- d2_4 쏜살이 ← d1_2: sound+temperature 극정제
- d2_5 솔솔이 ← d1_2: temperature(바람) 극정제

### 02. ember_salamander (종 주축: temperature|humidity)

| form | 이름 | 컨셉 | 지향 주축 | 지향 보조축 | 역할 |
|------|------|-------|-----------|-------------|------|
| d1_0 | 불씨도롱 | 따뜻한 온기 | **temperature** | brightness | 순수 온도 특화 |
| d1_1 | 용암방패 | 아군을 감싸는 수호 | **temperature** | humidity | 온도+습도 방어형 |
| d1_2 | 온천도롱 | 치유의 온천수 | **humidity** | smell | 습도 특화 치유형 |
| d1_3 | 섬광도롱 | 불꽃 터뜨려 놀라게 | **brightness** | temperature | 밝기 특화 기습형 |

### 03. rot_toad (종 주축: smell|humidity)

| form | 이름 | 컨셉 | 지향 주축 | 지향 보조축 | 역할 |
|------|------|-------|-----------|-------------|------|
| d1_0 | 향기두꺼비 | 독→약초 치유 | **smell** | humidity | 냄새 특화 치유형 |
| d1_1 | 독안개 | 도주 억제 전략가 | **humidity** | smell | 습도 특화 제어형 |
| d1_2 | 맹독두꺼비 | 강렬한 냄새 공격 | **smell** | temperature | 냄새+온도 공격형 |

### 04. stalker_mantis (종 주축: sound|brightness)

| form | 이름 | 컨셉 | 지향 주축 | 지향 보조축 | 역할 |
|------|------|-------|-----------|-------------|------|
| d1_0 | 춤사마귀 | 춤으로 소통 | **sound** | smell | 소리+냄새 매혹형 |
| d1_1 | 꽃사마귀 | 꽃잎 유인 | **brightness** | smell | 밝기+냄새 유인형 |
| d1_2 | 갑옷사마귀 | 외골격 방어 | **sound** | humidity | 소리+습도 방어형 |

### 05. echo_bat (종 주축: brightness|humidity)

| form | 이름 | 컨셉 | 지향 주축 | 지향 보조축 | 역할 |
|------|------|-------|-----------|-------------|------|
| d1_0 | 노래박쥐 | 멜로디 치유 | **sound** | humidity | 소리 특화 치유형 |
| d1_1 | 질풍박쥐 | 빠르게 압박 | **brightness** | temperature | 밝기+온도 속공형 |

### 06. frost_moth (종 주축: temperature|brightness)

| form | 이름 | 컨셉 | 지향 주축 | 지향 보조축 | 역할 |
|------|------|-------|-----------|-------------|------|
| d1_0 | 눈꽃나방 | 눈꽃 치유/보호 | **temperature** | humidity | 온도+습도 치유형 |
| d1_1 | 얼음나방 | 차가운 바람 둔화 | **brightness** | sound | 밝기+소리 제어형 |

---

## 2권역 (species 07~16)

### 07. mist_jellyfish (종 주축: humidity|sound)

| form | 이름 | 컨셉 | 지향 주축 | 지향 보조축 | 역할 |
|------|------|-------|-----------|-------------|------|
| d1_0 | 이슬해파리 | 이슬방울 치유 | **humidity** | brightness | 습도 특화 치유형 |
| d1_1 | 독촉수 | 도주 억제 | **sound** | smell | 소리+냄새 제어형 |

### 08. vine_spider (종 주축: sound|brightness)

| form | 이름 | 컨셉 | 지향 주축 | 지향 보조축 | 역할 |
|------|------|-------|-----------|-------------|------|
| d1_0 | 꽃거미 | 꽃향기 보호 | **smell** | brightness | 냄새+밝기 서포트형 |
| d1_1 | 실뿜이 | 빠르게 묶기 | **sound** | humidity | 소리+습도 속공형 |
| d1_2 | 약초거미 | 거미줄 치유 | **humidity** | smell | 습도+냄새 치유형 |

### 09. mirror_chameleon (종 주축: temperature|sound)

| form | 이름 | 컨셉 | 지향 주축 | 지향 보조축 | 역할 |
|------|------|-------|-----------|-------------|------|
| d1_0 | 빛도마뱀 | 빛 반사 증폭 | **brightness** | temperature | 밝기 특화 공격형 |
| d1_1 | 위장도마뱀 | 완벽한 위장 | **temperature** | smell | 온도+냄새 회피형 |

### 10. crystal_stag (종 주축: temperature|brightness)

| form | 이름 | 컨셉 | 지향 주축 | 지향 보조축 | 역할 |
|------|------|-------|-----------|-------------|------|
| d1_0 | 종소리사슴 | 맑은 종소리 매혹 | **sound** | brightness | 소리+밝기 매혹형 |
| d1_1 | 숲지기사슴 | 숲 향기 치유 | **smell** | humidity | 냄새+습도 치유형 |
| d1_2 | 수정갑사슴 | 수정 뿔 방어 | **brightness** | temperature | 밝기+온도 방어형 |

### 11. lava_crab (종 주축: temperature|brightness)

| form | 이름 | 컨셉 | 지향 주축 | 지향 보조축 | 역할 |
|------|------|-------|-----------|-------------|------|
| d1_0 | 온천게 | 따뜻한 물 온화 | **humidity** | temperature | 습도+온도 치유형 |
| d1_1 | 화염집게 | 불타는 자극 | **temperature** | brightness | 온도 특화 공격형 |
| d1_2 | 조력게 | 물+열 서포터 | **temperature** | humidity | 온도+습도 서포트형 |

### 12. spore_fox (종 주축: smell|brightness)

| form | 이름 | 컨셉 | 지향 주축 | 지향 보조축 | 역할 |
|------|------|-------|-----------|-------------|------|
| d1_0 | 향여우 | 달콤한 향 경계해제 | **smell** | humidity | 냄새 특화 매혹형 |
| d1_1 | 안개여우 | 포자 안개 은신 | **brightness** | smell | 밝기+냄새 제어형 |

### 13. iron_boar (종 주축: smell|temperature)

| form | 이름 | 컨셉 | 지향 주축 | 지향 보조축 | 역할 |
|------|------|-------|-----------|-------------|------|
| d1_0 | 철등멧돼지 | 강철 등 방패 | **temperature** | humidity | 온도 특화 방어형 |
| d1_1 | 화염멧돼지 | 뜨거운 갈기 공격 | **temperature** | brightness | 온도+밝기 공격형 |
| d1_2 | 약초멧돼지 | 약초 치유 | **smell** | humidity | 냄새+습도 치유형 |
| d1_3 | 돌진멧돼지 | 맹렬한 돌진 | **sound** | temperature | 소리+온도 속공형 |

### 14. stone_tortoise (종 주축: brightness|sound)

| form | 이름 | 컨셉 | 지향 주축 | 지향 보조축 | 역할 |
|------|------|-------|-----------|-------------|------|
| d1_0 | 이끼거북 | 이끼 약초 치유 | **smell** | humidity | 냄새+습도 치유형 |
| d1_1 | 온천거북 | 따뜻한 김 치유 | **temperature** | humidity | 온도+습도 치유형 |
| d1_2 | 화석거북 | 고대 소리 공격 | **sound** | brightness | 소리+밝기 공격형 |
| d1_3 | 지진거북 | 지면 흔들기 | **sound** | temperature | 소리+온도 제압형 |

### 15. rumble_bear (종 주축: brightness|smell)

| form | 이름 | 컨셉 | 지향 주축 | 지향 보조축 | 역할 |
|------|------|-------|-----------|-------------|------|
| d1_0 | 북소리곰 | 리듬 | **sound** | brightness | 소리 특화 리듬형 |
| d1_1 | 포옹곰 | 보호 | **humidity** | smell | 습도 특화 방어형 |
| d1_2 | 자장곰 | 자장가 진정 | **sound** | smell | 소리+냄새 치유형 |
| d1_3 | 돌진곰 | 돌진 압도 | **temperature** | brightness | 온도+밝기 공격형 |

### 16. thorn_hedgehog (종 주축: sound|smell)

| form | 이름 | 컨셉 | 지향 주축 | 지향 보조축 | 역할 |
|------|------|-------|-----------|-------------|------|
| d1_0 | 꽃가시 | 꽃 피어남 방어 | **smell** | brightness | 냄새+밝기 방어형 |
| d1_1 | 향가시 | 달콤한 향 공격 | **smell** | temperature | 냄새+온도 공격형 |
| d1_2 | 약가시 | 약초 치유 | **humidity** | smell | 습도+냄새 치유형 |

---

## 3권역 (species 17~24)

### 17. storm_hawk (종 주축: brightness|temperature)

| form | 이름 | 컨셉 | 지향 주축 | 지향 보조축 | 역할 |
|------|------|-------|-----------|-------------|------|
| d1_0 | 바람매 | 부드러운 바람 매혹 | **sound** | brightness | 소리+밝기 매혹형 |
| d1_1 | 급강하매 | 번개 충격 | **temperature** | brightness | 온도+밝기 공격형 |
| d1_2 | 둥지매 | 날개 보호 | **humidity** | smell | 습도+냄새 서포트형 |

### 18. shadow_cat (종 주축: brightness|sound)

| form | 이름 | 컨셉 | 지향 주축 | 지향 보조축 | 역할 |
|------|------|-------|-----------|-------------|------|
| d1_0 | 달빛고양이 | 달빛 빛나며 이동 | **brightness** | temperature | 밝기 특화 속공형 |
| d1_1 | 그늘고양이 | 그림자 치유 | **sound** | humidity | 소리+습도 치유형 |

### 19. coral_seahorse (종 주축: humidity|brightness)

| form | 이름 | 컨셉 | 지향 주축 | 지향 보조축 | 역할 |
|------|------|-------|-----------|-------------|------|
| d1_0 | 온도해마 | 몸색 온도 매혹 | **temperature** | brightness | 온도+밝기 매혹형 |
| d1_1 | 치유해마 | 따뜻한 물 치유 | **humidity** | temperature | 습도+온도 치유형 |

### 20. wind_serpent (종 주축: sound|temperature)

| form | 이름 | 컨셉 | 지향 주축 | 지향 보조축 | 역할 |
|------|------|-------|-----------|-------------|------|
| d1_0 | 산들뱀 | 부드러운 바람 소리 | **sound** | humidity | 소리 특화 서포트형 |
| d1_1 | 바람방패 | 바람 장벽 보호 | **temperature** | sound | 온도+소리 방어형 |
| d1_2 | 번개뱀 | 빠른 압박 | **brightness** | temperature | 밝기+온도 공격형 |

### 21. swamp_leech (종 주축: brightness|smell)

| form | 이름 | 컨셉 | 지향 주축 | 지향 보조축 | 역할 |
|------|------|-------|-----------|-------------|------|
| d1_0 | 약초거머리 | 치유 약초 | **smell** | humidity | 냄새+습도 치유형 |
| d1_1 | 철갑거머리 | 단단한 방어 | **brightness** | temperature | 밝기+온도 방어형 |
| d1_2 | 흡수거머리 | 에너지 흡수 공격 | **humidity** | smell | 습도 특화 공격형 |

### 22. thunder_eel (종 주축: humidity|temperature)

| form | 이름 | 컨셉 | 지향 주축 | 지향 보조축 | 역할 |
|------|------|-------|-----------|-------------|------|
| d1_0 | 불꽃장어 | 따뜻한 빛 | **brightness** | temperature | 밝기+온도 공격형 |
| d1_1 | 전기뱀장어 | 전기 충격 | **sound** | temperature | 소리+온도 공격형 |
| d1_2 | 치유장어 | 약한 전류 치유 | **humidity** | smell | 습도+냄새 치유형 |

### 23. smoke_weasel (종 주축: smell|temperature)

| form | 이름 | 컨셉 | 지향 주축 | 지향 보조축 | 역할 |
|------|------|-------|-----------|-------------|------|
| d1_0 | 안개족제비 | 안개 숨김 | **humidity** | brightness | 습도+밝기 은신형 |
| d1_1 | 그림자족제비 | 그림자 혼란 | **brightness** | sound | 밝기+소리 교란형 |

### 24. moss_golem (종 주축: smell|humidity)

| form | 이름 | 컨셉 | 지향 주축 | 지향 보조축 | 역할 |
|------|------|-------|-----------|-------------|------|
| d1_0 | 숲골렘 | 새싹 수호 | **smell** | brightness | 냄새+밝기 방어형 |
| d1_1 | 울림골렘 | 소리 자극 | **sound** | temperature | 소리+온도 공격형 |
| d1_2 | 치유골렘 | 약효 치유 | **humidity** | smell | 습도+냄새 치유형 |
| d1_3 | 지진골렘 | 지면 흔들기 | **temperature** | sound | 온도+소리 제압형 |

---

## 스킬 테이블 차별화 규칙

각 d1 변형의 3개 스킬 슬롯에 대해:

1. **s1 (capture_core)**: 지향 주축에 가장 큰 delta 집중. 보조축에 약간.
2. **s2 (route_bridge)**: 지향 보조축 중심으로 다음 루트 연결.
3. **s3 (mechanic_core)**: 메커닉과 지향 주축의 결합.

### delta 총합 보존 규칙

- 스킬별 절대값 delta 총합은 기존 값의 ±1 범위 내 유지
- 지향 주축 delta = 기존 최대 delta의 100~120%
- 비지향 축 delta = 기존 값의 0~50%로 감소
- affected_axis_count는 d1에서 2~3, d2에서 1~2

### d2 계승 규칙

- d2의 지향축 = 부모 d1의 지향 주축 (그대로 또는 더 극단적)
- d2의 axis_secondary = 빈 문자열 (순수 단축)
- d2의 affected_axis_count = 1
- d2 간 차이: 같은 부모라도 delta 패턴이 약간 다름 (예: raise vs lower)

---

## 5축 레인지 차별화 규칙

monster-5axis-ranges.csv의 target/tolerance도 d1별로 다르게:

1. 지향 주축: tolerance 감소 (더 까다로움), target을 극단값 쪽으로 이동
2. 지향 보조축: 현재와 비슷하게 유지
3. 비지향 축: tolerance 증가 (더 관대), target을 중앙(0) 쪽으로 이동
4. dominant_axes 컬럼: d1마다 다르게 설정

### provide 값 차별화

- 지향 주축의 provide 값 증가
- 비지향 축의 provide 값 감소
