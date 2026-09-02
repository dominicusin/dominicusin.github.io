'use strict';

function computeHotspots({ churn, complexity, failures, files, semantic }) {
  const allFiles = files || [...new Set([...Object.keys(churn || {}), ...Object.keys(complexity || {}), ...Object.keys(failures || {})])];
  if (allFiles.length === 0) return [];

  const maxChurn = Math.max(1, ...Object.values(churn || { _f: 1 }));
  const maxComplex = Math.max(1, ...Object.values(complexity || { _f: 1 }));
  const maxFail = Math.max(1, ...Object.values(failures || { _f: 1 }));

  const semanticBoost = new Map();
  if (semantic && typeof semantic.queryByTags === 'function') {
    try {
      const facts = semantic.queryByTags(['failure', 'hotspot', 'churn']);
      for (const f of facts || []) {
        const text = (f.fact || '').toLowerCase();
        for (const file of allFiles) {
          if (text.includes(file.toLowerCase().split('/').pop()) || text.includes(file.toLowerCase())) {
            semanticBoost.set(file, (semanticBoost.get(file) || 0) + 0.5);
          }
        }
      }
    } catch (_) {}
  }

  const scored = allFiles.map(file => {
    const c = (churn && churn[file]) || 0;
    const cx = (complexity && complexity[file]) || 0;
    const fa = (failures && failures[file]) || 0;
    const normChurn = c / maxChurn;
    const normComplex = cx / maxComplex;
    const normFail = fa / maxFail;
    const boost = semanticBoost.get(file) || 0;
    const score = normChurn * 0.4 + normComplex * 0.3 + normFail * 0.3 + boost;
    const reasons = [];
    if (c > maxChurn * 0.5) reasons.push(`high churn (${c})`);
    if (cx > maxComplex * 0.5) reasons.push(`high complexity (${cx})`);
    if (fa > 0) reasons.push(`failure history (${fa})`);
    if (boost > 0) reasons.push('semantic failure pattern');
    if (reasons.length === 0) reasons.push('moderate activity');
    return { file, score: Math.round(score * 100) / 100, reasons, factors: { churn: c, complexity: cx, failures: fa } };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 10);
}

module.exports = { computeHotspots };
