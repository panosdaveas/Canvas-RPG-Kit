import { State } from "../State.js";
import { STATE_IDLE } from "../../objects/Character/Character.js";
import { moveTowards } from "../../helpers/moveTowards.js";
import { events } from "../../Events.js";

export const STATE_ENTRY = "ENTRY";

export class EntryState extends State {
  constructor() {
    super(STATE_ENTRY);
    this.blocksController = true;
  }

  enter() {
    const dir = this.character.facingDirection;
    const oppositeDir = this.character.getOppositeDirection(dir);

    // Snap hero one tile back from spawn, walk forward to spawn
    const target = this.character.position.duplicate();
    const startPos = this.character.position.toNeighbor(oppositeDir);

    this.character.position.x = startPos.x;
    this.character.position.y = startPos.y;
    this.character.destinationPosition.x = target.x;
    this.character.destinationPosition.y = target.y;

    this.startY = startPos.y;

    this.character.playWalkAnimation(dir);
  }

  update(delta, root) {
    moveTowards(this.character, this.character.destinationPosition, this.character.speed);

    if (this.character.hasArrivedAtDestination()) {
      this.character.position.x = this.character.destinationPosition.x;
      this.character.position.y = this.character.destinationPosition.y;

      if (this.character.position.y !== this.startY) {
        events.emit("YSORT_DIRTY");
      }

      this.transitionTo(STATE_IDLE);
    }
  }
}
