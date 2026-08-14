/**
 * @fileoverview Vector Search - lightweight TF-IDF semantic search
 * @module modules/vector-search
 * @description Pure, dependency-free vector search over the normalized
 * Content Model. Each post is vectorized (TF-IDF) from its `concepts`
 * (weighted), `title`, `tags`, `categories` and `content`. Query vectors
 * are compared via cosine similarity. Designed to be cached in IndexedDB
 * (see services/vector-store.js) for offline use through the PWA.
 */

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'at', 'by',
  'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over',
  'under', 'again', 'further', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
  'has', 'had', 'do', 'does', 'did', 'of', 'this', 'that', 'these', 'those', 'it', 'its',
  'we', 'you', 'they', 'he', 'she', 'i', 'me', 'my', 'your', 'our', 'their', 'as', 'can',
  'will', 'just', 'should', 'now', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will',
  'not', 'no', 'yes', 'how', 'what', 'why', 'when', 'where', 'which', 'who', 'whom', 'all',
  'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'only', 'own',
  'same', 'one', 'two', 'three', 'про', 'это', 'как', 'для', 'что', 'или', 'не', 'на',
  'в', 'и', 'с', 'по', 'то', 'мы', 'вы', 'он', 'она', 'они'
]);

// Field weights: concepts dominate the semantic signal.
const FIELD_WEIGHTS = {
  concepts: 5,
  title: 3,
  tags: 2.5,
  categories: 2,
  content: 1,
  excerpt: 1
};

function tokenize(text) {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 2 && !STOPWORDS.has(t));
}

function conceptTokens(concepts) {
  if (!Array.isArray(concepts)) return [];
  const out = [];
  for (const c of concepts) {
    if (!c) continue;
    // Weight each concept label heavily (it represents a Knowledge-Graph node).
    const label = typeof c === 'string' ? c : (c.label || c.id || '');
    const t = tokenize(label);
    // Repeat tokens to reflect the FIELD_WEIGHTS.concepts multiplier.
    for (let i = 0; i < FIELD_WEIGHTS.concepts; i++) out.push(...t);
  }
  return out;
}

function termFreq(tokens) {
  const tf = new Map();
  for (const tok of tokens) tf.set(tok, (tf.get(tok) || 0) + 1);
  return tf;
}

function cosim(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [k, v] of a) {
    na += v * v;
    if (b.has(k)) dot += v * b.get(k);
  }
  for (const [, v] of b) nb += v * v;
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export class VectorSearch {
  /**
   * @param {Array<Object>} [posts] - normalized posts from the Content Model
   */
  constructor(posts = []) {
    this.documents = [];
    this.idf = new Map();
    this.vocab = new Set();
    if (posts.length) this.buildIndex(posts);
  }

  /**
   * Build (or rebuild) the TF-IDF index from posts.
   * @param {Array<Object>} posts
   * @returns {void}
   */
  buildIndex(posts) {
    this.documents = [];
    const raw = posts.map(post => {
      const concepts = conceptTokens(post.concepts);
      const title = tokenize(post.title);
      const tags = tokenize((post.tags || []).join(' '));
      const categories = tokenize((post.categories || []).join(' '));
      const content = tokenize(post.content);
      const excerpt = tokenize(post.excerpt);
      return { post, tokens: { concepts, title, tags, categories, content, excerpt } };
    });

    // First pass: document frequency for IDF.
    this.idf = new Map();
    this.vocab = new Set();
    const df = new Map();
    for (const { tokens } of raw) {
      const seen = new Set();
      for (const field of Object.keys(tokens)) {
        for (const tok of tokens[field]) {
          if (!seen.has(tok)) {
            seen.add(tok);
            df.set(tok, (df.get(tok) || 0) + 1);
          }
          this.vocab.add(tok);
        }
      }
    }
    const N = raw.length || 1;
    for (const [tok, d] of df) {
      this.idf.set(tok, Math.log((1 + N) / (1 + d)) + 1);
    }

    // Second pass: weighted TF-IDF vectors.
    this.documents = raw.map(({ post, tokens }) => {
      const vec = new Map();
      for (const field of Object.keys(tokens)) {
        const tf = termFreq(tokens[field]);
        const w = FIELD_WEIGHTS[field] || 1;
        for (const [tok, f] of tf) {
          const val = (1 + Math.log(f)) * this.idf.get(tok) * w;
          vec.set(tok, (vec.get(tok) || 0) + val);
        }
      }
      // L2-normalize.
      let norm = 0;
      for (const v of vec.values()) norm += v * v;
      norm = Math.sqrt(norm) || 1;
      for (const [k, v] of vec) vec.set(k, v / norm);
      return { post, vector: vec };
    });
  }

  /**
   * Vectorize a free-text query into a normalized TF-IDF vector.
   * @param {string} query
   * @returns {Map<string, number>}
   */
  embed(query) {
    const tokens = {
      concepts: tokenize(query),
      title: tokenize(query),
      tags: tokenize(query),
      categories: tokenize(query),
      content: tokenize(query),
      excerpt: tokenize(query)
    };
    const vec = new Map();
    for (const field of Object.keys(tokens)) {
      const tf = termFreq(tokens[field]);
      const w = FIELD_WEIGHTS[field] || 1;
      for (const [tok, f] of tf) {
        if (!this.idf.has(tok)) {
          // Unknown term: treat with default IDF so it still contributes.
          this.idf.set(tok, 1);
        }
        const val = (1 + Math.log(f)) * this.idf.get(tok) * w;
        vec.set(tok, (vec.get(tok) || 0) + val);
      }
    }
    let norm = 0;
    for (const v of vec.values()) norm += v * v;
    norm = Math.sqrt(norm) || 1;
    for (const [k, v] of vec) vec.set(k, v / norm);
    return vec;
  }

  /**
   * Search the index by semantic similarity.
   * @param {string} query
   * @param {Object} [opts]
   * @param {number} [opts.topK=5]
   * @param {number} [opts.threshold=0]
   * @returns {Array<{post: Object, score: number}>}
   */
  search(query, opts = {}) {
    const { topK = 5, threshold = 0 } = opts;
    const qv = this.embed(query);
    if (qv.size === 0) return [];

    const scored = this.documents
      .map(doc => ({ post: doc.post, score: cosim(qv, doc.vector) }))
      .filter(r => r.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored;
  }

  /**
   * Compute similarity between two posts (0..1). Useful for "related posts".
   * @param {Object} a
   * @param {Object} b
   * @returns {number}
   */
  similarity(a, b) {
    const va = this.embed([a.title, (a.concepts || []).map(c => c.label || c.id).join(' '), a.content].join(' '));
    const vb = this.embed([b.title, (b.concepts || []).map(c => c.label || c.id).join(' '), b.content].join(' '));
    return cosim(va, vb);
  }
}

export default VectorSearch;
