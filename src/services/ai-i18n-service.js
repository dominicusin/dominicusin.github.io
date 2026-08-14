/**
 * AI Assistant i18n Service
 * Динамическая подгрузка языковых пакетов для мультиязычного AI-ассистента
 */

export class AiAssistantI18n {
  constructor(options = {}) {
    this.supportedLanguages = options.supportedLanguages || ['en', 'ru', 'es', 'fr', 'de', 'zh', 'ja'];
    this.defaultLanguage = options.defaultLanguage || 'en';
    this.currentLanguage = this.defaultLanguage;
    this.languagePacks = new Map();
    this.loadingPromises = new Map();
    this.fallbackChain = {
      'zh': ['zh', 'en'],
      'ja': ['ja', 'en'],
      'es': ['es', 'fr', 'en'],
      'fr': ['fr', 'en'],
      'de': ['de', 'en'],
      'ru': ['ru', 'en'],
      'en': ['en']
    };
    
    // Кэш переводов
    this.translationCache = new Map();
  }

  /**
   * Инициализация - загрузка дефолтного языка
   */
  async init() {
    await this.loadLanguage(this.defaultLanguage);
    this.detectBrowserLanguage();
  }

  /**
   * Определение языка браузера
   */
  detectBrowserLanguage() {
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language?.split('-')[0] || this.defaultLanguage;
      
      if (this.supportedLanguages.includes(browserLang)) {
        this.setLanguage(browserLang);
      } else {
        // Пытаемся найти похожий язык
        const similar = this.supportedLanguages.find(lang => 
          browserLang.startsWith(lang)
        );
        if (similar) {
          this.setLanguage(similar);
        }
      }
    }
  }

  /**
   * Загрузка языкового пакета
   */
  async loadLanguage(lang) {
    if (!this.supportedLanguages.includes(lang)) {
      console.warn(`Language "${lang}" is not supported, falling back to default`);
      lang = this.defaultLanguage;
    }

    // Если уже загружен
    if (this.languagePacks.has(lang)) {
      return this.languagePacks.get(lang);
    }

    // Если уже загружается
    if (this.loadingPromises.has(lang)) {
      return this.loadingPromises.get(lang);
    }

    const loadPromise = (async () => {
      try {
        // Динамический импорт языкового пакета
        const module = await import(`../../assets/i18n/${lang}.json`);
        const translations = module.default || module;
        
        this.languagePacks.set(lang, translations);
        console.log(`✅ Language pack loaded: ${lang}`);
        
        return translations;
      } catch (error) {
        console.warn(`Failed to load language pack for "${lang}":`, error.message);
        
        // Пытаемся загрузить fallback
        const fallbacks = this.fallbackChain[lang] || [this.defaultLanguage];
        for (const fallback of fallbacks) {
          if (fallback !== lang) {
            try {
              return await this.loadLanguage(fallback);
            } catch {
              continue;
            }
          }
        }
        
        // Возвращаем пустой объект если ничего не получилось
        const emptyPack = {};
        this.languagePacks.set(lang, emptyPack);
        return emptyPack;
      } finally {
        this.loadingPromises.delete(lang);
      }
    })();

    this.loadingPromises.set(lang, loadPromise);
    return loadPromise;
  }

  /**
   * Установка текущего языка
   */
  async setLanguage(lang) {
    if (lang === this.currentLanguage) {
      return;
    }

    await this.loadLanguage(lang);
    this.currentLanguage = lang;
    
    // Сохраняем выбор пользователя
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ai-assistant-language', lang);
    }

    // Dispatch событие для обновления UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ai-language-changed', { 
        detail: { language: lang } 
      }));
    }

    console.log(`🌐 Language switched to: ${lang}`);
  }

  /**
   * Получение перевода по ключу
   */
  t(key, params = {}) {
    const pack = this.languagePacks.get(this.currentLanguage);
    
    if (!pack) {
      return key; // Возвращаем ключ если пакет не загружен
    }

    // Глубокий поиск ключа
    let value = key.split('.').reduce((obj, k) => {
      return obj && obj[k] !== undefined ? obj[k] : undefined;
    }, pack);

    // Fallback на английский
    if (value === undefined && this.currentLanguage !== this.defaultLanguage) {
      const enPack = this.languagePacks.get(this.defaultLanguage);
      value = key.split('.').reduce((obj, k) => {
        return obj && obj[k] !== undefined ? obj[k] : undefined;
      }, enPack);
    }

    // Если всё ещё не нашли, возвращаем ключ
    if (value === undefined) {
      return key;
    }

    // Подстановка параметров
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramName) => {
        return params[paramName] !== undefined ? params[paramName] : match;
      });
    }

    return value;
  }

  /**
   * Алиас для t()
   */
  translate(key, params = {}) {
    return this.t(key, params);
  }

  /**
   * Проверка доступности перевода
   */
  has(key) {
    const pack = this.languagePacks.get(this.currentLanguage);
    if (!pack) return false;

    return key.split('.').reduce((obj, k) => {
      return obj && obj[k] !== undefined ? obj[k] : undefined;
    }, pack) !== undefined;
  }

  /**
   * Получение всех доступных языков
   */
  getAvailableLanguages() {
    return this.supportedLanguages.map(lang => ({
      code: lang,
      name: this.getLanguageName(lang),
      nativeName: this.getNativeLanguageName(lang),
      loaded: this.languagePacks.has(lang)
    }));
  }

  /**
   * Название языка на английском
   */
  getLanguageName(lang) {
    const names = {
      'en': 'English',
      'ru': 'Russian',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'pt': 'Portuguese',
      'it': 'Italian',
      'ar': 'Arabic',
      'hi': 'Hindi'
    };
    return names[lang] || lang.toUpperCase();
  }

  /**
   * Нативное название языка
   */
  getNativeLanguageName(lang) {
    const nativeNames = {
      'en': 'English',
      'ru': 'Русский',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'zh': '中文',
      'ja': '日本語',
      'ko': '한국어',
      'pt': 'Português',
      'it': 'Italiano',
      'ar': 'العربية',
      'hi': 'हिन्दी'
    };
    return nativeNames[lang] || lang.toUpperCase();
  }

  /**
   * Предзагрузка всех языковых пакетов
   */
  async preloadAll() {
    console.log('📦 Preloading all language packs...');
    await Promise.all(
      this.supportedLanguages.map(lang => this.loadLanguage(lang))
    );
    console.log('✅ All language packs preloaded');
  }

  /**
   * Экспорт текущего языкового пакета
   */
  exportCurrentPack() {
    const pack = this.languagePacks.get(this.currentLanguage);
    if (!pack) {
      return null;
    }
    
    return {
      language: this.currentLanguage,
      translations: pack,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Импорт пользовательского языкового пакета
   */
  importPack(lang, pack) {
    if (!this.supportedLanguages.includes(lang)) {
      this.supportedLanguages.push(lang);
    }
    
    this.languagePacks.set(lang, pack);
    console.log(`📥 Custom language pack imported: ${lang}`);
  }

  /**
   * Генерация шаблона для нового языкового пакета
   */
  generateTemplate(targetLang = 'en') {
    const basePack = this.languagePacks.get(this.defaultLanguage);
    
    if (!basePack) {
      console.warn('Base language pack not loaded');
      return {};
    }

    const template = JSON.parse(JSON.stringify(basePack));
    
    // Заменяем все значения на плейсхолдеры
    const replaceValues = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = `TODO: Translate "${obj[key]}" to ${targetLang}`;
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          replaceValues(obj[key]);
        }
      }
      return obj;
    };

    return replaceValues(template);
  }
}

// Singleton instance
let i18nInstance = null;

export function getAiI18n(options = {}) {
  if (!i18nInstance) {
    i18nInstance = new AiAssistantI18n(options);
  }
  return i18nInstance;
}

export default AiAssistantI18n;
