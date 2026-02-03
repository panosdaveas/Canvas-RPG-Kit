// Hitbox shape constants
export const HITBOX_FRONT = "front";     // 1 tile ahead
export const HITBOX_ARC = "arc";         // 3 tiles in front arc
export const HITBOX_LINE = "line";       // Multiple tiles in line

/**
 * Get target positions based on hitbox shape
 * @param {Vector2} position - Attacker position
 * @param {string} direction - Facing direction
 * @param {Object} hitbox - { range, shape }
 * @returns {Vector2[]} Array of positions to check
 */
export function getHitboxPositions(position, direction, hitbox) {
  const positions = [];

  if (hitbox.shape === HITBOX_FRONT) {
    // Single tile in facing direction
    positions.push(position.toNeighbor(direction));
  }
  // Add more shapes as needed

  return positions;
}
