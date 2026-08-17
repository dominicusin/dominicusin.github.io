// CLS probe: load a URL, capture every layout-shift entry with the shifted nodes.
const { chromium } = require('playwright');
const fs = require('fs');
// Prefer the full chromium build already installed (headless_shell may be absent).
const CANDIDATES = [
  process.env.PW_CHROMIUM || '',
  '/home/domini/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell',
  '/home/domini/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
].filter(Boolean);
let exe = CANDIDATES.find((p) => fs.existsSync(p)) || undefined;
if (!exe) { try { exe = chromium.executablePath(); } catch {} }

const URL = process.argv[2] || 'https://dominicusin.github.io/';

(async () => {
  const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const shifts = [];
  await page.exposeFunction('__cls', (e) => shifts.push(e));
  await page.addInitScript(() => {
    try {
      const po = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
            const nodes = (entry.sources || []).map((s) => {
              try {
                const r = s.node.getBoundingClientRect();
                return {
                  tag: s.node.tagName,
                  cls: s.node.className && s.node.className.toString().slice(0, 80),
                  rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
                  text: (s.node.textContent || '').trim().slice(0, 60),
                };
              } catch { return { tag: '?' }; }
            });
            window.__cls({ value: entry.value, nodes });
          }
        }
      });
      po.observe({ type: 'layout-shift', buffered: true });
    } catch (e) { window.__cls({ error: String(e) }); }
  });
  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 });
  } catch (e) { console.log('goto error:', e.message); }
  // give late scripts / fonts time to settle
  await page.waitForTimeout(4000);
  const cls = shifts.reduce((a, s) => a + (s.value || 0), 0);
  console.log('URL:', URL);
  console.log('TOTAL CLS:', cls.toFixed(4));
  console.log('shift entries:', shifts.length);
  for (const s of shifts.slice(0, 12)) {
    console.log('--- shift', (s.value || 0).toFixed(4), s.error ? 'ERR ' + s.error : '');
    for (const n of (s.nodes || [])) console.log('   ', n.tag, JSON.stringify(n.rect), n.cls || '', n.text || '');
  }
  await browser.close();
})();
