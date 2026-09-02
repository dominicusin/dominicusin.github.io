'use strict';

/**
 * Knowledge Graph Agent — M3-004
 * Builds and queries the semantic layer.
 *
 * Repository
 * ├── File
 * ├── Module
 * ├── Function
 * ├── Type
 * ├── Post
 * ├── Project
 * ├── Gist
 * ├── Technology
 * ├── ADR
 * └── Task
 */

const fs = require('fs');
const path = require('path');

/**
 * Build knowledge graph from repository.
 */
async function buildGraph({ repository, posts, projects, gists }) {
  const nodes = [];
  const edges = [];

  // Add post nodes
  for (const post of posts) {
    nodes.push({
      id: `post-${post.slug}`,
      type: 'post',
      title: post.title,
      path: post.path
    });

    // Connect posts by shared tags
    for (const other of posts) {
      if (post === other) continue;
      const shared = post.tags?.filter(t => other.tags?.includes(t)) || [];
      if (shared.length > 0) {
        edges.push({
          from: `post-${post.slug}`,
          to: `post-${other.slug}`,
          type: 'related',
          weight: shared.length
        });
      }
    }
  }

  // Add project nodes
  for (const project of projects || []) {
    nodes.push({
      id: `project-${project.name}`,
      type: 'project',
      title: project.name,
      path: project.path
    });
  }

  // Add gist nodes
  for (const gist of gists || []) {
    nodes.push({
      id: `gist-${gist.id}`,
      type: 'gist',
      title: gist.description,
      path: gist.path
    });
  }

  return { nodes, edges };
}

/**
 * Query the knowledge graph.
 */
function queryGraph(graph, { type, tag, limit = 10 }) {
  let results = graph.nodes;

  if (type) {
    results = results.filter(n => n.type === type);
  }

  if (tag) {
    results = results.filter(n =>
      n.tags?.includes(tag) || n.title?.toLowerCase().includes(tag.toLowerCase())
    );
  }

  return results.slice(0, limit);
}

/**
 * Export graph to JSON-LD.
 */
function toJSONLD(graph) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Graph',
    nodes: graph.nodes.map(n => ({
      '@id': n.id,
      '@type': n.type,
      name: n.title
    })),
    edges: graph.edges.map(e => ({
      '@type': 'Relationship',
      source: e.from,
      target: e.to,
      relationshipType: e.type
    }))
  };
}

module.exports = { buildGraph, queryGraph, toJSONLD };
