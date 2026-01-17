import { ChunkedLevel } from "../objects/Level/ChunkedLevel.js";
import { resources } from "../Resource.js";
import { Vector2 } from "../Vector2.js";
import { events } from "../Events.js";
import { gridCells } from "../helpers/grid.js";
import { WorldLevel } from "./WorldLevel.js";

/**
 * Example of a large open-world level using the chunk system
 * Demonstrates how to set up and use ChunkedLevel
 */
export class RoomLevel extends ChunkedLevel {
    constructor(params = {}) {
        // Call ChunkedLevel constructor with world metadata path and tileset images array
        super(
            "/maps/Interior/world.json",  // Path to world.json
            [
                resources.images.interiorTileset,   // First tileset image (index 0)
                resources.images.collisionsTileset,  // Second tileset image (index 1)
            ]
        );

        this.heroStartPosition = params.heroPosition ?? new Vector2(gridCells(7), gridCells(9));

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
            events.emit("CHANGE_LEVEL", new WorldLevel({heroPosition: new Vector2(gridCells(20), gridCells(14))}))
        })

        // Note: Initialize is async, so we call it in ready()
        // This loads the world metadata and initial chunks
        this.initialize().then(() => {
            console.log("RoomLevel initialized and ready!");
        });
    }

    /**
     * Override getWalls to return collision data from chunks
     */
    get walls() {
        return this.getWalls();
    }
}
