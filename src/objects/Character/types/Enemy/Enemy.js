import { Character } from "../../Character.js";
import { Vector2 } from "../../../../Vector2.js";
import { resources } from "../../../../Resource.js";
import { DOWN, LEFT} from "../../../../Input.js";
import { createHeroAnimations } from "../../characterAnimations.js";
import { sword, bow } from "../../../../combat/weapons/index.js";

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
        });

        this.facingDirection = LEFT;
        // this.equip(sword);
        this.equip(bow);
        this.attackCooldown = 3000;
        this.attackTimer_ = this.attackCooldown;
    }

    draw(ctx, x, y) {
        ctx.save();
        ctx.filter = "saturate(0) brightness(0.7)";
        super.draw(ctx, x, y);
        ctx.restore();
    }

    step(delta, root) {
        this.attackTimer_ -= delta;
        if (this.attackTimer_ <= 0) {
            this.attack();
            this.attackTimer_ = this.attackCooldown;
        }
        super.step(delta, root);
    }
}
