import { GameObject } from "./GameObject.js";
import { events } from "./Events.js";
import { Vector2 } from "./Vector2.js";
import { CAMERA, CANVAS, SPRITE } from "./Constants.js";

export class Camera extends GameObject {
  constructor() {
    super({});

    // Dead zone configuration
    this.deadZoneWidth = CAMERA.DEAD_ZONE_WIDTH;  // How far left/right hero can move before camera follows - change to 0 for instant follow
    this.deadZoneHeight = CAMERA.DEAD_ZONE_HEIGHT; // How far up/down hero can move before camera follows - change to 0 for instant follow

    this.currentLevel = null;
    this.frozen = false; // Set to true to freeze camera position (for debugging)
    this._centerOnNextPosition = false; // Flag to center camera on next hero position update

    events.on("HERO_POSITION", this, heroPosition => {
      // Skip camera updates if frozen
      if (this.frozen) return;

      // Center immediately after level change (instead of using dead zone)
      if (this._centerOnNextPosition) {
        this._centerOnNextPosition = false;
        this.centerPositionOnTarget(heroPosition);
        return;
      }

      // Only update camera if it's enabled for the current level
      if (this.currentLevel?.cameraEnabled !== false) {
        this.updateCameraWithDeadZone(heroPosition);
      }
    })

    // Camera knows when a new level starts
    events.on("CHANGE_LEVEL", this, (data) => {
      const { level } = data;
      this.currentLevel = level;
      // Flag to center on next HERO_POSITION (which Main.js emits after repositioning hero)
      this._centerOnNextPosition = true;
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

  updateCameraWithDeadZone(heroPosition) {
    const canvasWidth = CANVAS.WIDTH;
    const canvasHeight = CANVAS.HEIGHT;
    const personHalf = SPRITE.HERO_HALF_SIZE;

    // Calculate where hero appears on screen with current camera position
    const heroScreenX = heroPosition.x + this.position.x + personHalf;
    const heroScreenY = heroPosition.y + this.position.y + personHalf;

    // Dead zone boundaries (centered on screen)
    const deadZoneLeft = canvasWidth / 2 - this.deadZoneWidth;
    const deadZoneRight = canvasWidth / 2 + this.deadZoneWidth;
    const deadZoneTop = canvasHeight / 2 - this.deadZoneHeight;
    const deadZoneBottom = canvasHeight / 2 + this.deadZoneHeight;

    // Adjust camera if hero is outside dead zone
    if (heroScreenX < deadZoneLeft) {
      this.position.x += deadZoneLeft - heroScreenX;
    } else if (heroScreenX > deadZoneRight) {
      this.position.x -= heroScreenX - deadZoneRight;
    }

    if (heroScreenY < deadZoneTop) {
      this.position.y += deadZoneTop - heroScreenY;
    } else if (heroScreenY > deadZoneBottom) {
      this.position.y -= heroScreenY - deadZoneBottom;
    }

    this.clampToMapBounds();

    this.position.x = Math.floor(this.position.x);
    this.position.y = Math.floor(this.position.y);
  }

  centerPositionOnTarget(pos) {
    // Create a new position based on the incoming position
    const personHalf = SPRITE.HERO_HALF_SIZE;
    const canvasWidth = CANVAS.WIDTH;
    const canvasHeight = CANVAS.HEIGHT;
    const halfWidth = -personHalf + canvasWidth / 2;
    const halfHeight = -personHalf + canvasHeight / 2;
    this.position = new Vector2(
      -pos.x + halfWidth,
      -pos.y + halfHeight,
    )
  }
}
