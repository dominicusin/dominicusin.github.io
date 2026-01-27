/**
 * Progressive Web App (PWA) System
 * Features: Offline access, caching, install prompts, background sync
 */

class PWASystem {
    constructor(options = {}) {
        this.options = {
            swUrl: options.swUrl || '/sw.js',
            manifestUrl: options.manifestUrl || '/manifest.json',
            enableInstallPrompt: true,
            enableBackgroundSync: true,
            enableOfflineAnalytics: true,
            ...options
        };
        
        this.deferredPrompt = null;
        this.isOffline = !navigator.onLine;
        this.init();
    }
    
    /**
     * Initialize PWA system
     */
    init() {
        this.setupServiceWorker();
        this.setupInstallPrompt();
        this.setupConnectivityListener();
        this.setupBackgroundSync();
        this.checkInstallStatus();
    }
    
    /**
     * Setup service worker
     */
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register(this.options.swUrl)
                    .then(registration => {
                        console.log('SW registered:', registration);
                        this.swRegistration = registration;
                        
                        // Check for updates
                        registration.addEventListener('updatefound', () => {
                            const installingWorker = registration.installing;
                            installingWorker.addEventListener('statechange', () => {
                                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    this.showUpdateNotification();
                                }
                            });
                        });
                    })
                    .catch(error => {
                        console.error('SW registration failed:', error);
                    });
            });
        }
    }
    
    /**
     * Setup install prompt
     */
    setupInstallPrompt() {
        if (!this.options.enableInstallPrompt) return;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallBanner();
        });
        
        // Listen for app install success
        window.addEventListener('appinstalled', () => {
            this.hideInstallBanner();
            this.trackEvent('app_installed');
        });
    }
    
    /**
     * Setup connectivity listener
     */
    setupConnectivityListener() {
        window.addEventListener('online', () => {
            this.isOffline = false;
            this.hideOfflineMessage();
            this.syncOfflineActions();
        });
        
        window.addEventListener('offline', () => {
            this.isOffline = true;
            this.showOfflineMessage();
        });
    }
    
    /**
     * Setup background sync
     */
    setupBackgroundSync() {
        if (!this.options.enableBackgroundSync) return;
        
        // Register background sync if supported
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            navigator.serviceWorker.ready.then(registration => {
                return registration.sync.register('background-sync');
            }).then(() => {
                console.log('Background sync registered');
            }).catch(error => {
                console.error('Background sync registration failed:', error);
            });
        }
    }
    
    /**
     * Check install status
     */
    checkInstallStatus() {
        // Check if app is installed
        const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                            window.navigator.standalone ||
                            document.referrer.includes('android-app://');
        
        if (isInstalled) {
            this.hideInstallBanner();
            this.trackEvent('app_launched');
        }
    }
    
    /**
     * Show install banner
     */
    showInstallBanner() {
        // Remove existing banner
        this.hideInstallBanner();
        
        const banner = document.createElement('div');
        banner.className = 'pwa-install-banner';
        banner.innerHTML = `
            <div class="pwa-install-content">
                <div class="pwa-install-info">
                    <div class="pwa-install-icon">
                        <img src="/favicon-192.png" alt="App Icon" />
                    </div>
                    <div class="pwa-install-text">
                        <h3>Install Engineering Blog</h3>
                        <p>Get the best experience with offline access</p>
                    </div>
                </div>
                <div class="pwa-install-actions">
                    <button class="pwa-install-btn" id="pwa-install">
                        <span class="install-icon">📱</span>
                        <span>Install</span>
                    </button>
                    <button class="pwa-install-dismiss" id="pwa-dismiss">
                        <span>✕</span>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        // Add event listeners
        document.getElementById('pwa-install').addEventListener('click', () => {
            this.installApp();
        });
        
        document.getElementById('pwa-dismiss').addEventListener('click', () => {
            this.hideInstallBanner();
        });
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            this.hideInstallBanner();
        }, 10000);
    }
    
    /**
     * Hide install banner
     */
    hideInstallBanner() {
        const banner = document.querySelector('.pwa-install-banner');
        if (banner) {
            banner.remove();
        }
    }
    
    /**
     * Install app
     */
    async installApp() {
        if (!this.deferredPrompt) return;
        
        this.deferredPrompt.prompt();
        
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            this.trackEvent('app_install_accepted');
        } else {
            this.trackEvent('app_install_dismissed');
        }
        
        this.deferredPrompt = null;
        this.hideInstallBanner();
    }
    
    /**
     * Show update notification
     */
    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'pwa-update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <div class="update-icon">🔄</div>
                <div class="update-text">
                    <h4>New Version Available</h4>
                    <p>Refresh to get the latest features</p>
                </div>
                <div class="update-actions">
                    <button class="update-btn" id="pwa-update">
                        Refresh
                    </button>
                    <button class="update-dismiss" id="update-dismiss">
                        Dismiss
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Add event listeners
        document.getElementById('pwa-update').addEventListener('click', () => {
            this.updateApp();
        });
        
        document.getElementById('update-dismiss').addEventListener('click', () => {
            this.hideUpdateNotification();
        });
    }
    
    /**
     * Hide update notification
     */
    hideUpdateNotification() {
        const notification = document.querySelector('.pwa-update-notification');
        if (notification) {
            notification.remove();
        }
    }
    
    /**
     * Update app
     */
    updateApp() {
        window.location.reload();
    }
    
    /**
     * Show offline message
     */
    showOfflineMessage() {
        // Remove existing message
        this.hideOfflineMessage();
        
        const offlineMessage = document.createElement('div');
        offlineMessage.className = 'pwa-offline-message';
        offlineMessage.innerHTML = `
            <div class="offline-content">
                <div class="offline-icon">📵</div>
                <div class="offline-text">
                    <h4>You're offline</h4>
                    <p>Some features may be unavailable</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(offlineMessage);
        
        // Show offline content if available
        this.showOfflineContent();
    }
    
    /**
     * Hide offline message
     */
    hideOfflineMessage() {
        const message = document.querySelector('.pwa-offline-message');
        if (message) {
            message.remove();
        }
    }
    
    /**
     * Show offline content
     */
    showOfflineContent() {
        // Add offline class to body
        document.body.classList.add('pwa-offline');
        
        // Show cached content warning
        const cachedContent = document.querySelectorAll('[data-cached="true"]');
        cachedContent.forEach(element => {
            element.classList.add('cached-content');
        });
    }
    
    /**
     * Hide offline content
     */
    hideOfflineContent() {
        document.body.classList.remove('pwa-offline');
        
        const cachedContent = document.querySelectorAll('.cached-content');
        cachedContent.forEach(element => {
            element.classList.remove('cached-content');
        });
    }
    
    /**
     * Sync offline actions
     */
    async syncOfflineActions() {
        if (!this.options.enableBackgroundSync) return;
        
        try {
            // Get offline actions from localStorage
            const offlineActions = JSON.parse(localStorage.getItem('offlineActions') || '[]');
            
            for (const action of offlineActions) {
                await this.syncAction(action);
            }
            
            // Clear synced actions
            localStorage.removeItem('offlineActions');
            
        } catch (error) {
            console.error('Failed to sync offline actions:', error);
        }
    }
    
    /**
     * Sync single action
     */
    async syncAction(action) {
        switch (action.type) {
            case 'comment':
                await this.syncComment(action.data);
                break;
            case 'subscription':
                await this.syncSubscription(action.data);
                break;
            case 'analytics':
                await this.syncAnalytics(action.data);
                break;
            default:
                console.warn('Unknown action type:', action.type);
        }
    }
    
    /**
     * Sync comment
     */
    async syncComment(commentData) {
        try {
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(commentData)
            });
            
            if (response.ok) {
                this.trackEvent('offline_comment_synced');
            }
        } catch (error) {
            console.error('Failed to sync comment:', error);
        }
    }
    
    /**
     * Sync subscription
     */
    async syncSubscription(subscriptionData) {
        try {
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscriptionData)
            });
            
            if (response.ok) {
                this.trackEvent('offline_subscription_synced');
            }
        } catch (error) {
            console.error('Failed to sync subscription:', error);
        }
    }
    
    /**
     * Sync analytics
     */
    async syncAnalytics(analyticsData) {
        try {
            const response = await fetch('/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(analyticsData)
            });
            
            if (response.ok) {
                this.trackEvent('offline_analytics_synced');
            }
        } catch (error) {
            console.error('Failed to sync analytics:', error);
        }
    }
    
    /**
     * Store offline action
     */
    storeOfflineAction(type, data) {
        const offlineActions = JSON.parse(localStorage.getItem('offlineActions') || '[]');
        offlineActions.push({
            type,
            data,
            timestamp: Date.now()
        });
        
        // Keep only last 50 actions
        if (offlineActions.length > 50) {
            offlineActions.splice(0, offlineActions.length - 50);
        }
        
        localStorage.setItem('offlineActions', JSON.stringify(offlineActions));
    }
    
    /**
     * Track PWA event
     */
    trackEvent(eventName, data = {}) {
        if (this.options.enableOfflineAnalytics) {
            // Send to analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', eventName, {
                    custom_map: data
                });
            }
            
            // Send to custom analytics endpoint
            fetch('/api/pwa-analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: eventName,
                    data,
                    timestamp: Date.now(),
                    online: !this.isOffline
                })
            }).catch(() => {
                // Silently fail analytics
            });
        }
    }
    
    /**
     * Get PWA status
     */
    getStatus() {
        return {
            isInstalled: window.matchMedia('(display-mode: standalone)').matches,
            isOffline: this.isOffline,
            hasServiceWorker: 'serviceWorker' in navigator,
            hasBackgroundSync: 'SyncManager' in window,
            swRegistration: this.swRegistration
        };
    }
    
    /**
     * Check for updates
     */
    checkForUpdates() {
        if (this.swRegistration) {
            this.swRegistration.update();
        }
    }
}

// Auto-initialize PWA system
document.addEventListener('DOMContentLoaded', () => {
    window.pwaSystem = new PWASystem({
        swUrl: '/sw.js',
        manifestUrl: '/manifest.json',
        enableInstallPrompt: true,
        enableBackgroundSync: true,
        enableOfflineAnalytics: true
    });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWASystem;
}