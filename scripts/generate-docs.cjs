#!/usr/bin/env node
/**
 * Auto-generates project documentation for the Hugo site.
 *
 * Scans source, configs, workflows and scripts, then emits docs pages.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'content', 'docs');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function extractJsModules() {
  const modules = [];
  const srcDir = path.join(ROOT, 'src');
  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js') || f.endsWith('.cjs'));
  for (const file of files) {
    const full = path.join(srcDir, file);
    const content = fs.readFileSync(full, 'utf8');
    const descMatch = content.match(/\/\*\*[\s\S]*?\*\//);
    const desc = descMatch ? descMatch[0].replace(/\/\*\*|\*\//g, '').trim() : '';
    const classMatch = content.match(/export\s+class\s+(\w+)/g);
    const classes = classMatch ? classMatch.map(m => m.replace('export class ', '').trim()) : [];
    modules.push({ file: 'src/' + file, desc: desc.split('\n')[0] || file, classes });
  }
  return modules;
}

function extractConfigFiles() {
  const configs = [];
  const cfgDir = path.join(ROOT, 'config', '_default');
  const files = fs.readdirSync(cfgDir).filter(f => /\.(toml|yaml|yml|json)$/.test(f));
  for (const file of files) {
    const full = path.join(cfgDir, file);
    const content = fs.readFileSync(full, 'utf8');
    configs.push({ file: 'config/_default/' + file, preview: content.slice(0, 400).replace(/</g, '&lt;') });
  }
  return configs;
}

function extractWorkflows() {
  const wfDir = path.join(ROOT, '.github', 'workflows');
  const files = fs.readdirSync(wfDir).filter(f => /\.yml$/.test(f));
  const workflows = [];
  for (const file of files) {
    const full = path.join(wfDir, file);
    const content = fs.readFileSync(full, 'utf8');
    const nameMatch = content.match(/^name:\s*(.+)$/m);
    workflows.push({ file, name: nameMatch ? nameMatch[1].trim() : file });
  }
  return workflows;
}

function extractScripts() {
  const sDir = path.join(ROOT, 'scripts');
  const files = fs.readdirSync(sDir).filter(f => /\.(cjs|js|py)$/.test(f));
  const scripts = [];
  for (const file of files) {
    const full = path.join(sDir, file);
    const content = fs.readFileSync(full, 'utf8');
    const first = content.split('\n').find(l => l.trim() && !l.trim().startsWith('#') && !l.trim().startsWith('//'));
    scripts.push({ file: 'scripts/' + file, firstLine: first ? first.trim() : file });
  }
  return scripts;
}

function buildDocs() {
  ensureDir(DOCS_DIR);
  const modules = extractJsModules();
  const configs = extractConfigFiles();
  const workflows = extractWorkflows();
  const scripts = extractScripts();

  const index = `---
title: "Документация проекта"
description: "Автогенерируемая документация по архитектуре, API, CI/CD и модулям."
date: "${new Date().toISOString().slice(0,10)}"
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

${configs.map(c => '- `' + c.file + '`').join('\n')}

### Workflows

${workflows.map(w => '- `' + w.file + '` — ' + w.name).join('\n')}

## API / модули

${modules.map(m => '### `' + m.file + '`\n' + (m.desc || '—') + '\n\n' + (m.classes.length ? 'Экспорты: ' + m.classes.join(', ') : '')).join('\n\n')}

## Вклад в проект

- Контент: content/, правила в schema/post-metadata.schema.json.
- Стили: assets/css/, JS модули: src/.
- Скрипты: scripts/.
- Тесты: tests/.

Локально: npm test, hugo --gc --minify, hugo server -D.

## CI/CD

${scripts.map(s => '- `' + s.file + '`').join('\n')}

> Эта страница пересобирается автоматически при изменении исходников.
`;

  fs.writeFileSync(path.join(DOCS_DIR, '_index.md'), index, 'utf8');

  const arch = `---
title: "Архитектура"
description: "Архитектура проекта и плоскость публикации."
date: "${new Date().toISOString().slice(0,10)}"
draft: false
---

# Архитектура

См. [Документация проекта](/docs/).
`;
  fs.writeFileSync(path.join(DOCS_DIR, 'architecture.md'), arch, 'utf8');

  const api = `---
title: "API / модули"
description: "Обзор модулей src/."
date: "${new Date().toISOString().slice(0,10)}"
draft: false
---

# API / модули

${modules.map(m => '## `' + m.file + '`\n' + (m.desc || '—') + '\n' + (m.classes.length ? 'Экспорты: ' + m.classes.join(', ') : '')).join('\n\n')}
`;
  fs.writeFileSync(path.join(DOCS_DIR, 'api.md'), api, 'utf8');

  const contributing = `---
title: "Вклад в проект"
description: "Как работать с репозиторием."
date: "${new Date().toISOString().slice(0,10)}"
draft: false
---

# Вклад в проект

- Форкните, создайте ветку, откройте PR.
- Посты: content/blog/, соблюдайте content contract.
- Скрипты: scripts/, модули: src/, тесты: tests/.
`;
  fs.writeFileSync(path.join(DOCS_DIR, 'contributing.md'), contributing, 'utf8');

  const ci = `---
title: "CI/CD"
description: "Обзор пайплайнов."
date: "${new Date().toISOString().slice(0,10)}"
draft: false
---

# CI/CD

${workflows.map(w => '## `' + w.file + '`\n' + w.name).join('\n\n')}
`;
  fs.writeFileSync(path.join(DOCS_DIR, 'ci.md'), ci, 'utf8');
}

buildDocs();
console.log('✅ Documentation generated in content/docs/');
