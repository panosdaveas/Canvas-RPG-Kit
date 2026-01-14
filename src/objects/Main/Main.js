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

  drawBackground(ctx) {
    this.level?.background.drawImage(ctx,0,0);
  }

  drawObjects(ctx) {
    // 1. Draw ground chunks from level (before game objects)
    if (this.level && typeof this.level.drawGroundChunks === 'function') {
      this.level.drawGroundChunks(ctx);
    }

    // 2. Draw all game objects (hero, NPCs, level children, etc.) - Y-sorted
    this.children.forEach(child => {
      if (child.drawLayer !== "HUD") {
        child.draw(ctx, 0, 0);
      }
    })

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

  drawHud(ctx) {
    this.children.forEach(child => {
      if (child.drawLayer === "HUD") {
        child.draw(ctx, 0, 0);
      }
    })
  }

}