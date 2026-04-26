import { Vector2 } from "./Vector2.js";
import { events } from "./Events.js";

export class GameObject {
  constructor({ position, drawOrder }) {
    this.position = position ?? new Vector2(0, 0);
    this.children = [];
    this.parent = null;
    this.hasReadyBeenCalled = false;
    this.isSolid = false;
    this.drawLayer = null;
    this.drawOrder = drawOrder ?? 0;
    this.paused = false;
    this.pauseOnEncounter = false;
  }

  // First entry point of the loop
  stepEntry(delta, root) {
    if (!this.hasReadyBeenCalled) {
      this.hasReadyBeenCalled = true;
      this.ready();
    }

    if (this.paused) return;

    this.children.forEach((child) => child.stepEntry(delta, root));
    this.step(delta, root);
  }

  // Called before the first `step`
  ready() {
    // ...
  }

  // Called once every frame
  step(_delta) {
    // ...
  }

  /* draw entry */
  draw(ctx, x, y) {
    const drawPosX = x + this.position.x;
    const drawPosY = y + this.position.y;

    // Do the actual rendering for Images
    this.drawImage(ctx, drawPosX, drawPosY);

    // Pass on to children
    this.getDrawChildrenOrdered().forEach((child) => child.draw(ctx, drawPosX, drawPosY));
  }

  // getDrawChildrenOrdered() {
  //   return [...this.children].sort((a, b) => {

  //     if (b.drawLayer === "FLOOR") {
  //       return 1;
  //     }

  //     return a.position.y > b.position.y ? 1 : -1
  //   })
  // }

  getDrawChildrenOrdered() {
    return [...this.children].sort((a, b) => {
      if (b.drawLayer === "FLOOR") {
        return 1;
      }
      // Primary: explicit draw order (lower = behind, higher = front)
      if (a.drawOrder !== b.drawOrder) {
        return a.drawOrder - b.drawOrder;
      }
      // Secondary: y position for objects with same drawOrder
      return a.position.y - b.position.y;
    });
  }

  drawImage(ctx, drawPosX, drawPosY) {
    //...
  }

  // Remove from the tree
  destroy() {
    this.children.forEach(child => {
      child.destroy();
    })
    this.parent?.removeChild(this)
  }

  // Remove from parent without unsubscribing events (for re-parenting)
  detachChild(gameObject) {
    this.children = this.children.filter(g => gameObject !== g);
    gameObject.parent = null;
  }

  /* Other Game Objects are nestable inside this one */
  addChild(gameObject) {
    gameObject.parent = this;
    this.children.push(gameObject);
  }

  removeChild(gameObject) {
    events.unsubscribe(gameObject);
    this.children = this.children.filter(g => {
      return gameObject !== g;
    })
  }
}