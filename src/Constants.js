// Grid and tile configuration
export const TILE_SIZE = 16; // Pixels per grid cell

export const CANVAS = {
    WIDTH: 360, // canvas width in pixels
    HEIGHT: 180, // canvas height in pixels
}

// Chunk system configuration
export const CHUNK_SIZE = 30; // Tiles per chunk (30x30)
export const CHUNK_PIXEL_SIZE = CHUNK_SIZE * TILE_SIZE; // 480 pixels

// Chunk loading configuration
export const VISIBLE_CHUNK_RADIUS = 1; // Load chunks within this radius of camera (9x9 grid total)

export const TOTAL_WORLD_CHUNKS = 2;

export const CAMERA = {
    DEFAULT_MAP_WIDTH: CHUNK_SIZE * TILE_SIZE * TOTAL_WORLD_CHUNKS, // default camera width in pixels
    DEFAULT_MAP_HEIGHT: CHUNK_SIZE * TILE_SIZE, // default camera height in pixels
    DEAD_ZONE_WIDTH: TILE_SIZE * 2,  // How far left/right hero can move before camera follows - change to 0 for instant follow
    DEAD_ZONE_HEIGHT: TILE_SIZE * 2, // How far up/down hero can move before camera follows
}

export const SPRITE = {
    HERO_HALF_SIZE: TILE_SIZE, // Half the size of the hero sprite (16x16 sprite)
}

// Layer types - these match the Tiled layer names
export const COLLISION_LAYER_NAME = "Collisions"; // Layer that separates ground from foreground

export const CULLING = {
    BUFFER_TILES: 2, // Extra tiles to render beyond viewport for smoothness
}

// Draw layers for Y-sorting
export const DRAW_LAYER_FLOOR = "FLOOR";
export const DRAW_LAYER_GAME = "GAME";
export const DRAW_LAYER_FOREGROUND = "FOREGROUND";
export const DRAW_LAYER_HUD = "HUD";

export const DEBUG_LAYERS = {
    DRAW_COLLISIONS: true, // Set to true to render collision layer tiles
}


