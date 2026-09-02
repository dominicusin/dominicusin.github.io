'use strict';

/**
 * Researcher Agent Tests — M3-002
 *
 * TDD: RED → GREEN
 * Deterministic researcher that scans local documentation,
 * checks GitHub issues/PRs, extracts code patterns, and identifies dependencies.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

let research;
try {
  ({ research } = require('../workers/researcher/researcher.cjs'));
} catch (e) {
  // Expected in RED phase
}

// ============================================================================
// Basic Interface Tests
// ============================================================================

test('research function exists and is callable', () => {
  assert.ok(typeof research === 'function', 'research should be a function');
});

test('research returns ResearchResult shape with all required fields', async () => {
  const result = await research({
    topic: 'Hugo',
    sources: ['docs'],
    maxResults: 5
  });

  assert.ok(Array.isArray(result.findings), 'findings should be an array');
  assert.ok(Array.isArray(result.sources), 'sources should be an array');
  assert.ok(['low', 'medium', 'high'].includes(result.confidence), 'confidence should be low/medium/high');
  assert.ok(Array.isArray(result.hypotheses), 'hypotheses should be an array');
});

// ============================================================================
// Source Selection Tests
// ============================================================================

test('research respects sources parameter - docs only', async () => {
  const result = await research({
    topic: 'architecture',
    sources: ['docs'],
    maxResults: 10
  });

  // All sources should be from docs/
  assert.ok(result.sources.every(s => s.startsWith('docs/') || s.startsWith('agent/')),
    'should only return docs sources when sources=["docs"]');
});

test('research respects sources parameter - code only', async () => {
  const result = await research({
    topic: 'worker',
    sources: ['code'],
    maxResults: 10
  });

  // Should find code-related sources
  assert.ok(result.sources.some(s => s.includes('agent/') || s.includes('src/') || s.includes('workers/')),
    'should return code sources when sources=["code"]');
});

test('research respects sources parameter - issues only', async () => {
  const result = await research({
    topic: 'bug',
    sources: ['issues'],
    maxResults: 5
  });

  // Should not include docs or code sources
  assert.ok(result.sources.every(s => !s.startsWith('docs/') && !s.includes('agent/workers/')),
    'should only return issue sources when sources=["issues"]');
});

// ============================================================================
// Local Documentation Scanning Tests
// ============================================================================

test('research scans local documentation for matching topics', async () => {
  const result = await research({
    topic: 'architecture',
    sources: ['docs'],
    maxResults: 10
  });

  assert.ok(result.findings.length > 0, 'should find documentation about architecture');
  assert.ok(result.sources.length > 0, 'should list source files');
});

test('research extracts relevant snippets from docs', async () => {
  const result = await research({
    topic: 'performance',
    sources: ['docs'],
    maxResults: 5
  });

  // Findings should contain actual content, not just filenames
  const hasDetailedFinding = result.findings.some(f => f.length > 50);
  assert.ok(hasDetailedFinding || result.findings.length === 0,
    'findings should contain detailed snippets or be empty if no match');
});

// ============================================================================
// Code Pattern Extraction Tests
// ============================================================================

test('research extracts code patterns from agent workers', async () => {
  const result = await research({
    topic: 'worker',
    sources: ['code'],
    maxResults: 10
  });

  // Should find code patterns in agent/workers/
  assert.ok(result.findings.some(f =>
    f.toLowerCase().includes('worker') ||
    f.toLowerCase().includes('pattern') ||
    f.toLowerCase().includes('module.exports') ||
    f.toLowerCase().includes('function ')
  ), 'should find worker-related code patterns');
});

test('research identifies module exports and interfaces', async () => {
  const result = await research({
    topic: 'research',
    sources: ['code'],
    maxResults: 10
  });

  // Should find the researcher module itself or similar patterns
  assert.ok(result.findings.length > 0, 'should find code related to research topic');
});

// ============================================================================
// Dependency Identification Tests
// ============================================================================

test('research identifies dependencies from package.json', async () => {
  const result = await research({
    topic: 'dependencies',
    sources: ['code'],
    maxResults: 10
  });

  // Should identify dependencies from package.json
  assert.ok(result.findings.length > 0, 'should identify dependencies');
  assert.ok(result.findings.some(f =>
    f.includes('require(') || f.includes('import ') || f.includes('dependencies')
  ), 'should find dependency-related patterns');
});

test('research identifies require/import statements', async () => {
  const result = await research({
    topic: 'fs',
    sources: ['code'],
    maxResults: 10
  });

  // Should find files that use fs module
  assert.ok(result.findings.length > 0, 'should find files using fs module');
});

// ============================================================================
// GitHub Integration Tests
// ============================================================================

test('research checks GitHub issues when requested', async () => {
  const result = await research({
    topic: 'bug',
    sources: ['issues'],
    maxResults: 5
  });

  // Should attempt to check GitHub (may be empty if no access, but should not throw)
  assert.ok(Array.isArray(result.findings), 'should return findings array');
  assert.ok(Array.isArray(result.sources), 'should return sources array');
});

test('research checks GitHub PRs when requested', async () => {
  const result = await research({
    topic: 'feature',
    sources: ['pulls'],
    maxResults: 5
  });

  // Should attempt to check GitHub PRs
  assert.ok(Array.isArray(result.findings), 'should return findings array');
  assert.ok(Array.isArray(result.sources), 'should return sources array');
});

// ============================================================================
// Hypothesis Generation Tests
// ============================================================================

test('research generates hypotheses based on findings', async () => {
  const result = await research({
    topic: 'performance',
    sources: ['docs', 'code'],
    maxResults: 5
  });

  assert.ok(result.hypotheses.length > 0, 'should generate hypotheses');
});

test('hypotheses reflect the quantity of evidence', async () => {
  const resultRich = await research({
    topic: 'architecture',
    sources: ['docs', 'code'],
    maxResults: 20
  });

  const resultPoor = await research({
    topic: 'xyznonexistent12345',
    sources: ['docs'],
    maxResults: 5
  });

  // Rich findings should produce more or equal hypotheses
  assert.ok(resultRich.hypotheses.length >= resultPoor.hypotheses.length,
    'more evidence should produce more hypotheses');
});

// ============================================================================
// Confidence Scoring Tests
// ============================================================================

test('research assigns confidence based on evidence quantity', async () => {
  const resultDocs = await research({
    topic: 'architecture',
    sources: ['docs'],
    maxResults: 10
  });

  const resultAll = await research({
    topic: 'architecture',
    sources: ['docs', 'code', 'issues'],
    maxResults: 10
  });

  const confidenceLevel = (c) => ({ 'low': 1, 'medium': 2, 'high': 3 }[c]);
  assert.ok(confidenceLevel(resultAll.confidence) >= confidenceLevel(resultDocs.confidence),
    'more sources should lead to higher or equal confidence');
});

test('research returns low confidence for unknown topics', async () => {
  const result = await research({
    topic: 'xyznonexistent12345',
    sources: ['docs'],
    maxResults: 5
  });

  assert.equal(result.confidence, 'low', 'should have low confidence for unknown topic');
});

test('research returns high confidence for well-documented topics', async () => {
  const result = await research({
    topic: 'hugo architecture performance',
    sources: ['docs', 'code'],
    maxResults: 20
  });

  // With many matching docs and code, should be at least medium
  const confidenceLevel = (c) => ({ 'low': 1, 'medium': 2, 'high': 3 }[c]);
  assert.ok(confidenceLevel(result.confidence) >= 2,
    'should have at least medium confidence for well-documented topics');
});

// ============================================================================
// maxResults Tests
// ============================================================================

test('research respects maxResults parameter', async () => {
  const result = await research({
    topic: 'test',
    sources: ['docs'],
    maxResults: 3
  });

  assert.ok(result.findings.length <= 3, 'should not exceed maxResults');
});

test('research respects maxResults across multiple sources', async () => {
  const result = await research({
    topic: 'architecture',
    sources: ['docs', 'code'],
    maxResults: 5
  });

  assert.ok(result.findings.length <= 5, 'should not exceed maxResults across all sources');
});

// ============================================================================
// Edge Case Tests
// ============================================================================

test('research handles empty sources array', async () => {
  const result = await research({
    topic: 'test',
    sources: [],
    maxResults: 5
  });

  assert.ok(Array.isArray(result.findings), 'should return findings array');
  assert.ok(Array.isArray(result.sources), 'should return sources array');
});

test('research handles topic with special characters', async () => {
  const result = await research({
    topic: 'C++ performance',
    sources: ['docs'],
    maxResults: 5
  });

  assert.ok(Array.isArray(result.findings), 'should handle special characters in topic');
});

test('research handles very long topic strings', async () => {
  const result = await research({
    topic: 'a'.repeat(200),
    sources: ['docs'],
    maxResults: 5
  });

  assert.ok(Array.isArray(result.findings), 'should handle long topic strings');
});

// ============================================================================
// Integration Tests
// ============================================================================

test('research works with all sources combined', async () => {
  const result = await research({
    topic: 'agent',
    sources: ['docs', 'code', 'issues', 'pulls'],
    maxResults: 20
  });

  assert.ok(Array.isArray(result.findings), 'should return findings');
  assert.ok(Array.isArray(result.sources), 'should return sources');
  assert.ok(result.findings.length <= 20, 'should respect maxResults');
  assert.ok(['low', 'medium', 'high'].includes(result.confidence), 'should have valid confidence');
});

test('research findings contain actionable information', async () => {
  const result = await research({
    topic: 'implementer worker',
    sources: ['code'],
    maxResults: 10
  });

  if (result.findings.length > 0) {
    // At least one finding should be descriptive
    const hasDescriptive = result.findings.some(f => f.split(/\s+/).length > 3);
    assert.ok(hasDescriptive, 'findings should contain descriptive information');
  }
});