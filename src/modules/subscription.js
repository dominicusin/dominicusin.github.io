/**
 * @fileoverview Subscription System module for RSS and Email subscriptions
 * @module modules/subscription
 */

/**
 * Subscription System - Handles RSS and Email subscriptions
 */
export class SubscriptionSystem {
  /**
   * Create SubscriptionSystem instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      rssUrl: options.rssUrl || '/feed.xml',
      subscriptionEndpoint: options.subscriptionEndpoint || '/api/subscribe',
      verificationEndpoint: options.verificationEndpoint || '/api/verify-email',
      unsubscribeEndpoint: options.unsubscribeEndpoint || '/api/unsubscribe',
      ...options
    };

    this.init();
  }

  /**
   * Initialize subscription system
   */
  init() {
    this.renderSubscriptionForms();
    this.bindEvents();
    this.handleURLParameters();
  }

  /**
   * Render subscription forms
   */
  renderSubscriptionForms() {
    const containers = document.querySelectorAll('.subscription-container');

    containers.forEach(container => {
      if (!container.hasAttribute('data-rendered')) {
        container.innerHTML = this.getSubscriptionFormHTML();
        container.setAttribute('data-rendered', 'true');
      }
    });

    if (containers.length === 0) {
      this.createFloatingSubscriptionWidget();
    }
  }

  /**
   * Get subscription form HTML
   * @returns {string} Form HTML
   */
  getSubscriptionFormHTML() {
    return `
      <div class="subscription-system">
        <div class="subscription-header">
          <h3 data-i18n="subscription.title">Subscribe to Updates</h3>
          <p class="subscription-description" data-i18n="subscription.description">
            Get the latest articles delivered to your inbox
          </p>
        </div>

        <div class="subscription-forms">
          <!-- Email Subscription -->
          <div class="subscription-form email-subscription">
            <div class="form-header">
              <h4 data-i18n="subscription.email_title">Email Newsletter</h4>
              <p data-i18n="subscription.email_description">
                Weekly digest of new articles and updates
              </p>
            </div>

            <form class="email-form" data-type="email">
              <div class="form-group">
                <input
                  type="email"
                  name="email"
                  class="form-input"
                  placeholder="your@email.com"
                  data-i18n-placeholder="subscription.email_placeholder"
                  required
                />
              </div>

              <div class="form-group">
                <input
                  type="text"
                  name="name"
                  class="form-input"
                  placeholder="Your name (optional)"
                  data-i18n-placeholder="subscription.name_placeholder"
                />
              </div>

              <div class="form-group form-preferences">
                <label class="checkbox-label">
                  <input type="checkbox" name="weekly_digest" checked>
                  <span data-i18n="subscription.weekly_digest">Weekly digest</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" name="new_posts" checked>
                  <span data-i18n="subscription.new_posts">New posts</span>
                </label>
              </div>

              <button type="submit" class="btn btn-primary" data-i18n="subscription.subscribe_email">
                Subscribe via Email
              </button>
            </form>
          </div>

          <!-- RSS Subscription -->
          <div class="subscription-form rss-subscription">
            <div class="form-header">
              <h4 data-i18n="subscription.rss_title">RSS Feed</h4>
              <p data-i18n="subscription.rss_description">
                Subscribe in your favorite RSS reader
              </p>
            </div>

            <div class="rss-options">
              <a href="${this.options.rssUrl}" class="rss-link" target="_blank" rel="noopener">
                <span class="rss-icon">📡</span>
                <span data-i18n="subscription.rss_feed">RSS Feed</span>
              </a>

              <button class="btn btn-secondary copy-rss" data-i18n="subscription.copy_rss">
                Copy RSS URL
              </button>
            </div>

            <div class="rss-readers">
              <p class="rss-readers-title" data-i18n="subscription.add_to_reader">
                Add to RSS Reader:
              </p>
              <div class="rss-reader-buttons">
                <button class="reader-btn feedly" data-reader="feedly">
                  <span class="reader-icon">🔖</span>
                  <span>Feedly</span>
                </button>
                <button class="reader-btn inoreader" data-reader="inoreader">
                  <span class="reader-icon">📰</span>
                  <span>Inoreader</span>
                </button>
                <button class="reader-btn feedbin" data-reader="feedbin">
                  <span class="reader-icon">📬</span>
                  <span>Feedbin</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="subscription-status" style="display: none;">
          <div class="status-message"></div>
          <button class="btn btn-secondary close-status" data-i18n="subscription.close">
            Close
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Create floating subscription widget
   */
  createFloatingSubscriptionWidget() {
    const widget = document.createElement('div');
    widget.className = 'floating-subscription';
    widget.innerHTML = `
      <button class="subscription-toggle" data-i18n="subscription.subscribe">
        📧 Subscribe
      </button>
      <div class="subscription-popup">
        ${this.getSubscriptionFormHTML()}
      </div>
    `;
    document.body.appendChild(widget);
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    document.addEventListener('submit', (e) => {
      const form = e.target.closest('form');
      if (form && form.classList.contains('email-form')) {
        e.preventDefault();
        this.handleEmailSubscription(form);
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('copy-rss')) {
        this.copyRSSUrl(e.target);
      }

      if (e.target.closest('.reader-btn')) {
        const button = e.target.closest('.reader-btn');
        this.addToRSSReader(button.dataset.reader);
      }

      if (e.target.classList.contains('subscription-toggle')) {
        this.toggleSubscriptionWidget();
      }

      if (e.target.classList.contains('close-status')) {
        this.hideStatusMessage();
      }
    });

    document.addEventListener('input', (e) => {
      if (e.target.type === 'email') {
        this.validateEmail(e.target);
      }
    });
  }

  /**
   * Handle URL parameters for verification/unsubscribe
   */
  handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('verify') && urlParams.has('token')) {
      this.verifyEmail(urlParams.get('token'));
    }

    if (urlParams.has('unsubscribe') && urlParams.has('email')) {
      this.unsubscribeUser(urlParams.get('email'), urlParams.get('token'));
    }

    if (urlParams.has('subscribed')) {
      this.showStatusMessage('subscription.success', 'success');
    }
  }

  /**
   * Handle email subscription
   * @param {HTMLFormElement} form - Form element
   */
  async handleEmailSubscription(form) {
    const formData = new FormData(form);
    const data = {
      email: formData.get('email'),
      name: formData.get('name') || '',
      preferences: {
        weekly_digest: formData.has('weekly_digest'),
        new_posts: formData.has('new_posts')
      }
    };

    if (!this.isValidEmail(data.email)) {
      this.showStatusMessage('subscription.invalid_email', 'error');
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Subscribing...';

    try {
      const response = await fetch(this.options.subscriptionEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        this.showStatusMessage('subscription.success', 'success');
        form.reset();
        this.trackSubscription('email', data);
      } else {
        this.showStatusMessage(result.message || 'subscription.error', 'error');
      }
    } catch (error) {
      this.showStatusMessage('subscription.network_error', 'error');
      console.error('Subscription error:', error);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }

  /**
   * Verify email with token
   * @param {string} token - Verification token
   */
  async verifyEmail(token) {
    try {
      const response = await fetch(this.options.verificationEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const result = await response.json();

      if (response.ok) {
        this.showStatusMessage('subscription.verified', 'success');
      } else {
        this.showStatusMessage(result.message || 'subscription.verification_error', 'error');
      }

      window.history.replaceState({}, document.title, window.location.pathname);
    } catch {
      this.showStatusMessage('subscription.network_error', 'error');
    }
  }

  /**
   * Unsubscribe user
   * @param {string} email - User email
   * @param {string} token - Unsubscribe token
   */
  async unsubscribeUser(email, token) {
    try {
      const response = await fetch(this.options.unsubscribeEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token })
      });

      const result = await response.json();

      if (response.ok) {
        this.showStatusMessage('subscription.unsubscribed', 'success');
      } else {
        this.showStatusMessage(result.message || 'subscription.unsubscribe_error', 'error');
      }

      window.history.replaceState({}, document.title, window.location.pathname);
    } catch {
      this.showStatusMessage('subscription.network_error', 'error');
    }
  }

  /**
   * Copy RSS URL to clipboard
   * @param {HTMLElement} button - Button element
   */
  async copyRSSUrl(button) {
    try {
      await navigator.clipboard.writeText(window.location.origin + this.options.rssUrl);

      const originalText = button.textContent;
      button.textContent = 'Copied!';
      button.classList.add('success');

      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('success');
      }, 2000);

      this.trackSubscription('rss_copy');
    } catch {} {
      console.error('Failed to copy RSS URL:', error);
      this.showStatusMessage('subscription.copy_error', 'error');
    }
  }

  /**
   * Add feed to RSS reader
   * @param {string} reader - Reader name (feedly, inoreader, feedbin)
   */
  addToRSSReader(reader) {
    const readerUrls = {
      feedly: `https://feedly.com/i/subscription/feed/${encodeURIComponent(window.location.origin + this.options.rssUrl)}`,
      inoreader: `https://www.inoreader.com/?add_feed=${encodeURIComponent(window.location.origin + this.options.rssUrl)}`,
      feedbin: `https://feedbin.me/?subscribe=${encodeURIComponent(window.location.origin + this.options.rssUrl)}`
    };

    const url = readerUrls[reader];
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      this.trackSubscription('rss_reader', { reader });
    }
  }

  /**
   * Toggle subscription widget visibility
   */
  toggleSubscriptionWidget() {
    const popup = document.querySelector('.subscription-popup');
    const toggle = document.querySelector('.subscription-toggle');

    if (popup.style.display === 'block') {
      popup.style.display = 'none';
      toggle.textContent = '📧 Subscribe';
    } else {
      popup.style.display = 'block';
      toggle.textContent = '✕ Close';
    }
  }

  /**
   * Validate email input
   * @param {HTMLInputElement} input - Email input element
   */
  validateEmail(input) {
    const isValid = this.isValidEmail(input.value);
    if (input.value && !isValid) {
      input.classList.add('error');
    } else {
      input.classList.remove('error');
    }
  }

  /**
   * Check if email is valid
   * @param {string} email - Email to validate
   * @returns {boolean} Is valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Show status message
   * @param {string} key - Message key
   * @param {string} type - Message type (success, error, info)
   */
  showStatusMessage(key, type = 'info') {
    const statusDiv = document.querySelector('.subscription-status');
    const messageDiv = statusDiv?.querySelector('.status-message');
    if (!statusDiv || !messageDiv) return;

    const messages = {
      'subscription.success': 'Thank you for subscribing! Please check your email to confirm.',
      'subscription.invalid_email': 'Please enter a valid email address.',
      'subscription.error': 'Subscription failed. Please try again later.',
      'subscription.network_error': 'Network error. Please check your connection.',
      'subscription.verified': 'Email verified successfully! You are now subscribed.',
      'subscription.verification_error': 'Verification failed. Please try again.',
      'subscription.unsubscribed': 'You have been successfully unsubscribed.',
      'subscription.unsubscribe_error': 'Unsubscribe failed. Please contact support.',
      'subscription.copy_error': 'Failed to copy RSS URL.'
    };

    messageDiv.textContent = messages[key] || key;
    statusDiv.className = `subscription-status ${type}`;
    statusDiv.style.display = 'block';

    if (type === 'success') {
      setTimeout(() => this.hideStatusMessage(), 5000);
    }
  }

  /**
   * Hide status message
   */
  hideStatusMessage() {
    const statusDiv = document.querySelector('.subscription-status');
    if (statusDiv) statusDiv.style.display = 'none';

    const popup = document.querySelector('.subscription-popup');
    const toggle = document.querySelector('.subscription-toggle');
    if (popup && toggle) {
      popup.style.display = 'none';
      toggle.textContent = '📧 Subscribe';
    }
  }

  /**
   * Track subscription event
   * @param {string} type - Event type
   * @param {Object} data - Additional data
   */
  trackSubscription(type, data = {}) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'subscription', { method: type, ...data });
    }

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics', JSON.stringify({
        event: 'subscription',
        type,
        data,
        timestamp: Date.now()
      }));
    }
  }

  /**
   * Destroy subscription system
   */
  destroy() {
    const widget = document.querySelector('.floating-subscription');
    if (widget) widget.remove();
  }
}

// Auto-initialize (browser environment only)
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.subscriptionSystem = new SubscriptionSystem({
      rssUrl: '/feed.xml',
      subscriptionEndpoint: '/api/subscribe',
      verificationEndpoint: '/api/verify-email',
      unsubscribeEndpoint: '/api/unsubscribe'
    });
  });
}

// Export for module usage
export default SubscriptionSystem;
