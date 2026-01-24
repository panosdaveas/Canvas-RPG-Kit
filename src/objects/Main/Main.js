import {GameObject} from "../../GameObject.js";
import {Input} from "../../Input.js";
import {Camera} from "../../Camera.js";
import {Inventory} from "../Inventory/Inventory.js";
import {events} from "../../Events.js";
import {SpriteTextString} from "../SpriteTextString/SpriteTextString.js";
import {storyFlags} from "../../StoryFlags.js";
import {Hero} from "../Character/types/Hero/Hero.js";
import {gridCells} from "../../helpers/grid.js";
import {CANVAS, CULLING, TILE_SIZE} from "../../Constants.js";
import {globalState} from "../../GlobalState.js";

export class Main extends GameObject {
  constructor() {
    super({});
    this.level = null;
    this.input = new Input()
    this.camera = new Camera()
    this.hero = null;

    // Y-sort optimization: only re-sort when needed
    this._sortedObjects = [];
    this._ySortDirty = true;
    this._lastHeroY = null;

    // HUD canvas optimization: only re-render when content changes
    this._hudCanvas = document.createElement('canvas');
    this._hudCanvas.width = CANVAS.WIDTH;
    this._hudCanvas.height = CANVAS.HEIGHT;
    this._hudCtx = this._hudCanvas.getContext('2d');
    this._hudDirty = true;

    // Debug logging throttle
    this._lastLogTime = 0;
  }

  ready() {

    const inventory = new Inventory()
    this.addChild(inventory);

    // Create hero (persists across levels)
    this.hero = new Hero(gridCells(15), gridCells(14));
    this.addChild(this.hero);

    // Initialize sorted objects with hero
    this._rebuildSortedObjects();

    // Mark Y-sort dirty when hero's Y position changes
    events.on("HERO_POSITION", this, (position) => {
      if (this._lastHeroY !== position.y) {
        this._lastHeroY = position.y;
        this._ySortDirty = true;
      }
    });

    // Mark HUD dirty when HUD content changes
    events.on("HUD_DIRTY", this, () => {
      this._hudDirty = true;
    });

    // Change Level handler
    // Expects: { level: LevelInstance, heroPosition: Vector2, useSavedPosition?: boolean }
    events.on("CHANGE_LEVEL", this, (data) => {
      const { level, heroPosition, useSavedPosition } = data;

      // If returning to overworld, use the saved position from GlobalState
      let finalPosition = heroPosition;
      if (useSavedPosition) {
        const savedPosition = globalState.getOverworldPosition();
        if (savedPosition) {
          finalPosition = savedPosition;
          console.log("Using saved overworld position:", finalPosition);
        }
      }

      this.setLevel(level, finalPosition);
    })

    events.on("HERO_ACTION_FINISHED", this, () => {
      this.hero.isLocked = false;
    })

    // Launch Text Box handler
    events.on("HERO_REQUESTS_ACTION", this, (withObject) => {
      this.hero.isLocked = true;


      if (typeof withObject.getContent === "function") {
        const content = withObject.getContent();

        if (!content) {
          return;
        }

        console.log(content)
        // Potentially add a story flag
        if (content.addsFlag) {
          console.log("ADD FLAG", content.addsFlag)
          storyFlags.add(content.addsFlag);
        }

        // Show the textbox
        const textbox = new SpriteTextString({
          portraitFrame: content.portraitFrame,
          string: content.string
        });
        this.addChild(textbox);
        events.emit("START_TEXT_BOX");

        // Unsubscribe from this text box after it's destroyed
        const endingSub = events.on("END_TEXT_BOX", this, () => {
          textbox.destroy();
          this._hudDirty = true; // Re-render HUD without textbox
          events.off(endingSub)
          events.emit("HERO_ACTION_FINISHED");
        })
      }
    })
  }

  setLevel(newLevelInstance, heroPosition = null) {
    if (this.level) {
      this.level.destroy();
    }
    this.level = newLevelInstance;
    console.log("New level set:", this.level);
    this.addChild(this.level);

    // Reposition hero if a position was provided
    if (heroPosition && this.hero) {
      this.hero.position.x = heroPosition.x;
      this.hero.position.y = heroPosition.y;
      this.hero.destinationPosition.x = heroPosition.x;
      this.hero.destinationPosition.y = heroPosition.y;
      // Emit position so camera and chunks update
      events.emit("HERO_POSITION", this.hero.position);
    }

    // Reset sorted objects when level changes
    this._rebuildSortedObjects();
  }

  /**
   * Mark Y-sort as dirty (call when any object's Y position changes)
   */
  markYSortDirty() {
    this._ySortDirty = true;
  }

  /**
   * Add an object to the Y-sorted list
   */
  addToYSortedObjects(obj) {
    if (!this._sortedObjects.includes(obj)) {
      this._sortedObjects.push(obj);
      this._ySortDirty = true;
    }
  }

  /**
   * Remove an object from the Y-sorted list
   */
  removeFromYSortedObjects(obj) {
    const index = this._sortedObjects.indexOf(obj);
    if (index !== -1) {
      this._sortedObjects.splice(index, 1);
      // No need to mark dirty - removal doesn't affect sort order
    }
  }

  /**
   * Rebuild the sorted objects list from scratch
   */
  _rebuildSortedObjects() {
    this._sortedObjects = [];

    // Add Main's children (hero, etc.) - exclude HUD and Level itself
    this.children.forEach(child => {
      if (child.drawLayer !== "HUD" && child !== this.level) {
        this._sortedObjects.push(child);
      }
    });

    // Add Level's children (NPCs, spawned objects, etc.)
    if (this.level) {
      this.level.children.forEach(child => {
        this._sortedObjects.push(child);
      });
    }

    this._ySortDirty = true;
  }

  /**
   * Check if a game object is within the visible viewport
   * Uses viewport culling similar to tile rendering
   */
  _isInViewport(gameObject, ctx) {
    // Extract camera offset from canvas transform
    const transform = ctx.getTransform();
    const cameraX = -transform.e;  // Inverse of translation X
    const cameraY = -transform.f;  // Inverse of translation Y

    // Add buffer to prevent pop-in at viewport edges
    const buffer = CULLING.BUFFER_TILES * TILE_SIZE; // pixels

    // Calculate viewport bounds in world space
    const viewLeft = cameraX - buffer;
    const viewRight = cameraX + CANVAS.WIDTH + buffer;
    const viewTop = cameraY - buffer;
    const viewBottom = cameraY + CANVAS.HEIGHT + buffer;

    // Check if object position is within viewport bounds
    return (
      gameObject.position.x >= viewLeft &&
      gameObject.position.x <= viewRight &&
      gameObject.position.y >= viewTop &&
      gameObject.position.y <= viewBottom
    );
  }

  drawBackground(ctx) {
    this.level?.background.drawImage(ctx,0,0);
  }

  drawObjects(ctx) {

    // 1. Draw ground chunks from level (before game objects)
    if (this.level && typeof this.level.drawGroundChunks === 'function') {
      this.level.drawGroundChunks(ctx);
    }

    // 2. Draw all game objects (hero, NPCs, level children, etc.) - Y-sorted
    // Only re-sort when positions have changed
    if (this._ySortDirty) {
      this._sortedObjects.sort((a, b) => a.position.y - b.position.y);
      this._ySortDirty = false;
    }

    // Draw Y-sorted objects with viewport culling
    let objectsDrawn = 0;
    this._sortedObjects.forEach(obj => {
      if (this._isInViewport(obj, ctx)) {
        obj.draw(ctx, 0, 0);
        objectsDrawn++;
      }
    });

    //DEBUG:
    // Throttled debug log (every 1 second)
    // const now = performance.now();
    // if (now - this._lastLogTime >= 1000) {
    //   console.log(`Objects drawn: ${objectsDrawn} / ${this._sortedObjects.length} total`);
    //   this._lastLogTime = now;
    // }

    // 3. Draw foreground chunks from level (after game objects)
    if (this.level && typeof this.level.drawForegroundChunks === 'function') {
      this.level.drawForegroundChunks(ctx);
    }
  }

  drawForeground(ctx) {
    this.children.forEach(child => {
      if (child.drawLayer === "FOREGROUND") {
        child.draw(ctx, 0, 0);
      }
    })
  }

  /**
   * Mark HUD as dirty (call when HUD content changes)
   */
  markHudDirty() {
    this._hudDirty = true;
  }

  /**
   * Draw HUD using cached canvas (only re-renders when dirty)
   */
  drawHud(ctx) {
    if (this._hudDirty) {
      // Clear and re-render HUD canvas
      this._hudCtx.clearRect(0, 0, this._hudCanvas.width, this._hudCanvas.height);
      this.children.forEach(child => {
        if (child.drawLayer === "HUD") {
          child.draw(this._hudCtx, 0, 0);
        }
      });
      this._hudDirty = false;
    }

    // Blit cached HUD canvas to main canvas
    ctx.drawImage(this._hudCanvas, 0, 0);
  }

}