class Resources {
  constructor() {
    // Everything we plan to download
    this.toLoad = {
      hero: "/sprites/hero_alt.png",
      swing: "/sprites/hero_swing.png",
      heroine: "/sprites/Girl-Sheet.png",
      shadow: "/sprites/shadow.png",
      drone:"/sprites/drone.png",
      rod: "/sprites/rod.png",
      exit: "/sprites/exit.png",
      // Outdoor
      sky: "/sprites/sky.png",
      ground: "/sprites/ground.png",
      // Cave
      cave: "/sprites/cave.png",
      caveGround: "/sprites/cave-ground.png",
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
      bow: "/sprites/weapons/bow.png",
      sword: "/sprites/weapons/sword.png",
      boomerang: "/sprites/weapons/boomerang.png",
    };

    // A bucket to keep all of our images
    this.images = {};

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
  }

  // Returns a promise that resolves when all images are loaded
  allLoaded() {
    const loadPromises = Object.values(this.images).map(img => {
      if (img.isLoaded) return Promise.resolve();
      return new Promise(resolve => {
        img.image.onload = () => {
          img.isLoaded = true;
          resolve();
        };
        img.image.onerror = () => resolve(); // Don't block on failed loads
      });
    });
    return Promise.all(loadPromises);
  }
}

// Create one instance for the whole app to use
export const resources = new Resources();
