import { Character } from "../../Character.js";
import { Vector2 } from "../../../../Vector2.js";
import { resources } from "../../../../Resource.js";
import * as weapons from "../../../../combat/weapons/index.js";
import { EnemyController } from "../../../../controllers/EnemyController.js";

export class Enemy extends Character {
    constructor(config = {}) {
        // Reuses the protagonist Aseprite bundle — same behavior as before
        // when Enemy used createHeroAnimations(). Will get its own bundle
        // when a dedicated enemy sheet is exported.

        //Tiled Enemy Object properties: 
        // Mandatory:
        // weapon(string) - the controller depends on the weapon. 
        // position
        // Optional:
        // maybe starting facing direction
        // dir to sprite? 
        // speed
        // team

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
            // facingDirection from Tiled (string like "UP"/"DOWN"/"LEFT"/"RIGHT").
            // Falls back to Character's default (DOWN) if not set in the map.
            facingDirection: config.facingDirection,
        });

        // weapon from Tiled (string key into the weapons module, e.g. "sword").
        // Guard against typos / unknown keys so we don't crash on equip().
        if (config?.weapon && weapons[config.weapon]) {
            this.weapon = weapons[config.weapon];
            this.equip(this.weapon);
        } else if (config?.weapon) {
            console.warn(`Enemy: unknown weapon "${config.weapon}"`);
        }
        this.setController(new EnemyController(this, {}));
    }

    draw(ctx, x, y) {
        ctx.save();
        ctx.filter = "saturate(0) brightness(0.7)";
        super.draw(ctx, x, y);
        ctx.restore();
    }
}
