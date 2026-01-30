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
    const baseUrl =
      options?.baseUrl || "https://ask-airo-dot-aichat-408808.ey.r.appspot.com";
    const IFRAME_SRC = `${baseUrl}/chat/ask-airo`;

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
      if (
        !event.origin.includes(
          allowedOrigin.replace(/^https?:\/\//, "").split("/")[0]
        )
      ) {
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
    // Airo brand color: blue-500 to blue-600 gradient (using blue-600 as default)
    const buttonColor = options?.buttonColor || "#2563eb";
    const zIndex = options?.zIndex || 9999;
    const offset = options?.offset || 20;

    // Airo Sparkles icon SVG (default - when closed) - matches the app's icon
    const airoIcon = `
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path><path d="M4 17v2"></path><path d="M5 18H3"></path></svg>
    `;

    // Close/X icon SVG (when open)
    const closeIcon = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width: 28px; height: 28px; fill: white;">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    `;

    button.innerHTML = airoIcon;

    button.setAttribute("aria-label", "Open Ask Airo Chat");
    button.setAttribute("role", "button");
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
      button.style.boxShadow =
        "0 6px 16px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.15)";
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "scale(1)";
      button.style.boxShadow =
        "0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)";
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

    // Create unique ID for container
    const containerId = "aura-chat-container-" + Date.now();
    container.id = containerId;

    iframe.src = this.iframeSrc;
    iframe.frameBorder = "0";
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      display: block;
      background: white;
    `;
    iframe.setAttribute("allow", "microphone; camera");
    iframe.setAttribute("title", "Ask Airo Chat");

    // No close button - removed as requested
    container.appendChild(iframe);

    // Set container styles - HIDDEN by default
    container.style.cssText = `
      position: fixed;
      width: ${iframeWidth}px;
      height: ${iframeHeight}px;
      z-index: ${zIndex};
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      opacity: 0;
      visibility: hidden;
      transform: scale(0.8) translateY(20px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
      background: white;
      display: block;
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

    // Mobile responsive styles
    const mobileStyle = `
      @media (max-width: 480px) {
        #${containerId} {
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
    if (!document.getElementById("aura-chat-mobile-styles")) {
      const style = document.createElement("style");
      style.id = "aura-chat-mobile-styles";
      style.textContent = mobileStyle;
      document.head.appendChild(style);
    }

    // Append container to body (separate from button)
    document.body.appendChild(container);
    this.container = container;
    this.iframe = iframe;
  }

  sendMessage(data) {
    if (this.iframe && this.iframe.contentWindow) {
      this.iframe.contentWindow.postMessage(data, "*");
    }
  }

  updateButtonIcon(isOpen) {
    if (!this.button) return;

    // Airo Sparkles icon (when closed)
    const airoIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path><path d="M4 17v2"></path><path d="M5 18H3"></path></svg>
    `;

    // Close/X icon (when open)
    const closeIcon = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width: 28px; height: 28px; fill: white;">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    `;

    this.button.innerHTML = isOpen ? closeIcon : airoIcon;
    this.button.setAttribute(
      "aria-label",
      isOpen ? "Close Ask Airo Chat" : "Open Ask Airo Chat"
    );
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.container.style.opacity = "1";
    this.container.style.visibility = "visible";
    this.container.style.transform = "scale(1) translateY(0)";
    this.container.style.pointerEvents = "all";
    this.button.style.transform = "scale(0.9)";
    this.updateButtonIcon(true); // Show close icon
    if (this.iframe) {
      this.iframe.focus();
    }
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.container.style.opacity = "0";
    this.container.style.visibility = "hidden";
    this.container.style.transform = "scale(0.8) translateY(20px)";
    this.container.style.pointerEvents = "none";
    this.button.style.transform = "scale(1)";
    this.updateButtonIcon(false); // Show chat icon
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
  const script =
    document.currentScript ||
    document.querySelector("script[data-aura-config]") ||
    document.querySelector('script[src*="sdk"]');

  let config = {};

  if (script) {
    // Get config from data attributes
    const baseUrl = script.getAttribute("data-base-url");
    const env = script.getAttribute("data-env");
    const position = script.getAttribute("data-position");
    const buttonColor = script.getAttribute("data-button-color");
    const buttonSize = script.getAttribute("data-button-size");
    const zIndex = script.getAttribute("data-z-index");

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
if (typeof module !== "undefined" && module.exports) {
  module.exports = AskAiroChat;
}

// Auto-initialize when DOM is ready (only for script tag usage)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initWidget);
} else {
  // DOM already ready, initialize immediately
  setTimeout(initWidget, 0);
}
