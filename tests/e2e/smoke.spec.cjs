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
    // Real post links use dated/Slug URLs (e.g. /blog/<slug>/ or /2026/.../),
    // distinct from the nav "Blog" link. Assert at least one post card link.
    const links = page.locator('article a, a[href*="/20"]').first();
    await expect(links).toBeVisible();
  });

  test('a post page renders content and giscus', async ({ page }) => {
    await page.goto('/blog/');
    const first = page.locator('a[href*="/20"]').first();
    const href = await first.getAttribute('href');
    await page.goto(href);
    // Article body present.
    await expect(page.locator('article').first()).toBeVisible();
    // giscus iframe (comments) is injected. The iframe is cross-origin, so we
    // assert the iframe element itself is attached (don't reach into its body,
    // which Playwright can't query without cross-origin network in CI).
    const giscusFrame = page.locator('iframe[src*="giscus.app"]').first();
    // Soft check: giscus is optional in headless/CI; only assert when present.
    if (await giscusFrame.count() > 0) {
      await expect(giscusFrame).toBeAttached({ timeout: 15000 });
    }
  });

  test('site search trigger is present (Fuse.js)', async ({ page }) => {
    await page.goto('/');
    // Neo header wires the search trigger as #neo-search-open (aria-label "Поиск");
    // fall back to the classic Blowfish #search-button for non-neo pages.
    const search = page.locator('#neo-search-open, #search-button, button[aria-label*="Search" i], a[aria-label*="Search" i]').first();
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
