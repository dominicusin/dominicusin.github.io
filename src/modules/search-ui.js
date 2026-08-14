/**
 * Search UI Module - Semantic Search Modal Controller
 * Handles modal open/close, input debouncing, skeleton loading, and results rendering
 */

import { debounce } from '../utils/helpers.js';

export class SearchUI {
  constructor(options = {}) {
    this.modal = null;
    this.input = null;
    this.resultsContainer = null;
    this.skeleton = null;
    this.placeholder = null;
    this.statusEl = null;
    this.modeButtons = null;
    this.currentMode = 'hybrid';
    this.searchService = options.searchService || null;
    this.onSearchComplete = options.onSearchComplete || null;
    
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.modal = document.getElementById('semantic-search-modal');
    if (!this.modal) return;

    this.input = document.getElementById('semantic-search-input');
    this.resultsContainer = document.getElementById('search-results');
    this.skeleton = document.getElementById('results-skeleton');
    this.placeholder = document.getElementById('results-placeholder');
    this.statusEl = document.getElementById('search-status');
    this.modeButtons = document.querySelectorAll('.mode-btn');
    this.modelInfo = document.getElementById('model-info');
    this.indexInfo = document.getElementById('index-info');

    this.bindEvents();
    this.updateStatus('ready');
  }

  bindEvents() {
    // Modal close handlers
    const closeButtons = document.querySelectorAll('[data-close-modal]');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.closeModal());
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.closeModal();
      }
    });

    // Search input with debounce
    if (this.input) {
      this.input.addEventListener('input', debounce((e) => {
        this.handleSearch(e.target.value);
      }, 300));

      // Focus input when modal opens
      this.modal.addEventListener('transitionend', () => {
        if (this.isOpen()) {
          this.input.focus();
        }
      });
    }

    // Mode toggle buttons
    this.modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.setMode(btn.dataset.mode);
      });
    });

    // Open modal trigger (global event)
    document.addEventListener('open-semantic-search', () => {
      this.openModal();
    });
  }

  setMode(mode) {
    this.currentMode = mode;
    
    // Update button states
    this.modeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Update search if there's a query
    if (this.input && this.input.value.trim()) {
      this.handleSearch(this.input.value);
    }
  }

  async handleSearch(query) {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      this.showPlaceholder();
      return;
    }

    if (!this.searchService) {
      console.warn('Search service not available');
      return;
    }

    this.showLoading();
    this.updateStatus('loading');

    try {
      const results = await this.searchService.search(trimmedQuery, {
        mode: this.currentMode,
        limit: 10
      });

      this.renderResults(results);
      this.updateStatus('ready');
      
      if (this.onSearchComplete) {
        this.onSearchComplete(results);
      }
    } catch (error) {
      console.error('Search error:', error);
      this.showError(error.message);
      this.updateStatus('error');
    }
  }

  showLoading() {
    if (this.placeholder) this.placeholder.hidden = true;
    if (this.resultsContainer) {
      // Clear previous results
      const results = this.resultsContainer.querySelectorAll('.search-result-item');
      results.forEach(r => r.remove());
    }
    if (this.skeleton) this.skeleton.hidden = false;
  }

  showPlaceholder() {
    if (this.skeleton) this.skeleton.hidden = true;
    if (this.placeholder) this.placeholder.hidden = false;
    if (this.resultsContainer) {
      const results = this.resultsContainer.querySelectorAll('.search-result-item');
      results.forEach(r => r.remove());
    }
  }

  showError(message) {
    if (this.skeleton) this.skeleton.hidden = true;
    if (this.placeholder) this.placeholder.hidden = true;
    
    if (this.resultsContainer) {
      const errorEl = document.createElement('div');
      errorEl.className = 'results-error';
      errorEl.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 8v4m0 4h.01"></path>
        </svg>
        <p>Error: ${message}</p>
      `;
      
      // Clear previous content
      const results = this.resultsContainer.querySelectorAll('.search-result-item');
      results.forEach(r => r.remove());
      
      this.resultsContainer.appendChild(errorEl);
    }
  }

  renderResults(results) {
    if (this.skeleton) this.skeleton.hidden = true;
    if (this.placeholder) this.placeholder.hidden = true;

    if (!results || results.length === 0) {
      this.showPlaceholder();
      return;
    }

    const template = document.getElementById('result-item-template');
    
    results.forEach((result, index) => {
      const clone = template.content.cloneNode(true);
      const item = clone.querySelector('.search-result-item');
      
      // Set title with highlight
      const titleEl = clone.querySelector('.result-title');
      titleEl.textContent = result.title || 'Untitled';
      
      // Set relevance score
      const scoreEl = clone.querySelector('.relevance-score');
      const score = Math.round((result.score || 0) * 100);
      scoreEl.textContent = `${score}%`;
      
      // Color-code relevance
      const badge = clone.querySelector('.relevance-badge');
      if (score >= 80) {
        badge.style.background = 'rgba(72, 187, 120, 0.15)';
        badge.style.color = '#48bb78';
      } else if (score >= 60) {
        badge.style.background = 'rgba(237, 137, 54, 0.15)';
        badge.style.color = '#ed8936';
      }
      
      // Set excerpt
      const excerptEl = clone.querySelector('.result-excerpt');
      excerptEl.textContent = result.excerpt || '';
      
      // Set meta info
      const dateEl = clone.querySelector('.result-date');
      if (result.date) {
        dateEl.textContent = new Date(result.date).toLocaleDateString();
      }
      
      const categoryEl = clone.querySelector('.result-category');
      if (result.category) {
        categoryEl.textContent = result.category;
      }
      
      // Set link
      const linkEl = clone.querySelector('.result-link');
      if (result.url) {
        linkEl.href = result.url;
      }
      
      // Stagger animation
      item.style.opacity = '0';
      item.style.transform = 'translateY(10px)';
      item.style.transition = `opacity 0.2s ease ${index * 0.05}s, transform 0.2s ease ${index * 0.05}s`;
      
      this.resultsContainer.appendChild(item);
      
      // Trigger animation
      requestAnimationFrame(() => {
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      });
    });
  }

  updateStatus(status) {
    if (!this.statusEl) return;
    
    const indicator = this.statusEl.querySelector('.status-indicator');
    const text = this.statusEl.querySelector('.status-text');
    
    this.statusEl.setAttribute('data-status', status);
    indicator.setAttribute('data-status', status);
    
    const statusTexts = {
      ready: 'Ready',
      loading: 'Searching...',
      error: 'Error'
    };
    
    text.textContent = statusTexts[status] || status;
  }

  updateIndexInfo(count) {
    if (this.indexInfo) {
      this.indexInfo.textContent = `${count} posts`;
    }
  }

  updateModelInfo(modelName) {
    if (this.modelInfo) {
      this.modelInfo.textContent = modelName;
    }
  }

  openModal() {
    if (!this.modal) return;
    
    this.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // Focus trap setup could be added here
    setTimeout(() => {
      if (this.input) this.input.focus();
    }, 100);
  }

  closeModal() {
    if (!this.modal) return;
    
    this.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    
    // Clear search after close animation
    setTimeout(() => {
      if (this.input) this.input.value = '';
      this.showPlaceholder();
    }, 200);
  }

  isOpen() {
    return this.modal && this.modal.getAttribute('aria-hidden') === 'false';
  }

  toggle() {
    if (this.isOpen()) {
      this.closeModal();
    } else {
      this.openModal();
    }
  }

  destroy() {
    // Cleanup event listeners if needed
    this.modal = null;
    this.input = null;
    this.resultsContainer = null;
  }
}

export default SearchUI;
