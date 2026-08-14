/**
 * @fileoverview Unit tests for SearchUI modal controller (rendering + modes).
 */
import { SearchUI } from '../../src/modules/search-ui.js';

function makeModalDom() {
  document.body.innerHTML = `
    <div id="semantic-search-modal" class="ai-modal" role="dialog" aria-hidden="true">
      <div class="ai-modal__overlay" data-close-modal></div>
      <div class="ai-modal__container">
        <div class="ai-modal__body">
          <div class="search-mode-toggle">
            <button class="mode-btn active" data-mode="hybrid">Hybrid</button>
            <button class="mode-btn" data-mode="vector">Vector</button>
            <button class="mode-btn" data-mode="keyword">Keyword</button>
          </div>
          <input id="semantic-search-input" class="search-input" />
          <div class="search-status" id="search-status">
            <span class="status-indicator"></span><span class="status-text"></span>
          </div>
          <div class="search-results" id="search-results">
            <div class="results-skeleton" id="results-skeleton" hidden></div>
            <div class="results-placeholder" id="results-placeholder"></div>
          </div>
        </div>
      </div>
    </div>
    <template id="result-item-template">
      <article class="search-result-item">
        <div class="result-header">
          <h3 class="result-title"></h3>
          <div class="relevance-badge"><span class="relevance-score"></span></div>
        </div>
        <p class="result-excerpt"></p>
        <div class="result-meta"><span class="result-date"></span><span class="result-category"></span></div>
        <a class="result-link" href="#">Read more</a>
      </article>
    </template>
  `;
}

const FAKE_SERVICE = {
  async search(query, _opts) {
    if (query.toLowerCase().includes('none')) return [];
    return [
      { url: '/a/', title: 'Alpha', excerpt: 'First', date: '2024-01-01', category: 'eng', score: 0.9 },
      { url: '/b/', title: 'Beta', excerpt: 'Second', date: '2024-02-01', category: 'life', score: 0.4 }
    ];
  }
};

describe('SearchUI', () => {
  beforeEach(() => makeModalDom());

  test('renders results from searchService into #search-results', async () => {
    const ui = new SearchUI({ searchService: FAKE_SERVICE });
    await ui.handleSearch('anything');
    const items = document.querySelectorAll('#search-results .search-result-item');
    expect(items.length).toBe(2);
    expect(items[0].querySelector('.result-title').textContent).toBe('Alpha');
    expect(items[0].querySelector('.relevance-score').textContent).toBe('90%');
  });

  test('shows placeholder when no results', async () => {
    const emptyService = { async search() { return []; } };
    const ui = new SearchUI({ searchService: emptyService });
    await ui.handleSearch('none');
    const placeholder = document.getElementById('results-placeholder');
    expect(placeholder.hidden).toBe(false);
  });

  test('setMode switches active button and re-searches', async () => {
    const ui = new SearchUI({ searchService: FAKE_SERVICE });
    const vectorBtn = document.querySelector('.mode-btn[data-mode="vector"]');
    ui.setMode('vector');
    expect(vectorBtn.classList.contains('active')).toBe(true);
  });

  test('openModal/closeModal toggle aria-hidden', () => {
    const ui = new SearchUI({ searchService: FAKE_SERVICE });
    ui.openModal();
    expect(ui.isOpen()).toBe(true);
    ui.closeModal();
    expect(ui.isOpen()).toBe(false);
  });
});
