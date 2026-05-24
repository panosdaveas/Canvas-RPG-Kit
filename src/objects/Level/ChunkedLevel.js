import { Level } from "./Level.js";
import { ChunkManager } from "../../core/ChunkManager.js";
import { gameObjectFactory } from "../../core/GameObjectFactory.js";
import { events } from "../../Events.js";
import { Rod } from "../Rod/Rod.js"
import { gridCells } from "../../helpers/grid.js";
/**
 * Level that uses chunk-based loading for large open worlds
 * Extends the base Level class with ChunkManager integration
 */
export class ChunkedLevel extends Level {
  constructor(worldMetadataPath, tilesetImages, params = {}) {
    super();

    // Normalize tilesetImages to always be an array
    const images = Array.isArray(tilesetImages) ? tilesetImages : [tilesetImages];

    // Initialize ChunkManager with array of tileset images
    this.chunkManager = new ChunkManager(worldMetadataPath, images);

    // Track spawned objects by chunk
    this.spawnedObjectsByChunk = new Map(); // Map of "x,y" => GameObject[]

    // Setup chunk callbacks
    this.chunkManager.onSpawnObjects = this._onSpawnChunkObjects.bind(this);
    this.chunkManager.onRemoveObjects = this._onRemoveChunkObjects.bind(this);

    // Current camera position (updated from HERO_POSITION events)
    this.cameraPosition = { x: 0, y: 0 };

    // Custom game object factory (can be overridden in subclass)
    this.gameObjectFactory = params.gameObjectFactory || gameObjectFactory;

    // Cached union of all loaded chunks' collision sets, lazy-rebuilt only
    // when a chunk loads or unloads (flagged via _wallsCacheValid).
    this._wallsCache = new Set();
    this._wallsCacheValid = false;

    // Cached, pre-sorted union of all loaded chunks' ySort tile drawables.
    // Same lazy + invalidate pattern as walls. Main two-pointer-merges this
    // into _mergedYSort on dirty.
    this._ySortDrawablesCache = [];
    this._ySortDrawablesValid = false;
  }

  get walls() {
    if (!this._wallsCacheValid) {
      this._wallsCache.clear();
      for (const chunk of this.chunkManager.loadedChunks.values()) {
        if (chunk.isLoaded && chunk.collisionSet) {
          for (const w of chunk.collisionSet) this._wallsCache.add(w);
        }
      }
      this._wallsCacheValid = true;
    }
    return this._wallsCache;
  }

  get ySortDrawables() {
    if (!this._ySortDrawablesValid) {
      this._ySortDrawablesCache.length = 0;
      for (const chunk of this.chunkManager.loadedChunks.values()) {
        if (chunk.isLoaded && chunk.ySortDrawables.length) {
          for (const d of chunk.ySortDrawables) this._ySortDrawablesCache.push(d);
        }
      }
      // Pre-sort by worldY so Main can two-pointer merge with _sortedObjects.
      this._ySortDrawablesCache.sort((a, b) => a.worldY - b.worldY);
      this._ySortDrawablesValid = true;
    }
    return this._ySortDrawablesCache;
  }

  /**
   * Initialize the level - must be called after construction
   * This is async because we need to load world metadata
   */
  async initialize() {
    if (this._initialized) return;
    this._initialized = true;
    await this.chunkManager.initialize();
    this.chunkManager.update(this.cameraPosition.x, this.cameraPosition.y);
  }

  /**
   * Called when ChunkManager loads a new chunk
   */
  _onSpawnChunkObjects(tiledObjects, chunkX, chunkY) {
    const key = `${chunkX},${chunkY}`;
    const spawnedObjects = [];

    for (const tiledObject of tiledObjects) {
      // Use factory to create game object from Tiled data
      const gameObject = this.gameObjectFactory.create(tiledObject);

      if (gameObject) {
        // Add to level as a child
        this.addChild(gameObject);
        spawnedObjects.push(gameObject);

        // Notify Main to add to Y-sorted list
        if (this.parent && typeof this.parent.addToYSortedObjects === 'function') {
          this.parent.addToYSortedObjects(gameObject);
        }
      }
    }

    // Track spawned objects for this chunk
    this.spawnedObjectsByChunk.set(key, spawnedObjects);

    // Chunk walls just loaded — next walls access will rebuild the cache.
    this._wallsCacheValid = false;
    // New ySort tiles entered the world — invalidate aggregate cache AND ask
    // Main to rebuild the merged sort so the new chunk's tiles join the depth
    // pass on the next frame.
    this._ySortDrawablesValid = false;
    events.emit("YSORT_DIRTY");

    console.log(`Spawned ${spawnedObjects.length} objects for chunk ${key}`);
  }

  /**
   * Helper: Get a property value from Tiled object
   */
  _getProperty(tiledObject, propertyName) {
    if (!tiledObject.properties) return null;
    const prop = tiledObject.properties.find(p => p.name === propertyName);
    return prop ? prop.value : null;
  }

  /**
   * Called when ChunkManager unloads a chunk
   */
  _onRemoveChunkObjects(chunkX, chunkY) {
    const key = `${chunkX},${chunkY}`;
    const spawnedObjects = this.spawnedObjectsByChunk.get(key);

    if (!spawnedObjects) return;

    // Remove all game objects spawned from this chunk
    for (const gameObject of spawnedObjects) {
      // Unsubscribe from events
      events.unsubscribe(gameObject);

      // Notify Main to remove from Y-sorted list
      if (this.parent && typeof this.parent.removeFromYSortedObjects === 'function') {
        this.parent.removeFromYSortedObjects(gameObject);
      }

      // Remove from children
      this.children = this.children.filter(child => child !== gameObject);
    }

    // Clear the tracking
    this.spawnedObjectsByChunk.delete(key);

    // Chunk walls gone — invalidate the cache.
    this._wallsCacheValid = false;
    // ySort tiles from this chunk are gone too — invalidate aggregate cache
    // AND ask Main to rebuild the merged sort so stale refs drop out.
    this._ySortDrawablesValid = false;
    events.emit("YSORT_DIRTY");

    console.log(`Removed ${spawnedObjects.length} objects for chunk ${key}`);
  }

  /**
   * Update chunk loading based on camera position
   */
  step(delta, root) {
    super.step(delta, root);

    // Update chunk manager with current camera position
    // (Camera position should be updated via HERO_POSITION events or similar)
    this.chunkManager.update(this.cameraPosition.x, this.cameraPosition.y);
  }

  /**
   * Update camera position (typically called from HERO_POSITION event)
   */
  updateCameraPosition(x, y) {
    this.cameraPosition = { x, y };
  }

  /**
   * Look up elevation (in pixels) for a tile at world coords.
   * Returns 0 if no elevation data is registered there.
   */
  getElevationAt(worldX, worldY) {
    return this.chunkManager.getElevationAt(worldX, worldY);
  }

  /**
   * Draw ground layers before other objects
   */
  drawBackground(ctx, x, y) {
    // Draw any custom background (sky, etc.)
    if (this.background) {
      // this.background.drawImage(ctx, x, y);
    }

    // Draw ground tile layers from all loaded chunks
    this.chunkManager.drawGroundLayers(ctx);
  }

  /**
   * Draw foreground layers after other objects
   * Note: Layers with ySort=true will be drawn with Y-sorted game objects
   */
  drawForeground(ctx, x, y) {
    // Draw foreground layers (excluding Y-sort layers)
    this.chunkManager.drawForegroundLayers(ctx, false);
  }

  /**
   * Draw ground chunk layers (called by Main before game objects)
   * Camera transform is already applied by main.js
   */
  drawGroundChunks(ctx) {
    if (this.chunkManager) {
      this.chunkManager.drawGroundLayers(ctx);
    }
  }

  /**
   * Draw foreground chunk layers (called by Main after game objects)
   * Camera transform is already applied by main.js
   */
  drawForegroundChunks(ctx) {
    if (this.chunkManager) {
      // ySort foreground layers are drawn by Main in the merged depth pass;
      // here we only draw the always-on-top ones.
      this.chunkManager.drawForegroundLayers(ctx, false);
    }
  }

  /**
   * Clean up when level is destroyed
   */
  destroy() {
    // Clean up chunk manager
    if (this.chunkManager) {
      this.chunkManager.destroy();
    }

    // Clean up spawned objects and unsubscribe from events
    for (const [key, objects] of this.spawnedObjectsByChunk.entries()) {
      for (const obj of objects) {
        events.unsubscribe(obj);
      }
    }
    this.spawnedObjectsByChunk.clear();

    // Unsubscribe this level from all events
    events.unsubscribe(this);

    // Destroy all children and remove this level from parent
    // This ensures proper cleanup in the GameObject tree
    this.children.forEach(child => {
      events.unsubscribe(child);
    });
    this.children = [];

    // Remove from parent's children array
    if (this.parent) {
      this.parent.removeChild(this);
    }
  }
}
