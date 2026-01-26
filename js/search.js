/**
 * Optimized Search Module with Lunr.js integration
 * Client-side search with highlighting and performance optimization
 */

'use strict';

class SearchEngine {
  constructor() {
    this.searchIndex = null;
    this.posts = [];
    this.isInitialized = false;
    this.searchCache = new Map();
    this.debounceTimer = null;
    
    this.init();
  }

  async init() {
    // Initialize search container
    this.createSearchUI();
    
    // Load search index
    await this.loadSearchIndex();
    
    // Setup event listeners
    this.setupEventListeners();
    
    this.isInitialized = true;
    console.log('Search engine initialized');
  }

  createSearchUI() {
    // Check if search container already exists
    let searchContainer = document.querySelector('.search-container');
    
    if (!searchContainer) {
      // Create search container
      searchContainer = document.createElement('div');
      searchContainer.className = 'search-container';
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
      
      // Add to page
      const header = document.querySelector('.site-header');
      if (header) {
        header.after(searchContainer);
      }
    }
    
    this.searchInput = searchContainer.querySelector('.search-input');
    this.searchResults = searchContainer.querySelector('.search-results');
    this.clearButton = searchContainer.querySelector('.search-clear');
    this.loadingIndicator = searchContainer.querySelector('.search-loading');
    this.emptyState = searchContainer.querySelector('.search-empty');
  }

  async loadSearchIndex() {
    try {
      const response = await fetch('/search.json');
      if (!response.ok) throw new Error('Failed to load search index');
      
      const data = await response.json();
      this.posts = data.map(post => ({
        ...post,
        title: post.title || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        url: post.url || '',
        date: post.date || '',
        tags: post.tags || [],
        categories: post.categories || []
      }));
      
      // Initialize Lunr index if available
      if (typeof lunr !== 'undefined') {
        this.initializeLunrIndex();
      }
      
    } catch (error) {
      console.error('Failed to load search index:', error);
      this.showSearchError();
    }
  }

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

  setupEventListeners() {
    if (!this.searchInput) return;
    
    // Search input with debouncing
    this.searchInput.addEventListener('input', (e) => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.performSearch(e.target.value);
      }, 300);
    });
    
    // Clear button
    if (this.clearButton) {
      this.clearButton.addEventListener('click', () => {
        this.clearSearch();
      });
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

  async performSearch(query) {
    if (!query || query.trim().length < 2) {
      this.hideResults();
      this.clearButton?.setAttribute('hidden', '');
      return;
    }
    
    // Show loading state
    this.showLoading();
    this.clearButton?.removeAttribute('hidden');
    
    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    if (this.searchCache.has(cacheKey)) {
      const cachedResults = this.searchCache.get(cacheKey);
      setTimeout(() => {
        this.displayResults(cachedResults, query);
      }, 100); // Small delay for UX
      return;
    }
    
    // Perform search
    let results = [];
    
    try {
      if (this.searchIndex) {
        // Use Lunr for advanced search
        const lunrResults = this.searchIndex.search(query);
        results = lunrResults.map(result => ({
          ...this.posts[result.ref],
          score: result.score,
          matches: this.getMatches(this.posts[result.ref], query)
        }));
      } else {
        // Fallback to basic search
        results = this.basicSearch(query);
      }
      
      // Cache results
      this.searchCache.set(cacheKey, results);
      
      // Display results
      this.displayResults(results, query);
      
    } catch (error) {
      console.error('Search error:', error);
      this.showSearchError();
    }
  }

  basicSearch(query) {
    const searchTerms = query.toLowerCase().split(/\s+/);
    return this.posts
      .map(post => {
        let score = 0;
        const matches = [];
        
        searchTerms.forEach(term => {
          // Title matching
          const titleMatch = post.title.toLowerCase().indexOf(term);
          if (titleMatch !== -1) {
            score += 10;
            matches.push({ field: 'title', term, index: titleMatch });
          }
          
          // Content matching
          const contentMatch = post.content.toLowerCase().indexOf(term);
          if (contentMatch !== -1) {
            score += 1;
            matches.push({ field: 'content', term, index: contentMatch });
          }
          
          // Tag matching
          const tagMatch = post.tags.some(tag => tag.toLowerCase().indexOf(term) !== -1);
          if (tagMatch) {
            score += 8;
            matches.push({ field: 'tags', term });
          }
        });
        
        return {
          ...post,
          score,
          matches
        };
      })
      .filter(post => post.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  getMatches(post, query) {
    const matches = [];
    const terms = query.toLowerCase().split(/\s+/);
    
    terms.forEach(term => {
      // Highlight in title
      const titleIndex = post.title.toLowerCase().indexOf(term);
      if (titleIndex !== -1) {
        matches.push({
          field: 'title',
          value: this.highlightText(post.title, titleIndex, term.length)
        });
      }
      
      // Highlight in excerpt
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

  highlightText(text, startIndex, length) {
    const before = text.substring(0, startIndex);
    const match = text.substring(startIndex, startIndex + length);
    const after = text.substring(startIndex + length);
    
    return {
      before,
      match,
      after
    };
  }

  displayResults(results, query) {
    this.hideLoading();
    
    if (results.length === 0) {
      this.showEmptyState();
      return;
    }
    
    // Create results HTML
    const resultsHTML = results.map((post, index) => `
      <div class="search-result-item" role="article" tabindex="-1" data-index="${index}">
        <a href="${post.url}" class="search-result-link">
          <div class="search-result-header">
            <h3 class="search-result-title">
              ${this.getHighlightedHTML(post.title, query)}
            </h3>
            <div class="search-result-meta">
              <time datetime="${post.date}" class="search-result-date">
                ${this.formatDate(post.date)}
              </time>
              ${post.categories.length > 0 ? `
                <span class="search-result-category">
                  ${post.categories[0]}
                </span>
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
              ${post.tags.slice(0, 3).map(tag => `
                <span class="search-result-tag">${tag}</span>
              `).join('')}
            </div>
          ` : ''}
        </a>
      </div>
    `).join('');
    
    // Show results
    this.searchResults.innerHTML = `
      <div class="search-results-list" role="list">
        ${resultsHTML}
      </div>
      <div class="search-results-footer">
        <p>${results.length} result${results.length !== 1 ? 's' : ''} found</p>
      </div>
    `;
    
    // Setup keyboard navigation
    this.setupKeyboardNavigation(results.length);
  }

  getHighlightedHTML(text, query) {
    const regex = new RegExp(`(${query.split(/\s+/).join('|')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  setupKeyboardNavigation(resultCount) {
    let currentIndex = -1;
    
    const handleKeydown = (e) => {
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
    
    document.addEventListener('keydown', handleKeydown);
    
    // Store event listener reference for cleanup
    this.keydownHandler = handleKeydown;
  }

  highlightResult(items, index) {
    // Remove previous highlights
    items.forEach((item, i) => {
      item.classList.toggle('highlighted', i === index);
      item.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });
    
    // Scroll into view if needed
    if (items[index]) {
      items[index].scrollIntoView({ block: 'nearest' });
    }
  }

  showLoading() {
    this.hideEmptyState();
    this.loadingIndicator?.removeAttribute('hidden');
  }

  hideLoading() {
    this.loadingIndicator?.setAttribute('hidden', '');
  }

  showEmptyState() {
    this.hideLoading();
    this.emptyState?.removeAttribute('hidden');
    this.searchResults.innerHTML = '';
  }

  hideEmptyState() {
    this.emptyState?.setAttribute('hidden', '');
  }

  hideResults() {
    this.searchResults.innerHTML = '';
    this.hideEmptyState();
    this.hideLoading();
    
    // Remove keyboard navigation
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
  }

  clearSearch() {
    this.searchInput.value = '';
    this.hideResults();
    this.clearButton?.setAttribute('hidden', '');
    this.searchInput?.focus();
  }

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

  // Performance optimization
  clearCache() {
    this.searchCache.clear();
    console.log('Search cache cleared');
  }

  getCacheSize() {
    return this.searchCache.size;
  }

  destroy() {
    this.clearCache();
    
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
    }
    
    clearTimeout(this.debounceTimer);
  }
}

// Initialize search if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.searchEngine = new SearchEngine();
  });
} else {
  window.searchEngine = new SearchEngine();
}

// Export for global access
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SearchEngine;
}