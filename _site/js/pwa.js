/**
 * Optimized PWA System - Refactored for performance
 * Features: Offline access, caching, install prompts, background sync
 */

class PWASystem {
    constructor(options = {}) {
        // Merge options with defaults
        this.options = Object.assign({
            swUrl: '/sw.js',
            manifestUrl: '/manifest.json',
            enableInstallPrompt: true,
            enableBackgroundSync: true,
            enableOfflineAnalytics: true
        }, options);
        
        // State management
        this.state = {
            deferredPrompt: null,
            isOffline: !navigator.onLine,
            swRegistration: null,
            isInstalled: false
        };
        
        // Cache DOM elements
        this.elements = {};
        
        // Initialize
        this.init();
    }
    
    init() {
        this.checkInstallStatus();
        this.setupServiceWorker();
        this.setupInstallPrompt();
        this.setupConnectivityListener();
        this.setupBackgroundSync();
    }
    
    checkInstallStatus() {
        this.state.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                                window.navigator.standalone ||
                                document.referrer.includes('android-app://');
        
        if (this.state.isInstalled) {
            this.trackEvent('app_launched');
        }
    }
    
    setupServiceWorker() {
        if (!('serviceWorker' in navigator)) return;
        
        window.addEventListener('load', () => {
            navigator.serviceWorker.register(this.options.swUrl)
                .then(registration => {
                    this.state.swRegistration = registration;
                    this.setupUpdateListener(registration);
                })
                .catch(error => {
                    console.error('SW registration failed:', error);
                });
        });
    }
    
    setupUpdateListener(registration) {
        registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    this.showUpdateNotification();
                }
            });
        });
    }
    
    setupInstallPrompt() {
        if (!this.options.enableInstallPrompt) return;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.state.deferredPrompt = e;
            this.showInstallBanner();
        });
        
        window.addEventListener('appinstalled', () => {
            this.hideInstallBanner();
            this.trackEvent('app_installed');
        });
    }
    
    setupConnectivityListener() {
        window.addEventListener('online', () => {
            this.state.isOffline = false;
            this.hideOfflineMessage();
            this.syncOfflineActions();
        });
        
        window.addEventListener('offline', () => {
            this.state.isOffline = true;
            this.showOfflineMessage();
        });
    }
    
    setupBackgroundSync() {
        if (!this.options.enableBackgroundSync) return;
        if (!('serviceWorker' in navigator) || !('SyncManager' in window)) return;
        
        navigator.serviceWorker.ready.then(registration => {
            return registration.sync.register('background-sync');
        }).catch(error => {
            console.error('Background sync registration failed:', error);
        });
    }
    
    showInstallBanner() {
        this.hideInstallBanner();
        
        const banner = this.createElement('div', 'pwa-install-banner', {
            innerHTML: `
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
            `
        });
        
        document.body.appendChild(banner);
        this.bindInstallEvents(banner);
        
        // Auto-hide after 10 seconds
        setTimeout(() => this.hideInstallBanner(), 10000);
    }
    
    bindInstallEvents(banner) {
        const installBtn = banner.querySelector('#pwa-install');
        const dismissBtn = banner.querySelector('#pwa-dismiss');
        
        installBtn?.addEventListener('click', () => this.installApp());
        dismissBtn?.addEventListener('click', () => this.hideInstallBanner());
    }
    
    hideInstallBanner() {
        const banner = document.querySelector('.pwa-install-banner');
        banner?.remove();
    }
    
    async installApp() {
        if (!this.state.deferredPrompt) return;
        
        this.state.deferredPrompt.prompt();
        const { outcome } = await this.state.deferredPrompt.userChoice;
        
        this.trackEvent(outcome === 'accepted' ? 'app_install_accepted' : 'app_install_dismissed');
        this.state.deferredPrompt = null;
        this.hideInstallBanner();
    }
    
    showUpdateNotification() {
        const notification = this.createElement('div', 'pwa-update-notification', {
            innerHTML: `
                <div class="update-content">
                    <div class="update-icon">🔄</div>
                    <div class="update-text">
                        <h4>New Version Available</h4>
                        <p>Refresh to get the latest features</p>
                    </div>
                    <div class="update-actions">
                        <button class="update-btn" id="pwa-update">Refresh</button>
                        <button class="update-dismiss" id="update-dismiss">Dismiss</button>
                    </div>
                </div>
            `
        });
        
        document.body.appendChild(notification);
        this.bindUpdateEvents(notification);
    }
    
    bindUpdateEvents(notification) {
        const updateBtn = notification.querySelector('#pwa-update');
        const dismissBtn = notification.querySelector('#update-dismiss');
        
        updateBtn?.addEventListener('click', () => this.updateApp());
        dismissBtn?.addEventListener('click', () => this.hideUpdateNotification());
    }
    
    hideUpdateNotification() {
        const notification = document.querySelector('.pwa-update-notification');
        notification?.remove();
    }
    
    updateApp() {
        window.location.reload();
    }
    
    showOfflineMessage() {
        this.hideOfflineMessage();
        
        const message = this.createElement('div', 'pwa-offline-message', {
            innerHTML: `
                <div class="offline-content">
                    <div class="offline-icon">📵</div>
                    <div class="offline-text">
                        <h4>You're offline</h4>
                        <p>Some features may be unavailable</p>
                    </div>
                </div>
            `
        });
        
        document.body.appendChild(message);
        this.showOfflineContent();
    }
    
    hideOfflineMessage() {
        const message = document.querySelector('.pwa-offline-message');
        message?.remove();
    }
    
    showOfflineContent() {
        document.body.classList.add('pwa-offline');
        document.querySelectorAll('[data-cached="true"]')
            .forEach(el => el.classList.add('cached-content'));
    }
    
    hideOfflineContent() {
        document.body.classList.remove('pwa-offline');
        document.querySelectorAll('.cached-content')
            .forEach(el => el.classList.remove('cached-content'));
    }
    
    async syncOfflineActions() {
        if (!this.options.enableBackgroundSync) return;
        
        try {
            const offlineActions = JSON.parse(localStorage.getItem('offlineActions') || '[]');
            
            for (const action of offlineActions) {
                await this.syncAction(action);
            }
            
            localStorage.removeItem('offlineActions');
        } catch (error) {
            console.error('Failed to sync offline actions:', error);
        }
    }
    
    async syncAction(action) {
        const syncMethods = {
            comment: this.syncComment,
            subscription: this.syncSubscription,
            analytics: this.syncAnalytics
        };
        
        const syncMethod = syncMethods[action.type];
        if (syncMethod) {
            await syncMethod.call(this, action.data);
        } else {
            console.warn('Unknown action type:', action.type);
        }
    }
    
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
    
    trackEvent(eventName, data = {}) {
        if (!this.options.enableOfflineAnalytics) return;
        
        // Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, { custom_map: data });
        }
        
        // Custom analytics
        fetch('/api/pwa-analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: eventName,
                data,
                timestamp: Date.now(),
                online: !this.state.isOffline
            })
        }).catch(() => {
            // Silently fail analytics
        });
    }
    
    getStatus() {
        return {
            isInstalled: this.state.isInstalled,
            isOffline: this.state.isOffline,
            hasServiceWorker: 'serviceWorker' in navigator,
            hasBackgroundSync: 'SyncManager' in window,
            swRegistration: this.state.swRegistration
        };
    }
    
    checkForUpdates() {
        if (this.state.swRegistration) {
            this.state.swRegistration.update();
        }
    }
    
    // Utility method for creating elements
    createElement(tag, className, properties = {}) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        
        Object.assign(element, properties);
        return element;
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.pwaSystem = new PWASystem();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWASystem;
}