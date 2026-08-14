'use strict';

var node_worker_threads = require('node:worker_threads');
var coreNodejs = require('./core-nodejs.js');
require('node:path');
require('./core.js');
require('ajv');
require('./elements.js');
require('./meta-helper.js');
require('./utils/natural-join.js');
require('./utils/parse-image-candidate-string.js');
require('@sidvind/better-ajv-errors');
require('semver');
require('kleur');
require('@html-validate/stylish');
require('node:fs');
require('node:fs/promises');
require('node:url');

function runAsWorker(fn) {
  if (!node_worker_threads.workerData) {
    return;
  }
  const { workerPort, sharedBuffer } = node_worker_threads.workerData;
  const sharedBufferView = new Int32Array(sharedBuffer, 0, 1);
  node_worker_threads.parentPort.on("message", ({ id, args }) => {
    async function inner() {
      let isAborted = false;
      const handleAbortMessage = (msg2) => {
        if (msg2.id === id && msg2.cmd === "abort") {
          isAborted = true;
        }
      };
      workerPort.on("message", handleAbortMessage);
      let msg;
      try {
        msg = { id, result: await fn(...args) };
      } catch (error) {
        msg = {
          id,
          error: error instanceof Error ? error.message : String(error)
        };
      }
      workerPort.off("message", handleAbortMessage);
      if (isAborted) {
        return;
      }
      workerPort.postMessage(msg);
      Atomics.add(sharedBufferView, 0, 1);
      Atomics.notify(sharedBufferView, 0);
    }
    inner();
  });
}
function validateString(markup, filename, config) {
  const loader = new coreNodejs.FileSystemConfigLoader({
    extends: ["html-validate:recommended"]
  });
  const htmlvalidate = new coreNodejs.HtmlValidate(loader);
  return htmlvalidate.validateString(markup, filename, config);
}
runAsWorker(validateString);
//# sourceMappingURL=vitest-worker.js.map
