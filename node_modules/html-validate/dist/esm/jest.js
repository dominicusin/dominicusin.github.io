import { expect } from '@jest/globals';
import { c as createMatcher, a as createMatcher$1, b as createMatcher$2, d as createMatcher$3, e as createMatcher$4, f as createMatcher$5, g as createMatcher$6 } from './jest-matchers.js';
import './jest-utils.js';
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
import 'node:worker_threads';
import './core-nodejs.js';
import 'node:path';
import 'node:fs';
import 'node:fs/promises';
import 'node:url';
import 'node:module';
import 'jest-snapshot';

expect.extend({
  toBeValid: createMatcher$6(),
  toBeInvalid: createMatcher$5(),
  toHTMLValidate: createMatcher$4(expect),
  toHaveError: createMatcher$3(expect),
  toHaveErrors: createMatcher$2(expect),
  toMatchCodeframe: createMatcher$1(),
  toMatchInlineCodeframe: createMatcher()
});
//# sourceMappingURL=jest.js.map
