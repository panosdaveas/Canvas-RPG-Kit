import { TILE_SIZE, CHUNK_SIZE, COLLISION_LAYER_NAME, CULLING, DEBUG_LAYERS, CANVAS } from "../Constants.js";

/**
 * Represents a single chunk loaded from Tiled map editor
 * Organizes layers into ground, collision, and foreground based on the collision layer position
 */
export class TiledChunk {
  constructor(chunkX, chunkY, tiledData, tilesetImages) {
    this.chunkX = chunkX; // Chunk grid X coordinate (e.g., 0, 1, 2...)
    this.chunkY = chunkY; // Chunk grid Y coordinate
    this.worldX = chunkX * CHUNK_SIZE * TILE_SIZE; // World pixel X position
    this.worldY = chunkY * CHUNK_SIZE * TILE_SIZE; // World pixel Y position

    this.tiledData = tiledData; // Raw Tiled JSON data
    // Normalize to array and store tileset images
    this.tilesetImages = Array.isArray(tilesetImages) ? tilesetImages : [tilesetImages];
    this.isLoaded = false; // Track if chunk is ready to render

    // Organized layer groups
    this.groundLayers = []; // Layers below collision layer (non-static)
    this.staticGroundLayers = []; // Ground layers with static=true
    this.collisionLayer = null; // The collision layer itself
    this.foregroundLayers = []; // Layers above collision layer (non-static)
    this.staticForegroundLayers = []; // Foreground layers with static=true
    this.objectLayers = []; // Object layers (interactions, NPCs, etc.)

    // Y-sort tracking
    this.foregroundYSortLayers = []; // Foreground layers that participate in Y-sorting

    // Static layer caching - offscreen canvases for pre-rendered static layers
    this.staticGroundCanvas = null;
    this.staticForegroundCanvas = null

    // Parse tilesets from Tiled data
    this.tilesets = this._parseTilesets();

    // Parse and organize the layers
    this._parseLayers();

    // Build collision set for quick lookups
    this._buildCollisionSet();

    // Cache static layers to offscreen canvases
    this._cacheStaticLayers();

    this.isLoaded = true;

    this._debugLayers();
  }

  _debugLayers() {
    if (DEBUG_LAYERS.DRAW_COLLISIONS) {
      this.groundLayers.push(this.collisionLayer);
    }
  }

  /**
   * Parse tileset information from Tiled data
   * Returns array of tileset configs sorted by firstgid (descending)
   * Each tileset stores its imageIndex to reference the correct image from tilesetImages array
   */
  _parseTilesets() {
    if (!this.tiledData.tilesets) return [];

    // Sort by firstgid (descending) for easy lookup
    // Store imageIndex to map to the correct tileset image
    return this.tiledData.tilesets
      .map((ts, index) => ({
        firstgid: ts.firstgid,
        columns: ts.columns,
        tilewidth: ts.tilewidth || 16,
        tileheight: ts.tileheight || 16,
        name: ts.name,
        imageIndex: index // Index into tilesetImages array
      }))
      .sort((a, b) => b.firstgid - a.firstgid);
  }

  /**
   * Parse Tiled layers and organize them into ground/collision/foreground
   * Separates static layers (static=true property) for caching optimization
   */
  _parseLayers() {
    let foundCollision = false;

    for (const layer of this.tiledData.layers) {
      // Object layers (spawn points, interactions, etc.)
      if (layer.type === "objectgroup") {
        this.objectLayers.push(layer);
        continue;
      }

      // Tile layers
      if (layer.type === "tilelayer") {
        // Check if this is the collision layer
        if (layer.name === COLLISION_LAYER_NAME) {
          this.collisionLayer = layer;
          foundCollision = true;
          continue;
        }

        // Check if this layer is marked as static for caching
        const isStatic = this._getLayerProperty(layer, "static") === true;

        // Organize into ground or foreground based on collision layer position
        if (!foundCollision) {
          // Layers before collision = ground
          if (isStatic) {
            this.staticGroundLayers.push(layer);
          } else {
            this.groundLayers.push(layer);
          }
        } else {
          // Layers after collision = foreground
          if (isStatic) {
            this.staticForegroundLayers.push(layer);
          } else {
            this.foregroundLayers.push(layer);
          }

          // Check if this layer participates in Y-sorting
          const ySort = this._getLayerProperty(layer, "ySort");
          if (ySort === true) {
            this.foregroundYSortLayers.push(layer);
          }
        }
      }
    }
  }

  /**
   * Get a custom property from a Tiled layer
   */
  _getLayerProperty(layer, propertyName) {
    if (!layer.properties) return null;

    const prop = layer.properties.find(p => p.name === propertyName);
    return prop ? prop.value : null;
  }

  /**
   * Build a Set of collision coordinates for quick collision detection
   * Format: "x,y" where x,y are world pixel coordinates
   */
  _buildCollisionSet() {
    this.collisionSet = new Set();

    if (!this.collisionLayer) return;

    const data = this.collisionLayer.data;
    const width = this.collisionLayer.width;

    for (let i = 0; i < data.length; i++) {
      const tileId = data[i];

      // Non-zero tile ID means collision
      if (tileId !== 0) {
        const localX = i % width;
        const localY = Math.floor(i / width);

        // Convert to world pixel coordinates
        const worldX = this.worldX + localX * TILE_SIZE;
        const worldY = this.worldY + localY * TILE_SIZE;

        this.collisionSet.add(`${worldX},${worldY}`);
      }
    }
  }

  /**
   * Cache static layers to offscreen canvases for optimized rendering
   * Static layers are pre-rendered once and drawn as a single image
   */
  _cacheStaticLayers() {
    const chunkPixelSize = CHUNK_SIZE * TILE_SIZE;

    // Cache static ground layers
    if (this.staticGroundLayers.length > 0) {
      this.staticGroundCanvas = document.createElement("canvas");
      this.staticGroundCanvas.width = chunkPixelSize;
      this.staticGroundCanvas.height = chunkPixelSize;
      const groundCtx = this.staticGroundCanvas.getContext("2d");

      // Draw all static ground layers to the offscreen canvas
      for (const layer of this.staticGroundLayers) {
        this._drawTileLayerToCanvas(groundCtx, layer);
      }
    }

    // Cache static foreground layers
    if (this.staticForegroundLayers.length > 0) {
      this.staticForegroundCanvas = document.createElement("canvas");
      this.staticForegroundCanvas.width = chunkPixelSize;
      this.staticForegroundCanvas.height = chunkPixelSize;
      const foregroundCtx = this.staticForegroundCanvas.getContext("2d");

      // Draw all static foreground layers to the offscreen canvas
      for (const layer of this.staticForegroundLayers) {
        this._drawTileLayerToCanvas(foregroundCtx, layer);
      }
    }
  }

  /**
   * Draw a tile layer to an offscreen canvas (no viewport culling, draws entire layer)
   * Used for pre-rendering static layers
   */
  _drawTileLayerToCanvas(ctx, layer) {
    if (!this.tilesetImages || this.tilesetImages.length === 0) return;

    const data = layer.data;
    const width = layer.width;
    const height = layer.height;

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const index = row * width + col;
        const tileId = data[index];

        if (tileId === 0) continue;

        // Position relative to chunk origin (0,0 of the offscreen canvas)
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;

        this._drawTileAt(ctx, tileId, x, y);
      }
    }
  }

  /**
   * Draw a single tile at a position (used by both regular and cached rendering)
   */
  _drawTileAt(ctx, tileId, x, y) {
    if (tileId === 0) return;

    // Find the appropriate tileset for this tile ID
    let tileset = this.tilesets[0];
    for (const ts of this.tilesets) {
      if (tileId >= ts.firstgid) {
        tileset = ts;
        break;
      }
    }

    if (tileset.name === "Collisions" && !DEBUG_LAYERS.DRAW_COLLISIONS) return;

    const tilesetImage = this.tilesetImages[tileset.imageIndex];
    if (!tilesetImage || !tilesetImage.isLoaded) return;

    const img = tilesetImage.image;
    const localTileId = tileId - tileset.firstgid;
    const srcX = (localTileId % tileset.columns) * tileset.tilewidth;
    const srcY = Math.floor(localTileId / tileset.columns) * tileset.tileheight;

    ctx.drawImage(
      img,
      srcX, srcY,
      tileset.tilewidth, tileset.tileheight,
      Math.floor(x), Math.floor(y),
      TILE_SIZE, TILE_SIZE
    );
  }

  /**
   * Draw ground layers (layers below collision)
   * Static layers are drawn from cached canvas, non-static are drawn tile-by-tile
   */
  drawGroundLayers(ctx) {
    // Draw cached static ground layers as single image
    if (this.staticGroundCanvas) {
      ctx.drawImage(this.staticGroundCanvas, this.worldX, this.worldY);
    }

    // Draw non-static ground layers tile-by-tile (with viewport culling)
    for (const layer of this.groundLayers) {
      this._drawTileLayer(ctx, layer);
    }
  }

  /**
   * Draw foreground layers (layers above collision)
   * Static layers are drawn from cached canvas, non-static are drawn tile-by-tile
   * Note: Layers with ySort=true should be drawn with game objects using Y-sorting
   */
  drawForegroundLayers(ctx, includeYSort = true) {
    // Draw cached static foreground layers as single image
    if (this.staticForegroundCanvas) {
      ctx.drawImage(this.staticForegroundCanvas, this.worldX, this.worldY);
    }

    // Draw non-static foreground layers tile-by-tile (with viewport culling)
    for (const layer of this.foregroundLayers) {
      const hasYSort = this.foregroundYSortLayers.includes(layer);

      // Skip Y-sort layers if not requested (they'll be drawn separately with objects)
      if (hasYSort && !includeYSort) {
        continue;
      }

      this._drawTileLayer(ctx, layer);
    }
  }

  /**
   * Internal method to draw a single tile layer with viewport culling
   * Only draws tiles visible on screen for optimal performance
   */
  _drawTileLayer(ctx, layer) {
    // Check if we have at least one tileset image loaded
    if (!this.tilesetImages || this.tilesetImages.length === 0) return;

    const data = layer.data;
    const width = layer.width;
    const height = layer.height;

    // Get canvas dimensions (use constants for consistency)
    const canvasWidth = CANVAS.WIDTH;
    const canvasHeight = CANVAS.HEIGHT;

    // Get camera offset from context transform
    // Camera is applied via ctx.translate(), so we extract it from the transform matrix
    const transform = ctx.getTransform();
    const cameraX = transform.e;  // Translation X
    const cameraY = transform.f;  // Translation Y

    // Calculate visible world space
    const viewLeft = -cameraX;
    const viewRight = viewLeft + canvasWidth;
    const viewTop = -cameraY;
    const viewBottom = viewTop + canvasHeight;

    // Convert to tile coordinates within this chunk
    const buffer = CULLING.BUFFER_TILES; // Extra tiles for smooth scrolling at edges
    const startCol = Math.max(0, Math.floor((viewLeft - this.worldX) / TILE_SIZE) - buffer);
    const endCol = Math.min(width, Math.ceil((viewRight - this.worldX) / TILE_SIZE) + buffer);
    const startRow = Math.max(0, Math.floor((viewTop - this.worldY) / TILE_SIZE) - buffer);
    const endRow = Math.min(height, Math.ceil((viewBottom - this.worldY) / TILE_SIZE) + buffer);

    // Only draw visible tiles
    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const index = row * width + col;
        const tileId = data[index];

        // Skip empty tiles
        if (tileId === 0) continue;

        // Calculate world position
        const x = this.worldX + col * TILE_SIZE;
        const y = this.worldY + row * TILE_SIZE;

        // Draw the tile
        this._drawTile(ctx, tileId, x, y);
      }
    }
  }

  /**
   * Draw a single tile from the tileset
   * Handles Tiled's tileset mapping with firstgid and multiple tileset images
   */
  _drawTile(ctx, tileId, x, y) {
    if (tileId === 0) return; // 0 means empty tile

    // Find the appropriate tileset for this tile ID
    // Tilesets are sorted by firstgid descending, so first match is correct
    let tileset = this.tilesets[0]; // Default to first tileset
    for (const ts of this.tilesets) {
      if (tileId >= ts.firstgid) {
        tileset = ts;
        break;
      }
    }

    if (tileset.name === "Collisions" && !DEBUG_LAYERS.DRAW_COLLISIONS) return;

    // Get the correct tileset image for this tileset
    const tilesetImage = this.tilesetImages[tileset.imageIndex];
    if (!tilesetImage || !tilesetImage.isLoaded) return;

    const img = tilesetImage.image;

    // Calculate local tile index within this tileset
    const localTileId = tileId - tileset.firstgid;

    // Calculate source position on the tileset image
    const srcX = (localTileId % tileset.columns) * tileset.tilewidth;
    const srcY = Math.floor(localTileId / tileset.columns) * tileset.tileheight;

    // Draw the tile - floor positions to prevent sub-pixel rendering and pixel bleeding
    ctx.drawImage(
      img,
      srcX, srcY, // Source position on tileset
      tileset.tilewidth, tileset.tileheight, // Source dimensions
      Math.floor(x), Math.floor(y), // Destination position in world
      TILE_SIZE, TILE_SIZE // Destination dimensions
    );
  }

  /**
   * Get all objects from object layers
   * Returns array of objects with their properties
   */
  getObjects() {
    const allObjects = [];

    for (const layer of this.objectLayers) {
      if (layer.objects) {
        for (const obj of layer.objects) {
          // Add layer name and chunk position to the object
          // For tall objects, use the bottom tile as the interaction point
          // (obj.height - TILE_SIZE) shifts from top to bottom tile
          const yOffset = obj.height ? obj.height - TILE_SIZE : 0;
          allObjects.push({
            ...obj,
            layerName: layer.name,
            chunkX: this.chunkX,
            chunkY: this.chunkY,
            worldX: this.worldX + obj.x,
            worldY: this.worldY + obj.y + yOffset
          });
        }
      }
    }

    return allObjects;
  }

  /**
   * Clean up resources when unloading chunk
   */
  destroy() {
    this.groundLayers = [];
    this.staticGroundLayers = [];
    this.foregroundLayers = [];
    this.staticForegroundLayers = [];
    this.foregroundYSortLayers = [];
    this.objectLayers = [];
    this.collisionSet.clear();

    // Clean up cached canvases
    this.staticGroundCanvas = null;
    this.staticForegroundCanvas = null;

    this.isLoaded = false;
  }
}
