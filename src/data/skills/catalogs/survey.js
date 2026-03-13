import { defineSkill } from '../core/schema.js';

// ============================================================
// 조사(Survey) 스킬 — 적의 환경 선호를 탐색
// category: 'survey' (defend와 같은 우선도 +1)
// 사용 시 미공개 환경 축 하나의 정확한 목표값을 공개
// ============================================================

export default {
  'survey-scent': defineSkill('survey-scent', {
    name: '냄새 추적',
    category: 'survey',
    role: 'survey',
    axis: 'smell',
    priority: 1,
    power: 0,
    pp: 2,
    maxPp: 2,
    escapeRisk: 0,
    log: '주변 냄새를 분석하여 단서를 찾는다.',
    desc: '적이 선호하는 냄새/습도 환경을 하나 밝혀낸다.',
    tags: ['survey', 'smell'],
  }),
  'survey-sound': defineSkill('survey-sound', {
    name: '음향 탐색',
    category: 'survey',
    role: 'survey',
    axis: 'sound',
    priority: 1,
    power: 0,
    pp: 2,
    maxPp: 2,
    escapeRisk: 0,
    log: '소리를 내어 반응을 살핀다.',
    desc: '적이 선호하는 소리/밝기 환경을 하나 밝혀낸다.',
    tags: ['survey', 'sound'],
  }),
  'survey-warmth': defineSkill('survey-warmth', {
    name: '체온 감지',
    category: 'survey',
    role: 'survey',
    axis: 'temperature',
    priority: 1,
    power: 0,
    pp: 2,
    maxPp: 2,
    escapeRisk: 0,
    log: '체온 변화로 선호 환경을 탐색한다.',
    desc: '적이 선호하는 온도/습도 환경을 하나 밝혀낸다.',
    tags: ['survey', 'temperature'],
  }),
  'survey-gaze': defineSkill('survey-gaze', {
    name: '관찰의 눈',
    category: 'survey',
    role: 'survey',
    axis: 'behavior',
    priority: 1,
    power: 0,
    pp: 2,
    maxPp: 2,
    escapeRisk: 0,
    log: '적의 행동을 면밀히 관찰한다.',
    desc: '적이 선호하는 환경 축 하나의 정확한 값을 밝혀낸다.',
    tags: ['survey', 'behavior'],
  }),
};
