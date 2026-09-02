'use strict';

/**
 * A11y Agent Tests — M3-007 TDD
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { checkAccessibility } = require('../workers/a11y/a11y.cjs');

// ─── Alt text on images ─────────────────────────────────────────────────────

test('flags images missing alt text', async () => {
  const html = '<html><body><img src="photo.jpg"></body></html>';
  const result = await checkAccessibility({ html });
  assert.equal(result.passed, false);
  assert.ok(result.violations.some(v => v.includes('alt')));
});

test('passes when all images have alt text', async () => {
  const html = '<html><body><img src="photo.jpg" alt="A photo"></body></html>';
  const result = await checkAccessibility({ html });
  assert.ok(!result.violations.some(v => v.toLowerCase().includes('alt')));
});

test('allows decorative images with empty alt', async () => {
  const html = '<html><body><img src="decorative.jpg" alt=""></body></html>';
  const result = await checkAccessibility({ html });
  assert.ok(!result.violations.some(v => v.toLowerCase().includes('alt')));
});

// ─── Heading hierarchy ──────────────────────────────────────────────────────

test('flags skipped heading levels', async () => {
  const html = '<html><body><h1>Title</h1><h3>Skipped h2</h3></body></html>';
  const result = await checkAccessibility({ html });
  assert.equal(result.passed, false);
  assert.ok(result.violations.some(v => v.toLowerCase().includes('heading')));
});

test('passes proper heading hierarchy', async () => {
  const html = '<html><body><h1>Title</h1><h2>Section</h2><h3>Subsection</h3></body></html>';
  const result = await checkAccessibility({ html });
  assert.ok(!result.violations.some(v => v.toLowerCase().includes('heading')));
});

test('flags multiple h1 elements', async () => {
  const html = '<html><body><h1>First</h1><h1>Second</h1></body></html>';
  const result = await checkAccessibility({ html });
  assert.equal(result.passed, false);
  assert.ok(result.violations.some(v => v.toLowerCase().includes('heading')));
});

// ─── ARIA labels ────────────────────────────────────────────────────────────

test('flags interactive elements without accessible names', async () => {
  const html = '<html><body><button><span class="icon"></span></button></body></html>';
  const result = await checkAccessibility({ html });
  assert.equal(result.passed, false);
  assert.ok(result.violations.some(v => v.toLowerCase().includes('aria') || v.toLowerCase().includes('label')));
});

test('passes when interactive elements have aria-label', async () => {
  const html = '<html><body><button aria-label="Close"><span class="icon"></span></button></body></html>';
  const result = await checkAccessibility({ html });
  assert.ok(!result.violations.some(v => v.toLowerCase().includes('aria')));
});

test('flags links without text or aria-label', async () => {
  const html = '<html><body><a href="/page"></a></body></html>';
  const result = await checkAccessibility({ html });
  assert.equal(result.passed, false);
  assert.ok(result.violations.some(v => v.toLowerCase().includes('link') || v.toLowerCase().includes('aria')));
});

// ─── Color contrast (basic) ─────────────────────────────────────────────────

test('flags low contrast color combinations', async () => {
  const html = '<html><body><p style="color: #888; background-color: #fff;">Low contrast text</p></body></html>';
  const result = await checkAccessibility({ html });
  assert.equal(result.passed, false);
  assert.ok(result.violations.some(v => v.toLowerCase().includes('contrast')));
});

test('passes adequate contrast', async () => {
  const html = '<html><body><p style="color: #000; background-color: #fff;">High contrast text</p></body></html>';
  const result = await checkAccessibility({ html });
  assert.ok(!result.violations.some(v => v.toLowerCase().includes('contrast')));
});

// ─── Keyboard navigation ────────────────────────────────────────────────────

test('flags elements with positive tabindex', async () => {
  const html = '<html><body><div tabindex="1">Custom focusable</div></body></html>';
  const result = await checkAccessibility({ html });
  assert.equal(result.passed, false);
  assert.ok(result.violations.some(v => v.toLowerCase().includes('keyboard') || v.toLowerCase().includes('tabindex')));
});

test('flags onclick on non-interactive elements without keyboard handler', async () => {
  const html = '<html><body><div onclick="doSomething()">Click me</div></body></html>';
  const result = await checkAccessibility({ html });
  assert.equal(result.passed, false);
  assert.ok(result.violations.some(v => v.toLowerCase().includes('keyboard') || v.toLowerCase().includes('interactive')));
});

// ─── Focus management ───────────────────────────────────────────────────────

test('flags missing focus styles (outline: none without replacement)', async () => {
  const html = '<html><head><style>a:focus { outline: none; }</style></head><body><a href="/">Link</a></body></html>';
  const result = await checkAccessibility({ html });
  assert.equal(result.passed, false);
  assert.ok(result.violations.some(v => v.toLowerCase().includes('focus')));
});

test('flags autofocus elements', async () => {
  const html = '<html><body><input type="text" autofocus></body></html>';
  const result = await checkAccessibility({ html });
  assert.equal(result.warnings.length > 0 || result.violations.length > 0, true);
});

// ─── Score calculation ──────────────────────────────────────────────────────

test('returns a score between 0 and 100', async () => {
  const html = '<html><body><p>Simple content</p></body></html>';
  const result = await checkAccessibility({ html });
  assert.ok(result.score >= 0 && result.score <= 100);
});

test('perfect score for fully accessible page', async () => {
  const html = `<html><head><style>a:focus { outline: 2px solid blue; }</style></head>
    <body>
      <h1>Title</h1>
      <img src="photo.jpg" alt="A photo">
      <p style="color: #000; background-color: #fff;">High contrast text</p>
      <button aria-label="Submit">Submit</button>
      <a href="/page" aria-label="Read more">Read more</a>
    </body></html>`;
  const result = await checkAccessibility({ html });
  assert.equal(result.score, 100);
  assert.equal(result.passed, true);
});

test('low score for inaccessible page', async () => {
  const html = `<html><body>
    <img src="photo.jpg">
    <img src="photo2.jpg">
    <h1>First</h1>
    <h1>Second</h1>
    <h3>Skipped</h3>
    <button><span class="icon"></span></button>
    <a href="/page"></a>
    <p style="color: #888; background-color: #fff;">Low contrast</p>
    <div tabindex="1">Custom</div>
    <div onclick="doSomething()">Click</div>
  </body></html>`;
  const result = await checkAccessibility({ html });
  assert.ok(result.score < 50);
  assert.equal(result.passed, false);
});

// ─── Standards parameter ────────────────────────────────────────────────────

test('respects standards parameter - WCAG2A', async () => {
  const html = '<html><body><img src="photo.jpg"></body></html>';
  const result = await checkAccessibility({ html, standards: 'WCAG2A' });
  assert.equal(result.passed, false);
});

test('empty html returns passed with warnings', async () => {
  const html = '';
  const result = await checkAccessibility({ html });
  assert.equal(typeof result.passed, 'boolean');
  assert.ok(Array.isArray(result.violations));
  assert.ok(Array.isArray(result.warnings));
});