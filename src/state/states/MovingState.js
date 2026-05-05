import { State } from "../State.js";
import { STATE_IDLE, STATE_MOVING } from "../../objects/Character/Character.js";
import { moveTowards } from "../../helpers/moveTowards.js";
import { events } from "../../Events.js";

export class MovingState extends State {
  constructor() {
    super(STATE_MOVING);
  }

  enter() {
    this.startY = this.character.position.y;
  }

  update(delta, root) {
    moveTowards(this.character, this.character.destinationPosition, this.character.speed);

    if (this.character.hasArrivedAtDestination()) {
      this.character.position.x = this.character.destinationPosition.x;
      this.character.position.y = this.character.destinationPosition.y;

      if (this.character.position.y !== this.startY) {
        events.emit("YSORT_DIRTY");
      }

      // Buffered attack fires immediately after arrival
      if (this.character.attackBuffered) {
        this.character.attackBuffered = false;
        this.character.startAttack();
        return;
      }

      this.transitionTo(STATE_IDLE);
    }
  }
}
