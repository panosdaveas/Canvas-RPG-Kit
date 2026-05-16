import { State } from "../State.js";
import { STATE_IDLE } from "../../objects/Character/Character.js";
import { moveTowards } from "../../helpers/moveTowards.js";
import { isTileFree, snapToGrid } from "../../helpers/grid.js";
import { events } from "../../Events.js";

export const STATE_HIT = "HIT";

const KNOCKBACK_SPEED = 2;
const RECOVERY_TIME = 150;   // invuln flash window after knockback ends
const STUN_TIME = 200;       // post-recovery lockout — visible but can't act
const FLASH_INTERVAL = 60;

export class HitState extends State {
  constructor() {
    super(STATE_HIT);
    this.blocksController = true;
    this.phase = "knockback";
    this.recoveryTimer = 0;
    this.stunTimer = 0;
    this.flashTimer = 0;
  }

  enter() {
    this.flashTimer = 0;
    this.phase = "knockback";
    this.recoveryTimer = RECOVERY_TIME;
    this.stunTimer = STUN_TIME;

    // Knockback + flash recovery = invuln window. The stunned phase clears
    // this flag so re-hits during the stun trigger another knockback.
    this.character._invulnerable = true;

    // Snap to grid first — ensures knockback destination is also grid-aligned
    this.character.position.x = snapToGrid(this.character.position.x);
    this.character.position.y = snapToGrid(this.character.position.y);

    this.startY = this.character.position.y;

    // Knockback: one tile in the attacker's direction
    const hitDir = this.character._hitDirection;
    const knockbackTarget = hitDir
      ? this.character.position.toNeighbor(hitDir)
      : null;

    // Notify external systems that the player avatar is taking a hit, so
    // overlap-triggers (Exit, Rod) can suppress themselves and future
    // health/audio/screen-shake systems can react. Gated on team because
    // enemies also enter HitState — only Hero is the "hero" being hit.
    // important! first notify other systems, THEN try to move
    if (this.character.team === "player") {
      events.emit("HERO_HIT_START", { direction: hitDir });
    }

    if (knockbackTarget && this.isWalkable(knockbackTarget)) {
      this.character.destinationPosition = knockbackTarget;
    } else {
      this.character.destinationPosition = this.character.position.duplicate();
      this.phase = "recovery";
    }

    this.character.playIdleAnimation();

  }

  update(delta, root) {
    // Phases: knockback → recovery → stunned → IDLE.
    //   knockback: flying back one tile, flashing
    //   recovery:  at rest, still flashing (invuln window)
    //   stunned:   visible, no flash, controller still blocked (action lockout)
    //
    // Flash only during knockback + recovery so the stunned phase is silent.
    if (this.phase === "knockback" || this.phase === "recovery") {
      this.flashTimer -= delta;
      if (this.flashTimer <= 0) {
        this.character.body.visible = !this.character.body.visible;
        this.flashTimer = FLASH_INTERVAL;
      }
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
    } else if (this.phase === "recovery") {
      this.recoveryTimer -= delta;
      if (this.recoveryTimer <= 0) {
        this.phase = "stunned";
        // Make sure the body is solid going into the stun (no mid-toggle).
        this.character.body.visible = true;
        // Stunned = still locked but no longer invulnerable. Re-hits during
        // this window restart the cycle (via Character.takeHit calling enter).
        this.character._invulnerable = false;
      }
    } else {
      this.stunTimer -= delta;
      if (this.stunTimer <= 0) {
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
    // Defensive: if HitState is ever exited unexpectedly, don't leave the
    // character stuck as invulnerable.
    this.character._invulnerable = false;

    if (this.character.team === "player") {
      events.emit("HERO_HIT_END");
    }
  }
}
