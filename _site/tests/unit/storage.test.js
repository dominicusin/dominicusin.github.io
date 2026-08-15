/**
 * Unit tests for src/utils/storage.js (plan Phase 4.1 — includes the
 * localStorage -> in-memory fallback branch the plan calls out as critical).
 */
import {
  LocalStorage,
  SessionStorage,
  isLocalStorageAvailable,
  isSessionStorageAvailable,
  themeStorage,
  languageStorage
} from '@utils/storage.js';

describe('storage — LocalStorage', () => {
  test('set/get round-trips JSON objects', () => {
    const s = new LocalStorage('ut');
    s.set('obj', { a: 1, b: [2, 3] });
    expect(s.get('obj')).toEqual({ a: 1, b: [2, 3] });
  });

  test('returns defaultValue for missing key', () => {
    const s = new LocalStorage('ut');
    expect(s.get('missing', 'fallback')).toBe('fallback');
  });

  test('stores and returns raw strings without double-encoding', () => {
    const s = new LocalStorage('ut');
    s.set('name', 'plain');
    expect(s.get('name')).toBe('plain');
  });

  test('remove deletes a key', () => {
    const s = new LocalStorage('ut');
    s.set('k', 1);
    s.remove('k');
    expect(s.get('k')).toBeNull();
  });

  test('clear removes only namespaced keys when prefix set', () => {
    const s = new LocalStorage('ns');
    s.set('a', 1);
    s.set('b', 2);
    s.clear();
    expect(s.get('a')).toBeNull();
    expect(s.get('b')).toBeNull();
  });

  test('keys() lists namespaced keys only', () => {
    const s = new LocalStorage('ns2');
    s.set('x', 1);
    s.set('y', 2);
    expect(s.keys().sort()).toEqual(['ns2:x', 'ns2:y']);
  });

  test('length reflects stored count (global localStorage length)', () => {
    const s = new LocalStorage('len');
    s.set('a', 1);
    s.set('b', 2);
    // NOTE: length() returns the GLOBAL localStorage length (not namespaced),
    // so assert it accounts for the keys we just added.
    expect(s.length()).toBeGreaterThanOrEqual(2);
  });

  test('set(undefined) removes the key', () => {
    const s = new LocalStorage('ut');
    s.set('k', 5);
    s.set('k', undefined);
    expect(s.get('k')).toBeNull();
  });

  describe('in-memory fallback (localStorage unavailable)', () => {
    let realLocalStorage;
    beforeEach(() => {
      // Force localStorage to throw so isLocalStorageAvailable() => false.
      realLocalStorage = Object.getOwnPropertyDescriptor(window, 'localStorage');
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() { throw new Error('SecurityError'); }
      });
    });
    afterEach(() => {
      if (realLocalStorage) Object.defineProperty(window, 'localStorage', realLocalStorage);
    });

    test('falls back to in-memory Map and still round-trips', () => {
      expect(isLocalStorageAvailable()).toBe(false);
      const s = new LocalStorage('fb');
      s.set('a', { v: 1 });
      expect(s.get('a')).toEqual({ v: 1 });
      s.set('b', 'txt');
      expect(s.get('b')).toBe('txt');
      expect(s.length()).toBe(2);
      s.remove('a');
      expect(s.get('a')).toBeNull();
      s.clear();
      expect(s.length()).toBe(0);
    });
  });
});

describe('storage — SessionStorage', () => {
  test('round-trips through sessionStorage', () => {
    const s = new SessionStorage('ss');
    s.set('k', { x: 9 });
    expect(s.get('k')).toEqual({ x: 9 });
  });

  test('namespaced keys', () => {
    const s = new SessionStorage('ss2');
    s.set('a', 1);
    expect(s.keys()).toContain('ss2:a');
  });
});

describe('storage — pre-configured instances', () => {
  test('themeStorage and languageStorage are usable LocalStorage', () => {
    expect(themeStorage).toBeInstanceOf(LocalStorage);
    expect(languageStorage).toBeInstanceOf(LocalStorage);
    themeStorage.set('probe', 'dark');
    expect(themeStorage.get('probe')).toBe('dark');
    themeStorage.remove('probe');
  });
  test('isSessionStorageAvailable returns boolean', () => {
    expect(typeof isSessionStorageAvailable()).toBe('boolean');
  });
});
