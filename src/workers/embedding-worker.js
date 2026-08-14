/**
 * Embedding Worker - Web Worker for Vector Embeddings
 * Offloads tokenization and model inference from main thread
 * Uses ONNX Runtime Web with optional WebGL acceleration
 */

let session = null;
let tokenizer = null;
let isModelLoaded = false;

// Model configuration
const MODEL_CONFIG = {
  // Quantized model for low-memory devices (<2GB RAM)
  quantized: 'Xenova/all-MiniLM-L6-v2',
  // Full model for powerful devices
  full: 'Xenova/all-MiniLM-L6-v2',
  // Dimensions
  embeddingSize: 384,
  maxLength: 512
};

/**
 * Load the embedding model with device-specific optimizations
 */
async function loadModel(options = {}) {
  const { useQuantized = false, useWebGL = true } = options;

  if (isModelLoaded && session) {
    return { success: true, message: 'Model already loaded' };
  }

  try {
    // Dynamic import of ONNX Runtime Web
    const { env, InferenceSession, Tensor } = await import('onnxruntime-web');

    // Configure environment
    env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.16.0/dist/';
    
    if (useWebGL && typeof WebGL2RenderingContext !== 'undefined') {
      env.backends.onnx.webgl.contextAttributes = { alpha: false };
    }

    // Load tokenizer (simplified - in production use @xenova/transformers)
    tokenizer = await loadTokenizer(MODEL_CONFIG.quantized);

    // Load model session
    const modelPath = useQuantized 
      ? `https://huggingface.co/${MODEL_CONFIG.quantized}/resolve/main/model_quantized.onnx`
      : `https://huggingface.co/${MODEL_CONFIG.full}/resolve/main/model.onnx`;

    session = await InferenceSession.create(modelPath, {
      executionProviders: useWebGL ? ['webgl'] : ['wasm'],
      graphOptimizationLevel: 'all'
    });

    isModelLoaded = true;
    
    self.postMessage({
      type: 'MODEL_LOADED',
      payload: {
        modelName: useQuantized ? MODEL_CONFIG.quantized : MODEL_CONFIG.full,
        useWebGL,
        embeddingSize: MODEL_CONFIG.embeddingSize
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to load model:', error);
    self.postMessage({
      type: 'MODEL_ERROR',
      payload: { error: error.message }
    });
    return { success: false, error: error.message };
  }
}

/**
 * Generate embeddings for input text
 * @param {string|string[]} input - Text or array of texts to embed
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
async function generateEmbeddings(input) {
  if (!session || !tokenizer) {
    throw new Error('Model not loaded. Call loadModel() first.');
  }

  const inputs = Array.isArray(input) ? input : [input];
  const embeddings = [];

  // Process in batches to avoid memory issues
  const batchSize = 4;
  
  for (let i = 0; i < inputs.length; i += batchSize) {
    const batch = inputs.slice(i, i + batchSize);
    const batchEmbeddings = await processBatch(batch);
    embeddings.push(...batchEmbeddings);
    
    // Yield to avoid blocking
    if (i + batchSize < inputs.length) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return embeddings;
}

/**
 * Process a batch of texts
 */
async function processBatch(texts) {
  const embeddings = [];

  for (const text of texts) {
    // Tokenize
    const tokens = tokenizer.encode(text, {
      truncation: true,
      maxLength: MODEL_CONFIG.maxLength
    });

    // Prepare inputs for ONNX model
    const inputIds = new Int64Array(tokens.input_ids);
    const attentionMask = new Int64Array(tokens.attention_mask);
    const tokenTypeIds = new Int64Array(tokens.token_type_ids || tokens.input_ids.map(() => 0));

    // Create tensors
    const inputIdsTensor = new Tensor('int64', inputIds, [1, tokens.input_ids.length]);
    const attentionMaskTensor = new Tensor('int64', attentionMask, [1, tokens.attention_mask.length]);
    const tokenTypeIdsTensor = new Tensor('int64', tokenTypeIds, [1, tokenTypeIds.length]);

    // Run inference
    const results = await session.run({
      input_ids: inputIdsTensor,
      attention_mask: attentionMaskTensor,
      token_type_ids: tokenTypeIdsTensor
    });

    // Extract embedding (mean pooling)
    const outputData = results.last_hidden_state.data;
    const embedding = meanPooling(outputData, attentionMask, tokens.input_ids.length);
    
    // Normalize embedding (L2 norm)
    const normalized = normalizeVector(embedding);
    
    embeddings.push(normalized);

    // Send progress update
    self.postMessage({
      type: 'EMBEDDING_PROGRESS',
      payload: { processed: embeddings.length, total: texts.length }
    });
  }

  return embeddings;
}

/**
 * Mean pooling over attention mask
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
 * L2 normalize a vector
 */
function normalizeVector(vector) {
  const magnitude = Math.sqrt(
    vector.reduce((sum, val) => sum + val * val, 0)
  );
  
  if (magnitude === 0) return vector;
  
  return vector.map(val => val / magnitude);
}

/**
 * Simple tokenizer (placeholder - use @xenova/transformers in production)
 */
async function loadTokenizer(modelName) {
  // In production, use: const { AutoTokenizer } = await import('@xenova/transformers');
  // return await AutoTokenizer.from_pretrained(modelName);
  
  // Simplified tokenizer for demo
  return {
    encode: (text, options = {}) => {
      const words = text.toLowerCase().split(/\s+/).slice(0, options.maxLength || 512);
      const inputIds = [101, ...words.map(w => w.charCodeAt(0) % 1000), 102]; // Dummy tokenization
      const attentionMask = inputIds.map(() => 1);
      const tokenTypeIds = inputIds.map(() => 0);
      
      // Pad to max length if needed
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

/**
 * Calculate cosine similarity between two vectors
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
 * Find most similar vectors from an index
 */
function findSimilar(queryEmbedding, index, topK = 10) {
  const scores = index.map((item, idx) => ({
    id: item.id,
    score: cosineSimilarity(queryEmbedding, item.embedding),
    metadata: item.metadata
  }));
  
  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);
  
  return scores.slice(0, topK);
}

// Message handler
self.onmessage = async (event) => {
  const { type, payload } = event.data;

  try {
    switch (type) {
      case 'INIT_MODEL':
        await loadModel(payload);
        break;

      case 'GENERATE_EMBEDDINGS':
        const embeddings = await generateEmbeddings(payload.texts);
        self.postMessage({
          type: 'EMBEDDINGS_RESULT',
          payload: { embeddings, count: embeddings.length }
        });
        break;

      case 'FIND_SIMILAR':
        const { query, index, topK } = payload;
        const queryEmbedding = await generateEmbeddings([query]);
        const results = findSimilar(queryEmbedding[0], index, topK);
        self.postMessage({
          type: 'SIMILARITY_RESULT',
          payload: { results }
        });
        break;

      case 'CALCULATE_SIMILARITY':
        const { vec1, vec2 } = payload;
        const similarity = cosineSimilarity(vec1, vec2);
        self.postMessage({
          type: 'SIMILARITY_RESULT',
          payload: { similarity }
        });
        break;

      default:
        console.warn(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      payload: { error: error.message, originalType: type }
    });
  }
};

// Notify worker is ready
self.postMessage({ type: 'WORKER_READY' });
