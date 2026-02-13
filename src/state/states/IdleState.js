import { State } from "../State.js";
import { STATE_IDLE, STATE_MOVING } from "../../objects/Character/Character.js";

export class IdleState extends State {
  constructor() {
    super(STATE_IDLE);
  }

  enter() {
    this.character.playIdleAnimation();
  }

  update(delta, root) {
    if (!this.character.hasArrivedAtDestination()) {
      this.transitionTo(STATE_MOVING);
    }
  }
}
