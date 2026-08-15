/**
 * GraphCRDT — Conflict-free Replicated Data Type for the knowledge graph.
 *
 * Design goals (v4.0 Autonomous & Semantic Web):
 *  - Commutative, associative, idempotent merge  -> convergence
 *  - Per-replica vector clocks for causality detection
 *  - Last-Writer-Wins resolution (hybrid logical timestamp + replicaId tiebreak)
 *  - Tombstones for deletions (so a delete reliably wins over a concurrent add)
 *  - Delta encoding for bandwidth-efficient sync
 *
 * The graph is a set of nodes keyed by id. Each node holds arbitrary `data`
 * plus CRDT metadata: { ts, replica, clock, deleted }.
 *
 * @version 4.0.0
 */

/**
 * Compare two vector clocks.
 * @returns {-1|0|1|null} -1 = a < b, 1 = a > b, 0 = equal, null = concurrent
 */
export function compareClocks(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let less = false;
  let greater = false;
  for (const k of keys) {
    const av = a[k] || 0;
    const bv = b[k] || 0;
    if (av < bv) less = true;
    else if (av > bv) greater = true;
  }
  if (less && greater) return null; // concurrent
  if (less) return -1;
  if (greater) return 1;
  return 0;
}

/** Element-wise maximum merge of two vector clocks. */
export function mergeClocks(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    out[k] = Math.max(out[k] || 0, v);
  }
  return out;
}

/** Advance a replica's own entry in its vector clock. */
export function tickClock(clock, replicaId) {
  return { ...clock, [replicaId]: (clock[replicaId] || 0) + 1 };
}

/** True when `incoming` should win over `current` under LWW. */
function incomingWins(current, incoming) {
  if (!current) return true;
  if (incoming.deleted && !current.deleted) return true; // delete beats live
  if (!incoming.deleted && current.deleted) return false; // live beats tombstone
  // both live or both deleted -> LWW by timestamp, replicaId tiebreak
  if (incoming.ts !== current.ts) return incoming.ts > current.ts;
  return incoming.replica > current.replica;
}

export class GraphCRDT {
  /**
   * @param {string} replicaId unique id for this node (peer)
   * @param {object} [now] injectable clock for deterministic tests
   */
  constructor(replicaId, now = Date.now) {
    if (!replicaId) throw new Error('GraphCRDT requires a replicaId');
    this.replicaId = replicaId;
    this._now = now;
    /** @type {Map<string, {data:any, ts:number, replica:string, clock:object, deleted:boolean}>} */
    this.nodes = new Map();
    this.clock = { [replicaId]: 0 };
  }

  /** Local upsert of a node. Returns the new entry. */
  updateNode(id, data) {
    this.clock = tickClock(this.clock, this.replicaId);
    const entry = {
      data,
      ts: this._now(),
      replica: this.replicaId,
      clock: { ...this.clock },
      deleted: false
    };
    const cur = this.nodes.get(id);
    if (!cur || incomingWins(cur, entry)) {
      this.nodes.set(id, entry);
    }
    return entry;
  }

  /** Local delete (tombstone). */
  removeNode(id) {
    this.clock = tickClock(this.clock, this.replicaId);
    const cur = this.nodes.get(id);
    const entry = {
      data: cur ? cur.data : null,
      ts: this._now(),
      replica: this.replicaId,
      clock: { ...this.clock },
      deleted: true
    };
    if (!cur || incomingWins(cur, entry)) {
      this.nodes.set(id, entry);
    }
    return entry;
  }

  /**
   * Merge a remote state (full or delta). Convergent: commutative,
   * associative, idempotent.
   * @param {Iterable<[string, object]>} remoteEntries [id, entry] pairs
   * @param {object} [remoteClock] remote vector clock (optional, for delta)
   */
  merge(remoteEntries, remoteClock) {
    for (const [id, r] of remoteEntries) {
      const cur = this.nodes.get(id);
      if (!cur || incomingWins(cur, r)) {
        this.nodes.set(id, { ...r });
      }
    }
    if (remoteClock) {
      this.clock = mergeClocks(this.clock, remoteClock);
    }
    return this;
  }

  /** Apply a delta produced by encodeDelta. */
  applyDelta(delta) {
    if (!delta || !Array.isArray(delta.entries)) return this;
    this.merge(delta.entries, delta.clock);
    return this;
  }

  /**
   * Produce a delta containing only entries that are newer than `sinceClock`
   * (element-wise). Enables bandwidth-efficient sync.
   * @param {object} [sinceClock]
   */
  encodeDelta(sinceClock = {}) {
    const entries = [];
    for (const [id, e] of this.nodes) {
      const cmp = compareClocks(sinceClock, e.clock);
      // Include when the peer is behind this entry (cmp < 0) or the clocks
      // are concurrent (cmp null, send to be safe). Exclude when the peer
      // already has this exact entry or is ahead (cmp >= 0).
      if (cmp === null || cmp < 0) {
        entries.push([id, { ...e }]);
      }
    }
    return { replicaId: this.replicaId, clock: { ...this.clock }, entries };
  }

  /** Convergent view: live (non-deleted) nodes only. */
  getState() {
    const out = {};
    for (const [id, e] of this.nodes) {
      if (!e.deleted) out[id] = e.data;
    }
    return out;
  }

  /** Raw entries (including tombstones) — used for merge/delta. */
  getEntries() {
    return [...this.nodes.entries()];
  }

  /** Vector-clock equality helper for convergence assertions. */
  static converged(...replicas) {
    const normalize = (obj) => {
      const sorted = {};
      for (const k of Object.keys(obj).sort()) {
        sorted[k] = obj[k];
      }
      return JSON.stringify(sorted);
    };
    const views = replicas.map((r) => normalize(r.getState()));
    return views.every((v) => v === views[0]);
  }
}

export default GraphCRDT;
