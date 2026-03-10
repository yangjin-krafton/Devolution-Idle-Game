#!/usr/bin/env node
// ============================================================
// Play Reviewer Agent
// Puppeteer로 게임을 실행하고, Qwen Vision이 화면을 보며 플레이 후 리뷰
// ============================================================

import puppeteer from 'puppeteer';
import { mkdir, writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { CONFIG } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotDir = resolve(__dirname, CONFIG.SCREENSHOT_DIR);
const reportDir = resolve(__dirname, CONFIG.OUTPUT_DIR);

// ============================================================
// Qwen Vision API
// ============================================================
async function callVision(messages, { temperature = 0.7, maxTokens = 4096 } = {}) {
  const res = await fetch(`${CONFIG.LM_STUDIO_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CONFIG.MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) throw new Error(`Vision API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

function cleanThinkTags(text) {
  return text
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/<\/?think>/g, '')
    .replace(/<\/?no_think>/g, '')
    .trim();
}

// ============================================================
// Game Bridge — 브라우저에 주입
// ============================================================
const BRIDGE_SCRIPT = `
  // main.js IIFE 내부 변수를 노출하기 위한 패치
  // main.js에서 window.__BRIDGE에 등록하면 여기서 사용
  window.__BRIDGE_READY = false;
`;

// main.js에 최소 침습 훅을 추가하는 대신,
// Puppeteer에서 게임 모듈을 직접 import하여 상태를 읽는 방식 사용
// → 실제로는 window 전역에 노출된 bridge 사용

async function injectBridge(page) {
  // 게임이 window.__BRIDGE를 노출할 때까지 대기
  console.log('[Bridge] 브릿지 대기 중...');
  try {
    await page.waitForFunction(() => window.__BRIDGE && window.__BRIDGE.ready, {
      timeout: 30000,
      polling: 500,
    });
    console.log('[Bridge] 게임 브릿지 연결 완료');
  } catch (e) {
    // 디버그: 현재 window 상태 확인
    const debugInfo = await page.evaluate(() => ({
      hasBridge: !!window.__BRIDGE,
      bridgeReady: window.__BRIDGE?.ready,
      hasPixi: !!window.PIXI,
      title: document.title,
      errors: window.__errors || [],
    }));
    console.error('[Bridge] 연결 실패. 디버그 정보:', JSON.stringify(debugInfo, null, 2));
    throw e;
  }
}

// ============================================================
// 게임 상태 조회
// ============================================================
async function getGameState(page) {
  return page.evaluate(() => {
    const b = window.__BRIDGE;
    if (!b || !b.ready) return { screen: 'unknown', ready: false };

    const state = {
      screen: b.currentScreen,
      ready: true,
    };

    if (b.combat && b.currentScreen === 'combat') {
      const r = b.combat.getResult();
      state.combat = {
        state: r.state,
        turn: r.turn,
        tamingPercent: r.tamingPercent,
        escapePercent: r.escapePercent,
        pendingSlots: r.pendingSlots,
        selectedActions: r.selectedActions,
        canBond: r.canBond,
        emotion: r.emotion,
        logs: r.logs.slice(-5), // 최근 5개 로그만
        enemy: {
          name: b.combat.enemy.name,
          sensoryType: b.combat.enemy.sensoryType,
          personality: b.combat.enemy.personality,
          attackPower: b.combat.enemy.attackPower,
        },
        allies: b.combat.team.map((a, i) => ({
          index: i,
          name: a.name,
          hp: a.hp,
          maxHp: a.maxHp,
          inEgg: a.inEgg || false,
          actions: a.actions.map((act, j) => ({
            index: j,
            name: act.name,
            category: act.category,
            axis: act.axis || null,
            power: act.power,
            pp: act.pp,
            maxPp: act.maxPp,
            escapeRisk: act.escapeRisk || 0,
            selected: r.selectedActions[i] === j,
            preview: b.combat.previewAction(a, act),
          })),
        })),
      };
    }

    return state;
  });
}

// ============================================================
// 게임 액션 실행
// ============================================================
async function executeAction(page, allyIndex, actionIndex) {
  return page.evaluate((ai, aci) => {
    const b = window.__BRIDGE;
    if (!b || !b.combat) return false;
    b.handleAction(ai, aci);
    return true;
  }, allyIndex, actionIndex);
}

async function confirmTurn(page) {
  return page.evaluate(() => {
    const b = window.__BRIDGE;
    if (!b) return false;
    b.handleConfirm();
    return true;
  });
}

async function clickStart(page) {
  return page.evaluate(() => {
    const b = window.__BRIDGE;
    if (!b) return false;
    b.clickStart();
    return true;
  });
}

async function clickNext(page) {
  return page.evaluate(() => {
    const b = window.__BRIDGE;
    if (!b) return false;
    b.clickNext();
    return true;
  });
}

// ============================================================
// 스크린샷 캡처
// ============================================================
let screenshotCount = 0;

async function captureScreenshot(page, label) {
  screenshotCount++;
  const filename = `${String(screenshotCount).padStart(3, '0')}_${label}.png`;
  const filepath = resolve(screenshotDir, filename);
  await page.screenshot({ path: filepath, type: 'png' });
  return filepath;
}

async function screenshotToBase64(page) {
  const buffer = await page.screenshot({ type: 'png', encoding: 'binary' });
  return Buffer.from(buffer).toString('base64');
}

// ============================================================
// AI 턴 결정 — Qwen Vision
// ============================================================
async function decideActions(page, gameState, battleLog) {
  const screenshotB64 = await screenshotToBase64(page);
  const combat = gameState.combat;

  // 구조화된 게임 상태 텍스트
  const stateText = `
## 현재 전투 상태 (턴 ${combat.turn})
- 적: ${combat.enemy.name} (성격: ${combat.enemy.personality}, 감각: ${combat.enemy.sensoryType})
- 순화 게이지: ${combat.tamingPercent}%
- 도주 게이지: ${combat.escapePercent}%
- 감정: ${combat.emotion ? `${combat.emotion.type} (${combat.emotion.turnsLeft}턴 남음)` : '없음'}
- 최근 로그: ${combat.logs.join(' / ')}

## 아군 상태 & 선택 가능한 행동
${combat.allies.filter(a => a.hp > 0 && !a.inEgg).map(a => `
### [슬롯 ${a.index}] ${a.name} (HP: ${a.hp}/${a.maxHp})
${a.actions.map(act => `  - [${act.index}] ${act.name} (${act.category}${act.axis ? '/' + act.axis : ''}) PP:${act.pp}/${act.maxPp} 위력:${act.power}${act.escapeRisk ? ' 도주위험:' + act.escapeRisk : ''}${act.pp <= 0 ? ' ⛔PP없음' : ''}`).join('\n')}
`).join('')}

선택 대기 슬롯: [${combat.pendingSlots.join(', ')}]
`;

  const prompt = `/no_think
You are playing a monster taming game. Pick actions for each ally.

Goal: Raise taming gauge, manage escape gauge, capture when taming is high enough (70%+).
Sensory chain: sound→behavior→smell→temperature (super effective in this order).

${stateText}

Reply with ONLY valid JSON, nothing else:
{"actions":[{"ally":0,"action":0}],"reasoning":"brief reason"}

Pending slots: [${combat.pendingSlots.join(',')}]. Only pick from these slots. Skip PP=0 actions.`;

  const content = [
    { type: 'text', text: prompt },
    { type: 'image_url', image_url: { url: `data:image/png;base64,${screenshotB64}` } },
  ];

  const raw = await callVision([{ role: 'user', content }], { temperature: 0.3, maxTokens: 512 });
  const cleaned = cleanThinkTags(raw);

  // JSON 추출 — 여러 패턴 시도
  const jsonPatterns = [
    /\{[\s\S]*"actions"\s*:\s*\[[\s\S]*?\]\s*[\s\S]*?\}/,
    /\{[\s\S]*\}/,
  ];

  for (const pattern of jsonPatterns) {
    const jsonMatch = cleaned.match(pattern);
    if (!jsonMatch) continue;
    try {
      const result = JSON.parse(jsonMatch[0]);
      if (result.actions && Array.isArray(result.actions)) {
        console.log(`  [AI] ${result.reasoning || '(판단 완료)'}`);
        return result.actions;
      }
    } catch (e) { continue; }
  }

  console.log(`  [AI] 파싱 실패, 폴백 사용: ${cleaned.substring(0, 100)}`);
  return fallbackActions(combat);
}

// AI 실패 시 간단한 휴리스틱 폴백
function fallbackActions(combat) {
  const actions = [];
  for (const slotIdx of combat.pendingSlots) {
    const ally = combat.allies.find(a => a.index === slotIdx);
    if (!ally) continue;

    // PP 있는 첫 번째 행동 선택
    const available = ally.actions.filter(a => a.pp > 0);
    if (available.length > 0) {
      // 순화 70% 이상이면 포획 시도, 아니면 자극 우선
      let pick;
      if (combat.tamingPercent >= 70) {
        pick = available.find(a => a.category === 'capture') || available[0];
      } else {
        pick = available.find(a => a.category === 'stimulate') || available[0];
      }
      actions.push({ ally: slotIdx, action: pick.index });
    }
  }
  return actions;
}

// ============================================================
// 전투 플레이 루프
// ============================================================
async function playBattle(page, battleNum, playLog) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`[전투 ${battleNum}] 시작`);
  console.log(`${'='.repeat(50)}`);

  await sleep(CONFIG.SCREENSHOT_DELAY);
  await captureScreenshot(page, `battle${battleNum}_start`);

  const battleEntry = {
    battleNum,
    turns: [],
    result: null,
    screenshots: [],
  };

  for (let turn = 0; turn < CONFIG.MAX_TURNS_PER_BATTLE; turn++) {
    const state = await getGameState(page);

    // 전투가 아닌 화면이면 종료
    if (state.screen !== 'combat' || !state.combat || state.combat.state !== 'active') {
      break;
    }

    // 선택 대기 슬롯이 없으면 이미 선택 완료 → 혹시 모를 상태
    if (state.combat.pendingSlots.length === 0) {
      break;
    }

    console.log(`\n  [턴 ${state.combat.turn + 1}] 순화:${state.combat.tamingPercent}% 도주:${state.combat.escapePercent}%`);

    // AI 결정
    const actions = await decideActions(page, state, playLog);

    // 액션 실행
    for (const { ally, action } of actions) {
      await executeAction(page, ally, action);
      await sleep(100);
    }

    // 턴 확정
    await sleep(200);
    await confirmTurn(page);

    await sleep(CONFIG.TURN_DELAY);

    // 턴 후 스크린샷
    const ssPath = await captureScreenshot(page, `battle${battleNum}_turn${turn + 1}`);

    // 턴 결과 기록
    const afterState = await getGameState(page);
    const combatAfter = afterState.combat;
    battleEntry.turns.push({
      turn: turn + 1,
      actions: actions.map(a => `슬롯${a.ally}→행동${a.action}`).join(', '),
      tamingAfter: combatAfter?.tamingPercent ?? '—',
      escapeAfter: combatAfter?.escapePercent ?? '—',
      combatState: combatAfter?.state || afterState.screen,
    });

    // 전투 종료 체크
    if (!combatAfter || combatAfter.state !== 'active') {
      battleEntry.result = combatAfter?.state || 'ended';
      console.log(`  [결과] ${battleEntry.result}`);
      await captureScreenshot(page, `battle${battleNum}_end_${battleEntry.result}`);
      break;
    }
  }

  if (!battleEntry.result) battleEntry.result = 'timeout';
  playLog.battles.push(battleEntry);
  return battleEntry;
}

// ============================================================
// 화면 전환 처리
// ============================================================
async function handleScreenTransition(page) {
  const state = await getGameState(page);
  const screen = state.screen;

  if (screen === 'result') {
    console.log('  [화면] 결과 → 다음 클릭');
    await sleep(500);
    await captureScreenshot(page, 'result');
    await clickNext(page);
    await sleep(1000);
    return true;
  }

  if (screen === 'team') {
    console.log('  [화면] 팀 → 다음 전투 클릭');
    await sleep(500);
    await captureScreenshot(page, 'team');
    await clickNext(page);
    await sleep(1000);
    return true;
  }

  if (screen === 'devo') {
    console.log('  [화면] 퇴화 연출 → 대기');
    await sleep(3000); // 연출 대기
    await captureScreenshot(page, 'devo');
    return true;
  }

  if (screen === 'gameover') {
    console.log('  [화면] 게임 오버');
    await captureScreenshot(page, 'gameover');
    return false; // 게임 종료
  }

  return true;
}

// ============================================================
// 최종 리뷰 생성 — Qwen Vision
// ============================================================
async function generateReview(page, playLog) {
  console.log(`\n${'='.repeat(50)}`);
  console.log('[리뷰] AI 리뷰 생성 중...');
  console.log(`${'='.repeat(50)}`);

  // 주요 스크린샷 수집 (전투 시작/종료)
  const keyScreenshots = [];
  const ssFiles = playLog.battles.flatMap((b, i) => [
    `battle${i + 1}_start`,
    `battle${i + 1}_end_${b.result}`,
  ]);

  // 최종 스크린샷 (현재 화면)
  const finalSS = await screenshotToBase64(page);

  // 플레이 요약 텍스트
  const playSummary = playLog.battles.map(b => `
### 전투 ${b.battleNum} (결과: ${b.result}, ${b.turns.length}턴)
${b.turns.map(t => `  턴${t.turn}: ${t.actions} → 순화:${t.tamingAfter}% 도주:${t.escapeAfter}%`).join('\n')}
`).join('\n');

  const wins = playLog.battles.filter(b => b.result === 'victory').length;
  const escapes = playLog.battles.filter(b => b.result === 'escaped').length;
  const defeats = playLog.battles.filter(b => b.result === 'defeat').length;

  const reviewPrompt = `당신은 프로토타입 게임을 플레이한 전문 게임 리뷰어입니다.
방금 "디볼루션 아이들 게임"을 ${playLog.battles.length}전투 플레이했습니다.

## 게임 컨셉
- 턴제 몬스터 수집 게임 (공격이 아닌 "순화"로 야생 몬스터를 길들임)
- 3마리 아군으로 1마리 적을 상대하는 3v1 전투
- 순화 게이지를 올리고 도주 게이지를 관리하며 교감(포획)을 시도
- 감각 상성 시스템: 소리→행동→냄새→온도 순환
- 포획한 몬스터는 "퇴화"하여 더 귀여운 형태로 변함

## 플레이 결과
- 총 ${playLog.battles.length}전투: 승리 ${wins}, 도주 ${escapes}, 패배 ${defeats}

## 상세 플레이 로그
${playSummary}

## 리뷰 요청
아래 항목에 대해 솔직하고 구체적인 리뷰를 작성해주세요:

1. **첫인상 & 온보딩**: 게임을 처음 봤을 때 무엇을 해야 하는지 직관적이었는가?
2. **핵심 루프의 재미**: 순화→교감 루프가 매력적인가? 턴마다 의미 있는 선택이 있었는가?
3. **긴장감과 리스크**: 도주 게이지 관리가 긴장감을 주었는가?
4. **감각 상성**: 이해하기 쉬웠는가? 전략적 깊이를 더했는가?
5. **감정 시스템**: 적 감정 변화가 플레이에 영향을 주었는가?
6. **시각적 피드백**: UI가 현재 상태를 잘 전달했는가?
7. **개선 제안**: 가장 급하게 개선해야 할 점 3가지
8. **총평**: 10점 만점 점수와 한줄 요약

한국어로 작성하되, 프로토타입 단계임을 감안하여 실질적인 피드백에 집중하세요.`;

  const content = [
    { type: 'text', text: reviewPrompt },
    { type: 'image_url', image_url: { url: `data:image/png;base64,${finalSS}` } },
  ];

  const review = await callVision(
    [{ role: 'user', content }],
    { temperature: 0.7, maxTokens: 8192 },
  );

  return cleanThinkTags(review);
}

// ============================================================
// 메인 실행
// ============================================================
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const args = process.argv.slice(2);
  const battlesToPlay = parseInt(args.find(a => a.startsWith('--battles='))?.split('=')[1]) || CONFIG.BATTLES_TO_PLAY;
  const headless = !args.includes('--show');

  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║        디볼루션 게임 플레이 리뷰어 Agent        ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  전투 수: ${battlesToPlay}                                  ║`);
  console.log(`║  모드: ${headless ? 'headless' : 'visible (--show)'}                          ║`);
  console.log(`║  모델: ${CONFIG.MODEL}               ║`);
  console.log('╚══════════════════════════════════════════════════╝');

  await mkdir(screenshotDir, { recursive: true });
  await mkdir(reportDir, { recursive: true });

  // Puppeteer 실행
  const browser = await puppeteer.launch({
    headless: headless ? 'new' : false,
    args: ['--window-size=520,900'],
    defaultViewport: { width: 480, height: 850, deviceScaleFactor: 2 },
  });

  const page = await browser.newPage();

  try {
    console.log('\n[시작] 게임 로딩...');
    await page.goto(CONFIG.GAME_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(2000);

    // 브릿지 대기
    await injectBridge(page);

    // 타이틀 스크린샷
    await captureScreenshot(page, 'title');

    // 게임 시작
    console.log('[시작] 게임 시작 클릭');
    await clickStart(page);
    await sleep(1000);

    // 플레이 로그
    const playLog = {
      startTime: new Date().toISOString(),
      battles: [],
    };

    // 전투 루프
    let battlesPlayed = 0;
    let maxLoops = battlesToPlay * 10; // 안전장치

    while (battlesPlayed < battlesToPlay && maxLoops-- > 0) {
      const state = await getGameState(page);

      if (state.screen === 'combat' && state.combat?.state === 'active') {
        await playBattle(page, battlesPlayed + 1, playLog);
        battlesPlayed++;
        await sleep(1000);
      } else {
        const canContinue = await handleScreenTransition(page);
        if (!canContinue) break;
        await sleep(500);
      }
    }

    // 리뷰 생성
    const review = await generateReview(page, playLog);

    // 리뷰 저장
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const reportPath = resolve(reportDir, `review_${timestamp}.md`);
    const reportContent = `# 디볼루션 게임 플레이 리뷰
> 생성일: ${new Date().toLocaleString('ko-KR')}
> 모델: ${CONFIG.MODEL}
> 전투 수: ${battlesPlayed}

---

${review}

---

## 플레이 데이터

${JSON.stringify(playLog, null, 2)}
`;

    await writeFile(reportPath, reportContent, 'utf-8');
    console.log(`\n[완료] 리뷰 저장: ${reportPath}`);
    console.log('\n' + '='.repeat(50));
    console.log(review);
    console.log('='.repeat(50));

  } catch (err) {
    console.error(`[에러] ${err.message}`);
    await captureScreenshot(page, 'error');
    throw err;
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
