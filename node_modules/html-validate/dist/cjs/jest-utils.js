'use strict';

var core = require('./core.js');
var node_worker_threads = require('node:worker_threads');
var coreNodejs = require('./core-nodejs.js');

function formatMessage(message, parentResult) {
  const type = message.severity === 2 ? "error" : "warning";
  const msg = message.message.replace(/([^ ])\.$/, "$1");
  const ruleId = `(${message.ruleId})`;
  const sourceCode = parentResult.source;
  const firstLine = [`${type}:`, msg, ruleId].join(" ");
  const result = [firstLine];
  if (sourceCode) {
    const output = core.codeFrameColumns(sourceCode, {
      start: core.getStartLocation(message),
      end: core.getEndLocation(message, sourceCode)
    });
    result.push(output);
  }
  result.push(`Selector: ${message.selector ?? "-"}`);
  return result.join("\n");
}
function codeframe(results) {
  let errors = 0;
  let warnings = 0;
  const resultsWithMessages = results.filter((result) => result.messages.length > 0);
  const output = resultsWithMessages.reduce((resultsOutput, result) => {
    const messages = result.messages.map((message) => {
      return `${formatMessage(message, result)}

`;
    });
    errors += result.errorCount;
    warnings += result.warningCount;
    return resultsOutput.concat(messages);
  }, []).join("\n");
  return errors + warnings > 0 ? output : "";
}

function isThenable(value) {
  return value && typeof value === "object" && "then" in value && typeof value.then === "function";
}

function diverge(fn) {
  function diverged(actual, ...args) {
    if (isThenable(actual)) {
      return actual.then((resolved) => fn.call(this, resolved, ...args));
    }
    return fn.call(this, actual, ...args);
  }
  return diverged;
}

const INT32_BYTES = 4;
const syncFnCache = /* @__PURE__ */ new Map();
const sharedBuffer = new SharedArrayBuffer(INT32_BYTES);
const sharedBufferView = new Int32Array(sharedBuffer, 0, 1);
function isWorkerError(value) {
  return "error" in value;
}
function receiveMessageWithId(port, expectedId) {
  const timeout = 3e4;
  const status = Atomics.wait(sharedBufferView, 0, 0, timeout);
  Atomics.store(sharedBufferView, 0, 0);
  if (!["ok", "not-equal"].includes(status)) {
    const abortMsg = {
      id: expectedId,
      cmd: "abort"
    };
    port.postMessage(abortMsg);
    throw new Error(`Internal error: Atomics.wait() failed: ${status}`);
  }
  const reply = node_worker_threads.receiveMessageOnPort(port);
  const { id, ...message } = reply.message;
  if (id < expectedId) {
    return receiveMessageWithId(port, expectedId);
  }
  if (expectedId !== id) {
    throw new Error(`Internal error: Expected id ${String(expectedId)} but got id ${String(id)}`);
  }
  return { id, ...message };
}
function startWorkerThread(workerPath) {
  const { port1: mainPort, port2: workerPort } = new node_worker_threads.MessageChannel();
  const workerPathUrl = coreNodejs.legacyRequire.resolve(workerPath);
  const worker = new node_worker_threads.Worker(workerPathUrl, {
    eval: false,
    workerData: { sharedBuffer, workerPort },
    transferList: [workerPort]
  });
  let nextID = 0;
  const syncFn = (...args) => {
    const id = nextID++;
    const msg = { id, args };
    worker.postMessage(msg);
    const reply = receiveMessageWithId(mainPort, id);
    if (isWorkerError(reply)) {
      throw new Error(reply.error);
    }
    return reply.result;
  };
  worker.unref();
  return syncFn;
}
function createSyncFn(workerPath) {
  const cachedSyncFn = syncFnCache.get(workerPath);
  if (cachedSyncFn) {
    return cachedSyncFn;
  }
  const syncFn = startWorkerThread(workerPath);
  syncFnCache.set(workerPath, syncFn);
  return syncFn;
}

exports.codeframe = codeframe;
exports.createSyncFn = createSyncFn;
exports.diverge = diverge;
exports.isThenable = isThenable;
//# sourceMappingURL=jest-utils.js.map
