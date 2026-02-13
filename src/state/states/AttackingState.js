import { State } from "../State.js";
import { STATE_ATTACKING, STATE_IDLE } from "../../objects/Character/Character.js";
import { getHitboxPositions } from "../../combat/attackHelpers.js";
import { TILE_SIZE } from "../../Constants.js";

export class AttackingState extends State {
  constructor() {
    super(STATE_ATTACKING);
    this.hasHit = false;
  }

  enter() {
    this.hasHit = false;
  }

  update(delta, root) {
    this.character.attackTimer -= delta;

    this.character.updateWeaponSprite();

    if (!this.hasHit) {
      this.checkMeleeHit(root);
    }

    if (this.character.attackTimer <= 0) {
      this.transitionTo(STATE_IDLE);
    }
  }

  checkMeleeHit(root) {
    const weapon = this.character.equippedWeapon;
    if (!weapon?.hitbox) return;

    const hitboxPositions = getHitboxPositions(
      this.character.position,
      this.character.attackDirection,
      weapon.hitbox
    );

    const level = root.level;
    if (!level) return;

    const myTeam = this.character.team;

    // Build target list: level children + hero (hero is a child of Main, not level)
    const candidates = [...level.children];
    if (root.hero) candidates.push(root.hero);

    // NOTE: code before intercepting projectiles
    // for (const pos of hitboxPositions) {
    //   const target = candidates.find(c =>
    //     c !== this.character &&
    //     typeof c.takeHit === "function" &&
    //     c.team !== "neutral" &&
    //     c.team !== myTeam &&
    //     c.position.x === pos.x &&
    //     c.position.y === pos.y
    //   );
    //   if (target) {
    //     target.takeHit(weapon.damage, this.character.attackDirection);
    //     this.hasHit = true;
    //   }
    // }

    for (const pos of hitboxPositions) {
      const target = candidates.find(c => {
        if (c === this.character) return false;
        if (c.team === "neutral" || c.team === myTeam) return false;
        if (typeof c.takeHit !== "function" && typeof c.destroyProjectile !== "function") return false;
        const cx = Math.round(c.position.x / TILE_SIZE) * TILE_SIZE;
        const cy = Math.round(c.position.y / TILE_SIZE) * TILE_SIZE;
        return cx === pos.x && cy === pos.y;
      });
      if (target) {
        if (typeof target.destroyProjectile === "function") {
          target.destroyProjectile();
        } else {
          target.takeHit(weapon.damage, this.character.attackDirection);
          this.hasHit = true;
        }
      }
    }
  }

  exit() {
    this.character.attackRecoveryTimer = 120;
    this.character.attackDirection = null;
    this.character.hideWeaponSprite();
    this.character.playIdleAnimation();
  }
}
