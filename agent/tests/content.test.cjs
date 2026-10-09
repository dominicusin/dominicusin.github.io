'use strict';

/**
 * Content Agent Tests — M3-003
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { generateContent, generateSlug, generateFrontmatter } = require('../workers/content/content.cjs');

test('generateSlug creates URL-friendly slugs', () => {
  assert.equal(generateSlug('Hello World'), 'hello-world');
  assert.equal(generateSlug('Test!@#$%Title'), 'testtitle');
  assert.equal(generateSlug('Multiple   Spaces'), 'multiple-spaces');
});

test('generateFrontmatter produces valid YAML', () => {
  const fm = generateFrontmatter({
    title: 'Test Post',
    date: '2026-09-02',
    slug: 'test-post',
    keywords: ['test', 'demo'],
    tags: ['testing']
  });

  assert.ok(fm.includes('title: "Test Post"'));
  assert.ok(fm.includes('date: 2026-09-02'));
  assert.ok(fm.includes('slug: test-post'));
  assert.ok(fm.includes('tags: ["testing"]'));
});

test('generateFrontmatter keeps quotes, backslashes, and newlines inside YAML scalars', () => {
  const title = 'A "quoted" title\\with a newline\n draft: true';
  const fm = generateFrontmatter({
    title,
    date: '2026-09-02',
    slug: 'safe-title',
    keywords: ['quoted "keyword"', 'path\\segment'],
    tags: ['tag\\name']
  });

  assert.ok(fm.includes(`title: ${JSON.stringify(title)}`));
  assert.ok(fm.includes(`description: ${JSON.stringify(title)}`));
  assert.ok(fm.includes(`keywords: [${JSON.stringify('quoted "keyword"')}, ${JSON.stringify('path\\segment')}]`));
  assert.ok(fm.includes(`tags: [${JSON.stringify('tag\\name')}]`));
  assert.equal(fm.includes('\n draft: true'), false);
});

test('generateContent creates markdown with frontmatter', async () => {
  const result = await generateContent({
    topic: 'Test Topic',
    keywords: ['test', 'demo'],
    targetPath: 'content/blog/test.md'
  });

  assert.equal(result.success, true);
  assert.ok(result.content.includes('---'));
  assert.ok(result.content.includes('title: "Test Topic"'));
  assert.ok(result.metadata.wordCount > 0);
});

test('generateContent infers tags from topic', async () => {
  const result = await generateContent({
    topic: 'Hugo Performance Optimization',
    keywords: ['hugo', 'performance', 'css'],
    targetPath: 'content/blog/test.md'
  });

  assert.ok(result.metadata.tags.length > 0);
});
