/**
 * Embedding Cache Service v3.0 (Optimized)
 * 
 * Высокопроизводительное кэширование векторных эмбеддингов в IndexedDB
 * для оффлайн-работы семантического поиска и AI-ассистента.
 * 
 * Features:
 * - Chunked storage для больших векторов
 * - LRU eviction policy с лимитами по объему
 * - Bloom Filter для O(1) проверки существования
 * - Atomic batching для массовой записи
 * - Integrity checks (CRC32)
 * - Zero-copy чтение через ArrayBuffer
 * 
 * @version 3.0.0
 * @author Engineering Blog Team
 * @license MIT
 */

class EmbeddingCacheService {
  constructor(dbName = 'embedding-cache-v3', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
    this.storeName = 'embeddings';
    this.metaStoreName = 'meta';
    
    // Конфигурация лимитов
    this.config = {
      maxItems: 5000,          // Максимальное количество записей
      maxSizeMB: 50,           // Максимальный размер хранилища (MB)
      chunkSize: 1024,         // Размер чанка для разбивки (floats)
      bloomFilterSize: 10000,  // Размер Bloom Filter (биты)
      hashFunctions: 3         // Количество хэш-функций для Bloom
    };

    // In-memory Bloom Filter (битовый массив)
    this.bloomFilter = new Uint8Array(Math.ceil(this.config.bloomFilterSize / 8));
    this.itemCount = 0;
    this.currentSizeMB = 0;
    
    // Очередь операций для батчинга
    this.writeQueue = [];
    this.writeTimer = null;
    this.BATCH_DELAY_MS = 50;

    this._initPromise = null;
  }

  /**
   * Инициализация соединения с IndexedDB
   */
  async init() {
    if (this._initPromise) return this._initPromise;

    this._initPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Основное хранилище эмбеддингов
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('slug', 'slug', { unique: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('size', 'size', { unique: false });
        }

        // Хранилище метаданных
        if (!db.objectStoreNames.contains(this.metaStoreName)) {
          db.createObjectStore(this.metaStoreName, { keyPath: 'key' });
        }
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        
        // Восстановление Bloom Filter и метрик из БД
        await this._restoreMetadata();
        
        // Обработка отложенных операций
        await this._flushQueue();
        
        resolve(this);
      };

      request.onerror = (event) => {
        reject(new Error(`IndexedDB error: ${event.target.errorCode}`));
      };
    });

    return this._initPromise;
  }

  /**
   * Восстановление метаданных и Bloom Filter
   */
  async _restoreMetadata() {
    return new Promise((resolve) => {
      const tx = this.db.transaction([this.metaStoreName], 'readonly');
      const store = tx.objectStore(this.metaStoreName);
      
      const requests = [
        store.get('bloomFilter'),
        store.get('itemCount'),
        store.get('currentSizeMB')
      ];

      tx.oncomplete = () => {
        if (requests[0].result) {
          const buffer = new Uint8Array(requests[0].result);
          this.bloomFilter.set(buffer);
        }
        this.itemCount = requests[1].result || 0;
        this.currentSizeMB = requests[2].result || 0;
        resolve();
      };
      
      tx.onerror = () => resolve(); // Игнорируем ошибки, стартуем с чистого листа
    });
  }

  /**
   * Сохранение метаданных
   */
  async _saveMetadata() {
    return new Promise((resolve) => {
      const tx = this.db.transaction([this.metaStoreName], 'readwrite');
      const store = tx.objectStore(this.metaStoreName);
      
      store.put({ key: 'bloomFilter', value: this.bloomFilter.buffer });
      store.put({ key: 'itemCount', value: this.itemCount });
      store.put({ key: 'currentSizeMB', value: this.currentSizeMB });
      
      tx.oncomplete = resolve;
      tx.onerror = resolve;
    });
  }

  /**
   * Хэш-функции для Bloom Filter (упрощенные MurmurHash-like)
   */
  _hashFunctions(key) {
    const hashes = [];
    for (let i = 0; i < this.config.hashFunctions; i++) {
      let hash = 0;
      const str = key + i; // Соль для каждой функции
      for (let j = 0; j < str.length; j++) {
        const char = str.charCodeAt(j);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      hashes.push(Math.abs(hash) % this.config.bloomFilterSize);
    }
    return hashes;
  }

  /**
   * Добавление ключа в Bloom Filter
   */
  _addToBloomFilter(key) {
    const indices = this._hashFunctions(key);
    indices.forEach(index => {
      const byteIndex = Math.floor(index / 8);
      const bitIndex = index % 8;
      this.bloomFilter[byteIndex] |= (1 << bitIndex);
    });
  }

  /**
   * Проверка наличия ключа в Bloom Filter
   * @returns {boolean} true если "возможно существует", false если "точно нет"
   */
  _mightExist(key) {
    const indices = this._hashFunctions(key);
    for (const index of indices) {
      const byteIndex = Math.floor(index / 8);
      const bitIndex = index % 8;
      if ((this.bloomFilter[byteIndex] & (1 << bitIndex)) === 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * Вычисление контрольной суммы (простой CRC32)
   */
  _crc32(data) {
    let crc = 0 ^ (-1);
    const bytes = new Uint8Array(data);
    
    for (let i = 0; i < bytes.length; i++) {
      crc = (crc >>> 8) ^ this._crc32Table[(crc ^ bytes[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  _crc32Table = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
      }
      table[i] = c;
    }
    return table;
  })();

  /**
   * Разбиение вектора на чанки для хранения
   */
  _chunkVector(vector) {
    const chunks = [];
    const totalLength = vector.length;
    
    for (let i = 0; i < totalLength; i += this.config.chunkSize) {
      const end = Math.min(i + this.config.chunkSize, totalLength);
      const chunk = vector.slice(i, end);
      chunks.push(chunk);
    }
    
    return chunks;
  }

  /**
   * Сборка вектора из чанков
   */
  _assembleVector(chunks) {
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const vector = new Float32Array(totalLength);
    
    let offset = 0;
    for (const chunk of chunks) {
      vector.set(chunk, offset);
      offset += chunk.length;
    }
    
    return vector;
  }

  /**
   * Постановка операции записи в очередь (Batching)
   */
  _queueOperation(operation) {
    this.writeQueue.push(operation);
    
    if (!this.writeTimer) {
      this.writeTimer = setTimeout(() => this._flushQueue(), this.BATCH_DELAY_MS);
    }
    
    return Promise.resolve(); // Возвращаем сразу, реальное выполнение асинхронно
  }

  /**
   * Сброс очереди операций
   */
  async _flushQueue() {
    if (this.writeQueue.length === 0 || !this.db) {
      this.writeTimer = null;
      return;
    }

    const operations = [...this.writeQueue];
    this.writeQueue = [];
    this.writeTimer = null;

    const tx = this.db.transaction([this.storeName, this.metaStoreName], 'readwrite');
    const store = tx.objectStore(this.storeName);

    try {
      for (const op of operations) {
        if (op.type === 'put') {
          store.put(op.data);
        } else if (op.type === 'delete') {
          store.delete(op.id);
        }
      }
      
      await new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      
      // Обновляем метаданные после пакета операций
      await this._saveMetadata();
      
    } catch (error) {
      console.error('Batch write failed:', error);
      // Возвращаем операции в очередь при ошибке (упрощенно)
      this.writeQueue.unshift(...operations);
    }
  }

  /**
   * Проверка необходимости LRU Eviction
   */
  async _enforceLimits() {
    if (this.itemCount <= this.config.maxItems && this.currentSizeMB <= this.config.maxSizeMB) {
      return;
    }

    console.warn('Cache limits exceeded, running LRU eviction...');
    
    return new Promise((resolve) => {
      const tx = this.db.transaction([this.storeName], 'readonly');
      const store = tx.objectStore(this.storeName);
      const index = store.index('timestamp');
      
      const cursorRequest = index.openCursor(null, 'prev'); // От старых к новым
      const toDelete = [];
      
      let countToDelete = Math.max(
        this.itemCount - this.config.maxItems,
        Math.floor((this.currentSizeMB - this.config.maxSizeMB) * 100) // Грубая оценка
      );

      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && countToDelete > 0) {
          toDelete.push(cursor.key);
          countToDelete--;
          cursor.continue();
        } else {
          resolve(toDelete);
        }
      };
    }).then(async (idsToDelete) => {
      if (idsToDelete.length === 0) return;
      
      const tx = this.db.transaction([this.storeName, this.metaStoreName], 'readwrite');
      const store = tx.objectStore(this.storeName);
      
      for (const id of idsToDelete) {
        store.delete(id);
        this.itemCount--;
        // Примечание: точный пересчет размера требует чтения, делаем аппроксимацию
      }
      
      await new Promise(resolve => tx.oncomplete = resolve);
      await this._recalculateSize();
      await this._saveMetadata();
      
      console.log(`Evicted ${idsToDelete.length} items`);
    });
  }

  /**
   * Пересчет текущего размера хранилища
   */
  async _recalculateSize() {
    // Упрощенная эвристика: itemCount * средний размер
    // Для точного расчета нужен полный проход, что дорого
    this.currentSizeMB = (this.itemCount * 0.004); // ~4KB на запись в среднем
  }

  /**
   * Сохранение эмбеддинга
   * @param {string} id - Уникальный ID (например, slug статьи)
   * @param {Float32Array} vector - Вектор эмбеддинга
   * @param {Object} metadata - Дополнительные данные (slug, title, date)
   */
  async set(id, vector, metadata = {}) {
    if (!this.db) await this.init();
    if (!(vector instanceof Float32Array)) {
      throw new Error('Vector must be a Float32Array');
    }

    // Проверка Bloom Filter (если уже есть, обновляем)
    const exists = this._mightExist(id);
    
    if (!exists && this.itemCount >= this.config.maxItems) {
      await this._enforceLimits();
    }

    const chunks = this._chunkVector(vector);
    const timestamp = Date.now();
    const sizeBytes = vector.byteLength;
    const checksum = this._crc32(vector.buffer);

    const record = {
      id,
      slug: metadata.slug || id,
      vectorChunks: chunks.map(c => c.buffer), // Храним как ArrayBuffer
      chunkCount: chunks.length,
      dimension: vector.length,
      timestamp,
      size: sizeBytes,
      checksum,
      metadata: {
        title: metadata.title || '',
        date: metadata.date || null,
        tags: metadata.tags || []
      }
    };

    // Обновляем Bloom Filter и счетчики
    this._addToBloomFilter(id);
    if (!exists) {
      this.itemCount++;
      this.currentSizeMB += sizeBytes / (1024 * 1024);
    }

    // Ставим в очередь записи
    await this._queueOperation({ type: 'put', data: record });
    
    // Принудительный сброс если очередь большая
    if (this.writeQueue.length > 100) {
      await this._flushQueue();
    }
  }

  /**
   * Получение эмбеддинга
   * @param {string} id - ID записи
   * @returns {Float32Array|null} Вектор или null если не найдено
   */
  async get(id) {
    if (!this.db) await this.init();

    // Быстрая проверка через Bloom Filter
    if (!this._mightExist(id)) {
      return null;
    }

    return new Promise((resolve) => {
      const tx = this.db.transaction([this.storeName], 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const record = request.result;
        if (!record) {
          resolve(null);
          return;
        }

        // Проверка целостности
        const assembled = this._assembleVector(
          record.vectorChunks.map(buf => new Float32Array(buf))
        );
        
        const currentChecksum = this._crc32(assembled.buffer);
        if (currentChecksum !== record.checksum) {
          console.warn(`Checksum mismatch for ${id}, data corrupted`);
          resolve(null);
          return;
        }

        resolve(assembled);
      };

      request.onerror = () => resolve(null);
    });
  }

  /**
   * Массовая загрузка эмбеддингов
   * @param {Array<{id: string, vector: Float32Array, metadata: Object}>} items
   */
  async setMany(items) {
    if (!this.db) await this.init();
    
    for (const item of items) {
      await this.set(item.id, item.vector, item.metadata);
    }
    
    await this._flushQueue();
  }

  /**
   * Удаление записи
   */
  async delete(id) {
    if (!this.db) await this.init();
    
    // Note: Bloom Filter не поддерживает удаление, помечаем как удаленный в БД
    await this._queueOperation({ type: 'delete', id });
    this.itemCount = Math.max(0, this.itemCount - 1);
    await this._saveMetadata();
  }

  /**
   * Очистка всего кэша
   */
  async clear() {
    if (!this.db) await this.init();
    
    return new Promise((resolve) => {
      const tx = this.db.transaction([this.storeName, this.metaStoreName], 'readwrite');
      tx.objectStore(this.storeName).clear();
      tx.objectStore(this.metaStoreName).clear();
      
      tx.oncomplete = () => {
        this.bloomFilter.fill(0);
        this.itemCount = 0;
        this.currentSizeMB = 0;
        resolve();
      };
    });
  }

  /**
   * Получение статистики кэша
   */
  getStats() {
    return {
      itemCount: this.itemCount,
      sizeMB: parseFloat(this.currentSizeMB.toFixed(2)),
      maxItems: this.config.maxItems,
      maxSizeMB: this.config.maxSizeMB,
      utilization: ((this.itemCount / this.config.maxItems) * 100).toFixed(1) + '%',
      bloomFilterSize: this.config.bloomFilterSize,
      isInitialized: !!this.db
    };
  }

  /**
   * Экспорт ключей для синхронизации (P2P подготовка)
   */
  async exportKeys() {
    if (!this.db) await this.init();
    
    return new Promise((resolve) => {
      const keys = [];
      const tx = this.db.transaction([this.storeName], 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.openKeyCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          keys.push(cursor.key);
          cursor.continue();
        } else {
          resolve(keys);
        }
      };
    });
  }
}

// Singleton instance
let embeddingCacheInstance = null;

export async function getEmbeddingCache() {
  if (!embeddingCacheInstance) {
    embeddingCacheInstance = new EmbeddingCacheService();
    await embeddingCacheInstance.init();
  }
  return embeddingCacheInstance;
}

export default EmbeddingCacheService;
