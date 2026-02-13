import { Character } from "../../Character.js";
import { Vector2 } from "../../../../Vector2.js";
import { resources } from "../../../../Resource.js";
import { LEFT } from "../../../../Input.js";
import { createHeroAnimations } from "../../characterAnimations.js";
import { sword, bow } from "../../../../combat/weapons/index.js";
import { EnemyController } from "../../../../controllers/EnemyController.js";

export class Enemy extends Character {
    constructor(x, y) {
        super({
            position: new Vector2(x, y),
            spriteResource: resources.images.hero,
            animations: createHeroAnimations(),
            frameSize: new Vector2(32, 32),
            hFrames: 52,
            vFrames: 17,
            frame: 1,
            bodyOffset: new Vector2(-8, -16),
            shadowOffset: new Vector2(-8, -18),
            isSolid: true,
            team: "enemy",
            speed: 0.5,
        });

        this.facingDirection = LEFT;
        this.equip(sword);
        this.setController(new EnemyController(this, {
            detectionRange: 3,
            attackRange: 1,
        }));
    }

    draw(ctx, x, y) {
        ctx.save();
        ctx.filter = "saturate(0) brightness(0.7)";
        super.draw(ctx, x, y);
        ctx.restore();
    }
}
