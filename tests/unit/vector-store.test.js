/**
 * Unit tests for src/services/vector-store.js (plan Phase 4.1 — zero-coverage
 * module). Uses the documented injectable `idbFactory` mock for the real
 * IndexedDB path AND exercises the in-memory fallback (no IndexedDB).
 */
import { VectorStore } from '@services/vector-store.js';

// A thenable "request" that fires onsuccess/onerror, matching the real IDB API
// that src/services/vector-store.js's promisify() expects. The resolver sets
// request.result; requestLike then fires onsuccess so promisify() resolves.
function requestLike(resolver) {
  const req = {};
  Promise.resolve().then(() => { resolver(req); if (req.onsuccess) req.onsuccess(); });
  return req;
}

// Minimal in-memory IndexedDB mock implementing just what VectorStore uses.
function makeMockIdb() {
  const stores = new Map(); // storeName -> Map(id -> record)
  function getStore(name) {
    if (!stores.has(name)) stores.set(name, new Map());
    return stores.get(name);
  }
  function makeStore(name) {
    const data = getStore(name);
    return {
      put: (rec) => requestLike(() => { data.set(rec.id, rec); }),
      get: (id) => requestLike((r) => { r.result = data.get(id); }),
      getAll: () => requestLike((r) => { r.result = [...data.values()]; }),
      clear: () => requestLike(() => { data.clear(); })
    };
  }
  return {
    open(_dbName, _version) {
      return requestLike((req) => {
        req.result = {
          objectStoreNames: { contains: (n) => stores.has(n) },
          createObjectStore: (n) => { stores.set(n, new Map()); return makeStore(n); },
          transaction: (name, _mode) => {
            const store = makeStore(name);
            // Real IDBTransaction fires `onsuccess` after the synchronous op
            // body completes (i.e. after promisify(tx) wires its handler).
            // Defer to a macrotask so the handler is in place.
            const tx = { objectStore: () => store };
            setTimeout(() => { if (tx.onsuccess) tx.onsuccess(); }, 0);
            return tx;
          }
        };
        if (req.onsuccess) req.onsuccess();
      });
    }
  };
}

const sample = (id) => ({ id, url: `/p/${id}`, vector: [['ai', 0.9], ['web', 0.4]], post: { title: id } });

describe('VectorStore — in-memory fallback (no IndexedDB)', () => {
  let vs;
  beforeEach(() => { vs = new VectorStore({ idbFactory: null }); });

  test('uses memory fallback when idbFactory is null', () => {
    expect(vs.isMemoryFallback()).toBe(true);
  });

  test('put / get round-trips a record', async () => {
    await vs.put(sample('a'));
    expect(await vs.get('a')).toEqual(sample('a'));
  });

  test('get returns undefined for missing id', async () => {
    expect(await vs.get('nope')).toBeUndefined();
  });

  test('bulkPut then getAll returns all', async () => {
    await vs.bulkPut([sample('a'), sample('b')]);
    const all = await vs.getAll();
    expect(all.map((r) => r.id).sort()).toEqual(['a', 'b']);
  });

  test('clear empties the store', async () => {
    await vs.put(sample('a'));
    await vs.clear();
    expect(await vs.getAll()).toEqual([]);
  });

  test('open() is idempotent', async () => {
    await vs.open();
    await vs.open();
    expect(vs.isMemoryFallback()).toBe(true);
  });
});

describe('VectorStore — real IndexedDB path (mocked factory)', () => {
  let vs;
  beforeEach(() => { vs = new VectorStore({ idbFactory: makeMockIdb() }); });

  test('does NOT use memory fallback with a factory', () => {
    expect(vs.isMemoryFallback()).toBe(false);
  });

  test('put / get round-trips through IDB mock', async () => {
    await vs.put(sample('x'));
    expect(await vs.get('x')).toEqual(sample('x'));
  });

  test('bulkPut / getAll through IDB mock', async () => {
    await vs.bulkPut([sample('x'), sample('y')]);
    const all = await vs.getAll();
    expect(all.map((r) => r.id).sort()).toEqual(['x', 'y']);
  });

  test('clear through IDB mock', async () => {
    await vs.put(sample('x'));
    await vs.clear();
    expect(await vs.getAll()).toEqual([]);
  });
});
