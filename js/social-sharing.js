/**
 * Social Sharing System for Engineering Blog
 * Features: Multiple platforms, share counts, custom styling, analytics
 */

class SocialSharing {
    constructor(options = {}) {
        this.options = {
            container: '.social-sharing',
            platforms: ['twitter', 'linkedin', 'facebook', 'reddit', 'hackernews', 'email'],
            showCounts: true,
            showLabels: true,
            customText: options.customText || null,
            analytics: options.analytics || true,
            ...options
        };
        
        this.shareCounts = {};
        this.init();
    }
    
    /**
     * Initialize social sharing
     */
    init() {
        this.container = document.querySelector(this.options.container);
        if (!this.container) return;
        
        this.setupShareData();
        this.render();
        this.bindEvents();
        
        if (this.options.showCounts) {
            this.loadShareCounts();
        }
    }
    
    /**
     * Setup share data
     */
    setupShareData() {
        this.shareData = {
            url: window.location.href,
            title: document.title,
            description: this.getMetaDescription(),
            image: this.getMetaImage(),
            author: this.getMetaAuthor(),
            tags: this.getMetaTags()
        };
    }
    
    /**
     * Get meta description
     */
    getMetaDescription() {
        const meta = document.querySelector('meta[name="description"]');
        return meta ? meta.getAttribute('content') : '';
    }
    
    /**
     * Get meta image
     */
    getMetaImage() {
        const meta = document.querySelector('meta[property="og:image"]');
        return meta ? meta.getAttribute('content') : '';
    }
    
    /**
     * Get meta author
     */
    getMetaAuthor() {
        const meta = document.querySelector('meta[name="author"]');
        return meta ? meta.getAttribute('content') : '';
    }
    
    /**
     * Get meta tags
     */
    getMetaTags() {
        const meta = document.querySelector('meta[name="keywords"]');
        return meta ? meta.getAttribute('content').split(',').map(tag => tag.trim()).join(',') : '';
    }
    
    /**
     * Render social sharing buttons
     */
    render() {
        const platforms = this.getPlatformConfigs();
        
        this.container.innerHTML = `
            <div class="social-sharing-container">
                <div class="social-sharing-header">
                    <h4 data-i18n="social.share">Share this article</h4>
                </div>
                <div class="social-sharing-buttons">
                    ${platforms.map(platform => this.renderShareButton(platform)).join('')}
                </div>
                ${this.options.showCounts ? `
                    <div class="social-sharing-stats">
                        <span class="total-shares" data-i18n="social.total_shares">Total shares:</span>
                        <span class="total-shares-count">0</span>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Get platform configurations
     */
    getPlatformConfigs() {
        return [
            {
                id: 'twitter',
                name: 'Twitter',
                icon: '🐦',
                color: '#1DA1F2',
                getUrl: () => {
                    const text = this.options.customText || this.shareData.title;
                    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(this.shareData.url)}`;
                    if (this.shareData.author) {
                        return `${url}&via=${this.shareData.author.replace('@', '')}`;
                    }
                    return url;
                },
                countUrl: null
            },
            {
                id: 'linkedin',
                name: 'LinkedIn',
                icon: '💼',
                color: '#0077B5',
                getUrl: () => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(this.shareData.url)}`,
                countUrl: null
            },
            {
                id: 'facebook',
                name: 'Facebook',
                icon: '📘',
                color: '#1877F2',
                getUrl: () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.shareData.url)}`,
                countUrl: null
            },
            {
                id: 'reddit',
                name: 'Reddit',
                icon: '🤖',
                color: '#FF4500',
                getUrl: () => `https://reddit.com/submit?url=${encodeURIComponent(this.shareData.url)}&title=${encodeURIComponent(this.shareData.title)}`,
                countUrl: (url) => `https://www.reddit.com/api/info.json?url=${encodeURIComponent(url)}`
            },
            {
                id: 'hackernews',
                name: 'Hacker News',
                icon: '🍊',
                color: '#FF6600',
                getUrl: () => `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(this.shareData.url)}&t=${encodeURIComponent(this.shareData.title)}`,
                countUrl: null
            },
            {
                id: 'email',
                name: 'Email',
                icon: '📧',
                color: '#6c757d',
                getUrl: () => {
                    const subject = this.options.customText || this.shareData.title;
                    const body = `I thought you might find this article interesting:\n\n${this.shareData.title}\n${this.shareData.url}\n\n${this.shareData.description}`;
                    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                },
                countUrl: null
            }
        ].filter(platform => this.options.platforms.includes(platform.id));
    }
    
    /**
     * Render single share button
     */
    renderShareButton(platform) {
        return `
            <button class="social-share-btn social-share-btn--${platform.id}" 
                    data-platform="${platform.id}" 
                    data-url="${platform.getUrl()}"
                    ${platform.countUrl ? `data-count-url="${platform.countUrl(this.shareData.url)}"` : ''}
                    aria-label="Share on ${platform.name}">
                <span class="social-share-icon">${platform.icon}</span>
                ${this.options.showLabels ? `
                    <span class="social-share-label">${platform.name}</span>
                ` : ''}
                ${this.options.showCounts ? `
                    <span class="social-share-count" data-platform="${platform.id}">-</span>
                ` : ''}
            </button>
        `;
    }
    
    /**
     * Load share counts
     */
    async loadShareCounts() {
        const buttons = this.container.querySelectorAll('[data-count-url]');
        const promises = [];
        
        buttons.forEach(button => {
            const platform = button.dataset.platform;
            const countUrl = button.dataset.countUrl;
            
            if (countUrl) {
                promises.push(this.loadPlatformCount(platform, countUrl));
            }
        });
        
        try {
            await Promise.all(promises);
            this.updateTotalCount();
        } catch (error) {
            console.warn('Failed to load share counts:', error);
        }
    }
    
    /**
     * Load platform-specific count
     */
    async loadPlatformCount(platform, countUrl) {
        try {
            const response = await fetch(countUrl);
            const data = await response.json();
            
            let count = 0;
            if (platform === 'reddit') {
                count = data.data.children.reduce((total, child) => total + child.data.score, 0);
            }
            
            this.shareCounts[platform] = count;
            this.updatePlatformCount(platform, count);
        } catch (error) {
            console.warn(`Failed to load ${platform} count:`, error);
        }
    }
    
    /**
     * Update platform count display
     */
    updatePlatformCount(platform, count) {
        const countElement = this.container.querySelector(`[data-platform="${platform}"].social-share-count`);
        if (countElement) {
            countElement.textContent = this.formatCount(count);
            countElement.classList.add('social-share-count--loaded');
        }
    }
    
    /**
     * Update total count
     */
    updateTotalCount() {
        const total = Object.values(this.shareCounts).reduce((sum, count) => sum + count, 0);
        const totalElement = this.container.querySelector('.total-shares-count');
        if (totalElement) {
            totalElement.textContent = this.formatCount(total);
        }
    }
    
    /**
     * Format count number
     */
    formatCount(count) {
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'M';
        } else if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count.toString();
    }
    
    /**
     * Bind events
     */
    bindEvents() {
        this.container.addEventListener('click', (e) => {
            const button = e.target.closest('.social-share-btn');
            if (button) {
                e.preventDefault();
                this.handleShare(button);
            }
        });
        
        // Copy link functionality
        this.addCopyLinkButton();
    }
    
    /**
     * Handle share button click
     */
    handleShare(button) {
        const platform = button.dataset.platform;
        const url = button.dataset.url;
        
        if (platform === 'email') {
            window.location.href = url;
        } else {
            this.openShareWindow(url, platform);
        }
        
        // Track analytics
        if (this.options.analytics) {
            this.trackShare(platform);
        }
        
        // Update button state
        this.updateButtonState(button);
    }
    
    /**
     * Open share window
     */
    openShareWindow(url, platform) {
        const width = 600;
        const height = 400;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        
        const windowFeatures = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`;
        
        window.open(url, `share-${platform}`, windowFeatures);
    }
    
    /**
     * Track share event
     */
    trackShare(platform) {
        // Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'share', {
                method: platform,
                content_type: 'article',
                item_id: this.shareData.url
            });
        }
        
        // Custom analytics
        this.sendCustomAnalytics('share', {
            platform,
            url: this.shareData.url,
            title: this.shareData.title
        });
    }
    
    /**
     * Send custom analytics
     */
    sendCustomAnalytics(event, data) {
        // Send to your analytics endpoint
        fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event, data, timestamp: Date.now() })
        }).catch(() => {
            // Silently fail analytics
        });
    }
    
    /**
     * Update button state after share
     */
    updateButtonState(button) {
        button.classList.add('social-share-btn--shared');
        setTimeout(() => {
            button.classList.remove('social-share-btn--shared');
        }, 2000);
    }
    
    /**
     * Add copy link button
     */
    addCopyLinkButton() {
        const container = this.container.querySelector('.social-sharing-buttons');
        if (!container) return;
        
        const copyButton = document.createElement('button');
        copyButton.className = 'social-share-btn social-share-btn--copy';
        copyButton.innerHTML = `
            <span class="social-share-icon">🔗</span>
            ${this.options.showLabels ? '<span class="social-share-label">Copy Link</span>' : ''}
        `;
        copyButton.setAttribute('aria-label', 'Copy link to clipboard');
        
        copyButton.addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
                await navigator.clipboard.writeText(this.shareData.url);
                this.showCopySuccess(copyButton);
                
                if (this.options.analytics) {
                    this.trackShare('copy-link');
                }
            } catch (error) {
                // Fallback for older browsers
                this.fallbackCopyToClipboard(this.shareData.url);
                this.showCopySuccess(copyButton);
            }
        });
        
        container.appendChild(copyButton);
    }
    
    /**
     * Show copy success feedback
     */
    showCopySuccess(button) {
        const originalContent = button.innerHTML;
        button.innerHTML = `
            <span class="social-share-icon">✅</span>
            ${this.options.showLabels ? '<span class="social-share-label">Copied!</span>' : ''}
        `;
        button.classList.add('social-share-btn--copied');
        
        setTimeout(() => {
            button.innerHTML = originalContent;
            button.classList.remove('social-share-btn--copied');
        }, 2000);
    }
    
    /**
     * Fallback copy to clipboard
     */
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
        } catch (error) {
            console.warn('Failed to copy text:', error);
        }
        
        document.body.removeChild(textArea);
    }
}

// Auto-initialize social sharing
document.addEventListener('DOMContentLoaded', () => {
    const sharingContainer = document.querySelector('.social-sharing');
    if (sharingContainer) {
        window.socialSharing = new SocialSharing({
            container: '.social-sharing',
            platforms: ['twitter', 'linkedin', 'reddit', 'hackernews', 'email'],
            showCounts: true,
            showLabels: true,
            analytics: true
        });
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SocialSharing;
}