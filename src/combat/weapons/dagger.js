import { STAB } from "../attackTypes.js";
import { HITBOX_FRONT } from "../attackHelpers.js";

export const dagger = {
  id: "dagger",
  name: "Dagger",
  damage: 10,
  attackType: STAB,
  hitbox: { range: 1, shape: HITBOX_FRONT },
  // Sprite configuration
  sprite: {
    resource: "dagger",  // key in resources.images
    frameSize: { x: 16, y: 16 },
    hFrames: 4,
    vFrames: 1,
  },
  animations: {
    stabDown: [
      { frame: 3, offset: { x: 0, y: 4 }, visible: true, damageActive: true },
      { frame: 3, offset: { x: -4, y: 0 }, visible: false, damageActive: false }
    ],
    stabUp: [
      { frame: 1, offset: { x: 0, y: -12 }, visible: true, damageActive: true },
      { frame: 1, offset: { x: 0, y: -20 }, visible: false, damageActive: false }
    ],
    stabLeft: [
      { frame: 2, offset: { x: -8, y: -4 }, visible: true, damageActive: true },
      { frame: 2, offset: { x: -16, y: -4 }, visible: false, damageActive: false }
    ],
    stabRight: [
      { frame: 0, offset: { x: 8, y: -4 }, visible: true, damageActive: true },
      { frame: 0, offset: { x: 16, y: -4 }, visible: false, damageActive: false }
    ]
  }
};
