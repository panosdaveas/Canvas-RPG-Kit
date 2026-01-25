import { Controller } from "./Controller.js";
import { DOWN, LEFT, RIGHT, UP } from "../Input.js";
import { isSpaceFree } from "../helpers/grid.js";
import { Vector2 } from "../Vector2.js";

/**
 * Controller for NPCs that follow a predefined path.
 * Supports waypoint movement with loop and ping-pong modes.
 */
export class PathController extends Controller {
  /**
   * @param {Character} character - The character to control
   * @param {Object} config - Path configuration
   * @param {Vector2[]} config.path - Array of waypoint positions
   * @param {boolean} [config.loop=false] - Whether to loop back to start
   * @param {boolean} [config.pingPong=false] - Whether to reverse direction at ends
   * @param {number} [config.waitTime=0] - Time to wait at each waypoint (ms)
   * @param {number} [config.speed=1] - Movement speed (default 1, hero is 1)
   */
  constructor(character, config = {}) {
    super(character);

    this.path = config.path ?? [];
    this.loop = config.loop ?? false;
    this.pingPong = config.pingPong ?? false;
    this.waitTime = config.waitTime ?? 0;
    this.speed = config.speed ?? 1;

    // Internal state
    this.currentWaypointIndex = 0;
    this.waitTimer = 0;
    this.isWaiting = false;
    this.direction = 1; // 1 = forward, -1 = backward (for pingPong)
    this.isFinished = false;
  }

  update(delta, root) {
    const character = this.character;

    // If no path or finished, just idle
    if (this.path.length === 0 || this.isFinished) {
      character.playIdleAnimation();
      return;
    }

    // Handle waiting at waypoint
    if (this.isWaiting) {
      this.waitTimer -= delta;
      character.playIdleAnimation();
      if (this.waitTimer <= 0) {
        this.isWaiting = false;
        this.advanceToNextWaypoint();
      }
      return;
    }

    // Only act when arrived at current tile
    if (!character.hasArrivedAtDestination()) {
      return;
    }

    // Check if arrived at current waypoint (use destinationPosition for consistency)
    const targetWaypoint = this.path[this.currentWaypointIndex];
    const atWaypoint = targetWaypoint &&
      character.destinationPosition.x === targetWaypoint.x &&
      character.destinationPosition.y === targetWaypoint.y;

    if (atWaypoint) {
      // Start waiting if configured
      if (this.waitTime > 0) {
        this.isWaiting = true;
        this.waitTimer = this.waitTime;
        character.playIdleAnimation();
        return;
      }
      // Otherwise advance immediately
      this.advanceToNextWaypoint();
    }

    // Move toward current waypoint (one tile at a time)
    this.moveTowardWaypoint(root);
  }

  advanceToNextWaypoint() {
    const nextIndex = this.currentWaypointIndex + this.direction;

    if (nextIndex >= this.path.length || nextIndex < 0) {
      if (this.loop) {
        // Loop: jump back to start
        this.currentWaypointIndex = 0;
      } else if (this.pingPong) {
        // Ping-pong: reverse direction
        this.direction *= -1;
        this.currentWaypointIndex += this.direction;
      } else {
        // No loop/pingPong: stop at end
        this.isFinished = true;
      }
    } else {
      this.currentWaypointIndex = nextIndex;
    }
  }

  moveTowardWaypoint(root) {
    const character = this.character;
    const targetWaypoint = this.path[this.currentWaypointIndex];

    if (!targetWaypoint) {
      character.playIdleAnimation();
      return;
    }

    // Use destinationPosition (grid-aligned) for all calculations
    const currentX = character.destinationPosition.x;
    const currentY = character.destinationPosition.y;

    // Calculate direction to target waypoint
    const dx = targetWaypoint.x - currentX;
    const dy = targetWaypoint.y - currentY;

    // Already at waypoint
    if (dx === 0 && dy === 0) {
      character.playIdleAnimation();
      return;
    }

    // Determine facing direction based on movement
    let facingDirection = character.facingDirection;
    if (Math.abs(dx) > Math.abs(dy)) {
      facingDirection = dx > 0 ? RIGHT : LEFT;
    } else if (dy !== 0) {
      facingDirection = dy > 0 ? DOWN : UP;
    }

    character.facingDirection = facingDirection;
    character.playWalkAnimation(facingDirection);

    // Move one tile at a time toward waypoint
    const gridSize = 16;
    let nextX = currentX;
    let nextY = currentY;

    if (Math.abs(dx) > Math.abs(dy)) {
      nextX += Math.sign(dx) * gridSize;
    } else {
      nextY += Math.sign(dy) * gridSize;
    }

    // Check collision at next tile
    const spaceIsFree = isSpaceFree(root.level?.walls, nextX, nextY);

    // Check level children
    const levelBodyAtSpace = root.level?.children.find(c => {
      if (!c.isSolid || c === character) return false;
      const checkX = c.destinationPosition?.x ?? c.position.x;
      const checkY = c.destinationPosition?.y ?? c.position.y;
      return checkX === nextX && checkY === nextY;
    });

    // Check hero (hero is child of Main, not level)
    const heroAtSpace = root.hero &&
      root.hero.destinationPosition.x === nextX &&
      root.hero.destinationPosition.y === nextY;

    if (spaceIsFree && !levelBodyAtSpace && !heroAtSpace) {
      character.destinationPosition.x = nextX;
      character.destinationPosition.y = nextY;
    } else {
      // Path blocked, wait and retry
      character.playIdleAnimation();
    }
  }

  /**
   * Reset the path controller to the beginning
   */
  reset() {
    this.currentWaypointIndex = 0;
    this.direction = 1;
    this.isFinished = false;
    this.isWaiting = false;
    this.waitTimer = 0;
  }

  /**
   * Set a new path
   * @param {Vector2[]} path - New waypoint array
   */
  setPath(path) {
    this.path = path;
    this.reset();
  }
}
