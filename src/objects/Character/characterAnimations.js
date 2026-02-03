import { Animations } from "../../Animations.js";
import { FrameIndexPattern } from "../../FrameIndexPattern.js";

/**
 * Helper functions to generate animation frame patterns.
 * These can be used by any character type with different frame offsets.
 */

export const makeIdleFrames = (rootFrame = 0) => {
  return {
    duration: 450,
    frames: [
      {
        time: 0,
        frame: rootFrame,
      }
    ]
  };
};

export const makeWalkingFrames = (rootFrame = 0) => {
  return {
    duration: 600,
    frames: [
      {
        time: 0,
        frame: rootFrame + 1
      },
      {
        time: 150,
        frame: rootFrame
      },
      {
        time: 300,
        frame: rootFrame + 1
      },
      {
        time: 450,
        frame: rootFrame + 2
      }
    ]
  };
};

export const makeStandingFrames = (frame = 0) => {
  return {
    duration: 450,
    frames: [
      {
        time: 0,
        frame: frame,
      }
    ]
  };
};

/**
 * Create a complete set of character animations given frame offsets.
 *
 * @param {Object} frameOffsets - Frame offsets for each animation
 * @param {number} frameOffsets.walkDown - Starting frame for walk down animation
 * @param {number} frameOffsets.walkUp - Starting frame for walk up animation
 * @param {number} frameOffsets.walkLeft - Starting frame for walk left animation
 * @param {number} frameOffsets.walkRight - Starting frame for walk right animation
 * @param {number} frameOffsets.idleDown - Frame for idle down
 * @param {number} frameOffsets.idleUp - Frame for idle up
 * @param {number} frameOffsets.idleLeft - Frame for idle left
 * @param {number} frameOffsets.idleRight - Frame for idle right
 * @param {Object} [extraAnimations] - Additional animation definitions
 * @returns {Animations} Animations instance
 */
export function createCharacterAnimations(frameOffsets, extraAnimations = {}) {
  const baseAnimations = {
    walkDown: new FrameIndexPattern(makeWalkingFrames(frameOffsets.walkDown)),
    walkUp: new FrameIndexPattern(makeWalkingFrames(frameOffsets.walkUp)),
    walkLeft: new FrameIndexPattern(makeWalkingFrames(frameOffsets.walkLeft)),
    walkRight: new FrameIndexPattern(makeWalkingFrames(frameOffsets.walkRight)),
    idleDown: new FrameIndexPattern(makeIdleFrames(frameOffsets.idleDown)),
    idleUp: new FrameIndexPattern(makeIdleFrames(frameOffsets.idleUp)),
    idleLeft: new FrameIndexPattern(makeIdleFrames(frameOffsets.idleLeft)),
    idleRight: new FrameIndexPattern(makeIdleFrames(frameOffsets.idleRight)),
  };

  // Add extra animations (e.g., pickUpDown for Hero)
  const allAnimations = { ...baseAnimations };
  for (const [name, pattern] of Object.entries(extraAnimations)) {
    allAnimations[name] = new FrameIndexPattern(pattern);
  }

  return new Animations(allAnimations);
}

/**
 * Hero sprite sheet frame offsets
 * Layout: 3 columns (walk frames), 8 rows (directions + special)
 */
export const HERO_FRAME_OFFSETS = {
  walkDown: 0,
  idleDown: 1,
  walkRight: 3,
  idleRight: 4,
  walkUp: 6,
  idleUp: 7,
  walkLeft: 9,
  idleLeft: 10,
};

export const HERO_EXTRA_ANIMATIONS = {
  pickUpDown: {
    duration: 400,
    frames: [
      {
        time: 0,
        frame: 1
      }
    ]
  },
  stabDown: {
    duration: 300,
    loop: false,
    frames: [
      { time: 0, frame: 13 },
      { time: 150, frame: 12 }
    ]
  },
  stabUp: {
    duration: 300,
    loop: false,
    frames: [
      { time: 0, frame: 19 },
      { time: 150, frame: 18 }
    ]
  },
  stabLeft: {
    duration: 300,
    loop: false,
    frames: [
      { time: 0, frame: 22 },
      { time: 150, frame: 21 }
    ]
  },
  stabRight: {
    duration: 300,
    loop: false,
    frames: [
      { time: 0, frame: 16 },
      { time: 150, frame: 15 }
    ]
  }
};

/**
 * Create hero animations using the hero sprite sheet layout
 */
export function createHeroAnimations() {
  return createCharacterAnimations(HERO_FRAME_OFFSETS, HERO_EXTRA_ANIMATIONS);
}

/**
 * Create static (non-animated) character animations.
 * All animations show the same frame - useful for NPCs without animation.
 *
 * @param {number} frame - The single frame to display
 * @returns {Animations} Animations instance
 */
export function createStaticAnimations(frame = 0) {
  return createCharacterAnimations({
    walkDown: frame - 1, // Walking frames use rootFrame + 1 as first frame
    walkUp: frame - 1,
    walkLeft: frame - 1,
    walkRight: frame - 1,
    idleDown: frame,
    idleUp: frame,
    idleLeft: frame,
    idleRight: frame,
  });
}
