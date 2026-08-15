/**
 * @fileoverview Unit tests for I18nManager module (aligned to real API)
 */

import { describe, it, expect, beforeEach, afterEach } from '../test-utils.js';
import { I18nManager } from '../../src/modules/i18n.js';

describe('I18nManager', () => {
  let i18n;
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = async (url) => {
      if (url.includes('en.json')) {
        return {
          ok: true,
          json: async () => ({
            greeting: 'Hello',
            farewell: 'Goodbye',
            welcome: 'Welcome, {{name}}!',
            items: {
              one: 'One item',
              other: '{{count}} items'
            }
          })
        };
      }
      if (url.includes('ru.json')) {
        return {
          ok: true,
          json: async () => ({
            greeting: 'Привет',
            farewell: 'До свидания',
            welcome: 'Добро пожаловать, {{name}}!',
            items: {
              one: 'Один элемент',
              other: '{{count}} элементов'
            }
          })
        };
      }
      return { ok: false, status: 404 };
    };

    i18n = new I18nManager();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    i18n = null;
  });

  describe('initialization', () => {
    it('should create instance', () => {
      expect(i18n).toBeInstanceOf(I18nManager);
    });

    it('should default to a known language', () => {
      expect(['en', 'ru']).toContain(i18n.getCurrentLanguage());
    });

    it('should report available languages', () => {
      expect(i18n.getAvailableLanguages()).toEqual(['en', 'ru']);
    });
  });

  describe('loadTranslations', () => {
    it('should load English translations', async () => {
      const t = await i18n.loadTranslations('en');
      expect(t.greeting).toBe('Hello');
    });

    it('should load Russian translations', async () => {
      const t = await i18n.loadTranslations('ru');
      expect(t.greeting).toBe('Привет');
    });

    it('should fall back to English for unsupported locale', async () => {
      const t = await i18n.loadTranslations('fr');
      expect(t.greeting).toBe('Hello');
    });
  });

  describe('translation', () => {
    beforeEach(async () => {
      await i18n.loadTranslations('en');
    });

    it('should translate a simple key', () => {
      expect(i18n.t('greeting')).toBe('Hello');
      expect(i18n.t('farewell')).toBe('Goodbye');
    });

    it('should return the key when translation is missing', () => {
      expect(i18n.t('nonexistent')).toBe('nonexistent');
    });

    it('should interpolate parameters', () => {
      expect(i18n.t('welcome', { name: 'John' })).toBe('Welcome, John!');
    });
  });

  describe('language switching', () => {
    it('should switch the current language', async () => {
      await i18n.loadTranslations('ru');
      await i18n.switchLanguage('ru');
      expect(i18n.getCurrentLanguage()).toBe('ru');
      expect(i18n.t('greeting')).toBe('Привет');
    });

    it('should detect the browser language', () => {
      const detected = i18n.getBrowserLanguage();
      expect(['en', 'ru']).toContain(detected);
    });
  });
});
