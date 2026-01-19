import { Level } from "../Level.js";
import { TiledChunk } from "../../../core/TiledChunk.js";
import { gameObjectFactory } from "../../../core/GameObjectFactory.js";
import { Vector2 } from "../../../Vector2.js";
import { events } from "../../../Events.js";
import { gridCells } from "../../../helpers/grid.js";
import { getWorldNameFromPath, getSpawnPlayerFromMap, resolveMapPath } from "../../../helpers/mapUtils.js";
import { globalState } from "../../../GlobalState.js";
import { resources } from "../../../Resource.js";
import { CANVAS, TILE_SIZE } from "../../../Constants.js";

/**
 * Mapping from tileset image filenames to preloaded resource keys.
 * Add entries here when you add new tilesets to Resource.js
 */
const TILESET_FILENAME_MAP = {
  "indoor_tileset.png": "interiorTileset",
  "Collisions.png": "collisionsTileset",
  "Overworld.png": "overworldTileset",
  // Add more mappings as needed:
  // "cave_tileset.png": "caveTileset",
};

/**
 * SimpleLevel - A lightweight level for single-map rooms/interiors.
 *
 * Unlike ChunkedLevel, this loads a single Tiled map directly without
 * the ChunkManager overhead (no world.json, no chunk radius calculations).
 *
 * Tilesets are auto-detected from the map JSON - no need to specify them.
 *
 * Usage:
 *   new SimpleLevel({
 *     mapPath: "/maps/Interior/Rooms/room_0.json",
 *     heroPosition: new Vector2(x, y)
 *   })
 */
export class SimpleLevel extends Level {
  constructor(config = {}) {
    super();

    const { mapPath } = config;

    if (!mapPath) {
      throw new Error("SimpleLevel requires a mapPath");
    }

    this.mapPath = mapPath;

    // The single TiledChunk that represents this room
    this.chunk = null;

    // Track spawned objects for cleanup
    this.spawnedObjects = [];

    // Custom game object factory
    this.gameObjectFactory = gameObjectFactory;
  }

  ready() {
    // Listen to hero exits for level transitions
    events.on("HERO_EXITS", this, async (data) => {
      const { targetMap } = data;

      if (!targetMap) {
        console.warn("Exit has no targetMap defined");
        return;
      }

      const worldName = getWorldNameFromPath(targetMap);
      console.log("Exiting to world:", worldName);

      await this._handleLevelTransition(targetMap, worldName);
    });

    // Initialize the level (load the map)
    this.initialize().then(() => {
      console.log(`SimpleLevel initialized: ${this.mapPath}`);
    });
  }

  /**
   * Load the single map file and parse it
   */
  async initialize() {
    try {
      // Fetch the map JSON directly
      const response = await fetch(this.mapPath);
      if (!response.ok) {
        throw new Error(`Failed to load map: ${this.mapPath}`);
      }
      const mapData = await response.json();

      // Auto-detect tilesets from the map JSON
      const tilesetImages = this._resolveTilesets(mapData);

      // Calculate offset to center the room on screen
      const roomWidth = mapData.width * TILE_SIZE;
      const roomHeight = mapData.height * TILE_SIZE;
      const offset = {
        x: Math.floor((CANVAS.WIDTH - roomWidth) / 2),
        y: Math.floor((CANVAS.HEIGHT - roomHeight) / 2)
      };

      // Create a TiledChunk with the centering offset
      this.chunk = new TiledChunk(0, 0, mapData, tilesetImages, offset);

      // Apply offset to hero position (hero was positioned before offset was calculated)
      this._repositionHero(offset);

      // Spawn game objects from the map (positions include offset via getObjects())
      this._spawnObjects();

    } catch (error) {
      console.error(`Error loading SimpleLevel map: ${this.mapPath}`, error);
    }
  }

  /**
   * Reposition hero with the centering offset
   */
  _repositionHero(offset) {
    const hero = this.parent?.hero;
    if (hero) {
      hero.position.x += offset.x;
      hero.position.y += offset.y;
      hero.destinationPosition.x += offset.x;
      hero.destinationPosition.y += offset.y;
      events.emit("HERO_POSITION", hero.position);
    }
  }

  /**
   * Auto-detect and resolve tilesets from the map JSON
   * Maps tileset image filenames to preloaded resource images
   */
  _resolveTilesets(mapData) {
    const tilesetImages = [];

    if (!mapData.tilesets) {
      console.warn("No tilesets found in map JSON");
      return tilesetImages;
    }

    for (const tileset of mapData.tilesets) {
      if (!tileset.image) continue;

      // Extract filename from the tileset image path
      const filename = tileset.image.split('/').pop();

      // Look up the resource key for this filename
      const resourceKey = TILESET_FILENAME_MAP[filename];

      if (resourceKey && resources.images[resourceKey]) {
        tilesetImages.push(resources.images[resourceKey]);
      } else {
        console.warn(`Unknown tileset: ${filename}. Add it to TILESET_FILENAME_MAP in SimpleLevel.js`);
      }
    }

    return tilesetImages;
  }

  /**
   * Spawn game objects from the map's object layers
   */
  _spawnObjects() {
    if (!this.chunk) return;

    const tiledObjects = this.chunk.getObjects();

    for (const tiledObject of tiledObjects) {
      const gameObject = this.gameObjectFactory.create(tiledObject);

      if (gameObject) {
        this.addChild(gameObject);
        this.spawnedObjects.push(gameObject);

        // Notify Main to add to Y-sorted list
        if (this.parent && typeof this.parent.addToYSortedObjects === 'function') {
          this.parent.addToYSortedObjects(gameObject);
        }
      }
    }

    console.log(`SimpleLevel spawned ${this.spawnedObjects.length} objects`);
  }

  /**
   * Handle transition to another level
   */
  async _handleLevelTransition(targetMap, worldName) {
    // Import Overworld dynamically to avoid circular dependency
    const { Overworld } = await import("../../../levels/Overworld.js");

    if (worldName === "Overworld") {
      // Return to overworld using saved position
      events.emit("CHANGE_LEVEL", {
        level: new Overworld(),
        heroPosition: null,
        useSavedPosition: true
      });
    } else {
      // Transitioning to another simple level - use the targetMap path directly
      const spawnData = await getSpawnPlayerFromMap(targetMap);
      const heroPosition = spawnData?.position ?? new Vector2(gridCells(5), gridCells(5));

      // Convert the relative targetMap path to absolute path
      const absoluteMapPath = resolveMapPath(targetMap);

      // Create SimpleLevel with just the map path - tilesets auto-detected
      const newLevel = new SimpleLevel({
        mapPath: absoluteMapPath
      });

      events.emit("CHANGE_LEVEL", {
        level: newLevel,
        heroPosition: heroPosition
      });
    }
  }

  /**
   * Get collision walls from the map
   */
  getWalls() {
    if (!this.chunk) return new Set();
    return this.chunk.collisionSet;
  }

  /**
   * Alias for getWalls() - for compatibility
   */
  get walls() {
    return this.getWalls();
  }

  /**
   * Draw ground layers (called by Main before game objects)
   */
  drawGroundChunks(ctx) {
    if (this.chunk && this.chunk.isLoaded) {
      this.chunk.drawGroundLayers(ctx);
    }
  }

  /**
   * Draw foreground layers (called by Main after game objects)
   */
  drawForegroundChunks(ctx) {
    if (this.chunk && this.chunk.isLoaded) {
      this.chunk.drawForegroundLayers(ctx, true);
    }
  }

  /**
   * No-op for SimpleLevel - no dynamic chunk loading needed
   */
  step(delta, root) {
    super.step(delta, root);
    // No chunk management needed for single-map levels
  }

  /**
   * Clean up when level is destroyed
   */
  destroy() {
    // Clean up chunk
    if (this.chunk) {
      this.chunk.destroy();
      this.chunk = null;
    }

    // Clean up spawned objects
    for (const obj of this.spawnedObjects) {
      events.unsubscribe(obj);

      if (this.parent && typeof this.parent.removeFromYSortedObjects === 'function') {
        this.parent.removeFromYSortedObjects(obj);
      }
    }
    this.spawnedObjects = [];

    // Unsubscribe this level from events
    events.unsubscribe(this);

    // Clear children
    this.children.forEach(child => {
      events.unsubscribe(child);
    });
    this.children = [];

    // Remove from parent
    if (this.parent) {
      this.parent.removeChild(this);
    }
  }
}
