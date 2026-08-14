/**
 * Jest Configuration for Engineering Blog v3.0
 * Optimized for Edge AI, Web Workers, and Service Workers testing
 */

module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/integration/**/*.test.js',
    '**/tests/e2e/**/*.test.js',
    '**/tests/a11y/**/*.test.js',
    '**/tests/performance/**/*.test.js'
  ],
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.mjs$': 'babel-jest'
  },
  moduleNameMapper: {
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@components/(.*)$': '<rootDir>/_includes/$1',
    '^@scripts/(.*)$': '<rootDir>/scripts/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'src/services/**/*.js',
    'scripts/**/*.js',
    '!src/services/worker-pool.js', // Workers tested separately
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  testTimeout: 30000,
  verbose: true,
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  
  // Mock service workers and web workers
  setupFiles: ['<rootDir>/tests/mocks/workers-mock.js']
};
