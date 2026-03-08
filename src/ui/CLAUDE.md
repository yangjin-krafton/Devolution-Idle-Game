# src/ui/

UI 렌더링 모듈. Pixi.js 기반 화면 렌더링.

## 파일 구조

| 파일 | 줄수 | 역할 |
|------|------|------|
| `screens.js` | ~20 | 화면 전환 관리 |
| `theme.js` | ~105 | 색상, 텍스트, UI 컴포넌트 (lbl, cuteBar, cuteBtn 등) |
| `sprites.js` | ~70 | 몬스터/알 스프라이트 텍스처 로딩 |
| `combatUI.js` | ~60 | 전투 화면 오케스트레이터 (battleFieldUI + actionPanelUI 통합) |
| `battleFieldUI.js` | ~720 | 전투 상단: 적/아군 스프라이트, 게이지 바, 탄막, 파티바, 배경 |
| `actionPanelUI.js` | ~120 | 전투 하단: 3분류 스킬 카드 목록 (자극/포획/수비) |
| `titleUI.js` | ~40 | 타이틀 화면 |
| `teamUI.js` | ~355 | 결과/팀/퇴화/게임오버 화면 |

## 설계 원칙

- main.js에서 콜백을 주입받아 이벤트 처리 (`setCombatCallbacks`)
- 게임 로직은 포함하지 않음 — 순수 렌더링만 담당
- 각 파일 300줄 이하 유지 목표 (battleFieldUI.js는 배경 코드 포함으로 예외)

## 의존성

```
theme.js    ← 모든 UI 파일
sprites.js  ← battleFieldUI, teamUI, titleUI
combatUI.js ← battleFieldUI + actionPanelUI (오케스트레이터)
```
