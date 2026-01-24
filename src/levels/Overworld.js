import { ChunkedLevel } from "../objects/Level/ChunkedLevel.js";
import { resources } from "../Resource.js";
import { Vector2 } from "../Vector2.js";
import { events } from "../Events.js";
import { gridCells } from "../helpers/grid.js";
import { SimpleLevel } from "../objects/Level/types/SimpleLevel.js";
import { Npc } from "../objects/Character/types/Npc/Npc.js";
import { getSpawnPlayerFromMap, getWorldNameFromPath, resolveMapPath } from "../helpers/mapUtils.js";
import { globalState } from "../GlobalState.js";

/**
 * Example of a large open-world level using the chunk system
 * Demonstrates how to set up and use ChunkedLevel
 */
export class Overworld extends ChunkedLevel {
  constructor(params = {}) {
    // Call ChunkedLevel constructor with world metadata path and tileset images array
    super(
      "/maps/Overworld/world.json",  // Path to world.json
      [
        resources.images.overworldTileset,   // First tileset image (index 0)
        resources.images.collisionsTileset,  // Second tileset image (index 1)
      ]
    );

    // Optional: Set up a sky background
    // this.background = new Sprite({
    //   resource: resources.images.sky,
    //   frameSize: new Vector2(320, 180)
    // });

    // Define where the hero should spawn (Main will position the hero here)
    this.heroStartPosition = params.heroPosition ?? new Vector2(gridCells(15), gridCells(14));

    // const npc1 = new Npc(gridCells(15), gridCells(16), {
    //   //content: "I am the first NPC!",
    //   content: [
    //     {
    //       string: "I just can't stand that guy.",
    //       requires: [],
    //     }
    //   ],
    //   portraitFrame: 1
    // })
    // this.addChild(npc1);
  }

  /**
   * Called once when level is ready
   */
  ready() {
    // Listen to hero position updates to track camera
    events.on("HERO_POSITION", this, pos => {
      // Update camera position so chunks load around the hero
      this.updateCameraPosition(pos.x, pos.y);
      // Track current position for saving when exiting
      this._lastHeroPosition = pos.duplicate();
    });

    events.on("HERO_EXITS", this, async (data) => {
      const { targetMap } = data;

      if (!targetMap) {
        console.warn("Exit has no targetMap defined");
        return;
      }

      // Store current overworld position for when player returns
      const facingDirection = this.parent.hero.facingDirection;
      globalState.saveOverworldPosition(this._lastHeroPosition, facingDirection);

      // Fetch the SpawnPlayer position from the target map
      const spawnData = await getSpawnPlayerFromMap(targetMap);

      let heroPosition;
      if (spawnData) {
        heroPosition = spawnData.position;
        console.log("Spawning at:", heroPosition, "facing:", spawnData.facingDirection);
      } else {
        // Fallback position if no SpawnPlayer found
        heroPosition = new Vector2(gridCells(7), gridCells(9));
        console.warn("No SpawnPlayer found, using fallback position");
      }

      // Determine which level to load based on target world
      const worldName = getWorldNameFromPath(targetMap);
      console.log("Transitioning to world:", worldName);

      // Skip if somehow targeting Overworld (shouldn't happen from within Overworld)
      if (worldName === "Overworld") {
        return;
      }

      // Convert relative targetMap path to absolute path
      const absoluteMapPath = resolveMapPath(targetMap);

      // Create SimpleLevel - tilesets are auto-detected from the map JSON
      const newLevel = new SimpleLevel({
        mapPath: absoluteMapPath
      });

      events.emit("CHANGE_LEVEL", {
        level: newLevel,
        heroPosition: heroPosition
      });
    });

    // Note: Initialize is async, so we call it in ready()
    // This loads the world metadata and initial chunks
    this.initialize().then(() => {
      console.log("WorldLevel initialized and ready!");
    });
  }

  /**
   * Override getWalls to return collision data from chunks
   */
  get walls() {
    return this.getWalls();
  }
}
