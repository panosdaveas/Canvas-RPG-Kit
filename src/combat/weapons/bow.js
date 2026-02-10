import { PROJECTILE } from "../attackTypes.js";
import { HITBOX_FRONT } from "../attackHelpers.js";

const x= -8;
const y= -16;

const makeFrames = (row, opts, overrides = {}) =>
    Array.from({ length: FRAMES_PER_SWING }, (_, i) => ({
        frame: row * FRAMES_PER_SWING + i,
        ...opts,
        ...(overrides[i] ?? {}),
    }));

const common = {
    offset: { x, y },
    visible: true,
    damageActive: true,
    launch: false,
};

const range = (from, to, props) =>
    Object.fromEntries(
        Array.from({ length: to - from + 1 }, (_, i) => [
            from + i,
            props,
        ])
    );

const overrides = {
    ...range(8, 42, { projectileVisible: true }),
    36: { launch: true },
};

const FRAMES_PER_SWING = 52;

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
        hFrames: 52,
        vFrames: 4,
    },
    // Projectile configuration
    projectile: {
        id: "arrow",
        speed: 2,
        maxRange: 128,
        offset: { x: 8, y: 8 }, // Offset relative to weapon sprite
        sprite: {
            resource: "arrow",
            frameSize: { x: 16, y: 16 },
            hFrames: 1,
            vFrames: 4,
        },
        animations: {
            flyRight: [{ frame: 0 }],
            flyUp: [{ frame: 1 }],
            flyLeft: [{ frame: 2 }],
            flyDown: [{ frame: 3 }],
        }
    },
    animations: {
        projectileRight: makeFrames(0, common, overrides),

        projectileUp: makeFrames(1, common, overrides),

        projectileLeft: makeFrames(2, common, overrides),

        projectileDown: makeFrames(3, common, overrides),
    }
};
