import { FIRE } from "../attackTypes.js";
import { HITBOX_FRONT } from "../attackHelpers.js";

export const firearm = {
    id: "firearm",
    name: "Firearm",
    damage: {
        hp: 10,
        effects: null,
    },
    ammo: "infinite",
    cooldown: "10000",
    attackType: FIRE,
    hitbox: { range: 1, shape: HITBOX_FRONT },
};
