/**
 * Service Worker для Progressive Web App функциональности
 * Кэширование ресурсов, оффлайн доступность и обновления
 */

const CACHE_NAME = 'engineering-blog-v1';
const STATIC_CACHE = 'static-cache-v1';
const CONTENT_CACHE = 'content-cache-v1';

// Список ресурсов для кэширования при установке
const STATIC_ASSETS = [
  '/',
  '/css/main.css',
  '/js/i18n.js',
  '/js/interactive.js',
  '/assets/i18n/en.json',
  '/assets/i18n/ru.json',
  '/favicon.ico',
  '/favicon.svg',
  '/manifest.json'
];

// Паттерны для кэширования контента
const CONTENT_PATTERNS = [
  /^\/$/,
  /^\/about\/?$/,
  /^\/archive\/?$/,
  /^\/categories\//,
  /^\/tags\//,
  /^\/feed\.xml$/,
  /^\/assets\//
];

// Событие установки SW
self.addEventListener('install', (event) => {
  console.log('SW: Installing');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('SW: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('SW: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('SW: Failed to cache static assets:', error);
      })
  );
});

// Событие активации SW
self.addEventListener('activate', (event) => {
  console.log('SW: Activating');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Удалить старые кэши
            if (cacheName !== STATIC_CACHE && 
                cacheName !== CONTENT_CACHE &&
                cacheName !== CACHE_NAME) {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('SW: Old caches deleted');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('SW: Failed to activate:', error);
      })
  );
});

// Событие перехвата запросов
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Пропускаем non-GET запросы
  if (request.method !== 'GET') {
    return;
  }
  
  // Пропускаем chrome-extension и другие протоколы
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

/**
 * Обработка запросов
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // 1. Проверить в кэше
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Для контентных запросов обновить в фоне
      if (shouldUpdateInBackground(url.pathname)) {
        updateCacheInBackground(request);
      }
      return cachedResponse;
    }
    
    // 2. Запросить из сети
    const networkResponse = await fetchWithTimeout(request);
    
    // 3. Кэшировать ответ
    if (shouldCache(url.pathname, networkResponse)) {
      const cache = await getCacheForUrl(url.pathname);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('SW: Network request failed:', error);
    
    // 4. Fallback strategies
    return getFallbackResponse(request);
  }
}

/**
 * Получить соответствующий кэш для URL
 */
async function getCacheForUrl(pathname) {
  if (isStaticAsset(pathname)) {
    return caches.open(STATIC_CACHE);
  } else if (shouldCacheContent(pathname)) {
    return caches.open(CONTENT_CACHE);
  } else {
    return caches.open(CACHE_NAME);
  }
}

/**
 * Проверить нужно ли кэшировать контент
 */
function shouldCacheContent(pathname) {
  return CONTENT_PATTERNS.some(pattern => pattern.test(pathname));
}

/**
 * Проверить является ли ресурс статическим
 */
function isStaticAsset(pathname) {
  return /\.(css|js|json|ico|svg|png|jpg|jpeg|gif|webp|woff|woff2)$/i.test(pathname);
}

/**
 * Проверить нужно ли кэшировать ответ
 */
function shouldCache(pathname, response) {
  // Не кэшировать ошибки
  if (!response.ok) return false;
  
  // Всегда кэшировать статические ресурсы
  if (isStaticAsset(pathname)) return true;
  
  // Кэшировать контентные страницы
  if (shouldCacheContent(pathname)) return true;
  
  return false;
}

/**
 * Проверить нужно ли обновлять в фоне
 */
function shouldUpdateInBackground(pathname) {
  // Обновлять в фоне только контентные страницы
  return shouldCacheContent(pathname) && !isStaticAsset(pathname);
}

/**
 * Обновление кэша в фоне
 */
function updateCacheInBackground(request) {
  fetch(request)
    .then(response => {
      if (response.ok) {
        const url = new URL(request.url);
        getCacheForUrl(url.pathname)
          .then(cache => cache.put(request, response));
      }
    })
    .catch(error => {
      console.log('SW: Background update failed:', error);
    });
}

/**
 * Fetch с таймаутом
 */
function fetchWithTimeout(request, timeout = 5000) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeout)
    )
  ]);
}

/**
 * Fallback ответ при ошибках сети
 */
async function getFallbackResponse(request) {
  const url = new URL(request.url);
  
  // Для HTML страниц вернуть офлайн страницу
  if (request.headers.get('accept')?.includes('text/html')) {
    return caches.match('/offline.html') || createOfflineResponse();
  }
  
  // Для изображений вернуть placeholder
  if (request.headers.get('accept')?.includes('image/')) {
    return createImagePlaceholder();
  }
  
  // Для других запросов вернуть ошибку
  return new Response('Service Unavailable', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

/**
 * Создать офлайн ответ
 */
function createOfflineResponse() {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Offline - Engineering Blog</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: #f7fafc;
          color: #2d3748;
          text-align: center;
        }
        .container {
          max-width: 400px;
          padding: 2rem;
        }
        h1 { color: #4158D0; margin-bottom: 1rem; }
        p { margin-bottom: 1.5rem; line-height: 1.6; }
        .btn {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          background: #4158D0;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .btn:hover { background: #2c3e8f; }
        .icon { font-size: 4rem; margin-bottom: 1rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📡</div>
        <h1>You're Offline</h1>
        <p>It seems you've lost your internet connection. Some content may still be available from cache.</p>
        <a href="/" class="btn">Try Again</a>
      </div>
    </body>
    </html>
  `;
  
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache'
    }
  });
}

/**
 * Создать плейсхолдер для изображений
 */
function createImagePlaceholder() {
  const svg = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" text-anchor="middle" dy="0.3em" 
            font-family="Arial, sans-serif" font-size="14" fill="#999">
        Image unavailable
      </text>
    </svg>
  `;
  
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache'
    }
  });
}

// Обработка сообщений от клиента
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches()
      .then(() => {
        event.ports[0].postMessage({ success: true });
      })
      .catch(error => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
  }
});

/**
 * Очистка всех кэшей
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('SW: All caches cleared');
}

// Периодическая очистка старых кэшей
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanupOldCache());
  }
});

/**
 * Очистка старого кэша
 */
async function cleanupOldCache() {
  try {
    const cache = await caches.open(CONTENT_CACHE);
    const requests = await cache.keys();
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 дней
    
    for (const request of requests) {
      const response = await cache.match(request);
      const dateHeader = response?.headers.get('date');
      
      if (dateHeader) {
        const responseDate = new Date(dateHeader).getTime();
        if (now - responseDate > maxAge) {
          await cache.delete(request);
        }
      }
    }
    
    console.log('SW: Old cache cleaned up');
  } catch (error) {
    console.error('SW: Cache cleanup failed:', error);
  }
}