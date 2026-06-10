import { GameObject } from "../../GameObject.js";
import { UP, DOWN, LEFT, RIGHT } from "../../Input.js";

const LIFETIME = 600;   // ms
const GRAVITY = 0.3;   // per-tick downward accel
const IMPACT_BIAS = 0.6; // extra velocity along the projectile's travel axis

/**
 * Spawned when a Character is hit by a projectile. Captures the target's
 * body sprite's current frame, slices it into a splits×splits grid, and
 * launches each piece outward + downward with a fade-out.
 *
 * Cosmetic only — the target's takeHit reaction (knockback, etc.) is
 * unaffected. Self-destructs when LIFETIME expires.
 *
 * Y-sort: positioned at the target's foot so it ties with the character
 * and renders just after (insertion order), overlaying the hit pose.
 */
export class ParticleBurst extends GameObject {
  constructor({ resource, frameCoord, frameSize, position, drawOffset, splits = 2, impactDirection = null }) {
    super({ position: position.duplicate() });

    this.resource = resource;
    this.age = 0;
    this.suspendOnPause = true;

    const pieceW = frameSize.x / splits;
    const pieceH = frameSize.y / splits;
    const centerCol = (splits - 1) / 2;
    const centerRow = (splits - 1) / 2;

    // Push pieces along the projectile's travel axis so the shatter "drifts"
    // forward (a leftward-moving projectile pushes pieces leftward, etc.).
    const impactBoostX = impactDirection === RIGHT ? IMPACT_BIAS
                       : impactDirection === LEFT ? -IMPACT_BIAS : 0;
    const impactBoostY = impactDirection === DOWN ? IMPACT_BIAS
                       : impactDirection === UP ? -IMPACT_BIAS : 0;

    this.particles = [];
    for (let row = 0; row < splits; row++) {
      for (let col = 0; col < splits; col++) {
        const offsetX = col * pieceW;
        const offsetY = row * pieceH;

        // Radial outward velocity from the grid center, plus jitter so a
        // dead-center piece (3x3, 5x5…) still has motion.
        const dirX = col - centerCol;
        const dirY = row - centerRow;
        const len = Math.hypot(dirX, dirY) || 1;
        const speed = 0.5 + Math.random() * 0.3;
        const vx = (dirX / len) * speed + (Math.random() - 0.5) * 0.1 + impactBoostX;
        const vy = (dirY / len) * speed - 0.5 + impactBoostY; // upward bias for the "pop"

        this.particles.push({
          srcX: frameCoord.x + offsetX,
          srcY: frameCoord.y + offsetY,
          srcW: pieceW,
          srcH: pieceH,
          x: drawOffset.x + offsetX,
          y: drawOffset.y + offsetY,
          vx,
          vy,
          // Random landing height (0..8 px below the object's y) so pieces
          // don't all snap to the same line.
          floor: Math.random() * 12,
        });
      }
    }
  }

  step(delta) {
    this.age += delta;
    if (this.age >= LIFETIME) {
      this.destroy();
      return;
    }
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += GRAVITY;
      // Floor in burst-local coords is the object's position.y (y=0)
      // jittered by each piece's `floor` offset (0..8 px) so pieces don't
      // all settle on the same line.
      if (p.y > p.floor) {
        p.y = p.floor;
        p.vy = 0;
        p.vx = 0;
      }
    }
  }

  drawImage(ctx, drawPosX, drawPosY) {
    if (!this.resource?.isLoaded) return;
    const alpha = Math.max(0, 1 - this.age / LIFETIME);
    ctx.save();
    // ctx.globalAlpha = alpha;
    for (const p of this.particles) {
      ctx.drawImage(
        this.resource.image,
        p.srcX, p.srcY, p.srcW, p.srcH,
        Math.floor(drawPosX + p.x), Math.floor(drawPosY + p.y),
        p.srcW, p.srcH
      );
    }
    ctx.restore();
  }
}
