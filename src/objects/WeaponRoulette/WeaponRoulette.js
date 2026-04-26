import { GameObject } from "../../GameObject.js";
import { events } from "../../Events.js";
import { CANVAS } from "../../Constants.js";

export class WeaponRoulette extends GameObject {
  constructor(weaponPool) {
    super({});
    this.drawLayer = "HUD";

    // Pick up to 3 unique weapons randomly from the pool
    const shuffled = [...weaponPool].sort(() => Math.random() - 0.5);
    this.options = shuffled.slice(0, 3);
  }

  step(delta, root) {
    const input = root.input;
    if (!input) return;

    if (input.getActionJustPressed("Digit1") && this.options[0]) {
      this._select(this.options[0]);
    } else if (input.getActionJustPressed("Digit2") && this.options[1]) {
      this._select(this.options[1]);
    } else if (input.getActionJustPressed("Digit3") && this.options[2]) {
      this._select(this.options[2]);
    }
  }

  _select(weapon) {
    events.emit("WEAPON_SELECTED", { weapon });
    this.destroy();
  }

  draw(ctx) {
    const cw = CANVAS.WIDTH;
    const ch = CANVAS.HEIGHT;
    const panelW = 220;
    const panelH = 30 + this.options.length * 28 + 16;
    const px = (cw - panelW) / 2;
    const py = (ch - panelH) / 2;

    // Dim overlay
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, cw, ch);

    // Panel background
    ctx.fillStyle = "#1a1a2e";
    ctx.strokeStyle = "#e2c97e";
    ctx.lineWidth = 2;
    ctx.fillRect(px, py, panelW, panelH);
    ctx.strokeRect(px, py, panelW, panelH);

    // Title
    ctx.fillStyle = "#e2c97e";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Choose your weapon", cw / 2, py + 20);

    // Options
    ctx.font = "11px monospace";
    this.options.forEach((weapon, i) => {
      const rowY = py + 44 + i * 28;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.fillText(`[${i + 1}]  ${weapon.name}`, px + 20, rowY);
    });

    ctx.restore();
  }
}
