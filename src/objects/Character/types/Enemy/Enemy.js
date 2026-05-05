import { Character } from "../../Character.js";
import { Vector2 } from "../../../../Vector2.js";
import { resources } from "../../../../Resource.js";
import { LEFT } from "../../../../Input.js";
import { createHeroAnimations } from "../../characterAnimations.js";
import * as weapons from "../../../../combat/weapons/index.js";
import { EnemyController } from "../../../../controllers/EnemyController.js";

export class Enemy extends Character {
    constructor(config = {}) {
        super({
            position: new Vector2(config.x, config.y),
            spriteResource: resources.images.hero,
            animations: createHeroAnimations(),
            frameSize: new Vector2(72, 72),
            hFrames: 4,
            vFrames: 16,
            frame: 1,
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
