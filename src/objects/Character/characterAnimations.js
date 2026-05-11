// this file is no longer needed - to be deleted in next commit
// switched to Aseprite integration

import { Animations } from "../../Animations.js";
import { FrameIndexPattern } from "../../FrameIndexPattern.js";

/**
 * Helper functions to generate animation frame patterns.
 * These can be used by any character type with different frame offsets.
 */

export const makeIdleFrames = (rootFrame = 0) => {
  return {
    duration: 0,
    loop: true,
    frames: [
      {
        time: 0,
        frame: rootFrame,
      }
    ]
  };
};

const createWalkingFrames = (rootFrame, count = 4, step = 133) =>
  Array.from({ length: count }, (_, i) => ({
    time: i * step,
    frame: rootFrame + i,
  }));

export const makeWalkingFrames = (rootFrame = 0) => {
  return {
    duration: 532,
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

const createSwordFrames = (rootFrame, count = 4, step = 100) =>
  Array.from({ length: count }, (_, i) => ({
    time: i * step,
    frame: rootFrame + i,
  }));

export const makeSwordFrames = (rootFrame = 0) => {
  return {
    duration: 400,
    loop: false,
    frames: createSwordFrames(rootFrame),
  };
};

const createBowFrames = (rootFrame, count = 4, step = 100) =>
  Array.from({ length: count }, (_, i) => ({
    time: i * step,
    frame: rootFrame + i,
  }));

export const makeBowFrames = (rootFrame = 0) => {
  return {
    duration: 400,
    loop: false,
    frames: createBowFrames(rootFrame),
  };
};

const createFireFrames = (rootFrame, count = 4, step = 100) =>
  Array.from({ length: count }, (_, i) => ({
    time: i * step,
    frame: rootFrame + i,
  }));

export const makeFireFrames = (rootFrame = 0) => {
  return {
    duration: 400,
    loop: false,
    frames: createFireFrames(rootFrame),
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
  idleDown: 1,
  idleLeft: 5,
  idleRight: 9,
  idleUp: 13,
  walkDown: 0,
  walkLeft: 4,
  walkRight: 8,
  walkUp: 12,
  swordDown: 16,
  swordLeft: 20,
  swordRight: 24,
  swordUp: 28,
  bowDown: 32,
  bowLeft: 36,
  bowRight: 40,
  bowUp: 44,
  fireDown: 48,
  fireLeft: 52,
  fireRight: 56,
  fireUp: 60,
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
  swordDown: makeSwordFrames(HERO_FRAME_OFFSETS.swordDown),
  swordUp: makeSwordFrames(HERO_FRAME_OFFSETS.swordUp),
  swordLeft: makeSwordFrames(HERO_FRAME_OFFSETS.swordLeft),
  swordRight: makeSwordFrames(HERO_FRAME_OFFSETS.swordRight),
  bowDown: makeBowFrames(HERO_FRAME_OFFSETS.bowDown),
  bowUp: makeBowFrames(HERO_FRAME_OFFSETS.bowUp),
  bowLeft: makeBowFrames(HERO_FRAME_OFFSETS.bowLeft),
  bowRight: makeBowFrames(HERO_FRAME_OFFSETS.bowRight),
  fireDown: makeFireFrames(HERO_FRAME_OFFSETS.fireDown),
  fireUp: makeFireFrames(HERO_FRAME_OFFSETS.fireUp),
  fireLeft: makeFireFrames(HERO_FRAME_OFFSETS.fireLeft),
  fireRight: makeFireFrames(HERO_FRAME_OFFSETS.fireRight),
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
