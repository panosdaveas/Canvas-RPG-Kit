import { resources } from "../Resource.js";

/**
 * Configuration for different level types/worlds.
 * Maps world names to their tileset resources and world.json paths.
 *
 * Add new rooms/interiors here as you create them in Tiled.
 */
export const levelConfigs = {
  "Interior": {
    worldPath: "/maps/Interior/world.json",
    getTilesets: () => [
      resources.images.interiorTileset,
      resources.images.collisionsTileset,
    ]
  },
  // Add more rooms as needed:
  // "Cave": {
  //   worldPath: "/maps/Cave/world.json",
  //   getTilesets: () => [
  //     resources.images.caveTileset,
  //     resources.images.collisionsTileset,
  //   ]
  // },
  // "Dungeon": {
  //   worldPath: "/maps/Dungeon/world.json",
  //   getTilesets: () => [
  //     resources.images.dungeonTileset,
  //     resources.images.collisionsTileset,
  //   ]
  // },
};

/**
 * Get level configuration by world name
 * @param {string} worldName - e.g., "Interior", "Cave"
 * @returns {Object|null} Configuration object or null if not found
 */
export function getLevelConfig(worldName) {
  return levelConfigs[worldName] || null;
}
