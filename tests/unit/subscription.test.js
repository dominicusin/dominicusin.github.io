/**
 * @fileoverview Unit tests for SubscriptionSystem module
 */

import { describe, it, expect, beforeEach, afterEach } from '../test-utils.js';
import { SubscriptionSystem } from '../../src/modules/subscription.js';

describe('SubscriptionSystem', () => {
  let subscription;
  let originalFetch;

  beforeEach(() => {
    // Mock fetch
    originalFetch = global.fetch;
    global.fetch = async (url, options) => {
      if (url.includes('/api/subscribe')) {
        return {
          ok: true,
          json: async () => ({ success: true, token: 'test-token' })
        };
      }
      if (url.includes('/api/verify-email')) {
        return {
          ok: true,
          json: async () => ({ verified: true })
        };
      }
      if (url.includes('/api/unsubscribe')) {
        return {
          ok: true,
          json: async () => ({ success: true })
        };
      }
      return { ok: false, status: 404 };
    };

    // Create container
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

    it('should have correct configuration', () => {
      expect(subscription.config.rssUrl).toBe('/feed.xml');
      expect(subscription.config.subscriptionEndpoint).toBe('/api/subscribe');
    });
  });

  describe('email validation', () => {
    it('should validate correct email', () => {
      const result = subscription.validateEmail('test@example.com');
      expect(result).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = subscription.validateEmail('invalid-email');
      expect(result).toBe(false);
    });

    it('should reject empty email', () => {
      const result = subscription.validateEmail('');
      expect(result).toBe(false);
    });
  });

  describe('subscription', () => {
    it('should subscribe with valid email', async () => {
      const result = await subscription.subscribe('test@example.com');
      expect(result.success).toBe(true);
      expect(result.token).toBe('test-token');
    });

    it('should handle subscription error', async () => {
      global.fetch = async () => ({ ok: false, status: 500 });
      const result = await subscription.subscribe('test@example.com');
      expect(result.success).toBe(false);
    });
  });

  describe('verification', () => {
    it('should verify email token', async () => {
      const result = await subscription.verifyEmail('test-token');
      expect(result.verified).toBe(true);
    });
  });

  describe('unsubscription', () => {
    it('should unsubscribe user', async () => {
      const result = await subscription.unsubscribe('test-token');
      expect(result.success).toBe(true);
    });
  });

  describe('RSS link', () => {
    it('should have RSS link configured', () => {
      const rssLink = document.querySelector('.rss-link');
      expect(rssLink.href).toContain('/feed.xml');
    });
  });
});
