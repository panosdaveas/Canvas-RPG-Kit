import { State } from "../State.js";
import { STATE_IDLE, STATE_MOVING } from "../../objects/Character/Character.js";
import { moveTowards } from "../../helpers/moveTowards.js";
import { events } from "../../Events.js";

export class MovingState extends State {
  constructor() {
    super(STATE_MOVING);
  }

  update(delta, root) {
    const prevY = this.character.position.y;

    moveTowards(this.character, this.character.destinationPosition, this.character.speed);

    if (this.character.hasArrivedAtDestination()) {
      this.character.position.x = this.character.destinationPosition.x;
      this.character.position.y = this.character.destinationPosition.y;

      // Buffered attack fires immediately after arrival
      if (this.character.attackBuffered) {
        this.character.attackBuffered = false;
        this.character.startAttack();
        return;
      }

      this.transitionTo(STATE_IDLE);
    }

    if (this.character.position.y !== prevY) {
      events.emit("YSORT_DIRTY");
    }
  }
}
