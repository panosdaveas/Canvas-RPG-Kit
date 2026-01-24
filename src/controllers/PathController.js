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

    // Check if arrived at current waypoint
    if (character.hasArrivedAtDestination()) {
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

    // Move toward current waypoint
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

    // Calculate direction to target
    const dx = targetWaypoint.x - character.position.x;
    const dy = targetWaypoint.y - character.position.y;

    // Determine facing direction based on movement
    let facingDirection = character.facingDirection;
    if (Math.abs(dx) > Math.abs(dy)) {
      facingDirection = dx > 0 ? RIGHT : LEFT;
    } else if (dy !== 0) {
      facingDirection = dy > 0 ? DOWN : UP;
    }

    // Update character facing and animation
    character.facingDirection = facingDirection;

    // Only move if not at destination
    if (dx !== 0 || dy !== 0) {
      character.playWalkAnimation(facingDirection);

      // Set destination to waypoint
      // Collision checking can be added here if needed
      const nextX = targetWaypoint.x;
      const nextY = targetWaypoint.y;

      // Optional: Check collision (for now, assume path is valid)
      const spaceIsFree = isSpaceFree(root.level?.walls, nextX, nextY);
      const solidBodyAtSpace = root.level?.children.find(c => {
        return c.isSolid && c !== character && c.position.x === nextX && c.position.y === nextY;
      });

      if (spaceIsFree && !solidBodyAtSpace) {
        character.destinationPosition.x = nextX;
        character.destinationPosition.y = nextY;
      } else {
        // Path blocked, wait and retry
        character.playIdleAnimation();
      }
    } else {
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
