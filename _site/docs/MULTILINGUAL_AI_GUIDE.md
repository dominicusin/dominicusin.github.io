# Мультиязычность AI-Ассистента

## 🌐 Динамическая подгрузка языковых пакетов

Этот документ описывает систему мультиязычной поддержки AI-ассистента с динамической загрузкой языковых пакетов.

### Поддерживаемые языки

| Код | Язык | Native Name | Статус |
|-----|------|-------------|--------|
| `en` | English | English | ✅ Полный |
| `ru` | Russian | Русский | ✅ Полный |
| `es` | Spanish | Español | ✅ Базовый |
| `fr` | French | Français | ✅ Базовый |
| `de` | German | Deutsch | ⏳ В разработке |
| `zh` | Chinese | 中文 | ⏳ В разработке |
| `ja` | Japanese | 日本語 | ⏳ В разработке |

### Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                  AI Assistant UI                        │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│              AiAssistantI18n Service                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Language Detection                             │   │
│  │  - Browser language (navigator.language)        │   │
│  │  - User preference (localStorage)               │   │
│  │  - URL parameter (?lang=es)                     │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Dynamic Loading                                │   │
│  │  - Lazy load language packs                     │   │
│  │  - Fallback chain (zh → en)                     │   │
│  │  - Cache management                             │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│              Language Packs (JSON)                      │
│  /assets/i18n/en-ai.json                               │
│  /assets/i18n/ru-ai.json                               │
│  /assets/i18n/es-ai.json                               │
│  /assets/i18n/fr-ai.json                               │
│  ...                                                   │
└─────────────────────────────────────────────────────────┘
```

### Использование

#### Базовая инициализация

```javascript
import { getAiI18n } from './src/services/ai-i18n-service.js';

// Создание экземпляра
const i18n = getAiI18n({
  supportedLanguages: ['en', 'ru', 'es', 'fr', 'de', 'zh', 'ja'],
  defaultLanguage: 'en'
});

// Инициализация
await i18n.init();

// Перевод текста
console.log(i18n.t('ai.greeting')); 
// "Hello! I'm your AI assistant. How can I help you today?"

// Перевод с параметрами
console.log(i18n.t('search.results.found', { count: 5 }));
// "Found 5 results"
```

#### Смена языка

```javascript
// Переключение на испанский
await i18n.setLanguage('es');
console.log(i18n.t('ai.greeting'));
// "¡Hola! Soy tu asistente de IA. ¿Cómo puedo ayudarte hoy?"

// Событие при смене языка
window.addEventListener('ai-language-changed', (event) => {
  console.log(`Language changed to: ${event.detail.language}`);
  // Обновить UI
  updateUITexts();
});
```

#### Проверка доступности перевода

```javascript
if (i18n.has('ai.commands.summary')) {
  console.log(i18n.t('ai.commands.summary'));
} else {
  // Fallback на английский
  console.log('Summarize this page');
}
```

#### Получение списка языков

```javascript
const languages = i18n.getAvailableLanguages();
/*
[
  { code: 'en', name: 'English', nativeName: 'English', loaded: true },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', loaded: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', loaded: false },
  ...
]
*/
```

### Структура языкового пакета

```json
{
  "ai": {
    "greeting": "Hello! I'm your AI assistant...",
    "placeholder": "Ask me anything...",
    "status": {
      "loading": "Loading model...",
      "ready": "Ready to help",
      "offline": "Offline mode"
    },
    "commands": {
      "clear": "Clear conversation history",
      "context": "Show current context",
      "summary": "Summarize this page",
      "help": "Show available commands",
      "language": "Change language"
    },
    "responses": {
      "noContext": "No specific context selected...",
      "cleared": "Conversation history cleared.",
      "summarizing": "Summarizing content...",
      "error": "Sorry, I encountered an error...",
      "thinking": "Thinking..."
    }
  },
  "search": {
    "placeholder": "Search with natural language...",
    "modes": {
      "keyword": "Keyword Search",
      "vector": "Semantic Search",
      "hybrid": "Hybrid Search"
    },
    "relevance": {
      "high": "High Relevance",
      "medium": "Medium Relevance",
      "low": "Low Relevance"
    }
  },
  "common": {
    "close": "Close",
    "send": "Send",
    "cancel": "Cancel",
    "retry": "Retry",
    "loading": "Loading...",
    "error": "Error",
    "success": "Success"
  }
}
```

### Добавление нового языка

#### Шаг 1: Создание шаблона

```javascript
// Генерация шаблона для итальянского
const template = i18n.generateTemplate('it');
console.log(JSON.stringify(template, null, 2));

/*
{
  "ai": {
    "greeting": "TODO: Translate \"Hello! I'm your AI assistant...\" to it",
    ...
  }
}
*/
```

#### Шаг 2: Заполнение переводами

Создайте файл `/assets/i18n/it-ai.json`:

```json
{
  "ai": {
    "greeting": "Ciao! Sono il tuo assistente IA. Come posso aiutarti oggi?",
    "placeholder": "Chiedimi qualsiasi cosa...",
    "status": {
      "loading": "Caricamento modello...",
      "ready": "Pronto ad aiutare",
      "offline": "Modalità offline"
    }
    // ... остальные переводы
  }
  // ... остальные секции
}
```

#### Шаг 3: Регистрация языка

```javascript
// Опционально: добавить в список поддерживаемых
i18n.supportedLanguages.push('it');

// Предзагрузка (опционально)
await i18n.loadLanguage('it');
```

### Fallback цепочка

При отсутствии перевода используется fallback цепочка:

```javascript
const fallbackChain = {
  'zh': ['zh', 'en'],      // Китайский → Английский
  'ja': ['ja', 'en'],      // Японский → Английский
  'es': ['es', 'fr', 'en'], // Испанский → Французский → Английский
  'fr': ['fr', 'en'],      // Французский → Английский
  'de': ['de', 'en'],      // Немецкий → Английский
  'ru': ['ru', 'en'],      // Русский → Английский
  'en': ['en']             // Английский (базовый)
};
```

### Кэширование

Языковые пакеты кэшируются в памяти:

```javascript
// Проверка загружен ли язык
const isLoaded = i18n.languagePacks.has('es');

// Экспорт текущего пакета
const pack = i18n.exportCurrentPack();
/*
{
  language: 'es',
  translations: { ... },
  timestamp: '2026-01-15T10:30:00.000Z'
}
*/

// Импорт пользовательского пакета
i18n.importPack('custom-lang', customTranslations);
```

### Интеграция с UI

#### Пример компонента на Vanilla JS

```javascript
class MultilingualAIWidget {
  constructor() {
    this.i18n = getAiI18n();
    this.init();
  }
  
  async init() {
    await this.i18n.init();
    this.render();
    this.bindEvents();
  }
  
  render() {
    this.elements.greeting.textContent = this.i18n.t('ai.greeting');
    this.elements.input.placeholder = this.i18n.t('ai.placeholder');
    this.elements.sendBtn.textContent = this.i18n.t('common.send');
  }
  
  bindEvents() {
    window.addEventListener('ai-language-changed', () => {
      this.render();
    });
  }
}
```

#### Пример на React

```jsx
import { useAiI18n } from './hooks/useAiI18n';

function AIAssistant() {
  const { t, language, setLanguage } = useAiI18n();
  
  return (
    <div className="ai-assistant">
      <select 
        value={language} 
        onChange={(e) => setLanguage(e.target.value)}
      >
        <option value="en">English</option>
        <option value="ru">Русский</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
      </select>
      
      <h1>{t('ai.greeting')}</h1>
      <input placeholder={t('ai.placeholder')} />
      <button>{t('common.send')}</button>
    </div>
  );
}
```

### SEO и мета-теги

Для многоязычных страниц добавьте meta-теги:

```html
<html lang="es">
<head>
  <meta property="og:locale" content="es_ES" />
  <meta property="og:locale:alternate" content="en_US" />
  <meta property="og:locale:alternate" content="ru_RU" />
  <link rel="alternate" hreflang="en" href="/en/page.html" />
  <link rel="alternate" hreflang="es" href="/es/page.html" />
  <link rel="alternate" hreflang="ru" href="/ru/page.html" />
</head>
```

### Производительность

#### Оптимизация загрузки

```javascript
// Предзагрузка только необходимых языков
await Promise.all([
  i18n.loadLanguage('en'),  // Дефолтный
  i18n.loadLanguage(browserLang)  // Язык браузера
]);

// Ленивая загрузка остальных
document.getElementById('lang-es').addEventListener('click', async () => {
  await i18n.loadLanguage('es');
  await i18n.setLanguage('es');
});
```

#### Preload в HTML

```html
<link rel="preload" href="/assets/i18n/en-ai.json" as="fetch" crossorigin>
<link rel="prefetch" href="/assets/i18n/es-ai.json" as="fetch" crossorigin>
```

### Будущие улучшения

- [ ] Машинный перевод недостающих языков через API
- [ ] Crowdsourcing переводов через сообщество
- [ ] A/B тестирование качества переводов
- [ ] Контекстные переводы для разных типов контента
- [ ] Голосовой ввод на разных языках
- [ ] Авто-детекция языка сообщения пользователя
- [ ] Мультиязычные ответы (смешивание языков)

### Troubleshooting

#### Перевод не загружается

1. Проверьте путь к файлу (`/assets/i18n/{lang}-ai.json`)
2. Убедитесь что файл валидный JSON
3. Проверьте CORS настройки сервера
4. Откройте консоль браузера для ошибок

#### Неправильный язык определяется

```javascript
// Принудительная установка
i18n.setLanguage('ru');

// Через URL параметр
const urlLang = new URLSearchParams(window.location.search).get('lang');
if (urlLang && i18n.supportedLanguages.includes(urlLang)) {
  i18n.setLanguage(urlLang);
}
```

#### Память переполняется

```javascript
// Очистка кэша неиспользуемых языков
function cleanupUnusedLanguages(currentLang) {
  for (const lang of i18n.languagePacks.keys()) {
    if (lang !== currentLang && lang !== i18n.defaultLanguage) {
      i18n.languagePacks.delete(lang);
    }
  }
}
```

---

**Версия документа**: 1.0  
**Последнее обновление**: 2026-01-15  
**Статус**: Production Ready
