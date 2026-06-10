import { State } from "../State.js";
import { events } from "../../Events.js";
import * as weapons from "../../combat/weapons/index.js";
import {
  COMPANION_MODE_EQUIP,
  DEACTIVATE_COMPANION,
} from "../../objects/Character/types/Companion/companionConstants.js";

const BOUNCE_DURATION = 2000;
const BOUNCE_AMPLITUDE = -5;     // peak Y offset (negative = up)
const BOUNCE_FREQUENCY = 10;     // sine cycles over the full duration

export class CompanionEquippingState extends State {
  constructor() {
    super(COMPANION_MODE_EQUIP);
    this._weaponPool = Object.values(weapons);
  }

  enter() {
    this._timer = BOUNCE_DURATION;
    // Capture the sprite's resting Y so we can restore it on exit.
    const sprite = this.context._visualSprite;
    this._spriteBaseY = sprite ? sprite.position.y : 0;

    // This mode needs the world frozen while we pick a weapon.
    events.emit("WORLD_PAUSE");
  }

  update(delta) {
    this._timer -= delta;

    const sprite = this.context._visualSprite;
    if (sprite) {
      const t = 1 - (this._timer / BOUNCE_DURATION);
      sprite.position.y = this._spriteBaseY + Math.round(
        Math.sin(t * Math.PI * BOUNCE_FREQUENCY) * BOUNCE_AMPLITUDE
      );
    }

    if (this._timer <= 0) {
      const weapon = this._weaponPool[Math.floor(Math.random() * this._weaponPool.length)];
      events.emit("WEAPON_SELECTED", { weapon });
      events.emit("WORLD_RESUME");
      events.emit(DEACTIVATE_COMPANION);
    }
  }

  exit() {
    const sprite = this.context._visualSprite;
    if (sprite) sprite.position.y = this._spriteBaseY;
  }
}
