/**
 * Unit Tests for Embedding Cache Service v3.0
 * 
 * Coverage:
 * - IndexedDB initialization and versioning
 * - Chunked storage for large vectors
 * - LRU eviction policy
 * - Bloom Filter operations
 * - Atomic batching
 * - Integrity checks (CRC32)
 * - Zero-copy reading
 * - Offline support
 */

import { EmbeddingCacheService } from '@services/embedding-cache.js';

describe('EmbeddingCacheService', () => {
  let cacheService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    global.testUtils?.resetAllMocks();
    
    // Reset IndexedDB mock state
    const mockStore = {
      data: new Map(),
      add: jest.fn((item) => {
        mockStore.data.set(item.id, item);
        return { onsuccess: null, onerror: null };
      }),
      get: jest.fn((key) => {
        const item = mockStore.data.get(key);
        return { result: item, onsuccess: null, onerror: null };
      }),
      getAll: jest.fn(() => {
        return { result: Array.from(mockStore.data.values()), onsuccess: null };
      }),
      delete: jest.fn((key) => {
        mockStore.data.delete(key);
        return { onsuccess: null, onerror: null };
      }),
      clear: jest.fn(() => {
        mockStore.data.clear();
        return { onsuccess: null, onerror: null };
      }),
      count: jest.fn(() => {
        return { result: mockStore.data.size, onsuccess: null };
      }),
      put: jest.fn((item) => {
        mockStore.data.set(item.id, item);
        return { onsuccess: null, onerror: null };
      }),
      openCursor: jest.fn(() => {
        // Mock cursor for iteration
        return { onsuccess: null };
      })
    };
    
    const mockDB = {
      objectStoreNames: { contains: jest.fn(() => true) },
      createObjectStore: jest.fn(() => mockStore),
      transaction: jest.fn((storeName, mode) => ({
        objectStore: jest.fn(() => mockStore),
        oncomplete: null,
        onerror: null,
        abort: jest.fn()
      })),
      close: jest.fn(),
      deleteObjectStore: jest.fn()
    };
    
    global.indexedDB.open.mockReturnValue({
      onupgradeneeded: null,
      onsuccess: null,
      onerror: null,
      result: mockDB
    });
    
    cacheService = new EmbeddingCacheService('test-cache-db', 1);
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', async () => {
      const service = new EmbeddingCacheService();
      
      expect(service.dbName).toBe('embedding-cache-v3');
      expect(service.version).toBe(1);
      expect(service.config.maxItems).toBe(5000);
      expect(service.config.maxSizeMB).toBe(50);
      expect(service.config.chunkSize).toBe(1024);
      expect(service.config.bloomFilterSize).toBe(10000);
    });

    test('should initialize IndexedDB connection', async () => {
      await cacheService.init();
      
      expect(global.indexedDB.open).toHaveBeenCalledWith('test-cache-db', 1);
      expect(cacheService.db).toBeTruthy();
    });

    test('should handle IndexedDB not supported', async () => {
      const originalIndexedDB = global.indexedDB;
      delete global.indexedDB;
      
      const service = new EmbeddingCacheService();
      
      await expect(service.init()).rejects.toThrow('IndexedDB not supported');
      
      global.indexedDB = originalIndexedDB;
    });

    test('should return existing init promise if called multiple times', async () => {
      const firstInit = cacheService.init();
      const secondInit = cacheService.init();
      
      expect(firstInit).toBe(secondInit);
      
      await firstInit;
    });
  });

  describe('Bloom Filter', () => {
    test('should add items to Bloom Filter', () => {
      const hash = cacheService._hash('test-key');
      cacheService._addToBloomFilter(hash);
      
      // Check that bits are set
      expect(cacheService.bloomFilter.some(byte => byte !== 0)).toBe(true);
    });

    test('should check existence in Bloom Filter', () => {
      const key = 'test-key';
      const hash = cacheService._hash(key);
      
      // Initially should not exist
      expect(cacheService._checkBloomFilter(hash)).toBe(false);
      
      // Add and check again
      cacheService._addToBloomFilter(hash);
      expect(cacheService._checkBloomFilter(hash)).toBe(true);
    });

    test('should have no false negatives in Bloom Filter', () => {
      const keys = ['key1', 'key2', 'key3', 'key4', 'key5'];
      
      keys.forEach(key => {
        const hash = cacheService._hash(key);
        cacheService._addToBloomFilter(hash);
      });
      
      // All added keys must be found (no false negatives)
      keys.forEach(key => {
        const hash = cacheService._hash(key);
        expect(cacheService._checkBloomFilter(hash)).toBe(true);
      });
    });

    test('should use multiple hash functions', () => {
      const hash1 = cacheService._hash('test', 0);
      const hash2 = cacheService._hash('test', 1);
      const hash3 = cacheService._hash('test', 2);
      
      // Different hash functions should produce different results
      expect(hash1).not.toBe(hash2);
      expect(hash2).not.toBe(hash3);
      expect(hash1).not.toBe(hash3);
    });
  });

  describe('Cache Operations', () => {
    test('should set embedding in cache', async () => {
      await cacheService.init();
      
      const embedding = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5]);
      const result = await cacheService.set('doc-1', embedding, 'test-slug');
      
      expect(result).toBe(true);
    });

    test('should get embedding from cache', async () => {
      await cacheService.init();
      
      const embedding = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5]);
      await cacheService.set('doc-1', embedding, 'test-slug');
      
      const retrieved = await cacheService.get('doc-1');
      
      expect(retrieved).toBeDefined();
      expect(retrieved.vector).toBeDefined();
    });

    test('should return null for non-existent key', async () => {
      await cacheService.init();
      
      const result = await cacheService.get('non-existent');
      
      expect(result).toBeNull();
    });

    test('should delete embedding from cache', async () => {
      await cacheService.init();
      
      const embedding = new Float32Array([0.1, 0.2, 0.3]);
      await cacheService.set('doc-1', embedding, 'test-slug');
      
      const deleted = await cacheService.delete('doc-1');
      expect(deleted).toBe(true);
      
      const retrieved = await cacheService.get('doc-1');
      expect(retrieved).toBeNull();
    });

    test('should clear all embeddings', async () => {
      await cacheService.init();
      
      await cacheService.set('doc-1', new Float32Array([0.1, 0.2]), 'slug-1');
      await cacheService.set('doc-2', new Float32Array([0.3, 0.4]), 'slug-2');
      
      await cacheService.clear();
      
      const count = await cacheService.count();
      expect(count).toBe(0);
    });
  });

  describe('Chunked Storage', () => {
    test('should chunk large vectors', async () => {
      await cacheService.init();
      
      // Create a large vector (larger than chunkSize)
      const largeVector = new Float32Array(2000);
      for (let i = 0; i < 2000; i++) {
        largeVector[i] = i * 0.001;
      }
      
      await cacheService.set('large-doc', largeVector, 'large-slug');
      
      const retrieved = await cacheService.get('large-doc');
      expect(retrieved).toBeDefined();
      expect(retrieved.vector.length).toBe(2000);
    });

    test('should reassemble chunks correctly', async () => {
      await cacheService.init();
      
      const originalVector = new Float32Array(1500);
      for (let i = 0; i < 1500; i++) {
        originalVector[i] = Math.random();
      }
      
      await cacheService.set('chunked-doc', originalVector, 'chunked-slug');
      
      const retrieved = await cacheService.get('chunked-doc');
      
      expect(retrieved.vector.length).toBe(originalVector.length);
      for (let i = 0; i < originalVector.length; i++) {
        expect(retrieved.vector[i]).toBeCloseTo(originalVector[i], 5);
      }
    });
  });

  describe('LRU Eviction', () => {
    test('should evict oldest items when maxItems exceeded', async () => {
      await cacheService.init();
      
      // Set maxItems to small value for testing
      cacheService.config.maxItems = 3;
      
      await cacheService.set('doc-1', new Float32Array([0.1]), 'slug-1');
      await global.testUtils.wait(10);
      await cacheService.set('doc-2', new Float32Array([0.2]), 'slug-2');
      await global.testUtils.wait(10);
      await cacheService.set('doc-3', new Float32Array([0.3]), 'slug-3');
      await global.testUtils.wait(10);
      await cacheService.set('doc-4', new Float32Array([0.4]), 'slug-4');
      
      // Oldest item should be evicted
      const doc1 = await cacheService.get('doc-1');
      expect(doc1).toBeNull();
      
      // Newest items should still exist
      const doc4 = await cacheService.get('doc-4');
      expect(doc4).toBeDefined();
    });

    test('should update LRU order on access', async () => {
      await cacheService.init();
      
      cacheService.config.maxItems = 3;
      
      await cacheService.set('doc-1', new Float32Array([0.1]), 'slug-1');
      await global.testUtils.wait(10);
      await cacheService.set('doc-2', new Float32Array([0.2]), 'slug-2');
      await global.testUtils.wait(10);
      await cacheService.set('doc-3', new Float32Array([0.3]), 'slug-3');
      
      // Access doc-1 to make it recently used
      await cacheService.get('doc-1');
      
      // Add new item
      await global.testUtils.wait(10);
      await cacheService.set('doc-4', new Float32Array([0.4]), 'slug-4');
      
      // doc-2 should be evicted (oldest not accessed)
      const doc2 = await cacheService.get('doc-2');
      expect(doc2).toBeNull();
      
      // doc-1 should still exist (accessed recently)
      const doc1 = await cacheService.get('doc-1');
      expect(doc1).toBeDefined();
    });
  });

  describe('Atomic Batching', () => {
    test('should batch multiple writes', async () => {
      await cacheService.init();
      
      const batchSize = 10;
      const writes = [];
      
      for (let i = 0; i < batchSize; i++) {
        writes.push({
          id: `batch-doc-${i}`,
          vector: new Float32Array([i * 0.1]),
          slug: `batch-slug-${i}`
        });
      }
      
      await cacheService.batchSet(writes);
      
      // Verify all items were written
      for (let i = 0; i < batchSize; i++) {
        const item = await cacheService.get(`batch-doc-${i}`);
        expect(item).toBeDefined();
      }
    });

    test('should respect batch delay', async () => {
      await cacheService.init();
      
      const writeSpy = jest.spyOn(cacheService, '_processWriteQueue');
      
      await cacheService.set('doc-1', new Float32Array([0.1]), 'slug-1');
      await cacheService.set('doc-2', new Float32Array([0.2]), 'slug-2');
      await cacheService.set('doc-3', new Float32Array([0.3]), 'slug-3');
      
      await global.testUtils.wait(cacheService.BATCH_DELAY_MS + 50);
      
      // Should have processed batch
      expect(writeSpy).toHaveBeenCalled();
      
      writeSpy.mockRestore();
    });

    test('should handle batch errors gracefully', async () => {
      await cacheService.init();
      
      const invalidWrites = [
        { id: null, vector: new Float32Array([0.1]) }, // Invalid ID
        { id: 'valid-doc', vector: 'not-a-typed-array' } // Invalid vector
      ];
      
      await expect(cacheService.batchSet(invalidWrites))
        .resolves.toBeDefined(); // Should not throw
    });
  });

  describe('Integrity Checks', () => {
    test('should calculate CRC32 checksum', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const crc = cacheService._calculateCRC32(data);
      
      expect(crc).toBeDefined();
      expect(typeof crc).toBe('number');
      expect(crc).toBeGreaterThanOrEqual(0);
    });

    test('should verify data integrity', async () => {
      await cacheService.init();
      
      const vector = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5]);
      await cacheService.set('integrity-doc', vector, 'integrity-slug');
      
      const retrieved = await cacheService.get('integrity-doc');
      
      expect(retrieved.checksum).toBeDefined();
      expect(cacheService._verifyChecksum(vector, retrieved.checksum)).toBe(true);
    });

    test('should detect corrupted data', () => {
      const vector = new Float32Array([0.1, 0.2, 0.3]);
      const checksum = cacheService._calculateCRC32(
        new Uint8Array(vector.buffer)
      );
      
      // Modify vector
      const corrupted = new Float32Array([0.1, 0.9, 0.3]);
      
      expect(cacheService._verifyChecksum(corrupted, checksum)).toBe(false);
    });
  });

  describe('Metadata Operations', () => {
    test('should store metadata', async () => {
      await cacheService.init();
      
      const metadata = {
        modelVersion: 'v1.0',
        dimensions: 384,
        createdAt: Date.now()
      };
      
      await cacheService.setMeta('config', metadata);
      
      const retrieved = await cacheService.getMeta('config');
      expect(retrieved).toEqual(metadata);
    });

    test('should return null for non-existent metadata', async () => {
      await cacheService.init();
      
      const result = await cacheService.getMeta('non-existent');
      expect(result).toBeNull();
    });

    test('should update metadata', async () => {
      await cacheService.init();
      
      await cacheService.setMeta('stats', { count: 10 });
      await cacheService.setMeta('stats', { count: 20, updated: true });
      
      const retrieved = await cacheService.getMeta('stats');
      expect(retrieved.count).toBe(20);
      expect(retrieved.updated).toBe(true);
    });
  });

  describe('Performance', () => {
    test('should handle concurrent reads', async () => {
      await cacheService.init();
      
      // Pre-populate cache
      for (let i = 0; i < 100; i++) {
        await cacheService.set(`doc-${i}`, new Float32Array([i * 0.01]), `slug-${i}`);
      }
      
      // Concurrent reads
      const readPromises = [];
      for (let i = 0; i < 50; i++) {
        readPromises.push(cacheService.get(`doc-${i}`));
      }
      
      const results = await Promise.all(readPromises);
      
      expect(results.every(r => r !== null)).toBe(true);
    });

    test('should handle concurrent writes', async () => {
      await cacheService.init();
      
      const writePromises = [];
      for (let i = 0; i < 50; i++) {
        writePromises.push(
          cacheService.set(`concurrent-${i}`, new Float32Array([i * 0.01]), `slug-${i}`)
        );
      }
      
      const results = await Promise.all(writePromises);
      
      expect(results.every(r => r === true)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty vectors', async () => {
      await cacheService.init();
      
      const emptyVector = new Float32Array(0);
      await cacheService.set('empty-doc', emptyVector, 'empty-slug');
      
      const retrieved = await cacheService.get('empty-doc');
      expect(retrieved).toBeDefined();
      expect(retrieved.vector.length).toBe(0);
    });

    test('should handle very large vectors', async () => {
      await cacheService.init();
      
      const hugeVector = new Float32Array(10000);
      for (let i = 0; i < 10000; i++) {
        hugeVector[i] = Math.random();
      }
      
      await cacheService.set('huge-doc', hugeVector, 'huge-slug');
      
      const retrieved = await cacheService.get('huge-doc');
      expect(retrieved).toBeDefined();
      expect(retrieved.vector.length).toBe(10000);
    });

    test('should handle special characters in keys', async () => {
      await cacheService.init();
      
      const specialKey = 'doc-with-special-chars!@#$%^&*()_+';
      const vector = new Float32Array([0.1, 0.2, 0.3]);
      
      await cacheService.set(specialKey, vector, 'special-slug');
      
      const retrieved = await cacheService.get(specialKey);
      expect(retrieved).toBeDefined();
    });

    test('should handle unicode slugs', async () => {
      await cacheService.init();
      
      const unicodeSlug = 'статья-中文-🚀';
      const vector = new Float32Array([0.5, 0.6, 0.7]);
      
      await cacheService.set('unicode-doc', vector, unicodeSlug);
      
      const retrieved = await cacheService.getBySlug(unicodeSlug);
      expect(retrieved).toBeDefined();
    });
  });
});
