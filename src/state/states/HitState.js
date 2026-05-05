import { State } from "../State.js";
import { STATE_IDLE } from "../../objects/Character/Character.js";
import { moveTowards } from "../../helpers/moveTowards.js";
import { isTileFree, snapToGrid } from "../../helpers/grid.js";
import { events } from "../../Events.js";

export const STATE_HIT = "HIT";

const KNOCKBACK_SPEED = 2;
const RECOVERY_TIME = 150;
const FLASH_INTERVAL = 60;

export class HitState extends State {
  constructor() {
    super(STATE_HIT);
    this.blocksController = true;
    this.phase = "knockback";
    this.recoveryTimer = 0;
    this.flashTimer = 0;
  }

  enter() {
    this.flashTimer = 0;
    this.phase = "knockback";
    this.recoveryTimer = RECOVERY_TIME;

    // Snap to grid first — ensures knockback destination is also grid-aligned
    this.character.position.x = snapToGrid(this.character.position.x);
    this.character.position.y = snapToGrid(this.character.position.y);

    this.startY = this.character.position.y;

    // Knockback: one tile in the attacker's direction
    const hitDir = this.character._hitDirection;
    const knockbackTarget = hitDir
      ? this.character.position.toNeighbor(hitDir)
      : null;

    if (knockbackTarget && this.isWalkable(knockbackTarget)) {
      this.character.destinationPosition = knockbackTarget;
    } else {
      this.character.destinationPosition = this.character.position.duplicate();
      this.phase = "recovery";
    }

    this.character.playIdleAnimation();
  }

  update(delta, root) {
    this.flashTimer -= delta;
    if (this.flashTimer <= 0) {
      this.character.body.visible = !this.character.body.visible;
      this.flashTimer = FLASH_INTERVAL;
    }

    if (this.phase === "knockback") {
      moveTowards(this.character, this.character.destinationPosition, KNOCKBACK_SPEED);

      if (this.character.hasArrivedAtDestination()) {
        this.character.position.x = this.character.destinationPosition.x;
        this.character.position.y = this.character.destinationPosition.y;

        if (this.character.position.y !== this.startY) {
          events.emit("YSORT_DIRTY");
        }

        this.phase = "recovery";
      }
    } else {
      this.recoveryTimer -= delta;
      if (this.recoveryTimer <= 0) {
        this.transitionTo(STATE_IDLE);
      }
    }
  }

  isWalkable(pos) {
    const level = this.character.parent;
    return isTileFree(level?.walls, level?.children, pos.x, pos.y, this.character);
  }

  exit() {
    this.character.body.visible = true;
    this.character._hitDirection = null;
  }
}
