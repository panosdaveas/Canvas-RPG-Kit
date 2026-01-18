import { ChunkedLevel } from "../ChunkedLevel.js";
import { Vector2 } from "../../../Vector2.js";
import { events } from "../../../Events.js";
import { gridCells } from "../../../helpers/grid.js";
import { getWorldNameFromPath, getSpawnPlayerFromMap } from "../../../helpers/mapUtils.js";
import { globalState } from "../../../GlobalState.js";

/**
 * Generic interior/room level that can be configured for any indoor space.
 * Pass the world path and tilesets to create different rooms.
 *
 * Usage:
 *   new InteriorLevel({
 *     worldPath: "/maps/Interior/world.json",
 *     tilesets: [resources.images.interiorTileset, resources.images.collisionsTileset]
 *   })
 */
export class InteriorLevel extends ChunkedLevel {
  constructor(config = {}) {
    const {
      worldPath,
      tilesets = [],
      heroPosition = null,
      defaultSpawn = new Vector2(gridCells(7), gridCells(9))
    } = config;

    if (!worldPath) {
      throw new Error("InteriorLevel requires a worldPath");
    }

    // Call ChunkedLevel constructor with world metadata path and tileset images
    super(worldPath, tilesets);

    this.heroStartPosition = heroPosition ?? defaultSpawn;
    this.worldPath = worldPath;
  }

  ready() {
    // Listen to hero position updates to track camera
    events.on("HERO_POSITION", this, pos => {
      this.updateCameraPosition(pos.x, pos.y);
    });

    events.on("HERO_EXITS", this, async (data) => {
      const { targetMap } = data;

      if (!targetMap) {
        console.warn("Exit has no targetMap defined");
        return;
      }

      const worldName = getWorldNameFromPath(targetMap);
      console.log("Exiting to world:", worldName);

      // Dynamically handle transitions based on target world
      await this._handleLevelTransition(targetMap, worldName);
    });

    // Initialize chunks
    this.initialize().then(() => {
      console.log(`InteriorLevel initialized: ${this.worldPath}`);
    });
  }

  /**
   * Handle transition to another level
   * Override this method in subclasses for custom behavior
   */
  async _handleLevelTransition(targetMap, worldName) {
    // Import WorldLevel dynamically to avoid circular dependency
    const { Overworld: Overworld } = await import("../../../levels/Overworld.js");

    if (worldName === "Overworld") {
      // Return to overworld using saved position
      events.emit("CHANGE_LEVEL", {
        level: new Overworld(),
        heroPosition: null,
        useSavedPosition: true
      });
    } else {
      // Transitioning to another interior - fetch spawn position
      const spawnData = await getSpawnPlayerFromMap(targetMap);
      const heroPosition = spawnData?.position ?? new Vector2(gridCells(7), gridCells(9));

      // For now, create another InteriorLevel (could be extended for different level types)
      // You would need to determine the correct tilesets based on worldName
      console.log(`Transitioning to interior: ${worldName} at position:`, heroPosition);

      // Note: For room-to-room transitions, you'll need to define tileset mappings
      // This is a placeholder - extend as needed for your specific rooms
    }
  }

  get walls() {
    return this.getWalls();
  }
}
