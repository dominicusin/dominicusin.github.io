'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function validateDecision(d) {
  const errors = [];
  if (!d || typeof d !== 'object') return { valid: false, errors: ['decision must be object'] };
  if (typeof d.task !== 'string' || !d.task) errors.push('task required');
  if (!Array.isArray(d.options)) errors.push('options must be array');
  if (typeof d.chosen !== 'string' && d.chosen !== null) errors.push('chosen must be string or null');
  if (typeof d.timestamp !== 'string' || Number.isNaN(Date.parse(d.timestamp))) errors.push('timestamp required');
  return { valid: errors.length === 0, errors };
}

function createDecisionLog(opts = {}) {
  const filePath = opts.filePath || null;
  const decisions = new Map();

  function ensureDir() {
    if (!filePath) return;
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  function load() {
    decisions.clear();
    if (!filePath || !fs.existsSync(filePath)) return 0;
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) return 0;
    for (const line of raw.split('\n').filter(l => l.trim())) {
      const d = JSON.parse(line);
      const v = validateDecision(d);
      if (!v.valid) throw new Error(`invalid decision ${d.id}: ${v.errors.join(';')}`);
      decisions.set(d.id, d);
    }
    return decisions.size;
  }

  function save() {
    if (!filePath) return;
    ensureDir();
    const tmp = `${filePath}.tmp.${crypto.randomBytes(4).toString('hex')}`;
    const data = Array.from(decisions.values()).map(d => JSON.stringify(d)).join('\n') + (decisions.size ? '\n' : '');
    fs.writeFileSync(tmp, data, 'utf8');
    fs.renameSync(tmp, filePath);
  }

  function record({ task, options, chosen, rationale, evidence }) {
    if (!task) throw new Error('task required');
    if (!Array.isArray(options)) throw new Error('options must be array');
    const id = `dec-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const entry = {
      id,
      task,
      options: [...options],
      chosen: chosen === undefined ? null : chosen,
      rationale: rationale || '',
      evidence: evidence === undefined ? null : evidence,
      timestamp: new Date().toISOString()
    };
    const v = validateDecision(entry);
    if (!v.valid) throw new Error(v.errors.join(';'));
    decisions.set(id, entry);
    save();
    return entry;
  }

  function get(id) { return decisions.get(id) || null; }

  function list(filter = {}) {
    let res = Array.from(decisions.values());
    if (filter.task) res = res.filter(d => d.task === filter.task);
    return res.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  }

  function queryByTask(task) { return list({ task }); }

  function replay(taskId) {
    return list({ task: taskId });
  }

  function clear() { decisions.clear(); save(); }

  if (filePath) { try { load(); } catch (_) {} }

  return { record, get, list, queryByTask, replay, load, save, clear, get size() { return decisions.size; }, filePath };
}

module.exports = { validateDecision, createDecisionLog };
