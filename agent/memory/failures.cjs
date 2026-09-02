'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function validateFailureEntry(e) {
  const errors = [];
  if (!e || typeof e !== 'object') return { valid: false, errors: ['entry must be object'] };
  if (typeof e.signature !== 'string' || !e.signature) errors.push('signature required');
  if (typeof e.category !== 'string' || !e.category) errors.push('category required');
  return { valid: errors.length === 0, errors };
}

function createFailureMemory(opts = {}) {
  const filePath = opts.filePath || null;
  const entries = new Map();

  function ensureDir() {
    if (!filePath) return;
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  function load() {
    entries.clear();
    if (!filePath || !fs.existsSync(filePath)) return 0;
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) return 0;
    for (const line of raw.split('\n').filter(l => l.trim())) {
      const e = JSON.parse(line);
      const v = validateFailureEntry(e);
      if (!v.valid) throw new Error(`invalid failure ${e.signature}: ${v.errors.join(';')}`);
      entries.set(e.signature, e);
    }
    return entries.size;
  }

  function save() {
    if (!filePath) return;
    ensureDir();
    const tmp = `${filePath}.tmp.${crypto.randomBytes(4).toString('hex')}`;
    const data = Array.from(entries.values()).map(e => JSON.stringify(e)).join('\n') + (entries.size ? '\n' : '');
    fs.writeFileSync(tmp, data, 'utf8');
    fs.renameSync(tmp, filePath);
  }

  function indexFailure({ signature, category, diagnosis, healing, evidence }) {
    if (!signature || !category) throw new Error('signature and category required');
    const existing = entries.get(signature);
    const entry = {
      signature,
      category,
      diagnosis: diagnosis || null,
      healing: healing || null,
      evidence: evidence === undefined ? null : evidence,
      timestamp: new Date().toISOString(),
      count: existing ? existing.count + 1 : 1
    };
    const v = validateFailureEntry(entry);
    if (!v.valid) throw new Error(v.errors.join(';'));
    entries.set(signature, entry);
    save();
    return entry;
  }

  function getBySignature(sig) { return entries.get(sig) || null; }
  function healingFor(sig) { const e = entries.get(sig); return e ? e.healing : null; }
  function queryByCategory(cat) { return Array.from(entries.values()).filter(e => e.category === cat); }
  function list() { return Array.from(entries.values()).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)); }
  function clear() { entries.clear(); save(); }

  if (filePath) { try { load(); } catch (_) {} }

  return { indexFailure, getBySignature, healingFor, queryByCategory, list, load, save, clear, get size() { return entries.size; }, filePath };
}

module.exports = { validateFailureEntry, createFailureMemory };
