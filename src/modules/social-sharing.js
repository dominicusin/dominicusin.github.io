/**
 * Social Sharing System - ES6 Refactored Version
 * Features: Multiple platforms, share counts, custom styling, analytics
 * 
 * @module modules/social-sharing
 * @exports SocialSharing
 */

'use strict';

/**
 * Platform configurations
 * @type {Object}
 */
const PLATFORM_CONFIGS = {
  twitter: {
    name: 'Twitter',
    icon: '𝕏',
    color: '#000000',
    url: (data) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(data.title)}`,
    shareUrl: (data) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(data.url)}`
  },
  linkedin: {
    name: 'LinkedIn',
    icon: 'in',
    color: '#0A66C2',
    url: (data) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.url)}`,
    shareUrl: (data) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.url)}`
  },
  facebook: {
    name: 'Facebook',
    icon: 'f',
    color: '#1877F2',
    url: (data) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`,
    shareUrl: (data) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`
  },
  reddit: {
    name: 'Reddit',
    icon: '⊂',
    color: '#FF4500',
    url: (data) => `https://www.reddit.com/submit?url=${encodeURIComponent(data.url)}&title=${encodeURIComponent(data.title)}`,
    shareUrl: (data) => `https://www.reddit.com/submit?url=${encodeURIComponent(data.url)}`
  },
  hackernews: {
    name: 'Hacker News',
    icon: 'Y',
    color: '#FF6600',
    url: (data) => `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(data.url)}&t=${encodeURIComponent(data.title)}`,
    shareUrl: (data) => `https://news.ycombinator.com/from?site=${encodeURIComponent(new URL(data.url).hostname)}`
  },
  email: {
    name: 'Email',
    icon: '✉',
    color: '#666666',
    url: (data) => `mailto:?subject=${encodeURIComponent(data.title)}&body=${encodeURIComponent(data.url)}`,
    shareUrl: null
  }
};

/**
 * Default configuration
 * @type {Object}
 */
const DEFAULT_CONFIG = {
  container: '.social-sharing',
  platforms: ['twitter', 'linkedin', 'facebook', 'reddit', 'hackernews', 'email'],
  showCounts: true,
  showLabels: true,
  enableAnalytics: true,
  cacheTimeout: 300000, // 5 minutes
  apiEndpoint: '/api/share-counts'
};

/**
 * Social Sharing Class
 * Provides social media sharing functionality with analytics
 */
export class SocialSharing {
  /**
   * Create a SocialSharing instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    /** @public */
    this.config = { ...DEFAULT_CONFIG, ...options };

    /** @private */
    this.shareCounts = {};

    /** @private */
    this.shareData = null;

    /** @private */
    this.container = null;

    /** @private */
    this.cache = new Map();

    this._init();
  }

  /**
   * Initialize social sharing
   * @private
   */
  _init() {
    this.container = document.querySelector(this.config.container);
    if (!this.container) return;

    this._setupShareData();
    this._render();
    this._bindEvents();

    if (this.config.showCounts) {
      this._loadShareCounts();
    }
  }

  /**
   * Setup share data from meta tags
   * @private
   */
  _setupShareData() {
    this.shareData = {
      url: window.location.href.split('#')[0],
      title: document.title,
      description: this._getMetaDescription(),
      image: this._getMetaImage(),
      author: this._getMetaAuthor(),
      siteName: this._getMetaSiteName()
    };
  }

  /**
   * Get meta description
   * @returns {string} Meta description content
   * @private
   */
  _getMetaDescription() {
    const meta = document.querySelector('meta[name="description"]');
    return meta?.getAttribute('content') || '';
  }

  /**
   * Get meta image (Open Graph)
   * @returns {string} Image URL
   * @private
   */
  _getMetaImage() {
    const meta = document.querySelector('meta[property="og:image"]');
    return meta?.getAttribute('content') || '';
  }

  /**
   * Get meta author
   * @returns {string} Author name
   * @private
   */
  _getMetaAuthor() {
    const meta = document.querySelector('meta[name="author"]');
    return meta?.getAttribute('content') || '';
  }

  /**
   * Get meta site name
   * @returns {string} Site name
   * @private
   */
  _getMetaSiteName() {
    const meta = document.querySelector('meta[property="og:site_name"]');
    return meta?.getAttribute('content') || '';
  }

  /**
   * Get platform configurations
   * @returns {Array} Array of platform configs
   * @private
   */
  _getPlatformConfigs() {
    return this.config.platforms
      .map((platform) => PLATFORM_CONFIGS[platform])
      .filter(Boolean);
  }

  /**
   * Render social sharing buttons
   * @private
   */
  _render() {
    const platforms = this._getPlatformConfigs();

    this.container.innerHTML = `
      <div class="social-sharing-container" role="region" aria-label="Share this article">
        <div class="social-sharing-header">
          <h4 data-i18n="social.share">Share this article</h4>
        </div>
        <div class="social-sharing-buttons">
          ${platforms.map((platform) => this._renderShareButton(platform)).join('')}
        </div>
        ${this.config.showCounts ? `
          <div class="social-sharing-stats">
            <span class="total-shares" data-i18n="social.total_shares">Total shares:</span>
            <span class="total-count" id="total-share-count">0</span>
          </div>
        ` : ''}
      </div>
    `;

    if (this.config.showCounts) {
      this._updateTotalShares();
    }
  }

  /**
   * Render individual share button
   * @param {Object} platform - Platform configuration
   * @returns {string} HTML string
   * @private
   */
  _renderShareButton(platform) {
    return `
      <button
        class="share-button share-button--${platform.name.toLowerCase()}"
        data-platform="${platform.name.toLowerCase()}"
        data-url="${encodeURIComponent(this.shareData.url)}"
        aria-label="Share on ${platform.name}"
        title="Share on ${platform.name}"
        style="--share-color: ${platform.color}"
      >
        <span class="share-icon">${platform.icon}</span>
        ${this.config.showLabels ? `<span class="share-label">${platform.name}</span>` : ''}
        ${this.config.showCounts && this.shareCounts[platform.name] ? `
          <span class="share-count" data-platform="${platform.name.toLowerCase()}">
            ${this._formatCount(this.shareCounts[platform.name])}
          </span>
        ` : ''}
      </button>
    `;
  }

  /**
   * Format share count number
   * @param {number} count - Share count
   * @returns {string} Formatted count
   * @private
   */
  _formatCount(count) {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }

  /**
   * Bind event listeners
   * @private
   */
  _bindEvents() {
    this.container.addEventListener('click', (e) => {
      const button = e.target.closest('.share-button');
      if (button) {
        e.preventDefault();
        const platform = button.dataset.platform;
        this._handleShare(platform);
      }
    });

    // Web Share API fallback
    if (navigator.share) {
      this._setupWebShare();
    }
  }

  /**
   * Setup Web Share API
   * @private
   */
  _setupWebShare() {
    const webShareButton = this.container.querySelector('.share-button--web');
    if (webShareButton) {
      webShareButton.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          await navigator.share({
            title: this.shareData.title,
            text: this.shareData.description,
            url: this.shareData.url
          });
          this._trackShare('web_share');
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Web share failed:', error);
          }
        }
      });
    }
  }

  /**
   * Handle share click
   * @param {string} platform - Platform name
   * @private
   */
  _handleShare(platform) {
    const platformConfig = PLATFORM_CONFIGS[platform];
    if (!platformConfig) return;

    const shareUrl = platformConfig.url(this.shareData);

    // Open share dialog
    const width = 600;
    const height = 400;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    window.open(
      shareUrl,
      `share_${platform}`,
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no`
    );

    // Track share event
    this._trackShare(platform);

    // Update local count
    this._incrementShareCount(platform);
  }

  /**
   * Track share event
   * @param {string} platform - Platform name
   * @private
   */
  _trackShare(platform) {
    if (!this.config.enableAnalytics) return;

    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'social_share', {
        event_category: 'engagement',
        event_label: platform,
        value: 1
      });
    }

    // Custom analytics
    this._sendCustomAnalytics('social_share', {
      platform,
      url: this.shareData.url,
      timestamp: Date.now()
    });
  }

  /**
   * Send custom analytics event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   * @private
   */
  _sendCustomAnalytics(event, data) {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        '/api/analytics',
        JSON.stringify({ event, data })
      );
    } else {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data }),
        keepalive: true
      }).catch(() => {});
    }
  }

  /**
   * Load share counts from API
   * @private
   */
  async _loadShareCounts() {
    try {
      // Check cache first
      const cachedData = this.cache.get('shareCounts');
      if (cachedData && Date.now() - cachedData.timestamp < this.config.cacheTimeout) {
        this.shareCounts = cachedData.data;
        this._updateShareCountsUI();
        return;
      }

      // Fetch from API
      const response = await fetch(
        `${this.config.apiEndpoint}?url=${encodeURIComponent(this.shareData.url)}`
      );

      if (!response.ok) throw new Error('Failed to load share counts');

      const data = await response.json();
      this.shareCounts = data.counts || {};

      // Cache the data
      this.cache.set('shareCounts', {
        data: this.shareCounts,
        timestamp: Date.now()
      });

      this._updateShareCountsUI();
    } catch (error) {
      console.warn('Failed to load share counts:', error);
      this._hideShareCounts();
    }
  }

  /**
   * Update share counts UI
   * @private
   */
  _updateShareCountsUI() {
    Object.entries(this.shareCounts).forEach(([platform, count]) => {
      const countElement = this.container.querySelector(
        `.share-count[data-platform="${platform.toLowerCase()}"]`
      );
      if (countElement) {
        countElement.textContent = this._formatCount(count);
      }
    });

    this._updateTotalShares();
  }

  /**
   * Update total shares count
   * @private
   */
  _updateTotalShares() {
    const totalElement = this.container.querySelector('#total-share-count');
    if (totalElement) {
      const total = Object.values(this.shareCounts).reduce(
        (sum, count) => sum + count,
        0
      );
      totalElement.textContent = this._formatCount(total);
    }
  }

  /**
   * Hide share counts on error
   * @private
   */
  _hideShareCounts() {
    this.container.querySelectorAll('.share-count').forEach((el) => {
      el.style.display = 'none';
    });
    const statsElement = this.container.querySelector('.social-sharing-stats');
    if (statsElement) {
      statsElement.style.display = 'none';
    }
  }

  /**
   * Increment local share count
   * @param {string} platform - Platform name
   * @private
   */
  _incrementShareCount(platform) {
    if (!this.shareCounts[platform]) {
      this.shareCounts[platform] = 0;
    }
    this.shareCounts[platform]++;
    this._updateShareCountsUI();
  }

  /**
   * Copy link to clipboard
   */
  async copyLinkToClipboard() {
    try {
      await navigator.clipboard.writeText(this.shareData.url);

      // Show success message
      this._showToast('Link copied to clipboard!');

      // Track event
      this._trackShare('clipboard');
    } catch (error) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = this.shareData.url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();

      try {
        document.execCommand('copy');
        this._showToast('Link copied to clipboard!');
        this._trackShare('clipboard');
      } catch (err) {
        this._showToast('Failed to copy link');
      }

      document.body.removeChild(textarea);
    }
  }

  /**
   * Show toast notification
   * @param {string} message - Toast message
   * @private
   */
  _showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'share-toast';
    toast.textContent = message;
    toast.setAttribute('role', 'alert');

    document.body.appendChild(toast);

    // Trigger reflow for animation
    toast.offsetHeight;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  /**
   * Get current share data
   * @returns {Object} Share data
   */
  getShareData() {
    return { ...this.shareData };
  }

  /**
   * Update share data
   * @param {Object} newData - New share data
   */
  updateShareData(newData) {
    this.shareData = { ...this.shareData, ...newData };
    this._render();
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.clearCache();
  }
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.socialSharing = new SocialSharing();
  });
} else {
  window.socialSharing = new SocialSharing();
}

// Export for module usage
export default SocialSharing;
