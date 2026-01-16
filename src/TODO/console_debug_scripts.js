// check if static layers are being cached and drawn correctly
for (const [key, chunk] of mainScene.level.chunkManager.loadedChunks) {
  console.log(`Chunk ${key}:`, {
    staticGround: chunk.staticGroundLayers.map(l => l.name),
    dynamicGround: chunk.groundLayers.map(l => l.name),
    staticForeground: chunk.staticForegroundLayers.map(l => l.name),
    dynamicForeground: chunk.foregroundLayers.map(l => l.name),
    hasGroundCache: !!chunk.staticGroundCanvas,
    hasForegroundCache: !!chunk.staticForegroundCanvas
  });
}

// Monitor draw calls per second
let drawCalls = 0;
const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;
CanvasRenderingContext2D.prototype.drawImage = function (...args) {
  drawCalls++;
  return originalDrawImage.apply(this, args);
};// Log every second
setInterval(() => {
  console.log(`Draw calls per second: ${drawCalls}`);
  drawCalls = 0;
}, 1000);

//caculate total memory used by cached canvases
let totalBytes = 0;
for (const chunk of mainScene.level.chunkManager.loadedChunks.values()) {
  if (chunk.staticGroundCanvas) {
    totalBytes += chunk.staticGroundCanvas.width * chunk.staticGroundCanvas.height * 4;
  }
  if (chunk.staticForegroundCanvas) {
    totalBytes += chunk.staticForegroundCanvas.width * chunk.staticForegroundCanvas.height * 4;
  }
}
console.log(`Total cached canvas memory: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);      


mainScene.camera.frozen = true || false; // Toggle to freeze/unfreeze camera for debugging

// Monitor FPS and frame time
let frames = 0;
let lastTime = performance.now();
const checkFPS = () => {
  frames++;
  const now = performance.now();
  if (now - lastTime >= 1000) {
    console.log(`FPS: ${frames}, avg frame time: ${(1000 / frames).toFixed(2)}ms`);
    frames = 0;
    lastTime = now;
  }
  requestAnimationFrame(checkFPS);
};
checkFPS();      