/**
 * Tests for GraphSync — the P2P replication layer over GraphCRDT (v4.0).
 * Uses the in-memory transport (no WebRTC needed) to assert that edits on
 * one peer propagate and all peers converge.
 */
import GraphSync, { MemoryTransport } from '@modules/graph-sync.js';
import GraphCRDT from '@modules/crdt-sync.js';

let T = 1000;
const now = () => (T += 1);

describe('GraphSync — P2P propagation', () => {
  test('an edit on peer A reaches peer B after connect', () => {
    const bus = new MemoryTransport();
    const a = new GraphSync('A', new GraphCRDT('A', now), bus, now);
    const b = new GraphSync('B', new GraphCRDT('B', now), bus, now);

    b.connect('A'); // B asks A for state; A broadcasts
    a.updateNode('article-1', { title: 'Hello' });

    expect(b.getState()['article-1']).toEqual({ title: 'Hello' });
    expect(GraphCRDT.converged(a.crdt, b.crdt)).toBe(true);
  });

  test('three peers in a mesh all converge after concurrent edits', () => {
    const bus = new MemoryTransport();
    const a = new GraphSync('A', new GraphCRDT('A', now), bus, now);
    const b = new GraphSync('B', new GraphCRDT('B', now), bus, now);
    const c = new GraphSync('C', new GraphCRDT('C', now), bus, now);

    a.connect('B');
    b.connect('C');
    c.connect('A');

    a.updateNode('n1', { v: 1 });
    b.updateNode('n2', { v: 2 });
    c.updateNode('n3', { v: 3 });

    expect(GraphCRDT.converged(a.crdt, b.crdt, c.crdt)).toBe(true);
    const view = a.getState();
    expect(Object.keys(view).sort()).toEqual(['n1', 'n2', 'n3']);
  });

  test('onRemoteChange fires when a delta is applied', () => {
    const bus = new MemoryTransport();
    const a = new GraphSync('A', new GraphCRDT('A', now), bus, now);
    const b = new GraphSync('B', new GraphCRDT('B', now), bus, now);
    b.connect('A');

    let fired = null;
    b.onRemoteChange((from) => (fired = from));
    a.updateNode('x', { ok: true });

    expect(fired).toBe('A');
  });

  test('delete propagates across peers', () => {
    const bus = new MemoryTransport();
    const a = new GraphSync('A', new GraphCRDT('A', now), bus, now);
    const b = new GraphSync('B', new GraphCRDT('B', now), bus, now);
    b.connect('A');

    a.updateNode('temp', { v: 1 });
    expect(b.getState()['temp']).toBeDefined();
    a.removeNode('temp');
    expect(b.getState()['temp']).toBeUndefined();
  });
});
