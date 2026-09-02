'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function validateEpisode(e) {
  const errors = [];
  if (!e || typeof e !== 'object') return { valid: false, errors: ['episode must be object'] };
  if (typeof e.id !== 'string' || !e.id) errors.push('id required');
  if (typeof e.runId !== 'string' || !e.runId) errors.push('runId required');
  if (typeof e.taskId !== 'string' || !e.taskId) errors.push('taskId required');
  if (typeof e.timestamp !== 'string' || Number.isNaN(Date.parse(e.timestamp))) errors.push('timestamp required');
  return { valid: errors.length === 0, errors };
}

function createEpisodicStore(opts = {}) {
  const filePath = opts.filePath || null;
  const retentionDays = typeof opts.retentionDays === 'number' ? opts.retentionDays : 30;
  const maxEntries = typeof opts.maxEntries === 'number' ? opts.maxEntries : 10000;
  const episodes = new Map();

  function ensureDir() {
    if (!filePath) return;
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  function load() {
    episodes.clear();
    if (!filePath || !fs.existsSync(filePath)) return 0;
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) return 0;
    for (const line of raw.split('\n').filter(l => l.trim())) {
      const ep = JSON.parse(line);
      const v = validateEpisode(ep);
      if (!v.valid) throw new Error(`invalid episode ${ep.id}: ${v.errors.join(';')}`);
      episodes.set(ep.id, ep);
    }
    prune();
    return episodes.size;
  }

  function save() {
    if (!filePath) return;
    ensureDir();
    const tmp = `${filePath}.tmp.${crypto.randomBytes(4).toString('hex')}`;
    const data = Array.from(episodes.values()).map(e => JSON.stringify(e)).join('\n') + (episodes.size ? '\n' : '');
    fs.writeFileSync(tmp, data, 'utf8');
    fs.renameSync(tmp, filePath);
  }

  function append({ runId, taskId, evidence, payload }) {
    if (!runId || !taskId) throw new Error('runId and taskId required');
    const id = `ep-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const ep = {
      id,
      runId,
      taskId,
      evidence: evidence || null,
      payload: payload || {},
      timestamp: new Date().toISOString(),
      evidenceIds: evidence && evidence.evidence ? [evidence.evidence] : []
    };
    const v = validateEpisode(ep);
    if (!v.valid) throw new Error(v.errors.join(';'));
    episodes.set(id, ep);
    if (episodes.size > maxEntries) {
      const sorted = Array.from(episodes.values()).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
      for (let i = 0; i < episodes.size - maxEntries; i++) episodes.delete(sorted[i].id);
    }
    save();
    return ep;
  }

  function query({ runId, taskId } = {}) {
    let res = Array.from(episodes.values());
    if (runId) res = res.filter(e => e.runId === runId);
    if (taskId) res = res.filter(e => e.taskId === taskId);
    return res.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  }

  function queryByRun(runId) { return query({ runId }); }
  function queryByTask(taskId) { return query({ taskId }); }

  function get(id) { return episodes.get(id) || null; }

  function correlate(episodeId, evidenceEnvelope) {
    const ep = episodes.get(episodeId);
    if (!ep) throw new Error(`episode not found: ${episodeId}`);
    if (!evidenceEnvelope) throw new Error('evidenceEnvelope required');
    const evId = evidenceEnvelope.evidence || evidenceEnvelope.stdout_hash || evidenceEnvelope.id || JSON.stringify(evidenceEnvelope).slice(0, 32);
    if (!ep.evidenceIds.includes(evId)) ep.evidenceIds.push(evId);
    ep.evidence = evidenceEnvelope;
    save();
    return ep;
  }

  function prune(nowMs = Date.now()) {
    if (retentionDays <= 0) return 0;
    const cutoff = nowMs - retentionDays * 24 * 60 * 60 * 1000;
    let removed = 0;
    for (const [id, ep] of episodes) {
      if (Date.parse(ep.timestamp) < cutoff) { episodes.delete(id); removed++; }
    }
    if (removed) save();
    return removed;
  }

  function list() { return Array.from(episodes.values()).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)); }
  function clear() { episodes.clear(); save(); }

  if (filePath) { try { load(); } catch (_) {} }

  return { append, query, queryByRun, queryByTask, get, correlate, prune, list, load, save, clear, get size() { return episodes.size; }, filePath };
}

module.exports = { validateEpisode, createEpisodicStore };
