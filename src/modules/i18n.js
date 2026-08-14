/**
 * @fileoverview Internationalization (i18n) module
 * @module modules/i18n
 */

import { DEFAULT_CONFIG, EVENT_NAMES } from '../config/constants.js';
import { LocalStorage } from '../utils/storage.js';

/**
 * I18n Manager - Handles language switching and translations
 */
export class I18nManager {
  /**
   * Create I18nManager instance
   */
  constructor() {
    this.currentLang = this.getStoredLanguage() || this.getBrowserLanguage();
    this.translations = {};
    this.isLoaded = false;
    this.storage = new LocalStorage(DEFAULT_CONFIG.STORAGE.LANGUAGE);

    this.init();
  }

  /**
   * Initialize i18n system
   */
  async init() {
    try {
      await this.loadTranslations(this.currentLang);
      this.setupLanguageSwitcher();
      this.applyTranslations();
      this.isLoaded = true;

      document.documentElement.setAttribute('data-lang', this.currentLang);
      document.dispatchEvent(new CustomEvent(EVENT_NAMES.I18N_LOADED, {
        detail: { language: this.currentLang }
      }));
    } catch (error) {
      console.error('Failed to initialize i18n:', error);
    }
  }

  /**
   * Get stored language from localStorage
   * @returns {string|null} Stored language
   */
  getStoredLanguage() {
    return this.storage.get('lang');
  }

  /**
   * Get browser language
   * @returns {string} Browser language code
   */
  getBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    return browserLang.startsWith('ru') ? 'ru' : 'en';
  }

  /**
   * Load translations for language
   * @param {string} lang - Language code
   * @returns {Promise<Object>} Translations object
   */
  async loadTranslations(lang) {
    if (this.translations[lang]) {
      return this.translations[lang];
    }

    try {
      const response = await fetch(`/assets/i18n/${lang}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load translations for ${lang}`);
      }

      this.translations[lang] = await response.json();
      return this.translations[lang];
    } catch (error) {
      console.error(`Error loading translations for ${lang}:`, error);

      // Fallback to English
      if (lang !== 'en') {
        return await this.loadTranslations('en');
      }
      throw error;
    }
  }

  /**
   * Switch to different language
   * @param {string} lang - Target language code
   */
  async switchLanguage(lang) {
    if (lang === this.currentLang) return;

    try {
      this.showLoadingState();
      await this.loadTranslations(lang);
      this.currentLang = lang;
      this.storage.set('lang', lang);
      this.applyTranslations();
      this.updateLanguageSwitcher();

      document.documentElement.setAttribute('data-lang', lang);
      document.documentElement.setAttribute('lang', lang);

      document.dispatchEvent(new CustomEvent(EVENT_NAMES.I18N_LANGUAGE_CHANGED, {
        detail: { language: lang }
      }));

      this.hideLoadingState();
    } catch (error) {
      console.error(`Failed to switch language to ${lang}:`, error);
      this.hideLoadingState();
    }
  }

  /**
   * Apply translations to DOM elements
   */
  applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    const currentTranslations = this.translations[this.currentLang];

    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.getNestedValue(currentTranslations, key);

      if (translation) {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.placeholder = translation;
        } else if (element.tagName === 'IMG') {
          element.alt = translation;
        } else if (element.title) {
          element.title = translation;
        } else {
          element.textContent = translation;
        }
      }
    });

    this.updateAccessibilityAttributes(currentTranslations);
  }

  /**
   * Get nested object value by dot notation
   * @param {Object} obj - Object to search
   * @param {string} key - Dot-notation key
   * @returns {*} Value or null
   */
  getNestedValue(obj, key) {
    if (!obj || !key) return null;
    return key.split('.').reduce((current, keyPart) => {
      return current && current[keyPart] !== undefined ? current[keyPart] : null;
    }, obj);
  }

  /**
   * Setup language switcher UI
   * @returns {Element} Language switcher element
   */
  setupLanguageSwitcher() {
    let switcher = document.querySelector('.language-switcher');

    if (!switcher) {
      switcher = document.createElement('div');
      switcher.className = 'language-switcher';
      switcher.setAttribute('role', 'group');
      switcher.setAttribute('aria-label', 'Language selection');
      document.body.appendChild(switcher);
    }

    switcher.innerHTML = `
      <button type="button"
              class="lang-btn active"
              data-lang="en"
              aria-pressed="true"
              aria-label="Switch to English">
        EN
      </button>
      <button type="button"
              class="lang-btn"
              data-lang="ru"
              aria-pressed="false"
              aria-label="Переключить на русский">
        RU
      </button>
    `;

    switcher.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        this.switchLanguage(lang);
      });
    });

    return switcher;
  }

  /**
   * Update language switcher button states
   */
  updateLanguageSwitcher() {
    const switcher = document.querySelector('.language-switcher');
    if (!switcher) return;

    switcher.querySelectorAll('.lang-btn').forEach(btn => {
      const lang = btn.getAttribute('data-lang');
      const isActive = lang === this.currentLang;

      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive.toString());
    });
  }

  /**
   * Update accessibility attributes
   * @param {Object} translations - Translations object
   */
  updateAccessibilityAttributes(translations) {
    const skipLink = document.querySelector('.skip-link');
    if (skipLink && translations.accessibility?.skip_to_content) {
      skipLink.textContent = translations.accessibility.skip_to_content;
    }

    const menuButton = document.querySelector('.menu-icon');
    if (menuButton) {
      const label = menuButton.classList.contains('active')
        ? translations.accessibility?.close_menu
        : translations.accessibility?.open_menu;
      if (label) menuButton.setAttribute('aria-label', label);
    }
  }

  /**
   * Show loading state during language switch
   */
  showLoadingState() {
    document.body.classList.add('i18n-loading');

    if (!document.querySelector('.i18n-loading-overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'i18n-loading-overlay';
      overlay.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner"></div>
          <span>Loading...</span>
        </div>
      `;
      document.body.appendChild(overlay);
    }
  }

  /**
   * Hide loading state
   */
  hideLoadingState() {
    document.body.classList.remove('i18n-loading');
    const overlay = document.querySelector('.i18n-loading-overlay');
    if (overlay) overlay.remove();
  }

  /**
   * Get translation by key with parameter substitution
   * @param {string} key - Translation key
   * @param {Object} params - Parameters for substitution
   * @returns {string} Translated text
   */
  t(key, params = {}) {
    const translation = this.getNestedValue(
      this.translations[this.currentLang],
      key
    );

    if (!translation) return key;

    return Object.keys(params).reduce((text, param) => {
      return text.replace(new RegExp(`{{\\s*${param}\\s*}}`, 'g'), params[param]);
    }, translation);
  }

  /**
   * Get current language
   * @returns {string} Current language code
   */
  getCurrentLanguage() {
    return this.currentLang;
  }

  /**
   * Get available languages
   * @returns {string[]} Array of language codes
   */
  getAvailableLanguages() {
    return ['en', 'ru'];
  }

  /**
   * Check if i18n is ready
   * @returns {boolean} Ready status
   */
  isReady() {
    return this.isLoaded;
  }

  /**
   * Destroy i18n manager
   */
  destroy() {
    const overlay = document.querySelector('.i18n-loading-overlay');
    if (overlay) overlay.remove();
    
    const switcher = document.querySelector('.language-switcher');
    if (switcher) switcher.remove();
  }
}

// Auto-initialize (browser environment only)
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  window.i18n = new I18nManager();
  window.t = (key, params) => window.i18n.t(key, params);
}

// Export for module usage
export default I18nManager;
