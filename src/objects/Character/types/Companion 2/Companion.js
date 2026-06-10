import { Vector2 } from "../../../../Vector2.js";
import { resources } from "../../../../Resource.js";
import { Sprite } from "../../../../Sprite.js";
import { events } from "../../../../Events.js";
import { GameObject } from "../../../../GameObject.js";
import { StateMachine } from "../../../../state/StateMachine.js";
import { CompanionIdleState } from "../../../../state/states/CompanionIdleState.js";
import { CompanionEquippingState } from "../../../../state/states/CompanionEquippingState.js";
import {
  ACTIVATE_COMPANION,
  DEACTIVATE_COMPANION,
  COMPANION_MODE_IDLE,
  COMPANION_MODE_EQUIP,
} from "./companionConstants.js";

// Re-export so consumers don't need to know about companionConstants.js
export {
  ACTIVATE_COMPANION,
  DEACTIVATE_COMPANION,
  COMPANION_MODE_IDLE,
  COMPANION_MODE_EQUIP,
  COMPANION_MODE_CUTSCENE,
} from "./companionConstants.js";

// "Baked into" the player like a backpack. Lives as a child of Hero, follows
// position automatically, and stays inert until ACTIVATE_COMPANION fires.
// Each mode is a state in the internal state machine — adding a new behavior
// means registering a new state, not extending a switch.
export class Companion extends GameObject {
  constructor() {
    super({
      position: new Vector2(0, 0),
    });

    this.team = "player";
    this.isSolid = false;

    // Hidden + skipped by step until activated.
    this.suspended = true;

    // Keep ticking even when our parent (Hero) is suspended on encounter —
    // that's the whole point of being a "live" companion during a freeze.
    this.ignoreParentSuspend = true;

    // Render in front of Hero's body when active.
    this.drawOrder = 2;

    this._visualSprite = new Sprite({
      resource: resources.images.companion,
      position: new Vector2(0, -4),
    });
    this._visualSprite.visible = false;
    this.addChild(this._visualSprite);

    // Mode-driven behavior. IDLE is the resting state we bounce back to on
    // deactivate so re-activating the same mode replays its enter().
    this.stateMachine = new StateMachine(this);
    this.stateMachine.registerState(COMPANION_MODE_IDLE, new CompanionIdleState());
    this.stateMachine.registerState(COMPANION_MODE_EQUIP, new CompanionEquippingState());
    // Future modes (e.g. COMPANION_MODE_CUTSCENE) register here.
    this.stateMachine.changeState(COMPANION_MODE_IDLE);
  }

  ready() {
    // Self-activate when an enemy is detected and Hero is unarmed.
    // Other callers (cutscenes, scripted events) can emit ACTIVATE_COMPANION
    // directly with a different mode and bypass this gate.
    events.on("ENEMY_DETECTED", this, () => {
      if (this.parent?.equippedWeapon) return;
      events.emit(ACTIVATE_COMPANION, { mode: COMPANION_MODE_EQUIP });
    });

    events.on(ACTIVATE_COMPANION, this, ({ mode } = {}) => {
      if (!mode) return;
      this._activate(mode);
    });

    events.on(DEACTIVATE_COMPANION, this, () => {
      this._deactivate();
    });
  }

  step(delta, root) {
    this.stateMachine.update(delta, root);
  }

  _activate(mode) {
    this.suspended = false;
    this._visualSprite.visible = true;
    // Always bounce through IDLE first so re-activating the same mode
    // re-runs its enter() (StateMachine.changeState no-ops on same-state).
    if (this.stateMachine.getCurrentStateName() === mode) {
      this.stateMachine.changeState(COMPANION_MODE_IDLE);
    }
    this.stateMachine.changeState(mode);
  }

  _deactivate() {
    this.suspended = true;
    this._visualSprite.visible = false;
    this.stateMachine.changeState(COMPANION_MODE_IDLE);
  }
}
