/**
 * @fileoverview Unit tests for PrefetchService (Knowledge-Graph driven prefetch).
 * Fully offline: injects a fake document + fetch, no real network.
 */
import { PrefetchService } from '../../src/services/prefetch.js';

function makeDoc() {
  const links = [];
  const doc = {
    location: { href: 'https://example.com/2026/01/post-a/' },
    head: { appendChild: (el) => links.push(el) },
    documentElement: {},
    createElement: (tag) => ({ tagName: tag, rel: '', href: '', as: '' }),
    querySelectorAll: () => [],
    IntersectionObserver: undefined
  };
  doc._links = links;
  return doc;
}

const SAMPLE_GRAPH = {
  nodes: [
    { id: 'a', type: 'post', url: '/2026/01/post-a/' },
    { id: 'b', type: 'post', url: '/2026/01/post-b/' },
    { id: 'c', type: 'post', url: '/2026/01/post-c/' }
  ],
  edges: [
    { source: 'a', target: 'b', strength: 3 },
    { source: 'a', target: 'c', strength: 1 }
  ]
};

function fakeFetch(graph) {
  return async (_url) => ({
    ok: true,
    json: async () => graph
  });
}

describe('PrefetchService', () => {
  test('_buildAdjacency builds undirected, weight-sorted neighbours', () => {
    const svc = new PrefetchService();
    const adj = svc._buildAdjacency(SAMPLE_GRAPH);
    const a = adj.get('/2026/01/post-a/');
    expect(a).toHaveLength(2);
    // strongest edge first
    expect(a[0].url).toBe('/2026/01/post-b/');
    expect(a[0].weight).toBe(3);
    // undirected: b sees a
    expect(adj.get('/2026/01/post-b/')[0].url).toBe('/2026/01/post-a/');
  });

  test('_buildAdjacency handles empty/malformed graph', () => {
    const svc = new PrefetchService();
    expect(svc._buildAdjacency(null).size).toBe(0);
    expect(svc._buildAdjacency({ nodes: [], edges: [] }).size).toBe(0);
    expect(svc._buildAdjacency({ nodes: 'x', edges: 'y' }).size).toBe(0);
  });

  test('init loads graph, resolves current url, builds adjacency', async () => {
    const doc = makeDoc();
    const svc = new PrefetchService({ _doc: doc, _fetch: fakeFetch(SAMPLE_GRAPH) });
    const ok = await svc.init();
    expect(ok).toBe(true);
    expect(svc.graphLoaded).toBe(true);
    expect(svc.adjacency.size).toBe(3);
  });

  test('init returns false when fetch fails (offline-safe)', async () => {
    const doc = makeDoc();
    const failingFetch = async () => ({ ok: false, json: async () => ({}) });
    const svc = new PrefetchService({ _doc: doc, _fetch: failingFetch });
    expect(await svc.init()).toBe(false);
  });

  test('getRelated returns top-N sorted by weight', () => {
    const doc = makeDoc();
    const svc = new PrefetchService({ _doc: doc, _fetch: fakeFetch(SAMPLE_GRAPH) });
    svc.adjacency = svc._buildAdjacency(SAMPLE_GRAPH);
    svc.currentUrl = '/2026/01/post-a/';
    const related = svc.getRelated();
    expect(related).toHaveLength(2);
    expect(related[0].url).toBe('/2026/01/post-b/');
  });

  test('prefetch injects <link rel="prefetch"> and dedups', () => {
    const doc = makeDoc();
    const svc = new PrefetchService({ _doc: doc });
    const scheduled1 = svc.prefetch('/2026/01/post-b/');
    expect(scheduled1).toBe(true);
    expect(doc._links).toHaveLength(1);
    expect(doc._links[0].rel).toBe('prefetch');
    // immediate duplicate is deduped (still inflight window)
    const scheduled2 = svc.prefetch('/2026/01/post-b/');
    expect(scheduled2).toBe(false);
    expect(doc._links).toHaveLength(1);
  });

  test('prefetchRelated schedules at most maxPrefetch links', () => {
    const doc = makeDoc();
    const svc = new PrefetchService({ _doc: doc, maxPrefetch: 1 });
    svc.adjacency = svc._buildAdjacency(SAMPLE_GRAPH);
    svc.currentUrl = '/2026/01/post-a/';
    const n = svc.prefetchRelated();
    expect(n).toBe(1);
    expect(doc._links).toHaveLength(1);
  });
});
