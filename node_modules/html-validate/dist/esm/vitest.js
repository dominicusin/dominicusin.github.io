import { expect } from 'vitest';
import { c as createMatcher, a as createMatcher$1, b as createMatcher$2, d as createMatcher$3, e as createMatcher$4, f as createMatcher$5, g as createMatcher$6 } from './vitest-matchers.js';
import './vitest-utils.js';
import './core.js';
import 'ajv';
import './elements.js';
import './meta-helper.js';
import './utils/natural-join.js';
import './utils/parse-image-candidate-string.js';
import '@sidvind/better-ajv-errors';
import 'semver';
import 'kleur';
import '@html-validate/stylish';
import './core-nodejs.js';
import 'node:path';
import 'node:fs';
import 'node:fs/promises';
import 'node:url';
import 'node:module';
import 'node:worker_threads';

expect.extend({
  toBeValid: createMatcher$6(),
  toBeInvalid: createMatcher$5(),
  toHTMLValidate: createMatcher$4(expect),
  /* @ts-expect-error technical debt, vitest/jest types clashes */
  toHaveError: createMatcher$3(expect),
  toHaveErrors: createMatcher$2(expect),
  toMatchCodeframe: createMatcher$1(),
  toMatchInlineCodeframe: createMatcher()
});
//# sourceMappingURL=vitest.js.map
