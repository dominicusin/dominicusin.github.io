/**
 * @fileoverview Unit tests for PWAService module (aligned to real API)
 */

import { describe, it, expect, beforeEach, afterEach } from '../test-utils.js';
import { PWAService } from '../../src/services/pwa-service.js';

describe('PWAService', () => {
  let pwa;
  let originalNavigator;

  beforeEach(() => {
    originalNavigator = global.navigator;
    global.navigator = {
      ...originalNavigator,
      serviceWorker: {
        register: async (_scriptUrl) => ({ active: true, ready: Promise.resolve() }),
        getRegistrations: async () => []
      },
      onLine: true
    };

    document.body.innerHTML = '<div id="pwa-install-prompt"></div>';

    pwa = new PWAService({ debugMode: false });
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

    it('should track install/offline state', () => {
      expect(typeof pwa.state.isInstalled).toBe('boolean');
      expect(typeof pwa.state.isOffline).toBe('boolean');
    });

    it('should initialize without throwing', async () => {
      await expect(pwa.init()).resolves.toBeUndefined();
    });
  });

  describe('connectivity', () => {
    it('should report offline status as boolean', () => {
      expect(typeof pwa.isOffline()).toBe('boolean');
    });

    it('should reflect navigator online state', () => {
      Object.defineProperty(global.navigator, 'onLine', { value: false, configurable: true });
      const pwa2 = new PWAService();
      expect(pwa2.isOffline()).toBe(true);
    });
  });

  describe('install state', () => {
    it('should report installed status as boolean', () => {
      expect(typeof pwa.isAppInstalled()).toBe('boolean');
    });
  });
});
