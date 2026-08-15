# Руководство по тестированию Engineering Blog

## Обзор

Это руководство описывает процесс тестирования JavaScript модулей в проекте Engineering Blog.

## Структура тестов

```
tests/
├── unit/                 # Юнит-тесты
│   ├── helpers.test.js
│   ├── storage.test.js
│   ├── theme-manager.test.js
│   ├── i18n.test.js
│   ├── search-engine.test.js
│   └── subscription.test.js
├── integration/          # Интеграционные тесты
│   └── ...
├── e2e/                  # E2E тесты
│   └── ...
└── test-utils.js         # Утилиты для тестирования
```

## Запуск тестов

### Через npm скрипты

```bash
# Все тесты
npm test

# Watch mode (автоматический перезапуск)
npm run test:watch

# С отчётом о покрытии
npm run test:coverage

# В браузере
npm run test:browser
```

### Напрямую через Jest

```bash
# Конкретный файл теста
npx jest tests/unit/helpers.test.js

# По паттерну
npx jest --testNamePattern="debounce"

# С покрытием для конкретного файла
npx jest --coverage --collectCoverageFrom="src/utils/helpers.js"
```

## Фреймворк для тестирования

### test-utils.js

Простой фреймворк предоставляет следующие функции:

```javascript
import { 
  describe,      // Группа тестов
  it,            # Отдельный тест
  expect,        #.Assertions
  beforeEach,    # Setup перед каждым тестом
  afterEach,     # Teardown после каждого теста
  beforeAll,     # Setup один раз перед всеми
  afterAll       # Teardown один раз после всех
} from './test-utils.js';
```

### Пример базового теста

```javascript
import { describe, it, expect } from '../test-utils.js';
import { debounce } from '../../src/utils/helpers.js';

describe('debounce', () => {
  it('should delay function execution', (done) => {
    let callCount = 0;
    const debouncedFn = debounce(() => callCount++, 100);
    
    debouncedFn();
    expect(callCount).toBe(0);
    
    setTimeout(() => {
      expect(callCount).toBe(1);
      done();
    }, 150);
  });
});
```

## Написание тестов

### Best Practices

1. **Один тест - одна проверка**
   ```javascript
   // ❌ ПЛОХО: Несколько проверок в одном тесте
   it('should handle multiple cases', () => {
     expect(fn(1)).toBe(1);
     expect(fn(2)).toBe(2);
     expect(fn(3)).toBe(3);
   });
   
   // ✅ ХОРОШО: Отдельные тесты
   it('should return 1 for input 1', () => {
     expect(fn(1)).toBe(1);
   });
   
   it('should return 2 for input 2', () => {
     expect(fn(2)).toBe(2);
   });
   ```

2. **Описательные названия тестов**
   ```javascript
   // ❌ ПЛОХО
   it('works', () => {});
   it('test 1', () => {});
   
   // ✅ ХОРОШО
   it('should return null for non-existent keys', () => {});
   it('should serialize objects to JSON', () => {});
   ```

3. **Используйте beforeEach/afterEach**
   ```javascript
   describe('LocalStorage', () => {
     let storage;
     
     beforeEach(() => {
       storage = new LocalStorage('test');
       storage.clear();
     });
     
     afterEach(() => {
       storage.clear();
     });
     
     it('should store values', () => {
       storage.set('key', 'value');
       expect(storage.get('key')).toBe('value');
     });
   });
   ```

4. **Тестируйте граничные случаи**
   ```javascript
   describe('edge cases', () => {
     it('should handle empty strings', () => {});
     it('should handle null values', () => {});
     it('should handle undefined values', () => {});
     it('should handle very large inputs', () => {});
     it('should handle special characters', () => {});
   });
   ```

## Типы тестов

### Unit тесты

Тестируют отдельные функции/классы изолированно.

```javascript
// tests/unit/helpers.test.js
import { debounce, throttle } from '../../src/utils/helpers.js';

describe('Helpers', () => {
  describe('debounce', () => {
    // Тесты...
  });
  
  describe('throttle', () => {
    // Тесты...
  });
});
```

### Integration тесты

Тестируют взаимодействие между модулями.

```javascript
// tests/integration/module-loading.test.js
import { ModuleLoader } from '../../src/core/module-loader.js';
import { ThemeManager } from '../../src/core/theme-manager.js';

describe('Module Loading Integration', () => {
  it('should load theme manager before other modules', async () => {
    const loader = new ModuleLoader();
    
    await loader.loadCriticalModules();
    
    expect(window.themeManager).toBeDefined();
  });
});
```

### E2E тесты

Тестируют полный пользовательский сценарий.

```javascript
// tests/e2e/navigation.test.js
describe('Navigation Flow', () => {
  it('should navigate from home to article and back', async () => {
    // Navigate to home
    await page.goto('http://localhost:4000/');
    
    // Click on article
    await page.click('.post-card:first-child');
    
    // Verify article loaded
    await expect(page).toMatchElement('.post-content');
    
    // Navigate back
    await page.click('.back-link');
    
    // Verify back on home
    await expect(page).toMatchElement('.hero');
  });
});
```

## Моки и стабы

### Моки для API

```javascript
// tests/test-utils.js
export function createMockFetch(data) {
  return jest.fn().mockResolvedValue({
    ok: true,
    json: async () => data
  });
}

// Использование
const mockData = { results: [] };
global.fetch = createMockFetch(mockData);
```

### Моки для localStorage

```javascript
export function createMockStorage() {
  const store = {};
  
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value; }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { Object.keys(store).forEach(k => delete store[k]; })
  };
}

// Использование
Object.defineProperty(window, 'localStorage', {
  value: createMockStorage()
});
```

## Покрытие кода

### Целевые показатели

| Тип модуля | Минимальное покрытие |
|------------|---------------------|
| Utils      | 100%                |
| Core       | 95%                 |
| Modules    | 90%                 |
| Integration| 80%                 |

### Генерация отчёта

```bash
npm run test:coverage
```

Отчёт будет доступен в `coverage/index.html`.

### Анализ покрытия

```javascript
// Если покрытие низкое, добавьте тесты для:
// 1. Ветвлений if/else
// 2. Обработки ошибок try/catch
// 3. Граничных значений
// 4. Редких путей выполнения
```

## Debugging тестов

### Console.log в тестах

```javascript
it('should debug this', () => {
  const result = fn();
  console.log('Result:', result); // Выведется в консоль
  expect(result).toBe(expected);
});
```

### Отладка в браузере

```bash
npm run test:browser
```

Откроется страница с тестами, где можно использовать DevTools.

### Пошаговая отладка

```javascript
it('should debug step by step', () => {
  debugger; // Пауза в отладчике
  
  const step1 = fn1();
  debugger;
  
  const step2 = fn2(step1);
  debugger;
  
  expect(step2).toBe(expected);
});
```

## CI/CD интеграция

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Распространённые проблемы

### Асинхронные тесты

```javascript
// ❌ ПЛОХО: Test завершится до завершения async операции
it('should fetch data', () => {
  fetchData().then(data => {
    expect(data).toBeDefined();
  });
});

// ✅ ХОРОШО: Используем async/await
it('should fetch data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});

// ✅ ХОРОШО: Используем done callback
it('should fetch data', (done) => {
  fetchData().then(data => {
    expect(data).toBeDefined();
    done();
  });
});
```

### Таймеры и setTimeout

```javascript
// ❌ ПЛОХО: Ненадёжный тайминг
it('should wait', () => {
  setTimeout(() => {
    expect(something).toBe(true);
  }, 100);
});

// ✅ ХОРОШО: Используем fake timers
jest.useFakeTimers();

it('should wait', () => {
  setTimeout(() => {
    expect(something).toBe(true);
  }, 100);
  
  jest.advanceTimersByTime(100);
});
```

### Очистка между тестами

```javascript
// ❌ ПЛОХО: Грязное состояние
describe('Tests', () => {
  it('test 1', () => {
    document.body.innerHTML = '<div>Test</div>';
  });
  
  it('test 2', () => {
    // div из test 1 всё ещё здесь!
  });
});

// ✅ ХОРОШО: Очищаем состояние
describe('Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  
  it('test 1', () => {
    document.body.innerHTML = '<div>Test</div>';
  });
  
  it('test 2', () => {
    // Чистый документ
  });
});
```

## Чеклист перед коммитом

- [ ] Все новые функции покрыты тестами
- [ ] Существующие тесты проходят
- [ ] Покрытие кода не уменьшилось
- [ ] Тесты имеют описательные названия
- [ ] Моки используются для внешних зависимостей
- [ ] Граничные случаи протестированы
- [ ] Нет дублирования в тестах

## Дополнительные ресурсы

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/)
- [Martin Fowler - Testing](https://martinfowler.com/bliki/TestPyramid.html)

---

*Последнее обновление: 2025*
*Версия: 1.0.0*
