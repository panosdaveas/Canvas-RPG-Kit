/**
 * Abstract base class for character controllers.
 * Controllers handle the logic for how a character decides to move
 * (player input, AI, scripted paths, etc.)
 */
export class Controller {
  constructor(character) {
    this.character = character;
  }

  /**
   * Called each frame to update the controller's logic.
   * Should set character.destinationPosition, facingDirection, etc.
   * @param {number} delta - Time since last frame in ms
   * @param {Object} root - Root game object with access to input, level, etc.
   */
  update(delta, root) {
    // Override in subclasses
  }

  /**
   * Optional action handler (e.g., interact button pressed)
   * @param {Object} root - Root game object
   */
  onAction(root) {
    // Override in subclasses
  }
}
