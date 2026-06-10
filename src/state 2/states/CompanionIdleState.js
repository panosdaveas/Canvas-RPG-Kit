import { State } from "../State.js";
import { COMPANION_MODE_IDLE } from "../../objects/Character/types/Companion/companionConstants.js";

// No-op resting state. Companion is also `paused`/hidden while in IDLE,
// so update() never runs anyway — this exists so changeState() can be
// used symmetrically (activate → mode, deactivate → IDLE).
export class CompanionIdleState extends State {
  constructor() {
    super(COMPANION_MODE_IDLE);
  }
}
