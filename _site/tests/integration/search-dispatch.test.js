/**
 * @fileoverview Integration: SearchEngine.search() dispatcher (hybrid/vector/keyword)
 * feeds the Semantic Search UI with normalized, rankable results.
 */
import { SearchEngine } from '../../src/modules/search-engine.js';

function makeDom() {
  document.body.innerHTML = `
    <header class="site-header"><div class="wrapper"></div></header>
  `;
}

const POSTS = [
  {
    title: 'Vector Search Explained',
    content: 'tf idf cosine similarity semantic retrieval embeddings',
    tags: ['ml'],
    categories: ['engineering'],
    concepts: [{ id: 'vs', label: 'Vector Search' }],
    url: '/v/',
    excerpt: 'How vector search works.',
    date: '2024-01-01'
  },
  {
    title: 'Cooking Pasta',
    content: 'boil water add salt simmer tomato sauce',
    tags: ['food'],
    categories: ['life'],
    concepts: [],
    url: '/c/',
    excerpt: 'A pasta recipe.',
    date: '2024-01-02'
  }
];

describe('SearchEngine.search() dispatcher', () => {
  let engine;
  beforeEach(async () => {
    delete global.lunr;
    makeDom();
    const fetchMock = jest.fn(() =>
      Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(POSTS) })
    );
    global.fetch = fetchMock;
    engine = new SearchEngine();
    engine.init();
    await engine.loadSearchIndex();
  });

  test('returns normalized results with category + score in 0..1', async () => {
    const results = engine.search('vector search', { mode: 'hybrid', limit: 5 });
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    const top = results[0];
    expect(top.url).toBe('/v/');
    expect(typeof top.score).toBe('number');
    expect(top.score).toBeGreaterThanOrEqual(0);
    expect(top.score).toBeLessThanOrEqual(1);
    expect(top.category).toBe('engineering');
  });

  test('mode=vector ranks the semantically relevant post first', () => {
    const results = engine.search('semantic similarity embeddings', { mode: 'vector', limit: 3 });
    expect(results.some(r => r.url === '/v/')).toBe(true);
    expect(results[0].url).toBe('/v/');
  });

  test('mode=keyword returns posts (Lunr absent -> basicSearch fallback)', () => {
    const results = engine.search('pasta', { mode: 'keyword', limit: 3 });
    expect(results.some(r => r.url === '/c/')).toBe(true);
  });

  test('short queries (<2 chars) return empty without throwing', () => {
    expect(engine.search('a', { mode: 'hybrid' })).toEqual([]);
  });

  test('empty query returns empty', () => {
    expect(engine.search('   ', { mode: 'vector' })).toEqual([]);
  });
});
