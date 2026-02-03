import { STAB } from "../attackTypes.js";
import { HITBOX_FRONT } from "../attackHelpers.js";

export const dagger = {
  id: "dagger",
  name: "Dagger",
  sprite: "dagger",  // key in resources.images
  damage: 10,
  attackType: STAB,
  hitbox: { range: 1, shape: HITBOX_FRONT },
  animations: {
    stabDown: [
      { frame: 0, offset: { x: 0, y: 4 }, visible: true, damageActive: false },
      { frame: 0, offset: { x: 0, y: 12 }, visible: true, damageActive: true }
    ],
    stabUp: [
      { frame: 0, offset: { x: 0, y: -12 }, visible: true, damageActive: false },
      { frame: 0, offset: { x: 0, y: -20 }, visible: true, damageActive: true }
    ],
    stabLeft: [
      { frame: 0, offset: { x: -8, y: -4 }, visible: true, damageActive: false },
      { frame: 0, offset: { x: -16, y: -4 }, visible: true, damageActive: true }
    ],
    stabRight: [
      { frame: 0, offset: { x: 8, y: -4 }, visible: true, damageActive: false },
      { frame: 0, offset: { x: 16, y: -4 }, visible: true, damageActive: true }
    ]
  }
};
