import { THROW } from "../attackTypes.js";
import { HITBOX_FRONT } from "../attackHelpers.js";

const x = -16;
const y = -24;

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

const FRAMES_PER_SWING = 17;

export const boomerang = {
    id: "boomerang",
    name: "Boomerang",
    damage: {
        hp: 10,
        effects: null,
    },
    ammo: "infinite",
    cooldown: "10000",
    attackType: THROW,
    hitbox: { range: 1, shape: HITBOX_FRONT },
    // Sprite configuration
    sprite: {
        resource: "boomerang",  // key in resources.images
        frameSize: { x: 48, y: 48 },
        hFrames: 17,
        vFrames: 4,
    },
    animations: {
        throwRight: makeFrames(0, common),
        throwUp: makeFrames(1, common),
        throwLeft: makeFrames(2, common),
        throwDown: makeFrames(3, common),
    },
};
