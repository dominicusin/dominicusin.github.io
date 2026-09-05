// Playwright config — visual regression + smoke tests for key pages.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:1313',
    headless: true,
    viewport: { width: 1280, height: 800 },
    screenshot: 'on',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { viewport: { width: 375, height: 667 } } },
  ],
  webServer: {
    command: 'hugo server -p 1313',
    port: 1313,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
