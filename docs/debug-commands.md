# Debug Console Commands

브라우저 개발자 도구 콘솔(F12)에서 사용 가능한 디버그 명령어.

## DEBUG

| 명령 | 설명 | 사용 조건 |
|------|------|-----------|
| `DEBUG.killTeam()` | 아군 전원 HP를 0으로 설정. 즉시 패배 처리 → 게임오버 흐름 테스트용 | 전투 중 |
| `DEBUG.dialog(scene)` | 다이얼로그 씬 재생. scene 생략 시 사용 가능 목록 출력 | 아무 때나 |
| `DEBUG.reset()` | localStorage 완전 초기화 + 자동 새로고침. 첫 접속 상태로 리셋 | 아무 때나 |

### dialog 씬 목록

| 씬 이름 | 내용 |
|---------|------|
| `intro` | 게임 시작 — 박사 인사 |
| `encounter` | 야생 몬스터 발견 |
| `defeat` | 전투 패배 |
| `devo` | 퇴화 연출 |
| `challenger` | 도전자 등장 |

## __BRIDGE (내부용)

play-reviewer 등 외부 도구용 상태 브릿지.

| 속성/메서드 | 설명 |
|-------------|------|
| `__BRIDGE.ready` | 게임 초기화 완료 여부 |
| `__BRIDGE.currentScreen` | 현재 화면 (`title`, `combat`, `result`, `team`, `gameover`) |
| `__BRIDGE.combat` | 현재 Combat 인스턴스 |
| `__BRIDGE.teamManager` | TeamManager 인스턴스 |
| `__BRIDGE.handleAction(allyIdx, actionIdx)` | 전투 중 스킬 사용 |
| `__BRIDGE.handleConfirm()` | 턴 확인 |
| `__BRIDGE.clickStart()` | 타이틀에서 모험 시작 |
| `__BRIDGE.clickNext()` | 현재 화면의 다음 버튼 클릭 |
