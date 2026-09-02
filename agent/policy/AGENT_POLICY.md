# Agent Policy — `dominicusin.github.io`

> **Режим:** C — Maximally Autonomous Software Factory
> **Дата ратификации:** 2026-09-02
> **Источник истины:** CODE > CONFIG > CI > TESTS > RECENT GIT > CURRENT DOCS > OLD DOCS

## 1. Общие принципы

### 1.1. LLM — worker, не control system

Агент работает внутри детерминированной системы управления. Стратегические решения принимает человек. Тактические — автономно, в рамках политик.

### 1.2. Evidence-first

Каждое утверждение о состоянии репозитория должно подтверждаться machine-readable evidence:
- команда + exit code + stdout hash + commit + timestamp
- «Агент говорит» заменяется на «машина доказывает»

### 1.3. Git = immutable execution history

Прямой write в main запрещён. Все изменения через PR.

### 1.4. Beads = operational memory

`.beads/beads.json` — живой task graph. Оркестратор вычисляет READY/BLOCKED/DONE.

### 1.5. Two-plane boundary

Publishing Plane (Hugo) и Engineering Plane (src/, contracts/) строго разделены. R&D не попадает в production bundle.

## 2. Risk Classification

| Risk | Description | Autonomy |
|------|-------------|----------|
| R0 | Documentation, content metadata | Full autonomous |
| R1 | Isolated code/test changes | Full autonomous + CI |
| R2 | Architecture, dependencies | Autonomous + review |
| R3 | CI/deployment configuration | Autonomous + strict gates |
| R4 | Secrets, infrastructure, production, DAO | Human approval |

## 3. Permissions

### 3.1. Агенту разрешено

- Выбирать READY task из Beads
- Создавать worktree для задачи
- Анализировать код и документацию
- Писать код, тесты, документацию
- Запускать lint, tests, build, security scan
- Создавать commits и PR
- Проводить self-review
- Анализировать CI и исправлять PR
- Обновлять Beads при завершении задачи
- Переходить к следующей независимой задаче

### 3.2. Агенту запрещено

- Push напрямую в main
- Rewrite protected history
- Delete production data
- Expose secrets (API keys, tokens, passwords)
- Rotate credentials самостоятельно
- Изменять governance policy
- Отключать security checks
- Suppress failing tests
- Превращать warning в success
- Публиковать непроверенный factual content
- Изменять ADR без evidence
- Обходить branch protection
- Считать command successful при non-zero exit

## 4. Verification Requirements

### 4.1. Publishing Plane (R0-R1)

```bash
npm run content-contract      # hard gate
npm run sync:github           # sync repos/gists
hugo --gc --minify           # build
node scripts/check-links.cjs  # internal links
node scripts/check-a11y.cjs   # accessibility
```

### 4.2. Engineering Plane (R1-R2)

```bash
npm run lint                 # eslint
npm run test                 # jest unit tests
npm run test:dao             # hardhat tests
```

### 4.3. CI Configuration (R3)

All changes require:
- PR creation
- CI green (quality.yml, hugo.yml)
- Human review (CODEOWNERS)

### 4.4. Secrets/Infrastructure (R4)

- Human approval required
- PR with explicit policy override
- Manual merge only

## 5. Stop Conditions

Агент обязан остановиться и escalate при:
- 3 consecutive failures с одинаковым failure signature
- Non-zero exit code verification command
- Security scan finding (critical/high)
- Production build failure
- Secrets exposure detected
- Architecture drift detected (Publishing ↔ Engineering boundary crossed)
- Budget exhaustion (time/tokens/retries)

## 6. Budget Policy

| Resource | Limit |
|----------|-------|
| Retries per task | 3 |
| Worktree lifetime | 24h |
| Max parallel agents | 3 |
| Token budget per run | 50k |
| Evidence retention | 90 days |

## 7. Agent Roles

### 7.1. ORCHESTRATOR
Выбор задач, управление зависимостями, scheduling, retry, escalation.

### 7.2. REPOSITORY_AUDITOR
Снимок состояния репозитория перед каждым циклом.

### 7.3. ARCHITECT
Проверка архитектурных границ, ADR compliance, dependency direction.

### 7.4. PLANNER
Создание атомарного task plan из initiative + state + beads + constraints.

### 7.5. IMPLEMENTER
Реализация в изолированном worktree.

### 7.6. TEST_ENGINEER
Верификация: requirements → acceptance criteria → tests → implementation.

### 7.7. SECURITY_AGENT
Secrets, dependencies, dangerous commands, supply-chain, token exposure.

### 7.8. PERFORMANCE_AGENT
Bundle size, Lighthouse, Core Web Vitals, asset budgets.

### 7.9. A11Y_AGENT
axe, keyboard nav, focus, semantics, contrast.

### 7.10. CONTENT_AGENT
Research → Draft → Fact-check → SEO → KG → Editorial gate.

### 7.11. REVIEW_AGENT
Adversarial review: «это изменение НЕ должно быть принято».

### 7.12. RELEASE_AGENT
PR → CI → Evidence → Policy → Merge → Deploy → Postcheck.
