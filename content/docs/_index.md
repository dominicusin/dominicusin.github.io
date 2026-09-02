---
title: "Документация проекта"
description: "Автогенерируемая документация по архитектуре, API, CI/CD и модулям."
date: "2026-09-02"
draft: false
---

# Документация проекта

Этот раздел собирается автоматически из исходников и CI-конфигов.

- [Архитектура](#архитектура)
- [API / модули](#api--модули)
- [Вклад в проект](#вклад-в-проект)
- [CI/CD](#cicd)

## Архитектура

Проект состоит из двух плоскостей:

- **Publishing plane:** Hugo + Blowfish, контент в content/, сборка в public/.
- **Engineering plane:** src/ ES-модули, contracts/dao/, tests/ — retained, не деплоятся на Pages.

### Ключевые конфиги

- `config/_default/config.toml`
- `config/_default/hugo.toml`
- `config/_default/languages.toml`
- `config/_default/menus.ru.toml`
- `config/_default/params.toml`

### Workflows

- `agent.yml` — '🤖 Agent CI'
- `analytics.yml` — 📊 Analytics & Monitoring
- `awesome.yml` — Awesome Lists (discover + refresh)
- `cache-cleanup.yml` — Cache Cleanup
- `copilot-setup-steps.yml` — Copilot Setup Steps
- `dependency-review.yml` — Dependency Review
- `dependency-update.yml` — 🔄 Dependency Update
- `deploy-dao.yml` — Deploy DAO to Sepolia
- `deploy-ipfs.yml` — Deploy to IPFS
- `e2e.yml` — E2E Tests (Playwright)
- `fediverse-notify.yml` — Fediverse Auto-Post
- `fortify.yml` — Fortify AST Scan
- `greetings.yml` — Greetings
- `hugo.yml` — Deploy Hugo site to GitHub Pages
- `labeler.yml` — PR Labeler
- `license-check.yml` — License Check
- `links.yml` — Links (check + repair)
- `lock-threads.yml` — Lock Threads
- `performance.yml` — 📊 Performance Monitoring
- `pr-title-check.yml` — PR Title Check
- `quality.yml` — 🔍 Quality CI
- `security-scan.yml` — Security Scanning
- `security.yml` — 🔒 Security Scan
- `size-label.yml` — Size Label
- `stale.yml` — Close Stale Issues and PRs
- `supply-chain.yml` — Supply Chain (SBOM + Scorecard)
- `sync_gists.yml` — Sync Gists
- `test-rnd.yml` — 🧪 R&D Tests
- `vr-export.yml` — 🥽 VR/AR Export Automation

## API / модули

### `src/index.js`
* @fileoverview Application bootstrap - aggregates all ES modules.



## Вклад в проект

- Контент: content/, правила в schema/post-metadata.schema.json.
- Стили: assets/css/, JS модули: src/.
- Скрипты: scripts/.
- Тесты: tests/.

Локально: npm test, hugo --gc --minify, hugo server -D.

## CI/CD

- `scripts/add-awesome-submodules.cjs`
- `scripts/ai-review.cjs`
- `scripts/audit-dao.cjs`
- `scripts/audit-internal-links.cjs`
- `scripts/backfill-frontmatter.cjs`
- `scripts/backup.py`
- `scripts/build-awesome.cjs`
- `scripts/build-crosslinks.cjs`
- `scripts/build-knowledge-graph.cjs`
- `scripts/build-ontology-feed.cjs`
- `scripts/check-a11y.cjs`
- `scripts/check-external-links.cjs`
- `scripts/check-html.cjs`
- `scripts/check-links.cjs`
- `scripts/check-og-image.cjs`
- `scripts/check-perf.cjs`
- `scripts/ci-content-contract.cjs`
- `scripts/deploy-dao.cjs`
- `scripts/deploy-ipfs.cjs`
- `scripts/discover-awesome.cjs`
- `scripts/ensure-awesome-sparse.cjs`
- `scripts/generate-docs.cjs`
- `scripts/generate-vr-scene.js`
- `scripts/generate-wiki-nav.py`
- `scripts/probe-cls.cjs`
- `scripts/refresh-awesome.cjs`
- `scripts/sanitize-generated.cjs`
- `scripts/sanitize.cjs`
- `scripts/sync-github.cjs`
- `scripts/validate-frontmatter.cjs`

> Эта страница пересобирается автоматически при изменении исходников.
