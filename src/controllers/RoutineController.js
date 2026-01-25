import { Controller } from "./Controller.js";
import { DOWN, LEFT, RIGHT, UP } from "../Input.js";
import { isSpaceFree } from "../helpers/grid.js";

/**
 * Controller for NPCs that follow a command-based movement routine.
 * Supports commands like FACE, IDLE, MOVE_UP, MOVE_DOWN, MOVE_LEFT, MOVE_RIGHT.
 *
 * Example routine string:
 * "FACE(DOWN), IDLE(1000), MOVE_DOWN(2), IDLE(500), MOVE_LEFT(3)"
 */
export class RoutineController extends Controller {
  /**
   * @param {Character} character - The character to control
   * @param {Object} config - Routine configuration
   * @param {string|Array} config.routine - Command string or array of command objects
   * @param {boolean} [config.loop=false] - Whether to loop the routine
   * @param {boolean} [config.pingPong=false] - Whether to reverse at end
   */
  constructor(character, config = {}) {
    super(character);
    // Parse routine if it's a string
    if (typeof config.routine === "string") {
      this.commands = RoutineController.parseRoutine(config.routine);
    } else {
      this.commands = config.routine ?? [];
    }

    this.loop = config.loop ?? false;
    this.pingPong = config.pingPong ?? false;

    // Internal state
    this.currentCommandIndex = 0;
    this.direction = 1; // 1 = forward, -1 = backward (for pingPong)
    this.isFinished = false;

    // State for current command execution
    this.commandState = null; // { type, remaining, ... }
  }

  /**
   * Parse a routine string into command objects
   * Format: "COMMAND(arg1, arg2), COMMAND(arg), ..."
   * @param {string} routineString
   * @returns {Array} Array of { command, args } objects
   */
  static parseRoutine(routineString) {
    const commands = [];

    // Match patterns like "COMMAND(arg1, arg2)" or "COMMAND(arg)"
    const regex = /(\w+)\(([^)]*)\)/g;
    let match;

    while ((match = regex.exec(routineString)) !== null) {
      const command = match[1].toUpperCase();
      const argsString = match[2].trim();

      // Parse arguments
      const args = argsString
        ? argsString.split(",").map(arg => {
            const trimmed = arg.trim();
            // Try to parse as number
            const num = parseFloat(trimmed);
            return isNaN(num) ? trimmed.toUpperCase() : num;
          })
        : [];

      commands.push({ command, args });
    }

    return commands;
  }

  update(delta, root) {
    const character = this.character;

    // If no commands or finished, idle
    if (this.commands.length === 0 || this.isFinished) {
      character.playIdleAnimation();
      return;
    }

    // If no current command state, start the next command
    if (!this.commandState) {
      this.startNextCommand();
      if (!this.commandState) return; // No more commands
    }

    // Execute current command
    const completed = this.executeCurrentCommand(delta, root);

    if (completed) {
      this.commandState = null;
      this.advanceToNextCommand();
    }
  }

  startNextCommand() {
    if (this.currentCommandIndex < 0 || this.currentCommandIndex >= this.commands.length) {
      return;
    }

    const cmd = this.commands[this.currentCommandIndex];

    switch (cmd.command) {
      case "FACE": {
        let dir = this.parseDirection(cmd.args[0]);
        if (this.direction === -1) {
          dir = this.invertDirection(dir);
        }
        this.commandState = {
          type: "FACE",
          direction: dir
        };
        break;
      }

      case "IDLE":
        this.commandState = {
          type: "IDLE",
          remaining: cmd.args[0] || 1000
        };
        break;

      case "MOVE_UP": {
        let dir = this.parseDirection(cmd.args[0]);
        if (this.direction === -1) {
          dir = this.invertDirection(dir);
        }
        this.commandState = {
          type: "MOVE",
          direction: dir,
          tilesRemaining: cmd.args[1] || 1,
          isMoving: false
        };
        break;
      }

      case "MOVE_DOWN": {
        let dir = this.parseDirection(cmd.args[0]);
        if (this.direction === -1) {
          dir = this.invertDirection(dir);
        }
        this.commandState = {
          type: "MOVE",
          direction: dir,
          tilesRemaining: cmd.args[1] || 1,
          isMoving: false
        };
        break;
      }

      case "MOVE_LEFT": {
        let dir = this.parseDirection(cmd.args[0]);
        if (this.direction === -1) {
          dir = this.invertDirection(dir);
        }
        this.commandState = {
          type: "MOVE",
          direction: dir,
          tilesRemaining: cmd.args[1] || 1,
          isMoving: false
        };
        break;
      }

      case "MOVE_RIGHT": {
        let dir = this.parseDirection(cmd.args[0]);
        if (this.direction === -1) {
          dir = this.invertDirection(dir);
        }
        this.commandState = {
          type: "MOVE",
          direction: dir,
          tilesRemaining: cmd.args[1] || 1,
          isMoving: false
        };
        break;
      }

      case "MOVE": {
        let dir = this.parseDirection(cmd.args[0]);
        if (this.direction === -1) {
          dir = this.invertDirection(dir);
        }
        this.commandState = {
          type: "MOVE",
          direction: dir,
          tilesRemaining: cmd.args[1] || 1,
          isMoving: false
        };
        break;
      }

      default:
        console.warn(`Unknown routine command: ${cmd.command}`);
        this.commandState = { type: "SKIP" };
    }
  }

  executeCurrentCommand(delta, root) {
    const character = this.character;
    const state = this.commandState;

    switch (state.type) {
      case "FACE":
        character.facingDirection = state.direction;
        character.playIdleAnimation();
        return true; // Instant completion

      case "IDLE":
        character.playIdleAnimation();
        state.remaining -= delta;
        return state.remaining <= 0;

      case "MOVE":
        return this.executeMove(delta, root, state);

      case "SKIP":
        return true;

      default:
        return true;
    }
  }

  executeMove(delta, root, state) {
    const character = this.character;
    const gridSize = 16;

    // Update facing direction
    character.facingDirection = state.direction;

    // If currently moving to a tile, wait for arrival
    if (state.isMoving) {
      if (character.hasArrivedAtDestination()) {
        state.isMoving = false;
        state.tilesRemaining--;

        if (state.tilesRemaining <= 0) {
          character.playIdleAnimation();
          return true; // Command complete
        }
      } else {
        character.playWalkAnimation(state.direction);
        return false; // Still moving
      }
    }

    // Start moving to next tile
    if (state.tilesRemaining > 0 && !state.isMoving) {
      const currentX = character.destinationPosition.x;
      const currentY = character.destinationPosition.y;

      let nextX = currentX;
      let nextY = currentY;

      switch (state.direction) {
        case UP:    nextY -= gridSize; break;
        case DOWN:  nextY += gridSize; break;
        case LEFT:  nextX -= gridSize; break;
        case RIGHT: nextX += gridSize; break;
      }

      // Check collision
      const spaceIsFree = isSpaceFree(root.level?.walls, nextX, nextY);

      const levelBodyAtSpace = root.level?.children.find(c => {
        if (!c.isSolid || c === character) return false;
        const checkX = c.destinationPosition?.x ?? c.position.x;
        const checkY = c.destinationPosition?.y ?? c.position.y;
        return checkX === nextX && checkY === nextY;
      });

      const heroAtSpace = root.hero &&
        root.hero.destinationPosition.x === nextX &&
        root.hero.destinationPosition.y === nextY;

      if (spaceIsFree && !levelBodyAtSpace && !heroAtSpace) {
        character.destinationPosition.x = nextX;
        character.destinationPosition.y = nextY;
        character.playWalkAnimation(state.direction);
        state.isMoving = true;
      } else if (!spaceIsFree) {
        // Blocked by wall - skip remaining moves in this command
        character.playIdleAnimation();
        return true;
      } else {
        // Blocked by character - wait
        character.playIdleAnimation();
      }
    }

    return false;
  }

  advanceToNextCommand() {
    const nextIndex = this.currentCommandIndex + this.direction;

    if (nextIndex >= this.commands.length || nextIndex < 0) {
      if (this.loop) {
        this.currentCommandIndex = this.direction === 1 ? 0 : this.commands.length - 1;
      } else if (this.pingPong) {
        this.direction *= -1;
        this.currentCommandIndex += this.direction;
      } else {
        this.isFinished = true;
      }
    } else {
      this.currentCommandIndex = nextIndex;
    }
  }

  parseDirection(dirString) {
    if (typeof dirString !== "string") return DOWN;

    switch (dirString.toUpperCase()) {
      case "UP": return UP;
      case "DOWN": return DOWN;
      case "LEFT": return LEFT;
      case "RIGHT": return RIGHT;
      default: return DOWN;
    }
  }

  invertDirection(dir) {
    switch (dir) {
      case UP: return DOWN;
      case DOWN: return UP;
      case LEFT: return RIGHT;
      case RIGHT: return LEFT;
      default: return dir;
    }
  }

  /**
   * Reset the routine to the beginning
   */
  reset() {
    this.currentCommandIndex = 0;
    this.direction = 1;
    this.isFinished = false;
    this.commandState = null;
  }
}
