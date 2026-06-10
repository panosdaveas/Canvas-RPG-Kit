import { State } from "../State.js";
import { STATE_IDLE, STATE_MOVING } from "../../objects/Character/Character.js";

export class IdleState extends State {
  constructor() {
    super(STATE_IDLE);
  }

  enter() {
    // this.character.playIdleAnimation();               
    // Don't force idle animation here — the controller handles it.
    // Forcing it would interrupt walk animations on every tile arrival.
  }

  update(delta, root) {
    if (!this.character.hasArrivedAtDestination()) {
      this.transitionTo(STATE_MOVING);
    }
  }
}
