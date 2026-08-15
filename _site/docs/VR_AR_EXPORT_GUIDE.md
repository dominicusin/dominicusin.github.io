# VR/AR Export Guide

## 🥽 Экспорт Графа Знаний в VR/AR

Этот документ описывает процесс экспорта Графа Знаний в форматы glTF/WebXR для просмотра в VR-шлемах и AR-устройствах.

### Поддерживаемые форматы

| Формат | Описание | Устройства |
|--------|----------|------------|
| **glTF 2.0** | Текстовый формат с JSON структурой | Все VR/AR устройства |
| **GLB** | Бинарный glTF (рекомендуется) | Oculus Quest, HTC Vive, Pico |
| **WebXR** | Интерактивная веб-сцена | Браузеры с WebXR поддержкой |

### Использование

#### Программный API

```javascript
import { KnowledgeGraphVRExporter } from './src/services/vr-export-service.js';

// Инициализация экспортера
const exporter = new KnowledgeGraphVRExporter({
  nodeRadius: 0.3,          // Радиус узлов
  edgeWidth: 0.05,         // Толщина связей
  sceneScale: 1.0,         // Масштаб сцены
  colors: {
    node: '#4a90d9',       // Цвет узлов
    edge: '#cccccc',       // Цвет связей
    highlight: '#ff6b6b'   // Цвет выделения
  },
  layoutType: 'force',     // Тип layout: 'force' или 'circular'
  forceStrength: -100,     // Сила отталкивания
  linkDistance: 3          // Длина связей
});

// Загрузка данных графа
const graphData = {
  nodes: [
    { id: '1', label: 'Node 1', category: 'tech' },
    { id: '2', label: 'Node 2', category: 'science' }
  ],
  edges: [
    { source: '1', target: '2', weight: 1.0 }
  ]
};

exporter.setGraphData(graphData);

// Генерация GLB файла
const { gltf, glb, stats } = await exporter.generateGLTF();

console.log(`Сгенерировано ${stats.nodes} узлов и ${stats.edges} связей`);
console.log(`Размер файла: ${(stats.fileSize / 1024).toFixed(2)} KB`);

// Скачивание файла
await exporter.exportToFile('my-knowledge-graph.glb');
```

#### Интерфейс пользователя

1. Откройте страницу с Графом Знаний
2. Нажмите кнопку **"🥽 Export to VR"** в панели инструментов
3. Выберите формат (GLB recommended)
4. Настройте параметры (опционально):
   - Качество геометрии (Low/Medium/High)
   - Включить текстуры
   - Оптимизация для мобильных VR
5. Нажмите **"Generate"**
6. Скачайте файл или откройте в WebXR viewer

### Просмотр в VR-шлемах

#### Oculus Quest / Meta Quest

1. Скопируйте `.glb` файл на устройство
2. Откройте через **Meta Quest Browser** или **Immersed**
3. Или загрузите на Sketchfab для просмотра в приложении

#### HTC Vive

1. Используйте **SteamVR** с совместимым viewer
2. Рекомендованные приложения:
   - **3D Viewer for SteamVR**
   - **Gltf Viewer**

#### Pico

1. Загрузите файл через **Pico File Manager**
2. Откройте в **Pico Browser** с WebXR поддержкой

### WebXR Viewer

Для интерактивного просмотра в браузере:

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/@webxr-viewers/dist/viewer.min.js"></script>
</head>
<body>
  <webxr-viewer 
    src="knowledge-graph.glb"
    camera-controls="true"
    ar="true"
    vr="true">
  </webxr-viewer>
</body>
</html>
```

### Параметры оптимизации

#### Для мобильных VR (Quest, Pico)

```javascript
const mobileOptimized = new KnowledgeGraphVRExporter({
  nodeRadius: 0.2,
  edgeWidth: 0.03,
  layoutType: 'force',
  forceStrength: -50,    // Меньшая сила для компактности
  linkDistance: 2        // Короткие связи
});
```

#### Для Desktop VR (Vive, Index)

```javascript
const desktopOptimized = new KnowledgeGraphVRExporter({
  nodeRadius: 0.5,
  edgeWidth: 0.08,
  layoutType: 'force',
  forceStrength: -150,   // Большая сила для простора
  linkDistance: 5        // Длинные связи
});
```

### Ограничения

| Параметр | Минимум | Рекомендуется | Максимум |
|----------|---------|---------------|----------|
| Узлов | 10 | 100-500 | 2000 |
| Связей | 5 | 200-1000 | 5000 |
| Размер файла | - | < 10 MB | < 50 MB |
| Полигонов | - | < 100K | < 500K |

### Troubleshooting

#### Файл не открывается в VR-шлеме

1. Проверьте формат (должен быть `.glb` или `.gltf`)
2. Убедитесь что файл не поврежден
3. Попробуйте открыть на устройстве сначала
4. Проверьте совместимость приложения

#### Граф слишком плотный/разреженный

Отрегулируйте параметры layout:

```javascript
// Более плотный
{ forceStrength: -30, linkDistance: 1.5 }

// Более разреженный
{ forceStrength: -200, linkDistance: 8 }
```

#### Низкая производительность

1. Уменьшите количество сегментов сферы (16 → 8)
2. Отключите текстуры
3. Упростите геометрию связей
4. Разбейте граф на подграфы

### Интеграция с GitHub Actions

Автоматический экспорт при обновлении графа:

```yaml
# .github/workflows/vr-export.yml
name: VR Export

on:
  push:
    paths:
      - 'assets/data/knowledge-graph.json'

jobs:
  export-vr:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Generate VR Scene
        run: node scripts/export-vr.js
      
      - name: Upload GLB
        uses: actions/upload-artifact@v4
        with:
          name: knowledge-graph-vr
          path: assets/vr/knowledge-graph.glb
```

### Будущие улучшения

- [ ] Поддержка текстур и материалов PBR
- [ ] Анимация появления узлов
- [ ] Интерактивные метки в VR
- [ ] Мультиплеер режим для совместного просмотра
- [ ] AR режим для наложения на реальные объекты
- [ ] Голосовое управление в VR
- [ ] Экспорт в USDZ для Apple AR Quick Look

### Дополнительные ресурсы

- [glTF 2.0 Specification](https://github.com/KhronosGroup/glTF)
- [WebXR Device API](https://www.w3.org/TR/webxr/)
- [Three.js GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)
- [Sketchfab](https://sketchfab.com/) - хостинг 3D моделей
- [Babylon.js](https://babylonjs.com/) - WebXR фреймворк

---

**Версия документа**: 1.0  
**Последнее обновление**: 2026-01-15  
**Статус**: Production Ready
