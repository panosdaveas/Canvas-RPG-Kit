import { Controller } from "./Controller.js";
import { DOWN, LEFT, RIGHT, UP } from "../Input.js";
import { STATE_IDLE } from "../objects/Character/Character.js";
import { isTileFree } from "../helpers/grid.js";
import { TILE_SIZE } from "../Constants.js";
import { events } from "../Events.js";

export class EnemyController extends Controller {
  constructor(character, config = {}) {
    super(character);
    const weapon = character.equippedWeapon;

    // attackRange — how close the enemy must be to hit. Always the weapon's
    // hitbox range (in tiles): 1 for sword, 8 for bow, etc.
    this.attackRange = weapon.hitbox?.range ?? 1;

    // detectionRange — how far the enemy can "see" the hero. Projectile
    // weapons (bow, firearm) detect at exactly their attack range — no point
    // chasing if you can already shoot. Melee weapons have a wider detection
    // range than attack range, so the enemy closes the gap before swinging.
    this.detectionRange = weapon.projectile
      ? this.attackRange
      : (weapon.detectionRange ?? 5);

    // attackCooldown — integer ms between attack attempts, per weapon.
    this.attackCooldown = weapon.cooldown ?? config.attackCooldown ?? 1500;

    this.attackTimer = 0;
    this.heroPosition = null;
    this._heroInRange = false;

    events.on("HERO_POSITION", this, (pos) => {
      this.heroPosition = pos;
    });

    events.on("WEAPON_UPEQUIPPED", this, () => {
      this._heroInRange = false;
    });
  }

  update(delta, root) {
    const character = this.character;

    if (this.attackTimer > 0) this.attackTimer -= delta;

    // Only act when idle and grid-aligned
    if (character.state !== STATE_IDLE || !character.hasArrivedAtDestination()) return;
    if (!this.heroPosition) return;

    const dx = this.heroPosition.x - character.position.x;
    const dy = this.heroPosition.y - character.position.y;
    const dist = (Math.abs(dx) + Math.abs(dy)) / TILE_SIZE;

    const inRange = dist <= this.detectionRange;
    if (!this._heroInRange && inRange) {
      events.emit("ENEMY_DETECTED", { enemy: character });
    }
    this._heroInRange = inRange;

    if (!inRange) {
      character.playIdleAnimation();
      return;
    }

    // In attack range → must be aligned on same axis (cardinal only)
    const absDx = Math.abs(dx) / TILE_SIZE;
    const absDy = Math.abs(dy) / TILE_SIZE;
    const aligned = (absDx === 0 && absDy <= this.attackRange)
                 || (absDy === 0 && absDx <= this.attackRange);

    if (aligned) {
      if (this.attackTimer <= 0) {
        const attackDir = this.directionToward(dx, dy);
        if (character.facingDirection !== attackDir) {
          character.facingDirection = attackDir;
          character.playIdleAnimation();
          return;
        }
        character.attack();
        this.attackTimer = this.attackCooldown;
      } else {
        character.playIdleAnimation();
      }
      return;
    }

    const candidates = root.level?.children ? [...root.level.children] : [];

    // Within attack range but not aligned → try either axis to align
    const inAttackRange = absDx <= this.attackRange && absDy <= this.attackRange;
    if (inAttackRange) {
      const primary = this.directionToward(dx, dy);
      const secondary = this.secondaryDirection(dx, dy);
      const directions = secondary ? [secondary, primary] : [primary];

      for (const dir of directions) {
        const next = character.position.toNeighbor(dir);
        if (isTileFree(root.level?.walls, candidates, next.x, next.y, character)) {
          character.facingDirection = dir;
          character.destinationPosition.x = next.x;
          character.destinationPosition.y = next.y;
          character.playWalkAnimation(dir);
          return;
        }
      }
      character.playIdleAnimation();
      return;
    }

    // Outside attack range → chase toward hero
    const primary = this.directionToward(dx, dy);
    const secondary = this.secondaryDirection(dx, dy);
    const directions = secondary
      ? [primary, secondary]
      : [primary, ...this.perpendicularDirections(primary)];

    for (const dir of directions) {
      const next = character.position.toNeighbor(dir);
      if (isTileFree(root.level?.walls, candidates, next.x, next.y, character)) {
        character.facingDirection = dir;
        character.destinationPosition.x = next.x;
        character.destinationPosition.y = next.y;
        character.playWalkAnimation(dir);
        return;
      }
    }

    // All directions blocked
    character.playIdleAnimation();
  }

  directionToward(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? RIGHT : LEFT;
    }
    return dy > 0 ? DOWN : UP;
  }

  secondaryDirection(dx, dy) {
    if (dx === 0 || dy === 0) return null;
    if (Math.abs(dx) > Math.abs(dy)) {
      return dy > 0 ? DOWN : UP;
    }
    return dx > 0 ? RIGHT : LEFT;
  }

  perpendicularDirections(dir) {
    if (dir === UP || dir === DOWN) return [RIGHT, LEFT];
    return [DOWN, UP];
  }
}
