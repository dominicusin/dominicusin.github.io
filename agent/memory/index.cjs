'use strict';

const { createMemoryStore } = require('./memory.cjs');
const { createEpisodicStore } = require('./episodic.cjs');
const { createSemanticStore } = require('./semantic.cjs');
const { createProceduralStore } = require('./procedural.cjs');
const { createDecisionLog } = require('./decisions.cjs');
const { createFailureMemory } = require('./failures.cjs');

function createMemoryFacade(opts = {}) {
  const baseDir = opts.baseDir || null;
  const p = (name) => (baseDir ? `${baseDir}/${name}` : null);

  const memory = createMemoryStore({ filePath: opts.memoryPath || p('memory.jsonl') });
  const episodic = createEpisodicStore({ filePath: opts.episodicPath || p('episodic.jsonl') });
  const semantic = createSemanticStore({ filePath: opts.semanticPath || p('semantic.jsonl') });
  const procedural = createProceduralStore({ filePath: opts.proceduralPath || p('procedural.jsonl') });
  const decisions = createDecisionLog({ filePath: opts.decisionsPath || p('decisions.jsonl') });
  const failures = createFailureMemory({ filePath: opts.failuresPath || p('failures.jsonl') });

  function getMemory(kind, id) {
    switch (kind) {
      case 'memory': return memory.get(id);
      case 'episodic': return episodic.get(id);
      case 'semantic': return semantic.get(id);
      case 'procedural': return procedural.getTemplate(id);
      case 'decisions': return decisions.get(id);
      case 'failures': return failures.getBySignature(id);
      default: throw new Error(`unknown memory kind: ${kind}`);
    }
  }

  function queryMemory(kind, query = {}) {
    switch (kind) {
      case 'memory': return memory.list();
      case 'episodic': return episodic.query(query);
      case 'semantic': {
        if (query.tags) return semantic.queryByTags(query.tags);
        if (query.capability) return semantic.queryByCapability(query.capability);
        if (query.failureType) return semantic.queryByPolicyFailure(query.failureType);
        return semantic.list();
      }
      case 'procedural': return procedural.listTemplates();
      case 'decisions': return query.task ? decisions.queryByTask(query.task) : decisions.list();
      case 'failures': return query.category ? failures.queryByCategory(query.category) : failures.list();
      default: throw new Error(`unknown memory kind: ${kind}`);
    }
  }

  function validateAgainstSource(graph) {
    return memory.validateAgainstSource(graph);
  }

  return { memory, episodic, semantic, procedural, decisions, failures, getMemory, queryMemory, validateAgainstSource };
}

module.exports = { createMemoryFacade };
