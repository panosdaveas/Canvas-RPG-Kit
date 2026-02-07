import { Animations } from "../../Animations.js";
import { FrameIndexPattern } from "../../FrameIndexPattern.js";

/**
 * Helper functions to generate animation frame patterns.
 * These can be used by any character type with different frame offsets.
 */

export const makeIdleFrames = (rootFrame = 0) => {
  return {
    duration: 450,
    loop: true,
    frames: [
      {
        time: 0,
        frame: rootFrame,
      }
    ]
  };
};

const createWalkingFrames = (rootFrame, count = 10, step = 50) =>
  Array.from({ length: count }, (_, i) => ({
    time: i * step,
    frame: rootFrame + i,
  }));

export const makeWalkingFrames = (rootFrame = 0) => {
  return {
    duration: 500,
    loop: true,
    frames: createWalkingFrames(rootFrame),
  };
};

export const makeStandingFrames = (frame = 0) => {
  return {
    duration: 450,
    loop: true,
    frames: [
      {
        time: 0,
        frame: frame,
      }
    ]
  };
};

const createSwingFrames = (rootFrame, count = 8, step = 50) =>
  Array.from({ length: count }, (_, i) => ({
    time: i * step,
    frame: rootFrame + i,
  }));

export const makeSwingFrames = (rootFrame = 0) => {
  return {
    duration: 400,
    loop: false,
    frames: createSwingFrames(rootFrame),
  };
};

const createProjectileFrames = (rootFrame, count = 10, step = 50) =>
  Array.from({ length: count }, (_, i) => ({
    time: i * step,
    frame: rootFrame + i,
  }));

export const makeProjectileFrames = (rootFrame = 0) => {
  return {
    duration: 500,
    loop: false,
    frames: createProjectileFrames(rootFrame),
  };
};

const createThrowFrames = (rootFrame, count = 6, step = 80) =>
  Array.from({ length: count }, (_, i) => ({
    time: i * step,
    frame: rootFrame + i,
  }));

export const makeThrowFrames = (rootFrame = 0) => {
  return {
    duration: 480,
    loop: false,
    frames: createThrowFrames(rootFrame),
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
  idleRight: 0,
  idleUp: 1,
  idleLeft: 2,
  idleDown: 3,
  walkRight: 10,
  walkUp: 20,
  walkLeft: 30,
  walkDown: 40,
  swingRight: 50,
  swingUp: 60,
  swingLeft: 70,
  swingDown: 80,
  throwRight: 90,
  throwUp: 100,
  throwLeft: 110,
  throwDown: 120,
  projectileRight: 130,
  projectileUp: 140,
  projectileLeft: 150,
  projectileDown: 160,
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
};

export const HERO_ATTACK_ANIMATIONS = {
  swingDown: makeSwingFrames(HERO_FRAME_OFFSETS.swingDown),
  swingUp: makeSwingFrames(HERO_FRAME_OFFSETS.swingUp),
  swingLeft: makeSwingFrames(HERO_FRAME_OFFSETS.swingLeft),
  swingRight: makeSwingFrames(HERO_FRAME_OFFSETS.swingRight),
  projectileDown: makeProjectileFrames(HERO_FRAME_OFFSETS.projectileDown),
  projectileUp: makeProjectileFrames(HERO_FRAME_OFFSETS.projectileUp),
  projectileLeft: makeProjectileFrames(HERO_FRAME_OFFSETS.projectileLeft),
  projectileRight: makeProjectileFrames(HERO_FRAME_OFFSETS.projectileRight),
  throwDown: makeThrowFrames(HERO_FRAME_OFFSETS.throwDown),
  throwUp: makeThrowFrames(HERO_FRAME_OFFSETS.throwUp),
  throwLeft: makeThrowFrames(HERO_FRAME_OFFSETS.throwLeft),
  throwRight: makeThrowFrames(HERO_FRAME_OFFSETS.throwRight),
};

/**
 * Create hero animations using the hero sprite sheet layout
 */
export function createHeroAnimations() {
  return createCharacterAnimations(HERO_FRAME_OFFSETS, {
    ...HERO_EXTRA_ANIMATIONS,
    ...HERO_ATTACK_ANIMATIONS,
  });
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
    walkDown: frame, // Walking frames use rootFrame + 1 as first frame
    walkUp: frame,
    walkLeft: frame,
    walkRight: frame,
    idleDown: frame,
    idleUp: frame,
    idleLeft: frame,
    idleRight: frame,
  });
}
