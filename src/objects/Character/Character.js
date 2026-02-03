import { GameObject } from "../../GameObject.js";
import { Vector2 } from "../../Vector2.js";
import { Sprite } from "../../Sprite.js";
import { resources } from "../../Resource.js";
import { events } from "../../Events.js";
import { moveTowards } from "../../helpers/moveTowards.js";
import { DOWN, LEFT, RIGHT, UP } from "../../Input.js";

// States
export const STATE_IDLE = "IDLE";
export const STATE_MOVING = "MOVING";
export const STATE_ATTACKING = "ATTACKING";

export class Character extends GameObject {
  constructor(config = {}) {
    super({
      position: config.position ?? new Vector2(0, 0),
    });

    // Movement
    this.facingDirection = config.facingDirection ?? DOWN;
    this.destinationPosition = this.position.duplicate();
    this.speed = config.speed ?? 1;

    // State
    this.state = STATE_IDLE;

    // Attack
    this.attackTimer = 0;
    this.attackBuffered = false;
    this.attackRecoveryTimer = 0;
    this.equippedWeapon = null;

    // Controller
    this.controller = null;

    this.isSolid = config.isSolid ?? true;
    this.isLocked = false;

    // Shadow
    this.shadow = new Sprite({
      resource: resources.images.shadow,
      frameSize: new Vector2(32, 32),
      position: config.shadowOffset ?? new Vector2(-8, -18),
    });
    this.shadow.drawOrder = 0;
    this.addChild(this.shadow);

    // Body
    this.body = new Sprite({
      resource: config.spriteResource,
      frameSize: config.frameSize ?? new Vector2(32, 32),
      hFrames: config.hFrames ?? 3,
      vFrames: config.vFrames ?? 8,
      frame: config.frame ?? 1,
      position: config.bodyOffset ?? new Vector2(-8, -20),
      animations: config.animations ?? null,
    });
    this.body.drawOrder = 2;
    this.addChild(this.body);
  }

  ready() {
    this.playIdleAnimation();
  }

  setController(controller) {
    this.controller = controller;
  }

  equip(weapon) {
    this.equippedWeapon = weapon;
    // Weapon sprite can be added as child here for draw order
    // this.addChild(weaponSprite);
  }

  hasArrivedAtDestination() {
    return (
      Math.abs(this.position.x - this.destinationPosition.x) <= 1 &&
      Math.abs(this.position.y - this.destinationPosition.y) <= 1
    );
  }

  step(delta, root) {
    if (this.isLocked) {
      this.playIdleAnimation();
      return;
    }

    // Always process controller (input can buffer attack)
    this.controller?.update(delta, root);

    // Tick recovery timer
    if (this.attackRecoveryTimer > 0) {
      this.attackRecoveryTimer -= delta;
    }

    // --------------------
    // ATTACK STATE
    // --------------------
    if (this.state === STATE_ATTACKING) {
      this.attackTimer -= delta;

      if (this.attackTimer <= 0) {
        this.state = STATE_IDLE;
        this.attackRecoveryTimer = 120; // Grace window before movement resumes
        this.playIdleAnimation();
      }

      return;
    }

    const prevY = this.position.y;

    // --------------------
    // MOVEMENT
    // --------------------
    moveTowards(this, this.destinationPosition, this.speed);

    if (this.hasArrivedAtDestination()) {
      // Snap exactly (prevents drift)
      this.position.x = this.destinationPosition.x;
      this.position.y = this.destinationPosition.y;

      // Buffered attack fires immediately after move
      if (this.attackBuffered) {
        this.attackBuffered = false;
        this.startAttack();
        return;
      }

      if (this.state === STATE_MOVING) {
        this.state = STATE_IDLE;
        this.playIdleAnimation();
      }
    } else {
      this.state = STATE_MOVING;
    }

    if (this.position.y !== prevY) {
      events.emit("YSORT_DIRTY");
    }
  }

  // ====================
  // ATTACK API
  // ====================

  attack() {
    if (this.state === STATE_ATTACKING) return;

    // Buffer if moving
    if (this.state === STATE_MOVING) {
      this.attackBuffered = true;
      return;
    }

    // Idle → attack immediately
    this.startAttack();
  }

  startAttack() {
    if (!this.equippedWeapon) return;

    const attackType = this.equippedWeapon.attackType;
    const anim = `${attackType}${this.getDirectionName()}`;
    const pattern = this.body.animations?.patterns?.[anim];
    if (!pattern) return;

    // Kill movement completely
    this.destinationPosition = this.position.duplicate();

    this.state = STATE_ATTACKING;
    this.attackTimer = pattern.duration;
    this.body.animations.play(anim);
  }

  // ====================
  // ANIMATIONS
  // ====================

  playIdleAnimation() {
    if (this.state !== STATE_IDLE) return;
    this.body.animations?.play(`idle${this.getDirectionName()}`);
  }

  playWalkAnimation(direction) {
    if (this.state === STATE_ATTACKING) return;
    this.body.animations?.play(`walk${this.getDirectionName(direction)}`);
  }

  getDirectionName(direction = this.facingDirection) {
    switch (direction) {
      case UP: return "Up";
      case DOWN: return "Down";
      case LEFT: return "Left";
      case RIGHT: return "Right";
      default: return "Down";
    }
  }

  getOppositeDirection(direction = this.facingDirection) {
    return { LEFT: RIGHT, RIGHT: LEFT, UP: DOWN, DOWN: UP }[direction];
  }
}
