import { State } from "../State.js";
import { STATE_ATTACKING, STATE_IDLE } from "../../objects/Character/Character.js";

export class AttackingState extends State {
  constructor() {
    super(STATE_ATTACKING);
  }

  update(delta, root) {
    this.character.attackTimer -= delta;

    this.character.updateWeaponSprite();

    if (this.character.attackTimer <= 0) {
      this.transitionTo(STATE_IDLE);
    }
  }

  exit() {
    this.character.attackRecoveryTimer = 120;
    this.character.attackDirection = null;
    this.character.hideWeaponSprite();
    this.character.playIdleAnimation();
  }
}
