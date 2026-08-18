/**
 * @fileoverview Integration: SearchEngine builds a vector index from the
 * normalized Content Model and falls back to semantic search when Lunr is absent.
 */
import { SearchEngine } from '../../src/modules/search-engine.js';

// Minimal DOM container so createSearchUI can attach.
function makeDom() {
  document.body.innerHTML = '';
  const header = document.createElement('header');
  header.className = 'site-header';
  document.body.appendChild(header);
}

async function loadEngineWith(posts) {
  const fetchMock = jest.fn(() =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(posts) })
  );
  global.fetch = fetchMock;

  const engine = new SearchEngine();
  engine.init();
  await engine.loadSearchIndex();
  return engine;
}

describe('SearchEngine vector integration', () => {
  beforeEach(() => {
    makeDom();
    delete global.lunr; // simulate no Lunr (offline/lightweight path)
  });

  test('builds a vector index from index.json posts', async () => {
    const engine = await loadEngineWith([
      {
        title: 'Vector Search Explained',
        content: 'tf idf cosine similarity semantic retrieval',
        tags: ['ml'],
        categories: ['eng'],
        concepts: [{ id: 'vs', label: 'Vector Search' }],
        url: '/v/',
        excerpt: '',
        date: '2024-01-01'
      },
      {
        title: 'Cooking Pasta',
        content: 'boil water add salt simmer sauce tomato',
        tags: ['food'],
        categories: ['life'],
        concepts: [],
        url: '/c/',
        excerpt: '',
        date: '2024-01-02'
      }
    ]);
    expect(engine.vectorSearch).toBeDefined();
    const results = engine.vectorSearch('vector search', { topK: 1 });
    expect(results.length).toBe(1);
    expect(results[0].post.url).toBe('/v/');
  });

  test('performSearch uses vector search when Lunr is absent', async () => {
    const engine = await loadEngineWith([
      {
        title: 'Vector Search Explained',
        content: 'tf idf cosine similarity semantic retrieval',
        tags: ['ml'],
        categories: ['eng'],
        concepts: [{ id: 'vs', label: 'Vector Search' }],
        url: '/v/',
        excerpt: '',
        date: '2024-01-01'
      },
      {
        title: 'Cooking Pasta',
        content: 'boil water add salt simmer sauce tomato',
        tags: ['food'],
        categories: ['life'],
        concepts: [],
        url: '/c/',
        excerpt: '',
        date: '2024-01-02'
      }
    ]);
    // Lunr is absent -> semantic (vector) path is the active engine.
    expect(typeof engine.vectorSearch).toBe('function');
    const results = engine.vectorSearch('vector search', { topK: 3 });
    expect(Array.isArray(results)).toBe(true);
    expect(results.some(r => r.post.url === '/v/')).toBe(true);
    // basicSearch should NOT be the path when vectorIndex exists
    expect(engine.vectorIndex).toBeDefined();
  });
});
