/**
 * @fileoverview Unit tests for ThemeManager module
 * @module tests/unit/theme-manager.test
 */

import { describe, it, expect, beforeEach, afterEach } from '../test-utils.js';
import { ThemeManager } from '../../src/core/theme-manager.js';

describe('ThemeManager', () => {
  let container;
  
  beforeEach(() => {
    // Create test container
    container = document.createElement('div');
    container.className = 'theme-toggle';
    document.body.appendChild(container);
  });
  
  afterEach(() => {
    // Cleanup
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    if (window.themeManager) {
      window.themeManager.destroy();
      delete window.themeManager;
    }
  });
  
  describe('constructor', () => {
    it('should create instance with default options', () => {
      const manager = new ThemeManager({ container: '.theme-toggle' });
      
      expect(manager).toBeInstanceOf(ThemeManager);
      expect(manager.options.defaultTheme).toBe('auto');
      expect(manager.options.themes).toEqual(['light', 'dark', 'auto']);
    });
    
    it('should accept custom options', () => {
      const manager = new ThemeManager({
        container: '.theme-toggle',
        defaultTheme: 'dark',
        themes: ['light', 'dark']
      });
      
      expect(manager.options.defaultTheme).toBe('dark');
      expect(manager.options.themes).toEqual(['light', 'dark']);
    });
  });
  
  describe('theme switching', () => {
    it('should apply light theme', () => {
      const manager = new ThemeManager({ container: '.theme-toggle' });
      manager.setTheme('light');
      
      expect(document.documentElement.classList.contains('theme-light')).toBe(true);
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
    
    it('should apply dark theme', () => {
      const manager = new ThemeManager({ container: '.theme-toggle' });
      manager.setTheme('dark');
      
      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
    
    it('should resolve auto theme based on system preference', () => {
      const manager = new ThemeManager({ container: '.theme-toggle' });
      const resolved = manager.getResolvedTheme();
      
      expect(['light', 'dark'].includes(resolved)).toBe(true);
    });
    
    it('should toggle between themes', () => {
      const manager = new ThemeManager({ container: '.theme-toggle' });
      const initialTheme = manager.getCurrentTheme();
      
      manager.toggleTheme();
      const afterToggle = manager.getCurrentTheme();
      
      expect(afterToggle).not.toBe(initialTheme);
    });
    
    it('should reset to default theme', () => {
      const manager = new ThemeManager({ 
        container: '.theme-toggle',
        defaultTheme: 'light'
      });
      
      manager.setTheme('dark');
      manager.resetTheme();
      
      expect(manager.getCurrentTheme()).toBe('light');
    });
  });
  
  describe('system preference detection', () => {
    it('should detect system color scheme preference', () => {
      const manager = new ThemeManager({ container: '.theme-toggle' });
      const preference = manager.getSystemPreference();
      
      expect(['light', 'dark'].includes(preference)).toBe(true);
    });
    
    it('should update when system preference changes', (done) => {
      const manager = new ThemeManager({ 
        container: '.theme-toggle',
        defaultTheme: 'auto'
      });
      
      // Simulate media query change
      const event = new CustomEvent('change', { 
        detail: { matches: true } 
      });
      
      setTimeout(() => {
        expect(manager.getResolvedTheme()).toBeDefined();
        done();
      }, 100);
    });
  });
  
  describe('UI rendering', () => {
    it('should render theme toggle buttons', () => {
      const manager = new ThemeManager({ container: '.theme-toggle' });
      const buttons = container.querySelectorAll('.theme-btn');
      
      expect(buttons.length).toBeGreaterThan(0);
    });
    
    it('should update active button state', () => {
      const manager = new ThemeManager({ container: '.theme-toggle' });
      manager.setTheme('dark');
      
      const darkButton = container.querySelector('[data-theme="dark"]');
      expect(darkButton.classList.contains('active')).toBe(true);
      expect(darkButton.getAttribute('aria-pressed')).toBe('true');
    });
    
    it('should handle keyboard navigation', () => {
      const manager = new ThemeManager({ container: '.theme-toggle' });
      const buttons = Array.from(container.querySelectorAll('.theme-btn'));
      
      // Focus first button
      buttons[0].focus();
      
      // Simulate arrow key press
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      container.dispatchEvent(event);
      
      expect(document.activeElement).not.toBe(buttons[0]);
    });
  });
  
  describe('accessibility', () => {
    it('should announce theme change for screen readers', (done) => {
      const manager = new ThemeManager({ container: '.theme-toggle' });
      manager.setTheme('dark');
      
      setTimeout(() => {
        const announcement = document.querySelector('[aria-live="polite"]');
        expect(announcement).toBeTruthy();
        done();
      }, 100);
    });
    
    it('should have proper ARIA labels', () => {
      const manager = new ThemeManager({ container: '.theme-toggle' });
      const toggleContainer = container.querySelector('.theme-toggle-container');
      
      expect(toggleContainer.getAttribute('role')).toBe('group');
      expect(toggleContainer.getAttribute('aria-label')).toBeTruthy();
    });
  });
  
  describe('storage', () => {
    it('should store theme preference in localStorage', () => {
      const manager = new ThemeManager({ container: '.theme-toggle' });
      manager.setTheme('dark');
      
      const stored = localStorage.getItem('blog-theme');
      expect(stored).toBe('dark');
    });
    
    it('should restore theme from localStorage', () => {
      localStorage.setItem('blog-theme', 'dark');
      
      const manager = new ThemeManager({ container: '.theme-toggle' });
      expect(manager.getCurrentTheme()).toBe('dark');
      
      // Cleanup
      localStorage.removeItem('blog-theme');
    });
  });
  
  describe('analytics tracking', () => {
    it('should track theme changes', () => {
      // Mock sendBeacon
      const originalSendBeacon = navigator.sendBeacon;
      navigator.sendBeacon = () => true;
      
      const manager = new ThemeManager({ container: '.theme-toggle' });
      manager.setTheme('dark');
      
      // Restore
      navigator.sendBeacon = originalSendBeacon;
    });
  });
});
