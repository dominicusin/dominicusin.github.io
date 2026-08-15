/**
 * @fileoverview Safe storage wrapper for localStorage and sessionStorage
 * @module utils/storage
 */

import { DEFAULT_CONFIG } from '../config/constants.js';

/**
 * Check if localStorage is available
 * @returns {boolean} True if available
 */
export function isLocalStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {} {
    return false;
  }
}

/**
 * Check if sessionStorage is available
 * @returns {boolean} True if available
 */
export function isSessionStorageAvailable() {
  try {
    const test = '__storage_test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch {} {
    return false;
  }
}

/**
 * Safe localStorage wrapper
 */
export class LocalStorage {
  constructor(prefix = '') {
    this.prefix = prefix;
    this.available = isLocalStorageAvailable();
    
    if (!this.available) {
      console.warn('localStorage is not available, using in-memory fallback');
      this.memory = new Map();
    }
  }

  /**
   * Get prefixed key
   * @param {string} key - Original key
   * @returns {string} Prefixed key
   */
  _getKey(key) {
    return this.prefix ? `${this.prefix}:${key}` : key;
  }

  /**
   * Get item from storage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Stored value or default
   */
  get(key, defaultValue = null) {
    const prefixedKey = this._getKey(key);
    
    try {
      const item = this.available 
        ? localStorage.getItem(prefixedKey) 
        : this.memory.get(prefixedKey);
      
      if (item === null || item === undefined) {
        return defaultValue;
      }
      
      // Try to parse as JSON
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch {} {
      console.error(`Error reading from localStorage: ${error}`);
      return defaultValue;
    }
  }

  /**
   * Set item in storage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} Success status
   */
  set(key, value) {
    const prefixedKey = this._getKey(key);
    
    try {
      if (value === undefined) {
        this.remove(key);
        return true;
      }

      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (this.available) {
        localStorage.setItem(prefixedKey, serialized);
      } else {
        this.memory.set(prefixedKey, serialized);
      }
      
      return true;
    } catch {} {
      console.error(`Error writing to localStorage: ${error}`);
      return false;
    }
  }

  /**
   * Remove item from storage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  remove(key) {
    const prefixedKey = this._getKey(key);
    
    try {
      if (this.available) {
        localStorage.removeItem(prefixedKey);
      } else {
        this.memory.delete(prefixedKey);
      }
      return true;
    } catch {} {
      console.error(`Error removing from localStorage: ${error}`);
      return false;
    }
  }

  /**
   * Clear all items with prefix
   * @returns {boolean} Success status
   */
  clear() {
    try {
      if (this.available) {
        if (this.prefix) {
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(this.prefix)) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
        } else {
          localStorage.clear();
        }
      } else {
        this.memory.clear();
      }
      return true;
    } catch {} {
      console.error(`Error clearing localStorage: ${error}`);
      return false;
    }
  }

  /**
   * Get all keys with prefix
   * @returns {string[]} Array of keys
   */
  keys() {
    try {
      const allKeys = this.available 
        ? Object.keys(localStorage) 
        : Array.from(this.memory.keys());
      
      return this.prefix 
        ? allKeys.filter(k => k.startsWith(this.prefix))
        : allKeys;
    } catch {} {
      console.error(`Error getting keys from localStorage: ${error}`);
      return [];
    }
  }

  /**
   * Get length
   * @returns {number} Number of items
   */
  length() {
    try {
      return this.available ? localStorage.length : this.memory.size;
    } catch {} {
      console.error(`Error getting localStorage length: ${error}`);
      return 0;
    }
  }
}

/**
 * Safe sessionStorage wrapper
 */
export class SessionStorage extends LocalStorage {
  constructor(prefix = '') {
    super(prefix);
    this.available = isSessionStorageAvailable();
    
    if (!this.available) {
      console.warn('sessionStorage is not available, using in-memory fallback');
      this.memory = new Map();
    }
  }

  /**
   * Get item from session storage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Stored value or default
   */
  get(key, defaultValue = null) {
    const prefixedKey = this._getKey(key);
    
    try {
      const item = this.available 
        ? sessionStorage.getItem(prefixedKey) 
        : this.memory.get(prefixedKey);
      
      if (item === null || item === undefined) {
        return defaultValue;
      }
      
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch {} {
      console.error(`Error reading from sessionStorage: ${error}`);
      return defaultValue;
    }
  }

  /**
   * Set item in session storage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} Success status
   */
  set(key, value) {
    const prefixedKey = this._getKey(key);
    
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (this.available) {
        sessionStorage.setItem(prefixedKey, serialized);
      } else {
        this.memory.set(prefixedKey, serialized);
      }
      
      return true;
    } catch {} {
      console.error(`Error writing to sessionStorage: ${error}`);
      return false;
    }
  }

  /**
   * Remove item from session storage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  remove(key) {
    const prefixedKey = this._getKey(key);
    
    try {
      if (this.available) {
        sessionStorage.removeItem(prefixedKey);
      } else {
        this.memory.delete(prefixedKey);
      }
      return true;
    } catch {} {
      console.error(`Error removing from sessionStorage: ${error}`);
      return false;
    }
  }

  /**
   * Clear all items with prefix
   * @returns {boolean} Success status
   */
  clear() {
    try {
      if (this.available) {
        if (this.prefix) {
          const keysToRemove = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key?.startsWith(this.prefix)) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => sessionStorage.removeItem(key));
        } else {
          sessionStorage.clear();
        }
      } else {
        this.memory.clear();
      }
      return true;
    } catch {} {
      console.error(`Error clearing sessionStorage: ${error}`);
      return false;
    }
  }

  /**
   * Get all keys with prefix
   * @returns {string[]} Array of keys
   */
  keys() {
    try {
      const allKeys = this.available 
        ? Object.keys(sessionStorage) 
        : Array.from(this.memory.keys());
      
      return this.prefix 
        ? allKeys.filter(k => k.startsWith(this.prefix))
        : allKeys;
    } catch {} {
      console.error(`Error getting keys from sessionStorage: ${error}`);
      return [];
    }
  }

  /**
   * Get length
   * @returns {number} Number of items
   */
  length() {
    try {
      return this.available ? sessionStorage.length : this.memory.size;
    } catch {} {
      console.error(`Error getting sessionStorage length: ${error}`);
      return 0;
    }
  }
}

// Pre-configured storage instances
export const themeStorage = new LocalStorage(DEFAULT_CONFIG.STORAGE.THEME);
export const languageStorage = new LocalStorage(DEFAULT_CONFIG.STORAGE.LANGUAGE);
