import { TILE_SIZE } from "./Constants";
/**
 * Global game state that persists across levels and scenes.
 * Use this for state that needs to be accessed from multiple places.
 */
class GlobalState {
  constructor() {
    // Saved positions for returning to previous locations
    this.savedOverworldPosition = null;

    // Add more global state here as needed:
    // this.currentQuest = null;
    // this.playerStats = {};
    // this.gameTime = 0;
  }

  /**
   * Save a position for later retrieval (e.g., when returning from an interior)
   */
  saveOverworldPosition(position, facingDirection) {
    this.savedOverworldPosition = position.duplicate();
    this.savedOverworldPosition.x = Math.round(this.savedOverworldPosition.x);
    this.savedOverworldPosition.y = Math.round(this.savedOverworldPosition.y);
    if (facingDirection === "UP") {
      this.savedOverworldPosition.y += TILE_SIZE;
    } else if (facingDirection === "DOWN") {
      this.savedOverworldPosition.y -= TILE_SIZE;
    } else if (facingDirection === "LEFT") {
      this.savedOverworldPosition.x += TILE_SIZE;
    } else if (facingDirection === "RIGHT") {
      this.savedOverworldPosition.x -= TILE_SIZE;
    }
    console.log("GlobalState: Saved overworld position:", this.savedOverworldPosition);
  }

  /**
   * Get the saved overworld position
   */
  getOverworldPosition() {
    return this.savedOverworldPosition;
  }

  /**
   * Clear the saved overworld position
   */
  clearOverworldPosition() {
    this.savedOverworldPosition = null;
  }
}

// Export singleton instance
export const globalState = new GlobalState();
