// ============================================================
// Screen Management & DOM Helpers
// ============================================================

export const $ = (id) => document.getElementById(id);

const screenMap = {
  title:    $('title-screen'),
  combat:   $('combat-screen'),
  result:   $('result-screen'),
  team:     $('team-screen'),
  devo:     $('devo-screen'),
  gameover: $('gameover-screen'),
};

export function showScreen(name) {
  Object.values(screenMap).forEach(s => s.classList.remove('active'));
  screenMap[name].classList.add('active');
}
