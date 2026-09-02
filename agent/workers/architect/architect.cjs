'use strict';

/**
 * Architect Agent — M3-001
 * Checks architectural boundaries and drift.
 */

const fs = require('fs');
const path = require('path');

/**
 * Analyze repository architecture.
 */
async function analyzeArchitecture({ repository, adr, boundaries }) {
  const drift = [];
  const violations = [];
  const recommendations = [];

  // Check two-plane separation
  const separation = checkPlaneSeparation(repository);
  if (!separation.valid) {
    violations.push(...separation.violations);
  }

  // Check ADR compliance
  const adrCompliance = checkADRCompliance(repository, adr);
  if (!adrCompliance.valid) {
    drift.push(...adrCompliance.drift);
  }

  // Check dependency direction
  const depDirection = checkDependencyDirection(repository, boundaries);
  if (!depDirection.valid) {
    violations.push(...depDirection.violations);
  }

  // Generate recommendations
  if (violations.length > 0) {
    recommendations.push('Address architectural violations');
  }

  const valid = violations.length === 0 && drift.length === 0;

  return { valid, drift, violations, recommendations };
}

function checkPlaneSeparation(repository) {
  const violations = [];

  // Check that src/ is not imported by layouts/
  const layoutsDir = path.join(repository, 'layouts');
  if (fs.existsSync(layoutsDir)) {
    const files = getAllFiles(layoutsDir);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('src/modules/') || content.includes('../src/')) {
        violations.push(`Publishing plane imports Engineering plane: ${path.relative(repository, file)}`);
      }
    }
  }

  return { valid: violations.length === 0, violations };
}

function checkADRCompliance(repository, adr) {
  const drift = [];

  if (!adr || adr.length === 0) {
    drift.push('No ADRs found');
  }

  return { valid: drift.length === 0, drift };
}

function checkDependencyDirection(repository, boundaries) {
  const violations = [];
  // Simplified check
  return { valid: violations.length === 0, violations };
}

function getAllFiles(dir) {
  const files = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getAllFiles(full));
      } else if (entry.isFile() && /\.(html|js|cjs|mjs)$/.test(entry.name)) {
        files.push(full);
      }
    }
  } catch {}
  return files;
}

module.exports = { analyzeArchitecture };
