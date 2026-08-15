/**
 * Мультиязычная система управления
 * Поддержка переключения языков с сохранением в localStorage
 */
class I18nManager {
  constructor() {
    this.currentLang = this.getStoredLanguage() || this.getBrowserLanguage();
    this.translations = {};
    this.isLoaded = false;
    
    this.init();
  }

  /**
   * Инициализация системы
   */
  async init() {
    try {
      await this.loadTranslations(this.currentLang);
      this.setupLanguageSwitcher();
      this.applyTranslations();
      this.isLoaded = true;
      
      // Добавить класс для стилизации
      document.documentElement.setAttribute('data-lang', this.currentLang);
      
      // Событие после загрузки
      document.dispatchEvent(new CustomEvent('i18n:loaded', { 
        detail: { language: this.currentLang } 
      }));
    } catch (error) {
      console.error('Failed to initialize i18n:', error);
    }
  }

  /**
   * Получение сохраненного языка
   */
  getStoredLanguage() {
    return localStorage.getItem('preferred-language');
  }

  /**
   * Получение языка браузера
   */
  getBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    return browserLang.startsWith('ru') ? 'ru' : 'en';
  }

  /**
   * Загрузка переводов
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
      
      // Fallback к английскому
      if (lang !== 'en') {
        return await this.loadTranslations('en');
      }
      throw error;
    }
  }

  /**
   * Переключение языка
   */
  async switchLanguage(lang) {
    if (lang === this.currentLang) return;

    try {
      // Показать индикатор загрузки
      this.showLoadingState();
      
      // Загрузить новые переводы
      await this.loadTranslations(lang);
      
      // Обновить текущий язык
      this.currentLang = lang;
      
      // Сохранить в localStorage
      localStorage.setItem('preferred-language', lang);
      
      // Применить переводы
      this.applyTranslations();
      
      // Обновить атрибуты
      document.documentElement.setAttribute('data-lang', lang);
      document.documentElement.setAttribute('lang', lang);
      
      // Обновить переключатель
      this.updateLanguageSwitcher();
      
      // Скрыть индикатор загрузки
      this.hideLoadingState();
      
      // Событие после переключения
      document.dispatchEvent(new CustomEvent('i18n:languageChanged', { 
        detail: { language: lang, previousLanguage: this.currentLang } 
      }));
      
    } catch (error) {
      console.error('Failed to switch language:', error);
      this.hideLoadingState();
    }
  }

  /**
   * Применение переводов к странице
   */
  applyTranslations() {
    const translations = this.translations[this.currentLang];
    if (!translations) return;

    // Найти все элементы с data-i18n атрибутом
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.getNestedValue(translations, key);
      
      if (translation) {
        // Для разных типов элементов
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.placeholder = translation;
        } else if (element.tagName === 'IMG') {
          element.alt = translation;
        } else {
          element.textContent = translation;
        }
      }
    });

    // Обновить заголовок страницы
    if (translations.site?.title) {
      document.title = translations.site.title;
    }

    // Обновить атрибуты для доступности
    this.updateAccessibilityAttributes(translations);
  }

  /**
   * Получение вложенного значения по ключу
   */
  getNestedValue(obj, key) {
    return key.split('.').reduce((current, keyPart) => {
      return current && current[keyPart] !== undefined ? current[keyPart] : null;
    }, obj);
  }

  /**
   * Настройка переключателя языка
   */
  setupLanguageSwitcher() {
    // Создать переключатель если его нет
    let switcher = document.querySelector('.language-switcher');
    
    if (!switcher) {
      switcher = this.createLanguageSwitcher();
      
      // Добавить в header
      const header = document.querySelector('.site-header');
      if (header) {
        header.appendChild(switcher);
      }
    }
    
    this.updateLanguageSwitcher();
  }

  /**
   * Создание переключателя языка
   */
  createLanguageSwitcher() {
    const switcher = document.createElement('div');
    switcher.className = 'language-switcher';
    switcher.setAttribute('role', 'group');
    switcher.setAttribute('aria-label', 'Language selection');
    
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
    
    // Обработчики событий
    switcher.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        this.switchLanguage(lang);
      });
    });
    
    return switcher;
  }

  /**
   * Обновление состояния переключателя
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
   * Обновление атрибутов доступности
   */
  updateAccessibilityAttributes(translations) {
    // Skip link
    const skipLink = document.querySelector('.skip-link');
    if (skipLink && translations.accessibility?.skip_to_content) {
      skipLink.textContent = translations.accessibility.skip_to_content;
    }

    // Mobile menu button
    const menuButton = document.querySelector('.menu-icon');
    if (menuButton) {
      const label = menuButton.classList.contains('active') 
        ? translations.accessibility?.close_menu 
        : translations.accessibility?.open_menu;
      if (label) menuButton.setAttribute('aria-label', label);
    }
  }

  /**
   * Показать состояние загрузки
   */
  showLoadingState() {
    const body = document.body;
    body.classList.add('i18n-loading');
    
    // Создать overlay если его нет
    if (!document.querySelector('.i18n-loading-overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'i18n-loading-overlay';
      overlay.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner"></div>
          <span>Loading...</span>
        </div>
      `;
      body.appendChild(overlay);
    }
  }

  /**
   * Скрыть состояние загрузки
   */
  hideLoadingState() {
    const body = document.body;
    body.classList.remove('i18n-loading');
    
    const overlay = document.querySelector('.i18n-loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  /**
   * Получение перевода по ключу
   */
  t(key, params = {}) {
    const translation = this.getNestedValue(
      this.translations[this.currentLang], 
      key
    );
    
    if (!translation) return key;
    
    // Подстановка параметров
    return Object.keys(params).reduce((text, param) => {
      return text.replace(new RegExp(`{{\\s*${param}\\s*}}`, 'g'), params[param]);
    }, translation);
  }

  /**
   * Получение текущего языка
   */
  getCurrentLanguage() {
    return this.currentLang;
  }

  /**
   * Получение доступных языков
   */
  getAvailableLanguages() {
    return ['en', 'ru'];
  }

  /**
   * Проверка загрузки
   */
  isReady() {
    return this.isLoaded;
  }
}

// Глобальный экземпляр
window.i18n = new I18nManager();

// Утилиты для шаблонов
window.t = (key, params) => window.i18n.t(key, params);

// Экспорт для модулей
if (typeof module !== 'undefined' && module.exports) {
  module.exports = I18nManager;
}