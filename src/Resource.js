import { loadAseprite } from "./loaders/aseprite.js";

class Resources {
  constructor() {
    // Everything we plan to download
    this.toLoad = {
      // hero: "/sprites/protagonist.png",
      companion: "/sprites/rod.png",
      heroine: "/sprites/Girl-Sheet.png",
      shadow: "/sprites/shadow.png",
      rod: "/sprites/rod.png",
      exit: "/sprites/exit.png",
      // NPCs
      knight: "/sprites/knight-sheet-1.png",
      npc1: "/sprites/npcs/npc1.png",
      npc2: "/sprites/npcs/npc2.png",
      // HUD
      textBox: "/sprites/text-box.png",
      fontWhite: "/sprites/sprite-font-white.png",
      portraits: "/sprites/portraits-sheet.png",
      // Tilesets for chunked maps
      overworldTileset: "/maps/Overworld/Tilesets/Overworld.png",
      collisionsTileset: "/maps/Overworld/Tilesets/Collisions.png",
      interiorTileset: "/maps/Interior/Tilesets/indoor_tileset.png",
      // World Objects
      chest: "/sprites/chest.png",
      // Weapons
      arrow: "/sprites/weapons/arrow.png",
      // Icons (weapons)
      bowIcon: "/sprites/weapons/icons/bow.png",
      swordIcon: "/sprites/weapons/icons/sword.png",
      firearmIcon: "/sprites/weapons/icons/firearm.png",
    };

    // Aseprite-driven bundles: animations + slices + userData + spritesheet
    this.toLoadAseprite = {
      protagonist: "/sprites/aseprite/protagonist_new.json",
    };

    // A bucket to keep all of our images
    this.images = {};

    // A bucket for parsed Aseprite bundles
    this.aseprite = {};

    // Load each image
    Object.keys(this.toLoad).forEach(key => {
      const img = new Image();
      img.src = this.toLoad[key];
      this.images[key] = {
        image: img,
        isLoaded: false
      }
      img.onload = () => {
        this.images[key].isLoaded = true;
      }
    })

    // Kick off Aseprite loads. Each loader fetches JSON + linked PNG and
    // returns a bundle exposing an Animations instance, slice index, etc.
    this._asepritePromises = Object.entries(this.toLoadAseprite).map(async ([key, path]) => {
      try {
        this.aseprite[key] = await loadAseprite(path);
      } catch (err) {
        console.error(`Aseprite bundle "${key}" failed to load:`, err);
      }
    });
  }

  // Returns a promise that resolves when all images and Aseprite bundles are loaded
  allLoaded() {
    const imagePromises = Object.values(this.images).map(img => {
      if (img.isLoaded) return Promise.resolve();
      return new Promise(resolve => {
        img.image.onload = () => {
          img.isLoaded = true;
          resolve();
        };
        img.image.onerror = () => resolve(); // Don't block on failed loads
      });
    });
    return Promise.all([...imagePromises, ...this._asepritePromises]);
  }
}

// Create one instance for the whole app to use
export const resources = new Resources();
