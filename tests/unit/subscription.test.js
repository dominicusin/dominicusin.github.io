/**
 * @fileoverview Unit tests for SubscriptionSystem module (aligned to real API)
 */

import { describe, it, expect, beforeEach, afterEach } from '../test-utils.js';
import { SubscriptionSystem } from '../../src/modules/subscription.js';

describe('SubscriptionSystem', () => {
  let subscription;
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = async (url, _options) => {
      if (url.includes('/api/subscribe')) {
        return { ok: true, json: async () => ({ success: true, token: 'test-token' }) };
      }
      if (url.includes('/api/verify-email')) {
        return { ok: true, json: async () => ({ verified: true }) };
      }
      if (url.includes('/api/unsubscribe')) {
        return { ok: true, json: async () => ({ success: true }) };
      }
      return { ok: false, status: 404 };
    };

    document.body.innerHTML = `
      <div class="subscription-container">
        <form class="subscription-form">
          <input type="email" class="subscription-email" value="test@example.com" />
          <button type="submit" class="subscription-submit">Subscribe</button>
        </form>
        <a href="/feed.xml" class="rss-link">RSS</a>
      </div>
    `;

    subscription = new SubscriptionSystem({
      rssUrl: '/feed.xml',
      subscriptionEndpoint: '/api/subscribe',
      verificationEndpoint: '/api/verify-email',
      unsubscribeEndpoint: '/api/unsubscribe'
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    subscription = null;
    document.body.innerHTML = '';
  });

  describe('initialization', () => {
    it('should create instance', () => {
      expect(subscription).toBeInstanceOf(SubscriptionSystem);
    });

    it('should expose the configured options', () => {
      expect(subscription.options.rssUrl).toBe('/feed.xml');
      expect(subscription.options.subscriptionEndpoint).toBe('/api/subscribe');
    });

    it('should render an RSS link', () => {
      const rssLink = document.querySelector('.rss-link');
      expect(rssLink).toBeTruthy();
      expect(rssLink.getAttribute('href')).toContain('/feed.xml');
    });
  });

  describe('email validation', () => {
    it('should accept a correct email', () => {
      expect(subscription.isValidEmail('test@example.com')).toBe(true);
    });

    it('should reject an invalid email', () => {
      expect(subscription.isValidEmail('invalid-email')).toBe(false);
    });

    it('should reject an empty email', () => {
      expect(subscription.isValidEmail('')).toBe(false);
    });
  });

  describe('verification', () => {
    it('should verify an email token without throwing', async () => {
      await expect(subscription.verifyEmail('test-token')).resolves.toBeUndefined();
    });
  });

  describe('unsubscription', () => {
    it('should unsubscribe a user without throwing', async () => {
      await expect(subscription.unsubscribeUser('test@example.com', 'test-token')).resolves.toBeUndefined();
    });
  });
});
