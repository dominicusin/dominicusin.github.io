#!/usr/bin/env node
/**
 * sync-github.cjs — auto-ingest dominicusin + associated-org repos and gists.
 *
 * Runs BEFORE `hugo` (locally via `npm run sync:github`, and in CI inside the
 * Pages deploy workflow). Fetches live GitHub data and writes Hugo content so the
 * deployed site always mirrors current GitHub state — the source repo stays clean
 * and branch protection is never fought.
 *
 * Outputs:
 *   content/repositories/<owner>/<repo>/_index.md   (README + Contributing + License + docs)
 *   content/gists/<id>.md                          (each gist file as a code block)
 *   data/github.json                                (machine-readable index for KG + ontology)
 *
 * Design notes:
 *   - Auth: GITHUB_TOKEN (CI) optional; unauthenticated fallback (60/hr limit).
 *   - Parallel + batched (8 concurrent) to finish in ~1 min, not 5.
 *   - Rate-limit safe: conditional requests via ETag cache; light doc fetches
 *     (README + CONTRIBUTING + LICENSE + a few docs/, no full recursive trees).
 *   - INCLUDE_WIKI=1 clones the repo wiki (best-effort, opt-in).
 *   - Graceful: every repo/gist wrapped in try/catch; partial success -> exit 0.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const REPO_OUT = path.join(ROOT, 'content', 'repositories');
const GIST_OUT = path.join(ROOT, 'content', 'gists');
const DATA_OUT = path.join(ROOT, 'data');
const CACHE_DIR = path.join(ROOT, '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'github-cache.json');

const OWNERS = ['dominicusin', 'neoallunity', 'Hitech-gmbh', 'transgregorial'];
const GIST_USER = 'dominicusin';
const INCLUDE_WIKI = process.env.INCLUDE_WIKI === '1';
const INCLUDE_DOCS = process.env.INCLUDE_DOCS !== '0'; // on by default
const MAX_DOC_BYTES = 200 * 1024;
const BATCH = 8;
const DOC_EXT = new Set(['.md', '.markdown', '.txt', '.rst', '.adoc', '.textile']);
// Curated doc entry points we attempt (cheap, 1-2 calls per original repo).
const DOC_CANDIDATES = [
  'docs/README.md', 'docs/index.md', 'docs/00-index.md',
  'documentation/README.md', 'doc/README.md',
];

const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const UA = 'dominicusin-site-sync/1.0';

let cache = {};
try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch { cache = {}; }
function saveCache() {
  try { fs.mkdirSync(CACHE_DIR, { recursive: true }); fs.writeFileSync(CACHE_FILE, JSON.stringify(cache)); } catch {}
}

async function gh(url, { raw = false, retry = 2 } = {}) {
  for (let attempt = 0; attempt <= retry; attempt++) {
    try {
      const headers = { 'Accept': raw ? '*/*' : 'application/vnd.github+json', 'User-Agent': UA, 'X-GitHub-Api-Version': '2022-11-28' };
      if (TOKEN) headers['Authorization'] = 'Bearer ' + TOKEN;
      const etag = cache[url] && cache[url].etag;
      if (etag) headers['If-None-Match'] = etag;
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch(url, { headers, signal: ctrl.signal });
      clearTimeout(t);
      const newEtag = res.headers.get('etag');
      if (res.status === 304 && cache[url]) return cache[url].data;
      if (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0') {
        const reset = Number(res.headers.get('x-ratelimit-reset') || 0) * 1000;
        const wait = Math.max(0, reset - Date.now());
        // Only sleep if reset is imminent (< 60s) and we haven't retried; otherwise
        // degrade fast so the build never blocks on a rate limit (CI uses a fresh token).
        if (wait && wait < 60000 && attempt < retry) { await new Promise(r => setTimeout(r, wait + 1000)); return gh(url, { raw, retry: attempt }); }
        throw new Error('rate limited');
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = raw ? await res.text() : await res.json();
      if (newEtag) cache[url] = { etag: newEtag, data };
      return data;
    } catch (e) {
      if (attempt === retry) { console.warn(`✗ ${url}: ${e.message}`); return null; }
      await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  return null;
}

function b64decode(s) { return Buffer.from(s, 'base64').toString('utf8'); }

async function getRepos(owner) {
  const cacheKey = path.join(CACHE_DIR, `repos-${owner}.json`);
  const all = [];
  for (let page = 1; page <= 10; page++) {
    const isUser = owner === 'dominicusin';
    const url = `https://api.github.com/${isUser ? 'users' : 'orgs'}/${owner}/repos?per_page=100&page=${page}&type=all`;
    const batch = await gh(url);
    if (!batch || !batch.length) {
      // Rate-limited or transient failure: reuse ETag cache for this exact URL.
      if (cache[url] && Array.isArray(cache[url].data) && cache[url].data.length) return cache[url].data;
      break;
    }
    all.push(...batch);
    if (batch.length < 100) break;
  }
  // Fallback: reuse last-good repo set if live fetch returned nothing (e.g. transient rate limit).
  if (!all.length && fs.existsSync(cacheKey)) {
    try { return JSON.parse(fs.readFileSync(cacheKey, 'utf8')); } catch {}
  }
  if (all.length) { try { fs.mkdirSync(CACHE_DIR, { recursive: true }); fs.writeFileSync(cacheKey, JSON.stringify(all)); } catch {} }
  return all;
}

async function getFile(repo, p, ref) {
  const url = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(p)}${ref ? '?ref=' + ref : ''}`;
  const meta = await gh(url);
  if (!meta || !meta.content) return null;
  return b64decode(meta.content);
}

async function getDocsQuick(repo, ref) {
  // Cheap: probe a curated set of doc entry points (1 call each, cached).
  const out = [];
  if (!INCLUDE_DOCS) return out;
  await Promise.all(DOC_CANDIDATES.map(async (dp) => {
    const txt = await getFile(repo, dp, ref);
    if (txt) out.push({ name: path.basename(dp, path.extname(dp)), body: txt.slice(0, MAX_DOC_BYTES) });
  }));
  return out;
}

async function cloneWiki(owner, repo) {
  if (!INCLUDE_WIKI) return null;
  const tmp = path.join(CACHE_DIR, `wiki-${owner}-${repo}`);
  try {
    execFileSync('rm', ['-rf', tmp], { stdio: 'ignore' });
    execFileSync('git', ['clone', '--depth', '1', `https://github.com/${owner}/${repo}.wiki.git`, tmp], { stdio: 'ignore', timeout: 30000 });
    const pages = [];
    for (const f of fs.readdirSync(tmp)) {
      if (!DOC_EXT.has(path.extname(f))) continue;
      const name = path.basename(f, path.extname(f));
      if (['_sidebar', 'footer', 'header'].includes(name.toLowerCase())) continue;
      pages.push({ name, body: fs.readFileSync(path.join(tmp, f), 'utf8').slice(0, MAX_DOC_BYTES) });
    }
    return pages;
  } catch { return null; }
  finally { try { execFileSync('rm', ['-rf', tmp], { stdio: 'ignore' }); } catch {} }
}

function yamlish(str) {
  // JSON.stringify produces a YAML-safe quoted scalar (handles quotes, backslashes, unicode).
  return JSON.stringify(String(str == null ? '' : str).replace(/\n/g, ' ').trim());
}
function qlist(arr) { return '[' + (arr || []).map(x => JSON.stringify(String(x))).join(', ') + ']'; }

function writeRepoPage(owner, repo, info, body, docs) {
  // Flat page: content/repositories/<owner>__<repo>.md — a direct child of the
  // /repositories/ section so .RegularPages lists every repo on the index.
  const file = path.join(REPO_OUT, `${owner}__${repo}.md`);
  fs.mkdirSync(REPO_OUT, { recursive: true });
  const fm = [
    '---',
    `title: ${yamlish(info.fullName)}`,
    'type: repository',
    `repo_owner: ${JSON.stringify(owner)}`,
    `repo_name: ${JSON.stringify(repo)}`,
    `repo_url: https://github.com/${owner}/${repo}`,
    `wiki_url: https://github.com/${owner}/${repo}/wiki`,
    `description: ${yamlish(info.description || '')}`,
    `language: ${info.language ? JSON.stringify(info.language) : 'null'}`,
    `topics: ${qlist(info.topics)}`,
    `stars: ${info.stargazers_count || 0}`,
    `forks: ${info.forks_count || 0}`,
    `archived: ${!!info.archived}`,
    `is_fork: ${!!info.fork}`,
    `has_wiki: ${!!info.has_wiki}`,
    `default_branch: ${JSON.stringify(info.default_branch || 'main')}`,
    `doc_pages: ${qlist(docs.map(d => d.name))}`,
    '---',
    '',
  ].join('\n');
  fs.writeFileSync(file, fm + body + '\n');
}

function writeGistPage(gist) {
  // Flat page: content/gists/<id>.md — a direct child of the /gists/ section so
  // .RegularPages lists every gist on the index (mirrors writeRepoPage for repos).
  // NOTE: nested content/gists/<id>/index.md was NOT picked up by the section's
  // .RegularPages in the list template, leaving /gists/ empty. Flat layout fixes it.
  const file = path.join(GIST_OUT, `${gist.id}.md`);
  fs.mkdirSync(GIST_OUT, { recursive: true });
  // Human-readable name for the /gists/ list: "description firstFileName".
  // For gist 21432… (description "zroot", file "zroot") this yields "zroot zroot".
  const firstName = (gist.files && gist.files[0] && gist.files[0].name) || '';
  const gistName = gist.description
    ? (firstName ? `${gist.description} ${firstName}` : gist.description)
    : (firstName || gist.id);
  const fm = [
    '---',
    `title: ${yamlish(gist.description || gist.id)}`,
    'type: gist',
    `gist_id: ${JSON.stringify(gist.id)}`,
    `gist_name: ${JSON.stringify(gistName)}`,
    `gist_url: https://gist.github.com/${GIST_USER}/${gist.id}`,
    `updated_at: ${JSON.stringify(gist.updated_at || '')}`,
    `files: ${qlist(gist.files.map(f => f.name))}`,
    '---',
    '',
  ].join('\n');
  let body = '';
  if (gist.description) body += `_${gist.description}_\n\n`;
  for (const f of gist.files) body += `## ${f.name}\n\n\`\`\`${f.lang || ''}\n${f.content}\n\`\`\`\n\n`;
  fs.writeFileSync(file, fm + body + '\n');
}

function guessLang(name) {
  const ext = path.extname(name).slice(1).toLowerCase();
  const map = { md: 'markdown', scm: 'scheme', sh: 'bash', js: 'javascript', ts: 'typescript', py: 'python', rs: 'rust', go: 'go', txt: 'text', yml: 'yaml', yaml: 'yaml', json: 'json', c: 'c', h: 'c', cpp: 'cpp', hs: 'haskell', el: 'lisp', lua: 'lua' };
  return map[ext] || '';
}

// Rewrite relative links/images in fetched README/docs to absolute GitHub URLs
// so they resolve on the site instead of 404ing. Anchors, absolute and data: URLs pass through.
function rewriteRelative(md, fullName, ref) {
  const base = `https://github.com/${fullName}/blob/${ref}`;
  const fix = (p) => {
    if (/^(https?:|#|mailto:|data:|\/)/.test(p)) return p; // already absolute / anchor / root
    return `${base}/${p.replace(/^\.\//, '').replace(/^(\.\.\/)+/, '')}`;
  };
  return md
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (m, alt, p) => `![${alt}](${fix(p)})`)
    .replace(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (m, p) => `](${fix(p)})`);
}

function stripHtmlComments(input) {
  let previous;
  let output = input;
  do {
    previous = output;
    output = output.replace(/<!--.*?-->/gs, '');
  } while (output !== previous);
  return output;
}

async function processRepo(r) {
  const full = r.full_name;
  const ref = r.default_branch;
  let body = '';
  const readme = await getFile(full, 'README.md', ref) || await getFile(full, 'readme.md', ref);
  if (readme) body += rewriteRelative(stripHtmlComments(readme).slice(0, MAX_DOC_BYTES * 2), full, ref);
  const docs = [];
  if (!r.fork) {
    const contributing = await getFile(full, 'CONTRIBUTING.md', ref);
    const license = await getFile(full, 'LICENSE', ref) || await getFile(full, 'LICENSE.md', ref);
    if (contributing) { body += `\n\n---\n\n## Contributing\n\n${rewriteRelative(contributing.slice(0, MAX_DOC_BYTES), full, ref)}`; docs.push({ name: 'Contributing' }); }
    if (license) { body += `\n\n## License\n\n\`\`\`\n${license.slice(0, MAX_DOC_BYTES)}\n\`\`\``; docs.push({ name: 'License' }); }
    const extra = await getDocsQuick(full, ref);
    for (const d of extra) { body += `\n\n## ${d.name}\n\n${rewriteRelative(d.body, full, ref)}`; docs.push({ name: d.name }); }
    const wiki = await cloneWiki(r.owner.login || r.owner.name || full.split('/')[0], r.name);
    if (wiki && wiki.length) { body += '\n\n## Wiki\n\n'; for (const w of wiki) body += `### ${w.name}\n\n${rewriteRelative(w.body, full, ref)}\n\n`; }
  }
  writeRepoPage(full.split('/')[0], r.name, r, body, docs);
  return {
    owner: full.split('/')[0], name: r.name, fullName: full, description: r.description || '',
    language: r.language || null, topics: r.topics || [], stargazers_count: r.stargazers_count || 0,
    forks_count: r.forks_count || 0, archived: !!r.archived, fork: !!r.fork,
    default_branch: ref || 'main', html_url: r.html_url, homepage: r.homepage || '',
    license: r.license && r.license.spdx_id ? r.license.spdx_id : null,
    has_wiki: !!r.has_wiki, doc_pages: docs.map(d => d.name),
  };
}

async function getGists() {
  const cacheKey = path.join(CACHE_DIR, `gists-${GIST_USER}.json`);
  const url = `https://api.github.com/users/${GIST_USER}/gists?per_page=100`;
  let gists = await gh(url);
  if (!gists || !gists.length) {
    // Secondary rate-limit / 403 in CI (heavy repo storm exhausts the token
    // before this call). Fall back to last-good cache so gist pages still build.
    if (cache[url] && Array.isArray(cache[url].data) && cache[url].data.length) return cache[url].data;
    if (fs.existsSync(cacheKey)) { try { return JSON.parse(fs.readFileSync(cacheKey, 'utf8')); } catch {} }
  }
  if (gists && gists.length) { try { fs.mkdirSync(CACHE_DIR, { recursive: true }); fs.writeFileSync(cacheKey, JSON.stringify(gists)); } catch {} }
  return gists || [];
}

async function main() {
  console.log('🔄 Syncing GitHub repos + gists…');
  const reposOut = [];
  const gistsOut = [];
  const errors = [];

  // ---- Gists FIRST (cheap: 1 list call + N file calls) ----
  // Must run before the heavy repo storm, which exhausts the CI token's
  // secondary rate-limit and makes `users/<user>/gists` return HTTP 403.
  let gists = [];
  try { gists = await getGists(); } catch (e) { errors.push(`gists: ${e.message}`); }
  console.log(`  gists: ${gists.length}`);
  for (const g of gists) {
    try {
      const files = [];
      for (const [name, meta] of Object.entries(g.files || {})) {
        const raw = meta.raw_url ? await gh(meta.raw_url, { raw: true }) : (meta.content || '');
        files.push({ name, lang: meta.language || guessLang(name), content: (raw || '').slice(0, MAX_DOC_BYTES) });
      }
      writeGistPage({ id: g.id, description: g.description, updated_at: g.updated_at, files });
      gistsOut.push({ id: g.id, description: g.description || '', html_url: g.html_url, updated_at: g.updated_at, files: files.map(f => ({ name: f.name, lang: f.lang || '' })) });
    } catch (e) { errors.push(`gist ${g.id}: ${e.message}`); }
  }

  // ---- Repos (parallel, batched) ----
  const allRepos = [];
  for (const owner of OWNERS) {
    let repos = [];
    try { repos = await getRepos(owner); } catch (e) { errors.push(`repos ${owner}: ${e.message}`); }
    console.log(`  ${owner}: ${repos.length} repos`);
    allRepos.push(...repos);
  }
  for (let i = 0; i < allRepos.length; i += BATCH) {
    const batch = allRepos.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(r => processRepo(r).catch(e => { errors.push(`repo ${r.full_name}: ${e.message}`); return null; })));
    results.filter(Boolean).forEach(r => reposOut.push(r));
  }

  fs.mkdirSync(DATA_OUT, { recursive: true });
  const index = {
    generatedAt: new Date().toISOString(), owners: OWNERS,
    repos: reposOut, gists: gistsOut,
    stats: { repos: reposOut.length, gists: gistsOut.length, errors: errors.length },
  };
  fs.writeFileSync(path.join(DATA_OUT, 'github.json'), JSON.stringify(index, null, 2));
  saveCache();

  console.log(`✅ sync-github: ${reposOut.length} repos, ${gistsOut.length} gists → data/github.json${errors.length ? ` (${errors.length} partial errors)` : ''}`);
  if (errors.length) errors.slice(0, 10).forEach(e => console.warn('   !', e));
  process.exit(0);
}

main();
