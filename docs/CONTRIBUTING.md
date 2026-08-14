# Руководство по внесению изменений (Contributing Guide)

## 📋 Содержание

1. [Введение](#введение)
2. [Требования к разработке](#требования-к-разработке)
3. [Структура проекта](#структура-проекта)
4. [Процесс разработки](#процесс-разработки)
5. [Стандарты кода](#стандарты-кода)
6. [Тестирование](#тестирование)
7. [Документирование](#документирование)
8. [Pull Request процесс](#pull-request-процесс)

---

## Введение

Спасибо за интерес к проекту Engineering Blog! Это руководство поможет вам внести свой вклад в развитие проекта.

### Типы взносов

- **Багфиксы**: Исправление ошибок
- **Новые функции**: Добавление новых возможностей
- **Документация**: Улучшение документации
- **Оптимизация**: Улучшение производительности
- **Рефакторинг**: Улучшение структуры кода

---

## Требования к разработке

### Необходимое ПО

```bash
Node.js >= 22.0.0
npm >= 9.0.0
Ruby >= 3.0.0
Bundler >= 2.0.0
Git
```

### Установка зависимостей

```bash
# Install Node.js dependencies
npm install

# Install Ruby dependencies
bundle install
```

---

## Структура проекта

```
/workspace
├── src/                      # Исходный код JavaScript
│   ├── config/              # Конфигурация
│   ├── core/                # Базовые модули
│   ├── modules/             # Функциональные модули
│   ├── services/            # Сервисы (Analytics, PWA)
│   ├── utils/               # Утилиты
│   └── index.js             # Точка входа
├── tests/                    # Тесты
│   ├── unit/                # Unit тесты
│   ├── integration/         # Integration тесты
│   └── test-utils.js        # Утилиты для тестов
├── docs/                     # Документация
├── _layouts/                 # Jekyll шаблоны
├── _includes/                # Jekyll включает
└── js/                       # Скомпилированные файлы
```

---

## Процесс разработки

### 1. Форк и клонирование

```bash
git clone https://github.com/YOUR_USERNAME/engineering-blog.git
cd engineering-blog
```

### 2. Создание ветки

```bash
# Для новой функции
git checkout -b feature/your-feature-name

# Для багфикса
git checkout -b fix/issue-number-description
```

### 3. Разработка

```bash
# Запуск в режиме разработки
npm run dev

# Запуск тестов
npm run test

# Линтинг
npm run lint
```

### 4. Коммиты

Используйте [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Новая функция
git commit -m "feat: add dark mode support"

# Багфикс
git commit -m "fix: correct theme toggle behavior"

# Документация
git commit -m "docs: update README with installation steps"

# Рефакторинг
git commit -m "refactor: simplify module loading logic"
```

---

## Стандарты кода

### JavaScript Style Guide

```javascript
// ✅ ПРАВИЛЬНО

// Использовать const/let вместо var
const MAX_RETRIES = 3;
let count = 0;

// Именованные импорты
import { debounce, throttle } from './utils/helpers.js';

// JSDoc комментарии
/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Arrow functions для методов
const handler = () => {
  // implementation
};

// Template literals
const message = `Hello, ${name}!`;

// Destructuring
const { theme, locale } = config;
```

```javascript
// ❌ НЕПРАВИЛЬНО

var count = 0; // Используйте const/let
import * as helpers from './utils/helpers.js'; // Избегайте namespace imports

function oldStyle() { // Используйте arrow functions
  return 'test';
}

var str = 'Hello, ' + name + '!'; // Используйте template literals
```

### Именование

- **Классы**: PascalCase (`ThemeManager`, `SearchEngine`)
- **Функции/переменные**: camelCase (`debounce`, `currentTheme`)
- **Константы**: UPPER_SNAKE_CASE (`MAX_RETRIES`, `DEFAULT_CONFIG`)
- **Файлы**: kebab-case (`theme-manager.js`, `search-engine.test.js`)

---

## Тестирование

### Написание тестов

```javascript
// tests/unit/example.test.js
import { describe, it, expect, beforeEach } from '../test-utils.js';
import { MyModule } from '../../src/modules/my-module.js';

describe('MyModule', () => {
  let module;

  beforeEach(() => {
    module = new MyModule();
  });

  it('should initialize correctly', () => {
    expect(module).toBeInstanceOf(MyModule);
  });

  it('should handle edge cases', () => {
    expect(() => module.process(null)).not.toThrow();
  });
});
```

### Запуск тестов

```bash
# Все тесты
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Требования к покрытию

- Utils: 100%
- Core modules: 95%+
- Functional modules: 90%+
- Integration tests: Critical paths 100%

---

## Документирование

### JSDoc

Все публичные API должны иметь JSDoc комментарии:

```javascript
/**
 * Theme Manager - Handles theme switching and persistence
 * @extends EventEmitter
 */
export class ThemeManager {
  /**
   * Create ThemeManager instance
   * @param {Object} options - Configuration options
   * @param {string} options.container - CSS selector for container
   * @param {string} options.defaultTheme - Default theme ('light'|'dark'|'auto')
   */
  constructor(options = {}) {
    // implementation
  }

  /**
   * Set theme
   * @param {string} theme - Theme to set
   * @fires ThemeManager#themeChanged
   * @returns {void}
   */
  setTheme(theme) {
    // implementation
  }
}
```

### Обновление документации

При добавлении новых функций обновляйте:

1. `README.md` - общее описание
2. `docs/ARCHITECTURE.md` - архитектурные изменения
3. `docs/API.md` - изменения API
4. JSDoc комментарии в коде

---

## Pull Request процесс

### Чеклист перед PR

- [ ] Код следует стандартам проекта
- [ ] Все тесты проходят (`npm run test`)
- [ ] Линтер не выдаёт ошибок (`npm run lint`)
- [ ] Добавлены тесты для новых функций
- [ ] Обновлена документация
- [ ] Commit messages следуют Conventional Commits

### Создание PR

1. Создайте форк репозитория
2. Создайте feature ветку
3. Внесите изменения
4. Убедитесь, что все тесты проходят
5. Создайте Pull Request с описанием изменений

### Описание PR

```markdown
## Описание
Краткое описание изменений

## Тип изменений
- [ ] Багфикс
- [ ] Новая функция
- [ ] Breaking change
- [ ] Документация
- [ ] Рефакторинг

## Тестирование
Опишите, как вы тестировали изменения

## Чеклист
- [ ] Тесты добавлены/обновлены
- [ ] Документация обновлена
- [ ] Следую стандартам кода
```

### Review процесс

1. Автоматические проверки (CI/CD)
2. Code review от maintainers
3. Исправление замечаний
4. Merge после approval

---

## Контакты

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: dominicusin@example.com

---

*Спасибо за ваш вклад!* 🎉
