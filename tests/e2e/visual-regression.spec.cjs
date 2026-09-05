// Visual regression — screenshot key pages in desktop + mobile viewports.
const { test, expect } = require('@playwright/test');

const PAGES = [
  { path: '/', name: 'home' },
  { path: '/blog/', name: 'blog' },
  { path: '/about/', name: 'about' },
  { path: '/awesome/', name: 'awesome' },
  { path: '/repositories/', name: 'repositories' },
  { path: '/gists/', name: 'gists' },
  { path: '/knowledge-graph/', name: 'knowledge-graph' },
  { path: '/search/', name: 'search' },
  { path: '/404.html', name: '404' },
];

test.describe('Visual regression', () => {
  for (const p of PAGES) {
    test(`${p.name} (${p.path}) — no console errors & renders`, async ({ page }) => {
      const errors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      const resp = await page.goto(p.path);
      expect(resp.status()).toBeLessThan(400);
      // Wait for first meaningful paint
      await page.waitForLoadState('load');
      await page.waitForTimeout(500);
      // No console errors
      expect(errors).toEqual([]);
      // Screenshot for visual diff
      await expect(page).toHaveScreenshot(`${p.name}.png`, {
        fullPage: false,
        threshold: 0.2,
      });
    });
  }
});
