# Chunk-Based Map Loading System Guide

This guide explains how to use the chunk-based map loading system for large open-world games in your Canvas RPG Kit.

## Overview

The chunk system allows you to create massive open worlds by loading only the map chunks visible to the player, significantly improving performance.

### Architecture

The system consists of several key components:

1. **Constants.js** - Configuration values (chunk size, loading radius, etc.)
2. **TiledChunk.js** - Represents a single loaded chunk with organized layers
3. **ChunkManager.js** - Smart loading/unloading based on camera position
4. **GameObjectFactory.js** - Spawns game objects from Tiled object layers
5. **ChunkedLevel.js** - Base class for levels using the chunk system

## How It Works

### 1. Map Structure

Your Tiled map should be exported in chunks following this structure:

```
public/maps/YourWorld/
├── world.json              # Metadata with chunk references
├── Tilesets/
│   └── YourTileset.png     # The tileset sprite sheet
└── Chunks/
    ├── chunk_0_0.json      # Individual chunk files
    ├── chunk_0_1.json
    ├── chunk_1_0.json
    └── ...
```

**world.json example:**
```json
{
  "chunkSize": 30,
  "chunks": {
    "0,0": "Chunks/chunk_0_0.json",
    "0,1": "Chunks/chunk_0_1.json",
    "1,0": "Chunks/chunk_1_0.json"
  }
}
```

### 2. Layer Organization

The system automatically organizes Tiled layers based on the **Collisions layer**:

- **Ground Layers** - All layers *before* the Collisions layer
- **Collision Layer** - Named "Collisions" (configurable in Constants.js)
- **Foreground Layers** - All layers *after* the Collisions layer

Foreground layers with the custom property `ySort=true` will participate in Y-sorting with game objects.

### 3. Chunk Loading

The ChunkManager loads a 3x3 grid of chunks (configurable via `VISIBLE_CHUNK_RADIUS`):

```
[ ][ ][ ]
[ ][C][ ]  <- C = chunk containing camera/player
[ ][ ][ ]
```

When the camera moves to a new chunk, distant chunks are unloaded and new ones are loaded automatically.

## Usage Guide

### Step 1: Add Your Tileset to Resources

Edit `src/Resource.js` and add your tileset:

```javascript
this.toLoad = {
  // ... existing resources
  yourWorldTileset: "/maps/YourWorld/Tilesets/YourTileset.png",
};
```

### Step 2: Create a Level Using ChunkedLevel

```javascript
import { ChunkedLevel } from "../objects/Level/ChunkedLevel.js";
import { resources } from "../Resource.js";
import { Hero } from "../objects/Hero/Hero.js";
import { Vector2 } from "../Vector2.js";
import { events } from "../Events.js";
import { gridCells } from "../helpers/grid.js";

export class YourWorldLevel extends ChunkedLevel {
  constructor(params = {}) {
    // Pass world metadata path and tileset to parent
    super(
      "/maps/YourWorld/world.json",
      resources.images.yourWorldTileset
    );

    // Add any static game objects (like the hero)
    const hero = new Hero(gridCells(8), gridCells(8));
    this.addChild(hero);
    this.hero = hero;
  }

  ready() {
    // Listen to hero position to update chunks
    events.on("HERO_POSITION", this, pos => {
      this.updateCameraPosition(pos.x, pos.y);
    });

    // Initialize the chunk system (async)
    this.initialize().then(() => {
      console.log("Level ready!");
    });
  }

  // Provide collision data to game objects
  get walls() {
    return this.getWalls();
  }
}
```

### Step 3: Spawning Objects from Tiled Object Layers

The GameObjectFactory automatically spawns game objects from Tiled object layers.

#### Built-in Object Types:

- **Hero** - Spawn point for the hero (property: `spawnHero=true`)
- **Npc** - NPCs with dialogue (properties: `message`, `portraitFrame`)
- **Exit** - Level transition points

#### Adding Custom Object Types:

Edit `src/core/GameObjectFactory.js`:

```javascript
// 1. Import your custom class
import { Chest } from "../objects/Chest/Chest.js";

// 2. Register it in the constructor
this.registry = {
  // ... existing types
  "Chest": this._createChest.bind(this),
};

// 3. Add factory method
_createChest(tiledObject) {
  const itemType = this._getProperty(tiledObject, "itemType") || "GOLD";
  return new Chest(tiledObject.worldX, tiledObject.worldY, itemType);
}
```

In Tiled, create an object with:
- **Name or Type:** "Chest"
- **Custom Properties:** `itemType` (string) = "GOLD"

### Step 4: Configure Constants (Optional)

Edit `src/Constants.js` to adjust behavior:

```javascript
export const CHUNK_SIZE = 30;              // Tiles per chunk
export const VISIBLE_CHUNK_RADIUS = 1;     // Load radius (1 = 3x3 grid)
export const COLLISION_LAYER_NAME = "Collisions";  // Name of collision layer
```

## Rendering Pipeline

The rendering order ensures proper layering:

1. **Background** - Sky, background images
2. **Ground Layers** - Tile layers below collision
3. **Game Objects** - Y-sorted (heroes, NPCs, etc.)
4. **Foreground Layers (Y-sorted)** - Layers with `ySort=true`
5. **Foreground Layers (non Y-sorted)** - Other foreground layers
6. **HUD** - UI elements

## Performance Tips

### Viewport Culling

The system already implements viewport culling - only visible tiles are drawn. You can adjust the buffer in `TiledChunk._drawTileLayer()`:

```javascript
const buffer = 1;  // Increase for smoother scrolling at edges
```

### Static Layer Optimization (Future Enhancement)

For static layers that never change, you could pre-render them to an off-screen canvas once per chunk, then just draw that cached image each frame. This is not currently implemented to keep the code simple and understandable.

To implement it:

1. Create an off-screen canvas per chunk
2. Render static layers to it once when chunk loads
3. In the render loop, draw the cached canvas instead of individual tiles

## Troubleshooting

### Chunks not loading
- Check that `world.json` path is correct
- Verify chunk paths in `world.json` are relative to the world.json file
- Check browser console for errors

### Tiles rendering incorrectly
- Verify tileset image is loaded in Resources
- Check that tileset columns/dimensions match your Tiled tileset settings
- Ensure tile IDs are correct in Tiled export

### Collision not working
- Verify collision layer is named "Collisions" (or update `COLLISION_LAYER_NAME`)
- Check that collision tiles have non-zero IDs in Tiled
- Make sure level's `walls` getter returns `this.getWalls()`

### Objects not spawning
- Check GameObjectFactory registry has your object type
- Verify Tiled object has correct name/type field
- Check browser console for factory errors

## Example: Using WorldLevel

The included `WorldLevel.js` demonstrates the complete setup:

```javascript
import { WorldLevel } from "./levels/WorldLevel.js";

// In your Main.js or level switching code:
const level = new WorldLevel();
// Level will auto-load chunks as hero moves around
```

## Clean, Simple, Understandable

This system is designed to be:
- **Transparent** - You can see exactly what each component does
- **Modular** - Easy to extend with new features
- **Commented** - Each method explains its purpose
- **Debuggable** - Console logs show chunk loading/unloading

All magic numbers are in `Constants.js` for easy tuning!

---

**Next Steps:**
1. Export your map in Tiled as individual chunks
2. Create the world.json metadata file
3. Add your tileset to Resources
4. Create a ChunkedLevel subclass
5. Test chunk loading by moving your hero around!
