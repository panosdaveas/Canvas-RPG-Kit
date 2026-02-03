import { Character } from "../../Character.js";
import { Vector2 } from "../../../../Vector2.js";
import { resources } from "../../../../Resource.js";
import { events } from "../../../../Events.js";
import { PlayerController } from "../../../../controllers/PlayerController.js";
import { createHeroAnimations } from "../../characterAnimations.js";
import { dagger } from "../../../../combat/weapons/index.js";

export class Hero extends Character {
  constructor(x, y) {
    super({
      position: new Vector2(x, y),
      spriteResource: resources.images.hero,
      animations: createHeroAnimations(),
      frameSize: new Vector2(32, 32),
      hFrames: 3,
      vFrames: 8,
      frame: 1,
      bodyOffset: new Vector2(-8, -20),
      shadowOffset: new Vector2(-8, -18),
      isSolid: true
    });

    // Hero-specific properties
    this.itemPickupTime = 0;
    this.itemPickupShell = null;

    // React to picking up an item
    events.on("HERO_PICKS_UP_ITEM", this, data => {
      this.onPickUpItem(data);
    });
  }

  ready() {
    // Set up player controller
    this.setController(new PlayerController(this));

    // Equip starting weapon
    this.equip(dagger);

    // Listen for action finished events
    events.on("HERO_ACTION_FINISHED", this, () => {
      this.isLocked = false;
    });

    // Emit initial position so chunks load
    events.emit("HERO_POSITION", this.position);
    this.lastX = this.position.x;
    this.lastY = this.position.y;
  }

  step(delta, root) {
    // Don't do anything when locked
    if (this.isLocked) {
      this.playIdleAnimation();
      return;
    }

    // Lock movement if celebrating an item pickup
    if (this.itemPickupTime > 0) {
      this.workOnItemPickup(delta);
      return;
    }

    // Let the base Character class handle controller + movement
    super.step(delta, root);

    // Emit position if changed
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

  workOnItemPickup(delta) {
    this.itemPickupTime -= delta;
    this.body.animations.play("pickUpDown");

    // Remove the item being held overhead
    if (this.itemPickupTime <= 0) {
      // this.itemPickupShell.destroy();
    }
  }

  onPickUpItem(data) {
    this.destinationPosition = this.position.duplicate();
    this.itemPickupTime = 500;
    // Implemented by subclass or via event handler
    // data should contain item info
  }
}
