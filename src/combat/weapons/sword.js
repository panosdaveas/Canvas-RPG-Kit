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
    cooldown: null,
    attackType: SWORD,
    hitbox: { range: 1, shape: HITBOX_ARC },
};
