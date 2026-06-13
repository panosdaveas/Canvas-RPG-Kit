import {GameObject} from "../../GameObject.js";
import {Input} from "../../Input.js";
import {Camera} from "../../Camera.js";
import {Inventory} from "../Inventory/Inventory.js";
import {events} from "../../Events.js";
import {SpriteTextString} from "../SpriteTextString/SpriteTextString.js";
import {storyFlags} from "../../StoryFlags.js";
import {Hero} from "../Character/types/Hero/Hero.js";
import {STATE_IDLE, STATE_INTERACTING} from "../Character/Character.js";
import {STATE_ENTRY} from "../../state/states/EntryState.js";
import {gridCells} from "../../helpers/grid.js";
import {CANVAS, CULLING, TILE_SIZE} from "../../Constants.js";
import {globalState} from "../../GlobalState.js";
import {screenEffects} from "../../ScreenEffects.js";

export class Main extends GameObject {
  constructor() {
    super({});
    this.level = null;
    this.input = new Input()
    this.camera = new Camera()
    this.hero = null;

    // Y-sort optimization: only re-sort when needed
    this._sortedObjects = [];
    // Merged depth-sorted sequence (game objects + foreground ySort tile
    // drawables). Rebuilt only when _ySortDirty fires; iterated each frame.
    this._mergedYSort = [];
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

    // Create hero (persists across levels, re-parented on level change).
    // The Companion lives as a child of Hero, so it travels along automatically.
    this.hero = new Hero(gridCells(20), gridCells(14));
    if (this.level) {
      this.level.addChild(this.hero);
      this._rebuildSortedObjects();
    }

    // Mark Y-sort dirty when any character's Y position changes
    events.on("YSORT_DIRTY", this, () => {
      this._ySortDirty = true;
    });

    // Mark HUD dirty when HUD content changes
    events.on("HUD_DIRTY", this, () => {
      this._hudDirty = true;
    });

    // Main is purely a world-state operator: it freezes / unfreezes flagged
    // objects on demand. It doesn't care who emitted these or why.
    events.on("WORLD_PAUSE", this, () => {
      this._pauseFlagged();
    });

    events.on("WORLD_RESUME", this, () => {
      this._resumeFlagged();
    });

    // Change Level handler
    // Expects: { level: LevelInstance, heroPosition: Vector2, useSavedPosition?: boolean }
    events.on("CHANGE_LEVEL", this, (data) => {
      const { level, heroPosition, useSavedPosition } = data;

      // Block input and show idle briefly before the transition
      if (this.hero) {
        this.hero.state = STATE_INTERACTING;
      }

      setTimeout(() => {
        // If returning to overworld, use the saved position from GlobalState
        let finalPosition = heroPosition;
        if (useSavedPosition) {
          const savedPosition = globalState.getOverworldPosition();
          if (savedPosition) {
            finalPosition = savedPosition;
            console.log("Using saved overworld position:", finalPosition);
          }
        }

        screenEffects.fadeOut(300, async () => {
          screenEffects.holdBlack();
          this.setLevel(level, finalPosition);
          await level.initialize();
          if (this.hero) {
            this.hero.state = STATE_ENTRY;
          }
          screenEffects.releaseBlack();
          screenEffects.fadeIn(300);
        });
      }, 100);
    })

    // Handle hero actions with automatic state management
    events.on("HERO_REQUESTS_ACTION", this, async (withObject) => {
      // Set hero and target to interacting state
      this.hero.state = STATE_INTERACTING;
      if (withObject?.state !== undefined) {
        withObject.state = STATE_INTERACTING;
      }

      // Run the appropriate action (waits for completion). Freeze the rest
      // of the world for the dialogue duration so enemies can't hit the hero
      // mid-textbox and knockbacks can't interrupt it.
      if (typeof withObject?.getContent === "function") {
        events.emit("WORLD_PAUSE");
        await this.runTextBoxAction(withObject);
        events.emit("WORLD_RESUME");
      }

      // Return hero and target to idle state
      this.hero.state = STATE_IDLE;
      if (withObject?.state !== undefined) {
        withObject.state = STATE_IDLE;
      }
    })
  }

  runTextBoxAction(withObject) {
    return new Promise((resolve) => {
      const content = withObject.getContent();

      if (!content) {
        resolve();
        return;
      }

      // Potentially add a story flag
      if (content.addsFlag) {
        storyFlags.add(content.addsFlag);
      }

      // Show the textbox
      const textbox = new SpriteTextString({
        portraitFrame: content.portraitFrame,
        string: content.string
      });
      this.addChild(textbox);
      events.emit("START_TEXT_BOX");

      // When text box ends, resolve the promise
      const endingSub = events.on("END_TEXT_BOX", this, () => {
        textbox.destroy();
        this._hudDirty = true;
        events.off(endingSub);
        resolve();
      })
    })
  }

  _pauseFlagged() {
    // Use `suspended` (not `paused`) so child subtrees keep ticking — Hero is
    // suspended on encounter but its Companion child still needs to animate.
    this._sortedObjects.forEach(obj => {
      if (obj.suspendOnPause) obj.suspended = true;
    });
  }

  _resumeFlagged() {
    this._sortedObjects.forEach(obj => {
      if (obj.suspendOnPause) obj.suspended = false;
    });
  }

  setLevel(newLevelInstance, heroPosition = null) {
    // Detach hero from old level (preserves event subscriptions). Companion
    // is Hero's child, so it travels along.
    if (this.hero?.parent) {
      this.hero.parent.detachChild(this.hero);
    }

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
    }

    // Add hero into the new level
    if (this.hero) {
      this.level.addChild(this.hero);
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
      // Dirty the cached merged sequence so the removed ref drops out on
      // next rebuild (otherwise a destroyed object's draw() would keep firing
      // — e.g. a projectile's debug hitbox lingering after impact).
      this._ySortDirty = true;
    }
  }

  /**
   * Rebuild the sorted objects list from scratch
   */
  _rebuildSortedObjects() {
    this._sortedObjects = [];

    // All Y-sorted objects (hero, NPCs, enemies, etc.) live in level.children
    if (this.level) {
      this.level.children.forEach(child => {
        this._sortedObjects.push(child);
      });
    }

    this._ySortDirty = true;
  }

  /**
   * Compute viewport bounds in world space from the current canvas transform.
   * Call once per frame; pass the result to _isInViewport for per-object checks.
   */
  _getViewportBounds(ctx) {
    const transform = ctx.getTransform();
    const cameraX = -transform.e;
    const cameraY = -transform.f;
    const buffer = CULLING.BUFFER_TILES * TILE_SIZE;

    return {
      left: cameraX - buffer,
      right: cameraX + CANVAS.WIDTH + buffer,
      top: cameraY - buffer,
      bottom: cameraY + CANVAS.HEIGHT + buffer,
    };
  }

  _isInViewport(gameObject, bounds) {
    const { x, y } = gameObject.position;
    return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
  }

  drawBackground(ctx) {
    this.level?.background.drawImage(ctx,0,0);
  }

  drawObjects(ctx) {

    // 1. Draw ground chunks from level (before game objects)
    if (this.level && typeof this.level.drawGroundChunks === 'function') {
      this.level.drawGroundChunks(ctx);
    }

    // 2. Y-sort pass.
    // Sort + merge work runs ONLY on dirty (interval-driven: tile arrival,
    // add/remove, chunk load/unload). Per-frame work is just the iteration
    // below — required because the canvas is cleared every frame.
    if (this._ySortDirty) {
      this._sortedObjects.sort((a, b) => a.position.y - b.position.y);

      // Two-pointer merge of game objects + level ySort tiles (both sorted
      // by Y) into the reused _mergedYSort. Entries are stored directly —
      // duck-type at draw time via the `position` property.
      this._mergedYSort.length = 0;
      const objs = this._sortedObjects;
      const tiles = this.level?.ySortDrawables ?? [];
      let oi = 0, ti = 0;
      while (oi < objs.length || ti < tiles.length) {
        const oy = oi < objs.length ? objs[oi].position.y : Infinity;
        const ty = ti < tiles.length ? tiles[ti].worldY : Infinity;
        if (oy <= ty) this._mergedYSort.push(objs[oi++]);
        else this._mergedYSort.push(tiles[ti++]);
      }
      this._ySortDirty = false;
    }

    // Per-frame iteration: walk the cached merged sequence and draw what's
    // in view. Entries are either game objects (have `.position`) or tile
    // drawables (have `.tileId`).
    const viewportBounds = this._getViewportBounds(ctx);
    for (const e of this._mergedYSort) {
      if (e.position) {
        if (this._isInViewport(e, viewportBounds)) e.draw(ctx, 0, 0);
      } else {
        if (e.worldX >= viewportBounds.left && e.worldX <= viewportBounds.right &&
            e.worldY >= viewportBounds.top && e.worldY <= viewportBounds.bottom) {
          e.chunk._drawTile(ctx, e.tileId, e.worldX, e.worldY);
        }
      }
    }

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