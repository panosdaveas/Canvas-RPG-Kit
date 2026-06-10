import { GameObject } from "../../GameObject.js";
import { Vector2 } from "../../Vector2.js";
import { Sprite } from "../../Sprite.js";
import { TILE_SIZE } from "../../Constants.js";

/**
 * GameObject backed by a single tile from a Tiled tileset. Used for
 * destructible scenery placed as tile objects in an object layer (signs,
 * crates, breakable pots, etc.).
 *
 * Carries a real `sprite` so the projectile-shatter pipeline
 * (blocker.sprite → ParticleBurst → blocker.destroy()) works with zero
 * special-casing — the tile is just a normal Sprite whose frame happens to
 * point at a specific source rect in a tileset image.
 *
 * Position semantics match Tiled tile-objects: anchor is bottom-left of the
 * tile, so the sprite is offset -TILE_SIZE in Y to render upward.
 */
export class TileObject extends GameObject {
  constructor({ x, y, tileSource, isSolid = true }) {
    super({ position: new Vector2(x, y) });
    this.isSolid = isSolid;

    const { resource, srcX, srcY, srcW, srcH } = tileSource;
    this.sprite = new Sprite({
      resource,
      frameSize: new Vector2(srcW, srcH),
      hFrames: 1,
      vFrames: 1,
      frame: 0,
      position: new Vector2(0, -TILE_SIZE),
    });
    // Sprite.buildFrameMap auto-populates frameMap[0] = (0,0). Override it
    // so drawImage cuts from the specific tile rect inside the tileset.
    this.sprite.frameMap.set(0, new Vector2(srcX, srcY));
    this.addChild(this.sprite);
  }
}
