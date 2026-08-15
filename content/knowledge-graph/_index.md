---
title: "Knowledge Graph"
slug: "knowledge-graph"
description: "Semantic map of concepts, posts, people and Domini entities — the Engineering Knowledge Hub navigation layer."
menu:
  main:
    name: "Knowledge Graph"
    weight: 80
---

The **Knowledge Graph** connects ideas, articles, people and projects into a
single navigable structure. It is generated from the published content during
every build (`scripts/build-knowledge-graph.cjs` → `/data/knowledge-graph.json`,
JSON-LD).

Pick a concept to see the posts linked to it.

<div id="kg-root" class="kg-root">
  <noscript>
    <p>Interactive graph requires JavaScript. Browse the same material without
    scripts via <a href="/categories/">Categories</a> and <a href="/tags/">Tags</a>.</p>
  </noscript>
</div>

<script src="/js/knowledge-graph.js" defer></script>

<style>
.kg-root { margin: 1.5rem 0; min-height: 60vh; }
.kg-meta { color: var(--color-muted, #888); font-size: .9rem; }
.kg-filters { display: flex; flex-wrap: wrap; gap: .5rem; margin: 1rem 0; }
.kg-filter {
  border: 1px solid var(--border-color, #ccc); background: transparent;
  color: inherit; border-radius: 999px; padding: .25rem .9rem; cursor: pointer;
  font-size: .85rem;
}
.kg-filter.kg-active { background: var(--accent-color, #2563eb); color: #fff; border-color: transparent; }
.kg-list { display: grid; gap: .5rem; margin-top: 1rem; }
.kg-item { padding: .5rem .75rem; border: 1px solid var(--border-color, #e5e7eb); border-radius: .5rem; }
.kg-item a { font-weight: 600; text-decoration: none; }
.kg-date { color: var(--color-muted, #888); font-size: .8rem; }
.kg-error { color: #b91c1c; }
</style>
