import { Animations } from "../Animations.js";
import { FrameIndexPattern } from "../FrameIndexPattern.js";

/**
 * Aseprite JSON loader.
 *
 * Accepts both export formats:
 *   - Hash mode: `frames` is an object keyed by filename
 *   - Array mode: `frames` is an array
 * Both preserve insertion order, which == Aseprite's frame index.
 *
 * Returns a bundle the rest of the engine can plug into Sprite/Character:
 *   {
 *     animations,    // Animations instance with all tags as patterns
 *     slices,        // indexed by name; each: { color, data, keys }
 *     userData,      // per-tag user data (Aseprite tag.data, JSON-parsed if possible)
 *     frameSize,     // { w, h }
 *     hFrames,       // grid columns (sheet.w / frameSize.w)
 *     vFrames,       // grid rows
 *     frameRects,    // [{ x, y, w, h }, ...] — exposed for future atlas rendering
 *     image,         // { image: HTMLImageElement, isLoaded: boolean }
 *     imagePath,     // resolved path to the spritesheet PNG
 *   }
 */
export async function loadAseprite(jsonPath) {
  const response = await fetch(jsonPath);
  if (!response.ok) {
    throw new Error(`Aseprite load failed: ${jsonPath} (${response.status})`);
  }
  const json = await response.json();
  const bundle = parseAseprite(json);

  // Resolve sheet image relative to the JSON file's directory.
  if (bundle.imagePath) {
    const dir = jsonPath.substring(0, jsonPath.lastIndexOf("/") + 1);
    bundle.image = await loadImage(dir + bundle.imagePath);
  }

  return bundle;
}

/** Pure transformation. Useful for testing without fetch. */
export function parseAseprite(json) {
  const { frames, meta = {} } = json;

  const frameList = Array.isArray(frames) ? frames : Object.values(frames ?? {});

  const frameSize = frameList.length > 0
    ? { w: frameList[0].frame.w, h: frameList[0].frame.h }
    : { w: 0, h: 0 };

  const hFrames = meta.size && frameSize.w ? Math.floor(meta.size.w / frameSize.w) : 1;
  const vFrames = meta.size && frameSize.h ? Math.floor(meta.size.h / frameSize.h) : 1;

  const frameRects = frameList.map(f => f.frame);

  // Tag → pattern config (data only, no instances). Each Character gets its
  // own FrameIndexPattern instances via createAnimations() — sharing would
  // mean shared currentTime / finished state across characters.
  const patternConfigs = {};
  const userData = {};
  for (const tag of meta.frameTags ?? []) {
    const data = tag.data !== undefined ? parseUserData(tag.data) : null;
    const sequence = buildTagSequence(tag, frameList);
    patternConfigs[tag.name] = {
      duration: sequence.totalDuration,
      loop: shouldLoop(tag, data),
      frames: sequence.frames,
    };
    if (data !== null) userData[tag.name] = data;
  }

  // Synthesize idle_<dir> from walk_<dir>[0] if no explicit idle tag exists.
  // Matches the old characterAnimations.js convention (walk frame 0 == resting
  // pose). Skip silently if a walk tag is missing or an idle tag already exists.
  for (const tagName of Object.keys(patternConfigs)) {
    const m = /^walk_(.+)$/.exec(tagName);
    if (!m) continue;
    const idleName = `idle_${m[1]}`;
    if (patternConfigs[idleName]) continue;
    const restFrame = patternConfigs[tagName].frames[1]?.frame ?? 1;
    patternConfigs[idleName] = {
      duration: 0,
      loop: true,
      frames: [{ time: 0, frame: restFrame }],
    };
  }

  // Slices and userData are immutable read-only data — safe to share across
  // Animations instances.
  const slices = indexSlices(meta.slices ?? []);

  return {
    /** Build a fresh Animations instance — call once per Character. */
    createAnimations() {
      const patterns = {};
      for (const [name, config] of Object.entries(patternConfigs)) {
        patterns[name] = new FrameIndexPattern(config);
      }
      return new Animations(patterns, { slices, userData });
    },
    slices,
    userData,
    frameSize,
    hFrames,
    vFrames,
    frameRects,
    imagePath: meta.image ?? null,
    image: null, // populated after image load
  };
}

/**
 * Build a tag's frame sequence with cumulative timing, respecting direction.
 * Aseprite supports forward, reverse, pingpong, and pingpong_reverse.
 */
function buildTagSequence(tag, frameList) {
  const { from, to, direction = "forward" } = tag;

  let order;
  switch (direction) {
    case "reverse":
      order = range(to, from, -1);
      break;
    case "pingpong":
      // Forward then backward, without re-doubling the endpoints.
      order = [...range(from, to), ...range(to - 1, from + 1, -1)];
      break;
    case "pingpong_reverse":
      order = [...range(to, from, -1), ...range(from + 1, to - 1)];
      break;
    case "forward":
    default:
      order = range(from, to);
  }

  const result = [];
  let elapsed = 0;
  for (const frameIndex of order) {
    result.push({ time: elapsed, frame: frameIndex });
    elapsed += frameList[frameIndex]?.duration ?? 100;
  }
  return { frames: result, totalDuration: elapsed };
}

function range(start, end, step = 1) {
  const out = [];
  if (step > 0) {
    for (let i = start; i <= end; i += step) out.push(i);
  } else {
    for (let i = start; i >= end; i += step) out.push(i);
  }
  return out;
}

/**
 * Determine whether a tag should loop. Resolution order:
 *   1. Tag user data: `{"loop": true|false}` — explicit override
 *   2. Aseprite 1.3+ tag.repeat: "0" = loop forever, anything else = once
 *   3. Convention by tag-name prefix: tags starting with `walk_` or `idle_`
 *      loop, everything else plays once. Matches typical RPG conventions and
 *      survives older Aseprite exports that don't emit the `repeat` field.
 */
function shouldLoop(tag, parsedData) {
  if (parsedData && typeof parsedData.loop === "boolean") return parsedData.loop;
  if (tag.repeat !== undefined) return tag.repeat === "0";
  return /^(walk|idle)_/i.test(tag.name);
}

/**
 * Aseprite stores user data as a string. Try JSON first so artists can encode
 * structured data (e.g. {"hitFrame":2}) directly in the tag's User Data field.
 * Falls back to the raw string.
 */
function parseUserData(data) {
  if (typeof data !== "string") return data;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

function indexSlices(slices) {
  const indexed = {};
  for (const slice of slices) {
    indexed[slice.name] = {
      color: slice.color ?? null,
      data: slice.data !== undefined ? parseUserData(slice.data) : null,
      keys: (slice.keys ?? []).map(k => ({
        frame: k.frame,
        bounds: k.bounds,
        center: k.center, // 9-slices, optional
        pivot: k.pivot,   // anchor point, optional
      })),
    };
  }
  return indexed;
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    const slot = { image: img, isLoaded: false };
    img.onload = () => { slot.isLoaded = true; resolve(slot); };
    img.onerror = () => resolve(slot); // don't block boot on a missing sheet
    img.src = src;
  });
}
