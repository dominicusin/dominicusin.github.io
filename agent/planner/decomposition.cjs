'use strict';

const MAX_SUBTASKS = 5;

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function inferScope(task) {
  if (task.scope) return task.scope;
  if (Array.isArray(task.files) && task.files.length) return task.files.slice();
  if (Array.isArray(task.artifacts) && task.artifacts.length) return task.artifacts.slice();
  return [];
}

function verificationFor(subtask, parent) {
  const base = [];
  if (subtask.files && subtask.files.some(f => f.endsWith('.md') || f.includes('content'))) base.push('npm run content-contract');
  if (subtask.files && subtask.files.some(f => /\.(js|cjs|mjs)$/.test(f))) base.push('npm run lint');
  if (parent && parent.risk === 'R1') base.push('npm test');
  if (parent && parent.risk === 'R2') base.push('npm test');
  if (parent && parent.risk === 'R3') base.push('hugo --gc --minify');
  const uniq = [...new Set(base)];
  if (uniq.length === 0) uniq.push('npm run lint');
  return uniq;
}

function chunkFiles(files, maxChunks) {
  if (!files || files.length === 0) return [[]];
  if (files.length <= maxChunks) return files.map(f => [f]);
  const chunks = Array.from({ length: maxChunks }, () => []);
  files.forEach((f, i) => chunks[i % maxChunks].push(f));
  return chunks.filter(c => c.length > 0);
}

function decomposeTask(task, opts = {}) {
  if (!task || typeof task !== 'object') throw new Error('task required');
  if (!task.id) throw new Error('task.id required');
  const scope = inferScope(task);
  const files = Array.isArray(task.files) ? task.files.slice() : scope.slice();
  const max = opts.maxSubtasks || MAX_SUBTASKS;
  if (max < 1 || max > 5) throw new Error('maxSubtasks must be 1..5');

  if (files.length === 0) {
    const count = Math.min(2, max);
    return Array.from({ length: count }, (_, i) => ({
      id: `${task.id}-SUB-${String(i + 1).padStart(3, '0')}`,
      parentId: task.id,
      title: `${task.title || task.id} — part ${i + 1}/${count}`,
      scope: [],
      files: [],
      verification: verificationFor({ files: [] }, task),
      risk: task.risk || 'R1',
      priority: task.priority || 'P1',
      artifacts: []
    }));
  }

  const chunks = chunkFiles(files, Math.min(max, files.length));
  const num = Math.min(chunks.length, max);
  const subtasks = chunks.slice(0, num).map((chunk, idx) => ({
    id: `${task.id}-SUB-${String(idx + 1).padStart(3, '0')}`,
    parentId: task.id,
    title: `${task.title || task.id} — ${chunk[0]}${chunk.length > 1 ? ` +${chunk.length - 1}` : ''}`,
    scope: chunk.slice(),
    files: chunk.slice(),
    verification: verificationFor({ files: chunk }, task),
    risk: task.risk || 'R1',
    priority: task.priority || 'P1',
    artifacts: chunk.slice()
  }));

  for (const st of subtasks) {
    for (const f of st.files) {
      if (!files.includes(f) && !scope.includes(f)) {
        throw new Error(`out-of-scope file leak: ${f} not in parent scope`);
      }
    }
  }

  return subtasks;
}

function decomposePlan(tasks, opts = {}) {
  if (!Array.isArray(tasks)) throw new Error('tasks must be array');
  const result = [];
  for (const t of tasks) {
    const needsDecomposition = (opts.shouldDecompose && opts.shouldDecompose(t)) || (Array.isArray(t.files) && t.files.length > 2) || t.decompose === true;
    if (needsDecomposition) {
      result.push(...decomposeTask(t, opts));
    } else {
      const copy = clone(t);
      if (!copy.verification) copy.verification = verificationFor(copy, copy);
      result.push(copy);
    }
  }
  return result;
}

module.exports = { decomposeTask, decomposePlan, MAX_SUBTASKS };
