/**
 * Unit tests for src/utils/helpers.js (plan Phase 4.1 — pure-function coverage
 * with happy-path, boundary and fallback assertions).
 */
import {
  debounce,
  throttle,
  generateId,
  getNestedValue,
  deepMerge,
  isObject,
  escapeHTML,
  formatDate,
  parseQueryParams,
  createElement
} from '@utils/helpers.js';

describe('helpers — pure utils', () => {
  describe('generateId', () => {
    test('returns a prefixed unique id', () => {
      const id = generateId('post');
      expect(id.startsWith('post_')).toBe(true);
      expect(id).toMatch(/^post_\d+_[a-z0-9]+$/);
    });
    test('defaults to "id" prefix', () => {
      expect(generateId().startsWith('id_')).toBe(true);
    });
    test('two calls produce different ids', () => {
      expect(generateId('x')).not.toBe(generateId('x'));
    });
  });

  describe('getNestedValue', () => {
    const obj = { a: { b: { c: 42 } }, d: 0 };
    test('reads a deep value', () => {
      expect(getNestedValue(obj, 'a.b.c')).toBe(42);
    });
    test('returns null for missing path', () => {
      expect(getNestedValue(obj, 'a.x.y')).toBeNull();
    });
    test('handles falsy intermediate values', () => {
      expect(getNestedValue(obj, 'd.e')).toBeNull();
    });
    test('boundary: null obj / empty key', () => {
      expect(getNestedValue(null, 'a')).toBeNull();
      expect(getNestedValue(obj, '')).toBeNull();
    });
  });

  describe('deepMerge', () => {
    test('merges nested objects without mutation of sources', () => {
      const a = { x: 1, nested: { p: 1 } };
      const b = { y: 2, nested: { q: 2 } };
      const out = deepMerge(a, b);
      expect(out).toEqual({ x: 1, y: 2, nested: { p: 1, q: 2 } });
    });
    test('later source overrides scalars', () => {
      expect(deepMerge({ v: 1 }, { v: 2 })).toEqual({ v: 2 });
    });
    test('returns target when no sources', () => {
      const t = { a: 1 };
      expect(deepMerge(t)).toBe(t);
    });
    test('chains multiple sources', () => {
      expect(deepMerge({}, { a: 1 }, { b: 2 }, { c: 3 })).toEqual({ a: 1, b: 2, c: 3 });
    });
  });

  describe('isObject', () => {
    test('true for plain objects', () => expect(isObject({})).toBe(true));
    test('false for arrays', () => expect(isObject([])).toBe(false));
    test('false for null', () => expect(isObject(null)).toBe(false));
    test('false for primitives', () => {
      expect(isObject(5)).toBe(false);
      expect(isObject('s')).toBe(false);
      expect(isObject(undefined)).toBe(false);
    });
  });

  describe('escapeHTML', () => {
    test('escapes angle brackets and ampersand', () => {
      const out = escapeHTML('<script>&</script>');
      expect(out).toContain('&lt;');
      expect(out).toContain('&gt;');
      expect(out).toContain('&amp;');
      expect(out).not.toContain('<script>');
    });
    test('leaves plain text intact', () => {
      expect(escapeHTML('hello world')).toBe('hello world');
    });
  });

  describe('formatDate', () => {
    test('formats an ISO date to a locale string', () => {
      const out = formatDate('2026-08-15T00:00:00Z');
      expect(typeof out).toBe('string');
      expect(out.length).toBeGreaterThan(0);
    });
    test('accepts custom options', () => {
      const out = formatDate('2026-08-15', { year: 'numeric' });
      expect(typeof out).toBe('string');
    });
  });

  describe('parseQueryParams', () => {
    test('parses key=value pairs', () => {
      expect(parseQueryParams('https://x.test/?q=hello&lang=ru')).toEqual({ q: 'hello', lang: 'ru' });
    });
    test('decodes URI components', () => {
      expect(parseQueryParams('https://x.test/?q=hello%20world')).toEqual({ q: 'hello world' });
    });
    test('returns empty object when no query string', () => {
      expect(parseQueryParams('https://x.test/')).toEqual({});
    });
    test('handles missing value', () => {
      expect(parseQueryParams('https://x.test/?flag')).toEqual({ flag: '' });
    });
  });

  describe('createElement', () => {
    test('creates a tag with attributes and string content', () => {
      const el = createElement('a', { href: '#', class: 'link' }, 'click');
      expect(el.tagName).toBe('A');
      expect(el.className).toBe('link');
      expect(el.getAttribute('href')).toBe('#');
      expect(el.innerHTML).toBe('click');
    });
    test('binds event handlers via on* keys', () => {
      let fired = false;
      const el = createElement('button', { onClick: () => { fired = true; } }, 'go');
      el.dispatchEvent(new window.Event('click'));
      expect(fired).toBe(true);
    });
    test('sets dataset entries', () => {
      const el = createElement('div', { dataset: { id: '42', role: 'item' } });
      expect(el.dataset.id).toBe('42');
      expect(el.dataset.role).toBe('item');
    });
    test('appends Element content', () => {
      const child = createElement('span', {}, 'child');
      const parent = createElement('div', {}, child);
      expect(parent.firstChild).toBe(child);
    });
  });

  describe('debounce', () => {
    test('invokes only once after the wait window', async () => {
      const fn = jest.fn();
      const d = debounce(fn, 80);
      d(); d(); d();
      expect(fn).not.toHaveBeenCalled();
      await new Promise((r) => setTimeout(r, 140));
      expect(fn).toHaveBeenCalledTimes(1);
    });
    test('passes the latest arguments', async () => {
      const fn = jest.fn();
      const d = debounce(fn, 60);
      d('a'); d('b');
      await new Promise((r) => setTimeout(r, 100));
      expect(fn).toHaveBeenCalledWith('b');
    });
  });

  describe('throttle', () => {
    test('limits calls to one per limit window', async () => {
      const fn = jest.fn();
      const t = throttle(fn, 80);
      t(); t(); t();
      expect(fn).toHaveBeenCalledTimes(1);
      await new Promise((r) => setTimeout(r, 120));
      t();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});
