import { GameObject } from "../../GameObject.js";
import { Vector2 } from "../../Vector2.js";
import { Sprite } from "../../Sprite.js";
import { resources } from "../../Resource.js";
import { events } from "../../Events.js";
import { DOWN, LEFT, RIGHT, UP } from "../../Input.js";
import { TILE_SIZE, DEBUG_LAYERS } from "../../Constants.js";
import { getHitboxPositions } from "../../combat/attackHelpers.js";
import { Projectile } from "../Projectile/Projectile.js";
import { StateMachine } from "../../state/StateMachine.js";
import { IdleState } from "../../state/states/IdleState.js";
import { MovingState } from "../../state/states/MovingState.js";
import { AttackingState } from "../../state/states/AttackingState.js";
import { InteractingState } from "../../state/states/InteractingState.js";
import { HitState, STATE_HIT } from "../../state/states/HitState.js";

// States
export const STATE_IDLE = "IDLE";
export const STATE_MOVING = "MOVING";
export const STATE_ATTACKING = "ATTACKING";
export const STATE_INTERACTING = "INTERACTING";

export class Character extends GameObject {
  constructor(config = {}) {
    super({
      position: config.position ?? new Vector2(0, 0),
    });

    // Movement
    this.facingDirection = config.facingDirection ?? DOWN;
    this.destinationPosition = this.position.duplicate();
    this.speed = config.speed ?? 1;
    // Base speed — the un-modified value. Terrain effects (e.g. stairs)
    // mutate `this.speed`, then restore to `_baseSpeed` once off the terrain.
    this._baseSpeed = this.speed;
    this.suspendOnPause = true;

    // Attack — animation drives end timing (body.animations.isFinished()),
    // so we don't carry a parallel attackTimer/attackDuration here anymore.
    this.attackBuffered = false;
    this.attackRecoveryTimer = 0; //NOTE: i can set it to 80?
    this.attackDirection = null; // Locked direction during attack
    this.equippedWeapon = null;
    this.ammo = null;

    // Team (for combat targeting: "neutral", "player", "enemy")
    this.team = config.team ?? "neutral";

    // Controller
    this.controller = null;

    this.isSolid = config.isSolid ?? true;

    // Shadow
    this.shadow = new Sprite({
      resource: resources.images.shadow,
      frameSize: new Vector2(32, 32),
      position: config.shadowOffset ?? new Vector2(-8, -18),
    });
    // this.shadow.drawOrder = 0;
    // this.addChild(this.shadow);

    // Body
    this.body = new Sprite({
      resource: config.spriteResource,
      frameSize: config.frameSize ?? new Vector2(32, 32),
      hFrames: config.hFrames ?? 4,
      vFrames: config.vFrames ?? 8,
      frame: config.frame ?? 0,
      position: config.bodyOffset ?? new Vector2(-8, -20),
      animations: config.animations ?? null,
    });
    this.body.drawOrder = 1;
    this.addChild(this.body);

    // State machine (after sprites are ready)
    this._setupStateMachine();
  }

  _setupStateMachine() {
    this.stateMachine = new StateMachine(this);
    this.stateMachine.registerState(STATE_IDLE, new IdleState());
    this.stateMachine.registerState(STATE_MOVING, new MovingState());
    this.stateMachine.registerState(STATE_ATTACKING, new AttackingState());
    this.stateMachine.registerState(STATE_INTERACTING, new InteractingState());
    this.stateMachine.registerState(STATE_HIT, new HitState());
    this.stateMachine.changeState(STATE_IDLE);
  }

  get state() {
    return this.stateMachine.getCurrentStateName();
  }

  set state(stateName) {
    this.stateMachine.changeState(stateName);
  }

  ready() {
    this.playIdleAnimation();
  }

  /**
   * Adjust `this.speed` based on the tile we're on or moving toward.
   * Called by MovingState on each move so terrain effects (stairs) apply
   * naturally per-move. Restores to `_baseSpeed` when off the terrain.
   *
   * Current rule: if either endpoint of the current move is on a tile
   * with non-zero elevation (i.e. a stair), halve the speed.
   */
  updateSpeedFromTerrain() {
    const level = this.parent;
    if (!level || typeof level.getElevationAt !== "function") return;
    const onStair =
      level.getElevationAt(this.position.x, this.position.y) !== 0 ||
      level.getElevationAt(this.destinationPosition.x, this.destinationPosition.y) !== 0;
    this.speed = onStair ? this._baseSpeed * 0.5 : this._baseSpeed;
  }

  setController(controller) {
    this.controller = controller;
  }

  equip(weapon) {
    this.equippedWeapon = weapon;
    this.ammo = this.equippedWeapon.ammo;
    // this.controller?.movementThreshold = 0;
  }

  unequip() {
    this.equippedWeapon = null;
    this.ammo = null;
    // this.controller?.movementThreshold = 80;
  }

  hasArrivedAtDestination() {
    return (
      Math.abs(this.position.x - this.destinationPosition.x) <= 1 &&
      Math.abs(this.position.y - this.destinationPosition.y) <= 1
    );
  }

  step(delta, root) {
    // Controller runs unless current state blocks it
    if (!this.stateMachine.currentState?.blocksController) {
      this.controller?.update(delta, root);

      //currently set to 0 - never enters -- set in AttackingState
      if (this.attackRecoveryTimer > 0) {
        this.attackRecoveryTimer -= delta;
      }
    }

    // Delegate to current state
    this.stateMachine.update(delta, root);
  }

  // ====================
  // COMBAT API
  // ====================

  takeHit(damage, attackDirection) {
    if (this.state === STATE_HIT) return;
    this._hitDirection = attackDirection ?? null;
    this.state = STATE_HIT;
  }

  // --------------------
  // ATTACK
  // --------------------

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
    const anim = `${attackType}_${this.getDirectionKey()}`;
    const pattern = this.body.animations?.patterns?.[anim];
    if (!pattern) return;

    // Kill movement completely
    this.destinationPosition = this.position.duplicate();

    // Lock direction for the duration of the attack
    this.attackDirection = this.facingDirection;

    this.state = STATE_ATTACKING;
    this.body.animations.play(anim);
  }

  launchProjectile() {
    if (!this.equippedWeapon?.projectile) return;

    if (this.ammo <= 0) {
      // this.unequip();
      return
    }; 

    const projConfig = this.equippedWeapon.projectile;
    const projectile = new Projectile({
      position: this.position.toNeighbor(this.attackDirection),
      direction: this.attackDirection,
      projectileConfig: projConfig,
      damage: this.equippedWeapon.damage,
      spriteOffset: projConfig.spriteOffset ?? { x: 0, y: 0 },
      team: this.team,
    });

      const level = this.parent;
      const main = level?.parent;
      if (level && main) {
        level.addChild(projectile);
        main.addToYSortedObjects(projectile);
      }
    if (this.ammo != "infinite"){
      this.ammo -= 1;
      console.log("AMMO=", this.ammo);
      events.emit("AMMO_DECREASE", this.ammo)
    }
  }

  // ====================
  // ANIMATIONS
  // ====================

  playIdleAnimation() {
    // if (this.state !== STATE_IDLE) return;
    this.body.animations?.play(`idle_${this.getDirectionKey()}`);
  }

  playWalkAnimation(direction) {
    if (this.state === STATE_ATTACKING) return;
    this.body.animations?.play(`walk_${this.getDirectionKey(direction)}`);
  }

  /** PascalCase, kept for any external consumer that may still need it. */
  getDirectionName(direction = this.facingDirection) {
    switch (direction) {
      case UP: return "Up";
      case DOWN: return "Down";
      case LEFT: return "Left";
      case RIGHT: return "Right";
      default: return "Down";
    }
  }

  /** snake_case — used to construct Aseprite tag keys (walk_down, sword_up, etc.). */
  getDirectionKey(direction = this.facingDirection) {
    switch (direction) {
      case UP: return "up";
      case DOWN: return "down";
      case LEFT: return "left";
      case RIGHT: return "right";
      default: return "down";
    }
  }

  getOppositeDirection(direction = this.facingDirection) {
    return { LEFT: RIGHT, RIGHT: LEFT, UP: DOWN, DOWN: UP }[direction];
  }

  drawImage(ctx, x, y) {
    if (!DEBUG_LAYERS.DRAW_HITBOXES) return;
    if (this.state !== STATE_ATTACKING) return;
    if (!this.equippedWeapon?.hitbox) return;

    const hitboxPositions = getHitboxPositions(
      this.position,
      this.attackDirection,
      this.equippedWeapon.hitbox
    );

    ctx.save();
    ctx.fillStyle = "rgba(255, 0, 0, 0.4)";
    ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
    ctx.lineWidth = 1;

    for (const pos of hitboxPositions) {
      const drawX = pos.x - this.position.x + x;
      const drawY = pos.y - this.position.y + y;
      ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
      ctx.strokeRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
    }

    ctx.restore();
  }
}
