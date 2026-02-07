import { SWING } from "../attackTypes.js";
import { HITBOX_ARC } from "../attackHelpers.js";

const x= -24;
const y= -32;

export const sword = {
    id: "sword",
    name: "Sword",
    damage: {
        hp: 10,
        effects: null,
    },
    ammo: "infinite",
    cooldown: null,
    attackType: SWING,
    hitbox: { range: 1, shape: HITBOX_ARC },
    // Sprite configuration
    sprite: {
        resource: "sword",  // key in resources.images
        frameSize: { x: 64, y: 64 },
        hFrames: 8,
        vFrames: 4,
    },
    animations: {
        swingRight: [
            { frame: 0, offset: { x, y }, visible: true, damageActive: true },
            { frame: 1, offset: { x, y }, visible: true, damageActive: true },
            { frame: 2, offset: { x, y }, visible: true, damageActive: true },
            { frame: 3, offset: { x, y }, visible: true, damageActive: true },
            { frame: 4, offset: { x, y }, visible: true, damageActive: true },
            { frame: 5, offset: { x, y }, visible: true, damageActive: true },
            { frame: 6, offset: { x, y }, visible: true, damageActive: true },
            { frame: 7, offset: { x, y }, visible: true, damageActive: true },
        ],
        swingUp: [
            { frame: 8, offset: { x, y }, visible: true, damageActive: true },
            { frame: 9, offset: { x, y }, visible: true, damageActive: true },
            { frame: 10, offset: { x, y }, visible: true, damageActive: true },
            { frame: 11, offset: { x, y }, visible: true, damageActive: true },
            { frame: 12, offset: { x, y }, visible: true, damageActive: true },
            { frame: 13, offset: { x, y }, visible: true, damageActive: true },
            { frame: 14, offset: { x, y }, visible: true, damageActive: true },
            { frame: 15, offset: { x, y }, visible: true, damageActive: true },
        ],
        swingLeft: [
            { frame: 16, offset: { x, y }, visible: true, damageActive: true },
            { frame: 17, offset: { x, y }, visible: true, damageActive: true },
            { frame: 18, offset: { x, y }, visible: true, damageActive: true },
            { frame: 19, offset: { x, y }, visible: true, damageActive: true },
            { frame: 20, offset: { x, y }, visible: true, damageActive: true },
            { frame: 21, offset: { x, y }, visible: true, damageActive: true },
            { frame: 22, offset: { x, y }, visible: true, damageActive: true },
            { frame: 23, offset: { x, y }, visible: true, damageActive: true },
        ],
        swingDown: [
            { frame: 24, offset: { x, y }, visible: true, damageActive: true },
            { frame: 25, offset: { x, y }, visible: true, damageActive: true },
            { frame: 26, offset: { x, y }, visible: true, damageActive: true },
            { frame: 27, offset: { x, y }, visible: true, damageActive: true },
            { frame: 28, offset: { x, y }, visible: true, damageActive: true },
            { frame: 29, offset: { x, y }, visible: true, damageActive: true },
            { frame: 30, offset: { x, y }, visible: true, damageActive: true },
            { frame: 31, offset: { x, y }, visible: true, damageActive: true },
        ]
    }
};
