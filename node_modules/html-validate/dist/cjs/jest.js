'use strict';

var globals = require('@jest/globals');
var jestMatchers = require('./jest-matchers.js');
require('./jest-utils.js');
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
require('node:worker_threads');
require('./core-nodejs.js');
require('node:path');
require('node:fs');
require('node:fs/promises');
require('node:url');
require('jest-snapshot');

globals.expect.extend({
  toBeValid: jestMatchers.createMatcher$6(),
  toBeInvalid: jestMatchers.createMatcher$5(),
  toHTMLValidate: jestMatchers.createMatcher$4(globals.expect),
  toHaveError: jestMatchers.createMatcher$3(globals.expect),
  toHaveErrors: jestMatchers.createMatcher$2(globals.expect),
  toMatchCodeframe: jestMatchers.createMatcher$1(),
  toMatchInlineCodeframe: jestMatchers.createMatcher()
});
//# sourceMappingURL=jest.js.map
