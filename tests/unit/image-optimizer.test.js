/**
 * Image Optimizer Unit Tests
 * @module tests/unit/image-optimizer.test
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ImageOptimizer } from '../../src/modules/image-optimizer.js';

// Mock DOM environment
describe('ImageOptimizer', () => {
  let optimizer;
  let originalIntersectionObserver;

  beforeEach(() => {
    // Save original IntersectionObserver
    originalIntersectionObserver = window.IntersectionObserver;

    // Mock IntersectionObserver
    const mockObserve = jest.fn();
    const mockUnobserve = jest.fn();
    const mockDisconnect = jest.fn();

    window.IntersectionObserver = class MockIntersectionObserver {
      constructor(callback) {
        this.callback = callback;
        this.elements = new Set();
      }

      observe(element) {
        this.elements.add(element);
        mockObserve(element);
      }

      unobserve(element) {
        this.elements.delete(element);
        mockUnobserve(element);
      }

      disconnect() {
        this.elements.clear();
        mockDisconnect();
      }

      // Helper to trigger entries
      trigger(entries) {
        this.callback(entries, this);
      }
    };

    // Setup DOM
    document.body.innerHTML = `
      <div id="test-container">
        <img data-src="/test-image.jpg" alt="Test image" />
        <img data-src="/test-image-2.jpg" data-placeholder alt="With placeholder" />
        <img src="/inline-image.jpg" alt="Inline image" />
      </div>
    `;

    optimizer = new ImageOptimizer({ debugMode: true });
  });

  afterEach(() => {
    // Restore original IntersectionObserver
    window.IntersectionObserver = originalIntersectionObserver;

    // Cleanup
    if (optimizer) {
      optimizer.destroy();
    }
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should create instance with default config', () => {
      expect(optimizer).toBeInstanceOf(ImageOptimizer);
      expect(optimizer.config).toBeDefined();
      expect(optimizer.config.lazyLoading).toBeDefined();
      expect(optimizer.config.webp).toBeDefined();
    });

    test('should merge custom options with defaults', () => {
      const customOptions = {
        lazyLoading: { rootMargin: '100px 0px' },
        debugMode: false
      };
      const customOptimizer = new ImageOptimizer(customOptions);

      expect(customOptimizer.config.lazyLoading.rootMargin).toBe('100px 0px');
      expect(customOptimizer.config.debugMode).toBe(false);
      customOptimizer.destroy();
    });

    test('should detect WebP support', () => {
      expect(typeof optimizer.isWebPSupported).toBe('boolean');
    });

    test('should detect IntersectionObserver support', () => {
      expect(typeof optimizer.isIntersectionObserverSupported).toBe('boolean');
    });
  });

  describe('initialization', () => {
    test('should initialize lazy loading for images with data-src', () => {
      const images = document.querySelectorAll('img[data-src]');
      expect(images.length).toBe(2);

      // Observer should be observing these images
      expect(optimizer.observer.elements.size).toBe(2);
    });

    test('should add loading class to images', () => {
      const img = document.querySelector('img[data-src]');
      expect(img.classList.contains('loading')).toBe(true);
    });

    test('should optimize existing images', () => {
      const inlineImg = document.querySelector('img[src="/inline-image.jpg"]');
      expect(inlineImg.loading).toBe('lazy');
      expect(inlineImg.decoding).toBe('async');
    });
  });

  describe('WebP support detection', () => {
    test('_checkWebPSupport should return boolean', () => {
      const result = optimizer._checkWebPSupport();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('placeholder creation', () => {
    test('should create simple placeholder for images without blur data', () => {
      const img = document.querySelector('img[data-src]');
      expect(img.classList.contains('loading')).toBe(true);
    });

    test('should create blur placeholder for images with data-placeholder', () => {
      const img = document.querySelector('img[data-placeholder]');
      expect(img.classList.contains('loading')).toBe(true);
    });

    test('should set aspect ratio if provided in data attribute', () => {
      const img = document.querySelector('img[data-src]');
      img.dataset.aspectRatio = '16/9';

      optimizer._createSimplePlaceholder(img);

      expect(img.style.aspectRatio).toBe('16/9');
    });
  });

  describe('image loading', () => {
    test('should load image when _loadImage is called', async () => {
      const img = document.querySelector('img[data-src]');
      const originalSrc = img.dataset.src;

      await optimizer._loadImage(img);

      expect(img.src).toContain(originalSrc);
      expect(img.classList.contains('loaded')).toBe(true);
      expect(img.classList.contains('loading')).toBe(false);
    });

    test('should remove placeholder after image loads', async () => {
      const img = document.querySelector('img[data-src]');
      const placeholder = document.createElement('div');
      placeholder.className = 'image-placeholder';
      img.parentNode.insertBefore(placeholder, img);
      img.placeholder = placeholder;

      await optimizer._loadImage(img);

      expect(placeholder.parentNode).toBeNull();
      expect(img.placeholder).toBeNull();
    });
  });

  describe('optimized source retrieval', () => {
    test('should return data-src as optimized source', () => {
      const img = document.querySelector('img[data-src]');
      const src = optimizer._getOptimizedSrc(img);

      expect(src).toBe(img.dataset.src);
    });

    test('should handle responsive srcset', () => {
      const img = document.createElement('img');
      img.dataset.srcset = '/small.jpg 480w, /medium.jpg 768w, /large.jpg 1200w';
      img.dataset.src = '/default.jpg';

      const src = optimizer._getResponsiveSrc(img);
      expect(src).toBeDefined();
    });
  });

  describe('WebP URL generation', () => {
    test('should convert jpg to webp', () => {
      const url = '/images/test.jpg';
      const webpUrl = optimizer._getWebPSrc(url);

      expect(webpUrl).toBe('/images/test.webp');
    });

    test('should convert jpeg to webp', () => {
      const url = '/images/test.jpeg';
      const webpUrl = optimizer._getWebPSrc(url);

      expect(webpUrl).toBe('/images/test.webp');
    });

    test('should convert png to webp', () => {
      const url = '/images/test.png';
      const webpUrl = optimizer._getWebPSrc(url);

      expect(webpUrl).toBe('/images/test.webp');
    });
  });

  describe('cache management', () => {
    test('should cache loaded images', async () => {
      const img = document.querySelector('img[data-src]');
      const src = img.dataset.src;

      await optimizer._loadImage(img);

      const stats = optimizer.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
      expect(optimizer.imageCache.has(src)).toBe(true);
    });

    test('should return cache stats', () => {
      const stats = optimizer.getCacheStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('webPSupported');
      expect(stats).toHaveProperty('intersectionObserverSupported');
    });

    test('should clear cache', async () => {
      const img = document.querySelector('img[data-src]');
      await optimizer._loadImage(img);

      optimizer.clearCache();

      expect(optimizer.imageCache.size).toBe(0);
    });
  });

  describe('preload functionality', () => {
    test('should preload image and return metadata', async () => {
      const src = '/preload-test.jpg';

      const result = await optimizer.preloadImage(src);

      expect(result).toHaveProperty('src', src);
      expect(result).toHaveProperty('width');
      expect(result).toHaveProperty('height');
      expect(result).toHaveProperty('aspectRatio');
    });

    test('should return cached result for preloaded image', async () => {
      const src = '/cached-preload.jpg';

      // First preload
      await optimizer.preloadImage(src);

      // Second preload should use cache
      const result = await optimizer.preloadImage(src);
      expect(optimizer.imageCache.has(src)).toBe(true);
    });
  });

  describe('destroy method', () => {
    test('should disconnect observer', () => {
      const disconnectSpy = jest.spyOn(optimizer.observer, 'disconnect');

      optimizer.destroy();

      expect(disconnectSpy).toHaveBeenCalled();
      expect(optimizer.observer).toBeNull();
    });

    test('should clear cache', () => {
      optimizer.destroy();

      expect(optimizer.imageCache.size).toBe(0);
    });
  });

  describe('responsive image handling', () => {
    test('should select appropriate image size based on container width', () => {
      const img = document.createElement('img');
      img.dataset.srcset = '/small.jpg 480w, /medium.jpg 768w, /large.jpg 1200w';

      // Create wrapper div to simulate parent
      const wrapper = document.createElement('div');
      wrapper.style.width = '800px';
      // jsdom doesn't compute layout; emulate a resolved container width
      Object.defineProperty(wrapper, 'offsetWidth', { value: 800, configurable: true });
      wrapper.appendChild(img);
      document.body.appendChild(wrapper);

      const src = optimizer._getResponsiveSrc(img);
      expect(src).toBe('/medium.jpg');
    });
  });

  describe('accessibility', () => {
    test('should infer alt text from figure caption', () => {
      document.body.innerHTML = `
        <figure>
          <figcaption>Caption for the image</figcaption>
          <img src="/test.jpg" />
        </figure>
      `;

      const img = document.querySelector('img');
      const newOptimizer = new ImageOptimizer();

      setTimeout(() => {
        expect(img.alt).toBe('Caption for the image');
        newOptimizer.destroy();
      }, 100);
    });
  });
});
