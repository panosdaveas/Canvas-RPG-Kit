import { Character } from "../../Character.js";
import { Vector2 } from "../../../../Vector2.js";
import { resources } from "../../../../Resource.js";
import { storyFlags } from "../../../../StoryFlags.js";
import { RoutineController } from "../../../../controllers/RoutineController.js"

export class Npc extends Character {
  /**
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} config - NPC configuration
   * @param {string} [config.spriteResource] - NPC spritesheet reference to resources
   * @param {Array} [config.content] - Dialogue content array
   * @param {number} [config.portraitFrame] - Portrait frame for dialogue
   * @param {Object} [config.spriteResource] - Custom sprite resource
   * @param {Animations} [config.animations] - Animations (null for static)
   * @param {number} [config.frame] - Static frame to display
   * @param {number} [config.hFrames] - Horizontal frames in sprite sheet
   * @param {number} [config.vFrames] - Vertical frames in sprite sheet
   */
  constructor(x, y, config = {}) {
    // Shares the protagonist Aseprite bundle for now (same as before, when
    // it used createHeroAnimations()). Will move to its own bundle once a
    // dedicated NPC sheet is exported.
    const aseprite = resources.aseprite.protagonist;
    super({
      position: new Vector2(x, y),
      spriteResource: resources.images[config.spriteResource] ?? aseprite.image,
      animations: aseprite.createAnimations(),
      frameSize: config.frameSize ?? new Vector2(aseprite.frameSize.w, aseprite.frameSize.h),
      hFrames: config.hFrames ?? aseprite.hFrames,
      vFrames: config.vFrames ?? aseprite.vFrames,
      frame: config.frame ?? 0,
      bodyOffset: new Vector2(-28, -36),
      shadowOffset: new Vector2(-8, -18),
      isSolid: true,
    });

    // NPC-specific: dialogue content
    this.facingDirection = config.facingDirection;
    this.textContent = config.content;
    this.textPortraitFrame = config.portraitFrame;

    // Set up routine controller if a routine was provided
    if (config.routine) {
      this.setController(new RoutineController(this, {
        routine: config.routine,
        loop: config.loop ?? false,
        pingPong: config.pingPong ?? false
      }));
    }
  }

  /**
   * Get dialogue content, respecting story flags
   * @returns {Object|null} Content object with portraitFrame, string, and optional addsFlag
   */
  getContent() {
    // Maybe expand with story flag logic, etc
    const match = storyFlags.getRelevantScenario(this.textContent);
    if (!match) {
      console.warn("No matches found in this list!", this.textContent);
      return null;
    }

    return {
      portraitFrame: this.textPortraitFrame,
      string: match.string,
      addsFlag: match.addsFlag ?? null
    };
  }

  draw(ctx, x, y) {
    ctx.save();
    ctx.filter = "saturate(0) brightness(2)";
    super.draw(ctx, x, y);
    ctx.restore();
  }
}
