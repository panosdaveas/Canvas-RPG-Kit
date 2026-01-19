import { Vector2 } from "../Vector2.js";

/**
 * Fetches the SpawnPlayer position from a map chunk JSON file
 * @param {string} targetMapPath - Relative path from the targetMap property (e.g., "../../Interior/Chunks/chunk_0_0.json")
 * @returns {Promise<{position: Vector2, facingDirection: string}|null>}
 */
export async function getSpawnPlayerFromMap(targetMapPath) {
  try {
    // Convert relative Tiled path to absolute path for fetch
    // targetMapPath is relative to the chunk file, e.g., "../../Interior/Chunks/chunk_0_0.json"
    // We need to convert it to "/maps/Interior/Chunks/chunk_0_0.json"
    const absolutePath = resolveMapPath(targetMapPath);

    const response = await fetch(absolutePath);
    if (!response.ok) {
      console.error(`Failed to fetch map: ${absolutePath}`);
      return null;
    }

    const mapData = await response.json();

    // Find the Spawns object layer
    const spawnsLayer = mapData.layers.find(
      layer => layer.type === "objectgroup" &&
               (layer.name === "Spawns" || layer.name === "SpawnPlayer")
    );

    if (!spawnsLayer || !spawnsLayer.objects) {
      console.warn(`No Spawns layer found in map: ${absolutePath}`);
      return null;
    }

    // Find the SpawnPlayer object
    const spawnPlayer = spawnsLayer.objects.find(
      obj => obj.type === "SpawnPlayer"
    );

    if (!spawnPlayer) {
      console.warn(`No SpawnPlayer object found in map: ${absolutePath}`);
      return null;
    }

    // Get facing direction from properties
    let facingDirection = "DOWN";
    if (spawnPlayer.properties) {
      const dirProp = spawnPlayer.properties.find(p => p.name === "facingDirection");
      if (dirProp) {
        facingDirection = dirProp.value;
      }
    }

    return {
      position: new Vector2(spawnPlayer.x, spawnPlayer.y),
      facingDirection: facingDirection
    };
  } catch (error) {
    console.error(`Error fetching spawn position from ${targetMapPath}:`, error);
    return null;
  }
}

/**
 * Converts a relative Tiled path to an absolute fetch path
 * e.g., "../../Interior/Chunks/chunk_0_0.json" -> "/maps/Interior/Chunks/chunk_0_0.json"
 */
export function resolveMapPath(relativePath) {
  // Remove the "../.." prefix and build absolute path
  // Tiled paths are like: "../../Interior/Chunks/chunk_0_0.json"
  // We want: "/maps/Interior/Chunks/chunk_0_0.json"

  const parts = relativePath.split('/');
  // Filter out ".." parts and take the meaningful path
  const meaningfulParts = parts.filter(p => p !== '..' && p !== '.');

  return '/maps/' + meaningfulParts.join('/');
}

/**
 * Determines the world name from a targetMap path
 * e.g., "../../Overworld/Chunks/chunk_0_0.json" -> "Overworld"
 * e.g., "../../Interior/Chunks/chunk_0_0.json" -> "Interior"
 */
export function getWorldNameFromPath(targetMapPath) {
  const parts = targetMapPath.split('/');
  // Find the first meaningful directory name (not "..")
  for (const part of parts) {
    if (part !== '..' && part !== '.' && part !== 'Chunks' && !part.endsWith('.json')) {
      return part;
    }
  }
  return null;
}
