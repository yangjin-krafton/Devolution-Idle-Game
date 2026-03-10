// ============================================================
// Play Reviewer Configuration
// ============================================================

export const CONFIG = {
  // LM Studio (Qwen) - 비전 + 텍스트
  LM_STUDIO_URL: 'http://100.66.65.124:1234',
  MODEL: 'qwen/qwen3.5-35b-a3b',

  // 게임 서버
  GAME_URL: 'http://localhost:8090',

  // 플레이 설정
  BATTLES_TO_PLAY: 5,          // 리뷰 전 플레이할 전투 수
  SCREENSHOT_DELAY: 600,       // 스크린샷 전 대기 (ms)
  TURN_DELAY: 1200,            // 턴 간 대기 (ms)
  MAX_TURNS_PER_BATTLE: 30,    // 무한루프 방지

  // 출력
  OUTPUT_DIR: './reports',
  SCREENSHOT_DIR: './screenshots',
};
