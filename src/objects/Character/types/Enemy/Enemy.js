import { Character } from "../../Character.js";
import { Vector2 } from "../../../../Vector2.js";
import { resources } from "../../../../Resource.js";
import { storyFlags } from "../../../../StoryFlags.js";
import { createHeroAnimations } from "../../characterAnimations.js";
import { RoutineController } from "../../../../controllers/RoutineController.js"
import { sword } from "../../../../combat/weapons/index.js";

export class Enemy extends Character {
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
        super({
            position: new Vector2(x, y),
            spriteResource: resources.images[config.spriteResource] ?? resources.images.npc1,
            animations: createHeroAnimations(),
            frameSize: config.frameSize ?? new Vector2(32, 32),
            hFrames: config.hFrames ?? 3,
            vFrames: config.vFrames ?? 8,
            frame: config.frame ?? 1,
            bodyOffset: new Vector2(-8, -20),
            shadowOffset: new Vector2(-8, -18),
            isSolid: true,
            team: "enemy",
        });

        this.equip(sword);

        // NPC-specific: dialogue content
        this.facingDirection = config.facingDirection;
        // this.textContent = config.content;
        // this.textPortraitFrame = config.portraitFrame;

        // Set up routine controller if a routine was provided
        // if (config.routine) {
        //     this.setController(new RoutineController(this, {
        //         routine: config.routine,
        //         loop: config.loop ?? false,
        //         pingPong: config.pingPong ?? false
        //     }));
        // }
    }

    /**
     * Get dialogue content, respecting story flags
     * @returns {Object|null} Content object with portraitFrame, string, and optional addsFlag
     */
    // getContent() {
    //     // Maybe expand with story flag logic, etc
    //     const match = storyFlags.getRelevantScenario(this.textContent);
    //     if (!match) {
    //         console.warn("No matches found in this list!", this.textContent);
    //         return null;
    //     }

    //     return {
    //         portraitFrame: this.textPortraitFrame,
    //         string: match.string,
    //         addsFlag: match.addsFlag ?? null
    //     };
    // }
}
