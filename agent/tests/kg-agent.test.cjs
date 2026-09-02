'use strict';

/**
 * Knowledge Graph Agent Tests — M3-004
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { buildGraph, queryGraph, toJSONLD } = require('../workers/knowledge-graph/kg-agent.cjs');

test('buildGraph creates nodes from posts', async () => {
  const posts = [
    { slug: 'post-1', title: 'First Post', tags: ['hugo', 'css'] },
    { slug: 'post-2', title: 'Second Post', tags: ['hugo', 'javascript'] }
  ];

  const graph = await buildGraph({ repository: '.', posts });

  assert.equal(graph.nodes.length, 2);
  assert.ok(graph.nodes.some(n => n.id === 'post-post-1'));
  assert.ok(graph.nodes.some(n => n.id === 'post-post-2'));
});

test('buildGraph creates edges for related posts', async () => {
  const posts = [
    { slug: 'post-1', title: 'First', tags: ['hugo'] },
    { slug: 'post-2', title: 'Second', tags: ['hugo'] },
    { slug: 'post-3', title: 'Third', tags: ['rust'] }
  ];

  const graph = await buildGraph({ repository: '.', posts });

  // post-1 and post-2 share 'hugo' tag
  const relatedEdge = graph.edges.find(e => e.type === 'related');
  assert.ok(relatedEdge);
});

test('queryGraph filters by type', async () => {
  const posts = [{ slug: 'post-1', title: 'Post', tags: [] }];
  const projects = [{ name: 'proj-1', path: 'proj1' }];

  const graph = await buildGraph({ repository: '.', posts, projects });
  const results = queryGraph(graph, { type: 'project' });

  assert.equal(results.length, 1);
  assert.equal(results[0].type, 'project');
});

test('toJSONLD produces valid structure', async () => {
  const posts = [{ slug: 'post-1', title: 'Post', tags: [] }];
  const graph = await buildGraph({ repository: '.', posts });
  const jsonld = toJSONLD(graph);

  assert.equal(jsonld['@context'], 'https://schema.org');
  assert.ok(Array.isArray(jsonld.nodes));
  assert.ok(Array.isArray(jsonld.edges));
});
