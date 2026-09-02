'use strict';

/**
 * Policy Engine Tests — M1-005 TDD
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { PolicyEngine } = require('../policy/policy.cjs');

const engine = new PolicyEngine();

test('R1 isolated code is autonomous with CI gate', () => {
  const decision = engine.evaluateAction({
    risk: 'R1',
    action: 'modify',
    paths: ['agent/tests/example.test.cjs']
  });

  assert.equal(decision.allowed, true);
  assert.equal(decision.gate, 'ci');
});

test('R4 secrets require human approval', () => {
  const decision = engine.evaluateAction({
    risk: 'R4',
    action: 'modify',
    paths: ['production-secret']
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.gate, 'human');
});

test('R0 content is autonomous with no gate', () => {
  const decision = engine.evaluateAction({
    risk: 'R0',
    action: 'modify',
    paths: ['content/blog/post.md']
  });

  assert.equal(decision.allowed, true);
  assert.equal(decision.gate, 'none');
});

test('R2 architecture requires review gate', () => {
  const decision = engine.evaluateAction({
    risk: 'R2',
    action: 'modify',
    paths: ['layouts/_default/baseof.html']
  });

  assert.equal(decision.allowed, true);
  assert.equal(decision.gate, 'review');
});

test('unknown risk level is rejected', () => {
  const decision = engine.evaluateAction({
    risk: 'R99',
    action: 'modify',
    paths: []
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.gate, 'human');
});

test('path with secrets elevates risk', () => {
  const decision = engine.evaluateAction({
    risk: 'R1',
    action: 'modify',
    paths: ['src/credentials.json']
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.risk, 'R4');
});
