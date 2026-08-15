// Babel config (CJS) — transforms ESM src/tests to CJS for Jest 29 on Node 24
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }]
  ],
  // Only transform our own ESM; node_modules left alone
  ignore: [/node_modules/]
};