import { GameObject } from "../../GameObject.js";
import { Vector2 } from "../../Vector2.js";
import { Sprite } from "../../Sprite.js";
import { resources } from "../../Resource.js";
import { events } from "../../Events.js";
import { UP, DOWN, LEFT, RIGHT } from "../../Input.js";
import { isTileFree } from "../../helpers/grid.js";
import { TILE_SIZE, DEBUG_LAYERS } from "../../Constants.js";
import { Character } from "../Character/Character.js";


// TODO: projectile-vs-projectile needs a weight/priority system to decide the outcome, now we only have melle intercepts projectile

export class Projectile extends GameObject {
  constructor({ position, direction, projectileConfig, damage, spriteOffset, team }) {
    super({
      position: position.duplicate(),
    });

    this.direction = direction;
    this.speed = projectileConfig.speed ?? 2;
    this.maxRange = projectileConfig.maxRange ?? 1000;
    this.damage = damage;
    this.team = team ?? "neutral";
    this.distanceTraveled = 0;
    this.ySortBias = 0.1; // Render slightly in front of objects at same Y

    // Create sprite from projectile config
    const spriteConfig = projectileConfig.sprite;
    const offset = spriteOffset ?? { x: 0, y: 0 };
    if (spriteConfig && resources.images[spriteConfig.resource]) {
      this.sprite = new Sprite({
        resource: resources.images[spriteConfig.resource],
        frameSize: new Vector2(spriteConfig.frameSize.x, spriteConfig.frameSize.y),
        hFrames: spriteConfig.hFrames ?? 1,
        vFrames: spriteConfig.vFrames ?? 1,
        frame: 0,
        position: new Vector2(offset.x, offset.y),
      });
      this.addChild(this.sprite);

      // Set initial frame based on direction
      const animations = projectileConfig.animations;
      if (animations) {
        const animName = `fly${this.getDirectionName()}`;
        const frames = animations[animName];
        if (frames && frames.length > 0) {
          this.sprite.frame = frames[0].frame;
        }
      }
    }

    // Calculate velocity based on direction
    this.velocity = this.getVelocity();
  }

  getVelocity() {
    switch (this.direction) {
      case UP: return new Vector2(0, -this.speed);
      case DOWN: return new Vector2(0, this.speed);
      case LEFT: return new Vector2(-this.speed, 0);
      case RIGHT: return new Vector2(this.speed, 0);
      default: return new Vector2(0, 0);
    }
  }

  getDirectionName() {
    switch (this.direction) {
      case UP: return "Up";
      case DOWN: return "Down";
      case LEFT: return "Left";
      case RIGHT: return "Right";
      default: return "Down";
    }
  }

  step(delta) {
    const prevY = this.position.y;

    // Move projectile
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Track distance
    this.distanceTraveled += this.speed;

    // Trigger Y-sort if Y position changed
    if (this.position.y !== prevY) {
      events.emit("YSORT_DIRTY");
    }

    // Check collisions
    if (this.checkCollisions()) {
      return;
    }

    // Destroy if exceeded max range
    if (this.distanceTraveled >= this.maxRange) {
      this.destroyProjectile();
      return;
    }
  }

  checkCollisions() {
    const level = this.parent;
    if (!level) return false;

    // Snap position to grid for collision check
    const gridX = Math.round(this.position.x / TILE_SIZE) * TILE_SIZE;
    const gridY = Math.round(this.position.y / TILE_SIZE) * TILE_SIZE;

    const candidates = [...level.children];

    // Check walls + solid objects
    if (!isTileFree(level.walls, candidates, gridX, gridY)) {
      // If the blocking object is an enemy, deal damage
      const hitTarget = candidates.find(c => {
        if (c === this || !c.isSolid) return false;
        if (c.team === "neutral" || c.team === this.team) return false;
        const cx = c.destinationPosition?.x ?? c.position.x;
        const cy = c.destinationPosition?.y ?? c.position.y;
        return cx === gridX && cy === gridY;
      });

      if (hitTarget && typeof hitTarget.takeHit === "function") {
        hitTarget.takeHit(this.damage, this.direction);
        events.emit("PROJECTILE_HIT", {
          target: hitTarget,
          damage: this.damage,
          projectile: this,
        });
      }

      this.destroyProjectile();
      return true;
    }

    return false;
  }

  destroyProjectile() {
    // Remove from Y-sorted objects (find Main via parent chain)
    let main = this.parent?.parent;
    if (main && typeof main.removeFromYSortedObjects === 'function') {
      main.removeFromYSortedObjects(this);
    }
    this.destroy();
  }

  drawImage(ctx, x, y) {
    if (!DEBUG_LAYERS.DRAW_HITBOXES) return;

    ctx.save();

    // Draw collision box at projectile position (green)
    ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
    ctx.strokeStyle = "rgba(0, 255, 0, 1)";
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

    ctx.restore();
  }
}
