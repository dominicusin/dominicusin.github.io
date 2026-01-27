/**
 * Theme Toggle System for Engineering Blog
 * Features: Dark/Light/Auto themes, system preference detection, smooth transitions
 */

class ThemeManager {
    constructor(options = {}) {
        this.options = {
            container: '.theme-toggle',
            themes: ['light', 'dark', 'auto'],
            defaultTheme: 'auto',
            storageKey: 'blog-theme',
            transitionDuration: '300ms',
            ...options
        };
        
        this.currentTheme = this.getStoredTheme() || this.options.defaultTheme;
        this.init();
    }
    
    /**
     * Initialize theme system
     */
    init() {
        this.setupContainer();
        this.applyTheme(this.currentTheme);
        this.bindEvents();
        this.setupSystemPreferenceListener();
    }
    
    /**
     * Setup theme toggle container
     */
    setupContainer() {
        this.container = document.querySelector(this.options.container);
        if (!this.container) {
            // Create default container if not found
            this.container = document.createElement('div');
            this.container.className = 'theme-toggle';
            document.body.appendChild(this.container);
        }
        
        this.render();
    }
    
    /**
     * Render theme toggle UI
     */
    render() {
        this.container.innerHTML = `
            <div class="theme-toggle-container" role="group" aria-label="Theme switcher">
                <button 
                    class="theme-btn theme-btn--light" 
                    data-theme="light"
                    aria-label="Light theme"
                    title="Light theme"
                >
                    <span class="theme-icon">☀️</span>
                    <span class="theme-label" data-i18n="theme.light">Light</span>
                </button>
                
                <button 
                    class="theme-btn theme-btn--dark" 
                    data-theme="dark"
                    aria-label="Dark theme"
                    title="Dark theme"
                >
                    <span class="theme-icon">🌙</span>
                    <span class="theme-label" data-i18n="theme.dark">Dark</span>
                </button>
                
                <button 
                    class="theme-btn theme-btn--auto" 
                    data-theme="auto"
                    aria-label="Auto theme (system preference)"
                    title="Auto theme (system preference)"
                >
                    <span class="theme-icon">🌓</span>
                    <span class="theme-label" data-i18n="theme.auto">Auto</span>
                </button>
            </div>
        `;
        
        this.updateActiveState();
    }
    
    /**
     * Get stored theme from localStorage
     */
    getStoredTheme() {
        try {
            return localStorage.getItem(this.options.storageKey);
        } catch (error) {
            console.warn('Failed to read theme from localStorage:', error);
            return null;
        }
    }
    
    /**
     * Store theme preference
     */
    storeTheme(theme) {
        try {
            localStorage.setItem(this.options.storageKey, theme);
        } catch (error) {
            console.warn('Failed to store theme preference:', error);
        }
    }
    
    /**
     * Apply theme to document
     */
    applyTheme(theme) {
        const htmlElement = document.documentElement;
        const actualTheme = this.resolveTheme(theme);
        
        // Remove all theme classes
        htmlElement.classList.remove('theme-light', 'theme-dark');
        
        // Add current theme class
        htmlElement.classList.add(`theme-${actualTheme}`);
        htmlElement.setAttribute('data-theme', actualTheme);
        
        // Update meta theme-color
        this.updateMetaThemeColor(actualTheme);
        
        // Track theme change
        this.trackThemeChange(theme, actualTheme);
        
        // Store preference if not auto
        if (theme !== 'auto') {
            this.storeTheme(theme);
        }
    }
    
    /**
     * Resolve actual theme (for auto)
     */
    resolveTheme(theme) {
        if (theme === 'auto') {
            return this.getSystemPreference();
        }
        return theme;
    }
    
    /**
     * Get system color scheme preference
     */
    getSystemPreference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }
    
    /**
     * Update meta theme-color
     */
    updateMetaThemeColor(theme) {
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            const colors = {
                light: '#ffffff',
                dark: '#1a1a1a',
                auto: this.resolveTheme('auto') === 'dark' ? '#1a1a1a' : '#ffffff'
            };
            metaThemeColor.setAttribute('content', colors[theme] || colors.light);
        }
    }
    
    /**
     * Bind events
     */
    bindEvents() {
        this.container.addEventListener('click', (e) => {
            const button = e.target.closest('.theme-btn');
            if (button) {
                const theme = button.dataset.theme;
                this.setTheme(theme);
            }
        });
        
        // Keyboard navigation
        this.container.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                const currentBtn = this.container.querySelector('.theme-btn.active');
                const allBtns = Array.from(this.container.querySelectorAll('.theme-btn'));
                const currentIndex = allBtns.indexOf(currentBtn);
                
                let nextIndex;
                if (e.key === 'ArrowLeft') {
                    nextIndex = currentIndex > 0 ? currentIndex - 1 : allBtns.length - 1;
                } else {
                    nextIndex = currentIndex < allBtns.length - 1 ? currentIndex + 1 : 0;
                }
                
                allBtns[nextIndex].focus();
                allBtns[nextIndex].click();
            }
        });
        
        // Accessibility
        this.container.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const button = e.target.closest('.theme-btn');
                if (button) {
                    e.preventDefault();
                    button.click();
                }
            }
        });
    }
    
    /**
     * Setup system preference listener
     */
    setupSystemPreferenceListener() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            mediaQuery.addEventListener('change', (e) => {
                if (this.currentTheme === 'auto') {
                    this.applyTheme('auto');
                }
            });
        }
    }
    
    /**
     * Set theme
     */
    setTheme(theme) {
        if (!this.options.themes.includes(theme)) {
            console.warn(`Invalid theme: ${theme}`);
            return;
        }
        
        this.currentTheme = theme;
        this.applyTheme(theme);
        this.updateActiveState();
        this.announceThemeChange(theme);
    }
    
    /**
     * Update active button state
     */
    updateActiveState() {
        const buttons = this.container.querySelectorAll('.theme-btn');
        buttons.forEach(button => {
            const isActive = button.dataset.theme === this.currentTheme;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-pressed', isActive.toString());
        });
    }
    
    /**
     * Announce theme change for screen readers
     */
    announceThemeChange(theme) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = `Theme changed to ${theme}`;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
    
    /**
     * Track theme change
     */
    trackThemeChange(preference, actual) {
        // Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'theme_change', {
                preference,
                actual,
                system_preference: this.getSystemPreference()
            });
        }
        
        // Custom analytics
        this.sendCustomAnalytics('theme_change', {
            preference,
            actual,
            system_preference: this.getSystemPreference(),
            timestamp: Date.now()
        });
    }
    
    /**
     * Send custom analytics
     */
    sendCustomAnalytics(event, data) {
        fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event, data })
        }).catch(() => {
            // Silently fail analytics
        });
    }
    
    /**
     * Get current theme
     */
    getCurrentTheme() {
        return this.currentTheme;
    }
    
    /**
     * Get resolved theme
     */
    getResolvedTheme() {
        return this.resolveTheme(this.currentTheme);
    }
    
    /**
     * Toggle between themes
     */
    toggleTheme() {
        const currentIndex = this.options.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.options.themes.length;
        const nextTheme = this.options.themes[nextIndex];
        this.setTheme(nextTheme);
    }
    
    /**
     * Reset to default theme
     */
    resetTheme() {
        this.setTheme(this.options.defaultTheme);
    }
}

// Auto-initialize theme manager
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager({
        container: '.theme-toggle',
        themes: ['light', 'dark', 'auto'],
        defaultTheme: 'auto'
    });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}