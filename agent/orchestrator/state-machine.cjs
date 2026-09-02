'use strict';

/**
 * State Machine — M1-008
 * Deterministic task lifecycle transitions.
 */

const STATES = {
  PENDING: 'PENDING',
  READY: 'READY',
  CLAIMED: 'CLAIMED',
  WORKING: 'WORKING',
  VERIFYING: 'VERIFYING',
  REVIEW: 'REVIEW',
  DONE: 'DONE',
  FAILED: 'FAILED',
  BLOCKED: 'BLOCKED',
  ESCALATED: 'ESCALATED'
};

const TRANSITIONS = {
  PENDING: [STATES.READY, STATES.BLOCKED],
  READY: [STATES.CLAIMED, STATES.BLOCKED],
  CLAIMED: [STATES.WORKING, STATES.FAILED],
  WORKING: [STATES.VERIFYING, STATES.FAILED],
  VERIFYING: [STATES.REVIEW, STATES.FAILED],
  REVIEW: [STATES.DONE, STATES.FAILED],
  FAILED: [STATES.WORKING, STATES.ESCALATED],
  BLOCKED: [STATES.PENDING, STATES.READY],
  ESCALATED: []
};

function canTransition(from, to) {
  if (!TRANSITIONS[from]) return false;
  return TRANSITIONS[from].includes(to);
}

function transition(state, next) {
  if (!canTransition(state, next)) {
    throw new Error(`Invalid transition: ${state} -> ${next}`);
  }
  return next;
}

module.exports = { STATES, TRANSITIONS, canTransition, transition };
