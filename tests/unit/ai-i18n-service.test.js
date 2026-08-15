/**
 * Unit tests for src/services/ai-i18n-service.js (plan Phase 4.1 — raise the
 * 0% coverage on this module). Pure logic: key lookup, param interpolation,
 * fallback chain, language-name maps, template generation, singleton. Packs are
 * seeded via importPack() to avoid the dynamic JSON import in the test env.
 */
import { AiAssistantI18n, getAiI18n } from '@services/ai-i18n-service.js';

const EN = {
  greeting: 'Hello {{name}}',
  nav: { home: 'Home', about: 'About' },
  empty: ''
};
const RU = {
  greeting: 'Привет {{name}}',
  nav: { home: 'Главная' }
};

describe('AiAssistantI18n', () => {
  let i18n;
  beforeEach(() => {
    i18n = new AiAssistantI18n({ defaultLanguage: 'en' });
    i18n.importPack('en', EN);
    i18n.importPack('ru', RU);
  });

  test('constructor defaults', () => {
    const d = new AiAssistantI18n();
    expect(d.defaultLanguage).toBe('en');
    expect(d.currentLanguage).toBe('en');
    expect(d.supportedLanguages).toContain('en');
  });

  test('getLanguageName / getNativeLanguageName', () => {
    expect(i18n.getLanguageName('ru')).toBe('Russian');
    expect(i18n.getNativeLanguageName('ru')).toBe('Русский');
    expect(i18n.getLanguageName('xx')).toBe('XX');
  });

  test('importPack registers language and pack', () => {
    expect(i18n.languagePacks.get('en')).toBe(EN);
    expect(i18n.getAvailableLanguages().find(l => l.code === 'en').loaded).toBe(true);
  });

  test('t() deep key lookup', () => {
    i18n.currentLanguage = 'en';
    expect(i18n.t('nav.home')).toBe('Home');
  });

  test('t() interpolates {{params}}', () => {
    i18n.currentLanguage = 'en';
    expect(i18n.t('greeting', { name: 'Bob' })).toBe('Hello Bob');
  });

  test('t() falls back to default language when key missing in current', () => {
    i18n.currentLanguage = 'ru';
    expect(i18n.t('nav.about')).toBe('About'); // present in en only
  });

  test('t() returns the key when not found anywhere', () => {
    i18n.currentLanguage = 'ru';
    expect(i18n.t('missing.key')).toBe('missing.key');
  });

  test('t() returns key when no pack loaded', () => {
    const empty = new AiAssistantI18n();
    expect(empty.t('anything')).toBe('anything');
  });

  test('has() reflects presence in the current pack (no fallback)', () => {
    i18n.currentLanguage = 'ru';
    expect(i18n.has('nav.home')).toBe(true);    // present in ru
    expect(i18n.has('nav.about')).toBe(false);  // only in en -> no fallback
    expect(i18n.has('nope')).toBe(false);
    i18n.currentLanguage = 'en';
    expect(i18n.has('nav.about')).toBe(true);   // present in en
  });

  test('exportCurrentPack returns language + translations + timestamp', () => {
    i18n.currentLanguage = 'en';
    const out = i18n.exportCurrentPack();
    expect(out.language).toBe('en');
    expect(out.translations).toBe(EN);
    expect(typeof out.timestamp).toBe('string');
  });

  test('exportCurrentPack returns null when no pack', () => {
    const empty = new AiAssistantI18n();
    expect(empty.exportCurrentPack()).toBeNull();
  });

  test('generateTemplate produces TODO placeholders from base pack', () => {
    const tpl = i18n.generateTemplate('fr');
    expect(tpl.greeting).toContain('TODO: Translate');
    expect(tpl.nav.home).toContain('TODO: Translate');
  });

  test('generateTemplate returns {} when base pack missing', () => {
    const empty = new AiAssistantI18n();
    expect(empty.generateTemplate()).toEqual({});
  });

  test('getAvailableLanguages marks loaded state', () => {
    const list = i18n.getAvailableLanguages();
    expect(list.find(l => l.code === 'en').loaded).toBe(true);
    expect(list.find(l => l.code === 'ru').loaded).toBe(true);
    expect(list.find(l => l.code === 'es').loaded).toBe(false);
  });

  test('detectBrowserLanguage triggers switch to a supported navigator.language', async () => {
    const saved = global.navigator.language;
    Object.defineProperty(global.navigator, 'language', { configurable: true, value: 'ru-RU' });
    const d = new AiAssistantI18n({ defaultLanguage: 'en' });
    // detectBrowserLanguage fires setLanguage without awaiting; wait a tick.
    d.detectBrowserLanguage();
    await new Promise(r => setTimeout(r, 10));
    expect(d.currentLanguage).toBe('ru');
    Object.defineProperty(global.navigator, 'language', { configurable: true, value: saved });
  });

  test('detectBrowserLanguage keeps default for unsupported language', () => {
    const saved = global.navigator.language;
    Object.defineProperty(global.navigator, 'language', { configurable: true, value: 'xx-XX' });
    const d = new AiAssistantI18n({ defaultLanguage: 'en' });
    expect(() => d.detectBrowserLanguage()).not.toThrow();
    expect(d.currentLanguage).toBe('en');
    Object.defineProperty(global.navigator, 'language', { configurable: true, value: saved });
  });

  test('setLanguage switches currentLanguage and dispatches event', () => {
    i18n.currentLanguage = 'en';
    const handler = jest.fn();
    window.addEventListener('ai-language-changed', handler);
    return i18n.setLanguage('ru').then(() => {
      expect(i18n.currentLanguage).toBe('ru');
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ detail: { language: 'ru' } }));
    });
  });
});

describe('getAiI18n singleton', () => {
  test('returns the same instance', () => {
    const a = getAiI18n({ defaultLanguage: 'en' });
    const b = getAiI18n();
    expect(a).toBe(b);
  });
});
