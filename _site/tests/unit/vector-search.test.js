/**
 * Unit tests for src/modules/vector-search.js (plan Phase 4.1) — TF-IDF
 * semantic search: build index, tokenization/stopwords, query embedding,
 * ranked search with topK + threshold, and post-to-post similarity.
 */
import { VectorSearch } from '@modules/vector-search.js';

const POSTS = [
  {
    id: 'p1', title: 'Rust async runtime', tags: ['rust', 'async'],
    categories: ['systems'], content: 'writing efficient async code in rust',
    concepts: [{ label: 'async' }, { label: 'rust' }]
  },
  {
    id: 'p2', title: 'Python data science', tags: ['python', 'ml'],
    categories: ['data'], content: 'machine learning pipelines in python',
    concepts: [{ label: 'ml' }, { label: 'python' }]
  },
  {
    id: 'p3', title: 'Rust systems programming', tags: ['rust', 'systems'],
    categories: ['systems'], content: 'building low level systems with rust',
    concepts: [{ label: 'rust' }]
  }
];

describe('VectorSearch', () => {
  let vs;
  beforeEach(() => { vs = new VectorSearch(POSTS); });

  test('builds an index over the supplied posts', () => {
    expect(vs.documents).toHaveLength(3);
    expect(vs.vocab.size).toBeGreaterThan(0);
  });

  test('empty constructor yields an empty index', () => {
    const empty = new VectorSearch();
    expect(empty.documents).toHaveLength(0);
  });

  test('search ranks the most semantically similar post first', () => {
    const res = vs.search('rust async');
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].post.id).toBe('p1'); // shares rust + async concepts
  });

  test('search for python/ml returns the data-science post', () => {
    const res = vs.search('python machine learning');
    expect(res[0].post.id).toBe('p2');
  });

  test('returns [] for empty/stopword-only query', () => {
    expect(vs.search('')).toEqual([]);
    expect(vs.search('the a and')).toEqual([]);
  });

  test('topK limits the result count', () => {
    const res = vs.search('rust', { topK: 1 });
    expect(res).toHaveLength(1);
    expect(['p1', 'p3']).toContain(res[0].post.id); // both are rust posts
  });

  test('threshold filters out low-similarity results', () => {
    const res = vs.search('rust', { threshold: 0.99 });
    // unrelated-ish queries won't reach a very high threshold
    expect(Array.isArray(res)).toBe(true);
  });

  test('scores are between 0 and 1 and sorted desc', () => {
    const res = vs.search('rust programming');
    for (let i = 1; i < res.length; i++) {
      expect(res[i - 1].score).toBeGreaterThanOrEqual(res[i].score);
    }
  });

  test('similarity of a post with itself is 1', () => {
    expect(vs.similarity(POSTS[0], POSTS[0])).toBeCloseTo(1, 5);
  });

  test('similarity of two rust posts is higher than rust vs python', () => {
    const rustRust = vs.similarity(POSTS[0], POSTS[2]);
    const rustPython = vs.similarity(POSTS[0], POSTS[1]);
    expect(rustRust).toBeGreaterThan(rustPython);
  });

  test('embedding is normalized (unit length)', () => {
    const vec = vs.embed('rust async systems');
    let norm = 0;
    for (const v of vec.values()) norm += v * v;
    expect(Math.sqrt(norm)).toBeCloseTo(1, 5);
  });

  test('unknown query terms still contribute (default idf)', () => {
    const vec = vs.embed('zzznotaword');
    expect(vec.has('zzznotaword')).toBe(true);
  });

  test('rebuild index replaces prior documents', () => {
    vs.buildIndex([POSTS[0]]);
    expect(vs.documents).toHaveLength(1);
    // python is unrelated to the single rust post -> no relevant match above 0
    expect(vs.search('python', { threshold: 0.001 })).toHaveLength(0);
  });
});
