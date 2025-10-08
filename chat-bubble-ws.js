/*! Chat Bubble Widget with WebSocket v1.1.0 | MIT License | Built 2025-10-09 */
(function () {
  "use strict";

  const defaultConfig = {
    collectionName: "",
    apiBaseUrl: "https://api.azrienlabs.com",
    wsUrl: "", // WebSocket URL (e.g., "wss://api.azrienlabs.com/ws")
    useWebSocket: false, // Enable/disable WebSocket
    wsReconnectInterval: 3000, // Reconnection interval in ms
    wsMaxReconnectAttempts: 5, // Maximum reconnection attempts
    position: "bottom-right",
    welcomeMessage: "Hello! I'm your AI assistant. How can I help you today?",
    placeholder: "Type your message...",
    title: "AI Assistant",
    subtitle: "Online",
    width: 400,
    height: 600,
    zIndex: 30,
    onWebSocketConnect: null, // Callback when WebSocket connects
    onWebSocketDisconnect: null, // Callback when WebSocket disconnects
    onWebSocketError: null, // Callback when WebSocket error occurs
    onWebSocketMessage: null, // Callback when WebSocket message received
  };

  const icons = {
    messageCircle:
      '<span class="chat-bubble-icon" style="width:100%;height:100%;border-radius:50%;background:#ffffff;display:inline-flex;align-items:center;justify-content:center;overflow:hidden;"><img src="https://cdn.jsdelivr.net/gh/Azrienlabs/chat-bubble@main/bot-icon.png" alt="bot" style="display:block;width:100%;height:100%;object-fit:cover;"/></span>',
    x: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    send: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22,2 15,22 11,13 2,9"></polygon></svg>',
    bot: '<img src="https://cdn.jsdelivr.net/gh/Azrienlabs/chat-bubble@main/bot-icon.png" alt="bot" class="bot-icon" />',
    user: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
    minimize:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"></path><path d="M21 8h-3a2 2 0 0 1-2-2V3"></path><path d="M3 16h3a2 2 0 0 1 2 2v3"></path><path d="M16 21v-3a2 2 0 0 1 2-2h3"></path></svg>',
    maximize:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M21 8V5a2 2 0 0 0-2-2h-3"></path><path d="M3 16v3a2 2 0 0 0 2 2h3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path></svg>',
  };

  class ChatBubbleWidget {
    constructor(config = {}) {
      this.config = { ...defaultConfig, ...config };
      this.isOpen = false;
      this.isMinimized = false;
      this.messages = [];
      this.isLoading = false;
      this.sessionId = this.generateSessionId();
      this.container = null;

      // WebSocket properties
      this.ws = null;
      this.wsReconnectAttempts = 0;
      this.wsReconnectTimeout = null;
      this.wsConnectionStatus = "disconnected"; // disconnected, connecting, connected

      this.init();
    }

    generateSessionId() {
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getPositionClasses() {
      switch (this.config.position) {
        case "bottom-left":
          return { bottom: "16px", left: "16px" };
        case "top-right":
          return { top: "16px", right: "16px" };
        case "top-left":
          return { top: "16px", left: "16px" };
        default:
          return { bottom: "16px", right: "16px" };
      }
    }

    createStyles() {
      const styles = `
.chat-bubble-widget * {
box-sizing: border-box;
margin: 0;
padding: 0;
}
.chat-bubble-widget {
position: fixed;
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
z-index: ${this.config.zIndex};
}
.chat-bubble-button {
width: 64px;
height: 64px;
border-radius: 50%;
border: none;
background: blue;
color: white;
box-shadow: 0 8px 32px rgba(0,0,0,0.15);
cursor: pointer;
display: flex;
align-items: center;
justify-content: center;
transition: all 0.2s ease;
position: relative;
}
.chat-bubble-button:hover {
transform: scale(1.1);
}
.ws-status-indicator {
position: absolute;
top: 4px;
right: 4px;
width: 12px;
height: 12px;
border-radius: 50%;
border: 2px solid white;
}
.ws-status-indicator.connected {
background: #10b981;
}
.ws-status-indicator.connecting {
background: #f59e0b;
animation: pulse 1.5s ease-in-out infinite;
}
.ws-status-indicator.disconnected {
background: #ef4444;
}
@keyframes pulse {
0%, 100% {
opacity: 1;
}
50% {
opacity: 0.5;
}
}
.chat-window {
background: white;
border-radius: 12px;
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
display: flex;
flex-direction: column;
transition: all 0.3s ease;
overflow: hidden;
max-width: 90vw;
max-height: 90vh;
}
.chat-header {
background: white;
color: black;
padding: 16px;
display: flex;
align-items: center;
justify-content: space-between;
}
.chat-header-info {
display: flex;
align-items: center;
gap: 12px;
}
.chat-avatar {
width: 40px;
height: 40px;
border-radius: 50%;
background: black;
display: flex;
align-items: center;
justify-content: center;
overflow: hidden;
}
.chat-title {
font-weight: 600;
font-size: 14px;
margin: 0;
}
.chat-subtitle {
font-size: 12px;
opacity: 0.9;
margin: 0;
display: flex;
align-items: center;
gap: 6px;
}
.ws-badge {
display: inline-flex;
align-items: center;
gap: 4px;
padding: 2px 8px;
border-radius: 12px;
font-size: 10px;
font-weight: 500;
}
.ws-badge.connected {
background: #d1fae5;
color: #065f46;
}
.ws-badge.connecting {
background: #fef3c7;
color: #92400e;
}
.ws-badge.disconnected {
background: #fee2e2;
color: #991b1b;
}
.ws-badge-dot {
width: 6px;
height: 6px;
border-radius: 50%;
}
.ws-badge.connected .ws-badge-dot {
background: #10b981;
}
.ws-badge.connecting .ws-badge-dot {
background: #f59e0b;
}
.ws-badge.disconnected .ws-badge-dot {
background: #ef4444;
}
.chat-controls {
display: flex;
gap: 8px;
}
.chat-control-btn {
background: none;
border: none;
color: black;
padding: 4px;
border-radius: 4px;
cursor: pointer;
transition: background 0.2s ease;
}
.chat-control-btn:hover {
background: gray;
}
.chat-messages {
flex: 1;
overflow-y: auto;
padding: 16px;
background: #f9fafb;
max-height: 500px;
}
.message {
display: flex;
align-items: flex-start;
gap: 8px;
margin-bottom: 16px;
}
.message.user {
justify-content: flex-end;
}
.message.consecutive {
margin-bottom: 4px;
}
.message-avatar {
width: 32px;
height: 32px;
border-radius: 50%;
display: flex;
align-items: center;
justify-content: center;
flex-shrink: 0;
overflow: hidden;
}
.message-avatar.bot {
background: black;
color: white;
}
.message-avatar.user {
background: #d1d5db;
color: #6b7280;
}
.message-content {
max-width: 75%;
border-radius: 12px;
padding: 12px;
position: relative;
}
.message-content.bot {
background: white;
border: 1px solid #e5e7eb;
border-bottom-left-radius: 4px;
color: #1f2937;
}
.message-content.user {
background: #000000;
color: white;
border-bottom-right-radius: 4px;
}
.message-text {
font-size: 14px;
line-height: 1.5;
word-wrap: break-word;
margin: 0;
}
.message-time {
font-size: 12px;
margin-top: 4px;
opacity: 0.7;
}
.typing-indicator {
display: flex;
align-items: center;
gap: 8px;
}
.typing-dots {
display: flex;
gap: 4px;
}
.typing-dot {
width: 8px;
height: 8px;
border-radius: 50%;
background: #9ca3af;
animation: typing 1.4s infinite ease-in-out;
}
.typing-dot:nth-child(2) {
animation-delay: 0.1s;
}
.typing-dot:nth-child(3) {
animation-delay: 0.2s;
}
@keyframes typing {
0%, 80%, 100% {
transform: scale(0.8);
opacity: 0.5;
}
40% {
transform: scale(1);
opacity: 1;
}
}
.chat-input-area {
padding: 16px;
background: white;
border-top: 1px solid #e5e7eb;
}
.chat-input-form {
display: flex;
gap: 8px;
align-items: flex-end;
position: relative;
}
.chat-input {
flex: 1;
border: 1px solid #000000;
border-radius: 999px;
padding: 12px 56px 12px 16px;
font-size: 14px;
resize: none;
min-height: 40px;
max-height: 96px;
outline: none;
transition: border-color 0.2s ease;
background: white;
color: #000000;
}
.chat-input::placeholder {
color: rgba(0,0,0,0.6);
}
.chat-input, textarea.chat-input {
color: #000000 !important;
caret-color: #000000 !important;
}
.chat-input:focus {
border-color: #60a5fa;
box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
}
.chat-send-btn {
background: black;
color: white;
border: none;
border-radius: 50%;
width: 40px;
height: 40px;
padding: 0;
cursor: pointer;
transition: opacity 0.2s ease, transform 0.15s ease;
display: flex;
align-items: center;
justify-content: center;
position: absolute;
right: 12px;
top: 50%;
transform: translateY(-50%);
box-shadow: 0 6px 18px rgba(0,0,0,0.12);
}
.chat-send-btn:active {
transform: translateY(-50%) scale(0.98);
}
.chat-send-btn:disabled {
opacity: 0.5;
cursor: not-allowed;
}
.chat-send-btn:not(:disabled):hover {
opacity: 0.9;
}
.bot-icon, .chat-bubble-icon img {
width: 100%;
height: 100%;
object-fit: cover;
display: block;
}
.chat-bubble-widget .hidden {
display: none !important;
}
.chat-disclaimer {
font-size: 11px;
color: #6b7280;
margin-top: 8px;
padding: 0 4px 12px 4px;
}
`;
      const styleSheet = document.createElement("style");
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }

    init() {
      this.createStyles();
      this.createContainer();
      this.addWelcomeMessage();
      
      // Initialize WebSocket if enabled
      if (this.config.useWebSocket && this.config.wsUrl) {
        this.initWebSocket();
      }
    }

    // ==================== WebSocket Methods ====================

    initWebSocket() {
      if (!this.config.wsUrl) {
        console.warn("WebSocket URL not provided");
        return;
      }

      this.wsConnectionStatus = "connecting";
      this.render();

      try {
        // Construct WebSocket URL with session ID
        const wsUrl = new URL(this.config.wsUrl);
        wsUrl.searchParams.append("session_id", this.sessionId);
        if (this.config.collectionName) {
          wsUrl.searchParams.append("collection_name", this.config.collectionName);
        }

        this.ws = new WebSocket(wsUrl.toString());

        this.ws.onopen = () => {
          console.log("WebSocket connected");
          this.wsConnectionStatus = "connected";
          this.wsReconnectAttempts = 0;
          this.render();

          if (this.config.onWebSocketConnect) {
            this.config.onWebSocketConnect();
          }
        };

        this.ws.onmessage = (event) => {
          console.log("WebSocket message received:", event.data);
          this.handleWebSocketMessage(event.data);

          if (this.config.onWebSocketMessage) {
            this.config.onWebSocketMessage(event.data);
          }
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          
          if (this.config.onWebSocketError) {
            this.config.onWebSocketError(error);
          }
        };

        this.ws.onclose = (event) => {
          console.log("WebSocket disconnected", event.code, event.reason);
          this.wsConnectionStatus = "disconnected";
          this.render();

          if (this.config.onWebSocketDisconnect) {
            this.config.onWebSocketDisconnect(event);
          }

          // Attempt to reconnect
          this.attemptReconnect();
        };
      } catch (error) {
        console.error("Failed to initialize WebSocket:", error);
        this.wsConnectionStatus = "disconnected";
        this.render();
      }
    }

    attemptReconnect() {
      if (this.wsReconnectAttempts >= this.config.wsMaxReconnectAttempts) {
        console.log("Max reconnection attempts reached");
        return;
      }

      this.wsReconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.wsReconnectAttempts}/${this.config.wsMaxReconnectAttempts})`);

      this.wsReconnectTimeout = setTimeout(() => {
        this.initWebSocket();
      }, this.config.wsReconnectInterval);
    }

    handleWebSocketMessage(data) {
      try {
        const message = JSON.parse(data);
        
        // Handle different message types
        switch (message.type) {
          case "response":
            // Bot response
            const botMessage = {
              id: (Date.now() + 1).toString(),
              type: "bot",
              content: message.content || message.response,
              timestamp: new Date(),
            };
            this.messages.push(botMessage);
            this.isLoading = false;
            this.render();
            break;

          case "notification":
            // System notification
            const notificationMessage = {
              id: (Date.now() + 1).toString(),
              type: "bot",
              content: message.content,
              timestamp: new Date(),
            };
            this.messages.push(notificationMessage);
            this.render();
            break;

          case "error":
            // Error message
            const errorMessage = {
              id: (Date.now() + 1).toString(),
              type: "bot",
              content: `Error: ${message.content || message.message}`,
              timestamp: new Date(),
            };
            this.messages.push(errorMessage);
            this.isLoading = false;
            this.render();
            break;

          default:
            console.log("Unknown message type:", message.type);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    }

    sendWebSocketMessage(message) {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        console.error("WebSocket is not connected");
        return false;
      }

      const payload = {
        type: "message",
        content: message,
        session_id: this.sessionId,
        collection_name: this.config.collectionName,
        timestamp: new Date().toISOString(),
      };

      this.ws.send(JSON.stringify(payload));
      return true;
    }

    closeWebSocket() {
      if (this.wsReconnectTimeout) {
        clearTimeout(this.wsReconnectTimeout);
        this.wsReconnectTimeout = null;
      }

      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      this.wsConnectionStatus = "disconnected";
    }

    // ==================== Original Methods (Modified) ====================

    createContainer() {
      this.container = document.createElement("div");
      this.container.className = "chat-bubble-widget";
      const position = this.getPositionClasses();
      Object.assign(this.container.style, position);
      this.render();
      document.body.appendChild(this.container);
    }

    addWelcomeMessage() {
      this.messages.push({
        id: "1",
        type: "bot",
        content: this.config.welcomeMessage,
        timestamp: new Date(),
      });
    }

    async sendMessage(message) {
      if (!message.trim() || this.isLoading) return;

      const userMessage = {
        id: Date.now().toString(),
        type: "user",
        content: message.trim(),
        timestamp: new Date(),
      };
      this.messages.push(userMessage);
      this.isLoading = true;
      this.render();

      // Use WebSocket if available and connected
      if (this.config.useWebSocket && this.ws && this.ws.readyState === WebSocket.OPEN) {
        const sent = this.sendWebSocketMessage(message.trim());
        if (sent) {
          // WebSocket message sent, response will come via onmessage
          return;
        }
        // If WebSocket send failed, fall back to HTTP
        console.warn("WebSocket send failed, falling back to HTTP");
      }

      // Fall back to HTTP API
      try {
        const response = await fetch(`${this.config.apiBaseUrl}/chat/ask/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            thread_id: this.sessionId,
            collection_name: this.config.collectionName,
            message: message.trim(),
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const botMessage = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: result.response,
          timestamp: new Date(),
        };
        this.messages.push(botMessage);
      } catch (error) {
        console.error("Chat error:", error);
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: `Sorry, I encountered an error: ${error.message}`,
          timestamp: new Date(),
        };
        this.messages.push(errorMessage);
      } finally {
        this.isLoading = false;
        this.render();
      }
    }

    render() {
      if (!this.container) return;

      if (!this.isOpen) {
        const wsIndicator = this.config.useWebSocket ? `
          <div class="ws-status-indicator ${this.wsConnectionStatus}"></div>
        ` : '';
        
        this.container.innerHTML = `
<button class="chat-bubble-button" onclick="window.chatBubble.toggle()">
${icons.messageCircle}
${wsIndicator}
</button>
`;
        return;
      }

      const messagesHtml = this.messages
        .map((message, index) => {
          const isConsecutive =
            index > 0 && this.messages[index - 1].type === message.type;
          const avatarHtml = !isConsecutive
            ? `
<div class="message-avatar ${message.type}">
${message.type === "bot" ? icons.bot : icons.user}
</div>
`
            : '<div style="width: 32px;"></div>';
          return `
<div class="message ${message.type} ${isConsecutive ? "consecutive" : ""}">
${message.type === "bot" ? avatarHtml : ""}
<div class="message-content ${message.type}">
<p class="message-text">${message.content}</p>
</div>
${message.type === "user" ? avatarHtml : ""}
</div>
`;
        })
        .join("");

      const loadingHtml = this.isLoading
        ? `
<div class="message bot">
<div class="message-content bot">
<div class="typing-indicator">
<div class="typing-dots">
<div class="typing-dot"></div>
<div class="typing-dot"></div>
<div class="typing-dot"></div>
</div>
<span style="font-size: 12px; color: #6b7280; margin-left: 8px;">Thinking...</span>
</div>
</div>
</div>
`
        : "";

      const wsBadge = this.config.useWebSocket ? `
        <span class="ws-badge ${this.wsConnectionStatus}">
          <span class="ws-badge-dot"></span>
          ${this.wsConnectionStatus === "connected" ? "Live" : 
            this.wsConnectionStatus === "connecting" ? "Connecting..." : "Offline"}
        </span>
      ` : this.config.subtitle;

      this.container.innerHTML = `
<div class="chat-window" style="width: ${this.config.width}px; height: ${
        this.isMinimized ? "64px" : this.config.height + "px"
      };">
<div class="chat-header">
<div class="chat-header-info">
<div class="chat-avatar">${icons.bot}</div>
<div>
<h3 class="chat-title">${this.config.title}</h3>
<p class="chat-subtitle">${wsBadge}</p>
</div>
</div>
<div class="chat-controls">
<button class="chat-control-btn" onclick="window.chatBubble.close()">
${icons.x}
</button>
</div>
</div>
<div class="chat-messages ${this.isMinimized ? "hidden" : ""}">
${messagesHtml}
${loadingHtml}
</div>
<div class="chat-input-area ${this.isMinimized ? "hidden" : ""}">
<form class="chat-input-form" onsubmit="window.chatBubble.handleSubmit(event)">
<textarea
class="chat-input"
placeholder="${this.config.placeholder}"
rows="1"
onkeydown="window.chatBubble.handleKeyDown(event)"
${this.isLoading ? "disabled" : ""}
></textarea>
<button type="submit" class="chat-send-btn" ${this.isLoading ? "disabled" : ""}>
${icons.send}
</button>
</form>
<div class="chat-disclaimer">By chatting with us, you agree to the monitoring and recording of this chat to deliver our services and processing of your personal data in accordance with our <a href="#" target="_blank">Privacy Policy</a>.</div>
</div>
</div>
`;

      const messagesContainer = this.container.querySelector(".chat-messages");
      if (messagesContainer && !this.isMinimized) {
        setTimeout(() => {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 50);
      }
    }

    toggle() {
      this.isOpen = !this.isOpen;
      this.render();
    }

    close() {
      this.isOpen = false;
      this.render();
    }

    toggleMinimize() {
      this.isMinimized = !this.isMinimized;
      this.render();
    }

    handleSubmit(event) {
      event.preventDefault();
      const input = event.target.querySelector(".chat-input");
      const message = input.value.trim();
      if (message) {
        this.sendMessage(message);
        input.value = "";
      }
    }

    handleKeyDown(event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        const form = event.target.closest("form");
        this.handleSubmit({ preventDefault: () => {}, target: form });
      }
    }

    // Public method to manually reconnect WebSocket
    reconnectWebSocket() {
      this.closeWebSocket();
      this.wsReconnectAttempts = 0;
      if (this.config.useWebSocket && this.config.wsUrl) {
        this.initWebSocket();
      }
    }

    // Cleanup method
    destroy() {
      this.closeWebSocket();
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
    }
  }

  window.ChatBubbleWidget = ChatBubbleWidget;

  if (window.chatBubbleConfig) {
    window.chatBubble = new ChatBubbleWidget(window.chatBubbleConfig);
  }

  window.initChatBubble = function (config) {
    window.chatBubble = new ChatBubbleWidget(config);
    return window.chatBubble;
  };
})();
