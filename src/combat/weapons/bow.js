import { BOW } from "../attackTypes.js";

export const bow = {
    id: "bow",
    name: "Bow",
    damage: {
        hp: 10,
        effects: null,
    },
    ammo: "infinite",
    cooldown: null,
    attackType: BOW,
    hitbox: { range: 8, shape: null },
    // ms into the attack animation when the arrow is released
    icon: { resource: "bow", frameSize: { x: 16, y: 16 } },
    launchTime: 400,
    projectile: {
        id: "arrow",
        speed: 2,
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
