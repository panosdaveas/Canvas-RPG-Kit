import {GameObject} from "../../GameObject.js";
import {Input} from "../../Input.js";
import {Camera} from "../../Camera.js";
import {Inventory} from "../Inventory/Inventory.js";
import {events} from "../../Events.js";
import {SpriteTextString} from "../SpriteTextString/SpriteTextString.js";
import {storyFlags} from "../../StoryFlags.js";
import {Hero} from "../Hero/Hero.js";
import {Vector2} from "../../Vector2.js";
import {gridCells} from "../../helpers/grid.js";
import {CANVAS} from "../../Constants.js";

export class Main extends GameObject {
  constructor() {
    super({});
    this.level = null;
    this.input = new Input()
    this.camera = new Camera()
    this.hero = null;
  }

  ready() {

    const inventory = new Inventory()
    this.addChild(inventory);

    // Create hero (persists across levels)
    this.hero = new Hero(gridCells(15), gridCells(14));
    this.addChild(this.hero);

    // Change Level handler
    events.on("CHANGE_LEVEL", this, newLevelInstance => {
      this.setLevel(newLevelInstance)
    })

    // Launch Text Box handler
    events.on("HERO_REQUESTS_ACTION", this, (withObject) => {


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
          events.off(endingSub)
        })
      }

    })

  }

  setLevel(newLevelInstance) {
    if (this.level) {
      this.level.destroy();
    }
    this.level = newLevelInstance;
    this.addChild(this.level);
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
    const buffer = 32; // pixels

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
    // Save context state and apply camera offset
    ctx.save();

    if (this.camera) {
      // Round camera position to prevent sub-pixel rendering
      ctx.translate(
        Math.floor(this.camera.position.x),
        Math.floor(this.camera.position.y)
      );
    }

    // 1. Draw ground chunks from level (before game objects)
    if (this.level && typeof this.level.drawGroundChunks === 'function') {
      this.level.drawGroundChunks(ctx);
    }

    // 2. Draw all game objects (hero, NPCs, level children, etc.) - Y-sorted
    // Apply viewport culling to skip off-screen objects
    this.children.forEach(child => {
      if (child.drawLayer !== "HUD") {
        // Only draw objects within the visible viewport
        if (this._isInViewport(child, ctx)) {
          child.draw(ctx, 0, 0);
        }
      }
    })

    // 3. Draw foreground chunks from level (after game objects)
    if (this.level && typeof this.level.drawForegroundChunks === 'function') {
      this.level.drawForegroundChunks(ctx);
    }

    // Restore context state
    ctx.restore();
  }

  drawForeground(ctx) {
    this.children.forEach(child => {
      if (child.drawLayer === "FOREGROUND") {
        child.draw(ctx, 0, 0);
      }
    })
  }

  drawHud(ctx) {
    this.children.forEach(child => {
      if (child.drawLayer === "HUD") {
        child.draw(ctx, 0, 0);
      }
    })
  }

}