import { GameObject } from "../../GameObject.js";
import { Vector2 } from "../../Vector2.js";
import { Sprite } from "../../Sprite.js";
import { resources } from "../../Resource.js";
import { DOWN, LEFT, RIGHT, UP } from "../../Input.js";
import { moveTowards } from "../../helpers/moveTowards.js";
import { events } from "../../Events.js";

/**
 * Base class for all character types (Hero, NPC, enemies, etc.)
 * Provides shared animation and movement logic.
 */
export class Character extends GameObject {
  /**
   * @param {Object} config - Character configuration
   * @param {Vector2} config.position - Starting position
   * @param {Object} config.spriteResource - Sprite sheet resource
   * @param {Animations} [config.animations] - Animation set (null for static)
   * @param {Vector2} [config.frameSize] - Size of each frame (default 32x32)
   * @param {number} [config.hFrames] - Horizontal frames in sprite sheet
   * @param {number} [config.vFrames] - Vertical frames in sprite sheet
   * @param {number} [config.frame] - Initial frame (for static sprites)
   * @param {Vector2} [config.bodyOffset] - Body sprite offset from position
   * @param {Vector2} [config.shadowOffset] - Shadow sprite offset from position
   * @param {boolean} [config.isSolid] - Whether character blocks movement
   * @param {number} [config.speed] - Movement speed (default 1)
   */
  constructor(config = {}) {
    super({
      position: config.position ?? new Vector2(0, 0)
    });

    // Movement properties
    this.facingDirection = config.facingDirection ?? DOWN;
    this.destinationPosition = this.position.duplicate();
    this.isLocked = false;
    this.speed = config.speed ?? 1;

    // Controller (set via setController)
    this.controller = null;

    // Solid flag for collision
    this.isSolid = config.isSolid ?? true;

    // Create shadow sprite
    const shadowOffset = config.shadowOffset ?? new Vector2(-8, -18);
    this.shadow = new Sprite({
      resource: resources.images.shadow,
      frameSize: new Vector2(32, 32),
      position: shadowOffset,
    });
    this.addChild(this.shadow);

    // Create body sprite
    const bodyOffset = config.bodyOffset ?? new Vector2(-8, -20);
    this.body = new Sprite({
      resource: config.spriteResource,
      frameSize: config.frameSize ?? new Vector2(32, 32),
      hFrames: config.hFrames ?? 3,
      vFrames: config.vFrames ?? 8,
      frame: config.frame ?? 1,
      position: bodyOffset,
      animations: config.animations ?? null
    });
    this.addChild(this.body);

    // Track current animation for debugging/state checks
    this.currentAnimation = null;
  }

  ready() {
    this.playIdleAnimation();
  }

  /**
   * Set the controller for this character
   * @param {Controller} controller - Controller instance
   */
  setController(controller) {
    this.controller = controller;
  }

  /**
   * Check if character has arrived at destination
   * @returns {boolean}
   */
  hasArrivedAtDestination() {
    const distance = Math.sqrt(
      Math.pow(this.destinationPosition.x - this.position.x, 2) +
      Math.pow(this.destinationPosition.y - this.position.y, 2)
    );
    return distance <= 1;
  }

  /**
   * Play idle animation for current facing direction
   */
  playIdleAnimation() {
    if (!this.body.animations) return;

    const animName = `idle${this.getDirectionName()}`;
    this.body.animations.play(animName);
    this.currentAnimation = animName;
  }

  /**
   * Play walk animation for given direction
   * @param {string} direction - Direction constant (UP, DOWN, LEFT, RIGHT)
   */
  playWalkAnimation(direction) {
    if (!this.body.animations) return;

    const dirName = this.getDirectionName(direction);
    const animName = `walk${dirName}`;
    this.body.animations.play(animName);
    this.currentAnimation = animName;
  }

  /**
   * Get direction name string for animation lookup
   * @param {string} [direction] - Direction constant (defaults to facingDirection)
   * @returns {string} "Up", "Down", "Left", or "Right"
   */
  getDirectionName(direction = this.facingDirection) {
    switch (direction) {
      case UP: return "Up";
      case DOWN: return "Down";
      case LEFT: return "Left";
      case RIGHT: return "Right";
      default: return "Down";
    }
  }

  step(delta, root) {
    // Delegate to controller if present
    if (this.controller && !this.isLocked) {
      this.controller.update(delta, root);
    }

    // Move toward destination
    moveTowards(this, this.destinationPosition, this.speed);
  }

  getOppositeDirection(direction = this.facingDirection) {
    const opposites = { LEFT: RIGHT, RIGHT: LEFT, UP: DOWN, DOWN: UP}
    return opposites[direction];
  }
}
