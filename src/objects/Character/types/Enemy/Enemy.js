import { Character } from "../../Character.js";
import { Vector2 } from "../../../../Vector2.js";
import { resources } from "../../../../Resource.js";
import { LEFT } from "../../../../Input.js";
import * as weapons from "../../../../combat/weapons/index.js";
import { EnemyController } from "../../../../controllers/EnemyController.js";

export class Enemy extends Character {
    constructor(config = {}) {
        // Reuses the protagonist Aseprite bundle — same behavior as before
        // when Enemy used createHeroAnimations(). Will get its own bundle
        // when a dedicated enemy sheet is exported.
        const aseprite = resources.aseprite.protagonist;
        super({
            position: new Vector2(config.x, config.y),
            spriteResource: aseprite.image,
            animations: aseprite.createAnimations(),
            frameSize: new Vector2(aseprite.frameSize.w, aseprite.frameSize.h),
            hFrames: aseprite.hFrames,
            vFrames: aseprite.vFrames,
            frame: 0,
            // bodyOffset: new Vector2(-8, -16),
            bodyOffset: new Vector2(-28, -36),
            shadowOffset: new Vector2(-8, -18),
            isSolid: true,
            team: "enemy",
            speed: 0.5,
            weapon: null,
        });

        this.facingDirection = LEFT;
        if (config.weapon == "bow") {
            this.weapon = weapons.bow;
            this.equip(this.weapon);
        }
        if (config.weapon == "sword") {
            this.weapon = weapons.sword;
            this.equip(this.weapon);
        }
        this.setController(new EnemyController(this, {
            detectionRange: 5,
            attackRange: 10,
        }));
    }

    draw(ctx, x, y) {
        ctx.save();
        ctx.filter = "saturate(0) brightness(0.7)";
        super.draw(ctx, x, y);
        ctx.restore();
    }
}
