import { GameObject } from "../../GameObject.js";
import { Vector2 } from "../../Vector2.js";

/**
 * A simple interactable sign/marker object.
 * No sprite - the visual is rendered on the tile layer.
 * This object just holds properties (like a message) for the coordinates.
 */
export class Sign extends GameObject {
  constructor(x, y, message = "") {
    super({
      position: new Vector2(x, y)
    });

    // Signs are solid - defined in the collision layer in TIled - no need to add solid body here
    // this.isSolid = false;

    // The message to display when interacted with
    this.message = message;
  }

  /**
   * Returns content for the text box when interacted with
   */
  getContent() {
    if (!this.message) {
      return null;
    }

    return {
      portraitFrame: 0,
      string: this.message,
      addsFlag: null
    };
  }
}
