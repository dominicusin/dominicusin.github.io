# Changelog

Все значимые изменения в проекте Engineering Blog будут задокументированы в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/),
версии следуют [Semantic Versioning](https://semver.org/lang/ru/).

## [3.1.0-beta] - 2026-01-15

### Добавлено

#### 🔗 AI Link Repair Agent
- **Link Repair Agent** (`src/agents/link-repair-agent.js`)
  - Автоматическое сканирование markdown и HTML файлов на битые ссылки
  - AI-генерация предложений по исправлению с оценкой уверенности (confidence score)
  - Поиск похожих файлов через Levenshtein distance алгоритм
  - Автоматическое создание Pull Request с исправлениями
  - Поддержка dry-run режима для тестирования
  - Интеграция с GitHub API для коммитов и PR
  
- **GitHub Actions: Link Repair** (`.github/workflows/link-repair.yml`)
  - Еженедельное автоматическое сканирование (каждый понедельник)
  - Ручной запуск через workflow_dispatch
  - Настройка минимального порога уверенности (min_confidence)
  - Загрузка результатов сканирования как артефактов
  - Авто-комментарии в созданных PR со статистикой

- **Документация**
  - Встроенные комментарии в коде с примерами использования
  - CLI usage инструкция

#### 🌐 Мультиязычность AI-Ассистента
- **AI i18n Service** (`src/services/ai-i18n-service.js`)
  - Динамическая подгрузка языковых пакетов по требованию
  - Авто-детекция языка браузера (navigator.language)
  - Fallback цепочка для недостающих переводов
  - Кэширование загруженных пакетов (Map-based cache)
  - Поддержка параметров в переводах (`{{count}}`)
  - События смены языка (`ai-language-changed`)
  - Экспорт/импорт пользовательских пакетов
  - Генерация шаблонов для новых языков

- **Языковые пакеты** (`assets/i18n/`)
  - `en-ai.json` - English (полный)
  - `ru-ai.json` - Русский (полный)
  - `es-ai.json` - Español (базовый)
  - `fr-ai.json` - Français (базовый)
  - Поддержка 7+ языков: en, ru, es, fr, de, zh, ja, ko, pt, it, ar, hi

- **Документация**
  - `docs/MULTILINGUAL_AI_GUIDE.md` - Полное руководство по мультиязычности
    - Архитектура системы
    - Примеры интеграции (Vanilla JS, React)
    - SEO и мета-теги для многоязычных страниц
    - Оптимизация производительности (preload, prefetch)
    - Troubleshooting guide

#### 🥽 VR/AR Export
- **VR Export Service** (`src/services/vr-export-service.js`)
  - Генерация glTF 2.0 сцены из Графа Знаний
  - Бинарный GLB экспорт (оптимизированный формат)
  - Force-directed layout алгоритм для 3D расстановки узлов
  - Геометрия: сферы для узлов, цилиндры для связей
  - PBR материалы с настраиваемыми цветами
  - WebXR совместимость
  - Конфигурируемые параметры:
    - nodeRadius, edgeWidth, sceneScale
    - forceStrength, linkDistance, charge
    - layoutType (force/circular)

- **GitHub Actions: VR Export** (`.github/workflows/vr-export.yml`)
  - Автоматический экспорт при обновлении knowledge-graph.json
  - Настройка качества (low/medium/high)
  - Выбор формата (glb/gltf/both)
  - Деплой на GitHub Pages в `/vr` директорию
  - Создание релизов с VR файлами
  - Загрузка артефактов с 30-дневным хранением

- **Документация**
  - `docs/VR_AR_EXPORT_GUIDE.md` - Полное руководство по VR/AR экспорту
    - Поддерживаемые форматы и устройства
    - Программный API примеры
    - Инструкция по просмотру (Oculus Quest, HTC Vive, Pico)
    - WebXR viewer интеграция
    - Параметры оптимизации для мобильных/desktop VR
    - Ограничения и troubleshooting
    - GitHub Actions интеграция

### Изменено

#### Обновленная документация
- **CHANGELOG.md** - Дополнен секциями для v3.1.0-beta
- **DECENTRALIZED_DEPLOY.md** - Добавлена информация о VR export workflow
- **EDGE_AI_GUIDE.md** - Упомянута интеграция с мультиязычностью

### Технические детали

#### Зависимости
- @octokit/rest для GitHub API интеграции
- glob для паттерн-матчинга файлов
- ONNX Runtime Web (обновлено)
- Chart.js 4.4.0 (без изменений)

#### Переменные окружения
```bash
# Link Repair Agent
GITHUB_TOKEN=ghp_...  # Токен с правами contents:write, pull-requests:write
REPO_OWNER=username
REPO_NAME=repo-name

# VR Export (опционально)
EXPORT_QUALITY=medium  # low/medium/high
EXPORT_FORMAT=glb      # glb/gltf/both
```

#### Breaking Changes
- Нет обратно несовместимых изменений
- Все новые функции являются аддонами к существующей функциональности

---

## [3.0.0-beta] - 2025-01-21

### Добавлено

#### RUM Dashboard и Аналитика
- **RUM Dashboard** (`docs/rum-dashboard.html`)
  - Визуализация метрик Core Web Vitals (LCP, INP, CLS) за 7 дней
  - Карточки с текущими P95 значениями и статусными индикаторами
  - Графики трендов на Chart.js
  - Распределение просмотров по страницам
  - Секция алертов с временными метками
  - Поддержка темной темы через prefers-color-scheme
  - Адаптивный дизайн для мобильных устройств

- **RUM Service** (`src/services/rum-service.js`)
  - Автоматический сбор метрик через PerformanceObserver
  - LCP (Largest Contentful Paint) отслеживание
  - INP (Interaction to Next Paint) мониторинг взаимодействий
  - CLS (Cumulative Layout Shift) детекция сдвигов макета
  - Пакетная отправка метрик (настраиваемый batch size)
  - Проверка порогов и автоматические алерты
  - Интеграция с Slack/Discord вебхуками
  - Sample rate для контроля объема данных

- **Метрики файл** (`assets/rum/metrics.json`)
  - Структура для агрегированных данных
  - 7-дневные тренды
  - Статистика просмотров страниц
  - История алертов

#### Децентрализованный деплой
- **GitHub Actions: IPFS Deploy** (`.github/workflows/deploy-ipfs.yml`)
  - Сборка Jekyll сайта
  - Пиннинг на IPFS через Pinata CLI
  - Сохранение CID в ipfs-cid.json
  - Обновление DNSLink через Cloudflare API
  - Комментарий в PR с ссылкой на превью
  - Создание deployment status для main branch

- **GitHub Actions: Fediverse Notify** (`.github/workflows/fediverse-notify.yml`)
  - Триггер на новые посты в _posts/
  - Генерация ActivityPub объекта (JSON-LD)
  - HTTP Signature подписывание запросов
  - Отправка в Mastodon/Pixelfed Inbox
  - Резервный метод через Mastodon API
  - Авто-постинг с OG-картинками и хештегами

#### Документация
- `docs/RUM_SETUP.md` - Полное руководство по настройке RUM
  - Интерпретация метрик LCP/INP/CLS
  - Настройка алертов в Slack/Discord
  - Privacy considerations
  - Troubleshooting guide

- `docs/DECENTRALIZED_DEPLOY.md` - Обновлено
  - Инструкция по Pinata/IPFS настройке
  - ActivityPub ключи и HTTP Signatures
  - Mastodon API токены
  - DNSLink конфигурация

- `docs/EDGE_AI_GUIDE.md` - Дополнено
  - Матрица совместимости браузеров
  - Требования к устройствам
  - Инструкция по отключению для приватности

### Изменено

#### Edge AI оптимизации
- Прогрессивная индексация с `requestIdleCallback`
- Batch processing по 10 постов для неблокирующей отрисовки
- Улучшенный caching с TTL и LRU eviction
- Гибридный reranking (70% vector + 30% keyword)

#### UI компоненты
- Skeleton loaders для всех async операций
- Улучшенные анимации появления виджетов
- Оптимизированные transition для reduced-motion пользователей

### Технические детали

#### Зависимости
- Chart.js 4.4.0 для визуализации метрик
- ONNX Runtime Web для Edge AI инференса
- @pinatacloud/pinata-cli для IPFS пиннинга

#### Переменные окружения
```bash
# RUM алертинг
RUM_WEBHOOK_URL=https://hooks.slack.com/services/...

# IPFS деплой
PINATA_JWT=eyJhbGc...
PINATA_GATEWAY=gateway.pinata.cloud
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ZONE_ID=...
CLOUDFLARE_DNS_RECORD_ID=...

# Fediverse
ACTIVITYPUB_ACTOR=https://mastodon.social/users/yourname
ACTIVITYPUB_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
MASTODON_INSTANCE=mastodon.social
MASTODON_USERNAME=yourname
MASTODON_ACCESS_TOKEN=...
SITE_BASE_URL=https://your-site.com
```

### Planned (Future Releases)

#### Авто-исправление битых ссылок
- AI-агент для сканирования ссылок
- Автоматическое создание PR с исправлениями
- Предложения альтернативных URL

#### Мультиязычность AI
- Динамическая подгрузка языковых пакетов
- Поддержка 10+ языков для ассистента
- Авто-детект языка пользователя

#### VR/AR Экспорт
- Генерация 3D сцены Графа Знаний
- Экспорт в glTF/WebXR форматы
- Просмотр в VR-шлемах (Quest, Vision Pro)

---

## [3.0.0-beta] - 2025-01-14

### Добавлено

#### Edge AI функции
- **Модальное окно семантического поиска** с запросами на естественном языке
  - Гибридный (ключевые слова + векторы), только векторный и только по ключевым словам режимы
  - Оценка релевантности с визуальными бейджами (0-100%)
  - Skeleton-загрузка для лучшего UX
  - Переключатель режимов с иконками
  
- **AI Assistant Widget** 
  - Плавающий виджет чата в правом нижнем углу
  - Контекстно-зависимые ответы с использованием содержимого страницы
  - Система команд (`/clear`, `/context`, `/summary`, `/help`)
  - Контекстное меню для быстрых действий (Саммаризировать, Объяснить, Найти похожее)
  - Индикатор статуса модели (Загрузка/Готов/Офлайн)
  - Индикаторы набора текста и история сообщений

- **Vector Search Service** (`src/services/vector-search-service.js`)
  - Адаптивная загрузка моделей на основе возможностей устройства
  - Проверка `navigator.hardwareConcurrency` и `deviceMemory`
  - Квантованная модель для слабых устройств (<2GB RAM)
  - Полная модель с ускорением WebGL для мощных устройств
  
- **Embedding Web Worker** (`src/workers/embedding-worker.js`)
  - Вынос токенизации и инференса из главного потока
  - Интеграция ONNX Runtime Web
  - Пакетная обработка для эффективности
  - Расчет косинусного сходства
  
- **Embedding Cache Service** (`src/services/embedding-cache-service.js`)
  - LRU кэш с настраиваемым TTL
  - Предотвращение избыточного вывода модели
  - Функции экспорта/импорта

#### UI компоненты
- `_includes/semantic-search-modal.html` - Модалка с интерфейсом поиска
- `_includes/ai-assistant-widget.html` - Виджет чата с шаблонами
- `_sass/_ai-widgets.scss` - Полные стили с поддержкой темной/светлой темы
- `src/modules/search-ui.js` - Контроллер модального окна поиска
- `src/modules/assistant-ui.js` - Контроллер виджета чата

#### Документация
- `docs/EDGE_AI_GUIDE.md` - Полное руководство по Edge AI функциям
  - Матрица совместимости браузеров
  - Требования к устройствам
  - Детали приватности и безопасности
  - Секция устранения неполадок
  
- `docs/DECENTRALIZED_DEPLOY.md` - Руководство по деплою в IPFS и Fediverse
  - GitHub Actions workflow для пиннинга IPFS
  - Настройка DNSLink
  - Настройка авто-постинга ActivityPub
  - Лучшие практики безопасности

### Изменено

- Обновлена архитектура для поддержки Web Workers
- Улучшена система тем для AI виджетов
- Улучшена доступность с ARIA labels и навигацией клавиатурой

### Технические детали

#### Mobile-First оптимизации
- Определение возможностей устройства:
  ```javascript
  navigator.hardwareConcurrency // CPU ядра
  navigator.deviceMemory        // RAM в GB
  ```
- Слабые устройства (<2GB RAM):
  - Квантованная модель (80MB vs 140MB)
  - Меньшие размеры пакетов (4 vs 8)
  - WebAssembly фоллбэк вместо WebGL
  
- Прогрессивная индексация с `requestIdleCallback`
- Пакетная обработка (10 постов за пакет)
- Неблокирующий UI во время генерации эмбеддингов

### Планы на будущее

- Авто-исправление битых ссылок с AI-агент PR предложениями
- Мультиязычный AI с динамической загрузкой языковых пакетов
- VR/AR экспорт для визуализации Графа Знаний
- RUM Dashboard с отслеживанием Core Web Vitals
- Slack/Discord алертинг для порогов производительности

## [2.1.0] - 2025-08-14

### Добавлено

- **Тестирование**: Добавлены unit тесты для всех ключевых модулей
  - `tests/unit/i18n.test.js` - тесты интернационализации
  - `tests/unit/subscription.test.js` - тесты системы подписок
  - `tests/unit/pwa-service.test.js` - тесты PWA функциональности
  - `tests/integration/module-loading.test.js` - интеграционные тесты загрузки модулей
- **CI/CD**: Настроен GitHub Actions workflow для автоматического тестирования и деплоя
- **Документация**: 
  - `docs/CONTRIBUTING.md` - руководство по внесению изменений
  - `docs/CHANGELOG.md` - история изменений
  - `.github/workflows/ci.yml` - CI/CD конфигурация

### Изменено

- **Рефакторинг**: Полная модуляризация кода согласно DEEP_REFACTORING_PLAN.md
- **Оптимизация**: Уменьшен размер бандла до 68.9KB (минифицированный)
- **Структура тестов**: Улучшена организация тестовой инфраструктуры

### Исправлено

- Проблемы с загрузкой модулей в различных окружениях
- Ошибки в обработке событий темы
- Проблемы совместимости с Node.js окружением

## [2.0.0] - 2025-08-14

### Добавлено

- **Модульная архитектура**: ES6 модули в `/src/`
  - `src/config/constants.js` - централизованная конфигурация
  - `src/core/theme-manager.js` - управление темами
  - `src/modules/i18n.js` - интернационализация
  - `src/modules/search-engine.js` - поиск
  - `src/modules/image-optimizer.js` - оптимизация изображений
  - `src/modules/social-sharing.js` - социальные сети
  - `src/modules/subscription.js` - система подписок
  - `src/services/analytics-service.js` - аналитика
  - `src/services/pwa-service.js` - PWA функциональность
  - `src/utils/helpers.js` - вспомогательные функции
  - `src/utils/storage.js` - работа с хранилищем
- **Сборка**: esbuild для бандлинга
- **Тестирование**: Базовый фреймворк для тестов
- **Документация**: ARCHITECTURE.md, TESTING.md, DEEP_REFACTORING_PLAN.md

### Изменено

- `_layouts/default.html` использует единый бандл вместо отдельных скриптов
- Удалены legacy файлы из `/js/` (теперь используются только для совместимости)

### Удалено

- Дублирующий код в legacy файлах
- Неиспользуемые зависимости

---

## Ссылки

- [2.1.0]: https://github.com/DominicusIn/engineering-blog/compare/v2.0.0...v2.1.0
- [2.0.0]: https://github.com/DominicusIn/engineering-blog/releases/tag/v2.0.0
