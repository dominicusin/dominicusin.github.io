/**
 * EEGWebSocketAdapter — tests with an injected mock WebSocket.
 */
import EEGWebSocketAdapter from '@modules/eeg-adapter.js';

class MockWS {
  constructor(url) { this.url = url; this.sent = []; this.onopen = null; this.onclose = null; this.onerror = null; this.onmessage = null; this.readyState = 0; }
  open() { this.readyState = 1; if (this.onopen) this.onopen(); }
  close() { this.readyState = 3; if (this.onclose) this.onclose(); }
  send(d) { this.sent.push(d); }
  push(d) { if (this.onmessage) this.onmessage({ data: d }); }
}

describe('EEGWebSocketAdapter', () => {
  test('parses JSON frames into NeuroSample and forwards them', () => {
    const mk = () => new (class extends MockWS {})('ws://x');
    const inst = new EEGWebSocketAdapter('ws://eeg', { wsImpl: mk });
    const received = [];
    const status = [];
    inst.onStatus = (s) => status.push(s);
    inst.start((s) => received.push(s));

    expect(status).toContain('connecting');
    // simulate server sending a frame
    inst._ws.push(JSON.stringify({ attention: 0.8, meditation: 0.2, bandAlpha: 0.5 }));
    expect(received.length).toBe(1);
    expect(received[0].attention).toBeCloseTo(0.8);
    expect(received[0].bandBeta).toBe(0); // defaulted
    inst.stop();
    expect(status).toContain('closed');
  });

  test('ignores malformed frames', () => {
    const inst = new EEGWebSocketAdapter('ws://eeg', { wsImpl: (u) => new MockWS(u) });
    const received = [];
    inst.start((s) => received.push(s));
    inst._ws.push('not json{');
    expect(received.length).toBe(0);
  });

  test('throws when WebSocket is unavailable', () => {
    const saved = globalThis.WebSocket;
    // simulate an environment without WebSocket
    try { globalThis.WebSocket = undefined; } catch {}
    const inst = new EEGWebSocketAdapter('ws://eeg', { wsImpl: undefined });
    let threw = false;
    try { inst.start(() => {}); } catch (e) { threw = /unavailable/.test(e.message); }
    try { globalThis.WebSocket = saved; } catch {}
    expect(threw).toBe(true);
  });
});
