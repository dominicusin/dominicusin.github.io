'use strict';

var vitest = require('vitest');
var vitestMatchers = require('./vitest-matchers.js');
require('./vitest-utils.js');
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
require('./core-nodejs.js');
require('node:path');
require('node:fs');
require('node:fs/promises');
require('node:url');
require('node:worker_threads');

vitest.expect.extend({
  toBeValid: vitestMatchers.createMatcher$6(),
  toBeInvalid: vitestMatchers.createMatcher$5(),
  toHTMLValidate: vitestMatchers.createMatcher$4(vitest.expect),
  /* @ts-expect-error technical debt, vitest/jest types clashes */
  toHaveError: vitestMatchers.createMatcher$3(vitest.expect),
  toHaveErrors: vitestMatchers.createMatcher$2(vitest.expect),
  toMatchCodeframe: vitestMatchers.createMatcher$1(),
  toMatchInlineCodeframe: vitestMatchers.createMatcher()
});
//# sourceMappingURL=vitest.js.map
