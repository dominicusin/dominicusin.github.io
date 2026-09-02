'use strict';

/**
 * A11y Agent — M3-007
 * Accessibility checker for HTML content.
 * Uses JSDOM for DOM analysis.
 */

const { JSDOM } = require('jsdom');

/**
 * @typedef {Object} A11yResult
 * @property {boolean} passed
 * @property {string[]} violations
 * @property {string[]} warnings
 * @property {number} score
 */

/**
 * Check HTML accessibility.
 * @param {Object} params
 * @param {string} params.html - HTML string to check
 * @param {string} [params.standards='WCAG2AA'] - Accessibility standard
 * @returns {Promise<A11yResult>}
 */
async function checkAccessibility({ html, standards = 'WCAG2AA' } = {}) {
  const violations = [];
  const warnings = [];

  if (!html || typeof html !== 'string' || html.trim() === '') {
    warnings.push('Empty HTML provided');
    return {
      passed: true,
      violations,
      warnings,
      score: 100,
    };
  }

  let dom;
  try {
    dom = new JSDOM(html);
  } catch (e) {
    warnings.push(`Failed to parse HTML: ${e.message}`);
    return {
      passed: false,
      violations: ['Invalid HTML'],
      warnings,
      score: 0,
    };
  }

  const { document } = dom.window;

  // ─── Alt text on images ─────────────────────────────────────────────────
  checkAltText(document, violations);

  // ─── Heading hierarchy ──────────────────────────────────────────────────
  checkHeadingHierarchy(document, violations);

  // ─── ARIA labels ────────────────────────────────────────────────────────
  checkAriaLabels(document, violations);

  // ─── Color contrast (basic) ─────────────────────────────────────────────
  checkColorContrast(document, violations);

  // ─── Keyboard navigation ────────────────────────────────────────────────
  checkKeyboardNavigation(document, violations);

  // ─── Focus management ───────────────────────────────────────────────────
  checkFocusManagement(document, violations, warnings);

  // ─── Calculate score ────────────────────────────────────────────────────
  const score = calculateScore(violations, warnings);
  const passed = violations.length === 0;

  return {
    passed,
    violations,
    warnings,
    score,
  };
}

/**
 * Check that all images have alt text (or are decorative with alt="").
 */
function checkAltText(document, violations) {
  const images = document.querySelectorAll('img');
  for (const img of images) {
    if (!img.hasAttribute('alt')) {
      const src = img.getAttribute('src') || 'unknown';
      violations.push(`Image missing alt text: src="${src}"`);
    }
  }
}

/**
 * Check heading hierarchy (no skipped levels, no multiple h1).
 */
function checkHeadingHierarchy(document, violations) {
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const levels = [];

  for (const h of headings) {
    const level = parseInt(h.tagName[1], 10);
    levels.push(level);
  }

  // Check for multiple h1
  const h1Count = levels.filter(l => l === 1).length;
  if (h1Count > 1) {
    violations.push(`Multiple h1 heading elements found (${h1Count}), should be only one`);
  }

  // Check for skipped levels
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) {
      const from = levels[i - 1];
      const to = levels[i];
      violations.push(`Heading hierarchy skipped: h${from} to h${to}`);
    }
  }
}

/**
 * Check that interactive elements have accessible names via aria-label or text.
 */
function checkAriaLabels(document, violations) {
  const interactiveSelectors = ['button', 'a'];
  const elements = document.querySelectorAll(interactiveSelectors.join(', '));

  for (const el of elements) {
    const tagName = el.tagName.toLowerCase();
    const text = (el.textContent || '').trim();
    const ariaLabel = el.getAttribute('aria-label');
    const ariaLabelledBy = el.getAttribute('aria-labelledby');
    const hasImgAlt = el.querySelector('img[alt]');

    // Links: need text or aria-label
    if (tagName === 'a') {
      if (!text && !ariaLabel && !ariaLabelledBy && !hasImgAlt) {
        const href = el.getAttribute('href') || 'unknown';
        violations.push(`Link missing accessible name: href="${href}"`);
      }
    }

    // Buttons: need text or aria-label
    if (tagName === 'button') {
      if (!text && !ariaLabel && !ariaLabelledBy) {
        violations.push('Button missing accessible name (no text or aria-label)');
      }
    }
  }
}

/**
 * Basic color contrast check - flags low contrast combinations.
 */
function checkColorContrast(document, violations) {
  const elements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, a, button, li, td, th, div');

  for (const el of elements) {
    const style = el.getAttribute('style') || '';
    const colorMatch = style.match(/color:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|\w+)/);
    const bgMatch = style.match(/background-color:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|\w+)/);

    if (colorMatch && bgMatch) {
      const fg = parseColor(colorMatch[1]);
      const bg = parseColor(bgMatch[1]);

      if (fg && bg) {
        const ratio = contrastRatio(fg, bg);
        if (ratio < 4.5) {
          violations.push(`Low color contrast (${ratio.toFixed(1)}:1) on <${el.tagName.toLowerCase()}>: "${(el.textContent || '').trim().substring(0, 40)}"`);
        }
      }
    }
  }
}

/**
 * Check keyboard navigation: positive tabindex, onclick on non-interactive.
 */
function checkKeyboardNavigation(document, violations) {
  const allElements = document.querySelectorAll('*');

  for (const el of allElements) {
    const tagName = el.tagName.toLowerCase();
    const isInteractive = ['a', 'button', 'input', 'select', 'textarea'].includes(tagName);

    // Check positive tabindex
    const tabindex = el.getAttribute('tabindex');
    if (tabindex !== null) {
      const tabValue = parseInt(tabindex, 10);
      if (tabValue > 0) {
        violations.push(`Positive tabindex="${tabindex}" on <${tagName}> disrupts natural tab order`);
      }
    }

    // Check onclick on non-interactive elements
    if (!isInteractive && el.hasAttribute('onclick')) {
      const role = el.getAttribute('role');
      const hasTabindex = el.hasAttribute('tabindex');
      const hasOnkeydown = el.hasAttribute('onkeydown') || el.hasAttribute('onkeyup') || el.hasAttribute('onkeypress');

      if (!role && !hasTabindex) {
        violations.push(`Click handler on non-interactive <${tagName}> without keyboard access (add tabindex="0" or use a <button>)`);
      } else if (role && !hasOnkeydown && !hasTabindex) {
        violations.push(`Custom interactive <${tagName}> with role="${role}" lacks keyboard event handler`);
      }
    }
  }
}

/**
 * Check focus management: outline: none without replacement, autofocus.
 */
function checkFocusManagement(document, violations, warnings) {
  // Check for autofocus
  const autofocusElements = document.querySelectorAll('[autofocus]');
  for (const el of autofocusElements) {
    const tagName = el.tagName.toLowerCase();
    warnings.push(`Autofocus on <${tagName}> may trap keyboard users`);
  }

  // Check for outline: none in styles
  const styleElements = document.querySelectorAll('style');
  for (const style of styleElements) {
    const css = style.textContent || '';
    if (outlineNoneWithoutReplacement(css)) {
      violations.push('Focus indicator removed (outline: none) without visible replacement');
    }
  }

  // Check inline styles for outline: none
  const elementsWithOutline = document.querySelectorAll('[style*="outline"]');
  for (const el of elementsWithOutline) {
    const style = el.getAttribute('style') || '';
    if (style.includes('outline: none') || style.includes('outline:none')) {
      // Check if there's a replacement
      if (!style.includes('box-shadow') && !style.includes('border') && !style.includes('background')) {
        violations.push('Inline outline: none without visible focus replacement');
      }
    }
  }
}

/**
 * Calculate accessibility score based on violations and warnings.
 */
function calculateScore(violations, warnings) {
  const violationWeight = 10;
  const warningWeight = 2;

  const deduction = violations.length * violationWeight + warnings.length * warningWeight;
  const score = Math.max(0, 100 - deduction);
  return Math.min(100, score);
}

// ─── Color utilities ─────────────────────────────────────────────────────────

/**
 * Parse a color string to { r, g, b }.
 */
function parseColor(color) {
  color = color.trim();

  // Hex colors
  if (color.startsWith('#')) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    }
  }

  // RGB/RGBA
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  // Named colors (basic)
  const namedColors = {
    black: { r: 0, g: 0, b: 0 },
    white: { r: 255, g: 255, b: 255 },
    red: { r: 255, g: 0, b: 0 },
    green: { r: 0, g: 128, b: 0 },
    blue: { r: 0, g: 0, b: 255 },
    gray: { r: 128, g: 128, b: 128 },
    grey: { r: 128, g: 128, b: 128 },
    yellow: { r: 255, g: 255, b: 0 },
    silver: { r: 192, g: 192, b: 192 },
    maroon: { r: 128, g: 0, b: 0 },
    olive: { r: 128, g: 128, b: 0 },
    lime: { r: 0, g: 255, b: 0 },
    aqua: { r: 0, g: 255, b: 255 },
    teal: { r: 0, g: 128, b: 128 },
    navy: { r: 0, g: 0, b: 128 },
    fuchsia: { r: 255, g: 0, b: 255 },
    purple: { r: 128, g: 0, b: 128 },
  };

  if (namedColors[color.toLowerCase()]) {
    return namedColors[color.toLowerCase()];
  }

  return null;
}

/**
 * Calculate relative luminance.
 */
function luminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors.
 */
function contrastRatio(color1, color2) {
  const l1 = luminance(color1);
  const l2 = luminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if CSS has outline: none without a replacement focus style.
 */
function outlineNoneWithoutReplacement(css) {
  // Look for outline: none or outline: 0
  const outlineNone = /outline\s*:\s*(none|0)/i.test(css);
  if (!outlineNone) return false;

  // Check if there's a replacement
  const hasReplacement = /box-shadow\s*:\s*[^;]+(?:inset)?[^;]*[0-9]/.test(css) ||
                         /border\s*:/.test(css) ||
                         /background[^:]*:/.test(css);

  return !hasReplacement;
}

module.exports = { checkAccessibility };