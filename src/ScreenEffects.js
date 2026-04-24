class FadeEffect {
  constructor({ direction, duration, color = "#000", onComplete }) {
    this.direction = direction; // 'in' | 'out'
    this.duration = duration;
    this.color = color;
    this.onComplete = onComplete;
    this.elapsed = 0;
    this.done = false;
  }

  get alpha() {
    const t = Math.min(this.elapsed / this.duration, 1);
    return this.direction === "out" ? t : 1 - t;
  }

  update(delta) {
    this.elapsed += delta;
    if (this.elapsed >= this.duration) {
      this.elapsed = this.duration;
      this.done = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  }
}

class ScreenEffects {
  constructor() {
    this._queue = [];
  }

  // Fade to black, then call onComplete
  fadeOut(duration, onComplete) {
    this._queue.push(new FadeEffect({ direction: "out", duration, onComplete }));
  }

  // Fade from black to clear
  fadeIn(duration, onComplete) {
    this._queue.push(new FadeEffect({ direction: "in", duration, onComplete }));
  }

  isActive() {
    return this._queue.length > 0;
  }

  update(delta) {
    if (this._queue.length === 0) return;
    const current = this._queue[0];
    current.update(delta);
    if (current.done) {
      this._queue.shift();
      current.onComplete?.();
    }
  }

  draw(ctx) {
    if (this._queue.length === 0) return;
    this._queue[0].draw(ctx);
  }
}

export const screenEffects = new ScreenEffects();
