#!/usr/bin/env node

/**
 * Knowledge Graph Generator (Hugo edition) — v2
 *
 * Builds an interactive knowledge graph from the published site:
 *   - post    nodes : content/blog/*.md
 *   - concept nodes : every tag + category used by posts (co-occurrence edges)
 *   - person  nodes : authors in data/authors + non-draft content/people
 *   - project nodes : Engineering Plane projects (DAO, Knowledge Graph pipeline)
 *   - dao     nodes : the three Solidity contracts in contracts/dao
 *
 * Edges connect posts to their concepts, concepts to co-occurring concepts,
 * posts to their author, DAO contracts to the DAO project, and the author to
 * projects. Output: static/data/knowledge-graph.json (gitignored; CI regenerates).
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'content', 'blog');
const PEOPLE_DIR = path.join(ROOT, 'content', 'people');
const AUTHORS_DIR = path.join(ROOT, 'content', '..', 'data', 'authors');
const DAO_DIR = path.join(ROOT, 'contracts', 'dao');
const OUTPUT_DIR = path.join(ROOT, 'static', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'knowledge-graph.json');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  try { return yaml.load(match[1]); } catch (e) { return null; }
}
function readMD(dir, name) {
  const p = path.join(dir, name);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}
function postUrl(relPath) {
  // content/blog/2026/08/14/slug.md -> /2026/08/14/slug/
  const m = relPath.match(/content\/blog\/(.+)\.md$/);
  if (!m) return null;
  return '/' + m[1].replace(/\\/g, '/') + '/';
}
function titleCase(s) { return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }

const nodes = [];
const edges = [];
const nodeIndex = new Set();
function addNode(n) { if (!nodeIndex.has(n.id)) { nodeIndex.add(n.id); nodes.push(n); } }
function addEdge(source, target, type) {
  if (nodeIndex.has(source) && nodeIndex.has(target) && source !== target) {
    edges.push({ source, target, type: type || 'relates' });
  }
}

// --- Posts + concepts ---
const postConcept = {}; // postId -> [conceptId]
if (fs.existsSync(POSTS_DIR)) {
  for (const f of walkFiles(POSTS_DIR, '.md')) {
    const raw = fs.readFileSync(f, 'utf8');
    const fm = extractFrontmatter(raw);
    if (!fm || fm.draft) continue;
    const id = path.basename(f, '.md');
    const url = postUrl(f) || '/' + id + '/';
    const label = (fm.title || id).toString();
    const cats = Array.isArray(fm.categories) ? fm.categories : (fm.category ? [fm.category] : []);
    const tags = Array.isArray(fm.tags) ? fm.tags : [];
    const concepts = [...cats.map(c => 'cat:' + slug(c)), ...tags.map(t => 'tag:' + slug(t))];
    addNode({ id, type: 'post', label, url, date: fm.date || fm.publishDate || '', weight: 3 });
    postConcept[id] = concepts;
    concepts.forEach(c => {
      const kind = c.startsWith('cat:') ? 'Category' : 'Tag';
      const name = c.split(':')[1];
      addNode({ id: c, type: 'concept', label: titleCase(name), kind, weight: 2 });
      addEdge(id, c, 'tagged');
    });
    // author
    const author = (fm.authors && fm.authors[0]) || fm.author || 'DominicusIn';
    addNode({ id: 'person:' + slug(String(author)), type: 'person', label: String(author).replace(/([a-z])([A-Z])/g, '$1 $2'), weight: 4 });
    addEdge(id, 'person:' + slug(String(author)), 'authored');
  }
}

// --- Ontology: category subsumes its tags (concept hierarchy) ---
// For each post, every tag is "owned" by the post's category(-ies). We draw a
// `subsumes` edge from each category concept to every tag concept that appears
// under it. This turns the concept layer into a real hierarchy instead of pure
// co-occurrence, and is what makes the Knowledge Graph an ontology view.
const catTags = {}; // catId -> Set(tagId)
for (const [pid, cs] of Object.entries(postConcept)) {
  const cats = cs.filter(c => c.startsWith('cat:'));
  const tags = cs.filter(c => c.startsWith('tag:'));
  for (const cat of cats) {
    catTags[cat] = catTags[cat] || new Set();
    tags.forEach(t => catTags[cat].add(t));
  }
}
for (const [cat, tags] of Object.entries(catTags)) {
  tags.forEach(t => addEdge(cat, t, 'subsumes'));
}

// --- Ontology: cross-domain bridges (manual, high-level) ---
const bridges = [
  ['cat:security', 'cat:web'],
  ['cat:systems', 'cat:web'],
  ['cat:ai', 'cat:security'],
  ['cat:dao', 'cat:web'],
  ['cat:philosophy', 'cat:career'],
  ['cat:systems', 'cat:dao'],
];
bridges.forEach(([a, b]) => addEdge(a, b, 'relatedTo'));

// --- GitHub repositories + gists (ontology expansion) ---
// Reads the index produced by scripts/sync-github.cjs (data/github.json). Each
// repo becomes a `repository` node; each gist a `gist` node; their GitHub topics
// become `concept` (tag) nodes linked via `tagged`. This turns the graph into a
// true site ontology spanning posts, concepts, repos, gists and people.
const githubJson = path.join(ROOT, 'data', 'github.json');
if (fs.existsSync(githubJson)) {
  try {
    const gh = JSON.parse(fs.readFileSync(githubJson, 'utf8'));
    for (const r of (gh.repos || [])) {
      const id = 'repo:' + r.fullName;
      addNode({ id, type: 'repository', label: r.name, url: r.html_url, owner: r.owner, weight: 4 });
      addEdge('org:' + r.owner, id, 'owns');
      addNode({ id: 'org:' + r.owner, type: 'org', label: r.owner, weight: 6 });
      for (const t of (r.topics || [])) {
        const cid = 'tag:' + slug(t);
        addNode({ id: cid, type: 'concept', label: titleCase(t), kind: 'Tag', weight: 2 });
        addEdge(id, cid, 'tagged');
      }
    }
    for (const g of (gh.gists || [])) {
      const id = 'gist:' + g.id;
      addNode({ id, type: 'gist', label: (g.description || g.id).toString().slice(0, 40), url: g.html_url, weight: 3 });
      addEdge('person:dominicusin', id, 'authored');
    }
  } catch (e) { console.warn('kg: github.json parse skipped:', e.message); }
}

// --- Concept co-occurrence ---
const conceptPosts = {};
for (const [pid, cs] of Object.entries(postConcept)) cs.forEach(c => { (conceptPosts[c] = conceptPosts[c] || []).push(pid); });
const conceptIds = Object.keys(conceptPosts);
for (let i = 0; i < conceptIds.length; i++) {
  for (let j = i + 1; j < conceptIds.length; j++) {
    const shared = conceptPosts[conceptIds[i]].filter(p => conceptPosts[conceptIds[j]].includes(p));
    if (shared.length >= 2) addEdge(conceptIds[i], conceptIds[j], 'co-occurs');
  }
}

// --- DAO contracts ---
const daoContracts = ['GovernanceToken', 'SoulboundToken', 'ProposalEngine'];
addNode({ id: 'project:dao', type: 'project', label: 'Decentralized Governance (DAO)', url: '/projects/', weight: 5 });
daoContracts.forEach(c => {
  addNode({ id: 'dao:' + c, type: 'dao', label: c + '.sol', url: 'https://github.com/dominicusin/dominicusin.github.io/tree/main/contracts/dao', weight: 3 });
  addEdge('project:dao', 'dao:' + c, 'implements');
});

// --- Knowledge Graph project ---
addNode({ id: 'project:kg', type: 'project', label: 'Knowledge Graph Pipeline', url: '/knowledge-graph/', weight: 5 });
addEdge('person:dominicusin', 'project:kg', 'maintains');
addEdge('person:dominicusin', 'project:dao', 'maintains');

// --- concepts that clearly tie to projects ---
addEdge('project:kg', 'concept:knowledge-graph', 'documents');

function walkFiles(dir, ext) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkFiles(full, ext));
    else if (e.name.endsWith(ext)) out.push(full);
  }
  return out;
}
function slug(s) { return String(s).toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, ''); }

const graph = {
  generatedAt: new Date().toISOString(),
  nodes,
  edges,
};
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(graph, null, 2));
console.log(`✅ Knowledge graph: ${nodes.length} nodes, ${edges.length} edges → ${path.relative(ROOT, OUTPUT_FILE)}`);
