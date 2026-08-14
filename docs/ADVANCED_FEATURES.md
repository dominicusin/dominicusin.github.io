# Расширенные возможности AI-ассистента v3.0

## 📋 Обзор

Этот документ описывает три новые продвинутые функции, добавленные в версию 3.0:

1. **Авто-исправление битых ссылок** - AI-агент для автоматического обнаружения и исправления broken links
2. **Мультиязычность AI** - Динамическая подгрузка языковых пакетов
3. **VR/AR Экспорт** - Генерация glTF/WebXR сцены Графа Знаний

---

## 🔗 1. Авто-исправление битых ссылок

### Возможности

- Сканирование всех Markdown и HTML файлов проекта
- Обнаружение внутренних и внешних битых ссылок
- AI-генерация предложений по исправлению на основе схожести имен файлов
- Автоматическое создание Pull Request с исправлениями
- Система оценки уверенности (confidence score)

### Использование

```bash
# Установка зависимостей
npm install @octokit/rest glob

# Запуск агента
node src/agents/link-repair-agent.js

# Dry-run режим (без создания PR)
node src/agents/link-repair-agent.js --dry-run
```

### Переменные окружения

```bash
export GITHUB_TOKEN=your_github_token
export REPO_OWNER=your_username
export REPO_NAME=your_repo_name
```

### Пример работы

```
🔍 Starting link scan...
❌ Found 12 broken links
🤖 Generating AI fix suggestions...
💡 Generated 8 fix suggestions
✅ PR created: https://github.com/user/repo/pull/42
```

### Алгоритм поиска похожих файлов

1. Извлечение имени файла из битой ссылки
2. Поиск файлов с похожими именами (Levenshtein distance)
3. Расчет confidence score на основе:
   - Схожести имен (60%)
   - Совпадения расширений (+10%)
   - Совпадения директорий (+15%)
4. Применение исправлений с confidence > 0.6

---

## 🌐 2. Мультиязычность AI-ассистента

### Поддерживаемые языки

| Код | Название | Нативное название |
|-----|----------|------------------|
| en  | English  | English          |
| ru  | Russian  | Русский          |
| es  | Spanish  | Español          |
| fr  | French   | Français         |
| de  | German   | Deutsch          |
| zh  | Chinese  | 中文             |
| ja  | Japanese | 日本語           |

### Архитектура

```
src/services/ai-i18n-service.js
├── loadLanguage(lang)     - Динамическая загрузка пакета
├── setLanguage(lang)      - Переключение языка
├── t(key, params)         - Получение перевода
├── getAvailableLanguages() - Список доступных языков
└── generateTemplate(lang)  - Шаблон для нового языка
```

### Использование в коде

```javascript
import { getAiI18n } from './services/ai-i18n-service.js';

// Инициализация
const i18n = getAiI18n({
  supportedLanguages: ['en', 'ru', 'es'],
  defaultLanguage: 'en'
});

await i18n.init();

// Переключение языка
await i18n.setLanguage('ru');

// Получение перевода
const greeting = i18n.t('assistant.greeting');
// "Здравствуйте! Чем я могу помочь вам сегодня?"

// Перевод с параметрами
const message = i18n.t('errors.network', { retryCount: 3 });
```

### Структура языкового пакета

```json
{
  "assistant": {
    "greeting": "Hello! How can I help you today?",
    "placeholder": "Type your message...",
    "loading": "Thinking..."
  },
  "search": {
    "modes": {
      "keyword": "Keyword",
      "vector": "Vector",
      "hybrid": "Hybrid"
    }
  },
  "commands": {
    "clear": "Clear chat history",
    "help": "Show available commands"
  }
}
```

### Добавление нового языка

1. Создайте файл `assets/i18n/{lang}-ai.json`
2. Используйте шаблон:
   ```javascript
   const template = i18n.generateTemplate('fr');
   console.log(JSON.stringify(template, null, 2));
   ```
3. Переведите все значения
4. Добавьте код языка в `supportedLanguages`

### Авто-определение языка

```javascript
// Автоматическое определение языка браузера
i18n.detectBrowserLanguage();

// Сохранение выбора в localStorage
localStorage.setItem('ai-assistant-language', 'ru');
```

---

## 🥽 3. VR/AR Экспорт Графа Знаний

### Возможности

- Генерация 3D сцены из данных графа знаний
- Force-directed layout для оптимального размещения узлов
- Экспорт в формат glTF/GLB (бинарный glTF)
- WebXR совместимость (A-Frame)
- Просмотр в VR-шлемах (Oculus Quest, HTC Vive, etc.)

### Использование

```javascript
import KnowledgeGraphVRExporter from './services/vr-export-service.js';

// Данные графа
const graphData = {
  nodes: [
    { id: '1', label: 'Machine Learning' },
    { id: '2', label: 'Deep Learning' },
    { id: '3', label: 'NLP' }
  ],
  edges: [
    { source: '1', target: '2' },
    { source: '1', target: '3' }
  ]
};

// Создание экспортера
const exporter = new KnowledgeGraphVRExporter({
  nodeRadius: 0.3,
  edgeWidth: 0.05,
  colors: {
    node: '#4a90d9',
    edge: '#cccccc'
  }
});

// Генерация сцены
exporter.setGraphData(graphData);
const { gltf, glb, stats } = await exporter.generateGLTF();

console.log(`Generated: ${stats.nodes} nodes, ${stats.edges} edges`);
console.log(`File size: ${stats.fileSize} bytes`);

// Скачивание файла
await exporter.exportToFile('my-knowledge-graph.glb');

// Генерация WebXR HTML
const html = exporter.generateWebXRHTML('path/to/model.glb');
```

### Параметры конфигурации

```javascript
{
  nodeRadius: 0.3,          // Радиус узлов (сфер)
  edgeWidth: 0.05,          // Толщина связей (цилиндров)
  sceneScale: 1.0,          // Общий масштаб сцены
  colors: {
    node: '#4a90d9',        // Цвет узлов
    edge: '#cccccc',        // Цвет связей
    highlight: '#ff6b6b',   // Цвет выделения
    text: '#ffffff'         // Цвет текста
  },
  layout: {
    type: 'force',          // Тип layout
    charge: -30,            // Сила отталкивания
    linkDistance: 3         // Длина связей
  }
}
```

### Force-Directed Layout

Алгоритм применяет физику для оптимального размещения:

1. **Отталкивание**: Узлы отталкиваются друг от друга
2. **Притяжение**: Связи притягивают связанные узлы
3. **Затухание**: Скорости постепенно уменьшаются
4. **Центрирование**: Граф центрируется в начале координат

```javascript
// 300 итераций для стабильного результата
const iterations = 300;
for (let i = 0; i < iterations; i++) {
  // Apply forces...
}
```

### Формат glTF 2.0

Генерируемая сцена включает:

- **Nodes**: Трансформации для каждого элемента
- **Meshes**: Геометрия сфер (узлы) и цилиндров (связи)
- **Materials**: PBR материалы с metallic/roughness
- **Accessors**: Доступ к буферам вершин
- **BufferViews**: Бинарные данные геометрии

### WebXR просмотр

Сгенерируйте HTML для просмотра:

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://aframe.io/releases/1.4.0/aframe.min.js"></script>
</head>
<body>
  <a-scene vr-mode-ui="enabled: true">
    <a-sky color="#1a1a2e"></a-sky>
    <a-entity gltf-model="url(knowledge-graph.glb)" position="0 0 -5"></a-entity>
    <a-camera look-controls wasd-controls></a-camera>
  </a-scene>
</body>
</html>
```

### Совместимые устройства

| Устройство | Платформа | Поддержка |
|------------|-----------|-----------|
| Oculus Quest 2 | Meta Horizon OS | ✅ Полная |
| HTC Vive Pro | SteamVR | ✅ Полная |
| PlayStation VR | PS4/PS5 | ⚠️ Ограниченная |
| Google Cardboard | Android/iOS | ✅ Через браузер |
| Apple Vision Pro | visionOS | ✅ Через Safari |

### Оптимизация производительности

Для больших графов (>1000 узлов):

```javascript
const exporter = new KnowledgeGraphVRExporter({
  nodeRadius: 0.2,          // Меньше узлы
  layout: {
    charge: -50,            // Сильнее отталкивание
    linkDistance: 5         // Длинные связи
  }
});

// Уменьшите количество сегментов геометрии
// (внутренняя настройка в createSphereGeometry)
```

---

## 🔧 Интеграция всех функций

### Пример полного пайплайна

```javascript
// 1. Исправляем битые ссылки
const linkAgent = new LinkRepairAgent({ githubToken, owner, repo });
await linkAgent.run();

// 2. Инициализируем мультиязычность
const i18n = getAiI18n({ defaultLanguage: 'en' });
await i18n.init();

// 3. Экспортируем граф знаний в VR
const graphData = await fetchKnowledgeGraph();
const exporter = new KnowledgeGraphVRExporter();
exporter.setGraphData(graphData);
await exporter.exportToFile('knowledge-graph-vr.glb');

console.log('✅ All advanced features initialized!');
```

---

## 📚 Дополнительные ресурсы

- [glTF Specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)
- [A-Frame Documentation](https://aframe.io/docs/)
- [WebXR API](https://www.w3.org/TR/webxr/)
- [ActivityPub Protocol](https://www.w3.org/TR/activitypub/)
- [IPFS Documentation](https://docs.ipfs.tech/)

---

## 🚀 Планы развития

## 🚀 Планы развития (ROADMAP)

### Версия 3.1 (Q2 2024)
- [ ] AR режим для мобильных устройств (AR.js интеграция)
- [ ] Голосовой ввод для мультиязычного ассистента (Web Speech API)
- [ ] Интеграция с Obsidian для локальных графов
- [ ] Дополнительные языки: корейский, португальский, итальянский

### Версия 3.2 (Q3 2024)
- [ ] Мультиплеер VR режим для коллаборации (WebRTC)
- [ ] AI-генерация описаний для узлов графа
- [ ] Автоматическая категоризация контента
- [ ] Экспорт в другие форматы: USDZ (Apple AR), FBX

### Версия 4.0 (Q4 2024)
- [ ] Полная поддержка метавселенных (Decentraland, Sandbox)
- [ ] Децентрализованный AI inference через IPFS + Filecoin
- [ ] NFT экспорт для уникальных узлов графа
- [ ] Интеграция с нейроинтерфейсами (экспериментально)

---

## 📝 Changelog

### v3.0.0-beta (Текущая)
**Новые функции:**
- 🔗 AI Link Repair Agent — автоматическое исправление битых ссылок с PR
- 🌐 Multi-language AI Assistant — 7 языков с динамической подгрузкой
- 🥽 Knowledge Graph VR Export — glTF/WebXR для VR-шлемов

**Улучшения:**
- Edge AI оптимизации для мобильных устройств
- RUM Dashboard с алертингом
- DeFi/Fediverse деплой

### v2.5.0 (Предыдущая)
- Семантический поиск с векторными эмбеддингами
- AI-ассистент с контекстным меню
- Progressive Web App поддержка

