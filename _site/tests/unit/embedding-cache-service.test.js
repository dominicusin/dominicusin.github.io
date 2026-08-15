/**
 * Unit tests for src/services/embedding-cache-service.js (plan Phase 4.1).
 * Fully synchronous + deterministic -> exercises LRU, TTL expiry, eviction,
 * batch ops, stats, import/export.
 */
import { EmbeddingCache } from '@services/embedding-cache-service.js';

describe('EmbeddingCache', () => {
  let cache;
  beforeEach(() => { cache = new EmbeddingCache({ maxSize: 3, ttl: 1000 }); });

  test('set/get round-trips an embedding by string key', () => {
    cache.set('hello world', [0.1, 0.2]);
    expect(cache.get('hello world')).toEqual([0.1, 0.2]);
  });

  test('keys are normalized (trim + lowercase)', () => {
    cache.set('  Hello World ', [1]);
    expect(cache.get('hello world')).toEqual([1]);
  });

  test('get returns undefined for missing key', () => {
    expect(cache.get('nope')).toBeUndefined();
  });

  test('has() reflects presence and expiry', () => {
    cache.set('k', [1]);
    expect(cache.has('k')).toBe(true);
    expect(cache.has('missing')).toBe(false);
  });

  test('TTL expiry makes get/has return absent', () => {
    const c = new EmbeddingCache({ ttl: -1 }); // expires immediately
    c.set('k', [1]);
    expect(c.get('k')).toBeUndefined();
    expect(c.has('k')).toBe(false);
  });

  test('delete removes an entry', () => {
    cache.set('k', [1]);
    expect(cache.delete('k')).toBe(true);
    expect(cache.has('k')).toBe(false);
    expect(cache.delete('k')).toBe(false);
  });

  test('getBatch maps each key', () => {
    cache.set('a', [1]);
    cache.set('b', [2]);
    expect(cache.getBatch(['a', 'b', 'c'])).toEqual([[1], [2], undefined]);
  });

  test('setBatch stores multiple', () => {
    cache.setBatch([{ key: 'a', embedding: [1] }, { key: 'b', embedding: [2] }]);
    expect(cache.size).toBe(2);
    expect(cache.get('a')).toEqual([1]);
  });

  test('evicts oldest (LRU) when at capacity', () => {
    cache.set('a', [1]);
    cache.set('b', [2]);
    cache.set('c', [3]); // full (maxSize 3)
    cache.set('d', [4]); // should evict 'a' (least recently used)
    expect(cache.has('a')).toBe(false);
    expect(cache.has('d')).toBe(true);
  });

  test('LRU access order updates on get (recently used survives)', () => {
    cache.set('a', [1]);
    cache.set('b', [2]);
    cache.set('c', [3]);
    cache.get('a'); // 'a' now most-recently-used
    cache.set('d', [4]); // evicts 'b' (oldest now)
    expect(cache.has('a')).toBe(true);
    expect(cache.has('b')).toBe(false);
  });

  test('clear empties the cache', () => {
    cache.set('a', [1]);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.has('a')).toBe(false);
  });

  test('size getter reflects count', () => {
    expect(cache.size).toBe(0);
    cache.set('a', [1]);
    expect(cache.size).toBe(1);
  });

  test('getStats reports size/maxSize/expired/active/utilization', () => {
    cache.set('a', [1]);
    const stats = cache.getStats();
    expect(stats.size).toBe(1);
    expect(stats.maxSize).toBe(3);
    expect(stats.expired).toBe(0);
    expect(stats.active).toBe(1);
    expect(stats.utilization).toBe('33.33%');
  });

  test('cleanup removes expired entries and counts them', () => {
    const c = new EmbeddingCache({ ttl: -1 });
    c.set('a', [1]);
    c.set('b', [2]);
    const cleaned = c.cleanup();
    expect(cleaned).toBe(2);
    expect(c.size).toBe(0);
  });

  test('export/import round-trips non-expired entries', () => {
    cache.set('a', [1]);
    cache.set('b', [2]);
    const data = cache.export();
    const c2 = new EmbeddingCache({ ttl: 1000 });
    const imported = c2.import(data);
    expect(imported).toBe(2);
    expect(c2.get('a')).toEqual([1]);
  });

  test('generateKey is stable and deterministic', () => {
    expect(cache.generateKey('Foo Bar')).toBe(cache.generateKey('foo bar'));
  });
});
