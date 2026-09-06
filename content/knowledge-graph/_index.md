---
title: Knowledge Graph
date: '2025-12-29T20:01:00.000Z'
slug: knowledge-graph
image: /assets/images/og-default.png
alt: "Knowledge Graph"
---

Интерактивная карта взаимосвязей между постами, концепциями, людьми и проектами.
Визуализирует семантические связи по тегам, категориям и датам.

<div id="knowledge-graph-svg" class="mt-8">
  <!-- D3.js visualization loads here via JS -->
  <noscript>
    <p class="mb-4">Визуализация графа требует JavaScript. Вот текстовая версия связей:</p>
    <ul class="space-y-2 text-sm">
      <li><a href="/blog/">Блог</a> — все записи в блоге</li>
      <li><a href="/categories/">Категории</a> — тематические категории постов</li>
      <li><a href="/tags/">Теги</a> — ключевые слова и теги</li>
      <li><a href="/gists/">Gists</a> — кодовые фрагменты</li>
      <li><a href="/repositories/">Репозитории</a> — проекты на GitHub</li>
    </ul>
  </noscript>
</div>

## Как работает

Данный раздел генерируется из реестра тегов и категорий. Каждый узел — это пост,
каждое ребро — общий тег или категория. Сила связи определяется количеством
совместно использованных ключевых слов.

## Статистика

- **{{ len .Site.Pages }}** страниц в блоге
- **{{ len .Site.Tags }}** уникальных тегов
- **{{ len .Site.Categories }}** уникальных категорий
