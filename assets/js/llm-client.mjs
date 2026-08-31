/**
 * @fileoverview LLM Client — unified interface for OpenAI/Anthropic/local LLMs.
 * Handles chat, embeddings, and summarization.
 */

const LLM = (() => {
  'use strict';

  const STORE_KEY = 'neo-ai-settings';

  function getSettings() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch (e) { return {}; }
  }

  function getApiKey() {
    const s = getSettings();
    return s.apiKey || '';
  }

  function getProvider() {
    const s = getSettings();
    return s.provider || 'openai';
  }

  function getModel() {
    const s = getSettings();
    return s.model || 'gpt-4o-mini';
  }

  // Simple bag-of-words embedding (for demo — production uses proper embeddings)
  function simpleEmbed(text, vocab) {
    const words = text.toLowerCase().split(/\s+/);
    return vocab.map(word => words.includes(word) ? 1 : 0);
  }

  // Build vocabulary from site index
  function buildVocabulary(posts, maxWords = 500) {
    const wordSet = new Set();
    posts.forEach(p => {
      const text = `${p.title} ${p.description || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
      text.split(/\s+/).forEach(w => {
        if (w.length > 3 && !['this','that','with','from','have','been','were','they','their','what','when','where','which','while','about','would','could','should','there','these','those','them','than','then','some','come','made','make','like','just','over','into','year','years','also','well','very','your','their','other','which','their','there','here','where','when','what','how','all','any','both','each','few','more','most','own','same','such','only','same','take','than','too','was','will','with','have','been','being','doing','before','after','between','during','through','without','within','along','among','around','because','through','during','without','within','along','among','around','because','through','during','without','within','along','among','around','because'].includes(w)) {
          wordSet.add(w);
        }
      });
    });
    return Array.from(wordSet).slice(0, maxWords);
  }

  // Cosine similarity
  function cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
  }

  // Search posts by semantic similarity
  async function searchPosts(query, topK = 5) {
    try {
      const resp = await fetch('/index.json');
      const posts = await resp.json();
      const vocab = buildVocabulary(posts);
      const queryEmbedding = simpleEmbed(query, vocab);

      const scored = posts
        .map(p => ({
          ...p,
          score: cosineSimilarity(queryEmbedding, simpleEmbed(
            `${p.title} ${p.description || ''} ${(p.tags || []).join(' ')}`.toLowerCase(), vocab
          ))
        }))
        .filter(p => p.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

      return scored;
    } catch (e) {
      console.error('Search error:', e);
      return [];
    }
  }

  // Chat with LLM
  async function chat(messages, systemPrompt = '') {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error('API key not set');

    const provider = getProvider();
    const model = getModel();

    if (provider === 'openai' || provider === 'local') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: systemPrompt
            ? [{ role: 'system', content: systemPrompt }, ...messages]
            : messages,
          max_tokens: 1024,
          temperature: 0.7
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'OpenAI API error');
      }

      const data = await res.json();
      return data.choices[0].message.content;
    }

    if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Anthropic API error');
      }

      const data = await res.json();
      return data.content[0].text;
    }

    throw new Error('Unknown provider: ' + provider);
  }

  // Summarize text
  async function summarize(text) {
    const messages = [
      { role: 'user', content: `Summarize the following text in 3-5 concise sentences:\n\n${text.substring(0, 4000)}` }
    ];
    return chat(messages);
  }

  // Generate embeddings (simple version)
  async function embed(text) {
    const apiKey = getApiKey();
    if (!apiKey) return simpleEmbed(text.toLowerCase(), []);

    try {
      const res = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text.substring(0, 8000)
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Embedding error');
      }

      const data = await res.json();
      return data.data[0].embedding;
    } catch (e) {
      console.error('Embedding error:', e);
      return null;
    }
  }

  // Public API
  return {
    getSettings,
    getApiKey,
    getProvider,
    getModel,
    searchPosts,
    chat,
    summarize,
    embed,
    buildVocabulary,
    cosineSimilarity,
    simpleEmbed
  };
})();

// Expose globally
if (typeof window !== 'undefined') {
  window.LLM = LLM;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LLM;
}
