import {GameObject} from "../../GameObject.js";
import {Sprite} from "../../Sprite.js";
import {resources} from "../../Resource.js";
import {Vector2} from "../../Vector2.js";
import {events} from "../../Events.js";

export class Inventory extends GameObject {
  constructor() {
    super({
      position: new Vector2(0, 1)
    });

    this.drawLayer = "HUD";

    this.nextId = 0;
    this.items = [
      {
        id: -1,
        image: resources.images.rod
      },
      {
        id: -2,
        image: resources.images.rod
      }
    ]

    this._equippedWeapon = null;

    // React to Hero picking up an item
    events.on("HERO_PICKS_UP_ITEM", this, data => {
      this.nextId += 1;
      this.items.push({
        id: this.nextId,
        image: resources.images.rod
      })
      this.renderInventory();
    })

    events.on("WEAPON_SELECTED", this, ({ weapon }) => {
      this._equippedWeapon = weapon;
      this.renderInventory();
    })

    // Demo removing of something (could happen on item use)
    // setTimeout(() => {
    //   this.removeFromInventory(-2)
    // }, 2000)

    // Draw initial state on bootup
    this.renderInventory();
  }

  renderInventory() {
    this.children.forEach(child => child.destroy())

    this.items.forEach((item, index) => {
      const sprite = new Sprite({
        resource: item.image,
        position: new Vector2(index * 12, 0)
      })
      this.addChild(sprite);
    })

    if (this._equippedWeapon?.icon) {
      const icon = this._equippedWeapon.icon;
      const weaponSprite = new Sprite({
        resource: resources.images[icon.resource],
        frameSize: new Vector2(icon.frameSize.x, icon.frameSize.y),
        position: new Vector2(this.items.length * 12 + 8, 0)
      })
      this.addChild(weaponSprite);
    }

    events.emit("HUD_DIRTY");
  }

  removeFromInventory(id) {
    this.items = this.items.filter(item => item.id !== id);
    this.renderInventory();
  }

}












