import { Controller } from "./Controller.js";
import { DOWN, LEFT, RIGHT, UP } from "../Input.js";
import { isSpaceFree } from "../helpers/grid.js";
import { events } from "../Events.js";
import { Character } from "../objects/Character/Character.js";
import { Npc } from "../objects/Character/types/Npc/Npc.js";

/**
 * Controller for player-controlled characters (Hero).
 * Handles keyboard input, movement with turn-in-place mechanic,
 * collision checking, and action button interactions.
 */
export class PlayerController extends Controller {
  constructor(character) {
    super(character);

    // Direction hold tracking for turn-in-place mechanic
    this.directionHeldTime = 0;
    this.lastDirection = null;
    this.movementThreshold = 80; // ms - adjust this value to tune the feel
  }

  update(delta, root) {
    const character = this.character;
    const input = root.input;

    // Check for action button
    if (input?.getActionJustPressed("Space")) {
      this.onAction(root);
    }

    // Track how long direction is held
    if (input?.direction) {
      if (input.direction === this.lastDirection) {
        this.directionHeldTime += delta;
      } else {
        // Direction changed, reset timer
        this.directionHeldTime = 0;
        this.lastDirection = input.direction;
      }
    } else {
      // No direction held, reset
      this.directionHeldTime = 0;
      this.lastDirection = null;
    }

    // Try to move if arrived at destination
    if (character.hasArrivedAtDestination()) {
      this.tryMove(root);
    }
  }

  onAction(root) {
    const character = this.character;
    // Look for an object at the next space (according to where character is facing)
    const objAtPosition = root.level?.children.find(child => {
      return child.position.matches(character.position.toNeighbor(character.facingDirection));
    });
    console.log("ACTION WITH:", objAtPosition);
    if (objAtPosition) {
      if (objAtPosition instanceof Character) {
        const oppositeDirection = character.getOppositeDirection();
        objAtPosition.facingDirection = oppositeDirection;
        objAtPosition.playIdleAnimation();
        objAtPosition.isLocked = true; // Lock immediately to prevent controller from overwriting
      }
      setTimeout(() => {
      events.emit("HERO_REQUESTS_ACTION", objAtPosition);
      }, 200); // play idle animation towards player's direction 150ms , then start action
    }
  }

  tryMove(root) {
    const character = this.character;
    const { input } = root;

    if (!input.direction) {
      character.playIdleAnimation();
      return;
    }

    let nextX = character.destinationPosition.x;
    let nextY = character.destinationPosition.y;
    const gridSize = 16;
    let intendedDirection = input.direction;

    // Always update facing direction and animation immediately
    if (intendedDirection === DOWN) {
      character.playWalkAnimation(DOWN);
      character.facingDirection = DOWN;
      if (this.directionHeldTime >= this.movementThreshold) {
        nextY += gridSize;
      }
    }
    if (intendedDirection === UP) {
      character.playWalkAnimation(UP);
      character.facingDirection = UP;
      if (this.directionHeldTime >= this.movementThreshold) {
        nextY -= gridSize;
      }
    }
    if (intendedDirection === LEFT) {
      character.playWalkAnimation(LEFT);
      character.facingDirection = LEFT;
      if (this.directionHeldTime >= this.movementThreshold) {
        nextX -= gridSize;
      }
    }
    if (intendedDirection === RIGHT) {
      character.playWalkAnimation(RIGHT);
      character.facingDirection = RIGHT;
      if (this.directionHeldTime >= this.movementThreshold) {
        nextX += gridSize;
      }
    }

    // Validate that the next destination is free
    const spaceIsFree = isSpaceFree(root.level?.walls, nextX, nextY);

    const solidBodyAtSpace = root.level?.children.find(c => {
      if (!c.isSolid) return false;
      // Check destinationPosition, fall back to position for static objects
      const checkX = c.destinationPosition?.x ?? c.position.x;
      const checkY = c.destinationPosition?.y ?? c.position.y;
      return checkX === nextX && checkY === nextY;
    });
    if (spaceIsFree && !solidBodyAtSpace) {
      character.destinationPosition.x = nextX;
      character.destinationPosition.y = nextY;
    }
  }
}
