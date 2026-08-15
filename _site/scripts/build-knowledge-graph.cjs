#!/usr/bin/env node

/**
 * Knowledge Graph Generator
 * 
 * Builds a JSON-LD / RDF-compatible knowledge graph from post metadata
 * Outputs: assets/data/knowledge-graph.json
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const POSTS_DIR = path.join(__dirname, '..', '_posts');
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'knowledge-graph.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper: Extract frontmatter
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  
  try {
    return yaml.load(match[1]);
  } catch (e) {
    return null;
  }
}

// Main graph builder
function buildKnowledgeGraph() {
  console.log('🔍 Scanning posts for concepts...\n');
  
  if (!fs.existsSync(POSTS_DIR)) {
    console.error('❌ Posts directory not found');
    process.exit(1);
  }
  
  const files = fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md') || f.endsWith('.markdown'))
    .sort()
    .reverse();
  
  const concepts = new Map();
  const nodes = [];
  const edges = [];
  const postConcepts = new Map();
  
  files.forEach((file) => {
    const filePath = path.join(POSTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatter = extractFrontmatter(content);
    
    if (!frontmatter || !frontmatter.published || frontmatter.draft) {
      return;
    }
    
    const postId = file.replace(/\.(md|markdown)$/, '');
    const postUrl = frontmatter.permalink || ('/' + postId + '/');
    
    if (frontmatter.concepts && Array.isArray(frontmatter.concepts)) {
      postConcepts.set(postId, []);
      
      frontmatter.concepts.forEach((concept) => {
        const conceptId = concept.id;
        
        if (!concepts.has(conceptId)) {
          concepts.set(conceptId, {
            id: conceptId,
            label: concept.label,
            description: 'Concept "' + concept.label + '" referenced in dominicusin.github.io',
            type: 'Concept',
            occurrences: [],
            relations: []
          });
        }
        
        const conceptObj = concepts.get(conceptId);
        conceptObj.occurrences.push({
          postId: postId,
          postUrl: postUrl,
          postTitle: frontmatter.title,
          date: frontmatter.date,
          relation: concept.relation
        });
        
        postConcepts.get(postId).push(conceptId);
        
        edges.push({
          source: postId,
          target: conceptId,
          relation: concept.relation,
          type: 'references'
        });
        
        edges.push({
          source: conceptId,
          target: postId,
          relation: getReverseRelation(concept.relation),
          type: 'referenced_by'
        });
      });
    }
    
    nodes.push({
      id: postId,
      type: 'BlogPosting',
      url: postUrl,
      title: frontmatter.title,
      date: frontmatter.date,
      categories: frontmatter.categories || [],
      tags: frontmatter.tags || [],
      author: frontmatter.author,
      conceptCount: (postConcepts.get(postId) || []).length
    });
  });
  
  const conceptArray = Array.from(concepts.values());
  
  for (let i = 0; i < conceptArray.length; i++) {
    for (let j = i + 1; j < conceptArray.length; j++) {
      const conceptA = conceptArray[i];
      const conceptB = conceptArray[j];
      
      const commonPosts = conceptA.occurrences.filter(occA =>
        conceptB.occurrences.some(occB => occA.postId === occB.postId)
      );
      
      if (commonPosts.length > 0) {
        edges.push({
          source: conceptA.id,
          target: conceptB.id,
          relation: 'co_occurs_with',
          type: 'semantic_link',
          strength: commonPosts.length,
          posts: commonPosts.map(c => c.postId)
        });
        
        edges.push({
          source: conceptB.id,
          target: conceptA.id,
          relation: 'co_occurs_with',
          type: 'semantic_link',
          strength: commonPosts.length,
          posts: commonPosts.map(c => c.postId)
        });
      }
    }
  }
  
  const conceptsArray = Array.from(concepts.values());
  
  const knowledgeGraph = {
    "@context": {
      "@vocab": "https://schema.org/",
      "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
      "xsd": "http://www.w3.org/2001/XMLSchema#",
      "Concept": "skos:Concept",
      "label": "skos:prefLabel",
      "relation": "skos:broader",
      "occurrences": {
        "@id": "occurrence",
        "@container": "@set"
      }
    },
    "@graph": [
      {
        "@id": "https://dominicusin.github.io",
        "@type": "WebSite",
        name: "Dominicus Sin Blog",
        description: "Knowledge graph of concepts and articles",
        totalPosts: nodes.length,
        totalConcepts: conceptsArray.length,
        generatedAt: new Date().toISOString()
      }
    ].concat(
      nodes.map(node => ({
        "@id": "https://dominicusin.github.io" + node.url,
        "@type": node.type,
        headline: node.title,
        datePublished: node.date,
        articleSection: node.categories,
        keywords: node.tags,
        author: { "@type": "Person", "@id": "#/people/" + node.author },
        about: (postConcepts.get(node.id) || []).map(cid => ({ "@id": "#/concepts/" + cid }))
      }))
    ).concat(
      conceptsArray.map(concept => ({
        "@id": "#/concepts/" + concept.id,
        "@type": "Concept",
        prefLabel: concept.label,
        definition: concept.description,
        occurrence: concept.occurrences.map(occ => ({
          "@type": "Occurrence",
          inPost: { "@id": "https://dominicusin.github.io" + occ.postUrl },
          relationType: occ.relation
        }))
      }))
    ),
    nodes: nodes.map(n => ({ id: n.id, type: 'post', label: n.title, url: n.url }))
      .concat(conceptsArray.map(c => ({ id: c.id, type: 'concept', label: c.label }))),
    edges: edges.map(e => ({
      source: e.source,
      target: e.target,
      relation: e.relation,
      type: e.type,
      strength: e.strength || undefined
    })),
    metadata: {
      totalPosts: nodes.length,
      totalConcepts: conceptsArray.length,
      totalEdges: edges.length,
      generatedAt: new Date().toISOString(),
      version: '1.0.0'
    }
  };
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(knowledgeGraph, null, 2));
  
  console.log('✅ Knowledge Graph generated successfully!');
  console.log('   📄 Output: ' + OUTPUT_FILE);
  console.log('   📊 Statistics:');
  console.log('      - Posts: ' + nodes.length);
  console.log('      - Concepts: ' + conceptsArray.length);
  console.log('      - Edges: ' + edges.length);
  console.log('      - Density: ' + (edges.length / (nodes.length * conceptsArray.length || 1)).toFixed(4));
  
  return knowledgeGraph;
}

function getReverseRelation(relation) {
  const reverseMap = {
    'defines': 'is_defined_in',
    'references': 'is_referenced_by',
    'extends': 'is_extended_by',
    'critiques': 'is_critiqued_by',
    'implements': 'is_implemented_in'
  };
  return reverseMap[relation] || 'related_to';
}

try {
  buildKnowledgeGraph();
} catch (error) {
  console.error('❌ Error building knowledge graph: ' + error.message);
  console.error(error.stack);
  process.exit(1);
}
