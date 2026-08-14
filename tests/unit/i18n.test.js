/**
 * @fileoverview Unit tests for I18nManager module
 */

import { describe, it, expect, beforeEach, afterEach } from '../test-utils.js';
import { I18nManager } from '../../src/modules/i18n.js';

describe('I18nManager', () => {
  let i18n;
  let originalFetch;

  beforeEach(() => {
    // Mock fetch for translations
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
              few: '{{count}} элемента',
              many: '{{count}} элементов',
              other: '{{count}} элементов'
            }
          })
        };
      }
      return { ok: false, status: 404 };
    };

    i18n = new I18nManager({
      defaultLocale: 'en',
      supportedLocales: ['en', 'ru']
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    i18n = null;
  });

  describe('initialization', () => {
    it('should create instance with default locale', () => {
      expect(i18n).toBeInstanceOf(I18nManager);
      expect(i18n.currentLocale).toBe('en');
    });

    it('should support multiple locales', () => {
      expect(i18n.supportedLocales).toContain('en');
      expect(i18n.supportedLocales).toContain('ru');
    });
  });

  describe('loadTranslations', () => {
    it('should load translations for locale', async () => {
      await i18n.loadTranslations('en');
      const translation = i18n.t('greeting');
      expect(translation).toBe('Hello');
    });

    it('should load Russian translations', async () => {
      await i18n.loadTranslations('ru');
      const translation = i18n.t('greeting');
      expect(translation).toBe('Привет');
    });

    it('should handle missing locale gracefully', async () => {
      await i18n.loadTranslations('fr');
      const translation = i18n.t('greeting');
      expect(translation).toBe('greeting'); // Falls back to key
    });
  });

  describe('translation', () => {
    beforeEach(async () => {
      await i18n.loadTranslations('en');
    });

    it('should translate simple key', () => {
      expect(i18n.t('greeting')).toBe('Hello');
      expect(i18n.t('farewell')).toBe('Goodbye');
    });

    it('should return key if translation missing', () => {
      expect(i18n.t('nonexistent')).toBe('nonexistent');
    });

    it('should interpolate parameters', () => {
      const result = i18n.t('welcome', { name: 'John' });
      expect(result).toBe('Welcome, John!');
    });

    it('should handle nested keys', () => {
      expect(i18n.t('items.one')).toBe('One item');
    });
  });

  describe('pluralization', () => {
    beforeEach(async () => {
      await i18n.loadTranslations('en');
    });

    it('should pluralize for count=1', () => {
      const result = i18n.plural('items', 1);
      expect(result).toBe('One item');
    });

    it('should pluralize for count>1', () => {
      const result = i18n.plural('items', 5);
      expect(result).toBe('5 items');
    });
  });

  describe('locale switching', () => {
    it('should switch locale', async () => {
      await i18n.setLocale('ru');
      expect(i18n.currentLocale).toBe('ru');
      
      const greeting = i18n.t('greeting');
      expect(greeting).toBe('Привет');
    });

    it('should detect browser locale', () => {
      const detected = i18n.detectLocale();
      expect(typeof detected).toBe('string');
    });
  });

  describe('fallback', () => {
    it('should fallback to default locale when translation missing', async () => {
      await i18n.loadTranslations('ru');
      // Add only some keys to English
      i18n.translations['en']['partial'] = 'English only';
      
      i18n.fallbackLocale = 'en';
      const result = i18n.t('partial');
      expect(result).toBe('English only');
    });
  });
});
