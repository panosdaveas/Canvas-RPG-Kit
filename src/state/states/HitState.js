import { State } from "../State.js";
import { STATE_IDLE } from "../../objects/Character/Character.js";

export const STATE_HIT = "HIT";

export class HitState extends State {
  constructor() {
    super(STATE_HIT);
    this.blocksController = true;
    this.timer = 0;
    this.flashTimer = 0;
  }

  enter() {
    this.timer = 300;
    this.flashTimer = 0;
    this.character.destinationPosition = this.character.position.duplicate();
    this.character.playIdleAnimation();
  }

  update(delta, root) {
    this.timer -= delta;

    // Flash the sprite
    this.flashTimer -= delta;
    if (this.flashTimer <= 0) {
      this.character.body.visible = !this.character.body.visible;
      this.flashTimer = 60;
    }

    if (this.timer <= 0) {
      this.transitionTo(STATE_IDLE);
    }
  }

  exit() {
    this.character.body.visible = true;
  }
}
