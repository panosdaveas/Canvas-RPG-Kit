export class Animations {
  constructor(patterns, options = {}) {
    this.patterns = patterns;
    this.activeKey = Object.keys(this.patterns)[0];
    // Aseprite extras (loaders pass these in; hand-built Animations leave them empty).
    this.slices = options.slices ?? {};
    this.userData = options.userData ?? {};
    // One-time warning tracking for missing tags.
    this._warnedKeys = new Set();
  }

  get frame() {
    return this.patterns[this.activeKey].frame;
  }

  /** Time elapsed in the active pattern (0..duration). */
  get currentTime() {
    return this.patterns[this.activeKey]?.currentTime ?? 0;
  }

  /** Total duration of the active pattern. */
  get duration() {
    return this.patterns[this.activeKey]?.duration ?? 0;
  }

  /** True once a non-looping pattern has reached its end. */
  isFinished() {
    return this.patterns[this.activeKey]?.finished ?? false;
  }

  /**
   * Index of the active frame within the active tag (0-based, tag-relative).
   * Useful for tag User Data triggers like {"launchFrame": 2}.
   */
  getFrameIndex() {
    const pattern = this.patterns[this.activeKey];
    if (!pattern) return 0;
    const frames = pattern.animationConfig.frames;
    for (let i = frames.length - 1; i >= 0; i--) {
      if (pattern.currentTime >= frames[i].time) return i;
    }
    return 0;
  }

  play(key, startAtTime = 0) {
    // Missing tag — warn once per key, keep current animation playing.
    // Lets the game survive a partial Aseprite export (e.g. no idle_* tags yet).
    if (!this.patterns[key]) {
      if (!this._warnedKeys.has(key)) {
        console.warn(`Animations: tag "${key}" not found, ignoring play()`);
        this._warnedKeys.add(key);
      }
      return;
    }
    if (this.activeKey === key) {
      return;
    }
    this.activeKey = key;
    const pattern = this.patterns[this.activeKey];
    pattern.currentTime = startAtTime;
    pattern.finished = false; // allow non-looping patterns to replay
  }

  step(delta) {
    this.patterns[this.activeKey].step(delta);
  }

  /**
   * Resolve a slice for the current (or specified) frame.
   * Returns the most recent keyframe at or before the requested frame index,
   * or null if the slice has no key for that range.
   *
   * Use for hitboxes, projectile spawn points, attachment anchors, etc.
   */
  getSliceAt(sliceName, frameIndex = this.frame) {
    const slice = this.slices[sliceName];
    if (!slice) return null;
    let result = null;
    for (const key of slice.keys) {
      if (key.frame <= frameIndex) result = key;
      else break;
    }
    return result;
  }

  /** Get parsed user data for a tag (defaults to the active tag). */
  getUserData(tagName = this.activeKey) {
    return this.userData[tagName] ?? null;
  }
}
