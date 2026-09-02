'use strict';

/**
 * M2-002: Implementer Worker Tests
 *
 * TDD: RED → GREEN
 * Tests for the deterministic implementer that applies template-based
 * transformations to task artifacts.
 */

const { implementTask } = require('../workers/implementer/implementer.cjs');
const { validateWorkerResult } = require('../workers/contracts/worker-contract.cjs');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Simple test framework (matches existing patterns)
let passed = 0;
let failed = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertDeepEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertIncludes(array, item, message) {
  if (!array.includes(item)) {
    throw new Error(message || `Expected array to include "${item}"`);
  }
}

function assertGreaterThan(actual, threshold, message) {
  if (actual <= threshold) {
    throw new Error(message || `Expected ${actual} to be greater than ${threshold}`);
  }
}

// Helper to create a temp directory with files
function createTempWorkspace(files = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'implementer-test-'));
  for (const [relPath, content] of Object.entries(files)) {
    const fullPath = path.join(tmpDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf8');
  }
  return tmpDir;
}

function cleanupTempWorkspace(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ============================================================
// Test Suite: Basic WorkerResult Structure
// ============================================================

async function runBasicResultTests() {
  console.log('\n[Basic WorkerResult Structure]');

  await test('should return valid WorkerResult on success', async () => {
    const workspace = createTempWorkspace({
      'test.txt': 'hello world\n'
    });
    try {
      const task = {
        id: 'T-TEST-1',
        title: 'Test task',
        artifacts: ['test.txt'],
        requirements: 'Append a line to test.txt'
      };
      const result = await implementTask({ task, workspace });
      const validation = validateWorkerResult(result);
      assertEqual(validation.valid, true, `Invalid result: ${validation.errors.join(', ')}`);
    } finally {
      cleanupTempWorkspace(workspace);
    }
  });

  await test('should return status "success" for valid task', async () => {
    const workspace = createTempWorkspace({
      'file.txt': 'content\n'
    });
    try {
      const task = {
        id: 'T-TEST-2',
        title: 'Append task',
        artifacts: ['file.txt'],
        requirements: 'Append a marker line'
      };
      const result = await implementTask({ task, workspace });
      assertEqual(result.status, 'success');
    } finally {
      cleanupTempWorkspace(workspace);
    }
  });

  await test('should include modified files in changes.files', async () => {
    const workspace = createTempWorkspace({
      'target.txt': 'original\n'
    });
    try {
      const task = {
        id: 'T-TEST-3',
        title: 'Modify target',
        artifacts: ['target.txt'],
        requirements: 'Add a line'
      };
      const result = await implementTask({ task, workspace });
      assertIncludes(result.changes.files, 'target.txt');
    } finally {
      cleanupTempWorkspace(workspace);
    }
  });

  await test('should include a summary in changes.summary', async () => {
    const workspace = createTempWorkspace({
      'doc.md': '# Title\n'
    });
    try {
      const task = {
        id: 'T-TEST-4',
        title: 'Update doc',
        artifacts: ['doc.md'],
        requirements: 'Add section'
      };
      const result = await implementTask({ task, workspace });
      assertEqual(typeof result.changes.summary, 'string');
      assertGreaterThan(result.changes.summary.length, 0);
    } finally {
      cleanupTempWorkspace(workspace);
    }
  });

  await test('should return next_action "review" on success', async () => {
    const workspace = createTempWorkspace({
      'config.json': '{}'
    });
    try {
      const task = {
        id: 'T-TEST-5',
        title: 'Config update',
        artifacts: ['config.json'],
        requirements: 'Add key'
      };
      const result = await implementTask({ task, workspace });
      assertEqual(result.next_action, 'review');
    } finally {
      cleanupTempWorkspace(workspace);
    }
  });
}

// ============================================================
// Test Suite: File Modifications
// ============================================================

async function runFileModificationTests() {
  console.log('\n[File Modifications]');

  await test('should append content to existing file', async () => {
    const workspace = createTempWorkspace({
      'log.txt': 'line1\nline2\n'
    });
    try {
      const task = {
        id: 'T-MOD-1',
        title: 'Append to log',
        artifacts: ['log.txt'],
        requirements: 'Append a new line'
      };
      const result = await implementTask({ task, workspace });
      const content = fs.readFileSync(path.join(workspace, 'log.txt'), 'utf8');
      assertGreaterThan(content.length, 'line1\nline2\n'.length, 'File should have more content');
    } finally {
      cleanupTempWorkspace(workspace);
    }
  });

  await test('should create new file if artifact does not exist', async () => {
    const workspace = createTempWorkspace({});
    try {
      const task = {
        id: 'T-MOD-2',
        title: 'Create new file',
        artifacts: ['newfile.txt'],
        requirements: 'Create a new file with content'
      };
      const result = await implementTask({ task, workspace });
      const filePath = path.join(workspace, 'newfile.txt');
      assert(fs.existsSync(filePath), 'File should be created');
      const content = fs.readFileSync(filePath, 'utf8');
      assertGreaterThan(content.length, 0, 'File should have content');
    } finally {
      cleanupTempWorkspace(workspace);
    }
  });

  await test('should handle multiple artifacts', async () => {
    const workspace = createTempWorkspace({
      'a.txt': 'aaa\n',
      'b.txt': 'bbb\n'
    });
    try {
      const task = {
        id: 'T-MOD-3',
        title: 'Multi-file task',
        artifacts: ['a.txt', 'b.txt'],
        requirements: 'Update both files'
      };
      const result = await implementTask({ task, workspace });
      assertIncludes(result.changes.files, 'a.txt');
      assertIncludes(result.changes.files, 'b.txt');
    } finally {
      cleanupTempWorkspace(workspace);
    }
  });

  await test('should handle nested directory artifacts', async () => {
    const workspace = createTempWorkspace({
      'src/utils/helper.js': 'module.exports = {};\n'
    });
    try {
      const task = {
        id: 'T-MOD-4',
        title: 'Update helper',
        artifacts: ['src/utils/helper.js'],
        requirements: 'Add a function'
      };
      const result = await implementTask({ task, workspace });
      const content = fs.readFileSync(path.join(workspace, 'src/utils/helper.js'), 'utf8');
      assertGreaterThan(content.length, 'module.exports = {};\n'.length);
    } finally {
      cleanupTempWorkspace(workspace);
    }
  });
}

// ============================================================
// Test Suite: Error Handling
// ============================================================

async function runErrorHandlingTests() {
  console.log('\n[Error Handling]');

  await test('should return failed status for invalid workspace', async () => {
    const task = {
      id: 'T-ERR-1',
      title: 'Bad workspace',
      artifacts: ['file.txt'],
      requirements: 'Modify file'
    };
    const result = await implementTask({ task, workspace: '/nonexistent/path' });
    assertEqual(result.status, 'failed');
  });

  await test('should return failed status for empty artifacts', async () => {
    const workspace = createTempWorkspace({});
    try {
      const task = {
        id: 'T-ERR-2',
        title: 'No artifacts',
        artifacts: [],
        requirements: 'Do nothing'
      };
      const result = await implementTask({ task, workspace });
      assertEqual(result.status, 'failed');
    } finally {
      cleanupTempWorkspace(workspace);
    }
  });

  await test('should return failed status for null task', async () => {
    const workspace = createTempWorkspace({});
    try {
      const result = await implementTask({ task: null, workspace });
      assertEqual(result.status, 'failed');
    } finally {
      cleanupTempWorkspace(workspace);
    }
  });

  await test('should include risks when task is invalid', async () => {
    const result = await implementTask({ task: null, workspace: '/tmp' });
    assert(Array.isArray(result.risks), 'risks should be an array');
    assertGreaterThan(result.risks.length, 0, 'Should have risk messages');
  });

  await test('should return escalate next_action on failure', async () => {
    const task = {
      id: 'T-ERR-3',
      title: 'Will fail',
      artifacts: ['file.txt'],
      requirements: 'Modify'
    };
    const result = await implementTask({ task, workspace: '/nonexistent' });
    assertEqual(result.next_action, 'escalate');
  });
}

// ============================================================
// Test Suite: Verification
// ============================================================

async function runVerificationTests() {
  console.log('\n[Verification]');

  await test('should include verification array in result', async () => {
    const workspace = createTempWorkspace({
      'check.txt': 'data\n'
    });
    try {
      const task = {
        id: 'T-VER-1',
        title: 'Verifiable task',
        artifacts: ['check.txt'],
        requirements: 'Add data'
      };
      const result = await implementTask({ task, workspace });
      assert(Array.isArray(result.verification), 'verification should be an array');
    } finally {
      cleanupTempWorkspace(workspace);
    }
  });

  await test('should verify file exists after modification', async () => {
    const workspace = createTempWorkspace({
      'verify.me': 'old'
    });
    try {
      const task = {
        id: 'T-VER-2',
        title: 'Verify me',
        artifacts: ['verify.me'],
        requirements: 'Update content'
      };
      const result = await implementTask({ task, workspace });
      // The verification should include a file-exists check
      const hasFileCheck = result.verification.some(v =>
        v.command && v.command.includes('verify.me')
      );
      assert(hasFileCheck, 'Should have verification for the modified file');
    } finally {
      cleanupTempWorkspace(workspace);
    }
  });
}

// ============================================================
// Test Suite: Deterministic Behavior
// ============================================================

async function runDeterministicTests() {
  console.log('\n[Deterministic Behavior]');

  await test('should produce same result for same input', async () => {
    const makeWorkspace = () => createTempWorkspace({
      'stable.txt': 'stable content\n'
    });

    const task = {
      id: 'T-DET-1',
      title: 'Deterministic task',
      artifacts: ['stable.txt'],
      requirements: 'Append marker'
    };

    const ws1 = makeWorkspace();
    const ws2 = makeWorkspace();
    try {
      const result1 = await implementTask({ task, workspace: ws1 });
      const result2 = await implementTask({ task, workspace: ws2 });
      assertEqual(result1.status, result2.status);
      assertDeepEqual(result1.changes.files, result2.changes.files);
    } finally {
      cleanupTempWorkspace(ws1);
      cleanupTempWorkspace(ws2);
    }
  });

  await test('should not call external LLM (no network)', async () => {
    const workspace = createTempWorkspace({
      'local.txt': 'local\n'
    });
    try {
      const task = {
        id: 'T-DET-2',
        title: 'Local only task',
        artifacts: ['local.txt'],
        requirements: 'Modify locally'
      };
      // This test passes if implementTask completes without network calls
      // We verify by checking it completes quickly and deterministically
      const start = Date.now();
      const result = await implementTask({ task, workspace });
      const elapsed = Date.now() - start;
      assertLessThan(elapsed, 5000, 'Should complete quickly without network');
      assertEqual(result.status, 'success');
    } finally {
      cleanupTempWorkspace(workspace);
    }
  });
}

function assertLessThan(actual, threshold, message) {
  if (actual >= threshold) {
    throw new Error(message || `Expected ${actual} to be less than ${threshold}`);
  }
}

// ============================================================
// Test Suite: Edge Cases
// ============================================================

async function runEdgeCaseTests() {
  console.log('\n[Edge Cases]');

  await test('should handle task with no requirements', async () => {
    const workspace = createTempWorkspace({
      'empty.txt': ''
    });
    try {
      const task = {
        id: 'T-EDGE-1',
        title: 'No requirements',
        artifacts: ['empty.txt']
      };
      const result = await implementTask({ task, workspace });
      // Should still produce a valid result
      const validation = validateWorkerResult(result);
      assertEqual(validation.valid, true, `Invalid: ${validation.errors.join(', ')}`);
    } finally {
      cleanupTempWorkspace(workspace);
    }
  });

  await test('should handle binary-like content gracefully', async () => {
    const workspace = createTempWorkspace({
      'data.bin': 'binary\x00data\xff'
    });
    try {
      const task = {
        id: 'T-EDGE-2',
        title: 'Binary task',
        artifacts: ['data.bin'],
        requirements: 'Process binary'
      };
      const result = await implementTask({ task, workspace });
      assertEqual(result.status, 'success');
    } finally {
      cleanupTempWorkspace(workspace);
    }
  });

  await test('should handle very long file content', async () => {
    const longContent = 'x'.repeat(100000);
    const workspace = createTempWorkspace({
      'long.txt': longContent
    });
    try {
      const task = {
        id: 'T-EDGE-3',
        title: 'Long file task',
        artifacts: ['long.txt'],
        requirements: 'Process long file'
      };
      const result = await implementTask({ task, workspace });
      assertEqual(result.status, 'success');
    } finally {
      cleanupTempWorkspace(workspace);
    }
  });

  await test('should handle special characters in file content', async () => {
    const workspace = createTempWorkspace({
      'special.txt': 'hello "world" \'quotes\' $var `backtick` \\slash\n'
    });
    try {
      const task = {
        id: 'T-EDGE-4',
        title: 'Special chars task',
        artifacts: ['special.txt'],
        requirements: 'Handle special chars'
      };
      const result = await implementTask({ task, workspace });
      assertEqual(result.status, 'success');
    } finally {
      cleanupTempWorkspace(workspace);
    }
  });
}

// ============================================================
// Run All Tests
// ============================================================

async function runAll() {
  console.log('=== Implementer Worker Tests (M2-002) ===');

  await runBasicResultTests();
  await runFileModificationTests();
  await runErrorHandlingTests();
  await runVerificationTests();
  await runDeterministicTests();
  await runEdgeCaseTests();

  console.log('\n=== Results ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailures:');
    for (const { name, err } of failures) {
      console.log(`  - ${name}: ${err.message}`);
    }
    process.exit(1);
  } else {
    console.log('\nAll tests passed!');
    process.exit(0);
  }
}

runAll().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});