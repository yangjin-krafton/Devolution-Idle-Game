# src/ui/

UI 렌더링 모듈. DOM 조작과 화면 전환을 담당.

## 파일 구조

| 파일 | 줄수 | 역할 |
|------|------|------|
| `screens.js` | ~20 | `$()` DOM 헬퍼, `showScreen()` 화면 전환 |
| `combatUI.js` | ~180 | 전투 화면 렌더링 (적, 게이지, 로그, 아군탭, 행동버튼, VFX 트리거) |
| `teamUI.js` | ~120 | 결과/팀/퇴화/게임오버 화면 렌더링 |

## 설계 원칙

- main.js에서 콜백을 주입받아 이벤트 처리 (`setCombatCallbacks`)
- 게임 로직은 포함하지 않음 - 순수 렌더링만 담당
- effects.js의 VFX 함수를 래핑하여 올바른 DOM 타겟에 연결
- 각 파일 300줄 이하 유지

## 의존성

```
screens.js  ← combatUI.js, teamUI.js ($ 헬퍼, showScreen)
effects.js  ← combatUI.js, teamUI.js (VFX 함수)
data.js     ← combatUI.js (BONDING_ACTIONS)
```
