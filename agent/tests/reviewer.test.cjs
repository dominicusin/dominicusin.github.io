'use strict';

/**
 * Review Agent Tests — M2-003
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { reviewChanges } = require('../workers/reviewer/reviewer.cjs');

test('should detect API key in diff', async () => {
  const diff = `
--- a/config.js
+++ b/config.js
@@ -1,3 +1,3 @@
-const apiKey = "old_key";
+const apiKey = "sk-1234567890abcdef";
`;
  const result = await reviewChanges({ task: 'Update config', diff });
  assert.equal(result.approved, false);
  assert.equal(result.severity, 'high');
});

test('should approve diff without secrets for content changes', async () => {
  const diff = `
--- a/content/blog/post.md
+++ b/content/blog/post.md
@@ -1,3 +1,3 @@
 ---
-title: Old Title
+title: New Title
 ---
`;
  const result = await reviewChanges({ task: 'Update blog post', diff });
  assert.equal(result.approved, true);
  assert.equal(result.severity, 'none');
});

test('should detect unclosed brace', async () => {
  const diff = `
--- a/utils.js
+++ b/utils.js
@@ -1,5 +1,5 @@
 function helper() {
-  if (true) {
+  if (true) {
     return 1;
-  }
+
 }
`;
  const result = await reviewChanges({ task: 'Update utils', diff });
  assert.equal(result.approved, false);
});

test('should approve content changes with correct syntax', async () => {
  const diff = `
--- a/content/docs.md
+++ b/content/docs.md
@@ -1,3 +1,3 @@
 # Title

-Old content
+New content
`;
  const result = await reviewChanges({ task: 'Update docs', diff });
  assert.equal(result.approved, true);
  assert.equal(result.severity, 'none');
});

test('should reject code changes without tests', async () => {
  const diff = `
--- /dev/null
+++ b/src/feature.js
@@ -0,0 +1,5 @@
+export function newFeature() {
+  console.log("New feature");
+  return true;
+}
`;
  const result = await reviewChanges({ task: 'Add new feature', diff });
  assert.equal(result.approved, false);
  assert.ok(result.reasons.some(r => r.toLowerCase().includes('test')));
});

test('should approve code changes with new test file', async () => {
  const diff = `
--- /dev/null
+++ b/src/feature.js
@@ -0,0 +1,5 @@
+export function newFeature() {
+  console.log("New feature");
+  return true;
+}
--- /dev/null
+++ b/src/feature.test.js
@@ -0,0 +1,5 @@
+import { newFeature } from './feature.js';
+test('newFeature works', () => {
+  expect(newFeature()).toBe(true);
+});
`;
  const result = await reviewChanges({ task: 'Add new feature with tests', diff });
  assert.equal(result.approved, true);
});

test('should flag small code changes without tests', async () => {
  const diff = `
--- a/src/feature.js
+++ b/src/feature.js
@@ -1,3 +1,3 @@
-export function feature() {
-  return 1;
+export function feature() {
+  return 2;
 }
`;
  const result = await reviewChanges({ task: 'Small fix', diff });
  // Should be flagged because there's no test file for the code change
  assert.equal(result.approved, false);
  assert.equal(result.severity, 'medium');
});

test('should handle empty diff', async () => {
  const result = await reviewChanges({ task: 'Empty', diff: '' });
  assert.equal(result.approved, true);
  assert.equal(result.severity, 'none');
});

test('should handle null diff', async () => {
  const result = await reviewChanges({ task: 'Null', diff: null });
  assert.equal(result.approved, true);
});

test('should handle undefined diff', async () => {
  const result = await reviewChanges({ task: 'Undefined' });
  assert.equal(result.approved, true);
});

test('should return valid ReviewResult structure', async () => {
  const result = await reviewChanges({ task: 'Test', diff: '' });
  assert.ok('approved' in result);
  assert.ok('reasons' in result);
  assert.ok('severity' in result);
  assert.ok('suggestions' in result);
  assert.ok(Array.isArray(result.reasons));
  assert.ok(Array.isArray(result.suggestions));
  assert.ok(['none', 'low', 'medium', 'high'].includes(result.severity));
});
