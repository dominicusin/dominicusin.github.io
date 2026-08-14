# Engineering Blog

[![CI/CD Pipeline](https://github.com/DominicusIn/engineering-blog/actions/workflows/ci.yml/badge.svg)](https://github.com/DominicusIn/engineering-blog/actions/workflows/ci.yml)
![Node.js](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

Современный статический блог о промышленной инженерии, системной инженерии и data science с модульной архитектурой, PWA поддержкой и мультиязычностью.

## 🚀 Особенности

- **Модульная архитектура** - ES6 модули с чётким разделением ответственности
- **PWA Ready** - Service Worker, offline режим, install prompt
- **Мультиязычность** - Поддержка EN/RU с интернационализацией
- **Темизация** - Светлая/тёмная тема с автоопределением
- **Оптимизация** - Lazy loading изображений, code splitting, минификация
- **Аналитика** - Core Web Vitals мониторинг, tracking событий
- **Поиск** - Полнотекстовый поиск с Lunr.js
- **Социальные сети** - Кнопки шеринга для популярных платформ
- **Подписки** - RSS и email подписки

## 📦 Установка

```bash
# Clone repository
git clone https://github.com/DominicusIn/engineering-blog.git
cd engineering-blog

# Install Node.js dependencies
npm install

# Install Ruby dependencies
bundle install
```

## 🔧 Разработка

```bash
# Start development server with live reload
npm run dev

# Build assets only
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## 🏗️ Сборка

```bash
# Production build
npm run build:production

# Deploy to GitHub Pages
npm run deploy
```

## 📁 Структура проекта

```
/workspace
├── src/                      # Исходный код JavaScript
│   ├── config/              # Конфигурация (constants.js)
│   ├── core/                # Базовые модули (theme-manager.js)
│   ├── modules/             # Функциональные модули
│   │   ├── i18n.js          # Интернационализация
│   │   ├── search-engine.js # Поиск
│   │   ├── image-optimizer.js # Оптимизация изображений
│   │   ├── social-sharing.js # Социальные сети
│   │   └── subscription.js  # Система подписок
│   ├── services/            # Сервисы
│   │   ├── analytics-service.js # Аналитика
│   │   └── pwa-service.js   # PWA функциональность
│   ├── utils/               # Утилиты
│   │   ├── helpers.js       # Вспомогательные функции
│   │   └── storage.js       # Работа с хранилищем
│   └── index.js             # Точка входа
├── tests/                    # Тесты
│   ├── unit/                # Unit тесты
│   └── integration/         # Integration тесты
├── docs/                     # Документация
│   ├── ARCHITECTURE.md      # Архитектура проекта
│   ├── CONTRIBUTING.md      # Руководство по внесению изменений
│   ├── TESTING.md           # Руководство по тестированию
│   ├── PERFORMANCE.md       # Руководство по оптимизации
│   └── CHANGELOG.md         # История изменений
├── _layouts/                 # Jekyll шаблоны
├── _includes/                # Jekyll включает
└── js/                       # Скомпилированные файлы
    └── refactored-bundle.js # Основной бандл (69KB minified)
```

## 🧪 Тестирование

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Покрытие тестами

| Модуль | Покрытие | Статус |
|--------|----------|--------|
| Utils (helpers, storage) | 100% | ✅ |
| Core (theme-manager) | 95%+ | ✅ |
| Modules (i18n, search, etc.) | 90%+ | ✅ |
| Services (analytics, pwa) | 90%+ | ✅ |
| Integration tests | Critical paths | ✅ |

## 📊 Производительность

### Целевые метрики

| Метрика | Цель | Текущая |
|---------|------|---------|
| Lighthouse Score | 95+ | 90+ |
| LCP | < 2.5s | ~1.8s |
| FID | < 100ms | ~50ms |
| CLS | < 0.1 | ~0.05 |
| Bundle Size | < 70KB | 69KB |

### Оптимизации

- Code splitting с ленивой загрузкой модулей
- Tree shaking для удаления неиспользуемого кода
- Минификация JS/CSS с esbuild
- Lazy loading изображений с IntersectionObserver
- Debounce/throttle для событий
- Passive event listeners для скролла

## 🌐 API

### Глобальные объекты

```javascript
// App registry
window.App // Центральный объект приложения

// Theme Manager
window.themeManager.setTheme('dark')
window.themeManager.getTheme() // 'light' | 'dark' | 'auto'

// I18n
window.i18n.setLocale('ru')
window.t('greeting', { name: 'John' }) // Перевод

// Search
window.searchEngine.query('query string')

// Analytics
window.analyticsService.trackEvent('custom_event', { data })
```

### Модули

```javascript
import { ThemeManager } from './src/core/theme-manager.js';
import { I18nManager } from './src/modules/i18n.js';
import { SearchEngine } from './src/modules/search-engine.js';
import { AnalyticsService } from './src/services/analytics-service.js';
```

## 📚 Документация

- [Архитектура](docs/ARCHITECTURE.md) - Описание архитектуры проекта
- [Тестирование](docs/TESTING.md) - Руководство по тестированию
- [Оптимизация](docs/PERFORMANCE.md) - Руководство по производительности
- [Внесение изменений](docs/CONTRIBUTING.md) - Как внести свой вклад
- [История изменений](docs/CHANGELOG.md) - Changelog

## 🛠️ Технологии

- **Jekyll** - Статический генератор
- **ESBuild** - Быстрый бандлер
- **ES6 Modules** - Модульная архитектура
- **Service Worker** - PWA поддержка
- **Lunr.js** - Полнотекстовый поиск
- **IntersectionObserver** - Lazy loading

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE)

## 👥 Контакты

- **Author**: DominicusIn
- **Email**: dominicusin@example.com
- **GitHub**: [@DominicusIn](https://github.com/DominicusIn)

---

*Последнее обновление: 2025-08-14 | Версия: 2.1.0*
