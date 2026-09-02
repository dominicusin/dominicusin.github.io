'use strict';

/**
 * Security Agent — scans repository security posture.
 *
 * @param {Object} params
 * @param {Object} params.repository - Repository metadata (name, private, defaultBranch)
 * @param {Object} params.dependencies - Dependency map (name -> version)
 * @param {Object[]} params.workflows - GitHub Actions workflow descriptors
 * @returns {Promise<SecurityResult>}
 */

const SEVERITY_RANK = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const DANGEROUS_SHELL_PATTERNS = [
  /\bcurl\s+.*\|\s*(?:sh|bash|zsh)\b/i,
  /\bwget\s+.*\|\s*(?:sh|bash|zsh)\b/i,
  /\beval\s*\(/i,
  /\bexec\s*\(/i,
  /\bos\.system\s*\(/i,
  /\bsubprocess\.call\s*\(.*shell\s*=\s*True/i,
  /\brm\s+-rf\s+\//i,
  /\bsudo\s+/i,
  /\bchmod\s+777\b/i,
  /\bnc\s+-[a-z]*\d+/i,
  /\bpython\s+-c\s+["'].*?(?:import\s+os|subprocess|socket)/i,
];

const SUSPICIOUS_TOKEN_PATTERNS = [
  /\b(?:AKIA[0-9A-Z]{16})\b/,
  /\b(?:ghp_[a-zA-Z0-9]{36})\b/,
  /\b(?:gho_[a-zA-Z0-9]{36})\b/,
  /\b(?:xoxb-[a-zA-Z0-9-]{10,})\b/,
  /\b(?:sk-[a-zA-Z0-9]{48})\b/,
  /\b(?:AIza[0-9A-Za-z_-]{35})\b/,
  /\b(?:-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----)/,
];

const KNOWN_VULNERABLE_PACKAGES = [
  'event-stream@3.3.6',
  'flatmap-stream@0.1.1',
  'eslint-scope@3.7.2',
  'lodash@<4.17.19',
];

const KNOWN_VULNERABLE_NAMES = [
  'event-stream',
  'flatmap-stream',
];

function checkDependenciesAudit(dependencies) {
  const findings = [];
  const recommendations = [];
  let maxSeverity = 'none';

  if (!dependencies || Object.keys(dependencies).length === 0) {
    return { findings, recommendations, severity: 'none' };
  }

  for (const [name, version] of Object.entries(dependencies)) {
    if (!version || version === 'latest' || version === '*') {
      findings.push(`Dependency "${name}" uses unpinned version "${version}"`);
      maxSeverity = 'medium';
      recommendations.push(`Pin "${name}" to a specific version or commit hash`);
    }

    if (KNOWN_VULNERABLE_NAMES.includes(name)) {
      findings.push(`Dependency "${name}" has known supply-chain compromise history`);
      maxSeverity = 'critical';
      recommendations.push(`Remove "${name}" or verify it is not a compromised version`);
    }

    const pkgId = `${name}@${version}`;
    if (KNOWN_VULNERABLE_PACKAGES.includes(pkgId)) {
      findings.push(`Dependency "${pkgId}" is a known compromised package`);
      maxSeverity = 'critical';
      recommendations.push(`Remove "${pkgId}" immediately — it has been compromised`);
    }
  }

  return { findings, recommendations, severity: maxSeverity };
}

function checkWorkflowPermissions(workflows) {
  const findings = [];
  const recommendations = [];
  let maxSeverity = 'none';

  if (!workflows || workflows.length === 0) {
    return { findings, recommendations, severity: 'none' };
  }

  for (const wf of workflows) {
    const name = wf.name || wf.filename || 'unknown';

    if (wf.permissions === 'write-all') {
      findings.push(`Workflow "${name}" uses write-all permissions`);
      maxSeverity = 'high';
      recommendations.push(`Restrict "${name}" to least-privilege permissions`);
    }

    if (wf.triggers && wf.triggers.includes('pull_request_target')) {
      findings.push(`Workflow "${name}" uses pull_request_target — supply-chain risk`);
      maxSeverity = pickHigher(maxSeverity, 'high');
      recommendations.push(`Audit "${name}" for pull_request_target abuse vectors`);
    }

    if (wf.triggers && wf.triggers.includes('workflow_dispatch') && wf.permissions === 'write-all') {
      findings.push(`Workflow "${name}" has workflow_dispatch + write-all — high blast radius`);
      maxSeverity = pickHigher(maxSeverity, 'high');
    }

    if (wf.envSecrets && wf.envSecrets.length > 0) {
      findings.push(`Workflow "${name}" exposes ${wf.envSecrets.length} secrets to untrusted input`);
      maxSeverity = pickHigher(maxSeverity, 'medium');
      recommendations.push(`Review secret usage in "${name}" for injection vectors`);
    }
  }

  return { findings, recommendations, severity: maxSeverity };
}

function checkTokenExposure(workflows) {
  const findings = [];
  const recommendations = [];
  let maxSeverity = 'none';

  if (!workflows || workflows.length === 0) {
    return { findings, recommendations, severity: 'none' };
  }

  for (const wf of workflows) {
    const name = wf.name || wf.filename || 'unknown';
    const content = wf.content || '';

    for (const pattern of SUSPICIOUS_TOKEN_PATTERNS) {
      if (pattern.test(content)) {
        findings.push(`Workflow "${name}" may contain a hardcoded secret/token`);
        maxSeverity = 'critical';
        recommendations.push(`Remove hardcoded secrets from "${name}" — use GitHub Secrets`);
      }
    }

    if (/\$\{\{\s*github\.token\s*\}\}/i.test(content) && /pull_request_target/.test(content)) {
      findings.push(`Workflow "${name}" uses github.token in pull_request_target context`);
      maxSeverity = pickHigher(maxSeverity, 'high');
      recommendations.push(`Restrict github.token usage in "${name}" for pull_request_target`);
    }
  }

  return { findings, recommendations, severity: maxSeverity };
}

function checkDangerousShellCommands(workflows) {
  const findings = [];
  const recommendations = [];
  let maxSeverity = 'none';

  if (!workflows || workflows.length === 0) {
    return { findings, recommendations, severity: 'none' };
  }

  for (const wf of workflows) {
    const name = wf.name || wf.filename || 'unknown';
    const content = wf.content || '';

    for (const pattern of DANGEROUS_SHELL_PATTERNS) {
      if (pattern.test(content)) {
        findings.push(`Workflow "${name}" contains dangerous shell command pattern: ${pattern.source}`);
        maxSeverity = pickHigher(maxSeverity, 'high');
        recommendations.push(`Review shell usage in "${name}" — avoid eval/exec/curl-to-shell`);
      }
    }

    if (/::set-state-name|::set-output/i.test(content)) {
      findings.push(`Workflow "${name}" uses deprecated GitHub command (set-output/set-state-name)`);
      maxSeverity = pickHigher(maxSeverity, 'low');
      recommendations.push(`Migrate "${name}" to GITHUB_OUTPUT/GITHUB_STATE env files`);
    }
  }

  return { findings, recommendations, severity: maxSeverity };
}

function checkSupplyChainRisks(workflows, dependencies) {
  const findings = [];
  const recommendations = [];
  let maxSeverity = 'none';

  if (workflows) {
    for (const wf of workflows) {
      const name = wf.name || wf.filename || 'unknown';
      const content = wf.content || '';

      if (/actions\/checkout@(?:v1|v2)(?!\.)/i.test(content)) {
        findings.push(`Workflow "${name}" uses outdated checkout action (v1/v2)`);
        maxSeverity = pickHigher(maxSeverity, 'medium');
        recommendations.push(`Upgrade "${name}" to actions/checkout@v4`);
      }

      if (/npm\s+install(?!\s+--ignore-scripts)/i.test(content) && /--ignore-scripts/.test(content) === false) {
        findings.push(`Workflow "${name}" runs npm install without --ignore-scripts`);
        maxSeverity = pickHigher(maxSeverity, 'low');
        recommendations.push(`Consider using --ignore-scripts in "${name}" to prevent postinstall attacks`);
      }
    }
  }

  if (dependencies) {
    const depCount = Object.keys(dependencies).length;
    if (depCount > 100) {
      findings.push(`High dependency count (${depCount}) increases supply-chain attack surface`);
      maxSeverity = pickHigher(maxSeverity, 'low');
      recommendations.push(`Audit and prune unused dependencies regularly`);
    }
  }

  return { findings, recommendations, severity: maxSeverity };
}

function pickHigher(a, b) {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

async function scanSecurity({ repository, dependencies, workflows }) {
  const allFindings = [];
  const allRecommendations = [];
  let overallSeverity = 'none';

  const checks = [
    checkDependenciesAudit(dependencies),
    checkWorkflowPermissions(workflows),
    checkTokenExposure(workflows),
    checkDangerousShellCommands(workflows),
    checkSupplyChainRisks(workflows, dependencies),
  ];

  for (const result of checks) {
    allFindings.push(...result.findings);
    allRecommendations.push(...result.recommendations);
    if (SEVERITY_RANK[result.severity] > SEVERITY_RANK[overallSeverity]) {
      overallSeverity = result.severity;
    }
  }

  const passed = overallSeverity === 'none' || overallSeverity === 'low';

  return {
    passed,
    findings: allFindings,
    severity: overallSeverity,
    recommendations: allRecommendations,
  };
}

module.exports = { scanSecurity };