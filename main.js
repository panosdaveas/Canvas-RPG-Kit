import './style.css'
import {Vector2} from "./src/Vector2.js";
import {GameLoop} from "./src/GameLoop.js";
import {Main} from "./src/objects/Main/Main.js";
import { Overworld } from './src/levels/Overworld.js';
import {resources} from './src/Resource.js';
import {screenEffects} from './src/ScreenEffects.js';
import {PerfHUD} from './src/PerfHUD.js';

// Grabbing the canvas to draw to
const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d", { alpha: false });

// Show loading screen
function drawLoadingScreen() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.font = "16px monospace";
  ctx.textAlign = "center";
  ctx.fillText("Loading...", canvas.width / 2, canvas.height / 2);
}

// Initialize and start game after resources are loaded
async function startGame() {
  drawLoadingScreen();

  // Wait for all images to load
  await resources.allLoaded(); //NOTE: do we need to load them all on init?
  console.log("All resources loaded!");
  window.resources = resources; // Expose for debugging
  console.log("Aseprite bundles:", resources.aseprite);

  // Establish the root scene
  const mainScene = new Main({
    position: new Vector2(0,0)
  })
  window.mainScene = mainScene; // Expose for debugging
  mainScene.setLevel(new Overworld());

  const perfHUD = new PerfHUD();

  let paused = false;

  // Establish update and draw loops
  const update = (delta) => {
    // Escape uses lastKeys from the previous frame's input.update() — correct timing
    if (mainScene.input?.getActionJustPressed("Escape")) {
      paused = !paused;
    }

    if (!paused) {
      mainScene.stepEntry(delta, mainScene);
      screenEffects.update(delta);
    }

    // Always runs last so lastKeys reflects this frame for next frame's checks
    mainScene.input?.update();
  };

  const draw = () => {
    // Clear anything stale
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    if (mainScene.camera) {
      // math floo/round to prevent sub-pixel bleeding jitter (consistent with tile rendering)
      const camX = mainScene.camera.position.x;
      const camY = mainScene.camera.position.y;
      ctx.translate(camX, camY);
    }

    // Disable image smoothing for crisp pixel art (with vendor prefixes)
    // handled in the css file
    // ctx.imageSmoothingEnabled = false;
    // ctx.webkitImageSmoothingEnabled = false;
    // ctx.mozImageSmoothingEnabled = false;
    // ctx.msImageSmoothingEnabled = false;

    // Draw objects in the mounted scene (camera offset handled inside)
    mainScene.drawObjects(ctx);

    ctx.restore();

    // Draw screen-space effects (fade, etc.) on top of everything
    screenEffects.draw(ctx);

    // Draw HUD
    mainScene.drawHud(ctx);

    if (paused) {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
      ctx.restore();
    }

    perfHUD.tick();
  }

  // Start the game!
  const gameLoop = new GameLoop(update, draw);
  gameLoop.start();
}

startGame();
