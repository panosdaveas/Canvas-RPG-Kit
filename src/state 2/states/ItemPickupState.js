import { State } from "../State.js";
import { STATE_IDLE } from "../../objects/Character/Character.js";

export const STATE_ITEM_PICKUP = "ITEM_PICKUP";

export class ItemPickupState extends State {
  constructor() {
    super(STATE_ITEM_PICKUP);
    this.blocksController = true;
  }

  enter() {
    this.character.destinationPosition = this.character.position.duplicate();
  }

  update(delta, root) {
    this.character.itemPickupTime -= delta;
    this.character.body.animations.play("pickUpDown");

    if (this.character.itemPickupTime <= 0) {
      this.transitionTo(STATE_IDLE);
    }
  }

  exit() {
    this.character.itemPickupTime = 0;
  }
}
