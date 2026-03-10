#!/usr/bin/env node
// ============================================================
// Pipeline Watchdog — pipeline.js 자동 재시작
// ============================================================
//
// pipeline.js가 hang(exit 99)이나 에러로 종료되면 자동 재시작합니다.
// pipeline.js 내부에 로그 기반 silence 감지가 있어서,
// N초간 로그 출력이 없으면 exit 99로 자체 종료합니다.
// watchdog은 이를 감지하고 재실행합니다.
//
// 사용법:
//   node watchdog.js                  # pipeline.js 자동 감시
//   node watchdog.js --skip-review    # pipeline에 전달
//   node watchdog.js --silence 300    # pipeline에 전달
// ============================================================

import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROGRESS_FILE = resolve(__dirname, 'progress.json');

// pipeline.js에 전달할 인수 (watchdog 자체 인수 제외)
const pipelineArgs = process.argv.slice(2);
const isFreeMode = pipelineArgs.includes('--free');

function log(msg) {
  const ts = new Date().toISOString().substring(11, 19);
  console.log(`[${ts}][Watchdog] ${msg}`);
}

async function getTotalRoster() {
  const { readdir } = await import('fs/promises');
  const files = (await readdir(resolve(__dirname, 'roster'))).filter(f => f.endsWith('.json'));
  return files.length;
}

async function getProgress() {
  try { return JSON.parse(await readFile(PROGRESS_FILE, 'utf-8')); }
  catch { return { lastCompleted: 0, completed: [], failed: [] }; }
}

function runPipeline() {
  return new Promise((res) => {
    const child = spawn('node', [resolve(__dirname, 'pipeline.js'), ...pipelineArgs], {
      cwd: resolve(__dirname, '../..'),
      stdio: 'inherit',
    });
    child.on('close', (code) => res(code));
    child.on('error', (err) => { log(`spawn 에러: ${err.message}`); res(1); });
  });
}

async function main() {
  if (isFreeMode) {
    // ── 자율 주제 모드: --count만큼 반복, hang/에러 시 재시작 ──
    log(`Watchdog 시작 — FREE MODE (args: ${pipelineArgs.join(' ')})`);

    let round = 0;
    while (true) {
      round++;
      log(`[Free] pipeline.js 실행 (round ${round})`);
      const code = await runPipeline();

      if (code === 0) {
        // 정상 종료 — --count만큼 완료
        log(`[Free] round ${round} 정상 종료.`);
        break;
      } else if (code === 99) {
        log('[Free] hang 감지 (exit 99) — 3초 후 재시작...');
        await new Promise(r => setTimeout(r, 3000));
      } else {
        log(`[Free] 에러 종료 (code: ${code}) — 5초 후 재시작...`);
        await new Promise(r => setTimeout(r, 5000));
      }
    }

    log(`[Free] 자율 주제 watchdog 완료 (${round} rounds)`);
    return;
  }

  // ── roster 모드 (기존) ──
  const totalRoster = await getTotalRoster();
  log(`Watchdog 시작 (roster: ${totalRoster}종, args: ${pipelineArgs.join(' ') || 'none'})`);

  while (true) {
    const progress = await getProgress();
    if ((progress.completed?.length || 0) >= totalRoster) {
      log(`모든 roster 완료! (${totalRoster}/${totalRoster})`);
      break;
    }

    log(`pipeline.js 실행 (완료: ${progress.completed?.length || 0}/${totalRoster}, 다음: #${progress.lastCompleted + 1})`);
    const code = await runPipeline();

    if (code === 0) {
      // 정상 종료 — 모두 완료했거나 처리할 것 없음
      const newProgress = await getProgress();
      if ((newProgress.completed?.length || 0) >= totalRoster) {
        log('모든 roster 완료!');
        break;
      }
      log('pipeline 정상 종료, 진행 확인 후 계속...');
    } else if (code === 99) {
      log('hang 감지 (exit 99) — 3초 후 재시작...');
      await new Promise(r => setTimeout(r, 3000));
    } else {
      log(`에러 종료 (code: ${code}) — 5초 후 재시작...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  const final = await getProgress();
  log(`완료! 완료: ${final.completed?.length || 0}/${totalRoster}, 실패: ${final.failed?.length || 0}종`);
}

main().catch(err => {
  log(`치명적 에러: ${err.message}`);
  process.exit(1);
});
