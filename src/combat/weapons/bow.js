import { PROJECTILE } from "../attackTypes.js";
import { HITBOX_FRONT } from "../attackHelpers.js";

export const bow = {
    id: "bow",
    name: "Bow",
    damage: 10,
    attackType: PROJECTILE,
    hitbox: { range: 1, shape: HITBOX_FRONT },
    // Sprite configuration
    sprite: {
        resource: "bow",  // key in resources.images
        frameSize: { x: 6, y: 13 },
        hFrames: 2,
        vFrames: 1,
    },
    animations: {
        projectileDown: [
            { frame: 1, offset: { x: 4, y: 4 }, visible: true, damageActive: true },
            { frame: 0, offset: { x: -4, y: 0 }, visible: true, damageActive: false },
            { frame: 1, offset: { x: -4, y: 0 }, visible: true, damageActive: false }
        ],
        projectileUp: [
            { frame: 1, offset: { x: 0, y: 4 }, visible: true, damageActive: true },
            { frame: 0, offset: { x: -4, y: 0 }, visible: true, damageActive: false },
            { frame: 1, offset: { x: -4, y: 0 }, visible: true, damageActive: false }
        ],
        projectileLeft: [
            { frame: 1, offset: { x: 0, y: 4 }, visible: true, damageActive: true },
            { frame: 0, offset: { x: -4, y: 0 }, visible: true, damageActive: false },
            { frame: 1, offset: { x: -4, y: 0 }, visible: true, damageActive: false }
        ],
        projectileRight: [
            { frame: 1, offset: { x: 12, y: -4 }, visible: true, damageActive: true },
            { frame: 0, offset: { x: 12, y: -4 }, visible: true, damageActive: false },
            { frame: 1, offset: { x: 12, y: -4 }, visible: true, damageActive: false }
        ]
    }
};
