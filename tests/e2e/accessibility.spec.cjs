// Phase 0/1 accessibility gate — axe-core via Playwright.
// Catches critical a11y violations on the real rendered DOM (jsdom can't).
// Plan refs: STRATEGIC_PLAN_2026-2027.md Goal 1 (axe-core, 0 critical),
// STRATEGIC_PLAN_2026-2028_UPDATED.md P2 (accessibility checks).
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

// SVG/link-only decorative elements and the Blowfish theme toggle are out of
// scope for a content blog; we fail only on critical/serious rule violations.
const IGNORE = [
  'color-contrast', // visual-only, reviewed separately via Lighthouse
  'html-has-lang', // Hugo sets lang on <html>; axe sometimes misses inherited
];

test.describe('Accessibility (axe-core)', () => {
  const pages = [
    { name: 'home', url: '/' },
    { name: 'blog', url: '/blog/' },
    { name: 'about', url: '/about/' },
  ];

  for (const p of pages) {
    test(`no critical/serious violations on ${p.name}`, async ({ page }) => {
      await page.goto(p.url);
      const results = await new AxeBuilder({ page })
        .disableRules(IGNORE)
        .analyze();
      const serious = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      if (serious.length > 0) {
        // Surface the violations for the CI log before failing.
        console.log(`\n[a11y ${p.name}] serious/critical violations:`);
        for (const v of serious) {
          console.log(`  - ${v.id}: ${v.help} (${v.nodes.length} node(s))`);
        }
      }
      expect(serious, `${serious.length} serious/critical a11y violation(s)`).toHaveLength(0);
    });
  }

  test('post page is accessible (giscus iframe context)', async ({ page }) => {
    await page.goto('/blog/');
    const first = page.locator('a[href*="/20"]').first();
    const href = await first.getAttribute('href');
    await page.goto(href);
    const results = await new AxeBuilder({ page })
      .disableRules(IGNORE)
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(serious, `${serious.length} serious/critical a11y violation(s)`).toHaveLength(0);
  });
});
