import { FIRE } from "../attackTypes.js";
import { HITBOX_FRONT } from "../attackHelpers.js";

export const firearm = {
    id: "firearm",
    name: "Firearm",
    damage: {
        hp: 10,
        effects: null,
    },
    ammo: 2,
    cooldown: "10000",
    attackType: FIRE,
    hitbox: { range: 0, shape: null },
    launchTime: 400,
    projectile: {
        id: "arrow",
        speed: 4,
        maxRange: 128,
        spriteOffset: { x: 0, y: -6 },
        sprite: {
            resource: "arrow",
            frameSize: { x: 16, y: 16 },
            hFrames: 1,
            vFrames: 4,
        },
        animations: {
            flyRight: [{ frame: 0 }],
            flyUp:    [{ frame: 1 }],
            flyLeft:  [{ frame: 2 }],
            flyDown:  [{ frame: 3 }],
        },
    },
};
