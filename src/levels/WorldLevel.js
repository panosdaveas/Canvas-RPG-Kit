import { ChunkedLevel } from "../objects/Level/ChunkedLevel.js";
import { resources } from "../Resource.js";
import { Vector2 } from "../Vector2.js";
import { events } from "../Events.js";
import { gridCells } from "../helpers/grid.js";
import { RoomLevel } from "./RoomLevel.js";
import { Npc } from "../objects/Npc/Npc.js";

/**
 * Example of a large open-world level using the chunk system
 * Demonstrates how to set up and use ChunkedLevel
 */
export class WorldLevel extends ChunkedLevel {
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
    });

    events.on("HERO_EXITS", this, () => {
      events.emit("CHANGE_LEVEL", new RoomLevel({ heroPosition: new Vector2(gridCells(7), gridCells(9)) }))
    })

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
