/**
 * @fileoverview Unit tests for helpers module
 * @module tests/unit/helpers.test
 */

import { describe, it, expect, beforeEach, afterEach } from '../test-utils.js';
import { 
  debounce, 
  throttle, 
  generateId, 
  getNestedValue,
  isObject,
  formatDate,
  escapeHTML
} from '../../src/utils/helpers.js';

describe('Helpers', () => {
  describe('debounce', () => {
    it('should delay function execution', (done) => {
      let callCount = 0;
      const debouncedFn = debounce(() => callCount++, 100);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      expect(callCount).toBe(0);
      
      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 150);
    });
    
    it('should reset timer on subsequent calls', (done) => {
      let callCount = 0;
      const debouncedFn = debounce(() => callCount++, 50);
      
      debouncedFn();
      
      setTimeout(() => {
        debouncedFn();
      }, 25);
      
      setTimeout(() => {
        expect(callCount).toBe(0);
      }, 40);
      
      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 100);
    });
  });
  
  describe('throttle', () => {
    it('should limit function execution rate', (done) => {
      let callCount = 0;
      const throttledFn = throttle(() => callCount++, 100);
      
      throttledFn();
      throttledFn();
      throttledFn();
      
      expect(callCount).toBe(1);
      
      setTimeout(() => {
        throttledFn();
        expect(callCount).toBe(2);
        done();
      }, 150);
    });
  });
  
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).not.toBe(id2);
    });
    
    it('should use custom prefix', () => {
      const id = generateId('test');
      
      expect(id).toMatch(/^test_/);
    });
    
    it('should include timestamp in ID', () => {
      const before = Date.now();
      const id = generateId();
      const after = Date.now();
      
      const timestamp = parseInt(id.split('_')[1]);
      
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });
  
  describe('getNestedValue', () => {
    const obj = {
      a: {
        b: {
          c: 'deep value'
        },
        d: 'shallow value'
      },
      e: 'top level'
    };
    
    it('should get nested values', () => {
      expect(getNestedValue(obj, 'a.b.c')).toBe('deep value');
      expect(getNestedValue(obj, 'a.d')).toBe('shallow value');
      expect(getNestedValue(obj, 'e')).toBe('top level');
    });
    
    it('should return null for missing keys', () => {
      expect(getNestedValue(obj, 'a.b.x')).toBe(null);
      expect(getNestedValue(obj, 'x.y.z')).toBe(null);
    });
    
    it('should handle null/undefined objects', () => {
      expect(getNestedValue(null, 'a.b')).toBe(null);
      expect(getNestedValue(undefined, 'a.b')).toBe(null);
    });
  });
  
  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
    });
    
    it('should return false for arrays', () => {
      expect(isObject([])).toBe(false);
      expect(isObject([1, 2, 3])).toBe(false);
    });
    
    it('should return false for primitives', () => {
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject('string')).toBe(false);
      expect(isObject(123)).toBe(false);
      expect(isObject(true)).toBe(false);
    });
  });
  
  describe('formatDate', () => {
    it('should format date string', () => {
      const result = formatDate('2024-01-15');
      expect(result).toMatch(/\w+ \d+, \d+/);
    });
    
    it('should handle Date objects', () => {
      const date = new Date('2024-06-20');
      const result = formatDate(date);
      expect(result).toMatch(/\w+ \d+, \d+/);
    });
    
    it('should accept custom options', () => {
      const result = formatDate('2024-01-15', {
        year: 'numeric',
        month: 'long'
      });
      expect(result).toContain('January');
      expect(result).toContain('2024');
    });
  });
  
  describe('escapeHTML', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHTML('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });
    
    it('should handle plain text', () => {
      expect(escapeHTML('Hello World')).toBe('Hello World');
    });
    
    it('should escape ampersands', () => {
      expect(escapeHTML('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });
  });
});
