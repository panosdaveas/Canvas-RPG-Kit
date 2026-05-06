import { Controller } from "./Controller.js";
import { DOWN, LEFT, RIGHT, UP } from "../Input.js";
import { isTileFree } from "../helpers/grid.js";
import { events } from "../Events.js";
import { Character, STATE_ATTACKING, STATE_IDLE, STATE_INTERACTING } from "../objects/Character/Character.js";
import { sword, bow, firearm } from "../combat/weapons/index.js";


export class PlayerController extends Controller {
  constructor(character) {
    super(character);

    this.directionHeldTime = 0;
    this.lastDirection = null;
    this.movementThreshold = 80;
    this.gridSize = 16;

    //TODO: change: On equip, set movementThreshold in player controlle to 0. Reset when uequipp
    events.on("WEAPON_SELECTED", this, () => {
      this.movementThreshold = 0;
    });

    events.on("WEAPON_UPEQUIPPED", this, () => {
      this.movementThreshold = 80;
    })
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

    //equip weapon
    //TODO: wait for attack to finish and then swap weapons
    if (input?.getActionJustPressed("Digit0") || input?.getActionJustPressed("Numpad0")) {
      if (character.state != STATE_ATTACKING) {
        character.unequip();
        events.emit("WEAPON_UPEQUIPPED");
      }
    }

    if (input?.getActionJustPressed("Digit1") || input?.getActionJustPressed("Numpad1")) {
      if (character.state != STATE_ATTACKING) {
        character.unequip();
        character.equip(sword);
        events.emit("WEAPON_SELECTED", { weapon: sword });
      }
    }

    if (input?.getActionJustPressed("Digit2") || input?.getActionJustPressed("Numpad2")) {
      if (character.state != STATE_ATTACKING) {
        character.unequip();
        character.equip(bow);
        events.emit("WEAPON_SELECTED", { weapon: bow });
      }
    }

    if (input?.getActionJustPressed("Digit3") || input?.getActionJustPressed("Numpad3")) {
      if (character.state != STATE_ATTACKING) {
        character.unequip();
        character.equip(firearm);
        events.emit("WEAPON_SELECTED", { weapon: firearm });
      }
    }

    if (input?.getActionJustPressed("ShiftRight")) {
      character.attack();
    }

    // While attacking: allow facing change, nothing else
    if (character.state === STATE_ATTACKING) {
      if (input?.direction) {
        character.facingDirection = input.direction;
      }
      return;
    }

    // Recovery window: allow facing, suppress movement
    if (character.attackRecoveryTimer > 0) {
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
      return child !== character && child.position.matches(character.position.toNeighbor(character.facingDirection));
    });
    console.log("ACTION WITH:", objAtPosition);
    if (objAtPosition) {
      if (objAtPosition instanceof Character) {
        const oppositeDirection = character.getOppositeDirection();
        objAtPosition.facingDirection = oppositeDirection;
        objAtPosition.playIdleAnimation();
        objAtPosition.state = STATE_INTERACTING;
      }
      setTimeout(() => {
        events.emit("HERO_REQUESTS_ACTION", objAtPosition);
      }, 40);
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

    if (isTileFree(root.level?.walls, root.level?.children, nextX, nextY, character)) {
      character.destinationPosition.x = nextX;
      character.destinationPosition.y = nextY;
    }
  }
}
