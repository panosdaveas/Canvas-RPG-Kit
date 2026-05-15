import { Vector2 } from "../Vector2.js";

/**
 * Maps a targetMap name prefix to its world directory layout.
 * The Tiled `targetMap` property is a bare identifier like "room_0" or "chunk_0_0";
 * this table tells us which world it belongs to and where the JSON lives on disk.
 */
const MAP_REGISTRY = [
  { prefix: "room_",  world: "Interior",  subdir: "Rooms"  },
  { prefix: "chunk_", world: "Overworld", subdir: "Chunks" },
];

function lookupMapEntry(name) {
  return MAP_REGISTRY.find(entry => name.startsWith(entry.prefix)) ?? null;
}

/**
 * Fetches the SpawnPlayer position from a map JSON file
 * @param {string} targetMap - Map identifier from the Tiled property (e.g., "room_0", "chunk_0_0")
 * @returns {Promise<{position: Vector2, facingDirection: string}|null>}
 */
export async function getSpawnPlayerFromMap(targetMap) {
  try {
    const absolutePath = resolveMapPath(targetMap);
    if (!absolutePath) {
      console.warn(`Unknown targetMap identifier: ${targetMap}`);
      return null;
    }

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
    console.error(`Error fetching spawn position from ${targetMap}:`, error);
    return null;
  }
}

/**
 * Resolves a targetMap identifier to an absolute fetch path.
 * e.g., "room_0" -> "/maps/Interior/Rooms/room_0.json"
 * e.g., "chunk_0_0" -> "/maps/Overworld/Chunks/chunk_0_0.json"
 */
export function resolveMapPath(targetMap) {
  const entry = lookupMapEntry(targetMap);
  if (!entry) return null;
  return `/maps/${entry.world}/${entry.subdir}/${targetMap}.json`;
}

/**
 * Determines the world name from a targetMap identifier.
 * e.g., "room_0" -> "Interior"
 * e.g., "chunk_0_0" -> "Overworld"
 */
export function getWorldNameFromPath(targetMap) {
  return lookupMapEntry(targetMap)?.world ?? null;
}
