/**
 * AI Assistant UI Module - Chat Widget Controller
 * Handles chat rendering, auto-scroll, command processing, and model status
 */

export class AssistantUI {
  constructor(options = {}) {
    this.widget = null;
    this.toggleBtn = null;
    this.chatContainer = null;
    this.messagesContainer = null;
    this.input = null;
    this.sendBtn = null;
    this.clearBtn = null;
    this.contextMenuBtn = null;
    this.contextMenu = null;
    this.modelStatusEl = null;
    this.statusDot = null;
    
    this.assistantService = options.assistantService || null;
    this.onMessageSent = options.onMessageSent || null;
    this.messageHistory = [];
    
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.widget = document.getElementById('ai-assistant-widget');
    if (!this.widget) return;

    this.toggleBtn = document.getElementById('ai-widget-toggle');
    this.chatContainer = document.getElementById('ai-widget-chat');
    this.messagesContainer = document.getElementById('chat-messages');
    this.input = document.getElementById('chat-input');
    this.sendBtn = document.getElementById('chat-send');
    this.clearBtn = document.getElementById('chat-clear');
    this.contextMenuBtn = document.getElementById('chat-context-menu');
    this.contextMenu = document.getElementById('context-menu');
    this.modelStatusEl = document.getElementById('model-status');
    this.statusDot = document.getElementById('widget-status-dot');

    this.bindEvents();
    this.updateModelStatus('loading');
  }

  bindEvents() {
    // Toggle chat visibility
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.toggleChat());
    }

    // Send message on button click
    if (this.sendBtn) {
      this.sendBtn.addEventListener('click', () => this.sendMessage());
    }

    // Send message on Enter (Shift+Enter for new line)
    if (this.input) {
      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      // Enable/disable send button based on input
      this.input.addEventListener('input', () => {
        const hasContent = this.input.value.trim().length > 0;
        if (this.sendBtn) {
          this.sendBtn.disabled = !hasContent;
        }
      });
    }

    // Clear chat
    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => this.clearChat());
    }

    // Context menu toggle
    if (this.contextMenuBtn && this.contextMenu) {
      this.contextMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.contextMenu.hidden = !this.contextMenu.hidden;
      });

      // Close context menu on outside click
      document.addEventListener('click', (e) => {
        if (!this.contextMenu.contains(e.target)) {
          this.contextMenu.hidden = true;
        }
      });

      // Handle context menu actions
      this.contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', () => {
          const action = item.dataset.action;
          this.handleContextMenuAction(action);
          this.contextMenu.hidden = true;
        });
      });
    }

    // Close chat on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.closeChat();
      }
    });
  }

  async sendMessage(customMessage = null) {
    const messageText = customMessage || this.input.value.trim();
    
    if (!messageText) return;

    // Add user message to UI
    this.addMessage(messageText, 'user');
    
    // Clear input
    if (!customMessage) {
      this.input.value = '';
      if (this.sendBtn) this.sendBtn.disabled = true;
    }

    // Hide context menu if open
    if (this.contextMenu) this.contextMenu.hidden = true;

    // Auto-scroll to bottom
    this.scrollToBottom();

    // Notify callback
    if (this.onMessageSent) {
      this.onMessageSent(messageText);
    }

    // Check for commands
    if (messageText.startsWith('/')) {
      this.handleCommand(messageText);
      return;
    }

    // Send to AI service
    if (this.assistantService) {
      this.showTypingIndicator();

      try {
        const response = await this.assistantService.query(messageText, {
          context: this.getCurrentPageContext()
        });

        this.removeTypingIndicator();
        this.addMessage(response, 'assistant');
      } catch (error) {
        console.error('AI Assistant error:', error);
        this.removeTypingIndicator();
        this.addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
        this.updateModelStatus('offline');
      }
    } else {
      // Demo mode - echo response
      setTimeout(() => {
        this.addMessage(`I received: "${messageText}". Connect an AI service for full functionality.`, 'assistant');
      }, 500);
    }
  }

  handleCommand(command) {
    const cmd = command.toLowerCase().trim();

    switch (cmd) {
      case '/clear':
        this.clearChat();
        this.addMessage('Chat history cleared.', 'assistant');
        break;

      case '/context':
        const context = this.getCurrentPageContext();
        this.addMessage(
          `Current page context:\n\n**Title:** ${context.title}\n**URL:** ${context.url}\n**Category:** ${context.category || 'N/A'}`,
          'assistant'
        );
        break;

      case '/summary':
        this.sendMessage('/summarize');
        break;

      case '/summarize':
        this.addMessage('Summarizing current page...', 'assistant');
        // Would call AI service with page content
        break;

      case '/help':
        this.addMessage(
          `Available commands:\n\n` +
          `/clear - Clear chat history\n` +
          `/context - Show current page context\n` +
          `/summary - Summarize current article\n` +
          `/help - Show this help message`,
          'assistant'
        );
        break;

      default:
        this.addMessage(`Unknown command: ${cmd}. Type /help for available commands.`, 'assistant');
    }
  }

  handleContextMenuAction(action) {
    switch (action) {
      case 'summarize':
        this.sendMessage('/summarize');
        break;
      case 'explain':
        this.addMessage('What concept would you like me to explain?', 'assistant');
        break;
      case 'related':
        this.addMessage('Finding related posts...', 'assistant');
        // Would call search service
        break;
      case 'language':
        this.addMessage('Language selection coming soon. Available: EN, RU', 'assistant');
        break;
    }
  }

  addMessage(content, type) {
    if (!this.messagesContainer) return;

    const templateId = type === 'user' ? 'user-message-template' : 'assistant-message-template';
    const template = document.getElementById(templateId);
    
    if (!template) return;

    const clone = template.content.cloneNode(true);
    const messageEl = clone.querySelector('.message');
    const contentEl = messageEl.querySelector('.message-content');

    // Convert markdown-like syntax to HTML
    contentEl.innerHTML = this.formatMessage(content);

    this.messagesContainer.appendChild(messageEl);
    this.messageHistory.push({ type, content });

    // Scroll to bottom
    this.scrollToBottom();
  }

  formatMessage(content) {
    // Escape user-controlled content first, then apply markdown formatting
    // to the safe (already-escaped) string. Prevents XSS via innerHTML.
    const escapeHtml = (s) => s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    return escapeHtml(content)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  showTypingIndicator() {
    const template = document.getElementById('loading-message-template');
    if (!template || !this.messagesContainer) return;

    const clone = template.content.cloneNode(true);
    const loadingEl = clone.querySelector('.message');
    loadingEl.id = 'typing-indicator-message';

    this.messagesContainer.appendChild(loadingEl);
    this.scrollToBottom();
  }

  removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator-message');
    if (indicator) {
      indicator.remove();
    }
  }

  scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  clearChat() {
    if (!this.messagesContainer) return;

    // Keep welcome message
    const welcomeMessage = this.messagesContainer.querySelector('.assistant-message:not(.loading)');
    this.messagesContainer.innerHTML = '';
    
    if (welcomeMessage) {
      this.messagesContainer.appendChild(welcomeMessage.cloneNode(true));
    }

    this.messageHistory = [];
  }

  getCurrentPageContext() {
    return {
      title: document.title,
      url: window.location.href,
      path: window.location.pathname,
      category: document.querySelector('[data-category]')?.dataset.category || null,
      tags: Array.from(document.querySelectorAll('[data-tag]')).map(el => el.dataset.tag),
      content: document.querySelector('article')?.innerText?.slice(0, 2000) || ''
    };
  }

  updateModelStatus(status) {
    const statusTexts = {
      loading: 'Model: Loading...',
      ready: 'Model: Ready',
      offline: 'Model: Offline'
    };

    if (this.modelStatusEl) {
      this.modelStatusEl.setAttribute('data-status', status);
      const textEl = this.modelStatusEl.querySelector('.status-text');
      if (textEl) {
        textEl.textContent = statusTexts[status] || status;
      }
    }

    if (this.statusDot) {
      this.statusDot.setAttribute('data-status', status);
    }
  }

  toggleChat() {
    if (this.isOpen()) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  openChat() {
    if (!this.toggleBtn || !this.chatContainer) return;

    this.toggleBtn.setAttribute('aria-expanded', 'true');
    this.chatContainer.hidden = false;

    // Focus input after animation
    setTimeout(() => {
      if (this.input) this.input.focus();
    }, 200);
  }

  closeChat() {
    if (!this.toggleBtn || !this.chatContainer) return;

    this.toggleBtn.setAttribute('aria-expanded', 'false');
    
    // Hide after animation
    setTimeout(() => {
      this.chatContainer.hidden = true;
      this.contextMenu.hidden = true;
    }, 200);
  }

  isOpen() {
    return this.toggleBtn && this.toggleBtn.getAttribute('aria-expanded') === 'true';
  }

  destroy() {
    // Cleanup
    this.widget = null;
    this.toggleBtn = null;
    this.chatContainer = null;
    this.messagesContainer = null;
  }
}

// Auto-initialize if element exists
if (document.getElementById('ai-assistant-widget')) {
  window.aiAssistantUI = new AssistantUI();
}

export default AssistantUI;
