const app = new PIXI.Application();

async function init() {
  await app.init({
    resizeTo: window,
    background: "#1a1a2e",
  });
  document.body.appendChild(app.canvas);

  const text = new PIXI.Text({
    text: "Devolution Idle Game",
    style: {
      fontFamily: "Arial",
      fontSize: 32,
      fill: "#e0e0e0",
      align: "center",
    },
  });
  text.anchor.set(0.5);
  text.x = app.screen.width / 2;
  text.y = app.screen.height / 2;
  app.stage.addChild(text);
}

init();
