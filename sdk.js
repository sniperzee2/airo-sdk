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

    const iframe = document.createElement("IFRAME");
    const env = options?.env || ENV.PRODUCTION;
    const baseUrl = options?.baseUrl || IFRAME_SRC_MAP[env];
    const IFRAME_SRC = `${baseUrl}/chat`;

    iframe.src = IFRAME_SRC;
    this.iframe = iframe;
    this.baseUrl = baseUrl;
    this.options = options;

    document.body.appendChild(this.iframe);
    this.isIframePresent = true;

    this.setStyles(options);

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
          this.iframe.style.width = this.OPEN_CHAT_WIDTH;
          this.iframe.style.height = this.OPEN_CHAT_HEIGHT;
          this.iframe.style.boxShadow =
            "rgba(0, 0, 0, 0.3) 0 20px 60px, rgba(0, 0, 0, 0.2) 0 8px 24px";
        } else {
          this.iframe.style.width = this.CLOSED_CHAT_WIDTH;
          this.iframe.style.height = this.CLOSED_CHAT_HEIGHT;
          this.iframe.style.boxShadow = "none";
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

  sendMessage(data) {
    if (this.iframe && this.iframe.contentWindow) {
      this.iframe.contentWindow.postMessage(data, "*");
    }
  }

  setStyles(options) {
    const position = options?.position || "bottom-right";
    const buttonSize = options?.buttonSize || 60;
    const buttonColor = options?.buttonColor || "#3b82f6";
    const zIndex = options?.zIndex || 9999;

    this.iframe.frameBorder = "0";
    this.iframe.style.width = `${buttonSize}px`;
    this.iframe.style.height = `${buttonSize}px`;
    this.iframe.style.border = "none";
    this.iframe.style.position = "fixed";
    this.iframe.style.zIndex = zIndex;
    this.iframe.style.borderRadius = "50%";
    this.iframe.style.overflow = "hidden";
    this.iframe.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    this.iframe.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)";

    // Set position based on options
    const offset = options?.offset || 20;
    if (position === "bottom-right") {
      this.iframe.style.bottom = `${offset}px`;
      this.iframe.style.right = `${offset}px`;
      this.iframe.style.left = "auto";
      this.iframe.style.top = "auto";
    } else if (position === "bottom-left") {
      this.iframe.style.bottom = `${offset}px`;
      this.iframe.style.left = `${offset}px`;
      this.iframe.style.right = "auto";
      this.iframe.style.top = "auto";
    } else if (position === "top-right") {
      this.iframe.style.top = `${offset}px`;
      this.iframe.style.right = `${offset}px`;
      this.iframe.style.left = "auto";
      this.iframe.style.bottom = "auto";
    } else if (position === "top-left") {
      this.iframe.style.top = `${offset}px`;
      this.iframe.style.left = `${offset}px`;
      this.iframe.style.right = "auto";
      this.iframe.style.bottom = "auto";
    }

    // Allow custom positioning
    if (options?.bottom !== undefined) this.iframe.style.bottom = options.bottom;
    if (options?.top !== undefined) this.iframe.style.top = options.top;
    if (options?.left !== undefined) this.iframe.style.left = options.left;
    if (options?.right !== undefined) this.iframe.style.right = options.right;

    // Send styles to iframe if needed
    this.sendMessage({
      type: this.MESSAGE_TYPES.SET_STYLES,
      data: options,
    });
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
  open() {
    this.sendMessage({ type: "open_chat" });
  }

  close() {
    this.sendMessage({ type: "close_chat" });
  }

  toggle() {
    this.sendMessage({ type: "toggle_chat" });
  }

  updateConfig(newConfig) {
    this.options = { ...this.options, ...newConfig };
    this.setStyles(this.options);
  }

  destroy() {
    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
    }
    this.isIframePresent = false;
    this.isReady = false;
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
