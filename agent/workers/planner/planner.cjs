'use strict';

/**
 * Planner Agent — M3-009
 * Creates atomic task plans from initiatives.
 */

class PlannerAgent {
  constructor({ repository, beads }) {
    this.repository = repository;
    this.beads = beads;
  }

  createPlan({ initiative, state, constraints = {} }) {
    const tasks = [];
    const edges = [];

    const epics = this._identifyEpics(initiative);

    for (const epic of epics) {
      const epicTasks = this._breakDownEpic(epic, state, constraints);
      tasks.push(...epicTasks);

      for (let i = 1; i < epicTasks.length; i++) {
        edges.push({
          from: epicTasks[i - 1].id,
          to: epicTasks[i].id
        });
      }
    }

    const crossDeps = this._identifyCrossDependencies(tasks, constraints);
    edges.push(...crossDeps);

    return {
      initiative: initiative.id,
      tasks,
      edges,
      metadata: {
        totalTasks: tasks.length,
        totalEdges: edges.length,
        estimatedRisk: this._estimateRisk(tasks)
      }
    };
  }

  _identifyEpics(initiative) {
    const epics = [];
    const epicPatterns = [
      { id: 'research', title: 'Research & Analysis', keywords: ['research', 'analyze', 'investigate'] },
      { id: 'design', title: 'Design & Architecture', keywords: ['design', 'architecture', 'plan'] },
      { id: 'implementation', title: 'Implementation', keywords: ['implement', 'build', 'create'] },
      { id: 'testing', title: 'Testing & Validation', keywords: ['test', 'validate', 'verify'] },
      { id: 'documentation', title: 'Documentation', keywords: ['document', 'write', 'update'] }
    ];

    const description = (initiative.description || '').toLowerCase();

    for (const pattern of epicPatterns) {
      if (pattern.keywords.some(kw => description.includes(kw))) {
        epics.push(pattern);
      }
    }

    if (epics.length === 0) {
      epics.push(epicPatterns[2]);
    }

    return epics;
  }

  _breakDownEpic(epic, state, constraints) {
    const tasks = [];
    const baseId = epic.id.toUpperCase();

    switch (epic.id) {
      case 'research':
        tasks.push(
          { id: baseId + '-001', title: 'Gather requirements', risk: 'R0', artifacts: [] },
          { id: baseId + '-002', title: 'Analyze existing code', risk: 'R0', artifacts: [] }
        );
        break;
      case 'design':
        tasks.push(
          { id: baseId + '-001', title: 'Create design document', risk: 'R0', artifacts: ['docs/adr/'] }
        );
        break;
      case 'implementation':
        tasks.push(
          { id: baseId + '-001', title: 'Implement core logic', risk: 'R1', artifacts: ['src/'] },
          { id: baseId + '-002', title: 'Add tests', risk: 'R1', artifacts: ['tests/'] }
        );
        break;
      case 'testing':
        tasks.push(
          { id: baseId + '-001', title: 'Run unit tests', risk: 'R1', artifacts: [] }
        );
        break;
      case 'documentation':
        tasks.push(
          { id: baseId + '-001', title: 'Update README', risk: 'R0', artifacts: ['README.md'] }
        );
        break;
      default:
        tasks.push({ id: baseId + '-001', title: epic.title, risk: 'R1', artifacts: [] });
    }

    return tasks;
  }

  _identifyCrossDependencies(tasks, constraints) {
    const deps = [];
    const researchTasks = tasks.filter(t => t.id.startsWith('RESEARCH'));
    const implTasks = tasks.filter(t => t.id.startsWith('IMPLEMENTATION'));

    if (researchTasks.length > 0 && implTasks.length > 0) {
      deps.push({
        from: researchTasks[researchTasks.length - 1].id,
        to: implTasks[0].id
      });
    }

    return deps;
  }

  _estimateRisk(tasks) {
    const riskScores = { R0: 0, R1: 1, R2: 2, R3: 3, R4: 4 };
    const total = tasks.reduce((sum, t) => sum + (riskScores[t.risk] || 0), 0);
    const average = total / tasks.length;

    if (average >= 3) return 'R4';
    if (average >= 2) return 'R3';
    if (average >= 1) return 'R2';
    if (average >= 0.5) return 'R1';
    return 'R0';
  }
}

module.exports = { PlannerAgent };
