# 2026-03-13 개발 로그 — 전투 결과창 리뉴얼

## 📋 세션 요약
- 전투 결과창을 핑크/파스텔 스타일에서 **다크/네온 메신저 피드형 카드 UI**로 전면 교체
- 미구현이었던 **xpCurve 기반 레벨업 / 스탯 성장 / 스킬 해금** 시스템을 활성화
- DEBUG 콘솔 명령으로 모든 결과창 시나리오를 즉시 테스트 가능하게 구축

---

## 🗣️ 작업 흐름

### 1. 현재 코드 파악 + 제안서 작성
- 사용자가 결과창 리뉴얼 의향을 밝히고, 기존 코드 위치를 먼저 찾아달라고 요청
- teamUI.js의 `initResult`/`renderResult` 함수를 찾아 분석 — 핑크 테마, 한 화면에 모든 정보 일괄 표시, 애니메이션 없음
- 사용자가 titleUI.js 스타일 + 포켓몬식 경험치/레벨업/스킬 흐름으로 리뉴얼 요청
- 코드베이스를 탐색하여 이미 정의되어 있지만 사용되지 않는 `xpCurve`, `skillUnlocks`, `statGrowth` 데이터를 발견
- `docs/result-screen-renewal.md` 제안서를 작성 (Phase 0~3 단계별 연출 설계)

### 2. 메신저 피드형 카드 UI로 재설계
- 사용자가 "카드형으로 위→아래 스크롤 가능한 메신저 피드처럼 구현하면 어떨까" 제안
- 제안서를 전면 수정: Phase 전환 방식 → 카드가 하나씩 쌓이는 피드 구조
- 카드 5종 정의: 배너 / XP / 레벨업 / 스킬 습득 / 퇴화 진입
- 왼쪽 accent line으로 카드 타입 구분하는 `feedCard` 컴포넌트 설계

### 3. 다크 테마 공용 컴포넌트 분리
- titleUI.js, skillCard.js, teamEditUI.js, dialogUI.js에 중복된 D 팔레트 발견 (4곳)
- `theme-dark.js` 신규 파일로 통합: D 팔레트 + darkCard + statBar + neonBadge + feedCard
- 4개 파일의 로컬 D 정의를 import로 교체

### 4. computeBattleRewards 구현
- team.js에 `computeBattleRewards()` 추가
- xpCurve 기반 레벨업 (다중 레벨업 지원), statGrowth 랜덤 성장, HP 10%/레벨 증가, skillUnlocks 체크
- maxLevel 도달 시 퇴화(알) 진입 처리
- 구조화된 결과 객체 반환 (이전 문자열 로그 방식에서 전환)

### 5. resultUI.js 구현
- 피드 레이아웃: 고정 헤더 + 스크롤 피드 영역 + 고정 하단 "계속" 버튼
- feedController: 카드 큐, 순차 등장 (슬라이드업 + 페이드인), XP 바 트윈 애니메이션
- 배경에 격자 도트 패턴, 네온 악센트 헤더/푸터

### 6. 카드 등장 방식 수정 — 자동 → 탭 기반
- 처음에는 모든 카드가 자동으로 연속 등장 → 사용자 피드백 "너무 빠르다"
- 배너만 자동, 이후 카드는 **탭할 때마다 하나씩** 등장으로 변경
- rAF 애니메이션 취소를 위한 `animGeneration` 카운터 도입
- 탭 시 현재 애니메이션만 즉시 완료 (전체 스킵 아님)

### 7. 카드 디자인 보완
- 모든 카드에 글로우 원, 장식 링, 스파클 도트, 구분선 등 장식 요소 추가
- XP 바에 샤인 하이라이트, 바 트랙 프로스트 효과
- 레벨업 카드에 미니 성장 바 (색상별), 네온 뱃지 레벨 전환
- 스킬 카드에 buildSkillCard 재활용, 알 카드에 삼중 글로우

### 8. XP 바 오버플로우 수정
- XP 바가 카드 우측을 돌파하는 문제 발견
- `barW = CARD_W - barX - 16`으로 카드 내부에 맞게 계산 변경
- XP 텍스트를 바 우측 하단에 우정렬 배치

### 9. DEBUG 결과창 테스트 명령 추가
- debug.js에 7가지 시나리오 추가: resultVictory, resultLevelUp, resultSkill, resultEgg, resultFull, resultMultiLevelUp, resultEscaped, resultDefeat
- main.js에서 `showResult` 함수를 getState로 노출
- 랜덤 아군/적 몬스터 목 데이터 사용, "계속" 시 타이틀로 복귀

### 10. 다중 레벨업 대응
- 한 번에 여러 레벨이 올라갈 때 레벨업 카드가 1장만 나오는 문제 발견
- team.js: `statChanges`/`newSkills` 단일 객체 → `levelUps[]` 배열로 분해 (레벨별)
- resultUI.js: `levelUps` 배열을 순회하며 레벨별 카드 + 스킬 카드 개별 생성
- `resultMultiLevelUp` DEBUG 명령 추가 (Lv.2→5 연속 3단계)

### 11. 카드 큐 조기 종료 버그 수정
- `buildLevelUpCard`에서 `ally.statChanges` (undefined) 참조 → TypeError 크래시
- `lv.statChanges` 사용으로 수정 (`const sc = lv.statChanges || {}`)
- try-catch로 카드 빌드 에러 방어, 콘솔 로그 추가

### 12. 피드 탭 → 즉시 화면 전환 문제 수정
- 모든 카드 출력 후 피드 영역 탭이 onNextCallback을 직접 호출하는 문제
- 피드 탭은 카드 진행만, "계속" 버튼만 다음 화면으로 이동하도록 변경
- `finishCurrentCard`의 feedY 이중 가산 버그도 `_entryDone` 플래그로 해결

### 13. 레벨업 카드 디자인 개선
- 카드 우측 절반이 비어있는 문제 지적
- 우측에 몬스터 스프라이트 + 이름 배치, 스탯 바를 카드 전체 폭으로 확장
- 값 텍스트 우정렬로 깔끔한 정렬

---

## 🎯 구현된 기능

- **theme-dark.js**: 다크/네온 테마 공용 컴포넌트 (4개 파일의 중복 코드 통합)
- **resultUI.js**: 메신저 피드형 결과창 — 카드가 탭마다 하나씩 쌓이는 스크롤 피드
- **computeBattleRewards**: xpCurve 기반 레벨업 + 스탯 성장 + 스킬 해금 + 퇴화 시스템
- **5종 카드**: 배너(승리/도주/전멸) / XP 바 / 레벨업 스탯 / 스킬 습득 / 퇴화 진입
- **다중 레벨업**: 한 번에 여러 레벨이 올라도 레벨별 개별 카드 표시
- **DEBUG 명령 8종**: 모든 결과창 시나리오를 콘솔에서 즉시 테스트

---

## 🤔 결정 사항 & 논의

- **Phase 전환 vs 피드 카드**: 처음에는 포켓몬식 전체 화면 Phase 전환으로 설계 → 사용자 제안으로 메신저 피드형으로 변경. 이전 카드를 스크롤로 다시 볼 수 있어 UX가 더 좋음
- **자동 등장 vs 탭 등장**: 초기 자동 연속 등장은 정보를 놓치기 쉬움 → 배너만 자동, 나머지는 탭으로 변경
- **피드 탭 → 계속**: 마지막 카드 후 탭으로 바로 다음 화면은 실수 유발 → "계속" 버튼만 다음 화면 진행
- **statChanges 단일 객체 vs levelUps 배열**: 다중 레벨업 시 정보 손실 방지를 위해 레벨별 분해 구조 채택

---

## 🐛 문제 & 해결

- **XP 바 카드 오버플로우**: `barW = CARD_W - 140` 고정값 → `CARD_W - barX - 16` 상대값으로 수정
- **TypeError 크래시 (ally.statChanges undefined)**: `buildLevelUpCard`가 `lv` 파라미터를 받도록 변경했지만 내부에서 여전히 `ally.statChanges` 참조 → `sc = lv.statChanges`로 수정
- **feedY 이중 가산**: entry 애니메이션 완료 후 XP 바 도중 `finishCurrentCard` 호출 시 feedY가 두 번 더해짐 → `_entryDone` 플래그로 방지
- **DEBUG 목 데이터 아군 수 부족**: 여러 DEBUG 명령에 아군이 2마리뿐 → 모든 명령을 3아군으로 통일
- **Edit 도구 반복 실패**: 파일 읽기/쓰기 도구 충돌로 Bash + Python 우회 필요했던 경우 다수

---

## 📝 다음에 할 일

- [ ] 스킬 습득 카드에 **스킬 교체 UI** 추가 (현재 3슬롯 중 교체 선택)
- [ ] 제안서 2차/3차 항목: 퇴화 조건을 maxLevel 도달로 변경, 전멸/도주 분기 연출 다듬기
- [ ] 디버그 로그 (`console.log`) 정리 (프로덕션 전 제거)
- [ ] 제안서 문서 최종 업데이트 (구현 완료 항목 체크)

---

## 💡 메모 / 인사이트

- 코드베이스에 이미 `xpCurve`, `skillUnlocks`, `statGrowth` 데이터가 전부 정의되어 있었지만 team.js에서 사용하지 않고 있었음 — 데이터만 있고 로직이 없는 "설계만 된" 상태. 결과창 리뉴얼이 이 시스템들을 활성화하는 자연스러운 계기가 됨
- D 팔레트가 4개 파일에 중복 → theme-dark.js 분리는 이번 작업의 부산물이지만 장기적으로 유지보수에 큰 도움
- 피드 카드 UI는 모바일 게임의 "알림 피드" 패턴과 유사 — 사용자가 자기 속도로 정보를 소화할 수 있어 기존 Phase 전환보다 접근성이 높음

---

**날짜**: 2026-03-13
**세션 시간**: ~3시간
