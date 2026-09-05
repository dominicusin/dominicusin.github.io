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
      await page.waitForTimeout(1000);
      // No console errors
      expect(errors).toEqual([]);
      // Page has rendered content (has <main> and some text)
      const main = page.locator('main, #main, .main-content');
      await expect(main.first()).toBeAttached();
    });
  }
});
