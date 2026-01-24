const makeIdleFrames = (rootFrame = 0) => {
  return {
    duration: 450,
    frames: [
      {
        time: 0,
        frame: rootFrame,
      }
    ]
  }
}
const makeWalkingFrames = (rootFrame = 0) => {
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
  }
}

export const IDLE_DOWN = makeIdleFrames(1);
export const IDLE_RIGHT = makeIdleFrames(4);
export const IDLE_UP = makeIdleFrames(7);
export const IDLE_LEFT = makeIdleFrames(10);

export const WALK_DOWN = makeWalkingFrames(0);
export const WALK_RIGHT = makeWalkingFrames(3);
export const WALK_UP = makeWalkingFrames(6);
export const WALK_LEFT = makeWalkingFrames(9);

export const PICK_UP_DOWN = {
  duration: 400,
  frames: [
    {
      time: 0,
      frame: 12
    }
  ]
}
