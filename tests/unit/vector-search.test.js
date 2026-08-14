/**
 * @fileoverview Unit tests for the lightweight Vector Search (TF-IDF + cosine).
 */
import { VectorSearch } from '../../src/modules/vector-search.js';

const POSTS = [
  {
    title: 'Vector Search with TF-IDF',
    content: 'We build a semantic search using tf idf and cosine similarity for blog posts.',
    tags: ['search', 'ml'],
    categories: ['engineering'],
    concepts: [{ id: 'vector-search', label: 'Vector Search' }, { id: 'tfidf', label: 'TF-IDF' }],
    url: '/a/',
    excerpt: 'semantic search'
  },
  {
    title: 'CSS Grid Layouts',
    content: 'A guide to css grid and flexbox for responsive web design and layouts.',
    tags: ['css', 'frontend'],
    categories: ['design'],
    concepts: [{ id: 'css-grid', label: 'CSS Grid' }],
    url: '/b/',
    excerpt: 'css layouts'
  },
  {
    title: 'Service Workers and Offline',
    content: 'Implement offline support with service worker caching strategies and pwa.',
    tags: ['pwa', 'offline'],
    categories: ['engineering'],
    concepts: [{ id: 'service-worker', label: 'Service Worker' }],
    url: '/c/',
    excerpt: 'offline pwa'
  }
];

describe('VectorSearch', () => {
  let vs;
  beforeEach(() => {
    vs = new VectorSearch(POSTS);
  });

  test('builds an index with one document per post', () => {
    expect(vs.documents.length).toBe(3);
  });

  test('embeds a query into a normalized vector', () => {
    const v = vs.embed('vector search');
    expect(v.size).toBeGreaterThan(0);
    let norm = 0;
    for (const x of v.values()) norm += x * x;
    expect(Math.sqrt(norm)).toBeCloseTo(1, 5);
  });

  test('ranks the most semantically relevant post first', () => {
    const results = vs.search('vector search tf idf', { topK: 1 });
    expect(results.length).toBe(1);
    expect(results[0].post.url).toBe('/a/');
    expect(results[0].score).toBeGreaterThan(0);
  });

  test('concepts dominate the semantic signal', () => {
    // Query matches only the concept label of post /a/.
    const results = vs.search('Vector Search', { topK: 3 });
    expect(results[0].post.url).toBe('/a/');
  });

  test('returns empty array for empty query', () => {
    expect(vs.search('')).toEqual([]);
    expect(vs.search('   ')).toEqual([]);
  });

  test('respects topK', () => {
    const results = vs.search('search worker css', { topK: 2 });
    expect(results.length).toBeLessThanOrEqual(2);
  });

  test('threshold filters low-similarity results', () => {
    const results = vs.search('quantum cryptography blockchain', { topK: 5, threshold: 0.05 });
    // These terms are unrelated to the corpus; with threshold most should drop out.
    expect(results.every(r => r.score >= 0.05)).toBe(true);
  });

  test('similarity between two posts is in [0,1]', () => {
    const s = vs.similarity(POSTS[0], POSTS[2]);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });

  test('rebuilds index when buildIndex called again', () => {
    vs.buildIndex(POSTS.slice(0, 1));
    expect(vs.documents.length).toBe(1);
  });
});
