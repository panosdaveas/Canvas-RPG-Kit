import { State } from "../State.js";
import { STATE_ATTACKING, STATE_IDLE } from "../../objects/Character/Character.js";
import { getHitboxPositions } from "../../combat/attackHelpers.js";

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

    for (const pos of hitboxPositions) {
      const target = level.children.find(c =>
        c !== this.character &&
        typeof c.takeHit === "function" &&
        c.team !== "neutral" &&
        c.team !== myTeam &&
        c.position.x === pos.x &&
        c.position.y === pos.y
      );
      if (target) {
        target.takeHit(weapon.damage);
        this.hasHit = true;
        return;
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
