// Playwright E2E configuration (Phase 0: DOM/network service coverage layer)
// Local run requires: npx playwright install chromium
// CI: .github/workflows/e2e.yml builds Hugo and runs this suite.
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['html', { outputFolder: 'playwright-report' }], ['list']] : 'list',

  use: {
    baseURL: 'http://localhost:1313',
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // Hugo dev server as the test target (single binary, no extra deps).
  webServer: {
    command: 'hugo server --port 1313 --baseURL http://localhost:1313/ --bind 127.0.0.1',
    url: 'http://localhost:1313/',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
