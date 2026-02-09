import { SWING } from "../attackTypes.js";
import { HITBOX_ARC } from "../attackHelpers.js";

const x= -24;
const y= -32;

const makeFrames = (row, opts) =>
    Array.from({ length: FRAMES_PER_SWING }, (_, i) => ({
        frame: row * FRAMES_PER_SWING + i,
        ...opts,
    }));

const common = {
    offset: { x, y },
    visible: true,
    damageActive: true,
};

const FRAMES_PER_SWING = 15;

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
        hFrames: 15,
        vFrames: 4,
    },
    animations: {
        swingRight: makeFrames(0, common),
        swingUp: makeFrames(1, common),
        swingLeft: makeFrames(2, common),
        swingDown: makeFrames(3, common),
    },
};
