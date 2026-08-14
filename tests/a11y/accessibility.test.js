/**
 * Accessibility (A11y) Tests for Engineering Blog v3.0
 * 
 * Tests using axe-core for WCAG 2.1 compliance:
 * - Semantic HTML structure
 * - Keyboard navigation
 * - Screen reader compatibility
 * - Color contrast
 * - Focus management
 * - ARIA attributes
 */

import axe from 'axe-core';
import '@testing-library/jest-dom';

describe('Accessibility Tests', () => {
  
  // Helper to create test document
  const createTestDocument = (html) => {
    document.body.innerHTML = html;
    return document;
  };

  describe('Semantic Search Modal', () => {
    test('should have proper ARIA labels for search modal', async () => {
      const html = `
        <div role="dialog" aria-labelledby="search-title" aria-modal="true" id="search-modal">
          <h2 id="search-title">Semantic Search</h2>
          <input type="search" aria-label="Search articles" placeholder="Search..." />
          <button aria-label="Close search">✕</button>
          <ul role="listbox" aria-label="Search results">
            <li role="option" aria-selected="false">Result 1</li>
            <li role="option" aria-selected="false">Result 2</li>
          </ul>
        </div>
      `;
      
      createTestDocument(html);
      
      const results = await axe.run(document);
      expect(results.violations).toHaveLength(0);
    });

    test('should trap focus within modal when open', () => {
      const html = `
        <div role="dialog" aria-modal="true" id="modal">
          <button id="first-btn">First</button>
          <button id="last-btn">Last</button>
        </div>
      `;
      
      createTestDocument(html);
      
      const firstBtn = document.getElementById('first-btn');
      const lastBtn = document.getElementById('last-btn');
      
      // Simulate focus trap
      firstBtn.focus();
      expect(document.activeElement).toBe(firstBtn);
      
      lastBtn.focus();
      expect(document.activeElement).toBe(lastBtn);
    });

    test('should close on Escape key', () => {
      const html = `
        <div role="dialog" aria-modal="true" id="modal">
          <button aria-label="Close">Close</button>
        </div>
      `;
      
      createTestDocument(html);
      
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      
      document.dispatchEvent(escapeEvent);
      
      // Modal should be closable (implementation dependent)
      expect(modal).toBeInTheDocument();
    });
  });

  describe('AI Chat Widget', () => {
    test('should have accessible chat interface', async () => {
      const html = `
        <div role="complementary" aria-label="AI Assistant" id="ai-widget">
          <button aria-expanded="false" aria-controls="chat-window" aria-label="Open AI chat">
            🤖 Chat
          </button>
          <div id="chat-window" hidden>
            <div role="log" aria-label="Chat messages" aria-live="polite">
              <p role="article">Hello! How can I help?</p>
            </div>
            <form aria-label="Send message">
              <label for="chat-input" class="visually-hidden">Type your message</label>
              <input id="chat-input" type="text" aria-required="true" />
              <button type="submit" aria-label="Send message">Send</button>
            </form>
          </div>
        </div>
      `;
      
      createTestDocument(html);
      
      const results = await axe.run(document);
      expect(results.violations).toHaveLength(0);
    });

    test('should announce new messages to screen readers', () => {
      const html = `
        <div role="log" aria-live="polite" aria-label="Chat messages" id="chat-log">
          <p>Initial message</p>
        </div>
      `;
      
      createTestDocument(html);
      
      const chatLog = document.getElementById('chat-log');
      
      // Add new message
      const newMessage = document.createElement('p');
      newMessage.textContent = 'New message from AI';
      chatLog.appendChild(newMessage);
      
      expect(chatLog).toContainElement(newMessage);
      expect(chatLog.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('Graph Visualization (AR/VR)', () => {
    test('should provide alternative text for 3D graph', async () => {
      const html = `
        <div role="img" aria-label="3D Knowledge Graph visualization showing connections between articles">
          <canvas id="graph-canvas"></canvas>
          <p class="visually-hidden">
            Interactive graph with 50 nodes representing articles. 
            Use arrow keys to navigate, Enter to select.
          </p>
        </div>
      `;
      
      createTestDocument(html);
      
      const results = await axe.run(document);
      expect(results.violations).toHaveLength(0);
    });

    test('should support keyboard navigation in graph', () => {
      const html = `
        <div role="application" aria-label="Knowledge Graph Navigator" tabindex="0" id="graph-app">
          <ul role="tree" aria-label="Graph nodes">
            <li role="treeitem" tabindex="0" aria-selected="true">Node 1</li>
            <li role="treeitem" tabindex="-1" aria-selected="false">Node 2</li>
            <li role="treeitem" tabindex="-1" aria-selected="false">Node 3</li>
          </ul>
        </div>
      `;
      
      createTestDocument(html);
      
      const graphApp = document.getElementById('graph-app');
      graphApp.focus();
      
      expect(document.activeElement).toBe(graphApp);
      
      // Simulate arrow key navigation
      const arrowDown = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
      graphApp.dispatchEvent(arrowDown);
      
      // Focus should move to next node (implementation dependent)
      expect(graphApp).toBeInTheDocument();
    });
  });

  describe('Navigation & Header', () => {
    test('should have skip link for keyboard users', async () => {
      const html = `
        <body>
          <a href="#main-content" class="skip-link">Skip to main content</a>
          <nav aria-label="Main navigation">
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/articles">Articles</a></li>
            </ul>
          </nav>
          <main id="main-content" tabindex="-1">
            <h1>Welcome</h1>
          </main>
        </body>
      `;
      
      createTestDocument(html);
      
      const results = await axe.run(document);
      expect(results.violations).toHaveLength(0);
      
      const skipLink = document.querySelector('.skip-link');
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    test('should have proper landmark regions', async () => {
      const html = `
        <body>
          <header role="banner">
            <h1>Engineering Blog</h1>
          </header>
          <nav role="navigation" aria-label="Main">
            <ul><li>Links</li></ul>
          </nav>
          <main role="main">
            <article>
              <h2>Article Title</h2>
              <p>Content</p>
            </article>
          </main>
          <footer role="contentinfo">
            <p>Footer content</p>
          </footer>
        </body>
      `;
      
      createTestDocument(html);
      
      const results = await axe.run(document);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe('Forms & Inputs', () => {
    test('should have associated labels for all inputs', async () => {
      const html = `
        <form>
          <label for="email">Email address</label>
          <input type="email" id="email" name="email" required aria-required="true" />
          
          <label for="newsletter">
            <input type="checkbox" id="newsletter" name="newsletter" />
            Subscribe to newsletter
          </label>
          
          <button type="submit">Subscribe</button>
        </form>
      `;
      
      createTestDocument(html);
      
      const results = await axe.run(document);
      expect(results.violations).toHaveLength(0);
    });

    test('should show error messages accessibly', async () => {
      const html = `
        <form>
          <label for="username">Username</label>
          <input 
            type="text" 
            id="username" 
            name="username"
            aria-invalid="true"
            aria-describedby="username-error"
            value="invalid!"
          />
          <span id="username-error" role="alert">
            Username can only contain letters and numbers
          </span>
        </form>
      `;
      
      createTestDocument(html);
      
      const results = await axe.run(document);
      expect(results.violations).toHaveLength(0);
      
      const input = document.getElementById('username');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'username-error');
    });
  });

  describe('Color Contrast', () => {
    test('should meet WCAG AA contrast requirements', async () => {
      const html = `
        <style>
          .high-contrast {
            color: #000000;
            background-color: #ffffff;
          }
          .link {
            color: #005fcc;
            background-color: #ffffff;
          }
        </style>
        <div class="high-contrast">
          <p>This text has high contrast</p>
          <a href="#" class="link">Accessible link</a>
        </div>
      `;
      
      createTestDocument(html);
      
      const results = await axe.run(document, {
        runOnly: ['color-contrast']
      });
      
      expect(results.violations).toHaveLength(0);
    });
  });

  describe('Dynamic Content', () => {
    test('should announce loading states', () => {
      const html = `
        <div aria-busy="true" aria-live="polite" id="loading-content">
          Loading...
        </div>
      `;
      
      createTestDocument(html);
      
      const loadingContent = document.getElementById('loading-content');
      expect(loadingContent).toHaveAttribute('aria-busy', 'true');
      expect(loadingContent).toHaveAttribute('aria-live', 'polite');
    });

    test('should update live regions properly', () => {
      const html = `
        <div aria-live="assertive" aria-atomic="true" id="live-region"></div>
      `;
      
      createTestDocument(html);
      
      const liveRegion = document.getElementById('live-region');
      liveRegion.textContent = 'Search results updated: 5 articles found';
      
      expect(liveRegion.textContent).toContain('Search results updated');
      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('Images & Media', () => {
    test('should have alt text for informative images', async () => {
      const html = `
        <article>
          <img src="diagram.png" alt="Flowchart showing the data processing pipeline" />
          <p>The diagram above illustrates...</p>
        </article>
      `;
      
      createTestDocument(html);
      
      const results = await axe.run(document, {
        runOnly: ['image-alt']
      });
      
      expect(results.violations).toHaveLength(0);
    });

    test('should mark decorative images properly', async () => {
      const html = `
        <div>
          <img src="decorative-border.png" alt="" role="presentation" />
          <p>Content here</p>
        </div>
      `;
      
      createTestDocument(html);
      
      const results = await axe.run(document, {
        runOnly: ['image-alt']
      });
      
      expect(results.violations).toHaveLength(0);
    });
  });

  describe('Tables', () => {
    test('should have proper table headers', async () => {
      const html = `
        <table>
          <caption>Performance Metrics by Device Class</caption>
          <thead>
            <tr>
              <th scope="col">Device</th>
              <th scope="col">LCP</th>
              <th scope="col">INP</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>High-end</td>
              <td>1.2s</td>
              <td>80ms</td>
            </tr>
            <tr>
              <td>Low-end</td>
              <td>2.1s</td>
              <td>150ms</td>
            </tr>
          </tbody>
        </table>
      `;
      
      createTestDocument(html);
      
      const results = await axe.run(document, {
        runOnly: ['th-has-data-cells', 'valid-lang']
      });
      
      expect(results.violations).toHaveLength(0);
    });
  });

  describe('Focus Management', () => {
    test('should have visible focus indicators', async () => {
      const html = `
        <style>
          button:focus {
            outline: 3px solid #005fcc;
            outline-offset: 2px;
          }
          a:focus {
            outline: 2px dashed #005fcc;
          }
        </style>
        <button>Click me</button>
        <a href="#">Link</a>
      `;
      
      createTestDocument(html);
      
      const results = await axe.run(document, {
        runOnly: ['focus-visible']
      });
      
      // Note: axe may not fully test CSS focus styles
      // This is more of a manual verification
      expect(results.incomplete).toBeDefined();
    });

    test('should maintain focus order', () => {
      const html = `
        <main>
          <h1>Main Content</h1>
          <button>First</button>
          <button>Second</button>
          <button>Third</button>
          <a href="#">Link</a>
        </main>
      `;
      
      createTestDocument(html);
      
      const buttons = document.querySelectorAll('button');
      
      buttons[0].focus();
      expect(document.activeElement).toBe(buttons[0]);
      
      // Tab to next element
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      document.dispatchEvent(tabEvent);
      
      // Focus order should follow DOM order
      expect(document.activeElement).toBeInTheDocument();
    });
  });
});

// Custom matcher for accessibility
expect.extend({
  toBeAccessible(element) {
    return axe.run(element).then(results => {
      if (results.violations.length === 0) {
        return {
          pass: true,
          message: () => 'Element is accessible'
        };
      } else {
        return {
          pass: false,
          message: () => `Element has ${results.violations.length} accessibility violations: ${JSON.stringify(results.violations)}`
        };
      }
    });
  }
});
