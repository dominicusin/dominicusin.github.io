'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function validateTemplate(t) {
  const errors = [];
  if (!t || typeof t !== 'object') return { valid: false, errors: ['template must be object'] };
  if (typeof t.id !== 'string' || !t.id) errors.push('id required');
  if (typeof t.version !== 'string' && typeof t.version !== 'number') errors.push('version required');
  if (!Array.isArray(t.stages)) errors.push('stages must be array');
  if (t.stages && !t.stages.every(s => typeof s.name === 'string')) errors.push('each stage must have name');
  return { valid: errors.length === 0, errors };
}

function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

function createProceduralStore(opts = {}) {
  const filePath = opts.filePath || null;
  const templates = new Map();

  function key(id, version) { return `${id}@${version}`; }

  function ensureDir() {
    if (!filePath) return;
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  function load() {
    templates.clear();
    if (!filePath || !fs.existsSync(filePath)) return 0;
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) return 0;
    for (const line of raw.split('\n').filter(l => l.trim())) {
      const t = JSON.parse(line);
      const v = validateTemplate(t);
      if (!v.valid) throw new Error(`invalid template ${t.id}: ${v.errors.join(';')}`);
      templates.set(key(t.id, t.version), t);
    }
    return templates.size;
  }

  function save() {
    if (!filePath) return;
    ensureDir();
    const tmp = `${filePath}.tmp.${crypto.randomBytes(4).toString('hex')}`;
    const data = Array.from(templates.values()).map(t => JSON.stringify(t)).join('\n') + (templates.size ? '\n' : '');
    fs.writeFileSync(tmp, data, 'utf8');
    fs.renameSync(tmp, filePath);
  }

  function saveTemplate({ id, name, version, taskPattern, stages, createdAt }) {
    if (!id || !stages) throw new Error('id and stages required');
    let ver = version;
    if (ver === undefined || ver === null) {
      const existing = Array.from(templates.values()).filter(t => t.id === id);
      const max = existing.reduce((m, t) => Math.max(m, typeof t.version === 'number' ? t.version : parseInt(t.version, 10) || 0), 0);
      ver = max + 1;
    }
    const tpl = {
      id,
      name: name || id,
      version: ver,
      taskPattern: taskPattern || '*',
      stages: clone(stages),
      createdAt: createdAt || new Date().toISOString()
    };
    const v = validateTemplate(tpl);
    if (!v.valid) throw new Error(v.errors.join(';'));
    templates.set(key(id, ver), tpl);
    save();
    return tpl;
  }

  function getTemplate(id, version) {
    if (version !== undefined && version !== null) return templates.get(key(id, version)) || null;
    const candidates = Array.from(templates.values()).filter(t => t.id === id);
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => {
      const av = typeof a.version === 'number' ? a.version : parseInt(a.version, 10) || 0;
      const bv = typeof b.version === 'number' ? b.version : parseInt(b.version, 10) || 0;
      return bv - av;
    });
    return candidates[0];
  }

  function listTemplates() {
    return Array.from(templates.values()).sort((a, b) => a.id.localeCompare(b.id));
  }

  function reuseTemplate(id, context = {}) {
    const tpl = getTemplate(id);
    if (!tpl) throw new Error(`template not found: ${id}`);
    const plan = {
      templateId: tpl.id,
      templateVersion: tpl.version,
      task: context.task || tpl.taskPattern,
      stages: clone(tpl.stages),
      context: clone(context),
      generatedAt: new Date().toISOString()
    };
    return plan;
  }

  function clear() { templates.clear(); save(); }

  if (filePath) { try { load(); } catch (_) {} }

  return { saveTemplate, getTemplate, listTemplates, reuseTemplate, load, save, clear, get size() { return templates.size; }, filePath };
}

module.exports = { validateTemplate, createProceduralStore };
