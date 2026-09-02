'use strict';

/**
 * M2-002: Implementer Worker
 *
 * Deterministic adapter that applies template-based transformations
 * to task artifacts. Does NOT call external LLM — can be replaced
 * with LLM calls later.
 *
 * For now: reads task.artifacts, applies simple transformations
 * (append/update), returns WorkerResult.
 */

const fs = require('fs');
const path = require('path');

/**
 * Generate a deterministic marker line for a task.
 * @param {Object} task
 * @returns {string}
 */
function generateMarker(task) {
  const taskId = task.id || 'unknown';
  const timestamp = new Date().toISOString();
  return `// Implemented by agent: ${taskId} at ${timestamp}`;
}

/**
 * Generate content for a new file based on task requirements.
 * @param {Object} task
 * @param {string} artifactPath
 * @returns {string}
 */
function generateContent(task, artifactPath) {
  const ext = path.extname(artifactPath);
  const taskId = task.id || 'unknown';
  const title = task.title || 'Untitled task';
  const requirements = task.requirements || 'No specific requirements';

  switch (ext) {
    case '.js':
    case '.cjs':
    case '.mjs':
    case '.ts':
      return `// ${title}\n// Task: ${taskId}\n// Requirements: ${requirements}\n\nmodule.exports = {};\n`;
    case '.json':
      return JSON.stringify({
        task: taskId,
        title: title,
        requirements: requirements,
        generated: new Date().toISOString()
      }, null, 2);
    case '.md':
      return `# ${title}\n\n> Task: ${taskId}\n> Requirements: ${requirements}\n\n`;
    case '.txt':
      return `${title}\nTask: ${taskId}\nRequirements: ${requirements}\n`;
    default:
      return `# ${title}\n# Task: ${taskId}\n# Requirements: ${requirements}\n`;
  }
}

/**
 * Apply transformation to a file.
 * @param {string} filePath - absolute path to file
 * @param {Object} task
 * @returns {boolean} true if file was modified/created
 */
function applyTransformation(filePath, task) {
  const dir = path.dirname(filePath);

  // Ensure directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const exists = fs.existsSync(filePath);
  const marker = generateMarker(task);

  if (exists) {
    // Append marker to existing file
    const content = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath);
    let separator = '\n';

    // Use comment style appropriate for file type
    if (['.js', '.cjs', '.mjs', '.ts', '.json'].includes(ext)) {
      separator = '\n';
    }

    fs.writeFileSync(filePath, content + separator + marker + '\n', 'utf8');
    return true;
  } else {
    // Create new file with generated content
    const content = generateContent(task, filePath);
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
}

/**
 * Verify that a file exists and is readable.
 * @param {string} filePath
 * @returns {{ command: string, exit_code: number }}
 */
function verifyFile(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return { command: `test -r ${filePath}`, exit_code: 0 };
  } catch {
    return { command: `test -r ${filePath}`, exit_code: 1 };
  }
}

/**
 * Main implementer function.
 * @param {Object} params
 * @param {Object} params.task - task from Beads graph
 * @param {string} params.workspace - workspace path
 * @returns {Promise<WorkerResult>}
 */
async function implementTask({ task, workspace }) {
  // Validate inputs
  if (!task || typeof task !== 'object') {
    return {
      status: 'failed',
      changes: { files: [], summary: 'Invalid task: task is null or not an object' },
      verification: [],
      evidence: [],
      risks: ['Task object is null or undefined'],
      next_action: 'escalate'
    };
  }

  if (!Array.isArray(task.artifacts) || task.artifacts.length === 0) {
    return {
      status: 'failed',
      changes: { files: [], summary: 'No artifacts specified in task' },
      verification: [],
      evidence: [],
      risks: ['Task has no artifacts to implement'],
      next_action: 'escalate'
    };
  }

  if (!workspace || typeof workspace !== 'string') {
    return {
      status: 'failed',
      changes: { files: [], summary: 'Invalid workspace path' },
      verification: [],
      evidence: [],
      risks: ['Workspace path is invalid'],
      next_action: 'escalate'
    };
  }

  // Check workspace exists
  if (!fs.existsSync(workspace)) {
    return {
      status: 'failed',
      changes: { files: [], summary: `Workspace does not exist: ${workspace}` },
      verification: [],
      evidence: [],
      risks: [`Workspace path does not exist: ${workspace}`],
      next_action: 'escalate'
    };
  }

  const modifiedFiles = [];
  const verification = [];
  const risks = [];

  try {
    for (const artifact of task.artifacts) {
      // SECURITY: Resolve and validate path is within workspace
      const artifactPath = path.resolve(workspace, artifact);
      const relativePath = path.relative(workspace, artifactPath);

      // Prevent path traversal
      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        risks.push(`Skipped path traversal attempt: ${artifact}`);
        continue;
      }

      const success = applyTransformation(artifactPath, task);
      if (success) {
        modifiedFiles.push(artifact);
        verification.push(verifyFile(artifactPath));
      }
    }

    if (modifiedFiles.length === 0) {
      return {
        status: 'failed',
        changes: { files: [], summary: 'No files were modified' },
        verification,
        evidence: [],
        risks: risks.length > 0 ? risks : ['No artifacts could be processed'],
        next_action: 'escalate'
      };
    }

    return {
      status: 'success',
      changes: {
        files: modifiedFiles,
        summary: `Implemented task ${task.id || 'unknown'}: modified ${modifiedFiles.length} file(s) - ${modifiedFiles.join(', ')}`
      },
      verification,
      evidence: [`Task requirements: ${task.requirements || 'none'}`],
      risks,
      next_action: 'review'
    };
  } catch (err) {
    return {
      status: 'failed',
      changes: { files: modifiedFiles, summary: `Error during implementation: ${err.message}` },
      verification,
      evidence: [],
      risks: [`Implementation error: ${err.message}`],
      next_action: 'escalate'
    };
  }
}

module.exports = { implementTask };

// CLI support for testing
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length >= 2) {
    const workspace = args[0];
    const taskJson = args[1];
    try {
      const task = JSON.parse(taskJson);
      implementTask({ task, workspace }).then(result => {
        console.log(JSON.stringify(result, null, 2));
      });
    } catch (e) {
      console.error('Error parsing task JSON:', e.message);
      process.exit(1);
    }
  } else {
    console.log('Usage: node implementer.cjs <workspace> <task-json>');
  }
}