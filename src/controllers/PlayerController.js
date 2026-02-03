import { Controller } from "./Controller.js";
import { DOWN, LEFT, RIGHT, UP } from "../Input.js";
import { isSpaceFree } from "../helpers/grid.js";
import { events } from "../Events.js";
import { Character, STATE_ATTACKING, STATE_IDLE } from "../objects/Character/Character.js";

export class PlayerController extends Controller {
  constructor(character) {
    super(character);

    this.directionHeldTime = 0;
    this.lastDirection = null;
    this.movementThreshold = 80;
    this.gridSize = 16;
  }

  update(delta, root) {
    const character = this.character;
    const input = root.input;

    // Check for action button
    if (input?.getActionJustPressed("Space")) {
      this.onAction(root);
    }

    // --------------------
    // ATTACK (highest priority)
    // --------------------
    if (input?.getActionJustPressed("KeyX")) {
      character.attack();
    }

    // While attacking: allow facing change, nothing else
    if (character.state === STATE_ATTACKING) {
      if (input?.direction) {
        character.facingDirection = input.direction;
      }
      return;
    }

    // --------------------
    // DIRECTION HOLD LOGIC
    // --------------------
    if (input?.direction) {
      if (input.direction === this.lastDirection) {
        this.directionHeldTime += delta;
      } else {
        this.lastDirection = input.direction;
        this.directionHeldTime = 0;
      }
    } else {
      this.directionHeldTime = 0;
      this.lastDirection = null;
    }

    // Only initiate movement from IDLE and grid-aligned
    if (
      character.state === STATE_IDLE &&
      character.hasArrivedAtDestination()
    ) {
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
        objAtPosition.isLocked = true;
      }
      setTimeout(() => {
        events.emit("HERO_REQUESTS_ACTION", objAtPosition);
      }, 200);
    }
  }

  tryMove(root) {
    const character = this.character;
    const input = root.input;

    if (!input?.direction) {
      character.playIdleAnimation();
      return;
    }

    let nextX = character.destinationPosition.x;
    let nextY = character.destinationPosition.y;

    character.facingDirection = input.direction;
    character.playWalkAnimation(input.direction);

    if (this.directionHeldTime < this.movementThreshold) return;

    switch (input.direction) {
      case DOWN:  nextY += this.gridSize; break;
      case UP:    nextY -= this.gridSize; break;
      case LEFT:  nextX -= this.gridSize; break;
      case RIGHT: nextX += this.gridSize; break;
    }

    const spaceIsFree = isSpaceFree(root.level?.walls, nextX, nextY);

    const solidAtTarget = root.level?.children.find(c => {
      if (!c.isSolid) return false;
      const x = c.destinationPosition?.x ?? c.position.x;
      const y = c.destinationPosition?.y ?? c.position.y;
      return x === nextX && y === nextY;
    });

    if (spaceIsFree && !solidAtTarget) {
      character.destinationPosition.x = nextX;
      character.destinationPosition.y = nextY;
    }
  }
}
