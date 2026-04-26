import { Character } from "../../Character.js";
import { Vector2 } from "../../../../Vector2.js";
import { CompanionController } from "../../../../controllers/CompanionController.js";
import { resources } from "../../../../Resource.js";
import { Sprite } from "../../../../Sprite.js";
import { events } from "../../../../Events.js";
import { sword, bow, firearm } from "../../../../combat/weapons/index.js";

const BOUNCE_DURATION = 2000;

export class Companion extends Character {
  constructor(x, y) {
    super({
      position: new Vector2(x, y),
      team: "player",
      isSolid: false,
    });

    this._visualSprite = new Sprite({
      resource: resources.images.companion,
      position: new Vector2(0, -4)
    });
    this.addChild(this._visualSprite);

    // Companion stays active during encounter to run its animation
    this.pauseOnEncounter = false;

    this._encounterActive = false;
    this._heroHasWeapon = false;
    this._weaponPool = [sword, bow, firearm];
    this._bounceTimer = 0;
  }

  ready() {
    this.setController(new CompanionController(this, { followDistance: 1 }));

    events.on("WEAPON_UPEQUIPPED", this, () => {
      this._heroHasWeapon = false;
    });

    events.on("ENEMY_DETECTED", this, () => {
      if (this._encounterActive || this._heroHasWeapon) return;
      this._encounterActive = true;
      this._bounceTimer = BOUNCE_DURATION;
      events.emit("ENCOUNTER_START");
    });

    events.on("WEAPON_SELECTED", this, () => {
      this._encounterActive = false;
      this._heroHasWeapon = true;
    });
  }

  step(delta, root) {
    if (this._bounceTimer > 0) {
      this._bounceTimer -= delta;
      const t = 1 - (this._bounceTimer / BOUNCE_DURATION);
      this._visualSprite.position.y = Math.round(Math.sin(t * Math.PI * 10) * -5);

      if (this._bounceTimer <= 0) {
        this._bounceTimer = 0;
        this._visualSprite.position.y = 0;
        const weapon = this._weaponPool[Math.floor(Math.random() * this._weaponPool.length)];
        events.emit("WEAPON_SELECTED", { weapon });
      }
      return;
    }
    super.step(delta, root);
  }
}
