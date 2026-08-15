/**
 * Tests for BCIController — neuro-control intent decoder (v4.0).
 * Uses the SimulatedBCI source and a custom EventTarget (no DOM needed).
 */
import BCIController, { SimulatedBCI, INTENTS } from '@modules/bci-controller.js';

class FakeTarget extends EventTarget {}
class FakeSource {
  constructor() { this.cb = null; }
  start(cb) { this.cb = cb; }
  stop() { this.cb = null; }
  push(s) { if (this.cb) this.cb(s); }
}

describe('BCIController', () => {
  test('emits SELECT on high attention + low meditation', () => {
    const target = new FakeTarget();
    const src = new FakeSource();
    const c = new BCIController({ source: src, target, debounceMs: 0 });
    let got = null;
    target.addEventListener('bci:intent', (e) => (got = e.detail));
    c.start();
    src.push({ attention: 0.9, meditation: 0.1, bandBeta: 0.2, bandAlpha: 0.1, bandTheta: 0.1, bandDelta: 0.1, bandGamma: 0.1 });
    expect(got.intent).toBe(INTENTS.SELECT);
    c.stop();
  });

  test('emits SCROLL_DOWN on strong beta + attention', () => {
    const target = new FakeTarget();
    const src = new FakeSource();
    const c = new BCIController({ source: src, target, debounceMs: 0 });
    let got = null;
    target.addEventListener('bci:intent', (e) => (got = e.detail));
    c.start();
    src.push({ attention: 0.6, meditation: 0.5, bandBeta: 0.8, bandAlpha: 0.1, bandTheta: 0.1, bandDelta: 0.1, bandGamma: 0.1 });
    expect(got.intent).toBe(INTENTS.SCROLL_DOWN);
    c.stop();
  });

  test('emits SCROLL_UP on high alpha/theta', () => {
    const target = new FakeTarget();
    const src = new FakeSource();
    const c = new BCIController({ source: src, target, debounceMs: 0 });
    let got = null;
    target.addEventListener('bci:intent', (e) => (got = e.detail));
    c.start();
    src.push({ attention: 0.4, meditation: 0.6, bandBeta: 0.1, bandAlpha: 0.8, bandTheta: 0.1, bandDelta: 0.1, bandGamma: 0.1 });
    expect(got.intent).toBe(INTENTS.SCROLL_UP);
    c.stop();
  });

  test('debounces rapid intents', () => {
    const target = new FakeTarget();
    const src = new FakeSource();
    const c = new BCIController({ source: src, target, debounceMs: 1000 });
    let count = 0;
    target.addEventListener('bci:intent', () => (count += 1));
    c.start();
    src.push({ attention: 0.9, meditation: 0.1, bandBeta: 0.2, bandAlpha: 0.1, bandTheta: 0.1, bandDelta: 0.1, bandGamma: 0.1 });
    src.push({ attention: 0.9, meditation: 0.1, bandBeta: 0.2, bandAlpha: 0.1, bandTheta: 0.1, bandDelta: 0.1, bandGamma: 0.1 });
    expect(count).toBe(1);
    c.stop();
  });

  test('start is idempotent', () => {
    const src = new FakeSource();
    const c = new BCIController({ source: src, target: new FakeTarget(), debounceMs: 0 });
    c.start();
    c.start(); // second start must not double-bind
    expect(src.cb).not.toBeNull();
    c.stop();
  });

  test('SimulatedBCI emits samples on an interval', () => {
    return new Promise((resolve) => {
      const s = new SimulatedBCI({ intervalMs: 10 });
      let n = 0;
      s.start((sample) => {
        n += 1;
        expect(sample.attention).toBeGreaterThanOrEqual(0);
        expect(sample.attention).toBeLessThanOrEqual(1);
        if (n >= 2) { s.stop(); resolve(); }
      });
    });
  });
});
