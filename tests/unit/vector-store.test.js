/**
 * @fileoverview Unit tests for the IndexedDB-backed Vector Store.
 */
import { VectorStore } from '../../src/services/vector-store.js';

describe('VectorStore', () => {
  let store;
  beforeEach(() => {
    store = new VectorStore({ dbName: 'test-vectors-' + Date.now() });
  });

  test('falls back to in-memory when IndexedDB missing', async () => {
    const mem = new VectorStore({ idbFactory: null });
    await mem.put({ id: '1', vector: [['x', 0.5]], post: { title: 'a' } });
    const got = await mem.get('1');
    expect(got.id).toBe('1');
    expect(mem.isMemoryFallback()).toBe(true);
  });

  test('puts and gets a record (polyfilled IndexedDB)', async () => {
    await store.put({ id: 'p1', vector: [['term', 0.3]], post: { title: 'Post 1' } });
    const got = await store.get('p1');
    expect(got).toBeDefined();
    expect(got.post.title).toBe('Post 1');
  });

  test('bulkPut then getAll returns all records', async () => {
    await store.bulkPut([
      { id: 'p1', vector: [], post: { title: 'A' } },
      { id: 'p2', vector: [], post: { title: 'B' } }
    ]);
    const all = await store.getAll();
    expect(all.length).toBe(2);
  });

  test('clear empties the store', async () => {
    await store.put({ id: 'p1', vector: [], post: {} });
    await store.clear();
    expect(await store.getAll()).toEqual([]);
  });
});
