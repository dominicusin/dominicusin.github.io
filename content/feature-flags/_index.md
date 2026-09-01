---
title: "Feature Flags"
description: "Управление экспериментальными функциями и A/B тестирование"
layout: "feature-flags"
---

Управление экспериментальными функциями сайта. Включайте и выключайте фичи без деплоя.

## Доступные флаги

| Флаг | Описание | По умолчанию |
|------|----------|--------------|
| `dark-mode-auto` | Автосмена темы по расписанию | выкл |
| `reduced-motion` | Уменьшить анимации | выкл |
| `compact-view` | Компактный режим чтения | выкл |
| `beta-features' | Бета-функции | выкл |
| `analytics-debug' | Отладка аналитики | выкл |

## Использование

Измените флаги ниже или используйте консоль браузера:

```javascript
neoFlags.set('dark-mode-auto', true);
neoFlags.get('dark-mode-auto'); // true
neoFlags.getAll(); // { 'dark-mode-auto': true, ... }
```
