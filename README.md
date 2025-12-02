# Aura Chat Widget SDK

A lightweight, embeddable chat widget SDK for the Aura chat application. This SDK creates a floating chat button that opens the Aura chat interface in an iframe.

## Features

- 🎨 Customizable button position and styling
- 📱 Responsive design (fullscreen on mobile)
- 🚀 Lightweight and fast
- 🔧 Easy integration
- 🎯 Zero dependencies

## File Structure

```
aura-sdk/
├── sdk.js          # Source file
├── sdk.min.js       # Minified production file (generated)
├── package.json     # Package configuration
└── README.md        # This file
```

## Usage

### Script Tag (Auto-Initialize)

```html
<script 
  src="https://your-cdn-url.com/sdk.min.js"
  data-base-url="https://ask-airo-dot-aichat-408808.ey.r.appspot.com"
  data-position="bottom-right"
  data-button-color="#3b82f6"
  data-button-size="60">
</script>
```

### Class-Based Import

```javascript
// After loading the script, use the class
const chat = new AskAiroChat({
  baseUrl: 'https://ask-airo-dot-aichat-408808.ey.r.appspot.com',
  position: 'bottom-right',
  buttonColor: '#3b82f6',
  buttonSize: 60
});

// Control programmatically
chat.open();
chat.close();
chat.toggle();
chat.destroy();
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | string | `'https://ask-airo-dot-aichat-408808.ey.r.appspot.com'` | Base URL of the Aura chat application |
| `position` | string | `'bottom-right'` | Position of the chat button |
| `buttonColor` | string | `'#3b82f6'` | Color of the chat button (hex color) |
| `buttonSize` | number | `60` | Size of the chat button in pixels |
| `iframeWidth` | number | `400` | Width of the chat iframe in pixels |
| `iframeHeight` | number | `600` | Height of the chat iframe in pixels |
| `zIndex` | number | `9999` | CSS z-index of the widget |
| `autoOpen` | boolean | `false` | Automatically open the chat when initialized |

## API Methods

```javascript
const chat = new AskAiroChat({ baseUrl: '...' });

chat.open();        // Open chat
chat.close();       // Close chat
chat.toggle();      // Toggle chat
chat.updateConfig({ buttonColor: '#10b981' }); // Update config
chat.destroy();     // Remove widget
```

## Building

```bash
# Minify the SDK
npm run minify

# Production build (bumps version and minifies)
npm run production
```

## Scripts

- `npm run minify` - Minifies `sdk.js` to `sdk.min.js` and adds version header
- `npm run production` - Bumps version, removes old minified file, and creates new minified build
- `npm run version:add` - Adds version header to minified file
- `npm run version:bump` - Bumps patch version in package.json
- `npm run version:extract` - Extracts version from package.json

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT

