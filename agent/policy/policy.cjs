'use strict';

/**
 * Policy Engine — M1-004
 * Deterministic risk evaluation for agent actions.
 */

const RISK_POLICY = {
  R0: { allowed: true, gate: 'none', reasons: ['Documentation/content: full autonomous'] },
  R1: { allowed: true, gate: 'ci', reasons: ['Isolated code: autonomous + CI gate'] },
  R2: { allowed: true, gate: 'review', reasons: ['Architecture: autonomous + review required'] },
  R3: { allowed: true, gate: 'review', reasons: ['CI/deploy: strict gate, review required'] },
  R4: { allowed: false, gate: 'human', reasons: ['Secrets/production: human approval required'] }
};

const RISK_LEVELS = ['R0', 'R1', 'R2', 'R3', 'R4'];
const GATES = ['none', 'ci', 'review', 'human'];

class PolicyEngine {
  constructor(policy = RISK_POLICY) {
    this.policy = policy;
  }

  /**
   * Evaluate if an action is allowed under the policy.
   * @param {Object} params
   * @param {string} params.risk - R0..R4
   * @param {string} params.action - action type
   * @param {string[]} params.paths - affected file paths
   * @param {string} [params.actor] - who is performing the action
   * @returns {PolicyDecision}
   */
  evaluateAction({ risk, action, paths = [], actor }) {
    if (!RISK_LEVELS.includes(risk)) {
      return {
        allowed: false,
        risk: 'UNKNOWN',
        gate: 'human',
        reasons: [`Unknown risk level: ${risk}`]
      };
    }

    const rule = this.policy[risk];

    // Path-based risk elevation
    const elevatedRisk = this._checkPathElevation(paths, risk);
    const finalRule = elevatedRisk !== risk ? this.policy[elevatedRisk] : rule;

    return {
      allowed: finalRule.allowed,
      risk: elevatedRisk,
      gate: finalRule.gate,
      reasons: [
        ...finalRule.reasons,
        ...(elevatedRisk !== risk ? [`Path elevation: ${risk} → ${elevatedRisk}`] : [])
      ]
    };
  }

  /**
   * Check if paths require elevated risk level.
   */
  _checkPathElevation(paths, currentRisk) {
    const elevatedPaths = {
      'R4': ['secrets', 'credentials', '.env', 'private-key', 'production']
    };

    for (const [risk, patterns] of Object.entries(elevatedPaths)) {
      for (const path of paths) {
        for (const pattern of patterns) {
          if (path.toLowerCase().includes(pattern.toLowerCase())) {
            return risk;
          }
        }
      }
    }

    return currentRisk;
  }
}

module.exports = { PolicyEngine, RISK_POLICY };
