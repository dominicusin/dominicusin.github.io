/**
 * WebRTC transport for GraphSync P2P replication (v4.0).
 *
 * Implements the same bus interface as MemoryTransport
 * (register / onMessage / send / broadcast) but carries opaque GraphSync
 * messages over RTCDataChannel(s) instead of an in-process loopback. This is
 * what makes the knowledge graph a *real* peer-to-peer mesh in the browser.
 *
 * Signaling is deliberately decoupled: pass any object with
 *   { send(toId, msg), onMessage(cb) }
 * A `BroadcastChannel` (same-origin cross-tab) or a WebSocket signaling
 * server both satisfy this. The transport only speaks the offer/answer/ICE
 * handshake protocol over that channel.
 *
 * Glare is avoided deterministically: the peer with the lexicographically
 * smaller replicaId initiates the DataChannel + offer.
 *
 * @version 4.0.0
 */

export class WebRTCTransport {
  /**
   * @param {string} replicaId
   * @param {object} [opts]
   * @param {object} [opts.signaling]  { send(toId,msg), onMessage(cb) }
   * @param {Function} [opts.rtcFactory] returns an RTCPeerConnection (injectable for tests)
   * @param {object} [opts.rtcConfig]   RTCConfiguration passed to the PC
   * @param {string[]} [opts.peerIds]   known peer ids to attempt connecting
   */
  constructor(replicaId, opts = {}) {
    this.id = replicaId;
    this.signaling = opts.signaling || null;
    this.rtcConfig = opts.rtcConfig || { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    this.rtcFactory = opts.rtcFactory || (() =>
      (typeof RTCPeerConnection !== 'undefined' ? new RTCPeerConnection(this.rtcConfig) : null));
    this.peerIds = opts.peerIds || [];

    /** @type {Map<string, {pc:any, channel:any, open:boolean}>} */
    this._peers = new Map();
    this._handler = null;

    if (this.signaling && typeof this.signaling.onMessage === 'function') {
      this.signaling.onMessage((msg) => this._onSignal(msg));
    }
  }

  /** GraphSync calls this to receive inbound messages. */
  register(handler) { this._handler = handler; }
  onMessage(cb) { this._handler = cb; }

  _dispatch(fromId, data) {
    if (this._handler) this._handler({ from: fromId, to: this.id, data });
  }

  _sig(toId, payload) {
    if (!this.signaling) return;
    this.signaling.send(toId, { from: this.id, ...payload });
  }

  /**
   * Open a connection to a peer (idempotent). Initiator = smaller replicaId.
   * @param {string} peerId
   */
  connect(peerId) {
    if (this._peers.has(peerId)) return;
    const pc = this.rtcFactory();
    if (!pc) throw new Error('WebRTC (RTCPeerConnection) is unavailable in this environment');
    const entry = { pc, channel: null, open: false };
    this._peers.set(peerId, entry);

    pc.onicecandidate = (e) => {
      if (e && e.candidate) this._sig(peerId, { type: 'ice', candidate: e.candidate });
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this._peers.delete(peerId);
      }
    };
    pc.ondatachannel = (e) => this._attachChannel(peerId, e.channel);

    const initiator = this.id < peerId;
    if (initiator) {
      const ch = pc.createDataChannel('graph-sync');
      this._attachChannel(peerId, ch);
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => this._sig(peerId, { type: 'offer', sdp: pc.localDescription }));
    }
  }

  _onSignal(msg) {
    if (!msg || msg.from === this.id) return;
    const from = msg.from;
    let entry = this._peers.get(from);
    if (!entry) {
      // unsolicited signal -> create the answerer side
      this.connect(from);
      entry = this._peers.get(from);
    }
    const pc = entry.pc;
    if (msg.type === 'offer') {
      pc.setRemoteDescription(msg.sdp)
        .then(() => pc.createAnswer())
        .then((answer) => pc.setLocalDescription(answer))
        .then(() => this._sig(from, { type: 'answer', sdp: pc.localDescription }));
    } else if (msg.type === 'answer') {
      pc.setRemoteDescription(msg.sdp);
    } else if (msg.type === 'ice') {
      pc.addIceCandidate(msg.candidate).catch(() => {});
    }
  }

  _attachChannel(peerId, ch) {
    const entry = this._peers.get(peerId);
    if (!entry) return;
    entry.channel = ch;
    ch.onopen = () => { entry.open = true; };
    ch.onclose = () => { entry.open = false; };
    ch.onmessage = (e) => {
      let parsed;
      try { parsed = JSON.parse(typeof e.data === 'string' ? e.data : new TextDecoder().decode(e.data)); }
      catch { return; }
      this._dispatch(peerId, parsed);
    };
  }

  /** Send one message to a specific peer (over its open channel). */
  send(toId, msg) {
    const entry = this._peers.get(toId);
    if (entry && entry.open && entry.channel) {
      entry.channel.send(JSON.stringify(msg));
      return true;
    }
    return false;
  }

  /** Broadcast one message to every connected peer. */
  broadcast(msg) {
    let n = 0;
    for (const [pid] of this._peers) if (this.send(pid, msg)) n += 1;
    return n;
  }

  /** Tear down all peer connections. */
  stop() {
    for (const { pc } of this._peers.values()) { try { pc.close(); } catch {} }
    this._peers.clear();
  }
}

export default WebRTCTransport;
