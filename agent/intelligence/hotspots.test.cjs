'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { computeHotspots } = require('./hotspots.cjs');

test('hotspots by churn+complexity+failure history ranked top-10', () => {
  const files = ['src/a.js', 'src/b.js', 'agent/x.cjs', 'contracts/y.sol', 'layouts/a.html', 'scripts/b.cjs', 'src/c.js', 'src/d.js', 'src/e.js', 'src/f.js', 'src/g.js', 'src/h.js'];
  const churn = Object.fromEntries(files.map((f, i) => [f, 10 - i + (i === 0 ? 20 : 0)]));
  const complexity = Object.fromEntries(files.map((f, i) => [f, i === 1 ? 100 : 5 + i]));
  const failures = { 'src/a.js': 5, 'src/b.js': 3 };
  const r = computeHotspots({ churn, complexity, failures, files });
  assert.ok(Array.isArray(r));
  assert.ok(r.length <= 10);
  assert.ok(r[0].score >= r[1].score, 'ranked descending');
  assert.ok(r[0].file === 'src/a.js' || r[0].file === 'src/b.js', 'high churn+failures top');
  assert.ok(r.every(h => typeof h.score === 'number'));
  assert.ok(r.every(h => h.factors && typeof h.factors.churn === 'number'));
});

test('hotspots integrates with semantic memory', () => {
  const files = ['src/a.js'];
  const semantic = { queryByTags: () => [{ tags: ['failure'], fact: 'src/a.js fails often', capability: 'implementer' }] };
  const r = computeHotspots({ churn: { 'src/a.js': 1 }, complexity: { 'src/a.js': 1 }, failures: {}, files, semantic });
  assert.ok(Array.isArray(r));
  assert.ok(r.length === 1);
});

test('hotspots returns evidence reasons', () => {
  const r = computeHotspots({ churn: { 'a.js': 10 }, complexity: { 'a.js': 5 }, failures: { 'a.js': 2 }, files: ['a.js'] });
  assert.ok(r[0].reasons.length > 0);
  assert.ok(r[0].reasons.some(s => typeof s === 'string'));
});

test('empty input returns empty', () => {
  const r = computeHotspots({ churn: {}, complexity: {}, failures: {}, files: [] });
  assert.equal(r.length, 0);
});
