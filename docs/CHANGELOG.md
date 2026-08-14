# Changelog

Все значимые изменения в проекте Engineering Blog будут задокументированы в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/),
версии следуют [Semantic Versioning](https://semver.org/lang/ru/).

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
