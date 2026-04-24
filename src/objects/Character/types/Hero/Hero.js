import { Character, STATE_IDLE } from "../../Character.js";
import { Vector2 } from "../../../../Vector2.js";
import { resources } from "../../../../Resource.js";
import { events } from "../../../../Events.js";
import { PlayerController } from "../../../../controllers/PlayerController.js";
import { createHeroAnimations } from "../../characterAnimations.js";
import { ItemPickupState, STATE_ITEM_PICKUP } from "../../../../state/states/ItemPickupState.js";
import { EntryState, STATE_ENTRY } from "../../../../state/states/EntryState.js";

export class Hero extends Character {
  constructor(x, y) {
    super({
      position: new Vector2(x, y),
      spriteResource: resources.images.hero,
      animations: createHeroAnimations(),
      frameSize: new Vector2(72, 72),
      hFrames: 4,
      vFrames: 16,
      frame: 1,
      bodyOffset: new Vector2(-28, -36),
      shadowOffset: new Vector2(-8, -18),
      isSolid: true,
      team: "player"
    });

    // Hero-specific properties
    this.itemPickupTime = 0;
    this.itemPickupShell = null;

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
