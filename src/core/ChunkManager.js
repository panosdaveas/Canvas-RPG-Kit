import { TiledChunk } from "./TiledChunk.js";
import { CHUNK_SIZE, CELL_SIZE, VISIBLE_CHUNK_RADIUS } from "../Constants.js";
import { resources } from "../Resource.js";

/**
 * Manages loading and unloading of map chunks based on camera position
 * Implements smart chunk streaming for large open worlds
 */
export class ChunkManager {
  constructor(worldMetadataPath, tilesetImage) {
    this.worldMetadataPath = worldMetadataPath; // Path to world.json with chunk references
    this.tilesetImage = tilesetImage; // Shared tileset image for all chunks

    this.worldMetadata = null; // Loaded world.json data
    this.loadedChunks = new Map(); // Map of "x,y" => TiledChunk
    this.chunkLoadPromises = new Map(); // Track in-progress chunk loads

    // Initialize to null so first update always triggers chunk loading
    this.currentCameraChunk = null; // Current chunk the camera is in

    // Callbacks for spawning/removing game objects from chunk object layers
    this.onSpawnObjects = null; // Function(objects, chunkX, chunkY)
    this.onRemoveObjects = null; // Function(chunkX, chunkY)
  }

  /**
   * Initialize the chunk manager by loading world metadata
   */
  async initialize() {
    try {
      const response = await fetch(this.worldMetadataPath);
      this.worldMetadata = await response.json();
      console.log("Chunk Manager initialized with world:", this.worldMetadata);
    } catch (error) {
      console.error("Failed to load world metadata:", error);
    }
  }

  /**
   * Update chunk loading based on camera position
   * Call this every frame or when camera moves significantly
   */
  update(cameraWorldX, cameraWorldY) {
    // Don't update until world metadata is loaded
    if (!this.worldMetadata) {
      console.log("ChunkManager.update: Waiting for world metadata to load...");
      return;
    }

    // Calculate which chunk the camera is currently in
    const chunkX = Math.floor(cameraWorldX / (CHUNK_SIZE * CELL_SIZE));
    const chunkY = Math.floor(cameraWorldY / (CHUNK_SIZE * CELL_SIZE));

    // console.log(`ChunkManager.update: camera at (${cameraWorldX}, ${cameraWorldY}) = chunk (${chunkX}, ${chunkY})`);

    // Only update if camera moved to a different chunk (or first time)
    if (!this.currentCameraChunk ||
        chunkX !== this.currentCameraChunk.x ||
        chunkY !== this.currentCameraChunk.y) {
      console.log(`Chunk changed! Loading chunks around (${chunkX}, ${chunkY})`);
      this.currentCameraChunk = { x: chunkX, y: chunkY };
      this._updateLoadedChunks();
    }
  }

  /**
   * Internal: Determine which chunks should be loaded and unload distant ones
   */
  _updateLoadedChunks() {
    const { x: camX, y: camY } = this.currentCameraChunk;

    // Build set of chunks that should be loaded (within radius of camera)
    const desiredChunks = new Set();
    for (let dy = -VISIBLE_CHUNK_RADIUS; dy <= VISIBLE_CHUNK_RADIUS; dy++) {
      for (let dx = -VISIBLE_CHUNK_RADIUS; dx <= VISIBLE_CHUNK_RADIUS; dx++) {
        const chunkX = camX + dx;
        const chunkY = camY + dy;
        const key = `${chunkX},${chunkY}`;

        // Check if this chunk exists in the world metadata
        if (this._chunkExists(chunkX, chunkY)) {
          desiredChunks.add(key);

          // Load chunk if not already loaded or loading
          if (!this.loadedChunks.has(key) && !this.chunkLoadPromises.has(key)) {
            this._loadChunk(chunkX, chunkY);
          }
        }
      }
    }

    // Unload chunks that are now too far away
    for (const [key, chunk] of this.loadedChunks.entries()) {
      if (!desiredChunks.has(key)) {
        this._unloadChunk(chunk.chunkX, chunk.chunkY);
      }
    }
  }

  /**
   * Check if a chunk exists in the world metadata
   */
  _chunkExists(chunkX, chunkY) {
    if (!this.worldMetadata || !this.worldMetadata.chunks) return false;
    // World.json uses "row,column" format, so swap to "y,x"
    const key = `${chunkY},${chunkX}`;
    return key in this.worldMetadata.chunks;
  }

  /**
   * Load a chunk asynchronously
   */
  async _loadChunk(chunkX, chunkY) {
    // Internal storage key uses x,y format
    const storageKey = `${chunkX},${chunkY}`;

    // World.json uses "row,column" format, so swap to "y,x"
    const worldKey = `${chunkY},${chunkX}`;
    const chunkPath = this.worldMetadata.chunks[worldKey];

    if (!chunkPath) {
      console.warn(`No chunk data found for world key ${worldKey}`);
      return;
    }

    // Build full path (world metadata path + chunk relative path)
    const basePath = this.worldMetadataPath.substring(0, this.worldMetadataPath.lastIndexOf('/') + 1);
    const fullPath = basePath + chunkPath;

    // console.log(`Loading chunk (${chunkX},${chunkY}) from ${fullPath}`);

    // Track the load promise to avoid duplicate loads
    const loadPromise = fetch(fullPath)
      .then(response => response.json())
      .then(tiledData => {
        // Create TiledChunk instance
        const chunk = new TiledChunk(chunkX, chunkY, tiledData, this.tilesetImage);

        // Store in loaded chunks using internal x,y format
        this.loadedChunks.set(storageKey, chunk);

        // Spawn game objects from object layers
        if (this.onSpawnObjects) {
          const objects = chunk.getObjects();
          this.onSpawnObjects(objects, chunkX, chunkY);
        }

        // console.log(`Chunk (${chunkX},${chunkY}) loaded successfully`);

        // Remove from pending promises
        this.chunkLoadPromises.delete(storageKey);
      })
      .catch(error => {
        console.error(`Failed to load chunk (${chunkX},${chunkY}):`, error);
        this.chunkLoadPromises.delete(storageKey);
      });

    this.chunkLoadPromises.set(storageKey, loadPromise);
  }

  /**
   * Unload a chunk and clean up its resources
   */
  _unloadChunk(chunkX, chunkY) {
    // Use x,y format for internal storage (not row,column)
    const key = `${chunkX},${chunkY}`;
    const chunk = this.loadedChunks.get(key);

    if (!chunk) return;

    console.log(`Unloading chunk ${key}`);

    // Remove game objects spawned from this chunk
    if (this.onRemoveObjects) {
      this.onRemoveObjects(chunkX, chunkY);
    }

    // Clean up chunk resources
    chunk.destroy();

    // Remove from loaded chunks
    this.loadedChunks.delete(key);
  }

  /**
   * Draw all ground layers from loaded chunks
   */
  drawGroundLayers(ctx) {
    const loadedCount = this.loadedChunks.size;
    if (loadedCount === 0) {
      console.log("WARNING: No chunks loaded to draw!");
    }
    for (const chunk of this.loadedChunks.values()) {
      if (chunk.isLoaded) {
        chunk.drawGroundLayers(ctx);
      }
    }
  }

  /**
   * Draw all foreground layers from loaded chunks
   * includeYSort: whether to include layers with ySort=true
   */
  drawForegroundLayers(ctx, includeYSort = true) {
    for (const chunk of this.loadedChunks.values()) {
      if (chunk.isLoaded) {
        chunk.drawForegroundLayers(ctx, includeYSort);
      }
    }
  }

  /**
   * Get collision walls from all loaded chunks
   * Returns a Set of "x,y" strings representing solid grid cells
   */
  getCollisionWalls() {
    const allWalls = new Set();

    for (const chunk of this.loadedChunks.values()) {
      if (chunk.isLoaded && chunk.collisionSet) {
        for (const wall of chunk.collisionSet) {
          allWalls.add(wall);
        }
      }
    }

    return allWalls;
  }

  /**
   * Clean up all chunks
   */
  destroy() {
    for (const chunk of this.loadedChunks.values()) {
      chunk.destroy();
    }
    this.loadedChunks.clear();
    this.chunkLoadPromises.clear();
  }
}
