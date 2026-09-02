'use strict';

const DEFAULT_BUDGETS = {
  maxBundleSize: 500 * 1024,
  minLighthouseScore: 90,
  maxLCP: 2500,
  maxCLS: 0.1,
  maxTTI: 3500,
  heavyJsPatterns: [/d3/i, /three/i, /phaser/i, /plotly/i, /moment/i]
};

async function analyzePerformance({ buildOutput = {}, budgets = {}, assets } = {}) {
  const violations = [];
  const suggestions = [];
  const actualBudgets = { ...DEFAULT_BUDGETS, ...budgets };
  if (!actualBudgets.heavyJsPatterns) actualBudgets.heavyJsPatterns = DEFAULT_BUDGETS.heavyJsPatterns;

  const bundleSize = buildOutput.totalSize != null ? buildOutput.totalSize : (buildOutput.bundleSize != null ? buildOutput.bundleSize : 0);
  const lh = buildOutput.lighthouse || {};
  const assetList = buildOutput.assets || assets || [];

  if (bundleSize > actualBudgets.maxBundleSize) {
    const sizeKB = Math.round(bundleSize / 1024);
    const budgetKB = Math.round(actualBudgets.maxBundleSize / 1024);
    const overKB = Math.round((bundleSize - actualBudgets.maxBundleSize) / 1024);
    violations.push(`Bundle size ${sizeKB}KB (${bundleSize} bytes) exceeds budget ${budgetKB}KB (${actualBudgets.maxBundleSize} bytes) by ${overKB}KB`);
    suggestions.push('Consider code splitting or reducing bundle size to meet budget');
  }

  const score = lh.performance != null ? lh.performance : lh.overall;
  if (score != null && score !== 0 && score < actualBudgets.minLighthouseScore) {
    violations.push(`Lighthouse score ${score} below minimum ${actualBudgets.minLighthouseScore}`);
    suggestions.push('Improve Lighthouse performance score');
  }

  if (lh.lcp != null && lh.lcp > actualBudgets.maxLCP) {
    violations.push(`LCP ${lh.lcp}ms exceeds budget ${actualBudgets.maxLCP}ms`);
    suggestions.push('Optimize LCP');
  }

  if (lh.cls != null && lh.cls > actualBudgets.maxCLS) {
    violations.push(`CLS ${lh.cls} exceeds budget ${actualBudgets.maxCLS}`);
    suggestions.push('Fix layout shifts to reduce CLS');
  }

  if (lh.tti != null && lh.tti > actualBudgets.maxTTI) {
    violations.push(`TTI ${lh.tti}ms exceeds budget ${actualBudgets.maxTTI}ms`);
    suggestions.push('Reduce TTI');
  }

  const patterns = actualBudgets.heavyJsPatterns;
  for (const asset of assetList) {
    for (const pattern of patterns) {
      if (pattern.test(asset)) {
        violations.push(`Heavy JS detected: ${asset} matches ${pattern}`);
        suggestions.push(`Heavy JS library detected: ${asset} - consider lazy-loading or replacing heavy dependency`);
        break;
      }
    }
  }

  const passed = violations.length === 0;

  return {
    passed,
    violations,
    metrics: {
      bundleSize,
      lighthouse: lh
    },
    suggestions
  };
}

module.exports = { analyzePerformance, DEFAULT_BUDGETS };
