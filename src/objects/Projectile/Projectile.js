import { GameObject } from "../../GameObject.js";
import { Vector2 } from "../../Vector2.js";
import { Sprite } from "../../Sprite.js";
import { resources } from "../../Resource.js";
import { events } from "../../Events.js";
import { UP, DOWN, LEFT, RIGHT } from "../../Input.js";
import { isTileFree, snapToGrid } from "../../helpers/grid.js";
import { DEBUG_LAYERS, TILE_SIZE } from "../../Constants.js";
import { Character } from "../Character/Character.js";
import { ParticleBurst } from "../ParticleBurst/ParticleBurst.js";


// TODO: projectile-vs-projectile needs a weight/priority system to decide the outcome, now we only have melle intercepts projectile

export class Projectile extends GameObject {
  constructor({ position, direction, projectileConfig, damage, spriteOffset, team }) {
    super({
      position: position.duplicate(),
    });

    this.direction = direction;
    this.speed = projectileConfig.speed ?? 2;
    this.maxRange = projectileConfig.maxRange ?? 128;
    this.damage = damage;
    this.team = team ?? "neutral";
    this.distanceTraveled = 0;
    // this.ySortBias = 0.1; // Render slightly in front of objects at same Y
    this.suspendOnPause = true;

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

      const shadow = new Sprite({
        resource: resources.images.shadow,
        frameSize: new Vector2(32, 32),
        position: new Vector2(-8, -12),
      });
      
      this.addChild(shadow);
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
    const prevTileY = Math.floor(this.position.y / TILE_SIZE);

    // Move projectile
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Track distance
    this.distanceTraveled += this.speed;

    // Y-sort only when crossing a tile boundary — sub-tile sorts can't reorder
    // against tile-aligned characters
    if (Math.floor(this.position.y / TILE_SIZE) !== prevTileY) {
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
    const gridX = snapToGrid(this.position.x);
    const gridY = snapToGrid(this.position.y);

    // Read-only access — no need to copy. We never mutate this list and
    // any concurrent add/remove from another callback during this scan would
    // be harmless (find returns the first match, not all).
    const candidates = level.children;

    // Check walls + solid objects
    if (!isTileFree(level.walls, candidates, gridX, gridY)) {
      // If the blocking object is an enemy, deal damage
      const hitTarget = candidates.find(c => {
        if (c === this || !c.isSolid) return false;
        // enemy cannot hit enemy:
        // if (c.team === "neutral" || c.team === this.team) return false;
        // enemy can hit enemy:
        if (c.team === "neutral" || (c.team === this.team && c.team === "player")) return false;
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

      // Resolve what actually blocked us (hitTarget is only filled when the
      // blocker was attackable). Looser scan matches ANY child at the impact
      // tile — including non-solid objects like Signs that sit on top of a
      // collision-layer tile. Null = bare wall, no game object at that tile.
      const blocker = hitTarget ?? candidates.find(c => {
        if (c === this) return false;
        const cx = c.destinationPosition?.x ?? c.position.x;
        const cy = c.destinationPosition?.y ?? c.position.y;
        return cx === gridX && cy === gridY;
      });
      console.log("projectile hit:", blocker ?? "wall", "at", gridX, gridY);

      // Cosmetic shatter: spawn a ParticleBurst from the blocker's renderable
      // sprite. `sprite` covers projectiles / rods / chests / signs etc.;
      // `body` covers Characters (Hero, NPC, Enemy).
      // const sprite = blocker?.sprite ?? blocker?.body;
      // just game objects (not characters that have a body)
      const sprite = blocker?.sprite;
      if (sprite) {
        const frameCoord = sprite.frameMap.get(sprite.frame) ?? new Vector2(0, 0);
        const burst = new ParticleBurst({
          resource: sprite.resource,
          frameCoord,
          frameSize: sprite.frameSize,
          position: blocker.position,
          drawOffset: sprite.position,
          splits: 3,
          impactDirection: this.direction,
        });
        level.addChild(burst);
        if (level.parent?.addToYSortedObjects) {
          level.parent.addToYSortedObjects(burst);
        }
        // Remove the shattered object from the level. destroy() walks up to
        // deregister from Y-sort and detaches from its parent.
        blocker.destroy();
      }

      this.destroyProjectile();
      return true;
    }

    return false;
  }

  destroyProjectile() {
    // Y-sort cleanup is handled by GameObject.destroy() walking up the tree.
    this.destroy();
  }

  drawImage(ctx, x, y) {
    if (!DEBUG_LAYERS.DRAW_HITBOXES) return;

    ctx.save();

    // Draw collision box at projectile position (green)
    ctx.fillStyle = "rgba(255, 0, 0, 0.4)";
    ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
    // ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
    // ctx.strokeStyle = "rgba(0, 255, 0, 1)";
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

    ctx.restore();
  }
}
