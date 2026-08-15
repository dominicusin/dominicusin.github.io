/**
 * Vector Search Service - Semantic Search with Edge AI
 * Implements adaptive model loading based on device capabilities
 * Uses Web Workers for non-blocking embedding generation
 * 
 * @version 3.0.0-optimized
 * @performance LCP < 1.5s, INP < 100ms
 */

import { EmbeddingCache } from './embedding-cache-service.js';

export class VectorSearchService {
  constructor(options = {}) {
    this.worker = null;
    this.cache = new EmbeddingCache(options.cache || {});
    this.index = [];
    this.isModelLoaded = false;
    this.deviceInfo = null;
    this.config = {
      batchSize: options.batchSize || 8,
      useIdleCallback: true,
      maxConcurrentBatches: 2,
      ...options
    };
    
    this._pendingRequests = new Map();
    this._requestIdCounter = 0;
    
    this.init();
  }

  /**
   * Detect device capabilities and configure optimal settings
   * @returns {Object} Device capability info
   */
  detectDeviceCapabilities() {
    const nav = navigator;
    
    this.deviceInfo = {
      logicalCores: nav.hardwareConcurrency || 4,
      memoryGB: nav.deviceMemory || 4,
      hasWebGL: this._checkWebGL(),
      hasWebGPU: this._checkWebGPU(),
      isLowEnd: false,
      isMobile: /Mobile|Android/i.test(nav.userAgent)
    };

    this.deviceInfo.isLowEnd = this.deviceInfo.memoryGB < 2;
    this.deviceInfo.preferredBackend = this._selectBackend();

    return this.deviceInfo;
  }

  /**
   * Check WebGL support
   * @private
   */
  _checkWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch {
      return false;
    }
  }

  /**
   * Check WebGPU support (next-gen acceleration)
   * @private
   */
  _checkWebGPU() {
    return !!navigator.gpu;
  }

  /**
   * Select optimal inference backend
   * @private
   */
  _selectBackend() {
    if (this.deviceInfo.hasWebGPU && !this.deviceInfo.isLowEnd) {
      return 'webgpu';
    }
    if (this.deviceInfo.hasWebGL && !this.deviceInfo.isLowEnd) {
      return 'webgl';
    }
    return 'wasm';
  }

  /**
   * Initialize the service with device-specific optimizations
   */
  async init() {
    this.detectDeviceCapabilities();

    // Initialize worker with optimal configuration
    this.worker = new Worker(
      new URL('../workers/embedding-worker.js', import.meta.url),
      { type: 'module' }
    );

    // Setup worker message handlers
    this.worker.onmessage = (event) => this.handleWorkerMessage(event);
    this.worker.onerror = (error) => this.handleWorkerError(error);

    // Load model with appropriate settings
    await this.loadModel();
  }

  /**
   * Load embedding model based on device capabilities
   * @returns {Promise<boolean>} Model load status
   */
  async loadModel() {
    if (this.isModelLoaded) return true;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Model loading timeout'));
      }, 60000);

      const messageHandler = (event) => {
        const { type, payload } = event.data;

        if (type === 'MODEL_LOADED') {
          clearTimeout(timeoutId);
          this.isModelLoaded = true;
          this.worker.removeEventListener('message', messageHandler);
          console.log(`[VectorSearch] Model loaded: ${payload.modelName} (${payload.backend})`);
          resolve(true);
        } else if (type === 'MODEL_ERROR') {
          clearTimeout(timeoutId);
          this.worker.removeEventListener('message', messageHandler);
          reject(new Error(payload.error));
        }
      };

      this.worker.addEventListener('message', messageHandler);

      // Request model load with device-appropriate settings
      this.worker.postMessage({
        type: 'INIT_MODEL',
        payload: {
          useQuantized: this.deviceInfo.isLowEnd,
          backend: this.deviceInfo.preferredBackend,
          maxThreads: Math.max(2, this.deviceInfo.logicalCores - 1)
        }
      });
    });
  }

  /**
   * Handle messages from worker with request tracking
   */
  handleWorkerMessage(event) {
    const { type, payload, requestId } = event.data;

    switch (type) {
      case 'EMBEDDINGS_RESULT':
        this._resolveRequest(requestId, payload);
        this.onEmbeddingsComplete?.(payload);
        break;
      case 'EMBEDDING_PROGRESS':
        this.onEmbeddingsProgress?.(payload);
        break;
      case 'SIMILARITY_RESULT':
        this._resolveRequest(requestId, payload);
        this.onSimilarityComplete?.(payload);
        break;
      case 'ERROR':
        this._rejectRequest(requestId, new Error(payload.error));
        break;
    }
  }

  /**
   * Handle worker errors with recovery
   */
  handleWorkerError(error) {
    console.error('[VectorSearch] Worker error:', error);
    this.isModelLoaded = false;
    
    // Attempt recovery: reject all pending requests
    for (const [requestId, { reject }] of this._pendingRequests.entries()) {
      reject(new Error(`Worker failed: ${error.message}`));
      this._pendingRequests.delete(requestId);
    }
  }

  /**
   * Generate embeddings for texts using worker with caching
   * @param {string[]} texts - Texts to embed
   * @param {Object} options - Options
   * @returns {Promise<number[][]>} Embedding vectors
   */
  async generateEmbeddings(texts, options = {}) {
    const { useCache = true, priority = 'normal' } = options;
    const startTime = performance.now();

    // Check cache first
    if (useCache) {
      const cached = this.cache.getBatch(texts);
      const missing = [];
      const missingIndices = [];
      
      texts.forEach((text, i) => {
        if (!cached[i]) {
          missing.push(text);
          missingIndices.push(i);
        }
      });
      
      if (missing.length === 0) {
        const duration = performance.now() - startTime;
        console.log(`[VectorSearch] Cache hit (${texts.length}/${texts.length}) in ${duration.toFixed(2)}ms`);
        return cached;
      }
      
      // Generate embeddings for missing texts
      const missingEmbeddings = await this._generateEmbeddingsInternal(missing, priority);
      
      // Merge cached and new embeddings maintaining order
      const result = [...cached];
      missingIndices.forEach((idx, i) => {
        result[idx] = missingEmbeddings[i];
      });
      
      const duration = performance.now() - startTime;
      console.log(`[VectorSearch] Partial cache hit (${texts.length - missing.length}/${texts.length}) in ${duration.toFixed(2)}ms`);
      return result;
    }

    const result = await this._generateEmbeddingsInternal(texts, priority);
    const duration = performance.now() - startTime;
    console.log(`[VectorSearch] Generated ${texts.length} embeddings in ${duration.toFixed(2)}ms`);
    return result;
  }

  /**
   * Internal method to generate embeddings via worker
   * @private
   */
  _generateEmbeddingsInternal(texts, priority = 'normal') {
    return new Promise((resolve, reject) => {
      const requestId = ++this._requestIdCounter;
      
      // Store promise handlers
      this._pendingRequests.set(requestId, { resolve, reject, priority });
      
      // Send to worker
      this.worker.postMessage({
        type: 'GENERATE_EMBEDDINGS',
        requestId,
        payload: { 
          texts,
          priority,
          batchSize: this.config.batchSize
        }
      }, { timeout: 30000 });
      
      // Set timeout for safety
      setTimeout(() => {
        if (this._pendingRequests.has(requestId)) {
          this._pendingRequests.delete(requestId);
          reject(new Error('Embedding generation timeout'));
        }
      }, 30000);
    });
  }

  /**
   * Resolve a pending request
   * @private
   */
  _resolveRequest(requestId, payload) {
    const request = this._pendingRequests.get(requestId);
    if (request) {
      request.resolve(payload);
      this._pendingRequests.delete(requestId);
    }
  }

  /**
   * Reject a pending request
   * @private
   */
  _rejectRequest(requestId, error) {
    const request = this._pendingRequests.get(requestId);
    if (request) {
      request.reject(error);
      this._pendingRequests.delete(requestId);
    }
  }

  /**
   * Index posts progressively using requestIdleCallback
   * @param {Array} posts - Posts to index
   * @param {Object} options - Indexing options
   * @returns {Promise<Array>} Indexed items
   */
  async indexPosts(posts, options = {}) {
    const { 
      batchSize = this.config.batchSize,
      onProgress,
      onComplete
    } = options;

    const totalBatches = Math.ceil(posts.length / batchSize);
    let processedBatches = 0;
    const startTime = performance.now();

    const processBatch = async (batch) => {
      const texts = batch.map(p => 
        `${p.title} ${p.excerpt || ''} ${p.content || ''}`.slice(0, 2000)
      );
      const embeddings = await this.generateEmbeddings(texts, { useCache: true });

      batch.forEach((post, i) => {
        if (embeddings[i]) {
          this.index.push({
            id: post.id || post.url,
            embedding: embeddings[i],
            metadata: {
              title: post.title,
              url: post.url,
              date: post.date,
              category: post.category,
              tags: post.tags
            }
          });
        }
      });

      processedBatches++;
      
      if (onProgress) {
        onProgress({
          processed: processedBatches * batchSize,
          total: posts.length,
          percentage: Math.round((processedBatches / totalBatches) * 100),
          elapsedMs: performance.now() - startTime
        });
      }
    };

    // Process batches using requestIdleCallback if available
    if (this.config.useIdleCallback && typeof requestIdleCallback !== 'undefined') {
      for (let i = 0; i < posts.length; i += batchSize) {
        const batch = posts.slice(i, i + batchSize);
        
        await new Promise(resolve => {
          requestIdleCallback(() => {
            processBatch(batch).then(resolve);
          }, { timeout: 2000 });
        });
      }
    } else {
      // Fallback: process sequentially with delay
      for (let i = 0; i < posts.length; i += batchSize) {
        const batch = posts.slice(i, i + batchSize);
        await processBatch(batch);
        if (i + batchSize < posts.length) {
          await new Promise(r => setTimeout(r, 50));
        }
      }
    }

    const totalTime = performance.now() - startTime;
    console.log(`[VectorSearch] Indexed ${this.index.length} vectors in ${totalTime.toFixed(2)}ms`);

    if (onComplete) {
      onComplete({ 
        total: this.index.length,
        elapsedMs: totalTime,
        avgPerPost: totalTime / posts.length
      });
    }

    return this.index;
  }

  /**
   * Perform semantic search with hybrid mode support
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  async search(query, options = {}) {
    const { mode = 'hybrid', limit = 10 } = options;
    const startTime = performance.now();

    if (!this.isModelLoaded) {
      throw new Error('Model not loaded');
    }

    // Generate query embedding
    const queryEmbedding = await this.generateEmbeddings([query], { priority: 'high' });

    // Find similar vectors
    const vectorResults = await this._findSimilarAsync(queryEmbedding[0], this.index, limit);

    let results;
    // If hybrid mode, combine with keyword search
    if (mode === 'hybrid') {
      const keywordResults = this.keywordSearch(query, limit * 2);
      results = this.rerankHybrid(vectorResults, keywordResults, limit);
    } else if (mode === 'keyword') {
      results = this.keywordSearch(query, limit);
    } else {
      results = vectorResults;
    }

    const duration = performance.now() - startTime;
    console.log(`[VectorSearch] Search "${query}" (${mode}) found ${results.length} results in ${duration.toFixed(2)}ms`);
    
    return results;
  }

  /**
   * Async wrapper for findSimilar
   * @private
   */
  _findSimilarAsync(queryEmbedding, index, topK = 10) {
    return new Promise((resolve, reject) => {
      const requestId = ++this._requestIdCounter;
      
      this._pendingRequests.set(requestId, { resolve, reject });
      
      this.worker.postMessage({
        type: 'FIND_SIMILAR',
        requestId,
        payload: {
          index,
          topK,
          queryEmbedding
        }
      });
      
      // Timeout safety
      setTimeout(() => {
        if (this._pendingRequests.has(requestId)) {
          this._pendingRequests.delete(requestId);
          reject(new Error('Similarity search timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Find similar vectors using cosine similarity
   */
  findSimilar(queryEmbedding, index, topK = 10) {
    return new Promise((resolve) => {
      const handler = (event) => {
        if (event.data.type === 'SIMILARITY_RESULT') {
          this.worker.removeEventListener('message', handler);
          resolve(event.data.payload.results);
        }
      };

      this.worker.addEventListener('message', handler);

      this.worker.postMessage({
        type: 'FIND_SIMILAR',
        payload: {
          query: '', // Not used when passing index directly
          index,
          topK,
          queryEmbedding // Pass pre-computed embedding
        }
      });
    });
  }

  /**
   * Traditional keyword search (fallback/complement)
   */
  keywordSearch(query, limit = 10) {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    
    const scored = this.index.map(item => {
      const text = `${item.metadata.title} ${item.metadata.category || ''}`.toLowerCase();
      let score = 0;
      
      queryTerms.forEach(term => {
        if (text.includes(term)) {
          score += 1;
        }
      });
      
      return { ...item, score: score / queryTerms.length };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Rerank hybrid results (vector + keyword)
   */
  rerankHybrid(vectorResults, keywordResults, limit = 10) {
    const combined = new Map();

    // Add vector results with weight 0.7
    vectorResults.forEach((item, idx) => {
      combined.set(item.id, {
        ...item,
        hybridScore: item.score * 0.7,
        rank: idx
      });
    });

    // Add keyword results with weight 0.3
    keywordResults.forEach((item, idx) => {
      if (combined.has(item.id)) {
        const existing = combined.get(item.id);
        existing.hybridScore += item.score * 0.3;
      } else {
        combined.set(item.id, {
          ...item,
          hybridScore: item.score * 0.3,
          rank: idx
        });
      }
    });

    // Sort by hybrid score
    return Array.from(combined.values())
      .sort((a, b) => b.hybridScore - a.hybridScore)
      .slice(0, limit);
  }

  /**
   * Get index statistics
   */
  getIndexStats() {
    return {
      totalVectors: this.index.length,
      cacheSize: this.cache.size,
      isModelLoaded: this.isModelLoaded,
      deviceInfo: this.deviceInfo
    };
  }

  /**
   * Clear the index
   */
  clearIndex() {
    this.index = [];
    this.cache.clear();
  }

  /**
   * Destroy the service and cleanup resources
   */
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.cache.clear();
    this.index = [];
    this.isModelLoaded = false;
  }
}

// Export singleton instance
if (typeof window !== 'undefined') {
  window.vectorSearchService = new VectorSearchService();
}

export default VectorSearchService;
