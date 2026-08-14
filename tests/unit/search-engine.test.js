/**
 * @fileoverview Unit tests for SearchEngine module
 * @module tests/unit/search-engine.test
 */

import { describe, it, expect, beforeEach, afterEach } from '../test-utils.js';
import { SearchEngine } from '../../src/modules/search-engine.js';

describe('SearchEngine', () => {
  let searchEngine;
  
  beforeEach(() => {
    // Mock fetch for search index
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          {
            id: 1,
            title: 'Test Article',
            excerpt: 'This is a test article',
            content: 'Full content here',
            url: '/test-article',
            date: '2024-01-15',
            tags: ['test', 'demo'],
            categories: ['Engineering']
          }
        ])
      })
    );
  });
  
  afterEach(() => {
    if (searchEngine) {
      searchEngine.destroy();
      searchEngine = null;
    }
    document.querySelector('.search-container')?.remove();
  });
  
  describe('initialization', () => {
    it('should create search UI elements', async () => {
      searchEngine = new SearchEngine();
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const searchContainer = document.querySelector('.search-container');
      expect(searchContainer).toBeTruthy();
    });
    
    it('should have search input with proper attributes', async () => {
      searchEngine = new SearchEngine();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const input = document.querySelector('.search-input');
      expect(input).toBeTruthy();
      expect(input.getAttribute('aria-label')).toBe('Search articles');
      expect(input.getAttribute('autocomplete')).toBe('off');
    });
  });
  
  describe('search functionality', () => {
    it('should perform basic search', async () => {
      searchEngine = new SearchEngine();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Manually set posts for testing
      searchEngine.posts = [
        {
          id: 1,
          title: 'JavaScript Guide',
          excerpt: 'Learn JavaScript basics',
          content: 'Full content',
          url: '/js-guide',
          date: '2024-01-15',
          tags: ['javascript'],
          categories: ['Programming']
        }
      ];
      
      const results = searchEngine.basicSearch('javascript');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toContain('JavaScript');
    });
    
    it('should return empty results for no matches', async () => {
      searchEngine = new SearchEngine();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      searchEngine.posts = [
        {
          id: 1,
          title: 'JavaScript Guide',
          excerpt: 'Learn JavaScript',
          content: 'Content',
          url: '/js',
          date: '2024-01-15',
          tags: [],
          categories: []
        }
      ];
      
      const results = searchEngine.basicSearch('nonexistent');
      expect(results.length).toBe(0);
    });
    
    it('should cache search results', async () => {
      searchEngine = new SearchEngine();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      searchEngine.searchCache.set('test', [{ title: 'Cached Result' }]);
      
      expect(searchEngine.getCacheSize()).toBe(1);
      expect(searchEngine.searchCache.get('test')[0].title).toBe('Cached Result');
    });
    
    it('should clear cache', async () => {
      searchEngine = new SearchEngine();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      searchEngine.searchCache.set('test', [{ title: 'Result' }]);
      searchEngine.clearCache();
      
      expect(searchEngine.getCacheSize()).toBe(0);
    });
  });
  
  describe('text highlighting', () => {
    it('should highlight matched text', async () => {
      searchEngine = new SearchEngine();
      
      const html = searchEngine.getHighlightedHTML('Hello World', 'World');
      expect(html).toContain('<mark>');
      expect(html).toContain('World');
    });
    
    it('should handle multiple terms', async () => {
      searchEngine = new SearchEngine();
      
      const html = searchEngine.getHighlightedHTML('Hello World Test', 'hello test');
      expect(html.match(/<mark>/g)?.length).toBeGreaterThanOrEqual(1);
    });
    
    it('should highlight text parts correctly', async () => {
      searchEngine = new SearchEngine();
      
      const result = searchEngine.highlightText('Hello World', 6, 5);
      expect(result.before).toBe('Hello ');
      expect(result.match).toBe('World');
      expect(result.after).toBe('');
    });
  });
  
  describe('date formatting', () => {
    it('should format dates correctly', async () => {
      searchEngine = new SearchEngine();
      
      const formatted = searchEngine.formatDate('2024-06-15');
      expect(formatted).toMatch(/\w+ \d+, \d+/);
    });
  });
  
  describe('UI state management', () => {
    it('should show loading state', async () => {
      searchEngine = new SearchEngine();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      searchEngine.showLoading();
      
      const loadingIndicator = document.querySelector('.search-loading');
      expect(loadingIndicator?.hasAttribute('hidden')).toBe(false);
    });
    
    it('should hide loading state', async () => {
      searchEngine = new SearchEngine();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      searchEngine.hideLoading();
      
      const loadingIndicator = document.querySelector('.search-loading');
      expect(loadingIndicator?.hasAttribute('hidden')).toBe(true);
    });
    
    it('should show empty state', async () => {
      searchEngine = new SearchEngine();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      searchEngine.showEmptyState();
      
      const emptyState = document.querySelector('.search-empty');
      expect(emptyState?.hasAttribute('hidden')).toBe(false);
    });
    
    it('should clear search', async () => {
      searchEngine = new SearchEngine();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      searchEngine.searchInput.value = 'test query';
      searchEngine.clearSearch();
      
      expect(searchEngine.searchInput.value).toBe('');
    });
  });
  
  describe('keyboard navigation', () => {
    it('should setup keyboard navigation', async () => {
      searchEngine = new SearchEngine();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      searchEngine.searchResults.innerHTML = `
        <div class="search-result-item">Item 1</div>
        <div class="search-result-item">Item 2</div>
      `;
      
      searchEngine.setupKeyboardNavigation(2);
      expect(searchEngine.keydownHandler).toBeDefined();
    });
    
    it('should highlight result items', async () => {
      searchEngine = new SearchEngine();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const items = [
        document.createElement('div'),
        document.createElement('div')
      ];
      items.forEach(item => item.className = 'search-result-item');
      
      searchEngine.highlightResult(items, 0);
      
      expect(items[0].classList.contains('highlighted')).toBe(true);
      expect(items[0].getAttribute('aria-selected')).toBe('true');
    });
  });
  
  describe('error handling', () => {
    it('should show error state on failure', async () => {
      searchEngine = new SearchEngine();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      searchEngine.showSearchError();
      
      const errorDiv = document.querySelector('.search-error');
      expect(errorDiv).toBeTruthy();
    });
    
    it('should handle empty queries', async () => {
      searchEngine = new SearchEngine();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should not throw
      await searchEngine.performSearch('');
      await searchEngine.performSearch('a'); // Too short
      
      expect(searchEngine.searchResults.innerHTML).toBe('');
    });
  });
});
