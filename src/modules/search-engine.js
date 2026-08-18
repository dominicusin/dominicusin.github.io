/**
 * @fileoverview Search Engine module with Lunr.js integration
 * @module modules/search-engine
 */

import { DEFAULT_CONFIG } from '../config/constants.js';
import { debounce, createElement } from '../utils/helpers.js';
import { VectorSearch } from './vector-search.js';

/**
 * Search Engine - Client-side search with highlighting and performance optimization
 */
export class SearchEngine {
  /**
   * Create SearchEngine instance
   */
  constructor() {
    this.searchIndex = null;
    this.posts = [];
    this.isInitialized = false;
    this.searchCache = new Map();
    this.debounceTimer = null;
    this.keydownHandler = null;
    
    this.init();
  }

  /**
   * Initialize search engine
   */
  async init() {
    this.createSearchUI();
    await this.loadSearchIndex();
    this.setupEventListeners();
    this.isInitialized = true;
    console.log('Search engine initialized');
  }

  /**
   * Create search UI elements
   */
  createSearchUI() {
    let searchContainer = document.querySelector('.search-container');
    
    if (!searchContainer) {
      searchContainer = createElement('div', { class: 'search-container' });
      searchContainer.innerHTML = `
        <div class="search-input-wrapper">
          <input 
            type="search" 
            class="search-input" 
            placeholder="Search articles..."
            data-search
            autocomplete="off"
            aria-label="Search articles"
          >
          <button class="search-clear" aria-label="Clear search" hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="search-results" role="region" aria-live="polite" aria-label="Search results">
          <div class="search-loading" hidden>
            <div class="search-spinner"></div>
            <span>Searching...</span>
          </div>
          <div class="search-empty" hidden>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <p>No results found</p>
            <p>Try different keywords or browse categories</p>
          </div>
        </div>
      `;
      
      const header = document.querySelector('.site-header');
      if (header) {
        header.after(searchContainer);
      } else {
        document.body.appendChild(searchContainer);
      }
    }
    
    this.searchInput = searchContainer.querySelector('.search-input');
    this.searchResults = searchContainer.querySelector('.search-results');
    this.clearButton = searchContainer.querySelector('.search-clear');
    this.loadingIndicator = searchContainer.querySelector('.search-loading');
    this.emptyState = searchContainer.querySelector('.search-empty');
  }

  /**
   * Format a date string for display (delegates to helpers.formatDate)
   * @param {string} date - ISO date string
   * @param {Object} [options] - Intl.DateTimeFormat options
   * @returns {string} Formatted date
   */
  formatDate(date, options) {
    const d = new Date(date);
    if (isNaN(d)) return String(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', ...options });
  }

  /**
   * Load search index from JSON file
   */
  async loadSearchIndex() {
    try {
      const response = await fetch('/index.json');
      if (!response.ok) throw new Error('Failed to load search index');
      
      const data = await response.json();
      const posts = Array.isArray(data)
        ? data
        : (data.posts || data.entries || data.results || []);
      this.posts = posts.map(post => ({
        ...post,
        title: post.title || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        url: post.url || '',
        date: post.date || '',
        tags: post.tags || [],
        categories: post.categories || [],
        concepts: post.concepts || []
      }));

      // Build the lightweight vector index over the normalized Content Model.
      this.vectorIndex = new VectorSearch(this.posts);

      // Initialize Lunr index if available
      if (typeof lunr !== 'undefined') {
        this.initializeLunrIndex();
      }
      
    } catch (error) {
      console.error('Failed to load search index:', error);
      this.showSearchError();
    }
  }

  /**
   * Initialize Lunr.js search index
   */
  initializeLunrIndex() {
    this.searchIndex = lunr(function() {
      this.ref('id');
      this.field('title', { boost: 10 });
      this.field('excerpt', { boost: 5 });
      this.field('content', { boost: 1 });
      this.field('tags', { boost: 8 });
      this.field('categories', { boost: 8 });
      
      this.posts.forEach((doc, idx) => {
        this.add({
          id: idx,
          title: doc.title,
          excerpt: doc.excerpt,
          content: doc.content,
          tags: doc.tags.join(' '),
          categories: doc.categories.join(' '),
        });
      });
    });
  }

  /**
   * Semantic (vector) search over the Content Model.
   * @param {string} query
   * @param {Object} [opts]
   * @returns {Array<{post: Object, score: number}>}
   */
  vectorSearch(query, opts = {}) {
    if (!this.vectorIndex) return [];
    return this.vectorIndex.search(query, opts);
  }

  /**
   * Unified search dispatcher for the Semantic Search UI.
   * @param {string} query
   * @param {Object} [opts]
   * @param {'hybrid'|'vector'|'keyword'} [opts.mode='hybrid']
   * @param {number} [opts.limit=10]
   * @returns {Array<{url,title,excerpt,date,category,score:number}>}
   */
  search(query, opts = {}) {
    const { mode = 'hybrid', limit = 10 } = opts;
    const q = (query || '').trim();
    if (q.length < 2) return [];

    const withCategory = (post, score) => ({
      ...post,
      category: Array.isArray(post.categories) ? post.categories[0] : (post.category || ''),
      score
    });

    const keywordResults = () => {
      if (this.searchIndex) {
        return this.searchIndex.search(q)
          .map(r => withCategory(this.posts[r.ref], r.score));
      }
      return this.basicSearch(q).map(p => withCategory(p, p.score || 0));
    };

    if (mode === 'vector') {
      if (!this.vectorIndex) return [];
      return this.vectorIndex.search(q, { topK: limit })
        .map(r => withCategory(r.post, r.score));
    }

    if (mode === 'keyword') {
      return keywordResults().slice(0, limit);
    }

    // hybrid: merge keyword + vector, normalize combined score to 0..1
    const merged = new Map();
    for (const r of keywordResults()) {
      merged.set(r.url, { ...r, score: (r.score || 0) * 0.5 });
    }
    if (this.vectorIndex) {
      for (const r of this.vectorIndex.search(q, { topK: limit })) {
        const existing = merged.get(r.post.url);
        if (existing) existing.score += r.score * 0.5;
        else merged.set(r.post.url, withCategory(r.post, r.score * 0.5));
      }
    }
    const values = [...merged.values()];
    const maxScore = values.reduce((m, r) => Math.max(m, r.score || 0), 0);
    if (maxScore > 0) values.forEach(r => { r.score = (r.score || 0) / maxScore; });
    return values
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (!this.searchInput) return;
    
    // Search input with debouncing
    const debouncedSearch = debounce(
      (value) => this.performSearch(value),
      DEFAULT_CONFIG.PERFORMANCE.DEBOUNCE_DELAY
    );
    
    this.searchInput.addEventListener('input', (e) => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        debouncedSearch(e.target.value);
      }, DEFAULT_CONFIG.PERFORMANCE.DEBOUNCE_DELAY);
    });
    
    // Clear button
    if (this.clearButton) {
      this.clearButton.addEventListener('click', () => this.clearSearch());
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Alt + S to focus search
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        this.searchInput?.focus();
      }
      
      // Escape to clear search
      if (e.key === 'Escape' && this.searchInput?.value) {
        this.clearSearch();
      }
    });
    
    // Click outside to close results
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) {
        this.hideResults();
      }
    });
  }

  /**
   * Perform search
   * @param {string} query - Search query
   */
  async performSearch(query) {
    if (!query || query.trim().length < 2) {
      this.hideResults();
      this.clearButton?.setAttribute('hidden', '');
      return;
    }
    
    this.showLoading();
    this.clearButton?.removeAttribute('hidden');
    
    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    if (this.searchCache.has(cacheKey)) {
      const cachedResults = this.searchCache.get(cacheKey);
      setTimeout(() => this.displayResults(cachedResults, query), 100);
      return cachedResults;
    }
    
    // Perform search
    let results = [];

    try {
      if (this.searchIndex) {
        // Use Lunr for advanced search (online, full-text)
        const lunrResults = this.searchIndex.search(query);
        results = lunrResults.map(result => ({
          ...this.posts[result.ref],
          score: result.score,
          matches: this.getMatches(this.posts[result.ref], query)
        }));
      } else if (this.vectorIndex) {
        // Vector/semantic search (works offline from cached vectors)
        results = this.vectorIndex
          .search(query, { topK: 10 })
          .map(r => ({
            ...r.post,
            score: r.score,
            matches: this.getMatches(r.post, query)
          }));
      } else {
        // Fallback to basic search
        results = this.basicSearch(query);
      }
      
      // Cache results
      this.searchCache.set(cacheKey, results);
      this.displayResults(results, query);
      return results;
      
    } catch (error) {
      console.error('Search error:', error);
      this.showSearchError();
      return [];
    }
  }

  /**
   * Basic search fallback
   * @param {string} query - Search query
   * @returns {Array} Search results
   */
  basicSearch(query) {
    const searchTerms = query.toLowerCase().split(/\s+/);
    return this.posts
      .map(post => {
        let score = 0;
        const matches = [];
        
        searchTerms.forEach(term => {
          const titleMatch = post.title.toLowerCase().indexOf(term);
          if (titleMatch !== -1) {
            score += 10;
            matches.push({ field: 'title', term, index: titleMatch });
          }
          
          const contentMatch = post.content.toLowerCase().indexOf(term);
          if (contentMatch !== -1) {
            score += 1;
            matches.push({ field: 'content', term, index: contentMatch });
          }
          
          const tagMatch = post.tags.some(tag => tag.toLowerCase().indexOf(term) !== -1);
          if (tagMatch) {
            score += 8;
            matches.push({ field: 'tags', term });
          }
        });
        
        return { ...post, score, matches };
      })
      .filter(post => post.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  /**
   * Get text matches for highlighting
   * @param {Object} post - Post object
   * @param {string} query - Search query
   * @returns {Array} Matches array
   */
  getMatches(post, query) {
    const matches = [];
    const terms = query.toLowerCase().split(/\s+/);
    
    terms.forEach(term => {
      const titleIndex = post.title.toLowerCase().indexOf(term);
      if (titleIndex !== -1) {
        matches.push({
          field: 'title',
          value: this.highlightText(post.title, titleIndex, term.length)
        });
      }
      
      const excerptIndex = post.excerpt.toLowerCase().indexOf(term);
      if (excerptIndex !== -1) {
        matches.push({
          field: 'excerpt',
          value: this.highlightText(post.excerpt, excerptIndex, term.length)
        });
      }
    });
    
    return matches;
  }

  /**
   * Highlight matched text
   * @param {string} text - Text to highlight
   * @param {number} startIndex - Start index of match
   * @param {number} length - Length of match
   * @returns {Object} Highlighted text parts
   */
  highlightText(text, startIndex, length) {
    return {
      before: text.substring(0, startIndex),
      match: text.substring(startIndex, startIndex + length),
      after: text.substring(startIndex + length)
    };
  }

  /**
   * Display search results
   * @param {Array} results - Search results
   * @param {string} query - Original query
   */
  displayResults(results, query) {
    this.hideLoading();

    if (!this.searchResults) return;

    if (results.length === 0) {
      this.showEmptyState();
      return;
    }
    
    const resultsHTML = results.map((post, index) => `
      <div class="search-result-item" role="article" tabindex="-1" data-index="${index}">
        <a href="${post.url}" class="search-result-link">
          <div class="search-result-header">
            <h3 class="search-result-title">
              ${this.getHighlightedHTML(post.title, query)}
            </h3>
            <div class="search-result-meta">
              <time datetime="${post.date}" class="search-result-date">
                ${formatDate(post.date)}
              </time>
              ${post.categories.length > 0 ? `
                <span class="search-result-category">${post.categories[0]}</span>
              ` : ''}
            </div>
          </div>
          ${post.excerpt ? `
            <div class="search-result-excerpt">
              ${this.getHighlightedHTML(post.excerpt, query)}
            </div>
          ` : ''}
          ${post.tags.length > 0 ? `
            <div class="search-result-tags">
              ${post.tags.slice(0, 3).map(tag => `<span class="search-result-tag">${tag}</span>`).join('')}
            </div>
          ` : ''}
        </a>
      </div>
    `).join('');
    
    this.searchResults.innerHTML = `
      <div class="search-results-list" role="list">
        ${resultsHTML}
      </div>
      <div class="search-results-footer">
        <p>${results.length} result${results.length !== 1 ? 's' : ''} found</p>
      </div>
    `;
    
    this.setupKeyboardNavigation(results.length);
  }

  /**
   * Get highlighted HTML with mark tags
   * @param {string} text - Text to highlight
   * @param {string} query - Search query
   * @returns {string} Highlighted HTML
   */
  getHighlightedHTML(text, query) {
    const regex = new RegExp(`(${query.split(/\s+/).join('|')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Setup keyboard navigation for results
   * @param {number} resultCount - Number of results
   */
  setupKeyboardNavigation(resultCount) {
    let currentIndex = -1;
    
    this.keydownHandler = (e) => {
      const items = this.searchResults.querySelectorAll('.search-result-item');
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          currentIndex = Math.min(currentIndex + 1, resultCount - 1);
          this.highlightResult(items, currentIndex);
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          currentIndex = Math.max(currentIndex - 1, 0);
          this.highlightResult(items, currentIndex);
          break;
          
        case 'Enter':
          if (currentIndex >= 0 && items[currentIndex]) {
            e.preventDefault();
            const link = items[currentIndex].querySelector('.search-result-link');
            link?.click();
          }
          break;
          
        case 'Escape':
          this.hideResults();
          this.searchInput?.focus();
          break;
      }
    };
    
    document.addEventListener('keydown', this.keydownHandler);
  }

  /**
   * Highlight result item
   * @param {NodeList} items - Result items
   * @param {number} index - Index to highlight
   */
  highlightResult(items, index) {
    items.forEach((item, i) => {
      item.classList.toggle('highlighted', i === index);
      item.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });
    
    if (items[index]) {
      items[index].scrollIntoView({ block: 'nearest' });
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.hideEmptyState();
    this.loadingIndicator?.removeAttribute('hidden');
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this.loadingIndicator?.setAttribute('hidden', '');
  }

  /**
   * Show empty state
   */
  showEmptyState() {
    this.hideLoading();
    this.emptyState?.removeAttribute('hidden');
  }

  /**
   * Hide empty state
   */
  hideEmptyState() {
    this.emptyState?.setAttribute('hidden', '');
  }

  /**
   * Hide search results
   */
  hideResults() {
    this.searchResults.innerHTML = '';
    this.hideEmptyState();
    this.hideLoading();
    
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
  }

  /**
   * Clear search
   */
  clearSearch() {
    this.searchInput.value = '';
    this.hideResults();
    this.clearButton?.setAttribute('hidden', '');
    this.searchInput?.focus();
  }

  /**
   * Show search error state
   */
  showSearchError() {
    this.hideLoading();
    this.searchResults.innerHTML = `
      <div class="search-error">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        <p>Search unavailable</p>
        <p>Please try again later</p>
      </div>
    `;
  }

  /**
   * Clear search cache
   */
  clearCache() {
    this.searchCache.clear();
    console.log('Search cache cleared');
  }

  /**
   * Get cache size
   * @returns {number} Cache size
   */
  getCacheSize() {
    return this.searchCache.size;
  }

  /**
   * Destroy search engine and cleanup
   */
  destroy() {
    this.clearCache();
    
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
    }
    
    clearTimeout(this.debounceTimer);
  }
}

// Auto-initialize
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.searchEngine = new SearchEngine();
    });
  } else {
    window.searchEngine = new SearchEngine();
  }
}
