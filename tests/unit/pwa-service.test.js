/**
 * @fileoverview Unit tests for PWAService module
 */

import { describe, it, expect, beforeEach, afterEach } from '../test-utils.js';
import { PWAService } from '../../src/services/pwa-service.js';

describe('PWAService', () => {
  let pwa;
  let originalNavigator;

  beforeEach(() => {
    // Mock navigator.serviceWorker
    originalNavigator = global.navigator;
    global.navigator = {
      ...originalNavigator,
      serviceWorker: {
        register: async (scriptUrl) => ({
          active: true,
          ready: Promise.resolve()
        }),
        getRegistrations: async () => []
      },
      onLine: true
    };

    document.body.innerHTML = '<div id="pwa-install-prompt"></div>';

    pwa = new PWAService({
      debugMode: false
    });
  });

  afterEach(() => {
    global.navigator = originalNavigator;
    pwa = null;
    document.body.innerHTML = '';
  });

  describe('initialization', () => {
    it('should create instance', () => {
      expect(pwa).toBeInstanceOf(PWAService);
    });

    it('should have service worker available', () => {
      expect('serviceWorker' in navigator).toBe(true);
    });
  });

  describe('service worker registration', () => {
    it('should register service worker', async () => {
      const result = await pwa.registerServiceWorker();
      expect(result).toBe(true);
    });

    it('should handle registration failure', async () => {
      global.navigator.serviceWorker.register = async () => {
        throw new Error('Registration failed');
      };
      const result = await pwa.registerServiceWorker();
      expect(result).toBe(false);
    });
  });

  describe('offline detection', () => {
    it('should detect online status', () => {
      const isOnline = pwa.isOnline();
      expect(isOnline).toBe(true);
    });

    it('should detect offline status', () => {
      global.navigator.onLine = false;
      const isOnline = pwa.isOnline();
      expect(isOnline).toBe(false);
    });
  });

  describe('install prompt', () => {
    it('should show install prompt when available', () => {
      pwa.deferredPrompt = { prompt: () => {}, userChoice: Promise.resolve({ outcome: 'accepted' }) };
      const shown = pwa.showInstallPrompt();
      expect(shown).toBe(true);
    });

    it('should not show prompt if not available', () => {
      pwa.deferredPrompt = null;
      const shown = pwa.showInstallPrompt();
      expect(shown).toBe(false);
    });
  });

  describe('cache management', () => {
    it('should clear cache', async () => {
      const result = await pwa.clearCache();
      expect(result).toBe(true);
    });
  });
});
