import { State } from "../State.js";
import { STATE_ATTACKING, STATE_IDLE } from "../../objects/Character/Character.js";
import { getHitboxPositions } from "../../combat/attackHelpers.js";
import { snapToGrid } from "../../helpers/grid.js";

export class AttackingState extends State {
  constructor() {
    super(STATE_ATTACKING);
    this.hasHit = false;
    this.hasLaunched = false;
  }

  enter() {
    this.hasHit = false;
    this.hasLaunched = false;
  }

  update(delta, root) {
    if (!this.hasHit) {
      this.checkMeleeHit(root);
    }

    // Projectile launch is driven by tag User Data: {"launchFrame": N},
    // where N is the 0-based frame index *within the tag*. Authored in Aseprite
    // (or hand-edited in the JSON) — gameplay code stays out of timing.
    const animations = this.character.body.animations;
    const data = animations.getUserData();
    if (!this.hasLaunched && data?.launchFrame !== undefined) {
      if (animations.getFrameIndex() >= data.launchFrame) {
        this.character.launchProjectile();
        this.hasLaunched = true;
      }
    }

    // The attack ends when the attack animation ends.
    if (animations.isFinished()) {
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

    const candidates = [...level.children];

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
        const cx = snapToGrid(c.position.x);
        const cy = snapToGrid(c.position.y);
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
    this.character.attackRecoveryTimer = 40;
    this.character.attackDirection = null;
    this.character.playIdleAnimation();
  }
}
