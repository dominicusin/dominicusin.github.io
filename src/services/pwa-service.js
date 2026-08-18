/**
 * @fileoverview PWA Service - Refactored ES6 Module
 * @module services/pwa-service
 * @description Progressive Web App functionality including service worker,
 * offline support, install prompts, and background sync
 */

import { LocalStorage } from '../utils/storage.js';
import { VectorStore } from './vector-store.js';

/**
 * PWA Service Configuration
 * @type {Object}
 */
const PWA_CONFIG = {
  swUrl: '/sw.js',
  manifestUrl: '/manifest.json',
  enableInstallPrompt: true,
  enableBackgroundSync: true,
  enableOfflineAnalytics: true,
  cacheVersion: 'v1',
  installPromptDelay: 2000,
  installBannerTimeout: 10000
};

/**
 * PWAService - Progressive Web App management
 * @class
 */
export class PWAService {
  /**
   * Create PWAService instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = { ...PWA_CONFIG, ...options };
    this.storage = new LocalStorage('pwa_state');
    
    this.state = {
      deferredPrompt: null,
      isOffline: !navigator.onLine,
      swRegistration: null,
      isInstalled: false,
      updateAvailable: false
    };

    this.elements = {};
    this.offlineQueue = [];
    this.vectorStore = new VectorStore();
    
    // Bind methods
    this.handleOnline = this.handleOnline.bind(this);
    this.handleOffline = this.handleOffline.bind(this);
  }

  /**
   * Initialize PWA system
   * @returns {Promise<void>}
   */
  async init() {
    await Promise.all([
      this.checkInstallStatus(),
      this.setupServiceWorker(),
      this.setupConnectivityListener()
    ]);

    if (this.options.enableInstallPrompt) {
      this.setupInstallPrompt();
    }

    if (this.options.enableBackgroundSync) {
      this.setupBackgroundSync();
    }

    // Warm the offline vector-search cache (IndexedDB) when online.
    this.warmVectorCache();

    this.log('PWAService initialized');
  }

  /**
   * Check if app is installed
   * @returns {void}
   */
  checkInstallStatus() {
    const displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const iosStandalone = window.navigator.standalone === true;
    const androidWebview = document.referrer?.includes('android-app://');

    this.state.isInstalled = displayModeStandalone || iosStandalone || androidWebview;

    if (this.state.isInstalled) {
      this.trackEvent('app_launched', { mode: 'installed' });
    }

    return Promise.resolve();
  }

  /**
   * Register service worker
   * @returns {Promise<ServiceWorkerRegistration|null>}
   */
  async setupServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      this.warn('Service Workers not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register(this.options.swUrl, {
        scope: '/',
        updateViaCache: 'none'
      });

      this.state.swRegistration = registration;
      this.log('Service Worker registered', { scope: registration.scope });

      this.setupUpdateListener(registration);
      return registration;
    } catch (error) {
      this.error('SW registration failed', error);
      return null;
    }
  }

  /**
   * Listen for SW updates
   * @param {ServiceWorkerRegistration} registration - SW registration
   * @returns {void}
   */
  setupUpdateListener(registration) {
    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing;
      
      if (!installingWorker) return;

      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
          this.state.updateAvailable = true;
          this.showUpdateNotification();
          this.trackEvent('sw_update_available');
        }
      });
    });
  }

  /**
   * Setup install prompt handlers
   * @returns {void}
   */
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.state.deferredPrompt = e;
      this.log('Install prompt available');
      
      // Delay showing banner slightly
      setTimeout(() => this.showInstallBanner(), this.options.installPromptDelay);
    });

    window.addEventListener('appinstalled', () => {
      this.state.deferredPrompt = null;
      this.hideInstallBanner();
      this.trackEvent('app_installed');
      this.log('App installed successfully');
    });
  }

  /**
   * Setup online/offline listeners
   * @returns {void}
   */
  setupConnectivityListener() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Set initial state
    this.state.isOffline = !navigator.onLine;
  }

  /**
   * Handle online event
   * @returns {void}
   */
  handleOnline() {
    this.state.isOffline = false;
    this.hideOfflineMessage();
    this.syncOfflineActions();
    this.trackEvent('connectivity_restored');
  }

  /**
   * Handle offline event
   * @returns {void}
   */
  handleOffline() {
    this.state.isOffline = true;
    this.showOfflineMessage();
    this.trackEvent('connectivity_lost');
  }

  /**
   * Setup background sync
   * @returns {Promise<void>}
   */
  async setupBackgroundSync() {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
      this.warn('Background Sync not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('background-sync');
      this.log('Background Sync registered');
    } catch (error) {
      this.error('Background Sync registration failed', error);
    }
  }

  /**
   * Warm the offline vector-search cache.
   * Fetches the search index, builds TF-IDF vectors for every post, and stores
   * them in IndexedDB so semantic search keeps working offline. No-op when
   * offline or when IndexedDB is unavailable (falls back to in-memory).
   * @returns {Promise<void>}
   */
  async warmVectorCache() {
    if (this.state.isOffline) return;
    try {
      const { VectorSearch } = await import('../modules/vector-search.js');
      const response = await fetch('/index.json');
      if (!response.ok) return;
      const data = await response.json();
      const posts = Array.isArray(data)
        ? data
        : (data.posts || data.entries || data.results || []);
      if (!posts.length) return;

      const vs = new VectorSearch(posts);
      const records = posts.map((post, idx) => ({
        id: String(idx),
        url: post.url || '',
        title: post.title || '',
        vector: [...vs.documents[idx].vector.entries()],
        post
      }));
      await this.vectorStore.bulkPut(records);
      this.log('Vector search cache warmed', { count: records.length });
    } catch (error) {
      this.warn('Vector cache warm failed', error);
    }
  }

  /**
   * Show install banner
   * @returns {void}
   */
  showInstallBanner() {
    if (!this.state.deferredPrompt) return;

    // Remove existing banner
    this.hideInstallBanner();

    const banner = document.createElement('div');
    banner.className = 'pwa-install-banner';
    banner.setAttribute('role', 'alertdialog');
    banner.setAttribute('aria-label', 'Install application');
    
    banner.innerHTML = `
      <div class="pwa-install-content">
        <div class="pwa-install-info">
          <div class="pwa-install-icon">
            <img src="/assets/images/icon-192.png" alt="App Icon" />
          </div>
          <div class="pwa-install-text">
            <h3>Install Engineering Blog</h3>
            <p>Get the best experience with offline access</p>
          </div>
        </div>
        <div class="pwa-install-actions">
          <button class="pwa-install-btn" id="pwa-install" aria-label="Install application">
            <span class="install-icon">📱</span>
            <span>Install</span>
          </button>
          <button class="pwa-install-dismiss" id="pwa-dismiss" aria-label="Dismiss">
            <span>✕</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);
    this.bindInstallEvents(banner);

    // Auto-hide after timeout
    this.installBannerTimer = setTimeout(() => {
      this.hideInstallBanner();
    }, this.options.installBannerTimeout);
  }

  /**
   * Bind install banner events
   * @param {HTMLElement} banner - Banner element
   * @returns {void}
   */
  bindInstallEvents(banner) {
    const installBtn = banner.querySelector('#pwa-install');
    const dismissBtn = banner.querySelector('#pwa-dismiss');

    installBtn?.addEventListener('click', async () => {
      await this.promptInstall();
    });

    dismissBtn?.addEventListener('click', () => {
      this.hideInstallBanner();
      this.storage.set('install_dismissed', Date.now());
    });
  }

  /**
   * Prompt user to install
   * @returns {Promise<boolean>} Success status
   */
  async promptInstall() {
    if (!this.state.deferredPrompt) return false;

    try {
      const { outcome } = await this.state.deferredPrompt.prompt();
      this.state.deferredPrompt = null;
      
      this.trackEvent('install_prompt_response', { outcome });
      this.hideInstallBanner();
      
      return outcome === 'accepted';
    } catch (error) {
      this.error('Install prompt failed', error);
      return false;
    }
  }

  /**
   * Hide install banner
   * @returns {void}
   */
  hideInstallBanner() {
    const banner = document.querySelector('.pwa-install-banner');
    if (banner) {
      banner.remove();
    }
    
    if (this.installBannerTimer) {
      clearTimeout(this.installBannerTimer);
    }
  }

  /**
   * Show offline message
   * @returns {void}
   */
  showOfflineMessage() {
    const existingMessage = document.querySelector('.pwa-offline-message');
    if (existingMessage) return;

    const message = document.createElement('div');
    message.className = 'pwa-offline-message';
    message.setAttribute('role', 'status');
    message.setAttribute('aria-live', 'polite');
    
    message.innerHTML = `
      <div class="offline-content">
        <span class="offline-icon">📡</span>
        <span>You're offline. Some features may be limited.</span>
      </div>
    `;

    document.body.appendChild(message);
    this.elements.offlineMessage = message;
  }

  /**
   * Hide offline message
   * @returns {void}
   */
  hideOfflineMessage() {
    if (this.elements.offlineMessage) {
      this.elements.offlineMessage.remove();
      this.elements.offlineMessage = null;
    }
  }

  /**
   * Queue action for offline sync
   * @param {Object} action - Action to queue
   * @returns {void}
   */
  queueOfflineAction(action) {
    this.offlineQueue.push({
      ...action,
      timestamp: Date.now(),
      queued: this.state.isOffline
    });

    if (this.options.enableOfflineAnalytics) {
      this.storage.set('offline_queue', this.offlineQueue);
    }
  }

  /**
   * Sync offline actions when back online
   * @returns {Promise<void>}
   */
  async syncOfflineActions() {
    if (this.offlineQueue.length === 0) return;

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const action of queue) {
      try {
        await this.syncAction(action);
      } catch (error) {
        this.error('Failed to sync action', { action, error });
        this.offlineQueue.push(action); // Re-queue failed action
      }
    }

    if (this.options.enableOfflineAnalytics) {
      this.storage.set('offline_queue', this.offlineQueue);
    }
  }

  /**
   * Sync individual action
   * @param {Object} action - Action to sync
   * @returns {Promise<void>}
   */
  async syncAction(action) {
    const response = await fetch(action.url, {
      method: action.method || 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action.data),
      keepalive: true
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }
  }

  /**
   * Show update notification
   * @returns {void}
   */
  showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'pwa-update-notification';
    notification.setAttribute('role', 'alert');
    
    notification.innerHTML = `
      <div class="update-content">
        <span>A new version is available!</span>
        <button class="update-btn" id="pwa-update">Refresh</button>
      </div>
    `;

    document.body.appendChild(notification);

    document.querySelector('#pwa-update')?.addEventListener('click', () => {
      window.location.reload();
    });
  }

  /**
   * Track PWA event
   * @param {string} eventName - Event name
   * @param {Object} data - Event data
   * @returns {void}
   */
  trackEvent(eventName, data = {}) {
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, {
        event_category: 'pwa',
        ...data
      });
    }

    // Also send to analytics endpoint if available
    if (navigator.sendBeacon) {
      const payload = JSON.stringify({
        event: eventName,
        category: 'pwa',
        data,
        timestamp: Date.now()
      });
      
      navigator.sendBeacon('/api/analytics', payload);
    }
  }

  /**
   * Get installation status
   * @returns {boolean} True if installed
   */
  isAppInstalled() {
    return this.state.isInstalled;
  }

  /**
   * Get offline status
   * @returns {boolean} True if offline
   */
  isOffline() {
    return this.state.isOffline;
  }

  /**
   * Get service worker registration
   * @returns {ServiceWorkerRegistration|null}
   */
  getRegistration() {
    return this.state.swRegistration;
  }

  /**
   * Manual SW update check
   * @returns {Promise<void>}
   */
  async checkForUpdates() {
    if (!this.state.swRegistration) return;

    try {
      await this.state.swRegistration.update();
      this.log('Checked for SW updates');
    } catch (error) {
      this.error('SW update check failed', error);
    }
  }

  /**
   * Unregister service worker
   * @returns {Promise<boolean>}
   */
  async unregisterServiceWorker() {
    if (!this.state.swRegistration) return false;

    try {
      await this.state.swRegistration.unregister();
      this.state.swRegistration = null;
      this.log('Service Worker unregistered');
      return true;
    } catch (error) {
      this.error('SW unregistration failed', error);
      return false;
    }
  }

  /**
   * Logging helper
   * @param {string} message - Log message
   * @param {any} data - Additional data
   * @returns {void}
   */
  log(message, data = null) {
    if (this.options.debugMode) {
      console.log(`[PWA] ${message}`, data || '');
    }
  }

  /**
   * Warning helper
   * @param {string} message - Warning message
   * @param {any} data - Additional data
   * @returns {void}
   */
  warn(message, data = null) {
    if (this.options.debugMode) {
      console.warn(`[PWA] ${message}`, data || '');
    }
  }

  /**
   * Error helper
   * @param {string} message - Error message
   * @param {Error} error - Error object
   * @returns {void}
   */
  error(message, error = null) {
    if (this.options.debugMode) {
      console.error(`[PWA] ${message}`, error || '');
    }
  }

  /**
   * Destroy PWA service and cleanup
   * @returns {void}
   */
  destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    
    this.hideInstallBanner();
    this.hideOfflineMessage();
    
    if (this.installBannerTimer) {
      clearTimeout(this.installBannerTimer);
    }
  }
}

// Auto-initialize on DOM ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    if ('serviceWorker' in navigator) {
      window.pwaService = new PWAService({
        debugMode: window.pwaDebug || false
      });
      
      await window.pwaService.init();
    }
  });
}

// Export for module usage
export default PWAService;
