# Edge AI Guide

## Overview

This guide explains how to use the Edge AI features for semantic search and AI assistance directly in the browser using local models.

## Features

- **Semantic Search**: Find content by meaning, not just keywords
- **AI Assistant**: Chat-based help with context awareness
- **Edge Computing**: All processing happens locally in your browser
- **Privacy-First**: No data sent to external servers
- **Adaptive Performance**: Automatically optimizes for your device

## How It Works

### 1. Vector Embeddings

Text is converted to numerical vectors (embeddings) that capture semantic meaning:

```
"How do I optimize React?" → [0.12, -0.45, 0.78, ...]
"React performance tips"   → [0.15, -0.42, 0.76, ...]
```

Similar meanings produce similar vectors, enabling semantic search.

### 2. Local Model Execution

The system uses ONNX Runtime Web to run machine learning models directly in your browser:

- **Model**: `Xenova/all-MiniLM-L6-v2` (80MB quantized)
- **Dimensions**: 384-dimensional embeddings
- **Max Length**: 512 tokens
- **Execution**: WebGL acceleration (if available) or WebAssembly fallback

### 3. Web Workers

Heavy computations run in background threads to keep the UI responsive:

```javascript
// Main thread
const worker = new Worker('embedding-worker.js');
worker.postMessage({ type: 'GENERATE_EMBEDDINGS', texts });

// Worker thread (processes without blocking UI)
```

## Browser Support

### Fully Supported

| Browser | Version | Features |
|---------|---------|----------|
| Chrome | 90+ | WebGL, WebAssembly, Workers |
| Firefox | 88+ | WebGL, WebAssembly, Workers |
| Safari | 15+ | WebGL, WebAssembly, Workers |
| Edge | 90+ | WebGL, WebAssembly, Workers |

### Limited Support

| Browser | Limitations |
|---------|-------------|
| Safari < 15 | No WebGL acceleration (slower) |
| Firefox Mobile | May use quantized model only |
| iOS Safari | Memory limits may apply |

### Not Supported

- Internet Explorer
- Older Android browsers (< Chrome 90)
- Browsers with JavaScript disabled

## Device Requirements

### Minimum Requirements

- **RAM**: 2GB (uses quantized model)
- **Cores**: 2 logical cores
- **Storage**: 100MB cache space

### Recommended

- **RAM**: 4GB+ (uses full model with WebGL)
- **Cores**: 4+ logical cores
- **GPU**: WebGL 2.0 support

### Automatic Optimization

The system automatically detects your device capabilities:

```javascript
navigator.hardwareConcurrency // CPU cores
navigator.deviceMemory        // RAM in GB
WebGL2RenderingContext        // GPU acceleration
```

Low-end devices (<2GB RAM) receive:
- Quantized model (smaller, faster)
- Smaller batch sizes
- WebAssembly instead of WebGL

## Usage

### Semantic Search

1. Click the search icon or press `Ctrl+K` / `Cmd+K`
2. Type your query in natural language
3. Choose search mode:
   - **Hybrid** (default): Combines keyword + vector search
   - **Vector**: Pure semantic similarity
   - **Keyword**: Traditional text matching
4. Results show relevance scores (0-100%)

### AI Assistant

1. Click the chat widget in bottom-right corner
2. Ask questions or use commands:
   - `/clear` - Clear chat history
   - `/context` - Show current page info
   - `/summary` - Summarize current article
   - `/help` - Show available commands
3. Use context menu for quick actions:
   - Summarize Page
   - Explain Concept
   - Find Related Posts

## Privacy & Security

### What Stays Local

✅ All text processing  
✅ Embedding generation  
✅ Search queries  
✅ Chat conversations  
✅ Model weights  

### What Never Leaves Your Device

❌ No telemetry  
❌ No analytics tracking  
❌ No server API calls  
❌ No data collection  

### Optional Features

Some features may require internet connection:
- Initial model download (cached afterward)
- External knowledge base queries (if enabled)
- Cloud backup (if configured)

## Disabling Edge AI

### Temporarily Disable

```javascript
// In browser console
window.disableEdgeAI = true;
location.reload();
```

### Permanently Disable

Add to your site configuration:

```yaml
# _config.yml
edge_ai:
  enabled: false
```

### Clear Cache

```javascript
// Clear embedding cache
if (window.embeddingCache) {
  window.embeddingCache.clear();
}

// Clear IndexedDB
indexedDB.deleteDatabase('edge-ai-cache');
```

## Performance Tips

### For Users

1. **First Load**: Model download takes ~30s on fast connection
2. **Subsequent Loads**: Cached model loads instantly
3. **Search Speed**: ~100-500ms depending on index size
4. **Memory Usage**: ~200-500MB while active

### For Site Owners

1. **Pre-cache Model**: Bundle model with service worker
2. **Progressive Indexing**: Use `requestIdleCallback` for large indexes
3. **Batch Processing**: Process posts in batches of 10
4. **Cache Strategy**: LRU cache with 1-hour TTL

## Troubleshooting

### Model Fails to Load

**Symptoms**: Status shows "Error" or "Offline"

**Solutions**:
1. Check internet connection (for initial download)
2. Clear browser cache
3. Try incognito/private mode
4. Update browser to latest version

### Search is Slow

**Symptoms**: >2 second response time

**Solutions**:
1. Reduce index size (fewer posts)
2. Use quantized model only
3. Decrease batch size
4. Enable WebGL acceleration

### Out of Memory

**Symptoms**: Browser crash or tab reload

**Solutions**:
1. Close other tabs
2. Clear embedding cache
3. Use mobile/low-memory mode
4. Reduce max cache size

## Advanced Configuration

### Custom Model

```javascript
const service = new VectorSearchService({
  modelPath: 'path/to/custom-model.onnx',
  embeddingSize: 768,
  maxLength: 256
});
```

### Cache Settings

```javascript
const cache = new EmbeddingCache({
  maxSize: 500,    // Maximum entries
  ttl: 7200000     // 2 hours in milliseconds
});
```

### Worker Options

```javascript
const worker = new Worker('embedding-worker.js', {
  type: 'module'
});
```

## Resources

- [ONNX Runtime Web](https://onnxruntime.ai/docs/get-started/with-javascript.html)
- [Hugging Face Transformers.js](https://huggingface.co/docs/transformers.js)
- [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [WebGL Fundamentals](https://webglfundamentals.org/)

## Changelog

### v3.0.0-beta
- Added Edge AI semantic search
- Implemented AI assistant widget
- Web Worker integration for non-blocking inference
- Adaptive model loading based on device capabilities
- LRU embedding cache

---

**Last Updated**: 2025-01-14  
**Version**: 3.0.0-beta
