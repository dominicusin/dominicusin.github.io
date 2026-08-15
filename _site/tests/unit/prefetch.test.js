/**
 * Unit tests for src/services/prefetch.js (plan Phase 4.1 — Vector D
 * predictive prefetch). The module is explicitly designed for testing via
 * injectable _doc/_fetch and a pure _buildAdjacency().
 */
import { PrefetchService } from '@services/prefetch.js';

const GRAPH = {
  nodes: [
    { id: 1, url: '/a' },
    { id: 2, url: '/b' },
    { id: 3, url: '/c' }
  ],
  edges: [
    { source: 1, target: 2, strength: 0.9 },
    { source: 1, target: 3, strength: 0.3 },
    { source: 2, target: 3, strength: 0.5 }
  ]
};

function makeDoc() {
  const links = [];
  const doc = {
    location: { href: 'https://blog.test/a', pathname: '/a' },
    head: { appendChild: (el) => links.push(el) },
    documentElement: {},
    createElement: () => ({ rel: '', href: '', as: '' }),
    querySelectorAll: () => [],
    IntersectionObserver: null
  };
  return doc;
}

describe('PrefetchService._buildAdjacency', () => {
  test('builds undirected, deduped, weight-sorted adjacency', () => {
    const svc = new PrefetchService();
    const adj = svc._buildAdjacency(GRAPH);
    expect(adj.get('/a').map((e) => e.url)).toEqual(['/b', '/c']); // 0.9 then 0.3
    expect(adj.get('/b').map((e) => e.url)).toEqual(['/a', '/c']);
  });

  test('falls back to empty map on malformed graph', () => {
    const svc = new PrefetchService();
    expect(svc._buildAdjacency(null).size).toBe(0);
    expect(svc._buildAdjacency({}).size).toBe(0);
    expect(svc._buildAdjacency({ nodes: [], edges: 'x' }).size).toBe(0);
  });

  test('skips edges with missing node urls', () => {
    const svc = new PrefetchService();
    const adj = svc._buildAdjacency({
      nodes: [{ id: 1, url: '/a' }], // node 2 missing
      edges: [{ source: 1, target: 2, strength: 1 }]
    });
    expect(adj.get('/a')).toBeUndefined();
  });
});

describe('PrefetchService.init', () => {
  test('returns false when disabled', async () => {
    const svc = new PrefetchService({ enabled: false });
    expect(await svc.init()).toBe(false);
  });

  test('returns false without doc/fetch', async () => {
    const svc = new PrefetchService({ _doc: null, _fetch: null });
    expect(await svc.init()).toBe(false);
  });

  test('returns false on non-ok response', async () => {
    const svc = new PrefetchService({
      _doc: makeDoc(),
      _fetch: async () => ({ ok: false, status: 404 })
    });
    expect(await svc.init()).toBe(false);
  });

  test('loads graph, builds adjacency, sets currentUrl', async () => {
    const svc = new PrefetchService({
      _doc: makeDoc(),
      _fetch: async () => ({ ok: true, json: async () => GRAPH })
    });
    expect(await svc.init()).toBe(true);
    expect(svc.graphLoaded).toBe(true);
    expect(svc.currentUrl).toBe('/a');
    expect(svc.adjacency.get('/a')).toBeDefined();
  });

  test('respects save-data', async () => {
    const conn = { saveData: true };
    Object.defineProperty(global.navigator, 'connection', { configurable: true, value: conn });
    const svc = new PrefetchService({
      _doc: makeDoc(),
      _fetch: async () => ({ ok: true, json: async () => GRAPH }),
      respectSaveData: true
    });
    expect(await svc.init()).toBe(false);
    delete global.navigator.connection;
  });
});

describe('PrefetchService.getRelated / prefetchRelated', () => {
  let svc;
  beforeEach(async () => {
    svc = new PrefetchService({
      _doc: makeDoc(),
      _fetch: async () => ({ ok: true, json: async () => GRAPH }),
      maxPrefetch: 2
    });
    await svc.init();
  });

  test('getRelated returns sorted top-N', () => {
    expect(svc.getRelated('/a').map((e) => e.url)).toEqual(['/b', '/c']);
    expect(svc.getRelated('/a', 1).map((e) => e.url)).toEqual(['/b']);
  });

  test('getRelated for unknown url returns []', () => {
    expect(svc.getRelated('/zzz')).toEqual([]);
  });

  test('prefetchRelated schedules capped count', async () => {
    const svc2 = new PrefetchService({
      _doc: makeDoc(),
      _fetch: async () => ({ ok: true, json: async () => GRAPH }),
      maxPrefetch: 5,
      respectSaveData: false
    });
    await svc2.init();
    expect(svc2.prefetchRelated('/a', 5)).toBe(2); // exactly 2 related exist
  });
});

describe('PrefetchService.prefetch', () => {
  let svc;
  let doc;
  beforeEach(async () => {
    doc = makeDoc();
    svc = new PrefetchService({
      _doc: doc,
      _fetch: async () => ({ ok: true, json: async () => GRAPH }),
      concurrency: 1,
      respectSaveData: false
    });
    await svc.init();
  });

  test('injects a <link rel=prefetch> and returns true', () => {
    const appended = [];
    doc.head.appendChild = (el) => appended.push(el);
    expect(svc.prefetch('/b')).toBe(true);
    expect(appended[0].rel).toBe('prefetch');
    expect(appended[0].href).toBe('/b');
    expect(svc._inflight.has('/b')).toBe(true);
  });

  test('returns false for empty url', () => {
    expect(svc.prefetch('')).toBe(false);
  });

  test('dedupes already-scheduled urls', () => {
    svc.prefetch('/b');
    expect(svc.prefetch('/b')).toBe(false);
  });

  test('respects concurrency limit', () => {
    expect(svc.prefetch('/b')).toBe(true); // inflight=1 == concurrency=1
    expect(svc.prefetch('/c')).toBe(false); // blocked by concurrency
  });
});

describe('PrefetchService.destroy', () => {
  test('clears state without throwing', async () => {
    const svc = new PrefetchService({
      _doc: makeDoc(),
      _fetch: async () => ({ ok: true, json: async () => GRAPH })
    });
    await svc.init();
    svc.prefetch('/b');
    expect(() => svc.destroy()).not.toThrow();
    expect(svc._inflight.size).toBe(0);
    expect(svc._scheduled.size).toBe(0);
  });
});
