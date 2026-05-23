import { BOW } from "../attackTypes.js";

export const bow = {
    id: "bow",
    name: "Bow",
    damage: {
        hp: 10,
        effects: null,
    },
    ammo: "infinite",
    cooldown: 2000,
    attackType: BOW,
    hitbox: { range: 7, shape: null },
    // Projectile launch frame is driven by Aseprite tag User Data
    // ({"launchFrame": N}) on bow_<dir> — see protagonist_new.json.
    icon: { resource: "bowIcon", frameSize: { x: 24, y: 24 } },
    projectile: {
        id: "arrow",
        speed: 2,
        maxRange: 112,
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
