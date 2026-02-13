import { State } from "../State.js";
import { STATE_IDLE } from "../../objects/Character/Character.js";
import { moveTowards } from "../../helpers/moveTowards.js";
import { isTileFree } from "../../helpers/grid.js";
import { events } from "../../Events.js";

export const STATE_HIT = "HIT";

const KNOCKBACK_SPEED = 2;
const RECOVERY_TIME = 150;
const FLASH_INTERVAL = 60;
const GRID_SIZE = 16;

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
    this.character.position.x = Math.round(this.character.position.x / GRID_SIZE) * GRID_SIZE;
    this.character.position.y = Math.round(this.character.position.y / GRID_SIZE) * GRID_SIZE;

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
      const prevY = this.character.position.y;

      moveTowards(this.character, this.character.destinationPosition, KNOCKBACK_SPEED);

      if (this.character.position.y !== prevY) {
        events.emit("YSORT_DIRTY");
      }

      if (this.character.hasArrivedAtDestination()) {
        this.character.position.x = this.character.destinationPosition.x;
        this.character.position.y = this.character.destinationPosition.y;
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
    // Enemy: parent is the level (has walls directly)
    // Hero: parent is Main (has level.walls)
    const walls = this.character.parent?.walls
      ?? this.character.parent?.level?.walls;
    const level = this.character.parent?.level ?? this.character.parent;
    return isTileFree(walls, level?.children, pos.x, pos.y, this.character);
  }

  exit() {
    this.character.body.visible = true;
    this.character._hitDirection = null;
  }
}
