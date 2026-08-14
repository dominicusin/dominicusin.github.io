/**
 * BCI — Brain-Computer Interface abstraction for neuro-control of the UI.
 *
 * v4.0 goal: let users drive the interface (scroll, select, command) with
 * mental states decoded from an EEG stream, instead of mouse/keyboard.
 *
 * This module defines a transport-agnostic interface. A real deployment
 * plugs in a device adapter (e.g. Muse, OpenBCI, Emotiv) that emits
 * `NeuroSample` frames. The built-in `SimulatedBCI` generates synthetic
 * samples so the UX can be developed and tested without hardware.
 *
 * Decoded intents are emitted as DOM CustomEvents on a configurable target
 * (default: window), so any UI component can subscribe:
 *   window.addEventListener('bci:intent', e => { e.detail.intent });
 *
 * @version 4.0.0
 */

export const INTENTS = Object.freeze({
  SCROLL_UP: 'scroll_up',
  SCROLL_DOWN: 'scroll_down',
  SELECT: 'select',
  BACK: 'back',
  ATTENTION: 'attention',
  REST: 'rest'
});

/**
 * @typedef {Object} NeuroSample
 * @property {number} t        timestamp (ms)
 * @property {number} attention 0..1 focused-attention index
 * @property {number} meditation 0..1 calm index
 * @property {number} bandDelta 0..1
 * @property {number} bandTheta 0..1
 * @property {number} bandAlpha 0..1
 * @property {number} bandBeta  0..1
 * @property {number} bandGamma 0..1
 */

export class BCIController {
  /**
   * @param {object} [opts]
   * @param {object} [opts.source] object with start(onSample)/stop() (a device adapter)
   * @param {EventTarget} [opts.target=window] where to dispatch intent events
   * @param {number} [opts.attentionThreshold=0.7] attention needed to emit SELECT
   * @param {number} [opts.debounceMs=800] min time between emitted intents
   */
  constructor(opts = {}) {
    this.source = opts.source || new SimulatedBCI();
    this.target = opts.target || (typeof window !== 'undefined' ? window : null);
    this.attentionThreshold = opts.attentionThreshold ?? 0.7;
    this.debounceMs = opts.debounceMs ?? 800;
    this._lastEmit = -Infinity;
    this._running = false;
    this._onSample = this._onSample.bind(this);
  }

  start() {
    if (this._running) return;
    this._running = true;
    this.source.start(this._onSample);
  }

  stop() {
    this._running = false;
    if (this.source.stop) this.source.stop();
  }

  _emit(intent, confidence) {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - this._lastEmit < this.debounceMs) return;
    this._lastEmit = now;
    const detail = { intent, confidence, t: Date.now() };
    if (this.target) {
      this.target.dispatchEvent(new CustomEvent('bci:intent', { detail }));
    }
    if (this.onIntent) this.onIntent(detail);
  }

  /** Map a neuro sample to a discrete UI intent. */
  _onSample(sample) {
    // High attention + low meditation → SELECT / ACTIVATE
    if (sample.attention >= this.attentionThreshold && sample.meditation < 0.4) {
      this._emit(INTENTS.SELECT, sample.attention);
      return;
    }
    // Strong beta (active thinking) with attention → SCROLL_DOWN
    if (sample.bandBeta > 0.6 && sample.attention > 0.5) {
      this._emit(INTENTS.SCROLL_DOWN, sample.bandBeta);
      return;
    }
    // High theta/alpha (dreamy/relax) → SCROLL_UP (passive browse)
    if (sample.bandAlpha > 0.6 || sample.bandTheta > 0.6) {
      this._emit(INTENTS.SCROLL_UP, Math.max(sample.bandAlpha, sample.bandTheta));
      return;
    }
    if (sample.attention < 0.2) {
      this._emit(INTENTS.REST, 1 - sample.attention);
    }
  }
}

/**
 * Synthetic EEG source for development without hardware. Emits plausible
 * drifting band values so the intent decoder can be exercised end-to-end.
 */
export class SimulatedBCI {
  constructor(opts = {}) {
    this.intervalMs = opts.intervalMs ?? 250;
    this._timer = null;
  }
  start(onSample) {
    let phase = 0;
    this._timer = setInterval(() => {
      phase += 0.4;
      const wobble = (k) => 0.5 + 0.4 * Math.sin(phase + k);
      onSample({
        t: Date.now(),
        attention: wobble(0),
        meditation: wobble(1.3),
        bandDelta: wobble(2.1),
        bandTheta: wobble(3.0),
        bandAlpha: wobble(4.2),
        bandBeta: wobble(5.1),
        bandGamma: wobble(6.0)
      });
    }, this.intervalMs);
  }
  stop() {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
  }
}

export default BCIController;
