import { resources } from "../Resource.js";

/**
 * Configuration for CHUNKED levels only.
 *
 * Simple levels (single-map rooms) don't need config here -
 * they auto-detect tilesets from the map JSON file.
 *
 * Only add entries here for large chunked worlds that need
 * world.json + multiple chunk files.
 */
export const levelConfigs = {
  // Example of a chunked level (large area with dynamic loading):
  // "Dungeon": {
  //   type: "chunked",
  //   worldPath: "/maps/Dungeon/world.json",
  //   getTilesets: () => [
  //     resources.images.dungeonTileset,
  //     resources.images.collisionsTileset,
  //   ]
  // },
};

/**
 * Get level configuration by world name
 * @param {string} worldName - e.g., "Dungeon", "LargeArea"
 * @returns {Object|null} Configuration object or null if not found
 */
export function getLevelConfig(worldName) {
  return levelConfigs[worldName] || null;
}
