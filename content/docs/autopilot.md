---
title: "Автономная эксплуатация репозитория (Autopilot)"
description: "Как настроен и работает автономный режим обслуживания блога"
date: 2026-08-22
draft: false
---

# Автопилот / автономная эксплуатация

## Настройки репозитория

- **Branch protection main**: запрет force-push/удаления, linear history; PR-ревью не требуется (соло-режим).
- **Actions**: default token = write; actions — pinned-набор.
- **Secret scanning + push protection**: включены.
- **Dependabot**: alerts + version updates.

## Автоматизация

| Workflow | Назначение |
|---|---|
| deploy.yml | Hugo build → Pages (push в main) |
| quality.yml | internal-link check + сборка |
| markdown-link-check.yml | внешние ссылки, еженедельно |
| stale.yml / lock-threads.yml | гигиена issues |
| security.yml, dependency-review.yml, sbom.yml, scorecard.yml, license-check.yml | supply-chain |
| CodeQL | SAST |

## Зеркала

GitLab-зеркало обновляется локальным cron (git push --mirror ежедневно); GitHub — канонический источник.

## Известные ограничения

- Archived-репо не собирают Pages.
- Dependabot может ложно срабатывать на nested-submodule (#275).
