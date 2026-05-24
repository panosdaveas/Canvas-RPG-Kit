/**
 * Pub/sub event bus.
 *
 * Storage: each subscription lives in two indices — `byId` for O(1) `off(id)`,
 * and `byEvent` (Map<eventName, Set<sub>>) for O(1) `emit` lookup. Walking
 * only the subs for the emitted event matters because high-frequency events
 * (HERO_POSITION, YSORT_DIRTY) used to scan every subscription regardless.
 *
 * Iteration safety: a callback may call `on` / `off` / `unsubscribe` during
 * emit — ES2015 Set iteration tolerates same-set mutation (the rules: deletes
 * skip yet-to-visit elements; adds may or may not be visited, which matches
 * the previous Array.forEach semantics).
 */
class Events {
  constructor() {
    this.byId = new Map();
    this.byEvent = new Map();
    this.nextId = 0;
  }

  emit(eventName, value) {
    const subs = this.byEvent.get(eventName);
    if (!subs) return;
    for (const sub of subs) {
      sub.callback(value);
    }
  }

  on(eventName, caller, callback) {
    this.nextId += 1;
    const sub = { id: this.nextId, eventName, caller, callback };
    this.byId.set(sub.id, sub);
    let bucket = this.byEvent.get(eventName);
    if (!bucket) {
      bucket = new Set();
      this.byEvent.set(eventName, bucket);
    }
    bucket.add(sub);
    return sub.id;
  }

  off(id) {
    const sub = this.byId.get(id);
    if (!sub) return;
    this.byId.delete(id);
    const bucket = this.byEvent.get(sub.eventName);
    if (bucket) {
      bucket.delete(sub);
      if (bucket.size === 0) this.byEvent.delete(sub.eventName);
    }
  }

  unsubscribe(caller) {
    // Collect first, then off — avoids mid-iteration mutation across both
    // indices. The byId map is small enough (total subs in the engine) that
    // a linear pass beats maintaining a third byCaller index.
    const toRemove = [];
    for (const sub of this.byId.values()) {
      if (sub.caller === caller) toRemove.push(sub.id);
    }
    for (const id of toRemove) this.off(id);
  }
}

export const events = new Events();
