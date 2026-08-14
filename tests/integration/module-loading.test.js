/**
 * @fileoverview Integration tests for module loading system (aligned to real src/index.js)
 *
 * NOTE: src/index.js initializes modules conditionally based on DOM presence
 * and guards each module with `if (!App.<key>)`. Because the module also
 * auto-starts on import, each test resets the relevant App fields to null and
 * sets up the DOM before calling startApp(), so the conditional init re-runs.
 */

import { describe, it, expect, beforeEach, afterEach } from '../test-utils.js';
import { App, startApp } from '../../src/index.js';

describe('Module Loading Integration', () => {
  beforeEach(() => {
    // Reset already-initialized modules so conditional init re-runs for this DOM
    App.theme = null;
    App.i18n = null;
    App.imageOptimizer = null;
    App.searchEngine = null;
    App.socialSharing = null;
    App.subscription = null;
    App.analytics = null;
    App.pwa = null;

    document.body.innerHTML = `
      <div class="theme-toggle"></div>
      <div data-search></div>
      <div class="social-sharing"></div>
      <div class="subscription-container"></div>
      <img data-src="/test.jpg" alt="Test" />
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('application initialization', () => {
    it('should initialize all modules present in the DOM', () => {
      startApp();

      expect(App.theme).toBeDefined();
      expect(App.i18n).toBeDefined();
      expect(App.imageOptimizer).toBeDefined();
      expect(App.searchEngine).toBeDefined();
      expect(App.socialSharing).toBeDefined();
      expect(App.subscription).toBeDefined();
    });

    it('should expose the global App registry', () => {
      startApp();
      expect(window.App).toBe(App);
    });
  });

  describe('conditional module loading', () => {
    it('should not load image optimizer without lazy images', () => {
      App.imageOptimizer = null;
      document.body.innerHTML = '<div class="theme-toggle"></div>';
      startApp();
      expect(App.imageOptimizer).toBeNull();
    });

    it('should not load search without a search element', () => {
      App.searchEngine = null;
      document.body.innerHTML = '<div class="theme-toggle"></div>';
      startApp();
      expect(App.searchEngine).toBeNull();
    });
  });

  describe('registry shape', () => {
    it('should expose helpers and storage', () => {
      expect(typeof App.helpers.debounce).toBe('function');
      expect(typeof App.storage.LocalStorage).toBe('function');
    });

    it('should expose config constants', () => {
      expect(App.config).toBeDefined();
      expect(App.config.STORAGE.THEME).toBe('blog-theme');
    });
  });
});
