---
title: "Онтология сайта"
description: "Концептуальная модель сайта: категории, теги, репозитории, гисты, люди и проекты — как единый связный граф знаний."
layout: ontology
---

Онтология сайта описывает, из каких типов сущностей состоит знаниевая база и как
они связаны. Все связи строятся автоматически из содержимого и живых данных GitHub
при каждой сборке.

## Модель

```
Категория (domain)  ──subsumes──▶  Тег (topic)
Пост       ──filed──▶   Категория        ──tagged──▶  Тег
Репозиторий ──tagged──▶ Тег             ──owned-by──▶ Организация
Гист       ──authored─▶ Автор           ──tagged──▶  Тег
Проект     ──implements──▶ DAO-контракт  ──maintains──▶ Автор
```

- **Категория** — верхнеуровневый домен контента (10 шт.: notes, links, security, ai,
  systems, web, career, philosophy, dao, media).
- **Тег** — сквозная тема/технология (76 шт.). Теги репозиториев берутся из их GitHub-topics.
- **Репозиторий / Гист** — подтягиваются с GitHub (DominicusIn + связанные организации)
  и связываются с тегами через свои topics.
- **Организация** — владелец репозиториев (dominicusin, neoallunity, Hitech-gmbh, transgregorial).
- **Проект / DAO** — инженерные проекты сайта (Decentralized Governance, Knowledge Graph Pipeline).

## Интерактивный граф

Ниже — тот же граф знаний, что и на странице [Knowledge Graph](/knowledge-graph/),
включая репозитории и гисты. Перетаскивайте узлы, наводите для подсветки связей,
кликайте для деталей.

<div id="kg-root" class="kg-root">
  <noscript>
    <p>Интерактивный граф требует JavaScript. Тот же материал без скриптов:
    <a href="/categories/">Категории</a>, <a href="/tags/">Теги</a>,
    <a href="/repositories/">Репозитории</a>, <a href="/gists/">Гисты</a>.</p>
  </noscript>
</div>

<script src="/js/d3.v7.min.js" defer></script>
<script src="/js/knowledge-graph.js" defer></script>
