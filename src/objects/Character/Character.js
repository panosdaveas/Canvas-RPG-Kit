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

    // Attack
    this.attackTimer = 0;
    this.attackBuffered = false;
    this.attackRecoveryTimer = 0;
    this.attackDirection = null; // Locked direction during attack
    this.equippedWeapon = null;
    this.weaponSprite = null;
    this.projectileSprite = null;
    this.projectileLaunched = false;

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
    this.shadow.drawOrder = 0;
    // this.addChild(this.shadow);

    // Body
    this.body = new Sprite({
      resource: config.spriteResource,
      frameSize: config.frameSize ?? new Vector2(32, 32),
      hFrames: config.hFrames ?? 3,
      vFrames: config.vFrames ?? 8,
      frame: config.frame ?? 0,
      position: config.bodyOffset ?? new Vector2(-8, -20),
      animations: config.animations ?? null,
    });
    this.body.drawOrder = 2;
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

  setController(controller) {
    this.controller = controller;
  }

  equip(weapon) {
    this.equippedWeapon = weapon;

    // Create weapon sprite from weapon data
    const spriteConfig = weapon.sprite;
    if (spriteConfig && resources.images[spriteConfig.resource]) {
      this.weaponSprite = new Sprite({
        id: weapon.id,
        resource: resources.images[spriteConfig.resource],
        frameSize: new Vector2(spriteConfig.frameSize.x, spriteConfig.frameSize.y),
        hFrames: spriteConfig.hFrames,
        vFrames: spriteConfig.vFrames,
        frame: 0,
        position: new Vector2(0, 0),
      });
      this.weaponSprite.visible = false;
      this.weaponSprite.drawOrder = 3; // Above body
      this.addChild(this.weaponSprite);
    }

    // Create projectile sprite if weapon has projectile config
    const projectileConfig = weapon.projectile;
    if (projectileConfig?.sprite && resources.images[projectileConfig.sprite.resource]) {
      const projSprite = projectileConfig.sprite;
      this.projectileSprite = new Sprite({
        id: projectileConfig.id,
        resource: resources.images[projSprite.resource],
        frameSize: new Vector2(projSprite.frameSize.x, projSprite.frameSize.y),
        hFrames: projSprite.hFrames ?? 1,
        vFrames: projSprite.vFrames ?? 1,
        frame: 0,
        position: new Vector2(0, 0),
      });
      this.projectileSprite.visible = false;
      this.projectileSprite.drawOrder = 1;
      this.addChild(this.projectileSprite);
    }
  }

  unequip() {
    if (this.weaponSprite) {
      this.removeChild(this.weaponSprite);
      this.weaponSprite = null;
    }
    if (this.projectileSprite) {
      this.removeChild(this.projectileSprite);
      this.projectileSprite = null;
    }
    this.equippedWeapon = null;
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
    const anim = `${attackType}${this.getDirectionName()}`;
    const pattern = this.body.animations?.patterns?.[anim];
    if (!pattern) return;

    // Kill movement completely
    this.destinationPosition = this.position.duplicate();

    // Lock direction for the duration of the attack
    this.attackDirection = this.facingDirection;

    // Reset projectile state for this attack
    this.projectileLaunched = false;

    this.state = STATE_ATTACKING;
    this.attackTimer = pattern.duration;
    this.body.animations.play(anim);
  }

  updateWeaponSprite() {
    if (!this.weaponSprite || !this.equippedWeapon || !this.attackDirection) return;

    const attackType = this.equippedWeapon.attackType;
    const animName = `${attackType}${this.getDirectionName(this.attackDirection)}`;
    const weaponFrames = this.equippedWeapon.animations?.[animName];
    if (!weaponFrames || weaponFrames.length === 0) return;

    // Get current animation and sync weapon frame with character frame times
    const pattern = this.body.animations?.patterns?.[animName];
    if (!pattern) return;

    // Find frame index based on character animation's frame times
    const charFrames = pattern.animationConfig.frames;
    let frameIndex = 0;
    for (let i = charFrames.length - 1; i >= 0; i--) {
      if (pattern.currentTime >= charFrames[i].time) {
        frameIndex = i;
        break;
      }
    }
    frameIndex = Math.min(frameIndex, weaponFrames.length - 1);

    const frameData = weaponFrames[frameIndex];

    // Update weapon sprite
    this.weaponSprite.frame = frameData.frame;
    this.weaponSprite.position.x = frameData.offset.x;
    this.weaponSprite.position.y = frameData.offset.y;

    // Show/hide based on visibility
    this.weaponSprite.visible = frameData.visible;

    // When facing up, weapon draws behind player; otherwise in front
    if (frameData.visible) {
      this.weaponSprite.drawOrder = this.attackDirection === UP ? 1 : 3;
    }

    // Handle attached projectile visibility
    this.updateProjectileSprite(frameData);

    // Handle projectile launch
    if (frameData.launch && !this.projectileLaunched) {
      this.launchProjectile();
    }
  }

  updateProjectileSprite(frameData) {
    if (!this.projectileSprite || !this.equippedWeapon?.projectile) return;

    const projectileConfig = this.equippedWeapon.projectile;

    if (frameData.projectileVisible) {
      // Show attached projectile and set frame based on direction
      this.projectileSprite.visible = true;
      this.projectileSprite.drawOrder = this.attackDirection === UP ? 1 : 3;

      // Position projectile at weapon offset + projectile offset
      const projOffset = projectileConfig.offset ?? { x: 0, y: 0 };
      this.projectileSprite.position.x = frameData.offset.x + projOffset.x;
      this.projectileSprite.position.y = frameData.offset.y + projOffset.y;

      // Set frame based on direction
      const flyAnim = `fly${this.getDirectionName(this.attackDirection)}`;
      const flyFrames = projectileConfig.animations?.[flyAnim];
      if (flyFrames && flyFrames.length > 0) {
        this.projectileSprite.frame = flyFrames[0].frame;
      }
    } else {
      this.projectileSprite.visible = false;
    }
  }

  launchProjectile() {
    if (!this.equippedWeapon?.projectile) return;

    this.projectileLaunched = true;

    // Hide attached projectile sprite
    if (this.projectileSprite) {
      this.projectileSprite.visible = false;
    }

    // Create flying projectile at character's position (collision uses grid position)
    const projConfig = this.equippedWeapon.projectile;

    // Use the same sprite offset as the attached arrow had
    const spriteOffset = this.projectileSprite
      ? { x: this.projectileSprite.position.x, y: this.projectileSprite.position.y }
      : { x: 0, y: 0 };

    const projectile = new Projectile({
      position: this.position,
      direction: this.attackDirection,
      projectileConfig: projConfig,
      damage: this.equippedWeapon.damage,
      spriteOffset: spriteOffset,
      team: this.team,
    });

    // Add projectile to the level
    // Hero's parent is Main, enemy's parent is the level
    let main = this.parent;
    let level = main?.level;
    if (!level && main?.parent) {
      level = main;
      main = main.parent;
    }
    if (level && main) {
      level.addChild(projectile);
      main.addToYSortedObjects(projectile);
    }
  }

  hideWeaponSprite() {
    if (this.weaponSprite) {
      this.weaponSprite.visible = false;
    }
    if (this.projectileSprite) {
      this.projectileSprite.visible = false;
    }
  }

  // ====================
  // ANIMATIONS
  // ====================

  playIdleAnimation() {
    // if (this.state !== STATE_IDLE) return;
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
