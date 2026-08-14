/**
 * Tests for GraphCRDT — the knowledge-graph sync primitive (v4.0).
 * Real, runnable tests. Each scenario asserts convergence / conflict
 * resolution properties of the CRDT.
 */
import GraphCRDT, {
  compareClocks,
  mergeClocks,
  tickClock
} from '@modules/crdt-sync.js';

// Deterministic clock so tests are reproducible.
let T = 1000;
const now = () => (T += 1);

const make = (id) => new GraphCRDT(id, now);

describe('GraphCRDT — helpers', () => {
  test('compareClocks: equal clocks', () => {
    expect(compareClocks({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(0);
  });
  test('compareClocks: less than', () => {
    expect(compareClocks({ a: 1 }, { a: 2 })).toBe(-1);
  });
  test('compareClocks: greater than', () => {
    expect(compareClocks({ a: 3 }, { a: 2 })).toBe(1);
  });
  test('compareClocks: concurrent (divergent)', () => {
    expect(compareClocks({ a: 2, b: 1 }, { a: 1, b: 2 })).toBeNull();
  });
  test('mergeClocks: element-wise max', () => {
    expect(mergeClocks({ a: 1, b: 2 }, { a: 3, c: 4 })).toEqual({ a: 3, b: 2, c: 4 });
  });
  test('tickClock: increments own entry', () => {
    expect(tickClock({ a: 1 }, 'a')).toEqual({ a: 2 });
    expect(tickClock({}, 'z')).toEqual({ z: 1 });
  });
});

describe('GraphCRDT — local operations', () => {
  test('updateNode stores data and stamps metadata', () => {
    const r = make('A');
    r.updateNode('n1', { title: 'X' });
    const e = r.nodes.get('n1');
    expect(e.data).toEqual({ title: 'X' });
    expect(e.replica).toBe('A');
    expect(e.deleted).toBe(false);
    expect(e.clock).toEqual({ A: 1 });
  });

  test('removeNode creates a tombstone that wins over live', () => {
    const r = make('A');
    r.updateNode('n1', { title: 'X' });
    r.removeNode('n1');
    expect(r.nodes.get('n1').deleted).toBe(true);
    expect(r.getState()).toEqual({}); // not visible in live state
  });

  test('getState returns only live nodes', () => {
    const r = make('A');
    r.updateNode('a', { v: 1 });
    r.updateNode('b', { v: 2 });
    r.removeNode('a');
    expect(r.getState()).toEqual({ b: { v: 2 } });
  });
});

describe('GraphCRDT — conflict resolution (LWW + vector clocks)', () => {
  test('concurrent edit on same node resolves deterministically via LWW', () => {
    const a = make('A');
    const b = make('B');
    const t = 5000;
    // Force identical timestamps, replicaId breaks the tie.
    a._now = () => t; b._now = () => t;
    a.updateNode('n1', { by: 'A' });
    b.updateNode('n1', { by: 'B' });
    a.merge(b.getEntries(), b.clock);
    b.merge(a.getEntries(), a.clock);
    // Both converge; winner is replica with higher id at equal ts.
    expect(GraphCRDT.converged(a, b)).toBe(true);
    const view = a.getState().n1;
    expect(view).toEqual({ by: 'B' }); // 'B' > 'A' tiebreak
  });

  test('newer timestamp wins over older even across replicas', () => {
    const a = make('A');
    const b = make('B');
    let clock = 0; const c = () => (clock += 100);
    a._now = c; b._now = c;
    a.updateNode('n1', { v: 1 }); // ts=100
    b.updateNode('n1', { v: 2 }); // ts=200
    a.merge(b.getEntries(), b.clock);
    expect(a.getState().n1).toEqual({ v: 2 });
  });

  test('delete reliably beats a concurrent add (tombstone)', () => {
    const a = make('A');
    const b = make('B');
    let clock = 0; const c = () => (clock += 1);
    a._now = c; b._now = c;
    a.updateNode('n1', { v: 1 });
    // concurrent: A deletes, B updates
    a.removeNode('n1');
    b.updateNode('n1', { v: 99 });
    a.merge(b.getEntries(), b.clock);
    b.merge(a.getEntries(), a.clock);
    expect(GraphCRDT.converged(a, b)).toBe(true);
    expect(a.getState()).toEqual({}); // tombstone wins everywhere
  });
});

describe('GraphCRDT — network partition & eventual consistency', () => {
  test('partition then resync converges (star topology)', () => {
    const a = make('A');
    const b = make('B');
    const c = make('C');
    let clock = 0; const cfn = () => (clock += 1);
    [a, b, c].forEach((r) => (r._now = cfn));

    // Partition: A and B diverge, C isolated.
    a.updateNode('x', { from: 'A' });
    b.updateNode('y', { from: 'B' });
    c.updateNode('z', { from: 'C' });

    // Network heals: full gossip A<->B<->C
    a.merge(b.getEntries(), b.clock);
    a.merge(c.getEntries(), c.clock);
    b.merge(a.getEntries(), a.clock);
    b.merge(c.getEntries(), c.clock);
    c.merge(a.getEntries(), a.clock);
    c.merge(b.getEntries(), b.clock);

    expect(GraphCRDT.converged(a, b, c)).toBe(true);
    const view = a.getState();
    expect(Object.keys(view).sort()).toEqual(['x', 'y', 'z']);
  });

  test('merge is idempotent (duplicate delivery)', () => {
    const a = make('A');
    const b = make('B');
    a._now = () => 50; b._now = () => 60;
    a.updateNode('n1', { v: 1 });
    b.merge(a.getEntries(), a.clock);
    const before = JSON.stringify(b.getState());
    b.merge(a.getEntries(), a.clock); // deliver twice
    b.merge(a.getEntries(), a.clock);
    expect(JSON.stringify(b.getState())).toEqual(before);
  });

  test('merge is commutative (order independence)', () => {
    const a = make('A');
    const b = make('B');
    const c = make('C');
    let k = 0; const cf = () => (k += 1);
    [a, b, c].forEach((r) => (r._now = cf));
    a.updateNode('a', {});
    b.updateNode('b', {});
    c.updateNode('c', {});

    const r1 = make('R1'); r1._now = cf;
    const r2 = make('R2'); r2._now = cf;
    // Two different merge orders
    r1.merge(a.getEntries(), a.clock);
    r1.merge(b.getEntries(), b.clock);
    r1.merge(c.getEntries(), c.clock);

    r2.merge(c.getEntries(), c.clock);
    r2.merge(a.getEntries(), a.clock);
    r2.merge(b.getEntries(), b.clock);

    expect(GraphCRDT.converged(r1, r2)).toBe(true);
    expect(Object.keys(r1.getState()).sort()).toEqual(['a', 'b', 'c']);
  });
});

describe('GraphCRDT — delta compression', () => {
  test('encodeDelta includes all when sinceClock empty', () => {
    T = 1000;
    const a = make('A');
    a.updateNode('n1', { v: 1 });
    a.updateNode('n2', { v: 2 });
    const d = a.encodeDelta({});
    expect(d.entries.length).toBe(2);
    expect(d.replicaId).toBe('A');
  });

  test('encodeDelta excludes entries already known to peer', () => {
    T = 1000;
    const a = make('A');
    a.updateNode('old', { v: 1 });
    const since = { ...a.clock };
    a.updateNode('new', { v: 2 }); // only this is newer than `since`
    const d = a.encodeDelta(since);
    const ids = d.entries.map(([id]) => id);
    expect(ids).toEqual(['new']);
  });

  test('applyDelta converges a fresh replica', () => {
    T = 1000;
    const a = make('A');
    a.updateNode('n1', { v: 1 });
    a.updateNode('n2', { v: 2 });
    const b = make('B');
    b.applyDelta(a.encodeDelta({}));
    expect(GraphCRDT.converged(a, b)).toBe(true);
    expect(b.getState()).toEqual(a.getState());
  });

  test('delta transfer is strictly smaller than full state for large graphs', () => {
    T = 1000;
    const a = make('A');
    for (let i = 0; i < 50; i++) a.updateNode('n' + i, { v: i });
    const full = JSON.stringify(a.getEntries()).length;
    const delta = JSON.stringify(a.encodeDelta({ A: 49 })).length; // A already has 49/50
    expect(delta).toBeLessThan(full);
  });
});
