/**
 * @fileoverview Core ThemeManager module with ES6 modules
 * @module core/theme-manager
 */

import { DEFAULT_CONFIG, CSS_CLASSES, ARIA_LABELS } from '../config/constants.js';
import { LocalStorage } from '../utils/storage.js';

/**
 * Theme Manager - Handles theme switching and persistence
 */
export class ThemeManager {
  /**
   * Create ThemeManager instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      container: '.theme-toggle',
      themes: DEFAULT_CONFIG.THEMES,
      defaultTheme: DEFAULT_CONFIG.DEFAULT_THEME,
      storageKey: DEFAULT_CONFIG.STORAGE.THEME,
      transitionDuration: '300ms',
      ...options
    };
    
    this.storage = new LocalStorage(this.options.storageKey);
    this.currentTheme = this.getStoredTheme() || this.options.defaultTheme;
    this.container = null;
    
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
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="theme-toggle-container" role="group" aria-label="${ARIA_LABELS.THEME_SWITCHER}">
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
   * @returns {string|null} Stored theme
   */
  getStoredTheme() {
    return this.storage.get('theme');
  }
  
  /**
   * Store theme preference
   * @param {string} theme - Theme to store
   */
  storeTheme(theme) {
    this.storage.set('theme', theme);
  }
  
  /**
   * Apply theme to document
   * @param {string} theme - Theme to apply
   */
  applyTheme(theme) {
    const htmlElement = document.documentElement;
    const actualTheme = this.resolveTheme(theme);
    
    // Remove all theme classes
    htmlElement.classList.remove(CSS_CLASSES.THEME_LIGHT, CSS_CLASSES.THEME_DARK);
    
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
   * @param {string} theme - Requested theme
   * @returns {string} Resolved theme
   */
  resolveTheme(theme) {
    if (theme === 'auto') {
      return this.getSystemPreference();
    }
    return theme;
  }
  
  /**
   * Get system color scheme preference
   * @returns {string} 'light' or 'dark'
   */
  getSystemPreference() {
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  
  /**
   * Update meta theme-color
   * @param {string} theme - Current theme
   */
  updateMetaThemeColor(theme) {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) return;
    
    const colors = {
      light: '#ffffff',
      dark: '#1a1a1a',
      auto: this.resolveTheme('auto') === 'dark' ? '#1a1a1a' : '#ffffff'
    };
    
    metaThemeColor.setAttribute('content', colors[theme] || colors.light);
  }
  
  /**
   * Bind events
   */
  bindEvents() {
    if (!this.container) return;
    
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
        this.handleArrowNavigation(e);
      }
      
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
   * Handle arrow key navigation
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleArrowNavigation(e) {
    const buttons = Array.from(this.container.querySelectorAll('.theme-btn'));
    const currentBtn = this.container.querySelector('.theme-btn.active');
    const currentIndex = buttons.indexOf(currentBtn);
    
    let nextIndex;
    if (e.key === 'ArrowLeft') {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
    } else {
      nextIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
    }
    
    buttons[nextIndex].focus();
    buttons[nextIndex].click();
  }
  
  /**
   * Setup system preference listener
   */
  setupSystemPreferenceListener() {
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mediaQuery) return;
    
    mediaQuery.addEventListener('change', () => {
      if (this.currentTheme === 'auto') {
        this.applyTheme('auto');
      }
    });
  }
  
  /**
   * Set theme
   * @param {string} theme - Theme to set
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
    const buttons = this.container?.querySelectorAll('.theme-btn');
    if (!buttons) return;
    
    buttons.forEach(button => {
      const isActive = button.dataset.theme === this.currentTheme;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', isActive.toString());
    });
  }
  
  /**
   * Announce theme change for screen readers
   * @param {string} theme - New theme
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
   * @param {string} preference - User preference
   * @param {string} actual - Actual applied theme
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
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  sendCustomAnalytics(event, data) {
    if (!navigator.sendBeacon) return;
    
    try {
      navigator.sendBeacon('/api/analytics', JSON.stringify({ event, data }));
    } catch {
      // Silently fail
    }
  }
  
  /**
   * Get current theme
   * @returns {string} Current theme
   */
  getCurrentTheme() {
    return this.currentTheme;
  }
  
  /**
   * Get resolved theme
   * @returns {string} Resolved theme
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
  
  /**
   * Destroy theme manager
   */
  destroy() {
    this.container?.remove();
    this.container = null;
  }
}

// Auto-initialize (browser environment only)
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager({
      container: '.theme-toggle',
      themes: DEFAULT_CONFIG.THEMES,
      defaultTheme: DEFAULT_CONFIG.DEFAULT_THEME
    });
  });
}

// Export for module usage
export default ThemeManager;
