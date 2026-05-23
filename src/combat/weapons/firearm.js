import { FIREARM } from "../attackTypes.js";
import { HITBOX_FRONT } from "../attackHelpers.js";

export const firearm = {
    id: "firearm",
    name: "Firearm",
    damage: {
        hp: 10,
        effects: null,
    },
    ammo: "infinite",
    cooldown: 3000,
    attackType: FIREARM,
    hitbox: { range: 10, shape: null },
    icon: { resource: "firearmIcon", frameSize: { x: 24, y: 24 } },
    // Projectile launch frame is driven by Aseprite tag User Data
    // ({"launchFrame": N}) on firearm_<dir> — see protagonist_new.json.
    projectile: {
        id: "arrow",
        speed: 4,
        maxRange: 160,
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
