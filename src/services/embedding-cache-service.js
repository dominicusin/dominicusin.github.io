/**
 * Embedding Cache Service - LRU Cache for Vector Embeddings
 * Stores computed embeddings to avoid redundant model inference
 */

export class EmbeddingCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl || 3600000; // 1 hour default
    this.cache = new Map();
    this.accessOrder = [];
  }

  /**
   * Generate cache key from text
   */
  generateKey(text) {
    return this.simpleHash(text.trim().toLowerCase());
  }

  /**
   * Simple hash function for strings
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  /**
   * Get embedding from cache
   */
  get(key) {
    const cacheKey = typeof key === 'string' ? this.generateKey(key) : key;
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return undefined;
    }

    // Check TTL
    if (Date.now() > entry.expiry) {
      this.cache.delete(cacheKey);
      this.removeAccessOrder(cacheKey);
      return undefined;
    }

    // Update access order (LRU)
    this.updateAccessOrder(cacheKey);
    return entry.embedding;
  }

  /**
   * Get multiple embeddings from cache
   */
  getBatch(keys) {
    return keys.map(key => this.get(key));
  }

  /**
   * Set embedding in cache
   */
  set(key, embedding) {
    const cacheKey = typeof key === 'string' ? this.generateKey(key) : key;

    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(cacheKey)) {
      this.evictOldest();
    }

    this.cache.set(cacheKey, {
      embedding,
      timestamp: Date.now(),
      expiry: Date.now() + this.ttl
    });

    this.updateAccessOrder(cacheKey);
  }

  /**
   * Set multiple embeddings in cache
   */
  setBatch(entries) {
    entries.forEach(({ key, embedding }) => {
      this.set(key, embedding);
    });
  }

  /**
   * Check if key exists in cache
   */
  has(key) {
    const cacheKey = typeof key === 'string' ? this.generateKey(key) : key;
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(cacheKey);
      this.removeAccessOrder(cacheKey);
      return false;
    }

    return true;
  }

  /**
   * Delete entry from cache
   */
  delete(key) {
    const cacheKey = typeof key === 'string' ? this.generateKey(key) : key;
    const deleted = this.cache.delete(cacheKey);
    if (deleted) {
      this.removeAccessOrder(cacheKey);
    }
    return deleted;
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache size
   */
  get size() {
    return this.cache.size;
  }

  /**
   * Evict oldest (least recently used) entry
   */
  evictOldest() {
    if (this.accessOrder.length === 0) return;

    const oldestKey = this.accessOrder.shift();
    this.cache.delete(oldestKey);
  }

  /**
   * Update access order for LRU
   */
  updateAccessOrder(key) {
    // Remove existing
    const idx = this.accessOrder.indexOf(key);
    if (idx > -1) {
      this.accessOrder.splice(idx, 1);
    }
    
    // Add to end (most recently used)
    this.accessOrder.push(key);
  }

  /**
   * Remove key from access order
   */
  removeAccessOrder(key) {
    const idx = this.accessOrder.indexOf(key);
    if (idx > -1) {
      this.accessOrder.splice(idx, 1);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    
    this.cache.forEach((entry, key) => {
      if (now > entry.expiry) {
        expired++;
      }
    });

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expired,
      active: this.cache.size - expired,
      utilization: (this.cache.size / this.maxSize * 100).toFixed(2) + '%'
    };
  }

  /**
   * Clean expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    this.cache.forEach((entry, key) => {
      if (now > entry.expiry) {
        this.cache.delete(key);
        this.removeAccessOrder(key);
        cleaned++;
      }
    });

    return cleaned;
  }

  /**
   * Export cache to serializable format
   */
  export() {
    const data = [];
    this.cache.forEach((entry, key) => {
      data.push({
        key,
        embedding: entry.embedding,
        timestamp: entry.timestamp
      });
    });
    return data;
  }

  /**
   * Import cache from serialized format
   */
  import(data) {
    this.clear();
    
    const now = Date.now();
    data.forEach(item => {
      // Only import non-expired entries
      if (now < item.timestamp + this.ttl) {
        this.cache.set(item.key, {
          embedding: item.embedding,
          timestamp: item.timestamp,
          expiry: item.timestamp + this.ttl
        });
        this.updateAccessOrder(item.key);
      }
    });

    return this.cache.size;
  }
}

// Export singleton instance
if (typeof window !== 'undefined') {
  window.embeddingCache = new EmbeddingCache();
}

export default EmbeddingCache;
