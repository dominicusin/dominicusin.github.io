'use strict';

var core = require('./core.js');
require('ajv');
require('./elements.js');
require('./meta-helper.js');
require('./utils/natural-join.js');
require('./utils/parse-image-candidate-string.js');
require('@sidvind/better-ajv-errors');
require('semver');
require('kleur');
require('@html-validate/stylish');



exports.a11y = core.config;
exports.browser = core.config$1;
exports.document = core.config$2;
exports.prettier = core.config$3;
exports.recommended = core.config$4;
exports.standard = core.config$5;
//# sourceMappingURL=presets.js.map
