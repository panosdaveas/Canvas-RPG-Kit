// Grid and tile configuration
export const CELL_SIZE = 16; // Pixels per grid cell

// Chunk system configuration
export const CHUNK_SIZE = 30; // Tiles per chunk (30x30)
export const CHUNK_PIXEL_SIZE = CHUNK_SIZE * CELL_SIZE; // 480 pixels

// Chunk loading configuration
export const VISIBLE_CHUNK_RADIUS = 1; // Load chunks within this radius of camera (9x9 grid total)

// Layer types - these match the Tiled layer names
export const COLLISION_LAYER_NAME = "Collisions"; // Layer that separates ground from foreground

// Draw layers for Y-sorting
export const DRAW_LAYER_FLOOR = "FLOOR";
export const DRAW_LAYER_GAME = "GAME";
export const DRAW_LAYER_FOREGROUND = "FOREGROUND";
export const DRAW_LAYER_HUD = "HUD";
