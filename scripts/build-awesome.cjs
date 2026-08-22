#!/usr/bin/env node
/*
 * build-awesome.cjs
 * -----------------
 * Parses .gitmodules (the curated Awesome lists added as sparse submodules
 * under awesome/<group>/<repo> at the repo root — kept OUT of content/ so
 * Hugo never renders the bare submodule directories as pages) and:
 *
 *   1. Emits data/awesome.json — { groups:[{slug,name,repos:[...]}], total:N }
 *      used by layouts/awesome/list.html (the /awesome/ catalog).
 *   2. Generates per-list preview pages content/awesome/<group>/<repo>/index.md
 *      by copying the submodule's list file (README.md / readme.md / docs/README.md)
 *      into a Hugo page (layout: awesome/single). These previews are GENERATED
 *      (gitignored) and re-derived every build, so they always reflect the
 *      sparse submodule's current README.
 *
 * The catalog page renders cards linking to each preview page; the preview
 * page shows the curated list in full.
 *
 * Graceful: if .gitmodules is absent or a submodule read fails, it still
 * writes a valid (possibly empty) data file and clears stale previews — never
 * fails the build.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = process.cwd();
const GENERATED_AT = new Date().toISOString();
const GITMODULES = path.join(ROOT, '.gitmodules');
const OUT = path.join(ROOT, 'data', 'awesome.json');
const IDX = path.join(ROOT, 'content', 'awesome', '_index.md');
const SUB_BASE = 'awesome'; // repo-root dir
const PREVIEW_DIR = path.join(ROOT, 'content', 'awesome');
const PREVIEW_MAX_LINES = 260; // cap so huge lists stay readable


const GROUP_ORDER = {
  development: 1, web: 2, devops: 3, security: 4, data: 5, blockchain: 6, systems: 7, tools: 8,
};
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

function clearStalePreviews(keep) {
  // Remove generated preview dirs that are no longer in the catalog.
  if (!fs.existsSync(PREVIEW_DIR)) return;
  for (const g of fs.readdirSync(PREVIEW_DIR)) {
    const gdir = path.join(PREVIEW_DIR, g);
    if (!fs.statSync(gdir).isDirectory()) continue;
    if (g === '.git') continue;
    if (g === 'images') continue; // keep any inline images dir we create
    for (const r of fs.readdirSync(gdir)) {
      const rdir = path.join(gdir, r);
      if (!fs.statSync(rdir).isDirectory()) continue;
      const key = `${g}/${r}`;
      if (!keep.has(key)) {
        fs.rmSync(rdir, { recursive: true, force: true });
        console.warn(`[awesome] removed stale preview: ${key}`);
      }
    }
  }
}

// Rewrite relative markdown links inside a README so they point to the
// source repo on GitHub instead of resolving as broken internal links on the
// Hugo site. Absolute (http(s)://, mailto:, tel:, #anchor) and repo-root (/)
// links are left untouched. `branch` is the submodule's real default branch.
function repoBranch(repoPath) {
  try {
    const b = execFileSync('git', ['-C', repoPath, 'rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' }).trim();
    return b && b !== 'HEAD' ? b : 'main';
  } catch { return 'main'; }
}
function rewriteRelativeLinks(md, ghUrl, repoPath) {
  const branch = repoBranch(repoPath);
  const base = ghUrl.replace(/\/$/, '');
  // Raw HTML anchors with relative hrefs (e.g. the-book-of-secret-knowledge
  // README has `<a href="LICENSE.md">`), which markdown-link rewriting misses.
  md = md.replace(/<a\s+([^>]*?)href=["\']([^"\']+)["\']([^>]*)>/gi, (m, pre, href, post) => {
    const d = href.trim();
    if (/^(https?:\/\/|mailto:|tel:|#|\/)/i.test(d)) return m;
    const rel = d.replace(/^\.\//, '').replace(/^\.\.\//, '');
    return `<a ${pre}href="${base}/blob/${branch}/${rel}"${post}>`;
  });
  return md.replace(/\]\(([^)]+)\)/g, (m, dest) => {
    const d = dest.trim();
    if (/^(https?:\/\/|mailto:|tel:|#)/i.test(d)) return m;      // absolute / anchor
    let rel;
    if (d.startsWith('/')) rel = d.slice(1);                        // repo-root absolute -> repo path
    else rel = d.replace(/^\.\//, '').replace(/^\.\.\//, '');   // ./ or ../ -> repo root
    const frag = d.includes('#') ? '#' + d.split('#')[1] : '';
    const q = d.includes('?') ? '?' + d.split('?')[1] : '';
    return `](${base}/blob/${branch}/${rel}${q}${frag})`;
  });
}


// Balance raw HTML tags so a malformed README (e.g. an unclosed
// `<div align=center>` banner) can't break the page layout when inlined
// into a Hugo preview/catalog. Void elements are ignored.
const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
function balanceHtmlTags(html) {
  const stack = [];
  const re = /<\/?([a-zA-Z][a-zA-Z0-9-]*)(?:\s[^>]*)?\/?>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const raw = m[0];
    const name = m[1].toLowerCase();
    if (VOID.has(name)) continue;
    if (raw.startsWith('</')) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i] === name) { stack.length = i; break; }
      }
    } else if (!raw.endsWith('/>')) {
      stack.push(name);
    }
  }
  return html + stack.reverse().map((n) => `</${n}>`).join('');
}

function writePreviews(entries) {
  const keep = new Set();
  for (const e of entries) {
    const key = `${e.group}/${e.name}`;
    keep.add(key);
    const src = path.join(ROOT, e.path, e.readme);
    const dir = path.join(PREVIEW_DIR, e.group, e.name);
    fs.mkdirSync(dir, { recursive: true });
    let body = '';
    try {
      const raw = fs.readFileSync(src, 'utf8');
      const lines = raw.split('\n');
      // Drop a leading "# Title" line (the repo name already is the H1).
      let start = 0;
      while (start < lines.length && /^\s*#\s/.test(lines[start])) start++;
      body = lines.slice(start, start + PREVIEW_MAX_LINES).join('\n').trimEnd();
      if (lines.length > PREVIEW_MAX_LINES + start) body += '\n\n_…превью ограничено; полный список — в репозитории._';
      // Point the list's internal doc links (CONTRIBUTING.md, sub-pages,
      // sub-dirs, raw <a href> anchors) at the source repo on GitHub so they
      // don't render as broken internal links on the Hugo site.
      body = rewriteRelativeLinks(body, e.gh, path.join(ROOT, e.path));
      // Guard against unbalanced raw HTML in the README (banners, tables, etc.)
      // that would otherwise break the rendered preview/page layout.
      body = balanceHtmlTags(body);
    } catch (err) {
      body = `_Не удалось прочитать ${e.readme} субмодуля._`;
    }
    const md = [
      '---',
      'title: "' + e.name + '"',
      'description: "Курируемый awesome-список: ' + e.name + '"',
      'layout: awesome/single',
      'awesome_repo: "' + e.gh + '"',
      'awesome_readme: "' + e.readme + '"',
      '---',
      '',
      `> Источник: [${e.name}](${e.gh}) — синхронизируется из внешнего репозитория как sparse-субмодуль (только список).`,
      '',
      body,
    ].join('\n') + '\n';
    fs.writeFileSync(path.join(dir, 'index.md'), md);
  }
  clearStalePreviews(keep);
}


const META_CACHE = path.join(ROOT, 'data', 'awesome-meta.json');
const META_TTL_MS = 24 * 60 * 60 * 1000;
function loadMetaCache() { try { return JSON.parse(fs.readFileSync(META_CACHE, 'utf8')); } catch { return {}; } }
function saveMetaCache(c) { try { fs.mkdirSync(path.dirname(META_CACHE), { recursive: true }); fs.writeFileSync(META_CACHE, JSON.stringify(c, null, 2)); } catch {} }
async function fetchRepoMeta(gh) {
  const m = gh.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?$/i); if (!m) return null;
  const full = `${m[1]}/${m[2]}`; const cache = loadMetaCache(); const hit = cache[full];
  if (hit && Date.now() - (hit.ts||0) < META_TTL_MS) return { stars: hit.stars, description: hit.description };
  try {
    const headers = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'build-awesome' };
    if (process.env.GITHUB_TOKEN) headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    const res = await fetch(`https://api.github.com/repos/${full}`, { headers });
    if (!res.ok) return null;
    const j = await res.json();
    const meta = { stars: j.stargazers_count ?? null, description: j.description ?? null, ts: Date.now() };
    cache[full] = meta; saveMetaCache(cache); return { stars: meta.stars, description: meta.description };
  } catch { return null; }
}
function countCJK(text){const m=(text||'').match(/[\u3400-\u9fff\uf900-\ufaff]/g);return m?m.length:0;}
function isChineseDominant(text){const cjk=countCJK(text||'');if(cjk<120)return false;const nonWs=(text||'').replace(/\s+/g,'').length||1;return cjk/nonWs>0.05||cjk>300;}
const LANG_REPLACE={};

async function main() {
  if (!fs.existsSync(GITMODULES)) {
    console.warn('[awesome] no .gitmodules — writing empty catalog');
    writeOut({ groups: [], total: 0 });
    ensureIndex();
    writePreviews([]);
    return;
  }

  const mods = parseGitmodules(fs.readFileSync(GITMODULES, 'utf8'));
  const byGroup = new Map();
  const entries = [];

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
    const repoKey = `${slugify(group)}/${slugify(repo)}`;
    let readmeText='';try{readmeText=fs.readFileSync(path.join(ROOT,rel,readme),'utf8');}catch{}
    if(isChineseDominant(readmeText)){const sub=LANG_REPLACE[repoKey];if(sub){console.log(`[awesome] ${repoKey}: Chinese-only -> substituting with ${sub.url}`);m.url=sub.url;gh=sub.url;}else{console.log(`[awesome] ${repoKey}: skipped (Chinese-only, no EN/RU replacement)`);continue;}}

    const entry = {
      slug: slugify(repo),
      name: repo,
      group: slugify(group),
      path: rel,
      url: m.url,
      readme,
      gh,
      refreshedAt: GENERATED_AT,
    };
    entries.push(entry);
    if (!byGroup.has(entry.group)) byGroup.set(entry.group, []);
    byGroup.get(entry.group).push(entry);
  }

  const groups = [...byGroup.entries()]
    .map(([slug, repos]) => {
      const sorted = repos.slice().sort((a, b) => a.name.localeCompare(b.name));
      const refreshed = sorted.map((r) => r.refreshedAt).filter(Boolean).sort().slice(-1)[0];
      return { slug, name: groupName(slug), order: GROUP_ORDER[slug] != null ? GROUP_ORDER[slug] : 99, refreshedAt: refreshed || null, repos: sorted };
    })
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  await Promise.all(entries.map(async (e) => { const meta = await fetchRepoMeta(e.gh); if (meta) { e.stars = meta.stars; e.description = meta.description; } }));
  for (const g of groups) for (const r of g.repos) { const src = entries.find((x) => x.name === r.name && x.group === r.group); if (src) { r.stars = src.stars; r.description = src.description; } }
  const total = groups.reduce((n, g) => n + g.repos.length, 0);
  writeOut({ generatedAt: GENERATED_AT, groups, total });
  writePreviews(entries);
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

main().catch((err) => { console.error('[awesome] FATAL', err); process.exit(1); });