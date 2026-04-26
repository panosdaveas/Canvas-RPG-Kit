import { GameObject } from "../../GameObject.js";
import { events } from "../../Events.js";
import { resources } from "../../Resource.js";

export class WeaponDisplay extends GameObject {
  constructor() {
    super({ position: null });
    this.drawLayer = "HUD";
    this._weapon = null;

    events.on("WEAPON_SELECTED", this, ({ weapon }) => {
      this._weapon = weapon;
      events.emit("HUD_DIRTY");
    });
  }

  draw(ctx) {
    if (!this._weapon) return;

    const icon = this._weapon.icon;
    if (!icon) return;

    const img = resources.images[icon.resource];
    if (!img?.isLoaded) return;

    const x = 8;
    const y = 8;
    const fw = icon.frameSize.x;
    const fh = icon.frameSize.y;

    ctx.drawImage(img.image, 0, 0, fw, fh, x, y, fw, fh);

    ctx.fillStyle = "#ffffff";
    ctx.font = "8px monospace";
    ctx.textAlign = "left";
    ctx.fillText(this._weapon.name, x + fw + 4, y + fh / 2 + 3);
  }
}
