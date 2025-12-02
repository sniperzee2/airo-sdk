/**
 * Aura Chat Widget SDK
 * A lightweight, embeddable chat widget that opens Aura chat in an iframe
 */

function log(...objects) {
  if (window.origin.includes("localhost")) console.log(...objects);
}

const ENV = {
  PRODUCTION: "production",
  STAGING: "staging",
  DEV: "dev",
};

const IFRAME_SRC_MAP = {
  [ENV.PRODUCTION]: "https://ask-airo-dot-aichat-408808.ey.r.appspot.com",
  [ENV.STAGING]: "https://ask-airo-dot-aichat-408808.ey.r.appspot.com",
  [ENV.DEV]: "https://ask-airo-dot-aichat-408808.ey.r.appspot.com",
};

class AskAiroChat {
  isIframePresent = false;
  isReady = false;
  isOpen = false;

  MESSAGE_TYPES = {
    IS_READY: "is_ready",
    IS_CHATBOX_OPEN: "is_chatbox_open",
    SET_STYLES: "set_styles",
    URL_CHANGED: "url_changed",
  };

  CLOSED_CHAT_WIDTH = "60px";
  CLOSED_CHAT_HEIGHT = "60px";
  OPEN_CHAT_WIDTH = "400px";
  OPEN_CHAT_HEIGHT = "600px";

  constructor(options = {}) {
    if (this.isIframePresent) return;

    const env = options?.env || ENV.PRODUCTION;
    const baseUrl = options?.baseUrl || IFRAME_SRC_MAP[env];
    const IFRAME_SRC = `${baseUrl}/chat`;

    this.baseUrl = baseUrl;
    this.options = options;
    this.iframeSrc = IFRAME_SRC;

    // Create button
    this.createButton(options);

    // Create iframe container
    this.createIframeContainer(options);

    this.isIframePresent = true;

    const handleMessage = (event) => {
      // Allow messages from the base URL (without path)
      const allowedOrigin = baseUrl;
      if (!event.origin.includes(allowedOrigin.replace(/^https?:\/\//, "").split("/")[0])) {
        return;
      }

      log("MESSAGE FROM IFRAME", event.data);

      if (event.data?.type === this.MESSAGE_TYPES.IS_READY) {
        this.isReady = true;
      } else if (event.data?.type === this.MESSAGE_TYPES.IS_CHATBOX_OPEN) {
        if (event.data.data) {
          this.open();
        } else {
          this.close();
        }
      }
    };

    window.addEventListener("message", handleMessage);
    this.trackUrlChanges();

    // Send ready message after a short delay to allow iframe to load
    setTimeout(() => {
      this.sendMessage({ type: this.MESSAGE_TYPES.IS_READY });
    }, 100);
  }

  createButton(options) {
    const button = document.createElement("button");
    const position = options?.position || "bottom-right";
    const buttonSize = options?.buttonSize || 60;
    const buttonColor = options?.buttonColor || "#3b82f6";
    const zIndex = options?.zIndex || 9999;
    const offset = options?.offset || 20;

    button.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width: 28px; height: 28px; fill: white;">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
    `;

    button.setAttribute('aria-label', 'Open Ask Airo Chat');
    button.setAttribute('role', 'button');
    button.style.cssText = `
      position: fixed;
      width: ${buttonSize}px;
      height: ${buttonSize}px;
      border-radius: 50%;
      background: ${buttonColor};
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: ${zIndex};
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      padding: 0;
      outline: none;
    `;

    // Set position
    if (position === "bottom-right") {
      button.style.bottom = `${offset}px`;
      button.style.right = `${offset}px`;
    } else if (position === "bottom-left") {
      button.style.bottom = `${offset}px`;
      button.style.left = `${offset}px`;
    } else if (position === "top-right") {
      button.style.top = `${offset}px`;
      button.style.right = `${offset}px`;
    } else if (position === "top-left") {
      button.style.top = `${offset}px`;
      button.style.left = `${offset}px`;
    }

    // Allow custom positioning
    if (options?.bottom !== undefined) button.style.bottom = options.bottom;
    if (options?.top !== undefined) button.style.top = options.top;
    if (options?.left !== undefined) button.style.left = options.left;
    if (options?.right !== undefined) button.style.right = options.right;

    button.addEventListener("mouseenter", () => {
      button.style.transform = "scale(1.1)";
      button.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.15)";
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "scale(1)";
      button.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)";
    });

    button.addEventListener("click", () => {
      this.toggle();
    });

    document.body.appendChild(button);
    this.button = button;
  }

  createIframeContainer(options) {
    const container = document.createElement("div");
    const iframe = document.createElement("iframe");
    const position = options?.position || "bottom-right";
    const buttonSize = options?.buttonSize || 60;
    const zIndex = (options?.zIndex || 9999) - 1;
    const offset = options?.offset || 20;
    const iframeWidth = options?.iframeWidth || 400;
    const iframeHeight = options?.iframeHeight || 600;

    iframe.src = this.iframeSrc;
    iframe.frameBorder = "0";
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    `;
    iframe.setAttribute('allow', 'microphone; camera');
    iframe.setAttribute('title', 'Ask Airo Chat');

    // Close button
    const closeButton = document.createElement("button");
    closeButton.innerHTML = "×";
    closeButton.setAttribute('aria-label', 'Close chat');
    closeButton.style.cssText = `
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
      z-index: ${zIndex + 1};
      transition: all 0.2s;
      color: white;
      font-size: 20px;
      line-height: 1;
      padding: 0;
    `;

    closeButton.addEventListener("mouseenter", () => {
      closeButton.style.background = "rgba(0, 0, 0, 0.7)";
      closeButton.style.transform = "rotate(90deg)";
    });

    closeButton.addEventListener("mouseleave", () => {
      closeButton.style.background = "rgba(0, 0, 0, 0.5)";
      closeButton.style.transform = "rotate(0deg)";
    });

    closeButton.addEventListener("click", () => {
      this.close();
    });

    container.appendChild(closeButton);
    container.appendChild(iframe);

    container.style.cssText = `
      position: fixed;
      width: ${iframeWidth}px;
      height: ${iframeHeight}px;
      z-index: ${zIndex};
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      opacity: 0;
      transform: scale(0.8) translateY(20px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
      background: white;
    `;

    // Set position based on button position
    if (position === "bottom-right") {
      container.style.bottom = `${buttonSize + offset + 10}px`;
      container.style.right = `${offset}px`;
    } else if (position === "bottom-left") {
      container.style.bottom = `${buttonSize + offset + 10}px`;
      container.style.left = `${offset}px`;
    } else if (position === "top-right") {
      container.style.top = `${buttonSize + offset + 10}px`;
      container.style.right = `${offset}px`;
    } else if (position === "top-left") {
      container.style.top = `${buttonSize + offset + 10}px`;
      container.style.left = `${offset}px`;
    }

    // Mobile responsive
    const mobileStyle = `
      @media (max-width: 480px) {
        #${container.id || 'aura-chat-container'} {
          width: 100vw !important;
          height: 100vh !important;
          border-radius: 0 !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
        }
      }
    `;

    // Inject mobile styles if not already present
    if (!document.getElementById('aura-chat-mobile-styles')) {
      const style = document.createElement('style');
      style.id = 'aura-chat-mobile-styles';
      style.textContent = mobileStyle;
      document.head.appendChild(style);
    }

    container.id = 'aura-chat-container-' + Date.now();
    document.body.appendChild(container);
    this.container = container;
    this.iframe = iframe;
  }

  sendMessage(data) {
    if (this.iframe && this.iframe.contentWindow) {
      this.iframe.contentWindow.postMessage(data, "*");
    }
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.container.style.opacity = "1";
    this.container.style.transform = "scale(1) translateY(0)";
    this.container.style.pointerEvents = "all";
    this.button.style.transform = "scale(0.9)";
    if (this.iframe) {
      this.iframe.focus();
    }
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.container.style.opacity = "0";
    this.container.style.transform = "scale(0.8) translateY(20px)";
    this.container.style.pointerEvents = "none";
    this.button.style.transform = "scale(1)";
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  // Track URL changes and send to iframe
  trackUrlChanges() {
    const sendUrlToIframe = () => {
      const currentUrl = window.location.href;
      this.sendMessage({
        type: this.MESSAGE_TYPES.URL_CHANGED,
        url: currentUrl,
      });
    };

    // Intercept pushState and replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      sendUrlToIframe();
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      sendUrlToIframe();
    };

    // Listen to back/forward navigation (popstate)
    window.addEventListener("popstate", sendUrlToIframe);

    // Send initial URL when SDK is loaded
    sendUrlToIframe();
  }

  // Public API methods
  updateConfig(newConfig) {
    this.options = { ...this.options, ...newConfig };
    // Recreate button and container with new config
    this.destroy();
    this.isIframePresent = false;
    const newInstance = new AskAiroChat(this.options);
    Object.assign(this, newInstance);
  }

  destroy() {
    if (this.button && this.button.parentNode) {
      this.button.parentNode.removeChild(this.button);
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.isIframePresent = false;
    this.isReady = false;
    this.isOpen = false;
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
    const env = script.getAttribute('data-env');
    const position = script.getAttribute('data-position');
    const buttonColor = script.getAttribute('data-button-color');
    const buttonSize = script.getAttribute('data-button-size');
    const zIndex = script.getAttribute('data-z-index');

    if (baseUrl) config.baseUrl = baseUrl;
    if (env) config.env = env;
    if (position) config.position = position;
    if (buttonColor) config.buttonColor = buttonColor;
    if (buttonSize) config.buttonSize = parseInt(buttonSize, 10);
    if (zIndex) config.zIndex = parseInt(zIndex, 10);
  }

  // Check for global config
  if (window.AuraChatConfig) {
    config = { ...config, ...window.AuraChatConfig };
  }

  // Only auto-initialize if config is provided (via data attributes or global config)
  if (Object.keys(config).length === 0 && !config.baseUrl) {
    return null; // Don't auto-initialize if no config provided
  }

  // Create widget instance
  const widget = new AskAiroChat(config);

  // Expose widget to window for programmatic control (backward compatibility)
  window.AuraChatWidget = widget;

  return widget;
}

// Expose to global window
window.AskAiroChat = AskAiroChat;
// Backward compatibility
window.AuraChatWidget = AskAiroChat;

// Export for CommonJS (Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AskAiroChat;
}

// Auto-initialize when DOM is ready (only for script tag usage)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWidget);
} else {
  // DOM already ready, initialize immediately
  setTimeout(initWidget, 0);
}
