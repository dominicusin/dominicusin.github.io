'use strict';

/**
 * Researcher Agent — M3-002
 *
 * Deterministic researcher that gathers information from local and GitHub sources.
 * No external LLM calls — all analysis is rule-based.
 *
 * Sources:
 * - 'docs': Scan local documentation (docs/, agent/)
 * - 'code': Extract code patterns and dependencies (agent/workers/, src/, scripts/)
 * - 'issues': Check GitHub issues via gh CLI
 * - 'pulls': Check GitHub pull requests via gh CLI
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

/**
 * Research a topic across specified sources.
 *
 * @param {Object} params
 * @param {string} params.topic - Research topic/keywords
 * @param {string[]} params.sources - Sources to search: 'docs', 'code', 'issues', 'pulls'
 * @param {number} params.maxResults - Maximum findings to return
 * @returns {ResearchResult}
 */
async function research({ topic, sources = [], maxResults = 10 }) {
  const findings = [];
  const sourceList = [];
  const hypotheses = [];

  // If no sources specified, search all
  const effectiveSources = sources.length > 0 ? sources : ['docs', 'code'];

  // Search each requested source
  for (const source of effectiveSources) {
    let result;
    switch (source) {
      case 'docs':
        result = searchDocs(topic, maxResults);
        break;
      case 'code':
        result = searchCode(topic, maxResults);
        break;
      case 'issues':
        result = await searchGitHubIssues(topic, maxResults);
        break;
      case 'pulls':
        result = await searchGitHubPRs(topic, maxResults);
        break;
      default:
        result = { findings: [], sources: [] };
    }

    findings.push(...result.findings);
    sourceList.push(...result.sources);

    // Stop if we've hit maxResults
    if (findings.length >= maxResults) break;
  }

  // Trim to maxResults
  const trimmedFindings = findings.slice(0, maxResults);
  const trimmedSources = sourceList.slice(0, maxResults);

  // Generate hypotheses
  hypotheses.push(...generateHypotheses(topic, trimmedFindings, effectiveSources));

  // Calculate confidence
  const confidence = calculateConfidence(trimmedFindings, effectiveSources);

  return {
    findings: trimmedFindings,
    sources: trimmedSources,
    confidence,
    hypotheses
  };
}

/**
 * Search local documentation for topic keywords.
 */
function searchDocs(topic, maxResults) {
  const findings = [];
  const sources = [];
  const keywords = topic.toLowerCase().split(/\s+/).filter(k => k.length > 2);

  const docsDirs = [
    path.join(REPO_ROOT, 'docs'),
    path.join(REPO_ROOT, 'agent'),
  ];

  function walk(dir) {
    if (findings.length >= maxResults) return;
    if (!fs.existsSync(dir)) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (findings.length >= maxResults) break;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        walk(fullPath);
      } else {
        const ext = path.extname(entry.name);
        if (ext !== '.md' && ext !== '.cjs' && ext !== '.js') continue;
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lowerContent = content.toLowerCase();
          const matches = keywords.filter(kw => lowerContent.includes(kw));
          if (matches.length > 0) {
            const snippet = extractSnippet(content, keywords);
            const relPath = path.relative(REPO_ROOT, fullPath);
            findings.push(snippet || `Reference to "${topic}" in ${entry.name}`);
            sources.push(relPath);
          }
        } catch {}
      }
    }
  }

  for (const docsDir of docsDirs) walk(docsDir);

  return { findings, sources };
}

/**
 * Search code files for patterns and dependencies.
 */
function searchCode(topic, maxResults) {
  const findings = [];
  const sources = [];
  const keywords = topic.toLowerCase().split(/\s+/).filter(k => k.length > 2);

  const codeDirs = [
    path.join(REPO_ROOT, 'agent'),
    path.join(REPO_ROOT, 'src'),
    path.join(REPO_ROOT, 'scripts'),
  ];

  // Also check package.json for dependencies
  const packageJsonPath = path.join(REPO_ROOT, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies
      };

      const topicLower = topic.toLowerCase();
      const matchingDeps = Object.keys(allDeps).filter(dep =>
        dep.toLowerCase().includes(topicLower) ||
        topicLower.includes(dep.toLowerCase())
      );

      if (matchingDeps.length > 0) {
        findings.push(`Dependencies matching "${topic}": ${matchingDeps.join(', ')}`);
        sources.push('package.json');
      }

      // If topic is 'dependencies' or similar, list all
      if (topicLower.includes('dependencies') || topicLower.includes('deps')) {
        const depCount = Object.keys(allDeps).length;
        findings.push(`Project has ${depCount} total dependencies`);
        if (!sources.includes('package.json')) sources.push('package.json');
      }
    } catch {
      // Ignore parse errors
    }
  }

  function walkCode(dir) {
    if (findings.length >= maxResults) return;
    if (!fs.existsSync(dir)) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (findings.length >= maxResults) break;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        walkCode(fullPath);
      } else if (/\.(cjs|js|mjs|ts)$/.test(entry.name)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lowerContent = content.toLowerCase();
          const matches = keywords.filter(kw => lowerContent.includes(kw));
          if (matches.length > 0) {
            const patterns = extractCodePatterns(content, keywords);
            const relPath = path.relative(REPO_ROOT, fullPath);
            for (const pattern of patterns) {
              if (findings.length >= maxResults) break;
              findings.push(pattern);
              sources.push(relPath);
            }
          }
        } catch {}
      }
    }
  }

  for (const codeDir of codeDirs) walkCode(codeDir);

  return { findings, sources };
}

/**
 * Search GitHub issues via gh CLI.
 */
async function searchGitHubIssues(topic, maxResults) {
  const findings = [];
  const sources = [];

  try {
    const { execSync } = require('child_process');
    const output = execSync(
      `/everything/bin/gh search issues "${topic}" --limit ${maxResults} --json title,url,state 2>/dev/null`,
      { encoding: 'utf8', timeout: 30000 }
    );

    const issues = JSON.parse(output);
    for (const issue of issues.slice(0, maxResults)) {
      findings.push(`Issue: ${issue.title} [${issue.state}]`);
      sources.push(issue.url);
    }
  } catch {
    // gh not available or no access
  }

  return { findings, sources };
}

/**
 * Search GitHub pull requests via gh CLI.
 */
async function searchGitHubPRs(topic, maxResults) {
  const findings = [];
  const sources = [];

  try {
    const { execSync } = require('child_process');
    const output = execSync(
      `/everything/bin/gh search prs "${topic}" --limit ${maxResults} --json title,url,state 2>/dev/null`,
      { encoding: 'utf8', timeout: 30000 }
    );

    const prs = JSON.parse(output);
    for (const pr of prs.slice(0, maxResults)) {
      findings.push(`PR: ${pr.title} [${pr.state}]`);
      sources.push(pr.url);
    }
  } catch {
    // gh not available or no access
  }

  return { findings, sources };
}

/**
 * Extract a relevant snippet from content around keyword matches.
 */
function extractSnippet(content, keywords) {
  const lines = content.split('\n');
  const lowerLines = lines.map(l => l.toLowerCase());

  for (let i = 0; i < lines.length; i++) {
    if (keywords.some(kw => lowerLines[i].includes(kw))) {
      // Return the line and surrounding context
      const start = Math.max(0, i - 1);
      const end = Math.min(lines.length, i + 2);
      const snippet = lines.slice(start, end).join('\n').trim();
      return snippet.length > 200 ? snippet.substring(0, 200) + '...' : snippet;
    }
  }

  return null;
}

/**
 * Extract code patterns from content.
 */
function extractCodePatterns(content, keywords) {
  const patterns = [];
  const lines = content.split('\n');

  // Look for module.exports
  const exportLine = lines.find(l => l.includes('module.exports'));
  if (exportLine) {
    patterns.push(`Exports: ${exportLine.trim()}`);
  }

  // Look for function definitions
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('function ') || trimmed.startsWith('async function ')) {
      patterns.push(`Function: ${trimmed.substring(0, 100)}`);
    }
  }

  // Look for require/import statements
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('require(') || trimmed.startsWith('import ')) {
      patterns.push(`Import: ${trimmed.substring(0, 100)}`);
    }
  }

  // If no specific patterns found, just note the file has matches
  if (patterns.length === 0) {
    patterns.push(`Code matches for: ${keywords.join(', ')}`);
  }

  return patterns;
}

/**
 * Generate hypotheses based on findings.
 */
function generateHypotheses(topic, findings, sources) {
  const hypotheses = [];

  if (findings.length === 0) {
    hypotheses.push(`No evidence found for "${topic}" — may be undocumented or out of scope`);
  } else if (findings.length > 10) {
    hypotheses.push(`"${topic}" is extensively documented across ${sources.length} sources`);
    hypotheses.push(`High community/engineering interest in this topic`);
  } else if (findings.length > 5) {
    hypotheses.push(`"${topic}" has moderate documentation and code presence`);
    hypotheses.push(`Further investigation may reveal additional patterns`);
  } else if (findings.length > 0) {
    hypotheses.push(`"${topic}" has limited but present documentation`);
    hypotheses.push(`May benefit from additional documentation or examples`);
  }

  // Source-specific hypotheses
  if (sources.includes('code') && sources.includes('docs')) {
    hypotheses.push(`Code and documentation are aligned on this topic`);
  }
  if (sources.includes('issues')) {
    hypotheses.push(`Active GitHub discussion indicates ongoing work or interest`);
  }

  return hypotheses;
}

/**
 * Calculate confidence based on findings and sources used.
 */
function calculateConfidence(findings, sources) {
  const count = findings.length;
  const sourceCount = sources.length;

  // High confidence: many findings across multiple sources
  if (count > 10 && sourceCount >= 3) return 'high';
  if (count > 5 && sourceCount >= 2) return 'high';

  // Medium confidence: some findings
  if (count > 5) return 'medium';
  if (count > 2 && sourceCount >= 2) return 'medium';

  // Low confidence: few or no findings
  return 'low';
}

module.exports = { research };