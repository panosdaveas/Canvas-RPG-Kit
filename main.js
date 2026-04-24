import './style.css'
import {Vector2} from "./src/Vector2.js";
import {GameLoop} from "./src/GameLoop.js";
import {Main} from "./src/objects/Main/Main.js";
import { Overworld } from './src/levels/Overworld.js';
import {resources} from './src/Resource.js';
import {screenEffects} from './src/ScreenEffects.js';

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
  await resources.allLoaded();
  console.log("All resources loaded!");

  // Establish the root scene
  const mainScene = new Main({
    position: new Vector2(0,0)
  })
  window.mainScene = mainScene; // Expose for debugging
  mainScene.setLevel(new Overworld());

  // Establish update and draw loops
  const update = (delta) => {
    mainScene.stepEntry(delta, mainScene);
    mainScene.input?.update();
    screenEffects.update(delta);
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
  }

  // Start the game!
  const gameLoop = new GameLoop(update, draw);
  gameLoop.start();
}

startGame();
