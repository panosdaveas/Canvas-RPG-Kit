import './style.css'
import {Vector2} from "./src/Vector2.js";
import {GameLoop} from "./src/GameLoop.js";
import {Main} from "./src/objects/Main/Main.js";
import { WorldLevel } from './src/levels/WorldLevel.js';
import {resources} from './src/Resource.js';

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
  mainScene.setLevel(new WorldLevel())

  // Establish update and draw loops
  const update = (delta) => {
    mainScene.stepEntry(delta, mainScene);
    mainScene.input?.update();
  };

  const draw = () => {
    // Clear anything stale
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Disable image smoothing for crisp pixel art (with vendor prefixes)
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;

    // Draw objects in the mounted scene (camera offset handled inside)
    mainScene.drawObjects(ctx);

    // Draw HUD
    mainScene.drawHud(ctx);
  }

  // Start the game!
  const gameLoop = new GameLoop(update, draw);
  gameLoop.start();
}

startGame();
