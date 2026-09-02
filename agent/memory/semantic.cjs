'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function validateFact(f) {
  const errors = [];
  if (!f || typeof f !== 'object') return { valid: false, errors: ['fact must be object'] };
  if (typeof f.id !== 'string' || !f.id) errors.push('id required');
  if (!Array.isArray(f.tags)) errors.push('tags must be array');
  if (typeof f.capability !== 'string' && typeof f.capability !== 'undefined' && f.capability !== null) errors.push('capability must be string');
  if (typeof f.fact !== 'string' || !f.fact) errors.push('fact text required');
  return { valid: errors.length === 0, errors };
}

function createSemanticStore(opts = {}) {
  const filePath = opts.filePath || null;
  const facts = new Map();

  function ensureDir() {
    if (!filePath) return;
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  function load() {
    facts.clear();
    if (!filePath || !fs.existsSync(filePath)) return 0;
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) return 0;
    for (const line of raw.split('\n').filter(l => l.trim())) {
      const f = JSON.parse(line);
      const v = validateFact(f);
      if (!v.valid) throw new Error(`invalid fact ${f.id}: ${v.errors.join(';')}`);
      facts.set(f.id, f);
    }
    return facts.size;
  }

  function save() {
    if (!filePath) return;
    ensureDir();
    const tmp = `${filePath}.tmp.${crypto.randomBytes(4).toString('hex')}`;
    const data = Array.from(facts.values()).map(f => JSON.stringify(f)).join('\n') + (facts.size ? '\n' : '');
    fs.writeFileSync(tmp, data, 'utf8');
    fs.renameSync(tmp, filePath);
  }

  function addFact({ id, tags, capability, fact, confidence, failureType }) {
    const fid = id || `fact-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const entry = {
      id: fid,
      tags: Array.isArray(tags) ? tags : [],
      capability: capability || null,
      failureType: failureType || null,
      fact,
      confidence: typeof confidence === 'number' ? confidence : 0.5,
      timestamp: new Date().toISOString()
    };
    const v = validateFact(entry);
    if (!v.valid) throw new Error(v.errors.join(';'));
    facts.set(fid, entry);
    save();
    return entry;
  }

  function get(id) { return facts.get(id) || null; }

  function remove(id) {
    const ok = facts.delete(id);
    if (ok) save();
    return ok;
  }

  function queryByTags(qTags) {
    if (!Array.isArray(qTags) || qTags.length === 0) return [];
    const scored = [];
    for (const f of facts.values()) {
      const overlap = f.tags.filter(t => qTags.includes(t)).length;
      if (overlap > 0) scored.push({ fact: f, score: overlap, confidence: f.confidence });
    }
    scored.sort((a, b) => b.score - a.score || b.confidence - a.confidence);
    return scored.map(s => s.fact);
  }

  function queryByCapability(cap) {
    return Array.from(facts.values()).filter(f => f.capability === cap).sort((a, b) => b.confidence - a.confidence);
  }

  function queryByPolicyFailure(failureType) {
    return Array.from(facts.values()).filter(f => f.failureType === failureType);
  }

  function list() { return Array.from(facts.values()).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)); }
  function clear() { facts.clear(); save(); }

  if (filePath) { try { load(); } catch (_) {} }

  return { addFact, get, remove, queryByTags, queryByCapability, queryByPolicyFailure, list, load, save, clear, get size() { return facts.size; }, filePath };
}

module.exports = { validateFact, createSemanticStore };
