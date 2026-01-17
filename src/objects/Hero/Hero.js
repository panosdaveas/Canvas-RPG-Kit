import { GameObject } from "../../GameObject.js";
import { Vector2 } from "../../Vector2.js";
import { DOWN, LEFT, RIGHT, UP } from "../../Input.js";
import { gridCells, isSpaceFree } from "../../helpers/grid.js";
import { Sprite } from "../../Sprite.js";
import { resources } from "../../Resource.js";
import { Animations } from "../../Animations.js";
import { FrameIndexPattern } from "../../FrameIndexPattern.js";
import {
  PICK_UP_DOWN,
  IDLE_DOWN,
  IDLE_LEFT,
  IDLE_RIGHT,
  IDLE_UP,
  WALK_DOWN,
  WALK_LEFT,
  WALK_RIGHT,
  WALK_UP
} from "./heroAnimations.js";
import { moveTowards } from "../../helpers/moveTowards.js";
import { events } from "../../Events.js";

export class Hero extends GameObject {
  constructor(x, y) {
    super({
      position: new Vector2(x, y)
    });

    const shadow = new Sprite({
      resource: resources.images.shadow,
      frameSize: new Vector2(32, 32),
      position: new Vector2(-8, -18),
    })
    this.addChild(shadow);

    this.body = new Sprite({
      resource: resources.images.hero,
      frameSize: new Vector2(32, 32),
      hFrames: 3,
      vFrames: 8,
      frame: 1,
      position: new Vector2(-8, -20),
      animations: new Animations({
        walkDown: new FrameIndexPattern(WALK_DOWN),
        walkUp: new FrameIndexPattern(WALK_UP),
        walkLeft: new FrameIndexPattern(WALK_LEFT),
        walkRight: new FrameIndexPattern(WALK_RIGHT),
        idleDown: new FrameIndexPattern(IDLE_DOWN),
        idleUp: new FrameIndexPattern(IDLE_UP),
        idleLeft: new FrameIndexPattern(IDLE_LEFT),
        idleRight: new FrameIndexPattern(IDLE_RIGHT),
        pickUpDown: new FrameIndexPattern(PICK_UP_DOWN),
      })
    })
    this.addChild(this.body);

    this.facingDirection = DOWN;
    this.destinationPosition = this.position.duplicate();
    this.itemPickupTime = 0;
    this.itemPickupShell = null;
    this.isLocked = false;

    // Direction hold tracking for turn-in-place mechanic
    this.directionHeldTime = 0;
    this.lastDirection = null;
    this.movementThreshold = 80; // ms - adjust this value to tune the feel

    // React to picking up an item
    events.on("HERO_PICKS_UP_ITEM", this, data => {
      this.onPickUpItem(data)
    })
  }

  ready() {
    events.on("START_TEXT_BOX", this, () => {
      this.isLocked = true;
    })
    events.on("END_TEXT_BOX", this, () => {
      this.isLocked = false;
    })

    // Emit initial position so chunks load
    events.emit("HERO_POSITION", this.position);
    this.lastX = this.position.x;
    this.lastY = this.position.y;
  }

  step(delta, root) {

    // Don't do anything when locked
    if (this.isLocked) {
      this.playIdleAnimation();
      return;
    }

    // Lock movement if celebrating an item pickup
    if (this.itemPickupTime > 0) {
      this.workOnItemPickup(delta);
      return;
    }

    // Check for input
    /** @type {Input} */
    const input = root.input;
    if (input?.getActionJustPressed("Space")) {
      // Look for an object at the next space (according to where Hero is facing)
      const objAtPosition = root.level?.children.find(child => {
        return child.position.matches(this.position.toNeighbor(this.facingDirection))
      })
      console.log("ACTION WITH:", objAtPosition)
      if (objAtPosition) {
        events.emit("HERO_REQUESTS_ACTION", objAtPosition);
      }
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

    const distance = moveTowards(this, this.destinationPosition, 1);
    const hasArrived = distance <= 1;
    // Attempt to move again if the hero is at his position
    if (hasArrived) {
      this.tryMove(root)
    }

    this.tryEmitPosition()
  }

  tryEmitPosition() {
    if (this.lastX === this.position.x && this.lastY === this.position.y) {
      return;
    }
    this.lastX = this.position.x;
    this.lastY = this.position.y;
    events.emit("HERO_POSITION", this.position)
  }

  playIdleAnimation() {
    if (this.facingDirection === LEFT) {
      this.body.animations.play("idleLeft");
      this.currentAnimation = 'idleLeft';
    }
    if (this.facingDirection === RIGHT) {
      this.body.animations.play("idleRight");
      this.currentAnimation = 'idleRight';
    }
    if (this.facingDirection === UP) {
      this.body.animations.play("idleUp");
      this.currentAnimation = 'idleUp';
    }
    if (this.facingDirection === DOWN) {
      this.body.animations.play("idleDown");
      this.currentAnimation = 'idleDown';
    }
  }

  tryMove(root) {
    const { input } = root;

    if (!input.direction) {

      if (this.facingDirection === LEFT) {
        this.body.animations.play("idleLeft");
        this.currentAnimation = 'idleLeft';
      }
      if (this.facingDirection === RIGHT) {
        this.body.animations.play("idleRight");
        this.currentAnimation = 'idleRight';
      }
      if (this.facingDirection === UP) {
        this.body.animations.play("idleUp");
        this.currentAnimation = 'idleUp';
      }
      if (this.facingDirection === DOWN) {
        this.body.animations.play("idleDown");
        this.currentAnimation = 'idleDown';
      }

      return;
    }

    let nextX = this.destinationPosition.x;
    let nextY = this.destinationPosition.y;
    const gridSize = 16;
    let intendedDirection = input.direction;

    // Always update facing direction and animation immediately
    if (intendedDirection === DOWN) {
      this.body.animations.play("walkDown");
      this.currentAnimation = 'walkDown';
      this.facingDirection = DOWN;
      if (this.directionHeldTime >= this.movementThreshold) {
        nextY += gridSize;
      }
    }
    if (intendedDirection === UP) {
      this.body.animations.play("walkUp");
      this.currentAnimation = 'walkUp';
      this.facingDirection = UP;
      if (this.directionHeldTime >= this.movementThreshold) {
        nextY -= gridSize;
      }
    }
    if (intendedDirection === LEFT) {
      this.body.animations.play("walkLeft");
      this.currentAnimation = 'walkLeft';
      this.facingDirection = LEFT;
      if (this.directionHeldTime >= this.movementThreshold) {
        nextX -= gridSize;
      }
    }
    if (intendedDirection === RIGHT) {
      this.body.animations.play("walkRight");
      this.currentAnimation = 'walkRight';
      this.facingDirection = RIGHT;
      if (this.directionHeldTime >= this.movementThreshold) {
        nextX += gridSize;
      }
    }

    // Validating that the next destination is free
    const spaceIsFree = isSpaceFree(root.level?.walls, nextX, nextY);

    // const allObjects = [
    //   ...this.parent.children, // parent is Main
    //   ...(root.level?.children || []) // objects are in Level
    // ];
    // const solidBodyAtSpace = allObjects.find(c => {
    //   return c.isSolid && c.position.x === nextX && c.position.y === nextY
    // })
    const solidBodyAtSpace = root.level?.children.find(c => {
      return c.isSolid && c.position.x === nextX && c.position.y === nextY
    })
    if (spaceIsFree && !solidBodyAtSpace) {
      this.destinationPosition.x = nextX;
      this.destinationPosition.y = nextY;
    }
  }

  workOnItemPickup(delta) {
    this.itemPickupTime -= delta;
    this.body.animations.play("pickUpDown")

    // Remove the item being held overhead
    if (this.itemPickupTime <= 0) {
      this.itemPickupShell.destroy();
    }

  }


}