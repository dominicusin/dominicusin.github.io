/**
 * @fileoverview Vector Store - IndexedDB persistence for vector search
 * @module services/vector-store
 * @description Minimal Promise-based IndexedDB wrapper used by the PWA to cache
 * post vectors offline. No external dependencies. Falls back to an in-memory
 * map when IndexedDB is unavailable (e.g. private mode / Node tests with mock).
 */

const DB_NAME = 'vector-search';
const STORE = 'vectors';
const VERSION = 1;

function promisify(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class VectorStore {
  /**
   * @param {Object} [opts]
   * @param {string} [opts.dbName]
   * @param {IDBFactory} [opts.idbFactory] - injectable for tests
   */
  constructor(opts = {}) {
    this.dbName = opts.dbName || DB_NAME;
    this.idbFactory = opts.idbFactory !== undefined
      ? opts.idbFactory
      : (typeof indexedDB !== 'undefined' ? indexedDB : null);
    this.db = null;
    // In-memory fallback when IndexedDB is unavailable.
    this._mem = new Map();
    this._useMemory = !this.idbFactory;
  }

  /**
   * Open (or create) the database.
   * @returns {Promise<void>}
   */
  async open() {
    if (this.db) return;
    if (this._useMemory || !this.idbFactory) {
      this._useMemory = true;
      return;
    }
    const req = this.idbFactory.open(this.dbName, VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    this.db = await promisify(req);
  }

  /**
   * Store a single post vector.
   * @param {Object} record - { id, url, vector: Array<[term, weight]>, post }
   * @returns {Promise<void>}
   */
  async put(record) {
    await this.open();
    if (this._useMemory) {
      this._mem.set(record.id, record);
      return;
    }
    const tx = this.db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(record);
    return promisify(tx);
  }

  /**
   * Bulk store vectors (used to warm the offline cache).
   * @param {Array<Object>} records
   * @returns {Promise<void>}
   */
  async bulkPut(records) {
    await this.open();
    if (this._useMemory) {
      for (const r of records) this._mem.set(r.id, r);
      return;
    }
    const tx = this.db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    for (const r of records) store.put(r);
    return promisify(tx);
  }

  /**
   * Get a stored vector by id.
   * @param {string} id
   * @returns {Promise<Object|undefined>}
   */
  async get(id) {
    await this.open();
    if (this._useMemory) return this._mem.get(id);
    const tx = this.db.transaction(STORE, 'readonly');
    return promisify(tx.objectStore(STORE).get(id));
  }

  /**
   * Retrieve all stored vectors (for offline search).
   * @returns {Promise<Array<Object>>}
   */
  async getAll() {
    await this.open();
    if (this._useMemory) return [...this._mem.values()];
    const tx = this.db.transaction(STORE, 'readonly');
    return promisify(tx.objectStore(STORE).getAll());
  }

  /**
   * Clear all stored vectors.
   * @returns {Promise<void>}
   */
  async clear() {
    await this.open();
    if (this._useMemory) {
      this._mem.clear();
      return;
    }
    const tx = this.db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    return promisify(tx);
  }

  /**
   * True if running on the in-memory fallback (no IndexedDB).
   * @returns {boolean}
   */
  isMemoryFallback() {
    return this._useMemory;
  }
}

export default VectorStore;
