import { Controller } from "./Controller.js";
import { DOWN, LEFT, RIGHT, UP } from "../Input.js";
import { STATE_IDLE } from "../objects/Character/Character.js";
import { isTileFree } from "../helpers/grid.js";
import { TILE_SIZE } from "../Constants.js";
import { events } from "../Events.js";

export class CompanionController extends Controller {
  constructor(character, config = {}) {
    super(character);
    this.followDistance = config.followDistance ?? 1; // tiles — start moving when further than this
    this.heroPosition = null;

    events.on("HERO_POSITION", this, (pos) => {
      this.heroPosition = pos;
    });
  }

  update(delta, root) {
    const character = this.character;

    if (!this.heroPosition) return;
    if (character.state !== STATE_IDLE || !character.hasArrivedAtDestination()) return;

    const dx = this.heroPosition.x - character.position.x;
    const dy = this.heroPosition.y - character.position.y;
    const dist = (Math.abs(dx) + Math.abs(dy)) / TILE_SIZE;

    if (dist <= this.followDistance) {
      character.playIdleAnimation();
      return;
    }

    const candidates = root.level?.children ? [...root.level.children] : [];
    const primary = this.directionToward(dx, dy);
    const secondary = this.secondaryDirection(dx, dy);
    const directions = secondary ? [primary, secondary] : [primary];

    for (const dir of directions) {
      const next = character.position.toNeighbor(dir);
      if (isTileFree(root.level?.walls, candidates, next.x, next.y, character)) {
        character.facingDirection = dir;
        character.destinationPosition.x = next.x;
        character.destinationPosition.y = next.y;
        character.playWalkAnimation(dir);
        return;
      }
    }

    character.playIdleAnimation();
  }

  directionToward(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? RIGHT : LEFT;
    }
    return dy > 0 ? DOWN : UP;
  }

  secondaryDirection(dx, dy) {
    if (dx === 0 || dy === 0) return null;
    if (Math.abs(dx) > Math.abs(dy)) {
      return dy > 0 ? DOWN : UP;
    }
    return dx > 0 ? RIGHT : LEFT;
  }
}
