/**
 * AI Inference Web Worker
 * 
 * Фоновый поток для загрузки моделей и генерации текста
 * без блокировки основного UI потока
 * 
 * @version 2.0.0
 */

let model = null;
let isModelLoading = false;

self.onmessage = async (event) => {
  const { type, ...data } = event.data;

  try {
    switch (type) {
      case 'load-model':
        await loadModel(data.path, data.deviceClass);
        break;
      case 'generate':
        await generateText(data.prompt, data.config);
        break;
      case 'unload-model':
        unloadModel();
        break;
      default:
        console.warn(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({ type: 'error', data: error.message });
  }
};

async function loadModel(modelPath, deviceClass) {
  if (isModelLoading || model) return;
  isModelLoading = true;

  try {
    if (!self.transformers) {
      importScripts('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.14.0/dist/transformers.min.js');
    }

    const { pipeline } = self.transformers;
    const quantized = deviceClass !== 'high';

    model = await pipeline('text-generation', modelPath, {
      quantized,
      progress_callback: (progress) => {
        if (progress.status === 'progress') {
          self.postMessage({
            type: 'loading-progress',
            data: {
              loaded: progress.loaded,
              total: progress.total,
              percent: (progress.loaded / progress.total * 100).toFixed(1)
            }
          });
        }
      }
    });

    isModelLoading = false;
    self.postMessage({ type: 'model-loaded', data: { success: true } });
  } catch (error) {
    isModelLoading = false;
    self.postMessage({ type: 'error', data: `Failed to load model: ${error.message}` });
  }
}

async function generateText(prompt, config = {}) {
  if (!model) throw new Error('Model not loaded');

  const { max_tokens = 512, temperature = 0.7, top_p = 0.9, stream = true } = config;
  const startTime = performance.now();
  let fullText = '';
  let tokenCount = 0;

  if (stream) {
    const generator = await model(prompt, {
      max_new_tokens: max_tokens,
      temperature,
      top_p,
      do_sample: true,
      callback_function: (output) => {
        if (output && output.length > 0) {
          const newText = output[output.length - 1].generated_text;
          const newTokens = newText.slice(fullText.length);
          if (newTokens) {
            fullText = newText;
            tokenCount++;
            self.postMessage({ type: 'streaming-token', data: newTokens });
          }
        }
      }
    });

    const finalText = Array.isArray(generator)
      ? generator[0].generated_text.slice(prompt.length)
      : generator.generated_text.slice(prompt.length);

    const duration = performance.now() - startTime;
    self.postMessage({
      type: 'inference-result',
      data: { text: finalText, tokens: tokenCount, duration, tokensPerSecond: (tokenCount / (duration / 1000)).toFixed(2) }
    });
  } else {
    const output = await model(prompt, { max_new_tokens: max_tokens, temperature, top_p, do_sample: true });
    const finalText = Array.isArray(output)
      ? output[0].generated_text.slice(prompt.length)
      : output.generated_text.slice(prompt.length);

    const duration = performance.now() - startTime;
    const tokens = finalText.split(/\s+/).length;
    self.postMessage({
      type: 'inference-result',
      data: { text: finalText, tokens, duration, tokensPerSecond: (tokens / (duration / 1000)).toFixed(2) }
    });
  }
}

function unloadModel() {
  model = null;
  isModelLoading = false;
  self.postMessage({ type: 'model-unloaded', data: { success: true } });
}

self.onerror = (error) => {
  self.postMessage({ type: 'error', data: `Worker error: ${error.message}` });
};

console.log('[AI Inference Worker] Initialized');
