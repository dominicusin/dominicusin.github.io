/**
 * Unit tests for SocialSharing (src/modules/social-sharing.js)
 * Raises branch/line coverage for the social-sharing DOM module.
 * jsdom environment (set in jest.config). The module auto-inits `new SocialSharing()`
 * at import time, but safely no-ops when no `.social-sharing` container exists, so a
 * static import is safe; each test builds the DOM in beforeEach before constructing.
 */
import { TextEncoder, TextDecoder } from 'util';
if (typeof global.TextEncoder === 'undefined') global.TextEncoder = TextEncoder;
if (typeof global.TextDecoder === 'undefined') global.TextDecoder = TextDecoder;
import { SocialSharing } from '@modules/social-sharing.js';

// Static, hardcoded test fixtures only (no user input) — innerHTML usage is safe.
function buildDom() {
  document.head.innerHTML = `
    <meta name="description" content="Test description">
    <meta property="og:image" content="https://example.com/img.png">
    <meta name="author" content="DominicusIn">
    <meta property="og:site_name" content="Dominicus In">
  `;
  document.body.innerHTML = `<div class="social-sharing"></div>`;
  window.open = jest.fn();
  window.gtag = jest.fn();
  navigator.share = undefined;
  navigator.sendBeacon = jest.fn(() => true);
  global.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ counts: { twitter: 12, linkedin: 3 } })
  }));
  if (!navigator.clipboard) {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn(() => Promise.resolve()) },
      configurable: true
    });
  }
}

beforeEach(() => buildDom());
afterEach(() => { jest.restoreAllMocks(); });

describe('SocialSharing', () => {
  test('renders share buttons into the container', () => {
    new SocialSharing();
    expect(document.querySelectorAll('.share-button').length).toBeGreaterThan(0);
    expect(document.querySelector('.social-sharing-container')).not.toBeNull();
  });

  test('respects custom platform list', () => {
    new SocialSharing({ platforms: ['twitter', 'email'] });
    expect(document.querySelectorAll('.share-button').length).toBe(2);
  });

  test('hides labels when showLabels is false', () => {
    new SocialSharing({ showLabels: false });
    expect(document.querySelector('.share-label')).toBeNull();
  });

  test('no container → constructor does not throw', () => {
    document.body.innerHTML = '<div class="other"></div>';
    expect(() => new SocialSharing()).not.toThrow();
  });

  test('_formatCount formats K/M', () => {
    const inst = new SocialSharing();
    expect(inst._formatCount(999)).toBe('999');
    expect(inst._formatCount(1500)).toBe('1.5K');
    expect(inst._formatCount(2500000)).toBe('2.5M');
  });

  test('_handleShare opens window and tracks', () => {
    const inst = new SocialSharing();
    inst._handleShare('twitter');
    expect(window.open).toHaveBeenCalled();
    expect(window.gtag).toHaveBeenCalledWith('event', 'social_share', expect.objectContaining({ event_label: 'twitter' }));
  });

  test('_handleShare unknown platform is a no-op', () => {
    const inst = new SocialSharing();
    window.open.mockClear();
    inst._handleShare('does-not-exist');
    expect(window.open).not.toHaveBeenCalled();
  });

  test('analytics disabled → no gtag call', () => {
    window.gtag.mockClear();
    const inst = new SocialSharing({ enableAnalytics: false });
    inst._trackShare('reddit');
    expect(window.gtag).not.toHaveBeenCalled();
  });

  test('_sendCustomAnalytics uses sendBeacon when available', () => {
    const inst = new SocialSharing();
    inst._sendCustomAnalytics('evt', { a: 1 });
    expect(navigator.sendBeacon).toHaveBeenCalled();
  });

  test('copyLinkToClipboard uses navigator.clipboard', async () => {
    const inst = new SocialSharing();
    await inst.copyLinkToClipboard();
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  test('_loadShareCounts fetches and updates UI', async () => {
    const inst = new SocialSharing();
    await inst._loadShareCounts();
    const total = document.querySelector('#total-share-count');
    expect(total.textContent).toBe('15');
  });

  test('_loadShareCounts falls back gracefully on fetch error', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('network')));
    const inst = new SocialSharing();
    await inst._loadShareCounts();
    expect(document.querySelector('.social-sharing-stats').style.display).toBe('none');
  });

  test('getShareData / updateShareData / destroy', () => {
    const inst = new SocialSharing();
    expect(inst.getShareData().url).toBeDefined();
    inst.updateShareData({ title: 'New Title' });
    expect(inst.getShareData().title).toBe('New Title');
    inst.destroy();
    expect(inst.cache.size).toBe(0);
  });
});
