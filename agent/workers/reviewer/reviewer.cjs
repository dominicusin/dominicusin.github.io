'use strict';

/**
 * Review Agent — M2-003
 * Adversarial reviewer that tries to prove a change should NOT be accepted.
 *
 * Checks:
 * - Secrets in the diff (API keys, tokens, passwords)
 * - Syntax errors in code changes
 * - Presence of tests for code changes
 * - Minimality of the change
 */

// Patterns for common secrets
const SECRET_PATTERNS = [
  { pattern: /(api[_-]?key|apikey)\s*[:=]\s*["']?[A-Za-z0-9_\-]{16,}["']?/i, description: 'Potential API key' },
  { pattern: /(secret[_-]?key|secretkey)\s*[:=]\s*["']?[A-Za-z0-9_\-]{16,}["']?/i, description: 'Potential secret key' },
  { pattern: /(access[_-]?token|accesstoken)\s*[:=]\s*["']?[A-Za-z0-9_\-]{16,}["']?/i, description: 'Potential access token' },
  { pattern: /(private[_-]?key|privatekey)\s*[:=]\s*["']?[A-Za-z0-9_\-]{16,}["']?/i, description: 'Potential private key' },
  { pattern: /(password|passwd)\s*[:=]\s*["'][^"']{6,}["']/i, description: 'Potential password' },
  { pattern: /(token|auth)\s*[:=]\s*["']?[A-Za-z0-9_\-]{20,}["']?/i, description: 'Potential auth token' },
  { pattern: /(sk-[A-Za-z0-9]{20,})/i, description: 'Potential API key prefix' },
  { pattern: /(ghp_[A-Za-z0-9]{36,})/i, description: 'GitHub personal access token' },
  { pattern: /(gho_[A-Za-z0-9]{36,})/i, description: 'GitHub OAuth token' },
  { pattern: /(ghs_[A-Za-z0-9]{36,})/i, description: 'GitHub server-to-server token' },
  { pattern: /(xox[pboa]-[A-Za-z0-9\-]{10,})/i, description: 'Slack token' },
  { pattern: /(https?:\/\/)([^:\s]+):([^@\s]+)@/i, description: 'URL with embedded credentials' },
  { pattern: /(Bearer\s+[A-Za-z0-9_\-\.]{20,})/i, description: 'Bearer token in code' },
];

// File extensions that suggest code changes (should have tests)
const CODE_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.py', '.rb', '.go', '.rs', '.java', '.c', '.cpp', '.h',
  '.sol', '.vy',
];

// File extensions that suggest test files
const TEST_EXTENSIONS = [
  '.test.', '.spec.', '_test.', '_spec.',
];

/**
 * Check if the diff contains any secrets
 */
function checkSecrets(diff) {
  const findings = [];
  if (!diff) return findings;

  for (const { pattern, description } of SECRET_PATTERNS) {
    const match = diff.match(pattern);
    if (match) {
      findings.push(`${description}: ${match[0].substring(0, 50)}...`);
    }
  }
  return findings;
}

/**
 * Check if the diff contains syntax errors
 */
function checkSyntax(diff) {
  const findings = [];
  if (!diff) return findings;

  // Extract code changes (lines starting with +)
  const addedLines = diff
    .split('\n')
    .filter(line => line.startsWith('+') && !line.startsWith('+++'))
    .map(line => line.substring(1));

  if (addedLines.length === 0) return findings;

  const code = addedLines.join('\n');
  const lines = code.split('\n');

  // Brace matching
  const braceStack = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const char of line) {
      if (char === '{' || char === '(' || char === '[') {
        braceStack.push(char);
      } else if (char === '}') {
        if (braceStack.length > 0 && braceStack[braceStack.length - 1] === '{') {
          braceStack.pop();
        } else {
          findings.push(`Unmatched closing brace '}' at line ${i + 1}`);
        }
      } else if (char === ')') {
        if (braceStack.length > 0 && braceStack[braceStack.length - 1] === '(') {
          braceStack.pop();
        } else {
          findings.push(`Unmatched closing paren ')' at line ${i + 1}`);
        }
      } else if (char === ']') {
        if (braceStack.length > 0 && braceStack[braceStack.length - 1] === '[') {
          braceStack.pop();
        } else {
          findings.push(`Unmatched closing bracket ']' at line ${i + 1}`);
        }
      }
    }
  }

  if (braceStack.length > 0) {
    findings.push(`Unclosed delimiters: ${braceStack.join(', ')}`);
  }

  return findings;
}

/**
 * Check if tests are present for code changes
 */
function checkTestsPresent(task, diff) {
  if (!diff) return { hasCodeChanges: false, hasTests: true, findings: [] };

  const findings = [];

  // Detect added files
  const addedFilePattern = /^\+\+\+ b\/(.+)$/gm;
  const addedFiles = [];
  let match;
  while ((match = addedFilePattern.exec(diff)) !== null) {
    addedFiles.push(match[1]);
  }

  if (addedFiles.length === 0) {
    return { hasCodeChanges: false, hasTests: true, findings: [] };
  }

  // Check which added files are code
  const codeFiles = addedFiles.filter(file =>
    CODE_EXTENSIONS.some(ext => file.endsWith(ext))
  );

  if (codeFiles.length === 0) {
    return { hasCodeChanges: false, hasTests: true, findings: [] };
  }

  // Check if any test files were added
  const testFiles = addedFiles.filter(file =>
    TEST_EXTENSIONS.some(ext => file.includes(ext))
  );

  // Check if existing test files were modified (in the diff)
  const testFileModifications = diff.split('\n').filter(line => {
    return line.startsWith('---') || line.startsWith('+++');
  }).filter(line => {
    const filePath = line.replace(/^[+-]{3} [ab]\//, '');
    return TEST_EXTENSIONS.some(ext => filePath.includes(ext));
  });

  if (testFiles.length === 0 && testFileModifications.length === 0) {
    findings.push(`Code files added without corresponding tests: ${codeFiles.join(', ')}`);
    return { hasCodeChanges: true, hasTests: false, findings };
  }

  return { hasCodeChanges: true, hasTests: true, findings };
}

/**
 * Check if the change is minimal
 */
function checkMinimal(diff) {
  const findings = [];
  if (!diff) return findings;

  // Count added/removed lines
  const addedLines = diff.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++')).length;
  const removedLines = diff.split('\n').filter(l => l.startsWith('-') && !l.startsWith('---')).length;
  const totalChanged = addedLines + removedLines;

  // Detect added files
  const addedFilePattern = /^\+\+\+ b\/(.+)$/gm;
  const addedFiles = [];
  let match;
  while ((match = addedFilePattern.exec(diff)) !== null) {
    addedFiles.push(match[1]);
  }

  // Threshold: more than 500 lines changed is large
  if (totalChanged > 500) {
    findings.push(`Large change: ${totalChanged} lines changed (added: ${addedLines}, removed: ${removedLines})`);
  }

  // Threshold: more than 10 files is broad
  if (addedFiles.length > 10) {
    findings.push(`Broad change: ${addedFiles.length} files affected`);
  }

  return findings;
}

/**
 * Main review function
 */
async function reviewChanges({ task, diff, evidence }) {
  const reasons = [];
  const suggestions = [];
  let severity = 'none';
  let approved = true;

  // Check 1: Secrets
  const secretFindings = checkSecrets(diff);
  if (secretFindings.length > 0) {
    reasons.push(...secretFindings);
    severity = 'high';
    approved = false;
    suggestions.push('Remove secrets from the diff. Use environment variables or a secret manager.');
  }

  // Check 2: Syntax errors
  const syntaxFindings = checkSyntax(diff);
  if (syntaxFindings.length > 0) {
    reasons.push(...syntaxFindings);
    if (severity !== 'high') {
      severity = 'medium';
    }
    approved = false;
    suggestions.push('Fix syntax errors before merging.');
  }

  // Check 3: Tests present
  const testResult = checkTestsPresent(task, diff);
  if (testResult.hasCodeChanges && !testResult.hasTests) {
    reasons.push('No tests found for code changes');
    if (severity === 'none') {
      severity = 'medium';
    } else if (severity === 'low') {
      severity = 'medium';
    }
    approved = false;
    suggestions.push('Add corresponding tests for code changes.');
  }

  // Check 4: Minimality (only set low severity if no other issues found)
  const minimalFindings = checkMinimal(diff);
  if (minimalFindings.length > 0) {
    reasons.push(...minimalFindings);
    if (severity === 'none') {
      severity = 'low';
    }
    suggestions.push('Consider breaking this change into smaller, focused PRs.');
  }

  // If everything is clean, still provide a note
  if (approved && reasons.length === 0) {
    suggestions.push('All automated checks passed. Consider manual review for logic errors.');
  }

  return {
    approved,
    reasons,
    severity,
    suggestions,
  };
}

module.exports = { reviewChanges };
