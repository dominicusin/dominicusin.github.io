/**
 * Unit tests for EmbeddingCache (in-memory LRU cache for vector embeddings).
 * Tests the REAL implementation in src/services/embedding-cache-service.js
 * (Map-based LRU with TTL, not IndexedDB/BloomFilter).
 */

import { EmbeddingCache as EmbeddingCacheService } from '@services/embedding-cache-service.js';

describe('EmbeddingCacheService', () => {
  let cache;

  beforeEach(() => {
    cache = new EmbeddingCacheService({ maxSize: 3, ttl: 1000 });
  });

  test('should initialize with provided options', () => {
    expect(cache.maxSize).toBe(3);
    expect(cache.ttl).toBe(1000);
    expect(cache.size).toBe(0);
  });

  test('should set and get an embedding', () => {
    cache.set('hello', [0.1, 0.2]);
    expect(cache.get('hello')).toEqual([0.1, 0.2]);
  });

  test('should return undefined for a missing key', () => {
    expect(cache.get('nope')).toBeUndefined();
  });

  test('generateKey normalizes case and whitespace', () => {
    expect(cache.generateKey('  Hello ')).toBe(cache.generateKey('hello'));
  });

  test('has() reflects presence and expiry', () => {
    cache.set('a', [1]);
    expect(cache.has('a')).toBe(true);
    expect(cache.has('missing')).toBe(false);
  });

  test('TTL expiry makes entries stale', () => {
    cache.ttl = -1; // already expired
    cache.set('x', [1]);
    expect(cache.get('x')).toBeUndefined();
    expect(cache.has('x')).toBe(false);
  });

  test('delete removes an entry', () => {
    cache.set('a', [1]);
    expect(cache.delete('a')).toBe(true);
    expect(cache.has('a')).toBe(false);
  });

  test('clear empties the cache', () => {
    cache.set('a', [1]);
    cache.set('b', [2]);
    cache.clear();
    expect(cache.size).toBe(0);
  });

  test('LRU eviction removes least-recently-used when over capacity', () => {
    cache.set('a', [1]);
    cache.set('b', [2]);
    cache.set('c', [3]);
    // access 'a' so 'b' becomes LRU
    cache.get('a');
    cache.set('d', [4]); // should evict 'b'
    expect(cache.has('a')).toBe(true);
    expect(cache.has('b')).toBe(false);
    expect(cache.has('d')).toBe(true);
  });

  test('getBatch returns array of results', () => {
    cache.set('a', [1]);
    cache.set('b', [2]);
    const res = cache.getBatch(['a', 'b', 'missing']);
    expect(res).toEqual([[1], [2], undefined]);
  });

  test('setBatch stores multiple entries', () => {
    cache.setBatch([{ key: 'a', embedding: [1] }, { key: 'b', embedding: [2] }]);
    expect(cache.size).toBe(2);
    expect(cache.get('b')).toEqual([2]);
  });

  test('getStats reports size and utilization', () => {
    cache.set('a', [1]);
    const stats = cache.getStats();
    expect(stats.size).toBe(1);
    expect(stats.maxSize).toBe(3);
  });

  test('export/import round-trips entries', () => {
    cache.set('a', [1, 2]);
    const data = cache.export();
    const other = new EmbeddingCacheService({ maxSize: 10, ttl: 100000 });
    other.import(data);
    expect(other.get('a')).toEqual([1, 2]);
  });

  test('cleanup removes expired entries', () => {
    cache.ttl = -1;
    cache.set('old', [1]);
    cache.ttl = 1000;
    cache.set('new', [2]);
    const cleaned = cache.cleanup();
    expect(cleaned).toBe(1);
    expect(cache.has('new')).toBe(true);
  });
});
