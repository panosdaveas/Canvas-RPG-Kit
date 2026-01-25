import { Level } from "./Level.js";
import { ChunkManager } from "../../core/ChunkManager.js";
import { gameObjectFactory } from "../../core/GameObjectFactory.js";
import { events } from "../../Events.js";

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
  }

  /**
   * Initialize the level - must be called after construction
   * This is async because we need to load world metadata
   */
  async initialize() {
    await this.chunkManager.initialize();

    // Now that metadata is loaded, trigger a chunk update with current camera position
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
   * Get collision walls from all loaded chunks
   */
  getWalls() {
    return this.chunkManager.getCollisionWalls();
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
      this.chunkManager.drawForegroundLayers(ctx, true); // Draw all foreground layers
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
