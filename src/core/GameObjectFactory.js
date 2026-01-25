import { Npc } from "../objects/Character/types/Npc/Npc.js";
import { Exit } from "../objects/Exit/Exit.js";
import { Sign } from "../objects/Sign/Sign.js";
import { Chest } from "../objects/Chest/Chest.js";

/**
 * Factory for spawning game objects from Tiled object layer data
 * Extensible pattern - easy to add new object types
 */
export class GameObjectFactory {
  constructor() {
    // Registry of object type names to factory functions
    // Each function receives (tiledObject) and returns a GameObject instance
    this.registry = {
      // NOTE: Hero is NOT in the registry - it's managed by Main.js
      // Hero spawn points in Tiled should be read separately to set level.heroStartPosition

      // NPC characters
      "Npc": this._createNpc.bind(this),
      "npc": this._createNpc.bind(this),

      // Exit/transition points
      "Exit": this._createExit.bind(this),
      "exit": this._createExit.bind(this),

      // Signs/interactive markers (no sprite, just properties)
      "Sign": this._createSign.bind(this),
      "sign": this._createSign.bind(this),

      // Add more object types here as needed
      "Chest": this._createChest.bind(this),
      // "Enemy": this._createEnemy.bind(this),
    };
  }

  /**
   * Create a game object from Tiled object data
   * @param {Object} tiledObject - Object from Tiled object layer
   * @param {String} tiledObject.name - Name or type identifier
   * @param {Number} tiledObject.worldX - World X position
   * @param {Number} tiledObject.worldY - World Y position
   * @param {Array} tiledObject.properties - Custom properties from Tiled
   * @returns {GameObject|null} Spawned game object or null if type not recognized
   */
  create(tiledObject) {
    // Determine the type - check both 'type' and 'name' fields, and properties
    let typeName = tiledObject.type || tiledObject.name;

    // If no type, check if there's a property that indicates the type
    if (!typeName || typeName === "") {
      // Check for common type-indicating properties
      const typeProperty = this._getProperty(tiledObject, "type");
      const spawnProperty = this._getProperty(tiledObject, "spawn");

      if (typeProperty) typeName = typeProperty;
      else if (spawnProperty) typeName = spawnProperty;

      // Special case: check for spawnHero property
      if (this._getProperty(tiledObject, "spawnHero")) {
        typeName = "Hero";
      }
    }

    // Look up factory function in registry
    const factoryFunction = this.registry[typeName];

    if (!factoryFunction) {
      console.warn(`No factory registered for object type: "${typeName}"`, tiledObject);
      return null;
    }

    // Create and return the game object
    try {
      return factoryFunction(tiledObject);
    } catch (error) {
      console.error(`Error creating object of type "${typeName}":`, error, tiledObject);
      return null;
    }
  }

  /**
   * Register a new object type
   * Usage: factory.register("Chest", (tiledObj) => new Chest(tiledObj.worldX, tiledObj.worldY))
   */
  register(typeName, factoryFunction) {
    this.registry[typeName] = factoryFunction;
  }

  /**
   * Helper: Get a property value from Tiled object
   */
  _getProperty(tiledObject, propertyName) {
    if (!tiledObject.properties) return null;

    const prop = tiledObject.properties.find(p => p.name === propertyName);
    return prop ? prop.value : null;
  }

  /**
   * Factory functions for built-in object types
   */

  // Hero is not created here - managed by Main.js
  // Hero spawn points should be read in ChunkedLevel to set heroStartPosition

  _createNpc(tiledObject) {
    // Parse NPC configuration from properties
    const spriteResource = this._getProperty(tiledObject, "spriteResource");
    const facingDirection = this._getProperty(tiledObject, "facingDirection");

    const textContent = this._getProperty(tiledObject, "message") ||
                       this._getProperty(tiledObject, "dialogue") ||
                       this._getProperty(tiledObject, "content") ||
                       "...";

    const portraitFrame = this._getProperty(tiledObject, "portraitFrame") || 0;

    // Routine-based movement
    const routine = this._getProperty(tiledObject, "commands");
    const loop = this._getProperty(tiledObject, "loop") ?? false;
    const pingPong = this._getProperty(tiledObject, "pingPong") ?? false;

    const config = {
      content: [
        {
          string: textContent,
          addsFlag: null
        }
      ],
      portraitFrame: portraitFrame,
      spriteResource: spriteResource,
      facingDirection: facingDirection,
      routine: routine,
      loop: loop,
      pingPong: pingPong,
    };

    return new Npc(tiledObject.worldX, tiledObject.worldY, config);
  }

  _createExit(tiledObject) {
    const targetMap = this._getProperty(tiledObject, "targetMap") || null;
    console.log("Creating exit to:", targetMap);

    return new Exit(tiledObject.worldX, tiledObject.worldY, targetMap);
  }

  _createSign(tiledObject) {
    const message = this._getProperty(tiledObject, "message") ||
                    this._getProperty(tiledObject, "text") ||
                    "";

    return new Sign(tiledObject.worldX, tiledObject.worldY, message);
  }

  // Add more factory methods as needed:
  //
  _createChest(tiledObject) {
    const itemType = this._getProperty(tiledObject, "itemType") || "GOLD";
    return new Chest(tiledObject.worldX, tiledObject.worldY, itemType);
  }
  //
  // _createEnemy(tiledObject) {
  //   const enemyType = this._getProperty(tiledObject, "enemyType") || "SLIME";
  //   return new Enemy(tiledObject.worldX, tiledObject.worldY, enemyType);
  // }
}

// Export a singleton instance for convenience
export const gameObjectFactory = new GameObjectFactory();
