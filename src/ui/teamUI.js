// ============================================================
// Team, Result, Devolution, GameOver Screen UI
// ============================================================

import { $ } from './screens.js';
import { playDevolutionEffect } from '../effects.js';

const ORIGINAL_NAMES = { water: '이슬요정', fire: '숯뭉이', grass: '잎사귀요정' };

// ---- Result Screen ----

export function renderResult(state, enemyName, xpLogs, devoLogs) {
  if (state === 'victory') {
    $('result-title').textContent = '교감 성립!';
    $('result-title').style.color = '#7bed9f';
    $('result-desc').textContent = `${enemyName}과(와) 교감에 성공했습니다.`;
  } else if (state === 'escaped') {
    $('result-title').textContent = '도주...';
    $('result-title').style.color = '#ffa502';
    $('result-desc').textContent = `${enemyName}이(가) 도망쳤습니다.`;
  } else if (state === 'defeat') {
    $('result-title').textContent = '전멸';
    $('result-title').style.color = '#ff6b6b';
    $('result-desc').textContent = '모든 아군이 쓰러졌습니다.';
  }

  const xpDiv = $('result-xp-logs');
  xpDiv.innerHTML = '';
  [...xpLogs, ...devoLogs].forEach(log => {
    const div = document.createElement('div');
    div.className = 'log-entry';
    if (log.includes('알 상태')) div.className += ' system';
    div.textContent = log;
    xpDiv.appendChild(div);
  });
}

// ---- Team Screen ----

export function renderTeamCards(allies, collection, getEggProgress) {
  const container = $('team-cards');
  container.innerHTML = '';

  for (const ally of allies) {
    const card = document.createElement('div');
    card.className = 'team-card' + (ally.inEgg ? ' egg' : '');

    let statusText = `HP ${ally.hp}/${ally.maxHp} | XP ${ally.xp}/${ally.xpThreshold}`;
    if (ally.inEgg) statusText = '알 상태 (퇴화 중...)';
    if (ally.devolved) statusText += ' | 퇴화 완료';

    card.innerHTML = `
      <div class="team-card-name">${ally.name}</div>
      <div class="team-card-status">${statusText}</div>
      ${ally.inEgg ? `
        <div class="egg-progress-bar">
          <div class="egg-progress-fill" data-ally-id="${ally.id}" style="width:0%"></div>
        </div>
      ` : ''}
    `;
    container.appendChild(card);
  }

  // Collection
  const collList = $('collection-list');
  collList.innerHTML = '';
  if (collection.length === 0) {
    collList.innerHTML = '<div class="collection-item">아직 수집한 몬스터가 없습니다.</div>';
  } else {
    collection.forEach(c => {
      const div = document.createElement('div');
      div.className = 'collection-item';
      div.textContent = `${c.name} - ${c.desc}`;
      collList.appendChild(div);
    });
  }

  updateEggProgress(allies, getEggProgress);
}

export function updateEggProgress(allies, getEggProgress) {
  for (const ally of allies) {
    if (ally.inEgg) {
      const fill = document.querySelector(`[data-ally-id="${ally.id}"]`);
      if (fill) {
        const progress = getEggProgress(ally.id);
        fill.style.width = (progress || 0) + '%';
      }
    }
  }
}

// ---- Devolution Reveal ----

export function renderDevoReveal(ally) {
  $('devo-old-img').src = ally._oldImg || '';
  $('devo-new-img').src = ally.img || '';
  $('devo-old-name').textContent = ORIGINAL_NAMES[ally.id] || ally.id;
  $('devo-arrow').textContent = '~ 퇴화 ~';
  $('devo-new-name').textContent = ally.name;
  $('devo-new-desc').textContent = ally.desc;

  // Trigger VFX on new image after short delay
  setTimeout(() => {
    const newImg = $('devo-new-img');
    if (newImg) playDevolutionEffect(newImg);
  }, 300);
}

// ---- Game Over ----

export function renderGameOver(battleCount, capturedCount) {
  $('gameover-stats').innerHTML = `
    전투 횟수: ${battleCount}회<br/>
    수집한 몬스터: ${capturedCount}마리<br/><br/>
    다시 도전해보세요!
  `;
}
