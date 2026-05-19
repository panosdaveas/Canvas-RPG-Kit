import { Character, STATE_IDLE } from "../../Character.js";
import { Vector2 } from "../../../../Vector2.js";
import { resources } from "../../../../Resource.js";
import { events } from "../../../../Events.js";
import { PlayerController } from "../../../../controllers/PlayerController.js";
import { ItemPickupState, STATE_ITEM_PICKUP } from "../../../../state/states/ItemPickupState.js";
import { EntryState, STATE_ENTRY } from "../../../../state/states/EntryState.js";
import { Companion } from "../Companion/Companion.js";

export class Hero extends Character {
  constructor(x, y) {
    // Pull animations + spritesheet from the Aseprite bundle. Each Character
    // gets a fresh Animations instance via createAnimations() so playback
    // state isn't shared between instances.
    const aseprite = resources.aseprite.protagonist;
    super({
      position: new Vector2(x, y),
      spriteResource: aseprite.image,
      animations: aseprite.createAnimations(),
      frameSize: new Vector2(aseprite.frameSize.w, aseprite.frameSize.h),
      hFrames: aseprite.hFrames,
      vFrames: aseprite.vFrames,
      frame: 0,
      bodyOffset: new Vector2(-28, -36),
      shadowOffset: new Vector2(-8, -18),
      isSolid: true,
      team: "player"
    });


    // Hero-specific properties
    this.itemPickupTime = 0;
    this.itemPickupShell = null;

    // Companion is "baked into" Hero — lives as a child so it travels along
    // on level transitions automatically. Inert until ACTIVATE_COMPANION fires.
    this.companion = new Companion();
    this.addChild(this.companion);

    // React to picking up an item
    events.on("HERO_PICKS_UP_ITEM", this, data => {
      this.onPickUpItem(data);
    });
  }

  _setupStateMachine() {
    super._setupStateMachine();
    this.stateMachine.registerState(STATE_ITEM_PICKUP, new ItemPickupState());
    this.stateMachine.registerState(STATE_ENTRY, new EntryState());
  }

  ready() {
    super.ready(); // play initial idle anim — without this the body keeps the
                   // default activeKey (first pattern in the Aseprite export,
                   // usually walk_<dir>) and animates in place until input changes it.

    // Set up player controller
    this.setController(new PlayerController(this));

    // Equip starting weapon
    // this.equip(sword);
    // this.equip(boomerang);
    // this.equip(bow);

    // Listen for action finished events
    events.on("HERO_ACTION_FINISHED", this, () => {
      this.state = STATE_IDLE;
    });

    // Self-equip on WEAPON_SELECTED so equip flows that don't have a direct
    // Hero reference (e.g. Companion picking a weapon for us) still work.
    // PlayerController also calls equip() directly for fast weapon hot-swap;
    // the second equip via this listener is idempotent.
    events.on("WEAPON_SELECTED", this, ({ weapon } = {}) => {
      if (weapon) this.equip(weapon);
    });

    // Emit initial position so chunks load
    events.emit("HERO_POSITION", this.position);
    this.lastX = this.position.x;
    this.lastY = this.position.y;
  }

  step(delta, root) {
    super.step(delta, root);
    this.tryEmitPosition();
  }

  tryEmitPosition() {
    if (this.lastX === this.position.x && this.lastY === this.position.y) {
      return;
    }
    this.lastX = this.position.x;
    this.lastY = this.position.y;
    events.emit("HERO_POSITION", this.position);
  }

  onPickUpItem(data) {
    this.itemPickupTime = 500;
    this.state = STATE_ITEM_PICKUP;
  }
}
