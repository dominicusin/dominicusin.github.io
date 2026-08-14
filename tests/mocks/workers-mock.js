/**
 * Mock implementations for Web Workers and Service Workers
 */

// Mock for Web Worker modules
export class MockWebWorker {
  constructor(scriptPath) {
    this.scriptPath = scriptPath;
    this.messageHandlers = [];
    this.errorHandlers = [];
    this.terminated = false;
  }

  postMessage(message, transfer) {
    if (this.terminated) {
      throw new Error('Worker has been terminated');
    }

    // Simulate async worker processing
    setTimeout(() => {
      // Default mock response - can be overridden in tests
      const mockResponse = {
        type: 'WORKER_RESPONSE',
        payload: message,
        timestamp: Date.now()
      };

      this.messageHandlers.forEach(handler => {
        handler({ data: mockResponse });
      });
    }, 5);
  }

  addEventListener(event, handler) {
    if (event === 'message') {
      this.messageHandlers.push(handler);
    } else if (event === 'error') {
      this.errorHandlers.push(handler);
    }
  }

  removeEventListener(event, handler) {
    if (event === 'message') {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    } else if (event === 'error') {
      const index = this.errorHandlers.indexOf(handler);
      if (index > -1) {
        this.errorHandlers.splice(index, 1);
      }
    }
  }

  terminate() {
    this.terminated = true;
    this.messageHandlers = [];
    this.errorHandlers = [];
  }

  // Helper for tests to simulate worker responses
  simulateResponse(data) {
    this.messageHandlers.forEach(handler => {
      handler({ data });
    });
  }

  simulateError(error) {
    this.errorHandlers.forEach(handler => {
      handler(error);
    });
  }
}

// Mock for Service Worker registration
export const mockServiceWorker = {
  registrations: new Map(),
  
  async register(scriptUrl, options = {}) {
    const registration = {
      active: {
        postMessage: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      },
      installing: null,
      waiting: null,
      scope: options.scope || '/',
      update: jest.fn(() => Promise.resolve()),
      unregister: jest.fn(() => Promise.resolve(true))
    };
    
    this.registrations.set(scriptUrl, registration);
    return registration;
  },

  async getRegistration(clientUrl) {
    for (const [url, registration] of this.registrations.entries()) {
      if (!clientUrl || clientUrl.startsWith(registration.scope)) {
        return registration;
      }
    }
    return undefined;
  },

  getRegistrations() {
    return Promise.resolve(Array.from(this.registrations.values()));
  },

  clearAll() {
    this.registrations.clear();
  }
};

// Mock for Shared Worker
export class MockSharedWorker {
  constructor(scriptPath, name) {
    this.scriptPath = scriptPath;
    this.name = name;
    this.port = {
      postMessage: jest.fn(),
      start: jest.fn(),
      close: jest.fn(),
      onmessage: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
  }
}

// Export for use in test files
global.MockWebWorker = MockWebWorker;
global.mockServiceWorker = mockServiceWorker;
global.MockSharedWorker = MockSharedWorker;
