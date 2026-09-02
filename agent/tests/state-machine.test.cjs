'use strict';

/**
 * State Machine Tests — M1-009 TDD
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { STATES, canTransition, transition } = require('../orchestrator/state-machine.cjs');

test('READY can transition to CLAIMED', () => {
  assert.equal(canTransition('READY', 'CLAIMED'), true);
});

test('DONE cannot transition back to WORKING', () => {
  assert.equal(canTransition('DONE', 'WORKING'), false);
});

test('FAILED can retry into WORKING', () => {
  assert.equal(canTransition('FAILED', 'WORKING'), true);
});

test('FAILED can escalate', () => {
  assert.equal(canTransition('FAILED', 'ESCALATED'), true);
});

test('PENDING can become READY', () => {
  assert.equal(canTransition('PENDING', 'READY'), true);
});

test('transition returns new state', () => {
  assert.equal(transition('READY', 'CLAIMED'), 'CLAIMED');
});

test('transition throws on invalid transition', () => {
  assert.throws(() => transition('DONE', 'WORKING'));
});
