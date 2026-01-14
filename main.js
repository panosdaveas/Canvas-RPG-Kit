import './style.css'
import {Vector2} from "./src/Vector2.js";
import {GameLoop} from "./src/GameLoop.js";
import {Main} from "./src/objects/Main/Main.js";
import {CaveLevel1} from "./src/levels/CaveLevel1.js";
import { WorldLevel } from './src/levels/WorldLevel.js';
import {CANVAS} from './src/Constants.js';

// Grabbing the canvas to draw to
const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");

// Get the device's pixel ratio (usually 1 on desktop, 2+ on high-DPI displays)
// const dpr = window.devicePixelRatio || 1;

// Set internal canvas resolution to match device pixels
// canvas.width = CANVAS.WIDTH * dpr;
// canvas.height = CANVAS.HEIGHT * dpr;

// Scale the drawing context to compensate
// ctx.scale(dpr, dpr);

// Establish the root scene
const mainScene = new Main({
  position: new Vector2(0,0)
})
//mainScene.setLevel(new OutdoorLevel1())
// mainScene.setLevel(new CaveLevel1())
mainScene.setLevel(new WorldLevel())

// Establish update and draw loops
const update = (delta) => {
  mainScene.stepEntry(delta, mainScene);
  mainScene.input?.update();
};

const draw = () => {

  // Clear anything stale
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;

  // Draw the sky
  // mainScene.drawBackground(ctx);

  // Draw objects in the mounted scene (camera offset handled inside)
  mainScene.drawObjects(ctx);

  // Draw anything above the game world
  mainScene.drawForeground(ctx);

  mainScene.drawHud(ctx);

  // Log draw count (every ~60 frames to avoid spam)
  // if (Math.random() < 0.016) {
  //   console.log('Objects drawn this frame:', window.drawnCount);
  // }

}

// Start the game!
const gameLoop = new GameLoop(update, draw);
gameLoop.start();
