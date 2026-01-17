import {GameObject} from "../../GameObject.js";
import {Vector2} from "../../Vector2.js";
import {events} from "../../Events.js";

export class Exit extends GameObject {
  constructor(x, y) {
    super({
      position: new Vector2(x,y)
    });

    this.drawLayer = "FLOOR";
  }

  ready() {
    events.on("HERO_POSITION", this, pos => {
      // detect overlap...
      const roundedHeroX = Math.round(pos.x);
      const roundedHeroY = Math.round(pos.y);
      if (roundedHeroX === this.position.x && roundedHeroY === this.position.y) {
        events.emit("HERO_EXITS")
      }
    })
  }
}