import {GameObject} from "../../GameObject.js";
import {Vector2} from "../../Vector2.js";
import {events} from "../../Events.js";

export class Exit extends GameObject {
  constructor(x, y, targetMap = null) {
    super({
      position: new Vector2(x,y)
    });

    this.drawLayer = "FLOOR";
    this.targetMap = targetMap;
    // Suppress overlap trigger while Hero is in HitState so a knockback
    // can't accidentally exit the level.
    this._ignoreHero = false;
  }

  ready() {
    events.on("HERO_HIT_START", this, () => { this.isSolid = true; this._ignoreHero = true; });
    events.on("HERO_HIT_END",   this, () => { this.isSolid = false; this._ignoreHero = false; });

    events.on("HERO_POSITION", this, pos => {
      if (this._ignoreHero) return;
      // detect overlap...
      const roundedHeroX = Math.round(pos.x);
      const roundedHeroY = Math.round(pos.y);
      if (roundedHeroX === this.position.x && roundedHeroY === this.position.y) {
        events.emit("HERO_EXITS", { targetMap: this.targetMap })
      }
    })
  }
}