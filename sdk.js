/**
 * Aura Chat Widget SDK
 * A lightweight, embeddable chat widget that opens Aura chat in an iframe
 */

// Default configuration
const DEFAULT_CONFIG = {
  baseUrl: 'https://ask-airo-dot-aichat-408808.ey.r.appspot.com',
  position: 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
  buttonColor: '#3b82f6', // Blue color
  buttonSize: 60, // Size in pixels
  iframeWidth: 400,
  iframeHeight: 600,
  zIndex: 9999,
  autoOpen: false
};

class AskAiroChat {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isOpen = false;
    this.widgetId = 'aura-chat-widget-' + Date.now();
    this.init();
  }

  init() {
    // Create styles
    this.injectStyles();
    
    // Create button
    this.createButton();
    
    // Create iframe container
    this.createIframeContainer();

    // Auto open if configured
    if (this.config.autoOpen) {
      setTimeout(() => this.toggle(), 100);
    }
  }

  injectStyles() {
    if (document.getElementById('aura-widget-styles')) {
      return; // Styles already injected
    }

    const style = document.createElement('style');
    style.id = 'aura-widget-styles';
    style.textContent = `
      #${this.widgetId}-button {
        position: fixed;
        width: ${this.config.buttonSize}px;
        height: ${this.config.buttonSize}px;
        border-radius: 50%;
        background: ${this.config.buttonColor};
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: ${this.config.zIndex};
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        padding: 0;
        outline: none;
      }
      
      #${this.widgetId}-button:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.15);
      }
      
      #${this.widgetId}-button:active {
        transform: scale(0.95);
      }
      
      #${this.widgetId}-button svg {
        width: 28px;
        height: 28px;
        fill: white;
      }
      
      #${this.widgetId}-container {
        position: fixed;
        width: ${this.config.iframeWidth}px;
        height: ${this.config.iframeHeight}px;
        z-index: ${this.config.zIndex - 1};
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2);
        overflow: hidden;
        opacity: 0;
        transform: scale(0.8) translateY(20px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
        background: white;
      }
      
      #${this.widgetId}-container.open {
        opacity: 1;
        transform: scale(1) translateY(0);
        pointer-events: all;
      }
      
      #${this.widgetId}-iframe {
        width: 100%;
        height: 100%;
        border: none;
        display: block;
      }
      
      #${this.widgetId}-close {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.5);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: ${this.config.zIndex};
        transition: all 0.2s;
        color: white;
        font-size: 20px;
        line-height: 1;
        padding: 0;
      }
      
      #${this.widgetId}-close:hover {
        background: rgba(0, 0, 0, 0.7);
        transform: rotate(90deg);
      }
      
      @media (max-width: 480px) {
        #${this.widgetId}-container {
          width: 100vw;
          height: 100vh;
          border-radius: 0;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  getPositionStyles() {
    const offset = 20;
    const buttonSize = this.config.buttonSize;
    
    const positions = {
      'bottom-right': {
        button: {
          bottom: `${offset}px`,
          right: `${offset}px`
        },
        container: {
          bottom: `${buttonSize + offset + 10}px`,
          right: `${offset}px`
        }
      },
      'bottom-left': {
        button: {
          bottom: `${offset}px`,
          left: `${offset}px`
        },
        container: {
          bottom: `${buttonSize + offset + 10}px`,
          left: `${offset}px`
        }
      },
      'top-right': {
        button: {
          top: `${offset}px`,
          right: `${offset}px`
        },
        container: {
          top: `${buttonSize + offset + 10}px`,
          right: `${offset}px`
        }
      },
      'top-left': {
        button: {
          top: `${offset}px`,
          left: `${offset}px`
        },
        container: {
          top: `${buttonSize + offset + 10}px`,
          left: `${offset}px`
        }
      }
    };
    
    return positions[this.config.position] || positions['bottom-right'];
  }

  createButton() {
    const button = document.createElement('button');
    button.id = `${this.widgetId}-button`;
    button.setAttribute('aria-label', 'Open Aura Chat');
    button.setAttribute('role', 'button');
    
    // Chat icon SVG
    button.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
    `;
    
    const positionStyles = this.getPositionStyles();
    Object.assign(button.style, positionStyles.button);
    
    button.addEventListener('click', () => this.toggle());
    
    document.body.appendChild(button);
    this.button = button;
  }

  createIframeContainer() {
    const container = document.createElement('div');
    container.id = `${this.widgetId}-container`;
    
    const positionStyles = this.getPositionStyles();
    Object.assign(container.style, positionStyles.container);
    
    // Close button
    const closeButton = document.createElement('button');
    closeButton.id = `${this.widgetId}-close`;
    closeButton.innerHTML = '×';
    closeButton.setAttribute('aria-label', 'Close chat');
    closeButton.addEventListener('click', () => this.close());
    
    // Iframe
    const iframe = document.createElement('iframe');
    iframe.id = `${this.widgetId}-iframe`;
    iframe.src = `${this.config.baseUrl}/chat`;
    iframe.setAttribute('allow', 'microphone; camera');
    iframe.setAttribute('title', 'Aura Chat');
    
    container.appendChild(closeButton);
    container.appendChild(iframe);
    
    document.body.appendChild(container);
    this.container = container;
    this.iframe = iframe;
  }

  open() {
    if (this.isOpen) return;
    
    this.isOpen = true;
    this.container.classList.add('open');
    this.button.style.transform = 'scale(0.9)';
    
    // Focus management
    this.iframe.focus();
  }

  close() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    this.container.classList.remove('open');
    this.button.style.transform = '';
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  destroy() {
    if (this.button && this.button.parentNode) {
      this.button.parentNode.removeChild(this.button);
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    const styles = document.getElementById('aura-widget-styles');
    if (styles && styles.parentNode) {
      styles.parentNode.removeChild(styles);
    }
  }

  // Public API methods
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    // Reinitialize if needed
    this.destroy();
    this.init();
  }
}

// Initialize widget when script loads (for script tag usage with data attributes)
function initWidget() {
  // Skip if user already created an instance manually
  if (window.AuraChatWidget && window.AuraChatWidget instanceof AskAiroChat) {
    return window.AuraChatWidget;
  }
  
  // Get config from data attributes or global config
  const script = document.currentScript || 
    document.querySelector('script[data-aura-config]') ||
    document.querySelector('script[src*="sdk"]');
  
  let config = {};
  
  if (script) {
    // Get config from data attributes
    const baseUrl = script.getAttribute('data-base-url');
    const position = script.getAttribute('data-position');
    const buttonColor = script.getAttribute('data-button-color');
    const buttonSize = script.getAttribute('data-button-size');
    const autoOpen = script.getAttribute('data-auto-open');
    
    if (baseUrl) config.baseUrl = baseUrl;
    if (position) config.position = position;
    if (buttonColor) config.buttonColor = buttonColor;
    if (buttonSize) config.buttonSize = parseInt(buttonSize, 10);
    if (autoOpen) config.autoOpen = autoOpen === 'true';
  }
  
  // Check for global config
  if (typeof window !== 'undefined' && window.AuraChatConfig) {
    config = { ...config, ...window.AuraChatConfig };
  }
  
  // Only auto-initialize if config is provided (via data attributes or global config)
  if (Object.keys(config).length === 0) {
    return null; // Don't auto-initialize if no config provided
  }
  
  // Create widget instance
  const widget = new AskAiroChat(config);
  
  // Expose widget to window for programmatic control (backward compatibility)
  if (typeof window !== 'undefined') {
    window.AuraChatWidget = widget;
  }
  
  return widget;
}

// Export for global window (script tag usage) - must be first
if (typeof window !== 'undefined') {
  window.AskAiroChat = AskAiroChat;
  // Backward compatibility
  window.AuraChatWidget = AskAiroChat;
}

// Export for CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AskAiroChat;
}

// Auto-initialize when DOM is ready (only for script tag usage)
// Check if we're in a browser environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Only auto-init if this is loaded as a script tag (not CommonJS/Node.js)
  const isNode = typeof module !== 'undefined' && module.exports;
  
  if (!isNode) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initWidget);
    } else {
      // DOM already ready, initialize immediately
      setTimeout(initWidget, 0);
    }
  }
}

