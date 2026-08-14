/**
 * @fileoverview Unit tests for storage module
 * @module tests/unit/storage.test
 */

import { describe, it, expect, beforeEach, afterEach } from '../test-utils.js';
import { 
  LocalStorage, 
  SessionStorage,
  isLocalStorageAvailable,
  isSessionStorageAvailable,
  themeStorage,
  languageStorage
} from '../../src/utils/storage.js';

describe('Storage Module', () => {
  
  describe('isLocalStorageAvailable', () => {
    it('should return boolean', () => {
      const result = isLocalStorageAvailable();
      expect(typeof result).toBe('boolean');
    });
  });
  
  describe('isSessionStorageAvailable', () => {
    it('should return boolean', () => {
      const result = isSessionStorageAvailable();
      expect(typeof result).toBe('boolean');
    });
  });
  
  describe('LocalStorage', () => {
    let storage;
    
    beforeEach(() => {
      storage = new LocalStorage('test-prefix');
      storage.clear();
    });
    
    afterEach(() => {
      storage.clear();
    });
    
    describe('constructor', () => {
      it('should create instance with default prefix', () => {
        const defaultStorage = new LocalStorage();
        expect(defaultStorage.prefix).toBe('');
      });
      
      it('should create instance with custom prefix', () => {
        const prefixedStorage = new LocalStorage('myapp');
        expect(prefixedStorage.prefix).toBe('myapp');
      });
    });
    
    describe('set/get', () => {
      it('should store and retrieve string values', () => {
        storage.set('key', 'value');
        expect(storage.get('key')).toBe('value');
      });
      
      it('should serialize objects to JSON', () => {
        const obj = { name: 'test', value: 42, nested: { a: 1 } };
        storage.set('obj', obj);
        expect(storage.get('obj')).toEqual(obj);
      });
      
      it('should serialize arrays to JSON', () => {
        const arr = [1, 2, 3, 'four'];
        storage.set('arr', arr);
        expect(storage.get('arr')).toEqual(arr);
      });
      
      it('should handle numbers', () => {
        storage.set('number', 42);
        expect(storage.get('number')).toBe(42);
      });
      
      it('should handle booleans', () => {
        storage.set('bool', true);
        expect(storage.get('bool')).toBe(true);
        
        storage.set('bool2', false);
        expect(storage.get('bool2')).toBe(false);
      });
      
      it('should return null for non-existent keys', () => {
        expect(storage.get('nonexistent')).toBe(null);
      });
      
      it('should return default value when provided', () => {
        expect(storage.get('missing', 'default')).toBe('default');
        expect(storage.get('missing', 0)).toBe(0);
        expect(storage.get('missing', [])).toEqual([]);
      });
    });
    
    describe('remove', () => {
      it('should remove key from storage', () => {
        storage.set('key', 'value');
        storage.remove('key');
        expect(storage.get('key')).toBe(null);
      });
      
      it('should return true on successful removal', () => {
        storage.set('key', 'value');
        const result = storage.remove('key');
        expect(result).toBe(true);
      });
      
      it('should not throw error when removing non-existent key', () => {
        expect(() => storage.remove('nonexistent')).not.toThrow();
      });
    });
    
    describe('clear', () => {
      it('should clear all namespaced keys', () => {
        storage.set('key1', 'value1');
        storage.set('key2', 'value2');
        storage.set('key3', 'value3');
        storage.clear();
        expect(storage.get('key1')).toBe(null);
        expect(storage.get('key2')).toBe(null);
        expect(storage.get('key3')).toBe(null);
      });
      
      it('should only clear keys with matching prefix', () => {
        const storage1 = new LocalStorage('prefix1');
        const storage2 = new LocalStorage('prefix2');
        
        storage1.clear();
        storage2.clear();
        
        storage1.set('shared', 'value1');
        storage2.set('shared', 'value2');
        
        storage1.clear();
        
        expect(storage1.get('shared')).toBe(null);
        expect(storage2.get('shared')).toBe('value2');
        
        storage2.clear();
      });
    });
    
    describe('keys', () => {
      it('should return array of keys', () => {
        storage.set('key1', 'value1');
        storage.set('key2', 'value2');
        
        const keys = storage.keys();
        expect(keys).toContain('test-prefix:key1');
        expect(keys).toContain('test-prefix:key2');
      });
      
      it('should return empty array when no keys', () => {
        const keys = storage.keys();
        expect(keys).toEqual([]);
      });
      
      it('should return only prefixed keys', () => {
        storage.set('prefixed', 'value');
        
        const keys = storage.keys();
        keys.forEach(key => {
          expect(key).toMatch(/^test-prefix:/);
        });
      });
    });
    
    describe('length', () => {
      it('should return 0 when empty', () => {
        expect(storage.length()).toBe(0);
      });
      
      it('should return correct count after adding items', () => {
        storage.set('key1', 'value1');
        expect(storage.length()).toBe(1);
        
        storage.set('key2', 'value2');
        expect(storage.length()).toBe(2);
      });
      
      it('should return 0 after clear', () => {
        storage.set('key1', 'value1');
        storage.set('key2', 'value2');
        storage.clear();
        expect(storage.length()).toBe(0);
      });
    });
    
    describe('_getKey (prefix handling)', () => {
      it('should prefix keys correctly', () => {
        storage.set('simple', 'value');
        // Internal check - the actual key stored should include prefix
        const storedValue = localStorage.getItem('test-prefix:simple');
        expect(storedValue).not.toBe(null);
      });
      
      it('should handle empty prefix', () => {
        const noPrefixStorage = new LocalStorage('');
        noPrefixStorage.set('key', 'value');
        
        const storedValue = localStorage.getItem('key');
        expect(storedValue).not.toBe(null);
        
        noPrefixStorage.clear();
      });
    });
    
    describe('error handling', () => {
      it('should handle storage quota exceeded gracefully', () => {
        // This test documents expected behavior
        // In real scenario, would mock localStorage to throw
        expect(() => {
          // Attempting to store very large data
          const largeData = 'x'.repeat(1000);
          storage.set('large', largeData);
        }).not.toThrow();
      });
    });
  });
  
  describe('SessionStorage', () => {
    let storage;
    
    beforeEach(() => {
      storage = new SessionStorage('test-session');
      storage.clear();
    });
    
    afterEach(() => {
      storage.clear();
    });
    
    describe('set/get', () => {
      it('should store and retrieve string values', () => {
        storage.set('key', 'value');
        expect(storage.get('key')).toBe('value');
      });
      
      it('should serialize objects to JSON', () => {
        const obj = { session: 'data', count: 5 };
        storage.set('obj', obj);
        expect(storage.get('obj')).toEqual(obj);
      });
      
      it('should return null for non-existent keys', () => {
        expect(storage.get('nonexistent')).toBe(null);
      });
    });
    
    describe('remove', () => {
      it('should remove key from session storage', () => {
        storage.set('key', 'value');
        storage.remove('key');
        expect(storage.get('key')).toBe(null);
      });
    });
    
    describe('clear', () => {
      it('should clear all namespaced session keys', () => {
        storage.set('key1', 'value1');
        storage.set('key2', 'value2');
        storage.clear();
        expect(storage.get('key1')).toBe(null);
        expect(storage.get('key2')).toBe(null);
      });
    });
    
    describe('keys', () => {
      it('should return array of session keys', () => {
        storage.set('key1', 'value1');
        storage.set('key2', 'value2');
        
        const keys = storage.keys();
        expect(keys.length).toBe(2);
      });
    });
    
    describe('length', () => {
      it('should return correct session storage length', () => {
        expect(storage.length()).toBe(0);
        
        storage.set('key1', 'value1');
        expect(storage.length()).toBe(1);
      });
    });
  });
  
  describe('Pre-configured storage instances', () => {
    describe('themeStorage', () => {
      beforeEach(() => {
        themeStorage.clear();
      });
      
      afterEach(() => {
        themeStorage.clear();
      });
      
      it('should use THEME constant as prefix', () => {
        themeStorage.set('current', 'dark');
        const value = themeStorage.get('current');
        expect(value).toBe('dark');
      });
    });
    
    describe('languageStorage', () => {
      beforeEach(() => {
        languageStorage.clear();
      });
      
      afterEach(() => {
        languageStorage.clear();
      });
      
      it('should use LANGUAGE constant as prefix', () => {
        languageStorage.set('preferred', 'ru');
        const value = languageStorage.get('preferred');
        expect(value).toBe('ru');
      });
    });
  });
  
  describe('Edge cases', () => {
    let storage;
    
    beforeEach(() => {
      storage = new LocalStorage('edge-test');
      storage.clear();
    });
    
    afterEach(() => {
      storage.clear();
    });
    
    it('should handle special characters in keys', () => {
      storage.set('key-with-dash', 'value1');
      storage.set('key_with_underscore', 'value2');
      storage.set('key.with.dot', 'value3');
      
      expect(storage.get('key-with-dash')).toBe('value1');
      expect(storage.get('key_with_underscore')).toBe('value2');
      expect(storage.get('key.with.dot')).toBe('value3');
    });
    
    it('should handle null and undefined values', () => {
      storage.set('nullValue', null);
      storage.set('undefinedValue', undefined);
      
      // null gets stringified
      expect(storage.get('nullValue')).toBe(null);
      expect(storage.get('undefinedValue')).toBe(null);
    });
    
    it('should handle empty strings', () => {
      storage.set('empty', '');
      expect(storage.get('empty')).toBe('');
    });
    
    it('should handle deeply nested objects', () => {
      const deep = {
        level1: {
          level2: {
            level3: {
              value: 'deep'
            }
          }
        }
      };
      
      storage.set('deep', deep);
      expect(storage.get('deep')).toEqual(deep);
    });
    
    it('should handle dates (serialized)', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      storage.set('date', date);
      
      const retrieved = storage.get('date');
      // Dates get serialized to ISO strings
      expect(typeof retrieved).toBe('string');
      expect(retrieved).toBe(date.toISOString());
    });
  });
});
