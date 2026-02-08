import { PROJECTILE } from "../attackTypes.js";
import { HITBOX_FRONT } from "../attackHelpers.js";

const x = 0;
const y = 0;

export const arrow = {
    id: "arrow",
    name: "Arrow",
    damage: {
        hp: 10,
        effects: null,
    },
    ammo: "infinite",
    cooldown: "10000",
    attackType: PROJECTILE,
    hitbox: { range: 1, shape: HITBOX_FRONT },
    // Sprite configuration
    sprite: {
        resource: "arrow",  // key in resources.images
        frameSize: { x: 16, y: 16 },
        hFrames: 1,
        vFrames: 4,
    },
    animations: {
        projetileRight: [
            { frame: 0, offset: { x, y }, visible: true, damageActive: true },
        ],
        projectileUp: [
            { frame: 1, offset: { x, y }, visible: true, damageActive: true },
        ],
        projectileLeft: [
            { frame: 2, offset: { x, y }, visible: true, damageActive: true },
        ],
        projectileDown: [
            { frame: 3, offset: { x, y }, visible: true, damageActive: true },
        ]
    }
};
