'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function validateMemoryEntry(entry) {
  const errors = [];
  if (!entry || typeof entry !== 'object') return { valid: false, errors: ['entry must be an object'] };
  if (typeof entry.id !== 'string' || entry.id.length === 0) errors.push('id must be non-empty string');
  if (typeof entry.task !== 'string' || entry.task.length === 0) errors.push('task must be non-empty string');
  if (typeof entry.run_id !== 'string' || entry.run_id.length === 0) errors.push('run_id must be non-empty string');
  if (entry.payload === undefined || entry.payload === null || typeof entry.payload !== 'object') errors.push('payload must be object');
  if (typeof entry.timestamp !== 'string' || Number.isNaN(Date.parse(entry.timestamp))) errors.push('timestamp must be ISO date string');
  return { valid: errors.length === 0, errors };
}

function createMemoryStore(opts = {}) {
  const filePath = opts.filePath || null;
  const store = new Map();

  function ensureDir() {
    if (!filePath) return;
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  function load() {
    store.clear();
    if (!filePath) return 0;
    if (!fs.existsSync(filePath)) return 0;
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) return 0;
    const lines = raw.split('\n').filter(l => l.trim().length > 0);
    let count = 0;
    for (const line of lines) {
      const entry = JSON.parse(line);
      const v = validateMemoryEntry(entry);
      if (!v.valid) throw new Error(`Invalid MemoryEntry ${entry.id}: ${v.errors.join('; ')}`);
      store.set(entry.id, entry);
      count++;
    }
    return count;
  }

  function save() {
    if (!filePath) return;
    ensureDir();
    const tmp = `${filePath}.tmp.${crypto.randomBytes(4).toString('hex')}`;
    const data = Array.from(store.values()).map(e => JSON.stringify(e)).join('\n') + (store.size ? '\n' : '');
    fs.writeFileSync(tmp, data, 'utf8');
    fs.renameSync(tmp, filePath);
  }

  function set(entry) {
    const v = validateMemoryEntry(entry);
    if (!v.valid) throw new Error(`validateMemoryEntry failed: ${v.errors.join('; ')}`);
    store.set(entry.id, entry);
    save();
    return entry;
  }

  function get(id) {
    return store.get(id) || null;
  }

  function has(id) {
    return store.has(id);
  }

  function list() {
    return Array.from(store.values()).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  }

  function del(id) {
    const ok = store.delete(id);
    if (ok) save();
    return ok;
  }

  function clear() {
    store.clear();
    save();
  }

  function validateAgainstSource(graph) {
    if (!graph || !Array.isArray(graph.nodes)) return { valid: false, errors: ['graph invalid'] };
    const ids = new Set(graph.nodes.map(n => n.id));
    const errors = [];
    for (const e of store.values()) {
      if (!ids.has(e.task)) errors.push(`memory task ${e.task} not in beads graph`);
    }
    return { valid: errors.length === 0, errors, isSourceOfTruth: false };
  }

  if (filePath) {
    try { load(); } catch (_) {}
  }

  return { load, save, set, get, has, list, delete: del, clear, validateAgainstSource, get size() { return store.size; }, _store: store, filePath };
}

module.exports = { validateMemoryEntry, createMemoryStore };
