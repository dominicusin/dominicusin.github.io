/**
 * @fileoverview Integration tests for module loading system
 */

import { describe, it, expect, beforeEach, afterEach } from '../test-utils.js';
import { App, startApp } from '../../src/index.js';

describe('Module Loading Integration', () => {
  beforeEach(() => {
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
    it('should initialize all modules', () => {
      startApp();
      
      expect(App.theme).toBeDefined();
      expect(App.i18n).toBeDefined();
      expect(App.imageOptimizer).toBeDefined();
      expect(App.searchEngine).toBeDefined();
      expect(App.socialSharing).toBeDefined();
      expect(App.subscription).toBeDefined();
    });

    it('should expose global API', () => {
      startApp();
      
      expect(window.App).toBe(App);
      expect(window.i18n).toBe(App.i18n);
      expect(window.t).toBeInstanceOf(Function);
    });
  });

  describe('conditional module loading', () => {
    it('should not load search without element', () => {
      document.body.innerHTML = '<div class="theme-toggle"></div>';
      startApp();
      
      expect(App.searchEngine).toBeNull();
    });

    it('should load image optimizer only with images', () => {
      document.body.innerHTML = '<div class="theme-toggle"></div>';
      startApp();
      
      expect(App.imageOptimizer).toBeNull();
    });
  });
});
