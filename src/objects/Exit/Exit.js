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
  }

  ready() {
    events.on("HERO_POSITION", this, pos => {
      // detect overlap...
      const roundedHeroX = Math.round(pos.x);
      const roundedHeroY = Math.round(pos.y);
      if (roundedHeroX === this.position.x && roundedHeroY === this.position.y) {
        events.emit("HERO_EXITS", { targetMap: this.targetMap })
      }
    })
  }
}