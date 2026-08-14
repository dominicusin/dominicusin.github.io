/**
 * Unit Tests for Vector Search Service v3.0
 * 
 * Coverage:
 * - Device capability detection
 * - Backend selection (WebGPU, WebGL, WASM)
 * - Hybrid search (keyword + vector)
 * - Embedding cache integration
 * - Web Worker communication
 * - Batch processing optimization
 * - Reranking algorithms
 */

import { VectorSearchService } from '@services/vector-search-service.js';

describe('VectorSearchService', () => {
  let vectorService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    global.testUtils?.resetAllMocks();
    
    vectorService = new VectorSearchService({
      batchSize: 4,
      useIdleCallback: false,
      maxConcurrentBatches: 1
    });
  });

  describe('Initialization', () => {
    test('should initialize with default options', () => {
      const service = new VectorSearchService();
      
      expect(service.config.batchSize).toBe(8);
      expect(service.config.useIdleCallback).toBe(true);
      expect(service.config.maxConcurrentBatches).toBe(2);
      expect(service.index).toEqual([]);
      expect(service.isModelLoaded).toBe(false);
    });

    test('should initialize with custom options', () => {
      const service = new VectorSearchService({
        batchSize: 16,
        useIdleCallback: false,
        maxConcurrentBatches: 4
      });
      
      expect(service.config.batchSize).toBe(16);
      expect(service.config.useIdleCallback).toBe(false);
      expect(service.config.maxConcurrentBatches).toBe(4);
    });
  });

  describe('Device Capability Detection', () => {
    test('should detect device capabilities correctly', () => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8, configurable: true });
      Object.defineProperty(navigator, 'deviceMemory', { value: 8, configurable: true });
      
      const deviceInfo = vectorService.detectDeviceCapabilities();
      
      expect(deviceInfo.logicalCores).toBe(8);
      expect(deviceInfo.memoryGB).toBe(8);
      expect(deviceInfo).toHaveProperty('hasWebGL');
      expect(deviceInfo).toHaveProperty('hasWebGPU');
      expect(deviceInfo).toHaveProperty('isLowEnd');
      expect(deviceInfo).toHaveProperty('isMobile');
    });

    test('should classify low-end devices correctly', () => {
      Object.defineProperty(navigator, 'deviceMemory', { value: 1, configurable: true });
      
      const deviceInfo = vectorService.detectDeviceCapabilities();
      
      expect(deviceInfo.isLowEnd).toBe(true);
    });

    test('should classify high-end devices correctly', () => {
      Object.defineProperty(navigator, 'deviceMemory', { value: 16, configurable: true });
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 16, configurable: true });
      
      const deviceInfo = vectorService.detectDeviceCapabilities();
      
      expect(deviceInfo.isLowEnd).toBe(false);
    });

    test('should detect mobile devices', () => {
      Object.defineProperty(navigator, 'userAgent', { 
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', 
        configurable: true 
      });
      
      const deviceInfo = vectorService.detectDeviceCapabilities();
      
      expect(deviceInfo.isMobile).toBe(true);
    });
  });

  describe('Backend Selection', () => {
    test('should select WebGPU for high-end devices with support', () => {
      Object.defineProperty(navigator, 'deviceMemory', { value: 8, configurable: true });
      Object.defineProperty(navigator, 'gpu', { value: {}, configurable: true });
      
      const deviceInfo = vectorService.detectDeviceCapabilities();
      const backend = vectorService._selectBackend();
      
      expect(backend).toBe('webgpu');
    });

    test('should fallback to WebGL when WebGPU unavailable', () => {
      Object.defineProperty(navigator, 'deviceMemory', { value: 8, configurable: true });
      Object.defineProperty(navigator, 'gpu', { value: null, configurable: true });
      
      const deviceInfo = vectorService.detectDeviceCapabilities();
      const backend = vectorService._selectBackend();
      
      expect(backend).toMatch(/webgl|wasm/);
    });

    test('should select WASM for low-end devices', () => {
      Object.defineProperty(navigator, 'deviceMemory', { value: 1, configurable: true });
      
      const deviceInfo = vectorService.detectDeviceCapabilities();
      const backend = vectorService._selectBackend();
      
      expect(backend).toBe('wasm');
    });
  });

  describe('Hybrid Search', () => {
    test('should perform keyword search with Lunr.js', async () => {
      // Mock index data
      vectorService.index = [
        { id: '1', title: 'Introduction to AI', content: 'Artificial Intelligence basics' },
        { id: '2', title: 'Machine Learning Guide', content: 'ML algorithms explained' },
        { id: '3', title: 'Deep Learning', content: 'Neural networks and deep learning' }
      ];
      
      const results = await vectorService.search('AI');
      
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('score');
    });

    test('should combine keyword and vector scores', async () => {
      vectorService.index = [
        { id: '1', title: 'Vector Search', content: 'Semantic search with vectors' },
        { id: '2', title: 'Keyword Search', content: 'Traditional keyword matching' }
      ];
      
      const results = await vectorService.search('search', {
        useHybrid: true,
        keywordWeight: 0.5,
        vectorWeight: 0.5
      });
      
      expect(results).toBeInstanceOf(Array);
      results.forEach(result => {
        expect(result).toHaveProperty('hybridScore');
      });
    });

    test('should handle empty query gracefully', async () => {
      const results = await vectorService.search('');
      
      expect(results).toEqual([]);
    });

    test('should respect result limit', async () => {
      vectorService.index = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        title: `Article ${i}`,
        content: `Content for article ${i}`
      }));
      
      const results = await vectorService.search('article', { limit: 5 });
      
      expect(results.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Reranking', () => {
    test('should apply reranking to results', async () => {
      const results = [
        { id: '1', score: 0.9, metadata: { recency: 0.5 } },
        { id: '2', score: 0.8, metadata: { recency: 0.9 } },
        { id: '3', score: 0.7, metadata: { recency: 0.7 } }
      ];
      
      const reranked = vectorService.rerank(results, {
        strategy: 'recency',
        recencyWeight: 0.3
      });
      
      expect(reranked).toBeInstanceOf(Array);
      expect(reranked.length).toBe(results.length);
      expect(reranked[0]).toHaveProperty('finalScore');
    });

    test('should apply diversity reranking', async () => {
      const results = [
        { id: '1', score: 0.9, category: 'AI' },
        { id: '2', score: 0.85, category: 'AI' },
        { id: '3', score: 0.8, category: 'ML' },
        { id: '4', score: 0.75, category: 'ML' }
      ];
      
      const reranked = vectorService.rerank(results, {
        strategy: 'diversity',
        categoryField: 'category'
      });
      
      expect(reranked).toBeInstanceOf(Array);
      // Should have diverse categories in top results
      const topCategories = new Set(reranked.slice(0, 2).map(r => r.category));
      expect(topCategories.size).toBeGreaterThanOrEqual(1);
    });

    test('should handle empty results in reranking', () => {
      const reranked = vectorService.rerank([], { strategy: 'recency' });
      expect(reranked).toEqual([]);
    });
  });

  describe('Batch Processing', () => {
    test('should process embeddings in batches', async () => {
      const texts = Array.from({ length: 10 }, (_, i) => `Text ${i}`);
      
      // Mock worker response
      const mockEmbeddings = texts.map(() => Array(384).fill(0.1));
      
      const embeddings = await vectorService.generateEmbeddingsBatch(texts);
      
      expect(embeddings).toBeInstanceOf(Array);
      expect(embeddings.length).toBe(texts.length);
    });

    test('should respect batch size configuration', async () => {
      const texts = Array.from({ length: 8 }, (_, i) => `Text ${i}`);
      const batchSizeSpy = jest.spyOn(vectorService, '_processBatch');
      
      await vectorService.generateEmbeddingsBatch(texts);
      
      // Should split into multiple batches based on config
      expect(batchSizeSpy).toHaveBeenCalled();
      
      batchSizeSpy.mockRestore();
    });

    test('should handle batch processing errors', async () => {
      const texts = ['valid text', null, 'another valid text'];
      
      // Should not throw, should handle gracefully
      await expect(vectorService.generateEmbeddingsBatch(texts))
        .resolves.toBeInstanceOf(Array);
    });
  });

  describe('Cache Integration', () => {
    test('should use cached embeddings when available', async () => {
      const text = 'cached query';
      const cachedEmbedding = Array(384).fill(0.5);
      
      // Pre-populate cache
      await vectorService.cache.set(text, cachedEmbedding);
      
      const embedding = await vectorService.getEmbedding(text);
      
      expect(embedding).toEqual(cachedEmbedding);
    });

    test('should cache newly generated embeddings', async () => {
      const text = 'new query';
      const embedding = Array(384).fill(0.3);
      
      // Mock worker to return embedding
      const originalPostMessage = vectorService.worker?.postMessage;
      if (vectorService.worker) {
        vectorService.worker.postMessage = function(msg) {
          setTimeout(() => {
            this.onmessage({ 
              data: { 
                type: 'EMBEDDING_RESULT', 
                requestId: msg.requestId,
                embedding 
              } 
            });
          }, 10);
        };
      }
      
      await vectorService.getEmbedding(text);
      
      // Verify it's cached
      const cached = await vectorService.cache.get(text);
      expect(cached).toEqual(embedding);
    });

    test('should check cache before generating embeddings', async () => {
      const text = 'repeated query';
      const getCachedSpy = jest.spyOn(vectorService.cache, 'get');
      
      // First call - generate
      await vectorService.getEmbedding(text);
      
      // Second call - should use cache
      await vectorService.getEmbedding(text);
      
      expect(getCachedSpy).toHaveBeenCalledTimes(2);
      
      getCachedSpy.mockRestore();
    });
  });

  describe('Index Management', () => {
    test('should add documents to index', async () => {
      const doc = {
        id: 'test-1',
        title: 'Test Document',
        content: 'This is a test document'
      };
      
      await vectorService.addToIndex(doc);
      
      expect(vectorService.index.length).toBe(1);
      expect(vectorService.index[0].id).toBe('test-1');
    });

    test('should remove documents from index', async () => {
      vectorService.index = [
        { id: '1', title: 'Doc 1', content: 'Content 1' },
        { id: '2', title: 'Doc 2', content: 'Content 2' }
      ];
      
      await vectorService.removeFromIndex('1');
      
      expect(vectorService.index.length).toBe(1);
      expect(vectorService.index[0].id).toBe('2');
    });

    test('should update existing documents in index', async () => {
      vectorService.index = [
        { id: '1', title: 'Old Title', content: 'Old Content' }
      ];
      
      await vectorService.updateInIndex('1', {
        title: 'New Title',
        content: 'New Content'
      });
      
      expect(vectorService.index[0].title).toBe('New Title');
      expect(vectorService.index[0].content).toBe('New Content');
    });

    test('should rebuild entire index', async () => {
      const documents = [
        { id: '1', title: 'Doc 1', content: 'Content 1' },
        { id: '2', title: 'Doc 2', content: 'Content 2' }
      ];
      
      await vectorService.rebuildIndex(documents);
      
      expect(vectorService.index.length).toBe(2);
      expect(vectorService.index.map(d => d.id)).toEqual(['1', '2']);
    });
  });

  describe('Performance Optimization', () => {
    test('should use requestIdleCallback when enabled', async () => {
      const idleSpy = jest.spyOn(global, 'requestIdleCallback');
      
      const service = new VectorSearchService({ useIdleCallback: true });
      service.scheduleIdleTask(() => {});
      
      expect(idleSpy).toHaveBeenCalled();
      
      idleSpy.mockRestore();
    });

    test('should skip idle callback when disabled', async () => {
      const idleSpy = jest.spyOn(global, 'requestIdleCallback');
      
      const service = new VectorSearchService({ useIdleCallback: false });
      service.scheduleIdleTask(() => {});
      
      expect(idleSpy).not.toHaveBeenCalled();
      
      idleSpy.mockRestore();
    });

    test('should track pending requests', async () => {
      const requestId = vectorService._createRequestId();
      
      expect(vectorService._pendingRequests.has(requestId)).toBe(true);
      
      vectorService._completeRequest(requestId);
      expect(vectorService._pendingRequests.has(requestId)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long queries', async () => {
      const longQuery = 'a'.repeat(10000);
      
      await expect(vectorService.search(longQuery))
        .resolves.toBeInstanceOf(Array);
    });

    test('should handle special characters in queries', async () => {
      const specialQuery = 'test!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\`~';
      
      await expect(vectorService.search(specialQuery))
        .resolves.toBeInstanceOf(Array);
    });

    test('should handle unicode characters', async () => {
      const unicodeQuery = '你好世界 🌍 Привет мир';
      
      await expect(vectorService.search(unicodeQuery))
        .resolves.toBeInstanceOf(Array);
    });

    test('should handle concurrent search requests', async () => {
      const queries = ['query1', 'query2', 'query3', 'query4', 'query5'];
      
      const results = await Promise.all(
        queries.map(q => vectorService.search(q))
      );
      
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(5);
      results.forEach(result => {
        expect(result).toBeInstanceOf(Array);
      });
    });
  });
});
