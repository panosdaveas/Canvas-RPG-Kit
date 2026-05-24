/**
 * Minimal in-page perf widget. Call tick() once per rendered frame.
 * Aggregates over ~1s windows so DOM updates don't dominate the measurement.
 *
 * Displays: FPS, avg frame ms, peak frame ms in window, JS heap MB.
 * Backtick (`) toggles visibility.
 *
 * performance.memory is Chrome-only and read-only — gracefully degrades.
 */
export class PerfHUD {
  constructor() {
    this.lastTime = performance.now();
    this.frames = 0;
    this.elapsed = 0;
    this.maxFrame = 0;

    this.el = document.createElement("div");
    this.el.style.cssText = [
      "position: fixed",
      "top: 4px",
      "left: 4px",
      "z-index: 9999",
      "background: rgba(0,0,0,0.6)",
      "color: #0f0",
      "font: 11px/1.2 monospace",
      "padding: 4px 6px",
      "pointer-events: none",
      "user-select: none",
      "white-space: pre",
    ].join(";");
    this.el.textContent = "perf…";
    document.body.appendChild(this.el);

    document.addEventListener("keydown", (e) => {
      if (e.code === "Backquote") {
        this.el.style.display = this.el.style.display === "none" ? "block" : "none";
      }
    });
  }

  tick() {
    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;

    this.frames++;
    this.elapsed += delta;
    if (delta > this.maxFrame) this.maxFrame = delta;

    if (this.elapsed >= 1000) {
      const fps = Math.round((this.frames * 1000) / this.elapsed);
      const avgMs = (this.elapsed / this.frames).toFixed(1);
      const peakMs = this.maxFrame.toFixed(0);
      const heap = performance.memory
        ? (performance.memory.usedJSHeapSize / 1048576).toFixed(0) + " MB"
        : "—";

      this.el.textContent = `${fps} fps · ${avgMs} ms (peak ${peakMs}) · heap ${heap}`;

      this.frames = 0;
      this.elapsed = 0;
      this.maxFrame = 0;
    }
  }
}
