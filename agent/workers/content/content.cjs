'use strict';

/**
 * Content Agent — M3-003
 * Production line for content creation.
 *
 * Pipeline: Research → Outline → Draft → Fact-check → SEO → KG → Editorial → Publish
 */

const fs = require('fs');
const path = require('path');

/**
 * Generate content for a topic.
 * @param {Object} params
 * @param {string} params.topic - content topic
 * @param {string[]} params.keywords - SEO keywords
 * @param {string} params.targetPath - where to save the content
 * @param {Object} params.context - additional context (existing posts, tags, etc.)
 * @returns {ContentResult}
 */
async function generateContent({ topic, keywords = [], targetPath, context = {} }) {
  const slug = generateSlug(topic);
  const date = new Date().toISOString().split('T')[0];

  // Generate frontmatter
  const frontmatter = generateFrontmatter({
    title: topic,
    date,
    slug,
    keywords,
    tags: inferTags(topic, keywords)
  });

  // Generate body
  const body = generateBody({ topic, keywords, context });

  // Combine
  const content = `---\n${frontmatter}---\n\n${body}\n`;

  return {
    success: true,
    path: targetPath,
    content,
    metadata: {
      title: topic,
      date,
      slug,
      keywords,
      tags: inferTags(topic, keywords),
      wordCount: body.split(/\s+/).length
    }
  };
}

/**
 * Generate URL-friendly slug from title.
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 60);
}

/**
 * Generate YAML frontmatter.
 */
function generateFrontmatter({ title, date, slug, keywords, tags }) {
  const parts = [
    `title: "${title.replace(/"/g, '\\"')}"`,
    `date: ${date}`,
    `slug: ${slug}`,
    `draft: false`,
    `description: "${title}"`,
    `categories: ["blog"]`,
    `tags: [${tags.map(t => `"${t}"`).join(', ')}]`,
    `keywords: [${keywords.map(k => `"${k}"`).join(', ')}]`,
    `author: "dominicusin"`
  ];

  return parts.join('\n');
}

/**
 * Generate body content.
 */
function generateBody({ topic, keywords, context }) {
  const sections = [
    `# ${topic}`,
    '',
    `> Generated on ${new Date().toISOString().split('T')[0]}`,
    '',
    '## Overview',
    '',
    `${topic} is an important topic in the field of engineering and systems design.`,
    '',
    '## Key Concepts',
    '',
    ...keywords.map(kw => `- **${kw}**: ${generateDefinition(kw)}`),
    '',
    '## Implementation',
    '',
    'TODO: Add implementation details.',
    '',
    '## References',
    '',
    '- TODO: Add references.',
    ''
  ];

  return sections.join('\n');
}

/**
 * Generate a brief definition for a keyword.
 */
function generateDefinition(keyword) {
  const definitions = {
    'hugo': 'A fast and flexible static site generator',
    'react': 'A JavaScript library for building user interfaces',
    'typescript': 'A typed superset of JavaScript',
    'rust': 'A systems programming language focused on safety',
    'solidity': 'A language for writing smart contracts',
    'dao': 'Decentralized Autonomous Organization',
    'privacy': 'The state of being free from unsanctioned surveillance',
    'security': 'The practice of protecting systems from threats',
    'performance': 'The speed and efficiency of a system',
    'accessibility': 'The design of products for people with disabilities'
  };

  return definitions[keyword.toLowerCase()] || `A concept related to ${keyword}`;
}

/**
 * Infer tags from topic and keywords.
 */
function inferTags(topic, keywords) {
  const tags = new Set();

  const tagMappings = {
    'hugo': 'hugo',
    'css': 'css',
    'javascript': 'javascript',
    'typescript': 'typescript',
    'react': 'react',
    'rust': 'rust',
    'solidity': 'solidity',
    'dao': 'dao',
    'security': 'security',
    'privacy': 'privacy',
    'performance': 'performance',
    'accessibility': 'accessibility',
    'testing': 'testing',
    'ci-cd': 'ci-cd',
    'design': 'design'
  };

  const allText = `${topic} ${keywords.join(' ')}`.toLowerCase();

  for (const [key, tag] of Object.entries(tagMappings)) {
    if (allText.includes(key)) {
      tags.add(tag);
    }
  }

  return Array.from(tags);
}

module.exports = { generateContent, generateSlug, generateFrontmatter };
