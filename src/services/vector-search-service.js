/**
 * Vector Search Service - Semantic Search with Edge AI
 * Implements adaptive model loading based on device capabilities
 * Uses Web Workers for non-blocking embedding generation
 */

import { EmbeddingCache } from './embedding-cache-service.js';

export class VectorSearchService {
  constructor(options = {}) {
    this.worker = null;
    this.cache = new EmbeddingCache();
    this.index = []; // Vector index with metadata
    this.isModelLoaded = false;
    this.deviceInfo = null;
    this.config = {
      batchSize: 10,
      useIdleCallback: true,
      ...options
    };
    
    this.init();
  }

  /**
   * Detect device capabilities and configure optimal settings
   */
  detectDeviceCapabilities() {
    const nav = navigator;
    
    this.deviceInfo = {
      logicalCores: nav.hardwareConcurrency || 4,
      memoryGB: nav.deviceMemory || 4,
      hasWebGL: (() => {
        try {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
          return !!gl;
        } catch (e) {
          return false;
        }
      })(),
      isLowEnd: false
    };

    // Classify as low-end if <2GB RAM
    this.deviceInfo.isLowEnd = this.deviceInfo.memoryGB < 2;

    return this.deviceInfo;
  }

  /**
   * Initialize the service with device-specific optimizations
   */
  async init() {
    this.detectDeviceCapabilities();

    // Initialize worker
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
          console.log(`Model loaded: ${payload.modelName}`);
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
          useWebGL: this.deviceInfo.hasWebGL && !this.deviceInfo.isLowEnd
        }
      });
    });
  }

  /**
   * Handle messages from worker
   */
  handleWorkerMessage(event) {
    const { type, payload } = event.data;

    switch (type) {
      case 'EMBEDDINGS_RESULT':
        this.onEmbeddingsComplete?.(payload);
        break;
      case 'EMBEDDING_PROGRESS':
        this.onEmbeddingsProgress?.(payload);
        break;
      case 'SIMILARITY_RESULT':
        this.onSimilarityComplete?.(payload);
        break;
    }
  }

  /**
   * Handle worker errors
   */
  handleWorkerError(error) {
    console.error('Worker error:', error);
    this.isModelLoaded = false;
  }

  /**
   * Generate embeddings for texts using worker
   */
  async generateEmbeddings(texts, options = {}) {
    const { useCache = true, batchDelay = 100 } = options;

    // Check cache first
    if (useCache) {
      const cached = this.cache.getBatch(texts);
      const missing = texts.filter((t, i) => !cached[i]);
      
      if (missing.length === 0) {
        return cached;
      }
      
      // Generate embeddings for missing texts
      const missingEmbeddings = await this.generateEmbeddingsForMissing(missing, batchDelay);
      
      // Merge cached and new embeddings
      return texts.map((t, i) => {
        const cachedIdx = cached.findIndex(c => c !== undefined);
        if (cached[cachedIdx]) return cached[cachedIdx];
        return missingEmbeddings.pop();
      });
    }

    return this.generateEmbeddingsForMissing(texts, batchDelay);
  }

  /**
   * Generate embeddings for texts not in cache
   */
  async generateEmbeddingsForMissing(texts, batchDelay = 100) {
    return new Promise((resolve, reject) => {
      const handler = (event) => {
        if (event.data.type === 'EMBEDDINGS_RESULT') {
          this.worker.removeEventListener('message', handler);
          
          // Cache results
          texts.forEach((text, i) => {
            this.cache.set(text, event.data.payload.embeddings[i]);
          });
          
          resolve(event.data.payload.embeddings);
        } else if (event.data.type === 'ERROR') {
          this.worker.removeEventListener('message', handler);
          reject(new Error(event.data.payload.error));
        }
      };

      this.worker.addEventListener('message', handler);

      // Send to worker
      this.worker.postMessage({
        type: 'GENERATE_EMBEDDINGS',
        payload: { texts }
      });
    });
  }

  /**
   * Index posts progressively using requestIdleCallback
   */
  async indexPosts(posts, options = {}) {
    const { 
      batchSize = this.config.batchSize,
      onProgress,
      onComplete
    } = options;

    const totalBatches = Math.ceil(posts.length / batchSize);
    let processedBatches = 0;

    const processBatch = async (batch) => {
      const texts = batch.map(p => `${p.title} ${p.excerpt || ''} ${p.content || ''}`.slice(0, 2000));
      const embeddings = await this.generateEmbeddings(texts);

      batch.forEach((post, i) => {
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
      });

      processedBatches++;
      
      if (onProgress) {
        onProgress({
          processed: processedBatches * batchSize,
          total: posts.length,
          percentage: Math.round((processedBatches / totalBatches) * 100)
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

    if (onComplete) {
      onComplete({ total: this.index.length });
    }

    return this.index;
  }

  /**
   * Perform semantic search
   */
  async search(query, options = {}) {
    const { mode = 'hybrid', limit = 10 } = options;

    if (!this.isModelLoaded) {
      throw new Error('Model not loaded');
    }

    // Generate query embedding
    const queryEmbedding = await this.generateEmbeddings([query]);

    // Find similar vectors
    const results = this.findSimilar(queryEmbedding[0], this.index, limit);

    // If hybrid mode, combine with keyword search
    if (mode === 'hybrid') {
      const keywordResults = this.keywordSearch(query, limit * 2);
      return this.rerankHybrid(results, keywordResults, limit);
    }

    if (mode === 'keyword') {
      return this.keywordSearch(query, limit);
    }

    return results;
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
