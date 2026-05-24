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
    this.suspended = false;
    this.suspendOnPause = false;
    // When this object is suspended, its children halt with it by default.
    // A child can set `ignoreParentSuspend = true` to keep ticking anyway —
    // used by Companion so it animates while Hero is suspended.
    this.ignoreParentSuspend = false;
  }

  // First entry point of the loop
  stepEntry(delta, root) {
    if (!this.hasReadyBeenCalled) {
      this.hasReadyBeenCalled = true;
      this.ready();
    }

    // `paused` halts the entire subtree (this + descendants), no opt-out.
    if (this.paused) return;

    // `suspended` halts only this node's own step. Children freeze with us
    // unless they explicitly opt out via `ignoreParentSuspend`.
    this.children.forEach((child) => {
      if (this.suspended && !child.ignoreParentSuspend) return;
      child.stepEntry(delta, root);
    });

    if (this.suspended) return;

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
    // 0 or 1 children: nothing to sort, return the list directly. Skips the
    // per-frame array allocation + sort for the common case (most leaf
    // objects have no children; even Hero has just body + companion).
    if (this.children.length < 2) return this.children;
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

    // Deregister from any ancestor's Y-sort list (e.g. Main._sortedObjects).
    // No-op for objects that were never registered.
    let node = this.parent;
    while (node) {
      if (typeof node.removeFromYSortedObjects === 'function') {
        node.removeFromYSortedObjects(this);
        break;
      }
      node = node.parent;
    }

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