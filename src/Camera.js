import {GameObject} from "./GameObject.js";
import {events} from "./Events.js";
import {Vector2} from "./Vector2.js";
import {CANVAS, TILE_SIZE, CAMERA} from "./Constants.js";

export class Camera extends GameObject {
  constructor() {
    super({});

    events.on("HERO_POSITION", this, heroPosition => {
      this.centerPositionOnTarget(heroPosition)
      this.clampToMapBounds();
    })

    // Camera knows when a new level starts
    events.on("CHANGE_LEVEL", this, (newMap) => {
      this.centerPositionOnTarget(newMap.heroStartPosition)
    })
  }

  clampToMapBounds() {
    const canvasWidth = CANVAS.WIDTH;
    const canvasHeight = CANVAS.HEIGHT;
    const mapWidth = CAMERA.DEFAULT_MAP_WIDTH; 
    const mapHeight = CAMERA.DEFAULT_MAP_HEIGHT;

    // Only clamp if map is larger than canvas
    if (mapWidth > canvasWidth) {
      const minX = -(mapWidth - canvasWidth);
      const maxX = 0;
      this.position.x = Math.max(minX, Math.min(maxX, this.position.x));
    }

    if (mapHeight > canvasHeight) {
      const minY = -(mapHeight - canvasHeight);
      const maxY = 0;
      this.position.y = Math.max(minY, Math.min(maxY, this.position.y));
    }
  }

  centerPositionOnTarget(pos) {
    // Floor hero position first to eliminate fractional pixel errors
    const flooredX = Math.floor(pos.x);
    const flooredY = Math.floor(pos.y);

    const personHalf = TILE_SIZE / 2;
    const canvasWidth = CANVAS.WIDTH;
    const canvasHeight = CANVAS.HEIGHT;
    const halfWidth = -personHalf + canvasWidth / 2;
    const halfHeight = -personHalf + canvasHeight / 2;
    this.position = new Vector2(
      -flooredX + halfWidth,
      -flooredY + halfHeight,
    )
  }


}