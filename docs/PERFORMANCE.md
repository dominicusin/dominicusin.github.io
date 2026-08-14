# Руководство по оптимизации производительности

## 📊 Целевые метрики

### Core Web Vitals

| Метрика | Хорошая | Требует улучшения | Плохая |
|---------|---------|-------------------|--------|
| LCP (Largest Contentful Paint) | < 2.5s | 2.5-4.0s | > 4.0s |
| FID (First Input Delay) | < 100ms | 100-300ms | > 300ms |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.1-0.25 | > 0.25 |

### Lighthouse Score

| Категория | Цель | Текущая |
|-----------|------|---------|
| Performance | 95+ | 90+ |
| Accessibility | 95+ | 95+ |
| Best Practices | 95+ | 95+ |
| SEO | 95+ | 95+ |

---

## 🚀 Стратегии оптимизации

### 1. Оптимизация JavaScript

#### Code Splitting

```javascript
// src/index.js - ленивая загрузка модулей
const modules = {
  critical: [
    './core/theme-manager.js',
    './modules/i18n.js'
  ],
  conditional: {
    search: './modules/search-engine.js',
    analytics: './services/analytics-service.js'
  }
};

// Загрузка критических модулей немедленно
await Promise.all(modules.critical.map(path => import(path)));

// Загрузка условных модулей по требованию
if (document.querySelector('[data-search]')) {
  await import('./modules/search-engine.js');
}
```

#### Tree Shaking

```javascript
// ✅ ПРАВИЛЬНО: Именованные импорты
import { debounce, throttle } from './utils/helpers.js';

// ❌ НЕПРАВИЛЬНО: Namespace imports
import * as helpers from './utils/helpers.js';
```

#### Минификация

```bash
# Сборка с минификацией
npx esbuild src/index.js --bundle --outfile=js/bundle.js --minify

# Размер бандла: ~69KB (минифицированный)
```

### 2. Оптимизация изображений

#### Lazy Loading

```javascript
// src/modules/image-optimizer.js
export class ImageOptimizer {
  constructor() {
    this.observer = new IntersectionObserver(
      this.onIntersect.bind(this),
      { rootMargin: '50px', threshold: 0.01 }
    );
  }
  
  observe(images) {
    images.forEach(img => this.observer.observe(img));
  }
}
```

#### Форматы изображений

```html
<!-- Используйте modern форматы -->
<picture>
  <source srcset="image.webp" type="image/webp">
  <source srcset="image.avif" type="image/avif">
  <img src="image.jpg" alt="Description" loading="lazy">
</picture>
```

### 3. Оптимизация CSS

#### Критический CSS

```html
<!-- В head: только критический CSS -->
<style>
  /* Critical CSS for above-the-fold content */
  body { margin: 0; font-family: system-ui; }
  .header { display: flex; }
</style>

<!-- Остальной CSS загружается асинхронно -->
<link rel="preload" href="/css/main.css" as="style" onload="this.rel='stylesheet'">
```

#### Удаление неиспользуемого CSS

```bash
# Использование PurgeCSS
npx purgecss --css css/main.css --content _site/**/*.html --output css/purged.css
```

### 4. Оптимизация шрифтов

```html
<!-- Preload критических шрифтов -->
<link rel="preload" href="/fonts/inter-var.woff2" as="font" crossorigin>

<!-- Font display swap -->
<style>
  @font-face {
    font-family: 'Inter';
    src: url('/fonts/inter-var.woff2') format('woff2');
    font-display: swap;
  }
</style>
```

### 5. Caching Strategy

#### Service Worker

```javascript
// sw.js - стратегии кэширования
const CACHE_NAME = 'engineering-blog-v2';

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Cache-first для статических активов
  if (request.destination === 'style' || 
      request.destination === 'script') {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // Network-first для API
  if (request.url.includes('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Stale-while-revalidate для страниц
  event.respondWith(staleWhileRevalidate(request));
});
```

### 6. Оптимизация событий

#### Debounce & Throttle

```javascript
// src/utils/helpers.js

// Debounce для поисковых запросов
searchInput.addEventListener('input', debounce((e) => {
  searchEngine.query(e.target.value);
}, 300));

// Throttle для скролла
window.addEventListener('scroll', throttle(() => {
  analytics.trackScroll();
}, 100));
```

#### Passive Event Listeners

```javascript
// Улучшение производительности скролла
element.addEventListener('touchstart', handler, { passive: true });
element.addEventListener('wheel', handler, { passive: true });
```

---

## 📈 Мониторинг производительности

### Analytics Service

```javascript
// src/services/analytics-service.js
export class AnalyticsService {
  trackWebVitals() {
    // LCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.send('web_vital', {
        name: 'LCP',
        value: lastEntry.renderTime || lastEntry.loadTime
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });
    
    // CLS
    let clsValue = 0;
    new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.send('web_vital', { name: 'CLS', value: clsValue });
    }).observe({ entryTypes: ['layout-shift'] });
  }
}
```

### Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: push
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            http://localhost:4000/
          uploadArtifacts: true
```

---

## 🔧 Инструменты

### Анализ размера бандла

```bash
# Анализ размера файлов
npm run analyze:size

# Визуализация бандла
npx webpack-bundle-analyzer js/refactored-bundle.js
```

### Проверка производительности

```bash
# Lighthouse CLI
npx lighthouse http://localhost:4000 --output html --output-path report.html

# WebPageTest
curl https://www.webpagetest.org/runtest.php -d "url=http://example.com"
```

---

## ✅ Чеклист оптимизации

### Перед деплоем

- [ ] Все изображения оптимизированы и используют lazy loading
- [ ] CSS минифицирован и удалён неиспользуемый
- [ ] JS бандл минифицирован (< 70KB)
- [ ] Шрифты используют font-display: swap
- [ ] Включено gzip/brotli сжатие
- [ ] Настроен Service Worker
- [ ] Пройдены тесты производительности

### После деплоя

- [ ] Lighthouse score > 90
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] Мониторинг веб-виталс настроен

---

*Последнее обновление: 2025-08-14*
