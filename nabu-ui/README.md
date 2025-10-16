# NabuAI Chrome Extension

A Chrome extension that acts as a user's personal memory and organization layer for all online content. Seamlessly capture and intelligently save information from any webpage, bridging the gap between fragmented content consumption and a unified, actionable knowledge base.

## Features

### 🎯 **Flow 1: Save Selected Text via Context Menu**
- Select any text on a webpage
- Right-click and choose "Save to NabuAI"
- Add custom tags and save with context

### 🚀 **Flow 2: Save Page Content via Pop-up Icon**
- Click the NabuAI extension icon in Chrome toolbar
- View comprehensive page information
- Add notes, tags, and save the entire page

### 🖼️ **Flow 3: Save Image/Video Content**
- Right-click on any image or video
- Choose "Save to NabuAI" from context menu
- Preview media and add tags before saving

## Technical Stack

- **Frontend**: Vue 3 with TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Browser**: Chrome Extension Manifest V3

## Project Structure

```
nabu-ui/
├── src/
│   ├── popup/           # Extension popup (clicking extension icon)
│   ├── content/         # Content script for webpage interactions
│   ├── background/      # Background service worker
│   └── context-menu/    # Context menu functionality
├── icons/               # Extension icons (16x16, 32x32, 48x48, 128x128)
├── manifest.json        # Chrome extension manifest
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Google Chrome browser

### Setup Steps

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd nabu-ui
   npm install
   ```

2. **Build the extension**
   ```bash
   npm run build:extension
   ```

3. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist/` folder from your project

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:extension` - Build Chrome extension
- `npm run preview` - Preview production build

### Development Workflow

1. **Make changes** to source files in `src/`
2. **Build extension** with `npm run build:extension`
3. **Reload extension** in Chrome extensions page
4. **Test functionality** on any webpage

## Usage

### Saving Text
1. Select any text on a webpage
2. Right-click and choose "Save to NabuAI"
3. Add tags and click Save

### Saving Pages
1. Click the NabuAI extension icon in Chrome toolbar
2. Review page information
3. Add notes and tags
4. Click "Save Page"

### Saving Media
1. Right-click on any image or video
2. Choose "Save to NabuAI"
3. Add tags and click Save

## Configuration

### Manifest Settings
The extension uses Manifest V3 with the following permissions:
- `activeTab` - Access to current tab
- `contextMenus` - Create context menu items
- `storage` - Store saved content locally

### Customization
- Modify `tailwind.config.js` for styling changes
- Update `manifest.json` for extension metadata
- Edit component files in `src/` for functionality changes

## Browser Compatibility

- Chrome 88+ (Manifest V3 support)
- Edge 88+ (Chromium-based)
- Other Chromium-based browsers

## Troubleshooting

### Common Issues

1. **Extension not loading**
   - Ensure Developer mode is enabled
   - Check console for build errors
   - Verify all files are in `dist/` folder

2. **Context menu not appearing**
   - Check if content script is injected
   - Verify permissions in manifest
   - Reload extension after changes

3. **Build errors**
   - Clear `node_modules` and reinstall
   - Check TypeScript configuration
   - Verify Vite configuration

### Debug Mode
- Open Chrome DevTools on extension popup
- Check background script console
- Monitor content script execution

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review Chrome extension documentation

## Roadmap

- [ ] Backend integration for persistent storage
- [ ] Advanced tagging and categorization
- [ ] Search and filtering capabilities
- [ ] Export functionality
- [ ] Mobile companion app
- [ ] AI-powered content summarization
