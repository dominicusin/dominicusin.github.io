#!/usr/bin/env node
/*
 * build-awesome.cjs
 * -----------------
 * Parses .gitmodules (the curated Awesome lists added as sparse submodules
 * under awesome/<group>/<repo> at the repo root — kept OUT of content/ so
 * Hugo never renders the README as a page) and emits data/awesome.json:
 *
 *   { groups: [ { slug, name, repos: [ { slug, name, group, path, url, readme, gh } ] } ], total: N }
 *
 * The catalog page (layouts/awesome/list.html, served at /awesome/) renders
 * this as grouped cards. Also writes content/awesome/_index.md if missing.
 *
 * Graceful: if .gitmodules is absent or a submodule read fails, it still
 * writes a valid (possibly empty) data file — never fails the build.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = process.cwd();
const GITMODULES = path.join(ROOT, '.gitmodules');
const OUT = path.join(ROOT, 'data', 'awesome.json');
const IDX = path.join(ROOT, 'content', 'awesome', '_index.md');
const SUB_BASE = 'awesome'; // repo-root dir

const GROUP_NAMES = {
  development: 'Разработка',
  devops: 'DevOps & Инфраструктура',
  security: 'Безопасность',
  data: 'Данные & ML',
  web: 'Web & Frontend',
  systems: 'Системы & Языки',
  blockchain: 'Блокчейн & DAO',
  tools: 'Инструменты & Прочее',
};

function groupName(slug) {
  return GROUP_NAMES[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
}

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseGitmodules(text) {
  const mods = [];
  const re = /\[submodule\s+"([^"]+)"\][^\[]*?path\s*=\s*(\S+)[^\[]*?url\s*=\s*(\S+)/g;
  let m;
  while ((m = re.exec(text)) !== null) mods.push({ path: m[2].trim(), url: m[3].trim() });
  return mods;
}

function detectReadme(rel) {
  let files = [];
  try {
    files = execFileSync('git', ['-C', rel, 'ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean);
  } catch {
    try { files = fs.readdirSync(path.join(ROOT, rel)); } catch { return 'README.md'; }
  }
  const cands = files.filter((f) => f.toLowerCase().endsWith('readme.md'));
  if (!cands.length) return 'README.md';
  const score = (f) => {
    const l = f.toLowerCase();
    if (l === 'readme.md') return 0;
    if (l.endsWith('/readme.md')) return 1;
    return 2;
  };
  cands.sort((a, b) => score(a) - score(b));
  return cands[0];
}

function main() {
  if (!fs.existsSync(GITMODULES)) {
    console.warn('[awesome] no .gitmodules — writing empty catalog');
    writeOut({ groups: [], total: 0 });
    ensureIndex();
    return;
  }

  const mods = parseGitmodules(fs.readFileSync(GITMODULES, 'utf8'));
  const byGroup = new Map();

  for (const m of mods) {
    const rel = m.path.replace(/\\/g, '/');
    const parts = rel.split('/');
    if (parts[0] !== SUB_BASE) continue; // only awesome/* submodules
    const group = parts[1];
    const repo = parts.slice(2).join('/') || path.basename(rel);
    if (!group) continue;

    const readme = detectReadme(rel);
    const ghMatch = m.url.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?$/i);
    const gh = ghMatch ? `https://github.com/${ghMatch[1]}/${ghMatch[2]}` : m.url;

    const entry = {
      slug: slugify(repo),
      name: repo,
      group: slugify(group),
      path: rel,
      url: m.url,
      readme,
      gh,
    };
    if (!byGroup.has(entry.group)) byGroup.set(entry.group, []);
    byGroup.get(entry.group).push(entry);
  }

  const groups = [...byGroup.entries()]
    .map(([slug, repos]) => ({ slug, name: groupName(slug), repos: repos.sort((a, b) => a.name.localeCompare(b.name)) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const total = groups.reduce((n, g) => n + g.repos.length, 0);
  writeOut({ groups, total });
  ensureIndex();
  console.log(`[awesome] catalog: ${groups.length} groups, ${total} lists -> ${path.relative(ROOT, OUT)}`);
}

function writeOut(obj) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(obj, null, 2) + '\n');
}

function ensureIndex() {
  if (fs.existsSync(IDX)) return;
  fs.mkdirSync(path.dirname(IDX), { recursive: true });
  fs.writeFileSync(
    IDX,
    [
      '---',
      'title: Awesome',
      'description: "Курируемые awesome-списки из внешних репозиториев, сгруппированные по темам."',
      'layout: awesome',
      'menu:',
      '  main:',
      '    name: Awesome',
      '    weight: 10',
      '---',
      '',
      'Курируемые awesome-списки, синхронизируемые из внешних репозиториев (только README).',
    ].join('\n') + '\n'
  );
  console.warn('[awesome] created content/awesome/_index.md');
}

main();
