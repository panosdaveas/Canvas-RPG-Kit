import { SWORD } from "../attackTypes.js";
import { HITBOX_ARC } from "../attackHelpers.js";

export const sword = {
    id: "sword",
    name: "Sword",
    damage: {
        hp: 10,
        effects: null,
    },
    ammo: "infinite",
    cooldown: 1500,
    attackType: SWORD,
    hitbox: { range: 1, shape: HITBOX_ARC },
    detectionRange: 5,
    icon: { resource: "swordIcon", frameSize: { x: 24, y: 24 } },
};
