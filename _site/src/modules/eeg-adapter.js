/**
 * EEG device adapter for the BCI neuro-control layer (v4.0).
 *
 * Streams real neuro-samples from an EEG headset / gateway over a WebSocket
 * and forwards them to BCIController as {NeuroSample}. This is the real
 * hardware path; `SimulatedBCI` (in bci-controller.js) is the offline dev
 * stand-in.
 *
 * Expected server protocol: text or binary frames containing JSON
 * `{ "attention":0..1, "meditation":0..1, "bandAlpha":0..1, ... }` that map
 * onto the NeuroSample shape. The adapter is tolerant of partial/extra keys.
 *
 * @version 4.0.0
 */
export class EEGWebSocketAdapter {
  /**
   * @param {string} url  WebSocket endpoint of the EEG gateway
   * @param {object} [opts]
   * @param {object} [opts.wsImpl] injectable WebSocket (for tests / Node)
   * @param {(s:any)=>void} [opts.onStatus] status callback (connecting/open/closed/error)
   */
  constructor(url, opts = {}) {
    this.url = url;
    this.wsImpl = opts.wsImpl;
    this.onStatus = opts.onStatus || (() => {});
    this._ws = null;
    this._onSample = null;
  }

  /** Called by BCIController.start(onSample). */
  start(onSample) {
    this._onSample = onSample;
    const WS = this.wsImpl || (typeof WebSocket !== 'undefined' ? WebSocket : null);
    if (!WS) {
      this.onStatus('error');
      throw new Error('WebSocket is unavailable in this environment');
    }
    this.onStatus('connecting');
    const ws = new WS(this.url);
    this._ws = ws;
    ws.onopen = () => this.onStatus('open');
    ws.onclose = () => this.onStatus('closed');
    ws.onerror = () => this.onStatus('error');
    ws.onmessage = (ev) => this._handle(ev.data);
  }

  _handle(data) {
    if (!this._onSample) return;
    let payload;
    try {
      payload = typeof data === 'string' ? JSON.parse(data) : JSON.parse(new TextDecoder().decode(data));
    } catch {
      return; // ignore malformed frames
    }
    // Build a NeuroSample; default missing bands to 0.
    const sample = {
      t: payload.t || Date.now(),
      attention: Number(payload.attention) || 0,
      meditation: Number(payload.meditation) || 0,
      bandDelta: Number(payload.bandDelta) || 0,
      bandTheta: Number(payload.bandTheta) || 0,
      bandAlpha: Number(payload.bandAlpha) || 0,
      bandBeta: Number(payload.bandBeta) || 0,
      bandGamma: Number(payload.bandGamma) || 0
    };
    this._onSample(sample);
  }

  stop() {
    if (this._ws) { try { this._ws.close(); } catch {} this._ws = null; }
  }
}

export default EEGWebSocketAdapter;
