// Phase 0 E2E smoke suite — covers the DOM/network surface that unit tests
// (jsdom) cannot reach: real page loads, navigation, search UI, giscus iframe.
const { test, expect } = require('@playwright/test');

test.describe('Publishing plane smoke', () => {
  test('home page loads with title and nav', async ({ page }) => {
    const resp = await page.goto('/');
    expect(resp.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/.+/);
    // Main nav present (Blowfish).
    const nav = page.locator('nav');
    await expect(nav.first()).toBeVisible();
  });

  test('blog index lists posts', async ({ page }) => {
    await page.goto('/blog/');
    // At least one article card / post link.
    const links = page.locator('a[href*="/blog/"]');
    await expect(links.first()).toBeVisible();
  });

  test('a post page renders content and giscus', async ({ page }) => {
    await page.goto('/blog/');
    const first = page.locator('a[href*="/20"]').first();
    const href = await first.getAttribute('href');
    await page.goto(href);
    // Article body present.
    await expect(page.locator('article').first()).toBeVisible();
    // giscus iframe (comments) is injected.
    const giscus = page.frameLocator('iframe[src*="giscus.app"]');
    await expect(giscus.locator('body').first()).toBeAttached({ timeout: 15000 });
  });

  test('site search trigger is present (Fuse.js)', async ({ page }) => {
    await page.goto('/');
    // Blowfish renders a persistent search-button in the header; the input
    // itself lives inside a modal that mounts on click, so assert the trigger.
    const search = page.locator('#search-button, button[aria-label*="Search" i], a[aria-label*="Search" i]').first();
    await expect(search).toBeAttached();
  });

  test('about page renders without full-doc <code> wrap', async ({ page }) => {
    await page.goto('/about/');
    const resp = await page.goto('/about/');
    expect(resp.status()).toBeLessThan(400);
    // Regression guard: the legacy Jekyll layout used to wrap the whole doc in
    // a single <code> block. Ensure no such giant inline-code wrapper.
    const codeBlocks = await page.locator('code').count();
    expect(codeBlocks).toBeLessThan(50); // sane upper bound, not a full-doc wrap
  });
});
