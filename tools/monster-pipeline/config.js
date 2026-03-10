// ============================================================
// Monster Pipeline Configuration
// ============================================================

export const CONFIG = {
  // LM Studio (Qwen) - 텍스트 생성 + 비전 심사
  LM_STUDIO_URL: 'http://100.66.65.124:1234',
  TEXT_MODEL: 'qwen/qwen3.5-35b-a3b',
  VISION_MODEL: 'qwen/qwen3.5-35b-a3b',  // 비전 능력 포함

  // ComfyUI - 이미지 생성
  COMFYUI_URL: 'http://100.66.10.225:8188',
  WORKFLOW_PATH: '../../src/asset/pokemon.json',

  // 생성 설정
  IMAGES_PER_CONCEPT: 16,       // 컨셉당 생성할 이미지 수 (토너먼트용 2의 배수)
  DEVOLUTION_DEPTH_1_COUNT: 3,  // 퇴화1 배리에이션 수
  DEVOLUTION_DEPTH_2_COUNT: 2,  // 퇴화1당 퇴화2 배리에이션 수

  // 출력 경로
  OUTPUT_DIR: '../../src/asset/monsters',
  CANDIDATES_DIR: './candidates',
  TEMP_DIR: './temp',
};
