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