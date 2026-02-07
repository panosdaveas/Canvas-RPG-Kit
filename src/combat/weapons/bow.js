import { PROJECTILE } from "../attackTypes.js";
import { HITBOX_FRONT } from "../attackHelpers.js";

const x= -8;
const y= -16;

export const bow = {
    id: "bow",
    name: "Bow",
    damage: {
        hp: 10,
        effects: null,
    },
    ammo: "infinite",
    cooldown: null,
    attackType: PROJECTILE,
    hitbox: { range: 1, shape: HITBOX_FRONT },
    // Sprite configuration
    sprite: {
        resource: "bow",  // key in resources.images
        frameSize: { x: 32, y: 32 },
        hFrames: 10,
        vFrames: 4,
    },
    animations: {
        projectileRight: [
            { frame: 0, offset: { x, y }, visible: true, damageActive: true },
            { frame: 1, offset: { x, y }, visible: true, damageActive: true },
            { frame: 2, offset: { x, y }, visible: true, damageActive: true },
            { frame: 3, offset: { x, y }, visible: true, damageActive: true },
            { frame: 4, offset: { x, y }, visible: true, damageActive: true },
            { frame: 5, offset: { x, y }, visible: true, damageActive: true },
            { frame: 6, offset: { x, y }, visible: true, damageActive: true },
            { frame: 7, offset: { x, y }, visible: true, damageActive: true },
            { frame: 8, offset: { x, y }, visible: true, damageActive: true },
            { frame: 9, offset: { x, y }, visible: true, damageActive: true },
        ],
        projectileUp: [
            { frame: 10, offset: { x, y }, visible: true, damageActive: true },
            { frame: 11, offset: { x, y }, visible: true, damageActive: true },
            { frame: 12, offset: { x, y }, visible: true, damageActive: true },
            { frame: 13, offset: { x, y }, visible: true, damageActive: true },
            { frame: 14, offset: { x, y }, visible: true, damageActive: true },
            { frame: 15, offset: { x, y }, visible: true, damageActive: true },
            { frame: 16, offset: { x, y }, visible: true, damageActive: true },
            { frame: 17, offset: { x, y }, visible: true, damageActive: true },
            { frame: 18, offset: { x, y }, visible: true, damageActive: true },
            { frame: 19, offset: { x, y }, visible: true, damageActive: true },
        ],
        projectileLeft: [
            { frame: 20, offset: { x, y }, visible: true, damageActive: true },
            { frame: 21, offset: { x, y }, visible: true, damageActive: true },
            { frame: 22, offset: { x, y }, visible: true, damageActive: true },
            { frame: 23, offset: { x, y }, visible: true, damageActive: true },
            { frame: 24, offset: { x, y }, visible: true, damageActive: true },
            { frame: 25, offset: { x, y }, visible: true, damageActive: true },
            { frame: 26, offset: { x, y }, visible: true, damageActive: true },
            { frame: 27, offset: { x, y }, visible: true, damageActive: true },
            { frame: 28, offset: { x, y }, visible: true, damageActive: true },
            { frame: 29, offset: { x, y }, visible: true, damageActive: true },
        ],
        projectileDown: [
            { frame: 30, offset: { x, y }, visible: true, damageActive: true },
            { frame: 31, offset: { x, y }, visible: true, damageActive: true },
            { frame: 32, offset: { x, y }, visible: true, damageActive: true },
            { frame: 33, offset: { x, y }, visible: true, damageActive: true },
            { frame: 34, offset: { x, y }, visible: true, damageActive: true },
            { frame: 35, offset: { x, y }, visible: true, damageActive: true },
            { frame: 36, offset: { x, y }, visible: true, damageActive: true },
            { frame: 37, offset: { x, y }, visible: true, damageActive: true },
            { frame: 38, offset: { x, y }, visible: true, damageActive: true },
            { frame: 39, offset: { x, y }, visible: true, damageActive: true },
        ]
    }
};
