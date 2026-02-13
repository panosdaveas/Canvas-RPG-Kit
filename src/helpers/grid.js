export const gridCells = n => {
  return n * 16;
}

/**
 * Encode x,y coordinates into a single 32-bit number for efficient Set storage.
 * Uses bit shifting: upper 16 bits for X, lower 16 bits for Y.
 * Supports coordinates from 0 to 65535 (plenty for tile-based maps).
 */
export const encodeCoord = (x, y) => {
  return ((x & 0xFFFF) << 16) | (y & 0xFFFF);
}

/**
 * Decode a numeric key back into x,y coordinates.
 * Returns { x, y } object.
 */
export const decodeCoord = (key) => {
  return {
    x: (key >>> 16) & 0xFFFF,
    y: key & 0xFFFF
  };
}

export const isSpaceFree = (walls, x, y) => {
  const key = encodeCoord(x, y);
  const isWallPresent = walls.has(key);
  return !isWallPresent;
}

/**
 * Check if a tile is free of walls and solid objects.
 * @param {Set} walls - Wall collision set
 * @param {Array} children - Array of game objects to check for solids
 * @param {number} x - Target tile X
 * @param {number} y - Target tile Y
 * @param {GameObject} [exclude] - Object to skip (e.g. the moving character itself)
 * @returns {boolean} true if the tile is walkable
 */
export function isTileFree(walls, children, x, y, exclude = null) {
  if (walls && !isSpaceFree(walls, x, y)) return false;

  if (children) {
    const solid = children.find(c => {
      if (c === exclude || !c.isSolid) return false;
      const cx = c.destinationPosition?.x ?? c.position.x;
      const cy = c.destinationPosition?.y ?? c.position.y;
      return cx === x && cy === y;
    });
    if (solid) return false;
  }

  return true;
}