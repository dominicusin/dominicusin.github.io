#!/usr/bin/env node

/**
 * Knowledge Graph Generator (Hugo edition)
 *
 * Builds a JSON-LD knowledge graph from Hugo post frontmatter in
 * content/blog/*.md. Replaces the legacy _posts/-based generator (Phase 7
 * removed Jekyll). Concepts are derived from each post's `tags` + `categories`;
 * co-occurrence links connect concepts shared by the same post.
 *
 * Output: assets/data/knowledge-graph.json
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const POSTS_DIR = path.join(__dirname, '..', 'content', 'blog');
const OUTPUT_DIR = path.join(__dirname, '..', 'static', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'knowledge-graph.json');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  try {
    return yaml.load(match[1]);
  } catch (e) {
    return null;
  }
}

function buildKnowledgeGraph() {
  console.log('🔍 Scanning Hugo posts for concepts...\n');

  if (!fs.existsSync(POSTS_DIR)) {
    console.error('❌ Posts directory not found: ' + POSTS_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md') || f.endsWith('.markdown'))
    .sort()
    .reverse();

  const concepts = new Map();
  const nodes = [];
  const edges = [];
  const postConcepts = new Map();

  files.forEach((file) => {
    const filePath = path.join(POSTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const fm = extractFrontmatter(content);
    if (!fm) return;
    if (fm.draft) return;

    // Hugo post URL: prefer explicit slug/permalink, else derived from filename.
    const slug = (fm.slug || file.replace(/\.(md|markdown)$/, ''))
      .replace(/^\d{4}-\d{2}-\d{2}-/, '');
    const postUrl = fm.permalink || ('/' + slug + '/');
    const postId = slug;

    const conceptIds = [];
    [...(fm.tags || []), ...(fm.categories || [])].forEach((raw) => {
      const id = String(raw).toLowerCase().replace(/\s+/g, '-');
      if (!concepts.has(id)) {
        concepts.set(id, {
          id,
          label: String(raw),
          description: 'Concept "' + raw + '" referenced in dominicusin.github.io',
          type: 'Concept',
          occurrences: [],
        });
      }
      const conceptObj = concepts.get(id);
      conceptObj.occurrences.push({ postId, postUrl, postTitle: fm.title, date: fm.date });
      conceptIds.push(id);
      edges.push({ source: postId, target: id, relation: 'tagged_with', type: 'references' });
      edges.push({ source: id, target: postId, relation: 'used_in', type: 'referenced_by' });
    });

    postConcepts.set(postId, conceptIds);
    nodes.push({
      id: postId,
      type: 'BlogPosting',
      url: postUrl,
      title: fm.title,
      date: fm.date,
      categories: fm.categories || [],
      tags: fm.tags || [],
      author: fm.author || fm.authors || null,
      conceptCount: conceptIds.length,
    });
  });

  const conceptArray = Array.from(concepts.values());

  for (let i = 0; i < conceptArray.length; i++) {
    for (let j = i + 1; j < conceptArray.length; j++) {
      const a = conceptArray[i];
      const b = conceptArray[j];
      const common = a.occurrences.filter((oa) => b.occurrences.some((ob) => oa.postId === ob.postId));
      if (common.length > 0) {
        edges.push({ source: a.id, target: b.id, relation: 'co_occurs_with', type: 'semantic_link', strength: common.length, posts: common.map((c) => c.postId) });
        edges.push({ source: b.id, target: a.id, relation: 'co_occurs_with', type: 'semantic_link', strength: common.length, posts: common.map((c) => c.postId) });
      }
    }
  }

  const graph = {
    '@context': {
      '@vocab': 'https://schema.org/',
      rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      Concept: 'skos:Concept',
      label: 'skos:prefLabel',
    },
    '@graph': [
      {
        '@id': 'https://dominicusin.github.io',
        '@type': 'WebSite',
        name: 'Dominicus In Blog',
        description: 'Knowledge graph of concepts and articles',
        totalPosts: nodes.length,
        totalConcepts: conceptArray.length,
        generatedAt: new Date().toISOString(),
      },
    ]
      .concat(
        nodes.map((n) => ({
          '@id': 'https://dominicusin.github.io' + n.url,
          '@type': n.type,
          headline: n.title,
          datePublished: n.date,
          articleSection: n.categories,
          keywords: n.tags,
          author: n.author ? { '@type': 'Person', '@id': '#/people/' + n.author } : undefined,
          about: (postConcepts.get(n.id) || []).map((cid) => ({ '@id': '#/concepts/' + cid })),
        }))
      )
      .concat(
        conceptArray.map((c) => ({
          '@id': '#/concepts/' + c.id,
          '@type': 'Concept',
          prefLabel: c.label,
          definition: c.description,
          occurrence: c.occurrences.map((occ) => ({ '@type': 'Occurrence', inPost: { '@id': 'https://dominicusin.github.io' + occ.postUrl }, relationType: occ.relation })),
        }))
      ),
    nodes: nodes.map((n) => ({ id: n.id, type: 'post', label: n.title, url: n.url }))
      .concat(conceptArray.map((c) => ({ id: c.id, type: 'concept', label: c.label }))),
    edges: edges.map((e) => ({ source: e.source, target: e.target, relation: e.relation, type: e.type, strength: e.strength || undefined })),
    metadata: {
      totalPosts: nodes.length,
      totalConcepts: conceptArray.length,
      totalEdges: edges.length,
      generatedAt: new Date().toISOString(),
      version: '2.0.0',
    },
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(graph, null, 2));
  console.log('✅ Knowledge Graph generated successfully!');
  console.log('   📄 Output: ' + OUTPUT_FILE);
  console.log('   📊 Statistics:');
  console.log('      - Posts: ' + nodes.length);
  console.log('      - Concepts: ' + conceptArray.length);
  console.log('      - Edges: ' + edges.length);
  return graph;
}

try {
  buildKnowledgeGraph();
} catch (error) {
  console.error('❌ Error building knowledge graph: ' + error.message);
  console.error(error.stack);
  process.exit(1);
}
