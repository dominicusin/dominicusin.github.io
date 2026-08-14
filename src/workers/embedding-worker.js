/**
 * Embedding Worker - Web Worker for Vector Embeddings
 * Offloads tokenization and model inference from the main thread.
 *
 * Uses ONNX Runtime Web with adaptive backend selection:
 *   WebGPU -> WebGL -> WASM (graceful degradation).
 *
 * @version 3.0.0-optimized
 * @performance Targets LCP < 1.5s, INP < 100ms on mid-range mobile.
 */

let session = null;
let tokenizer = null;
let isModelLoaded = false;

/** @type {Map<string, {resolve: Function, reject: Function, timer: number}>} */
const pendingRequests = new Map();

/** @type {{backend: string, embeddingSize: number, batchSize: number, maxConcurrentBatches: number}} */
const RUNTIME = {
  backend: 'wasm',
  embeddingSize: 384,
  batchSize: 8,
  maxConcurrentBatches: 2
};

/** Model configuration */
const MODEL_CONFIG = {
  // Quantized model for low-memory devices (<2GB RAM)
  quantized: 'Xenova/all-MiniLM-L6-v2',
  // Full model for powerful devices
  full: 'Xenova/all-MiniLM-L6-v2',
  // Dimensions
  embeddingSize: 384,
  maxLength: 512
};

/** Timeout guards (ms) */
const TIMEOUTS = {
  embeddings: 30000,
  search: 10000
};

/* ------------------------------------------------------------------ *
 * Private: device / backend detection
 * ------------------------------------------------------------------ */

/**
 * Check for WebGPU support.
 * @private
 * @returns {boolean}
 */
function _checkWebGPU() {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

/**
 * Check for WebGL2/WebGL support.
 * @private
 * @returns {boolean}
 */
function _checkWebGL() {
  try {
    const canvas = (typeof OffscreenCanvas !== 'undefined')
      ? new OffscreenCanvas(1, 1)
      : (typeof document !== 'undefined' ? document.createElement('canvas') : null);
    if (!canvas) return false;
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
}

/**
 * Auto-select the best available inference backend.
 * Priority: WebGPU -> WebGL -> WASM.
 * @private
 * @returns {string} One of 'webgpu' | 'webgl' | 'wasm'
 */
function _selectBackend() {
  if (_checkWebGPU()) return 'webgpu';
  if (_checkWebGL()) return 'webgl';
  return 'wasm';
}

/* ------------------------------------------------------------------ *
 * Private: request tracking + timeout guards
 * ------------------------------------------------------------------ */

/**
 * Register a pending request with a timeout guard.
 * @private
 * @param {string} requestId
 * @param {number} timeoutMs
 * @returns {Promise<any>} Resolves/rejects via the stored handlers.
 */
function _trackRequest(requestId, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error(`Request ${requestId} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    pendingRequests.set(requestId, { resolve, reject, timer });
  });
}

/**
 * Resolve a tracked request and clear its timer.
 * @private
 * @param {string} requestId
 * @param {*} payload
 */
function _resolveRequest(requestId, payload) {
  const req = pendingRequests.get(requestId);
  if (req) {
    clearTimeout(req.timer);
    pendingRequests.delete(requestId);
    req.resolve(payload);
  }
}

/**
 * Reject a tracked request and clear its timer.
 * @private
 * @param {string} requestId
 * @param {Error} error
 */
function _rejectRequest(requestId, error) {
  const req = pendingRequests.get(requestId);
  if (req) {
    clearTimeout(req.timer);
    pendingRequests.delete(requestId);
    req.reject(error);
  }
}

/**
 * Wrap a promise with a timeout guard.
 * @private
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} label
 * @returns {Promise<T>}
 */
function _withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

/* ------------------------------------------------------------------ *
 * Metrics
 * ------------------------------------------------------------------ */

/**
 * Emit a performance metric (uses performance.now when available).
 * @private
 * @param {string} operation
 * @param {number} startMs
 */
function _emitMetric(operation, startMs) {
  const now = (typeof performance !== 'undefined' && performance.now)
    ? performance.now()
    : Date.now();
  const elapsed = Math.round(now - startMs);
  self.postMessage({ type: 'PERF_METRIC', payload: { operation, elapsedMs: elapsed } });
}

/* ------------------------------------------------------------------ *
 * Model loading
 * ------------------------------------------------------------------ */

/**
 * Load the embedding model with device-specific optimizations.
 * @param {Object} [options]
 * @param {boolean} [options.useQuantized]
 * @param {boolean} [options.useWebGL]
 * @returns {Promise<{success: boolean, backend?: string, error?: string}>}
 */
async function loadModel(options = {}) {
  const startMs = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  const { useQuantized = false, useWebGL = true } = options;

  if (isModelLoaded && session) {
    return { success: true, message: 'Model already loaded', backend: RUNTIME.backend };
  }

  try {
    // Dynamic import of ONNX Runtime Web
    const { env, InferenceSession } = await import('onnxruntime-web');

    // Configure environment
    env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.16.0/dist/';

    // Adaptive backend selection (WebGPU -> WebGL -> WASM)
    const selected = useWebGL ? _selectBackend() : 'wasm';
    RUNTIME.backend = selected;
    RUNTIME.embeddingSize = RUNTIME.embeddingSize; // keep metadata in sync

    if (selected === 'webgl' || selected === 'webgpu') {
      try {
        env.backends.onnx.webgl.contextAttributes = { alpha: false };
      } catch (e) { /* backend-specific config may not exist */ }
    }

    // Load tokenizer (simplified - in production use @xenova/transformers)
    tokenizer = await loadTokenizer(MODEL_CONFIG.quantized);

    // Load model session
    const modelPath = useQuantized
      ? `https://huggingface.co/${MODEL_CONFIG.quantized}/resolve/main/model_quantized.onnx`
      : `https://huggingface.co/${MODEL_CONFIG.full}/resolve/main/model.onnx`;

    const executionProviders = selected === 'wasm'
      ? ['wasm']
      : [selected, 'wasm']; // prefer best, fall back to wasm

    session = await InferenceSession.create(modelPath, {
      executionProviders,
      graphOptimizationLevel: 'all'
    });

    isModelLoaded = true;
    _emitMetric('loadModel', startMs);

    self.postMessage({
      type: 'MODEL_LOADED',
      payload: {
        modelName: useQuantized ? MODEL_CONFIG.quantized : MODEL_CONFIG.full,
        backend: selected,
        embeddingSize: MODEL_CONFIG.embeddingSize
      }
    });

    return { success: true, backend: selected };
  } catch (error) {
    console.error('Failed to load model:', error);
    // Recovery: reset state so a later attempt can retry
    session = null;
    tokenizer = null;
    isModelLoaded = false;
    self.postMessage({
      type: 'MODEL_ERROR',
      payload: { error: error.message, backend: RUNTIME.backend }
    });
    return { success: false, error: error.message };
  }
}

/* ------------------------------------------------------------------ *
 * Embedding generation
 * ------------------------------------------------------------------ */

/**
 * Generate embeddings for input text(s).
 * @param {string|string[]} input - Text or array of texts to embed
 * @param {Object} [opts]
 * @param {string} [opts.requestId]
 * @returns {Promise<number[][]>}
 */
async function generateEmbeddings(input, _opts = {}) {
  const startMs = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  if (!session || !tokenizer) {
    throw new Error('Model not loaded. Call loadModel() first.');
  }

  const inputs = Array.isArray(input) ? input : [input];
  const embeddings = [];

  const batchSize = RUNTIME.batchSize;
  for (let i = 0; i < inputs.length; i += batchSize) {
    const batch = inputs.slice(i, i + batchSize);
    const batchEmbeddings = await processBatch(batch);
    embeddings.push(...batchEmbeddings);

    if (i + batchSize < inputs.length) {
      // Yield to avoid blocking the worker event loop
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  _emitMetric('generateEmbeddings', startMs);
  return embeddings;
}

/**
 * Process a batch of texts into embeddings.
 * @private
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
async function processBatch(texts) {
  const embeddings = [];

  for (const text of texts) {
    const tokens = tokenizer.encode(text, {
      truncation: true,
      maxLength: MODEL_CONFIG.maxLength
    });

    const inputIds = new Int64Array(tokens.input_ids);
    const attentionMask = new Int64Array(tokens.attention_mask);
    const tokenTypeIds = new Int64Array(tokens.token_type_ids || tokens.input_ids.map(() => 0));

    const inputIdsTensor = new Tensor('int64', inputIds, [1, tokens.input_ids.length]);
    const attentionMaskTensor = new Tensor('int64', attentionMask, [1, tokens.attention_mask.length]);
    const tokenTypeIdsTensor = new Tensor('int64', tokenTypeIds, [1, tokenTypeIds.length]);

    const results = await session.run({
      input_ids: inputIdsTensor,
      attention_mask: attentionMaskTensor,
      token_type_ids: tokenTypeIdsTensor
    });

    const outputData = results.last_hidden_state.data;
    const embedding = meanPooling(outputData, attentionMask, tokens.input_ids.length);
    const normalized = normalizeVector(embedding);

    embeddings.push(normalized);

    self.postMessage({
      type: 'EMBEDDING_PROGRESS',
      payload: { processed: embeddings.length, total: texts.length }
    });
  }

  return embeddings;
}

/**
 * Mean pooling over attention mask.
 * @private
 */
function meanPooling(outputData, attentionMask, sequenceLength) {
  const embeddingSize = MODEL_CONFIG.embeddingSize;
  const embedding = new Float32Array(embeddingSize);
  let count = 0;

  for (let i = 0; i < sequenceLength; i++) {
    if (attentionMask[i] === 0n || attentionMask[i] === 0) continue;
    for (let j = 0; j < embeddingSize; j++) {
      embedding[j] += Number(outputData[i * embeddingSize + j]);
    }
    count++;
  }

  if (count > 0) {
    for (let j = 0; j < embeddingSize; j++) {
      embedding[j] /= count;
    }
  }

  return Array.from(embedding);
}

/**
 * L2 normalize a vector.
 * @private
 */
function normalizeVector(vector) {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector;
  return vector.map((val) => val / magnitude);
}

/* ------------------------------------------------------------------ *
 * Similarity
 * ------------------------------------------------------------------ */

/**
 * Calculate cosine similarity between two vectors.
 * @param {number[]} vec1
 * @param {number[]} vec2
 * @returns {number}
 */
function cosineSimilarity(vec1, vec2) {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have same dimension');
  }
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }
  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Find most similar vectors from an index (synchronous core).
 * @private
 * @param {number[]} queryEmbedding
 * @param {Array<{id:string, embedding:number[], metadata?:Object}>} index
 * @param {number} [topK=10]
 * @returns {Array<{id:string, score:number, metadata:Object}>}
 */
function findSimilar(queryEmbedding, index, topK = 10) {
  const scores = index.map((item) => ({
    id: item.id,
    score: cosineSimilarity(queryEmbedding, item.embedding),
    metadata: item.metadata
  }));
  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, topK);
}

/**
 * Async wrapper around findSimilar with a timeout guard.
 * @private
 * @param {number[]} queryEmbedding
 * @param {Array} index
 * @param {number} topK
 * @returns {Promise<Array>}
 */
async function _findSimilarAsync(queryEmbedding, index, topK) {
  return _withTimeout(
    Promise.resolve().then(() => findSimilar(queryEmbedding, index, topK)),
    TIMEOUTS.search,
    'findSimilar'
  );
}

/**
 * Hybrid reranking: blend vector + keyword scores with order preservation.
 * @private
 * @param {Array} vectorResults
 * @param {Array} keywordResults
 * @param {number} [limit=10]
 * @returns {Array}
 */
function _rerankHybrid(vectorResults, keywordResults, limit = 10) {
  const combined = new Map();
  vectorResults.forEach((item) => {
    combined.set(item.id, { ...item, hybridScore: item.score * 0.7, vectorRank: Number.MAX_SAFE_INTEGER });
  });
  keywordResults.forEach((item) => {
    if (combined.has(item.id)) {
      combined.get(item.id).hybridScore += item.score * 0.3;
    } else {
      combined.set(item.id, { ...item, hybridScore: item.score * 0.3, vectorRank: Number.MAX_SAFE_INTEGER });
    }
  });
  return Array.from(combined.values())
    .sort((a, b) => b.hybridScore - a.hybridScore)
    .slice(0, limit);
}

/* ------------------------------------------------------------------ *
 * Simple tokenizer (placeholder - use @xenova/transformers in production)
 * ------------------------------------------------------------------ */

/**
 * Load a (simplified) tokenizer.
 * @private
 * @param {string} _modelName
 */
async function loadTokenizer(_modelName) {
  return {
    encode: (text, options = {}) => {
      const words = text.toLowerCase().split(/\s+/).slice(0, options.maxLength || 512);
      const inputIds = [101, ...words.map((w) => w.charCodeAt(0) % 1000), 102];
      const attentionMask = inputIds.map(() => 1);
      const tokenTypeIds = inputIds.map(() => 0);
      const maxLength = options.maxLength || 512;
      while (inputIds.length < maxLength) {
        inputIds.push(0);
        attentionMask.push(0);
        tokenTypeIds.push(0);
      }
      return { input_ids: inputIds, attention_mask: attentionMask, token_type_ids: tokenTypeIds };
    }
  };
}

/* ------------------------------------------------------------------ *
 * Message handler (Promise-based, request tracked)
 * ------------------------------------------------------------------ */

self.onmessage = async (event) => {
  const { type, payload = {} } = event.data;
  const requestId = payload.requestId || `${type}:${Date.now()}`;

  try {
    switch (type) {
      case 'INIT_MODEL': {
        const result = await loadModel(payload);
        self.postMessage({ type: 'MODEL_LOADED_ACK', payload: { ...result, requestId } });
        break;
      }

      case 'GENERATE_EMBEDDINGS': {
        _trackRequest(requestId, TIMEOUTS.embeddings);
        try {
          const embeddings = await generateEmbeddings(payload.texts, { requestId });
          _resolveRequest(requestId, embeddings);
          self.postMessage({
            type: 'EMBEDDINGS_RESULT',
            payload: { embeddings, count: embeddings.length, requestId }
          });
        } catch (e) {
          _rejectRequest(requestId, e);
          throw e;
        }
        break;
      }

      case 'FIND_SIMILAR': {
        const { query, index, topK, queryEmbedding } = payload;
        const qEmbed = queryEmbedding || (await generateEmbeddings([query]))[0];
        const results = await _findSimilarAsync(qEmbed, index, topK);
        self.postMessage({
          type: 'SIMILARITY_RESULT',
          payload: { results, requestId }
        });
        break;
      }

      case 'CALCULATE_SIMILARITY': {
        const { vec1, vec2 } = payload;
        const similarity = cosineSimilarity(vec1, vec2);
        self.postMessage({
          type: 'SIMILARITY_RESULT',
          payload: { similarity, requestId }
        });
        break;
      }

      case 'RERANK_HYBRID': {
        const { vectorResults, keywordResults, limit } = payload;
        const reranked = _rerankHybrid(vectorResults || [], keywordResults || [], limit || 10);
        self.postMessage({
          type: 'RERANK_RESULT',
          payload: { results: reranked, requestId }
        });
        break;
      }

      default:
        console.warn(`Unknown message type: ${type}`);
        self.postMessage({ type: 'ERROR', payload: { error: `Unknown type: ${type}`, requestId } });
    }
  } catch (error) {
    // Recovery: report the failure with the request id for upstream retry
    self.postMessage({
      type: 'ERROR',
      payload: { error: error.message, originalType: type, requestId }
    });
  }
};

// Notify worker is ready
self.postMessage({ type: 'WORKER_READY' });
