/**
 * Image Optimization Module - ES6 Refactored Version
 * Handles responsive images, lazy loading, and WebP support
 * 
 * @module modules/image-optimizer
 * @exports ImageOptimizer
 */

'use strict';

/**
 * Get device pixel ratio safely for SSR/Node environments
 * @returns {number} Device pixel ratio or 1
 */
function getDevicePixelRatio() {
  return typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1;
}

/**
 * Image optimization configuration
 * @type {Object}
 */
const CONFIG = {
  // Lazy loading settings
  lazyLoading: {
    rootMargin: '50px 0px',
    threshold: 0.01
  },
  
  // Placeholder settings
  placeholder: {
    enableBlur: true,
    enableAspectRatio: true
  },
  
  // WebP settings
  webp: {
    enabled: true,
    patterns: [
      (url) => url.replace(/\.(jpg|jpeg|png)$/i, '.webp'),
      (url) => url.replace(/(\.[^.]+)$/, '.webp$1'),
      (url) => url.replace(/\/upload\//, '/upload/f_webp/')
    ]
  },
  
  // Responsive image settings
  responsive: {
    enabled: true,
    devicePixelRatio: getDevicePixelRatio()
  }
};

/**
 * Image Optimizer Class
 * Provides lazy loading, responsive images, WebP support, and error handling
 */
export class ImageOptimizer {
  /**
   * Create an ImageOptimizer instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    /** @private */
    this.observer = null;
    
    /** @private */
    this.imageCache = new Map();
    
    /** @private */
    this.loadedImages = new Set();
    
    /** @private */
    this.isWebPSupported = this._checkWebPSupport();
    
    /** @private */
    this.isIntersectionObserverSupported = 'IntersectionObserver' in window;
    
    /** @public */
    this.config = { ...CONFIG, ...options };
    
    this._init();
  }

  /**
   * Initialize image optimizer
   * @private
   */
  _init() {
    this._initLazyLoading();
    this._optimizeExistingImages();
    this._setupResponsiveImages();
    this._setupErrorHandling();
    
    if (this.config.debugMode) {
      console.log('Image optimizer initialized', {
        webPSupported: this.isWebPSupported,
        intersectionObserverSupported: this.isIntersectionObserverSupported
      });
    }
  }

  /**
   * Check WebP support
   * @returns {boolean} True if WebP is supported
   * @private
   */
  _checkWebPSupport() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const dataUrl = canvas.toDataURL('image/webp');
      return dataUrl.indexOf('data:image/webp') === 0;
    } catch (e) {
      // JSDOM doesn't support toDataURL with webp
      return false;
    }
  }

  /**
   * Initialize lazy loading with Intersection Observer
   * @private
   */
  _initLazyLoading() {
    if (!this.isIntersectionObserverSupported) {
      this._loadAllImagesFallback();
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this._loadImage(entry.target);
            this.observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: this.config.lazyLoading.rootMargin,
        threshold: this.config.lazyLoading.threshold
      }
    );

    // Observe all images with data-src
    document.querySelectorAll('img[data-src]').forEach((img) => {
      this.observer.observe(img);
      this._addPlaceholders(img);
    });
  }

  /**
   * Add placeholders to images
   * @param {HTMLImageElement} img - Image element
   * @private
   */
  _addPlaceholders(img) {
    img.classList.add('loading');

    if (img.dataset.placeholder || img.dataset.blur) {
      this._createBlurPlaceholder(img);
    } else {
      this._createSimplePlaceholder(img);
    }
  }

  /**
   * Create blur-up placeholder
   * @param {HTMLImageElement} img - Image element
   * @private
   */
  _createBlurPlaceholder(img) {
    const placeholder = document.createElement('div');
    placeholder.className = 'image-placeholder blur-placeholder';

    const blurHash = img.dataset.blur;
    if (blurHash) {
      // In production, decode the blur hash here
      placeholder.style.background = 'linear-gradient(135deg, #f0f0f0, #e0e0e0)';
    } else {
      placeholder.style.background = 'linear-gradient(135deg, #f8f9fa, #e9ecef)';
    }

    // Set dimensions to prevent layout shift
    placeholder.style.paddingBottom = img.dataset.aspectRatio || '0';

    // Insert before image
    img.parentNode?.insertBefore(placeholder, img);
    img.placeholder = placeholder;

    if (img.dataset.aspectRatio && this.config.placeholder.enableAspectRatio) {
      img.style.aspectRatio = img.dataset.aspectRatio;
    }
  }

  /**
   * Create simple placeholder
   * @param {HTMLImageElement} img - Image element
   * @private
   */
  _createSimplePlaceholder(img) {
    img.classList.add('loading');

    if (img.dataset.width) img.style.width = img.dataset.width;
    if (img.dataset.height) img.style.height = img.dataset.height;
    if (img.dataset.aspectRatio) img.style.aspectRatio = img.dataset.aspectRatio;
  }

  /**
   * Load a single image
   * @param {HTMLImageElement} img - Image element to load
   * @private
   */
  async _loadImage(img) {
    const src = this._getOptimizedSrc(img);

    if (!src || this.loadedImages.has(src)) return;

    try {
      const tempImg = new Image();

      tempImg.onload = () => {
        img.src = src;
        img.classList.remove('loading');
        img.classList.add('loaded');

        // Remove placeholder
        if (img.placeholder) {
          img.placeholder.remove();
          img.placeholder = null;
        }

        // Add fade-in animation
        img.style.animation = 'fadeIn 0.3s ease';

        // Cache the loaded image
        this.imageCache.set(src, {
          width: tempImg.width,
          height: tempImg.height,
          aspectRatio: tempImg.width / tempImg.height
        });

        this.loadedImages.add(src);
      };

      tempImg.onerror = () => {
        this._handleImageError(img);
      };

      tempImg.src = src;
    } catch (error) {
      console.error('Failed to load image:', error);
      this._handleImageError(img);
    }
  }

  /**
   * Get optimized source URL for image
   * @param {HTMLImageElement} img - Image element
   * @returns {string|null} Optimized source URL
   * @private
   */
  _getOptimizedSrc(img) {
    let src = img.dataset.src || img.src;
    if (!src) return null;

    // Handle WebP based on support
    if (this.isWebPSupported && this.config.webp.enabled) {
      const webpSrc = this._getWebPSrc(src);
      if (webpSrc) return webpSrc;
    }

    // Handle responsive images
    if (img.dataset.srcset) {
      return this._getResponsiveSrc(img);
    }

    return src;
  }

  /**
   * Get WebP source URL
   * @param {string} originalSrc - Original image URL
   * @returns {string|null} WebP URL or null
   * @private
   */
  _getWebPSrc(originalSrc) {
    for (const pattern of this.config.webp.patterns) {
      const webpSrc = pattern(originalSrc);
      if (webpSrc && webpSrc !== originalSrc) {
        return webpSrc;
      }
    }
    return this.config.webp.patterns[0](originalSrc);
  }

  /**
   * Get responsive source URL
   * @param {HTMLImageElement} img - Image element
   * @returns {string} Selected responsive URL
   * @private
   */
  _getResponsiveSrc(img) {
    const srcset = img.dataset.srcset;
    if (!srcset) return img.dataset.src || '';

    // Get current image container width
    const containerWidth = img.parentElement?.offsetWidth || window.innerWidth;

    // Parse srcset
    const sources = srcset.split(',').map((source) => {
      const [url, width] = source.trim().split(' ');
      return {
        url: url.trim(),
        width: parseInt(width.replace('w', ''), 10)
      };
    });

    // Select appropriate size
    const idealWidth = containerWidth * this.config.responsive.devicePixelRatio;
    const selected = sources.reduce((prev, curr) => {
      if (!prev) return curr;
      return Math.abs(curr.width - idealWidth) < Math.abs(prev.width - idealWidth)
        ? curr
        : prev;
    }, null);

    return selected ? selected.url : sources[0]?.url || '';
  }

  /**
   * Optimize existing images on page
   * @private
   */
  _optimizeExistingImages() {
    // Add proper loading attributes
    document.querySelectorAll('img:not([loading])').forEach((img) => {
      img.loading = 'lazy';
      img.decoding = 'async';
    });

    // Add proper alt text if missing
    document.querySelectorAll('img:not([alt])').forEach((img) => {
      const parentFigcaption = img.closest('figure')?.querySelector('figcaption');
      const parentHeading = img
        .closest('section, article')
        ?.querySelector('h1, h2, h3, h4, h5, h6');

      if (parentFigcaption) {
        img.alt = parentFigcaption.textContent.trim();
      } else if (parentHeading) {
        img.alt = `Image related to: ${parentHeading.textContent.trim()}`;
      } else {
        img.alt = 'Decorative image';
        img.role = 'presentation';
      }
    });
  }

  /**
   * Setup responsive image handling
   * @private
   */
  _setupResponsiveImages() {
    // Create responsive image containers
    document.querySelectorAll('img[data-sizes]').forEach((img) => {
      img.sizes = img.dataset.sizes;
    });

    // Handle picture elements
    document.querySelectorAll('picture').forEach((picture) => {
      this._optimizePictureElement(picture);
    });
  }

  /**
   * Optimize picture element
   * @param {HTMLPictureElement} picture - Picture element
   * @private
   */
  _optimizePictureElement(picture) {
    if (this.isWebPSupported && this.config.webp.enabled) {
      const existingSources = Array.from(picture.querySelectorAll('source'));

      existingSources.forEach((source) => {
        const webpSrcset = this._getWebPSrcSet(source.srcset);
        if (webpSrcset && !this._hasWebPSource(picture)) {
          const webpSource = document.createElement('source');
          webpSource.type = 'image/webp';
          webpSource.srcset = webpSrcset;
          webpSource.sizes = source.sizes;
          picture.insertBefore(webpSource, source);
        }
      });
    }
  }

  /**
   * Convert srcset to WebP
   * @param {string} srcset - Source set string
   * @returns {string} WebP srcset
   * @private
   */
  _getWebPSrcSet(srcset) {
    return srcset
      .split(',')
      .map((source) => {
        const [url, descriptor] = source.trim().split(' ');
        const webpUrl = this._getWebPSrc(url);
        return webpUrl ? `${webpUrl} ${descriptor}` : null;
      })
      .filter(Boolean)
      .join(', ');
  }

  /**
   * Check if picture has WebP source
   * @param {HTMLPictureElement} picture - Picture element
   * @returns {boolean} True if WebP source exists
   * @private
   */
  _hasWebPSource(picture) {
    return Array.from(picture.querySelectorAll('source')).some(
      (source) => source.type === 'image/webp'
    );
  }

  /**
   * Setup error handling for images
   * @private
   */
  _setupErrorHandling() {
    document.addEventListener(
      'error',
      (e) => {
        if (e.target.tagName === 'IMG') {
          this._handleImageError(e.target);
        }
      },
      true
    );
  }

  /**
   * Handle image loading error
   * @param {HTMLImageElement} img - Image element
   * @private
   */
  _handleImageError(img) {
    img.classList.remove('loading');
    img.classList.add('error');

    // Try fallback sources
    if (img.dataset.fallback) {
      img.src = img.dataset.fallback;
      return;
    }

    // Create error placeholder
    this._createErrorPlaceholder(img);
  }

  /**
   * Create error placeholder
   * @param {HTMLImageElement} img - Image element
   * @private
   */
  _createErrorPlaceholder(img) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'image-error';
    errorDiv.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 15"></polyline>
      </svg>
      <p>Image unavailable</p>
    `;

    img.parentNode?.replaceChild(errorDiv, img);
  }

  /**
   * Fallback method to load all images immediately
   * @private
   */
  _loadAllImagesFallback() {
    document.querySelectorAll('img[data-src]').forEach((img) => {
      this._loadImage(img);
    });
  }

  /**
   * Preload an image
   * @param {string} src - Image source URL
   * @returns {Promise<Object>} Image metadata
   */
  preloadImage(src) {
    return new Promise((resolve, reject) => {
      if (this.imageCache.has(src)) {
        resolve(this.imageCache.get(src));
        return;
      }

      const img = new Image();
      img.onload = () =>
        resolve({
          src,
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height
        });
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      size: this.imageCache.size,
      loadedCount: this.loadedImages.size,
      webPSupported: this.isWebPSupported,
      intersectionObserverSupported: this.isIntersectionObserverSupported
    };
  }

  /**
   * Clear image cache
   */
  clearCache() {
    this.imageCache.clear();
    this.loadedImages.clear();
  }

  /**
   * Destroy observer and cleanup
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.clearCache();
  }
}

// Auto-initialize (browser environment only)
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.imageOptimizer = new ImageOptimizer();
    });
  } else {
    window.imageOptimizer = new ImageOptimizer();
  }
}

// Export for module usage
export default ImageOptimizer;
