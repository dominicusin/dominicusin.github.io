/**
 * GraphSync — peer-to-peer replication layer over GraphCRDT.
 *
 * Transport-agnostic: a `Transport` just delivers opaque messages between
 * peers. The default in-browser transport uses WebRTC DataChannels; tests
 * use an in-memory loopback transport (no network needed).
 *
 * Protocol (per message):
 *   { type: 'delta', from, clock, entries } -> applyDelta
 *   { type: 'request', from }               -> reply with our full delta
 *
 * @version 4.0.0
 */

import GraphCRDT from '@modules/crdt-sync.js';

export class MemoryTransport {
  /** Bus connecting multiple in-memory peers for tests / demos. */
  constructor() {
    this.peers = new Map(); // id -> onMessage(msg)
  }
  register(id, onMessage) {
    this.peers.set(id, onMessage);
  }
  send(to, from, msg) {
    const peer = this.peers.get(to);
    if (peer) peer({ ...msg, from });
  }
  broadcast(from, msg) {
    for (const [id, peer] of this.peers) {
      if (id !== from) peer({ ...msg, from });
    }
  }
}

export class GraphSync {
  /**
   * @param {string} replicaId
   * @param {object} [crdt] existing GraphCRDT instance
   * @param {object} [transport] MemoryTransport-compatible bus
   * @param {object} [now] injectable clock
   */
  constructor(replicaId, crdt, transport = new MemoryTransport(), now = Date.now) {
    this.id = replicaId;
    this.crdt = crdt || new GraphCRDT(replicaId, now);
    this.transport = transport;
    this.peers = new Set();
    this._onRemote = null;
    transport.register(replicaId, (msg) => this._receive(msg));
  }

  connect(peerId) {
    this.peers.add(peerId);
    this.transport.send(peerId, this.id, { type: 'request' });
  }

  broadcastDelta() {
    const delta = this.crdt.encodeDelta({});
    this.transport.broadcast(this.id, { type: 'delta', ...delta });
  }

  onRemoteChange(cb) {
    this._onRemote = cb;
  }

  _receive(msg) {
    if (msg.type === 'delta') {
      this.crdt.applyDelta(msg);
      if (this._onRemote) this._onRemote(msg.from);
    } else if (msg.type === 'request') {
      this.transport.send(msg.from, this.id, {
        type: 'delta',
        ...this.crdt.encodeDelta({})
      });
    }
  }

  updateNode(id, data) {
    const e = this.crdt.updateNode(id, data);
    this.broadcastDelta();
    return e;
  }
  removeNode(id) {
    const e = this.crdt.removeNode(id);
    this.broadcastDelta();
    return e;
  }
  getState() {
    return this.crdt.getState();
  }
}

export default GraphSync;
