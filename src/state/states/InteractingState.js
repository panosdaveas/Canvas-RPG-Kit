import { State } from "../State.js";
import { STATE_INTERACTING } from "../../objects/Character/Character.js";

export class InteractingState extends State {
  constructor() {
    super(STATE_INTERACTING);
    this.blocksController = true;
  }

  enter() {
    this.character.playIdleAnimation();
  }

  update(delta, root) {
    this.character.playIdleAnimation();
  }
}
