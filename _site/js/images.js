/**
 * Image Optimization Module
 * Handles responsive images, lazy loading, and WebP support
 */

'use strict';

class ImageOptimizer {
  constructor() {
    this.observer = null;
    this.imageCache = new Map();
    this.isWebPSupported = this.checkWebPSupport();
    this.isIntersectionObserverSupported = 'IntersectionObserver' in window;
    
    this.init();
  }

  init() {
    // Initialize lazy loading for all images
    this.initLazyLoading();
    
    // Optimize existing images
    this.optimizeExistingImages();
    
    // Setup responsive image handling
    this.setupResponsiveImages();
    
    // Handle image errors
    this.setupErrorHandling();
    
    console.log('Image optimizer initialized');
  }

  checkWebPSupport() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  initLazyLoading() {
    if (!this.isIntersectionObserverSupported) {
      this.loadAllImages();
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    // Observe all images with data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
      this.observer.observe(img);
      this.addPlaceholders(img);
    });
  }

  addPlaceholders(img) {
    // Add loading state
    img.classList.add('loading');
    
    // Create blur-up placeholder
    if (img.dataset.placeholder || img.dataset.blur) {
      this.createBlurPlaceholder(img);
    } else {
      this.createSimplePlaceholder(img);
    }
  }

  createBlurPlaceholder(img) {
    const placeholder = document.createElement('div');
    placeholder.className = 'image-placeholder blur-placeholder';
    
    // Use provided blur hash or create simple gradient
    const blurHash = img.dataset.blur;
    if (blurHash) {
      // In a real implementation, you'd decode the blur hash
      placeholder.style.background = `linear-gradient(135deg, #f0f0f0, #e0e0e0)`;
    } else {
      placeholder.style.background = `linear-gradient(135deg, #f8f9fa, #e9ecef)`;
    }
    
    // Set dimensions to prevent layout shift
    const width = img.dataset.width || img.width || '100%';
    const height = img.dataset.height || img.height || 'auto';
    placeholder.style.paddingBottom = img.dataset.aspectRatio || '0';
    
    // Insert before image
    img.parentNode.insertBefore(placeholder, img);
    img.placeholder = placeholder;
    
    // Set aspect ratio if provided
    if (img.dataset.aspectRatio) {
      img.style.aspectRatio = img.dataset.aspectRatio;
    }
  }

  createSimplePlaceholder(img) {
    img.classList.add('loading');
    
    // Set dimensions to prevent layout shift
    if (img.dataset.width) img.style.width = img.dataset.width;
    if (img.dataset.height) img.style.height = img.dataset.height;
    if (img.dataset.aspectRatio) img.style.aspectRatio = img.dataset.aspectRatio;
  }

  async loadImage(img) {
    const src = this.getOptimizedSrc(img);
    
    if (!src) return;
    
    try {
      // Preload image
      const tempImg = new Image();
      
      tempImg.onload = () => {
        // Apply loaded image
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
      };
      
      tempImg.onerror = () => {
        this.handleImageError(img);
      };
      
      tempImg.src = src;
      
    } catch (error) {
      console.error('Failed to load image:', error);
      this.handleImageError(img);
    }
  }

  getOptimizedSrc(img) {
    let src = img.dataset.src || img.src;
    if (!src) return null;
    
    // Handle WebP based on support
    if (this.isWebPSupported) {
      // Prefer WebP version if available
      const webpSrc = this.getWebPSrc(src);
      if (webpSrc) return webpSrc;
    }
    
    // Handle responsive images
    if (img.dataset.srcset) {
      return this.getResponsiveSrc(img);
    }
    
    return src;
  }

  getWebPSrc(originalSrc) {
    // Try different WebP URL patterns
    const webpPatterns = [
      originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp'),
      originalSrc.replace(/(\.[^.]+)$/, '.webp$1'),
      originalSrc.replace(/\/upload\//, '/upload/f_webp/')
    ];
    
    return webpPatterns[0]; // Return first pattern
  }

  getResponsiveSrc(img) {
    const srcset = img.dataset.srcset;
    if (!srcset) return img.dataset.src;
    
    // Get current image container width
    const containerWidth = img.parentElement?.offsetWidth || window.innerWidth;
    
    // Parse srcset
    const sources = srcset.split(',').map(source => {
      const [url, width] = source.trim().split(' ');
      return {
        url: url.trim(),
        width: parseInt(width.replace('w', ''))
      };
    });
    
    // Select appropriate size
    const idealWidth = containerWidth * (window.devicePixelRatio || 1);
    const selected = sources.reduce((prev, curr) => {
      if (!prev) return curr;
      return Math.abs(curr.width - idealWidth) < Math.abs(prev.width - idealWidth) ? curr : prev;
    }, null);
    
    return selected ? selected.url : sources[0].url;
  }

  optimizeExistingImages() {
    // Add proper loading attributes
    document.querySelectorAll('img:not([loading])').forEach(img => {
      img.loading = 'lazy';
      img.decoding = 'async';
    });
    
    // Add proper alt text if missing
    document.querySelectorAll('img:not([alt])').forEach(img => {
      // Try to infer alt text from context
      const parentFigcaption = img.closest('figure')?.querySelector('figcaption');
      const parentHeading = img.closest('section, article')?.querySelector('h1, h2, h3, h4, h5, h6');
      
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

  setupResponsiveImages() {
    // Create responsive image containers
    document.querySelectorAll('img[data-sizes]').forEach(img => {
      img.sizes = img.dataset.sizes;
    });
    
    // Handle picture elements
    document.querySelectorAll('picture').forEach(picture => {
      this.optimizePictureElement(picture);
    });
  }

  optimizePictureElement(picture) {
    // Add WebP sources if supported
    if (this.isWebPSupported) {
      const existingSources = Array.from(picture.querySelectorAll('source'));
      
      existingSources.forEach(source => {
        const webpSrcset = this.getWebPSrcSet(source.srcset);
        if (webpSrcset && !this.hasWebPSource(picture)) {
          const webpSource = document.createElement('source');
          webpSource.type = 'image/webp';
          webpSource.srcset = webpSrcset;
          webpSource.sizes = source.sizes;
          picture.insertBefore(webpSource, source);
        }
      });
    }
  }

  getWebPSrcSet(srcset) {
    // Convert each source in srcset to WebP
    return srcset
      .split(',')
      .map(source => {
        const [url, descriptor] = source.trim().split(' ');
        const webpUrl = this.getWebPSrc(url);
        return webpUrl ? `${webpUrl} ${descriptor}` : null;
      })
      .filter(Boolean)
      .join(', ');
  }

  hasWebPSource(picture) {
    return Array.from(picture.querySelectorAll('source')).some(source => 
      source.type === 'image/webp'
    );
  }

  setupErrorHandling() {
    document.addEventListener('error', (e) => {
      if (e.target.tagName === 'IMG') {
        this.handleImageError(e.target);
      }
    }, true);
  }

  handleImageError(img) {
    img.classList.remove('loading');
    img.classList.add('error');
    
    // Try fallback sources
    if (img.dataset.fallback) {
      img.src = img.dataset.fallback;
      return;
    }
    
    // Create error placeholder
    this.createErrorPlaceholder(img);
  }

  createErrorPlaceholder(img) {
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
    
    // Replace image with error placeholder
    if (img.parentNode) {
      img.parentNode.replaceChild(errorDiv, img);
    }
  }

  loadAllImages() {
    // Fallback for browsers without IntersectionObserver
    document.querySelectorAll('img[data-src]').forEach(img => {
      this.loadImage(img);
    });
  }

  // Public methods
  preloadImage(src) {
    return new Promise((resolve, reject) => {
      if (this.imageCache.has(src)) {
        resolve(this.imageCache.get(src));
        return;
      }
      
      const img = new Image();
      img.onload = () => resolve({
        src,
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height
      });
      img.onerror = reject;
      img.src = src;
    });
  }

  getCacheStats() {
    return {
      size: this.imageCache.size,
      webPSupported: this.isWebPSupported,
      intersectionObserverSupported: this.isIntersectionObserverSupported
    };
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.imageCache.clear();
  }
}

// Initialize image optimizer
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.imageOptimizer = new ImageOptimizer();
  });
} else {
  window.imageOptimizer = new ImageOptimizer();
}

// Export for global access
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageOptimizer;
}