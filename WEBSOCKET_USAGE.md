# Chat Bubble Widget with WebSocket Support

This guide explains how to use the WebSocket-enabled version of the Chat Bubble Widget.

## Features

- ✅ **Real-time bidirectional communication** via WebSocket
- ✅ **Automatic fallback to HTTP** if WebSocket is unavailable
- ✅ **Auto-reconnection** with configurable retry attempts
- ✅ **Visual connection status** indicator
- ✅ **Custom event callbacks** for WebSocket events
- ✅ **Backward compatible** with the original HTTP-only version

## Quick Start

### Basic Setup (HTTP Only - Original Behavior)

```html
<!DOCTYPE html>
<html>
<head>
    <title>Chat Bubble Demo</title>
</head>
<body>
    <!-- Your page content -->
    
    <!-- Load the WebSocket-enabled chat bubble widget -->
    <script src="chat-bubble-ws.js"></script>
    
    <!-- Initialize with HTTP only -->
    <script>
        window.chatBubbleConfig = {
            collectionName: "your-collection-name",
            apiBaseUrl: "https://api.azrienlabs.com",
            title: "AI Assistant",
            welcomeMessage: "Hello! How can I help you today?"
        };
    </script>
</body>
</html>
```

### WebSocket Enabled Setup

```html
<!DOCTYPE html>
<html>
<head>
    <title>Chat Bubble with WebSocket</title>
</head>
<body>
    <!-- Your page content -->
    
    <!-- Load the WebSocket-enabled chat bubble widget -->
    <script src="chat-bubble-ws.js"></script>
    
    <!-- Initialize with WebSocket -->
    <script>
        window.chatBubbleConfig = {
            collectionName: "your-collection-name",
            apiBaseUrl: "https://api.azrienlabs.com",
            
            // WebSocket configuration
            useWebSocket: true,
            wsUrl: "wss://api.azrienlabs.com/ws",
            wsReconnectInterval: 3000,
            wsMaxReconnectAttempts: 5,
            
            // UI configuration
            title: "AI Assistant",
            welcomeMessage: "Hello! I'm connected via WebSocket!",
            position: "bottom-right",
            width: 400,
            height: 600
        };
    </script>
</body>
</html>
```

## Configuration Options

### WebSocket-Specific Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `useWebSocket` | Boolean | `false` | Enable/disable WebSocket communication |
| `wsUrl` | String | `""` | WebSocket server URL (e.g., `"wss://api.example.com/ws"`) |
| `wsReconnectInterval` | Number | `3000` | Time in milliseconds between reconnection attempts |
| `wsMaxReconnectAttempts` | Number | `5` | Maximum number of reconnection attempts |
| `onWebSocketConnect` | Function | `null` | Callback when WebSocket connects |
| `onWebSocketDisconnect` | Function | `null` | Callback when WebSocket disconnects |
| `onWebSocketError` | Function | `null` | Callback when WebSocket error occurs |
| `onWebSocketMessage` | Function | `null` | Callback when WebSocket message is received |

### Original Options (Still Available)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `collectionName` | String | `""` | Your collection identifier |
| `apiBaseUrl` | String | `"https://api.azrienlabs.com"` | HTTP API base URL (used as fallback) |
| `position` | String | `"bottom-right"` | Widget position: `"bottom-right"`, `"bottom-left"`, `"top-right"`, `"top-left"` |
| `welcomeMessage` | String | `"Hello! I'm your AI assistant..."` | Initial greeting message |
| `placeholder` | String | `"Type your message..."` | Input field placeholder text |
| `title` | String | `"AI Assistant"` | Chat window title |
| `subtitle` | String | `"Online"` | Chat window subtitle (overridden by WebSocket status when enabled) |
| `width` | Number | `400` | Chat window width in pixels |
| `height` | Number | `600` | Chat window height in pixels |
| `zIndex` | Number | `30` | CSS z-index for positioning |

## Advanced Usage

### With Event Callbacks

```html
<script>
    window.chatBubbleConfig = {
        collectionName: "my-collection",
        apiBaseUrl: "https://api.azrienlabs.com",
        useWebSocket: true,
        wsUrl: "wss://api.azrienlabs.com/ws",
        
        // Event callbacks
        onWebSocketConnect: function() {
            console.log("WebSocket connected!");
            // You can show a notification or update UI
        },
        
        onWebSocketDisconnect: function(event) {
            console.log("WebSocket disconnected:", event.code, event.reason);
            // Handle disconnection (e.g., show offline message)
        },
        
        onWebSocketError: function(error) {
            console.error("WebSocket error:", error);
            // Handle error (e.g., log to analytics)
        },
        
        onWebSocketMessage: function(data) {
            console.log("Received message:", data);
            // Process raw WebSocket messages
        }
    };
</script>
```

### Programmatic Initialization

```html
<script src="chat-bubble-ws.js"></script>
<script>
    // Initialize programmatically
    const chatWidget = window.initChatBubble({
        collectionName: "my-collection",
        useWebSocket: true,
        wsUrl: "wss://api.azrienlabs.com/ws",
        title: "Support Chat"
    });
    
    // Access widget methods
    chatWidget.toggle();           // Open/close the chat
    chatWidget.reconnectWebSocket(); // Manually reconnect WebSocket
    chatWidget.destroy();          // Clean up and remove widget
</script>
```

### Manual Control

```javascript
// Access the global instance
const chat = window.chatBubble;

// Check WebSocket status
console.log(chat.wsConnectionStatus); // "connected", "connecting", or "disconnected"

// Manually reconnect
chat.reconnectWebSocket();

// Close WebSocket connection
chat.closeWebSocket();

// Destroy widget completely
chat.destroy();
```

## WebSocket Message Protocol

### Client → Server Message Format

When you send a message, the widget sends this JSON to the server:

```json
{
  "type": "message",
  "content": "User's message text",
  "session_id": "session_1234567890_abc123",
  "collection_name": "your-collection-name",
  "timestamp": "2025-10-09T12:34:56.789Z"
}
```

### Server → Client Message Formats

The widget expects these message types from the server:

#### Bot Response
```json
{
  "type": "response",
  "content": "Bot's response text"
}
```

#### System Notification
```json
{
  "type": "notification",
  "content": "System notification message"
}
```

#### Error Message
```json
{
  "type": "error",
  "content": "Error message",
  "message": "Alternative error field"
}
```

## Visual Indicators

### Connection Status Badge

When WebSocket is enabled, the subtitle shows a live status badge:
- 🟢 **Live** - Connected and ready
- 🟡 **Connecting...** - Attempting to connect
- 🔴 **Offline** - Disconnected

### Bubble Button Indicator

A small colored dot appears on the chat bubble button:
- **Green** - WebSocket connected
- **Yellow** (pulsing) - Connecting
- **Red** - Disconnected

## Server-Side Implementation Example

### Node.js with `ws` library

```javascript
const WebSocket = require('ws');
const url = require('url');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws, req) => {
    const params = url.parse(req.url, true).query;
    const sessionId = params.session_id;
    const collectionName = params.collection_name;
    
    console.log(`Client connected: ${sessionId}`);
    
    // Send welcome message
    ws.send(JSON.stringify({
        type: 'notification',
        content: 'Connected to WebSocket server!'
    }));
    
    ws.on('message', async (data) => {
        try {
            const message = JSON.parse(data);
            console.log('Received:', message);
            
            if (message.type === 'message') {
                // Process the message (call your AI model, etc.)
                const response = await processMessage(message.content, sessionId, collectionName);
                
                // Send response back
                ws.send(JSON.stringify({
                    type: 'response',
                    content: response
                }));
            }
        } catch (error) {
            console.error('Error:', error);
            ws.send(JSON.stringify({
                type: 'error',
                content: 'Failed to process message'
            }));
        }
    });
    
    ws.on('close', () => {
        console.log(`Client disconnected: ${sessionId}`);
    });
});

async function processMessage(content, sessionId, collectionName) {
    // Your AI processing logic here
    return `Echo: ${content}`;
}
```

### Python with `websockets` library

```python
import asyncio
import json
import websockets
from urllib.parse import urlparse, parse_qs

async def handle_client(websocket, path):
    # Parse query parameters
    query = parse_qs(urlparse(path).query)
    session_id = query.get('session_id', [''])[0]
    collection_name = query.get('collection_name', [''])[0]
    
    print(f"Client connected: {session_id}")
    
    # Send welcome message
    await websocket.send(json.dumps({
        'type': 'notification',
        'content': 'Connected to WebSocket server!'
    }))
    
    try:
        async for message in websocket:
            data = json.loads(message)
            print(f"Received: {data}")
            
            if data['type'] == 'message':
                # Process message (call your AI model, etc.)
                response = await process_message(
                    data['content'], 
                    session_id, 
                    collection_name
                )
                
                # Send response
                await websocket.send(json.dumps({
                    'type': 'response',
                    'content': response
                }))
    except websockets.exceptions.ConnectionClosed:
        print(f"Client disconnected: {session_id}")

async def process_message(content, session_id, collection_name):
    # Your AI processing logic here
    return f"Echo: {content}"

# Start server
start_server = websockets.serve(handle_client, "0.0.0.0", 8080)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
```

## Troubleshooting

### WebSocket Not Connecting

1. **Check URL format**: Ensure `wsUrl` uses `wss://` (secure) or `ws://` (unsecure)
2. **Verify server is running**: Test WebSocket endpoint separately
3. **Check CORS settings**: WebSocket connections may require proper CORS configuration
4. **Inspect browser console**: Look for connection errors or blocked requests

### Fallback to HTTP

If WebSocket fails, the widget automatically falls back to HTTP API:
- Check that `apiBaseUrl` is correctly configured
- Ensure `/chat/ask/` endpoint is available

### Connection Drops Frequently

- Increase `wsReconnectInterval` for slower reconnection
- Check server-side keep-alive settings
- Monitor network stability

### Messages Not Appearing

- Verify server sends messages in the correct format (see protocol above)
- Check browser console for parsing errors
- Ensure `type` field matches expected values: `"response"`, `"notification"`, or `"error"`

## Migration from Original Version

The WebSocket version is **100% backward compatible**. Simply replace:

```html
<!-- Old -->
<script src="chat-bubble.min.js"></script>

<!-- New -->
<script src="chat-bubble-ws.js"></script>
```

Without any configuration changes, it behaves exactly like the original HTTP-only version.

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support  
- Safari: ✅ Full support
- Opera: ✅ Full support
- IE 11: ⚠️ WebSocket supported, but use polyfills for modern JavaScript

## License

MIT License - Same as original Chat Bubble Widget

## Support

For issues or questions:
- GitHub Issues: [Your Repository]
- Email: support@azrienlabs.com
- Documentation: https://azrienlabs.com/docs

---

**Version:** 1.1.0 with WebSocket Support  
**Last Updated:** October 9, 2025
