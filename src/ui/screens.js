// ============================================================
// Pixi Screen Manager
// ============================================================

let _app = null;
const screens = {};
let currentScreen = null;

export function initScreens(app) {
  _app = app;
}

export function getApp() {
  return _app;
}

export function addScreen(name, container) {
  container.visible = false;
  _app.stage.addChild(container);
  screens[name] = container;
}

export function showScreen(name) {
  if (currentScreen) currentScreen.visible = false;
  currentScreen = screens[name];
  if (currentScreen) currentScreen.visible = true;
}

export function getScreen(name) {
  return screens[name];
}
