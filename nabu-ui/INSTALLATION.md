# 🚀 NabuAI Chrome Extension - Installation Guide

## Quick Start (5 minutes)

### 1. Prerequisites
- ✅ Google Chrome browser (version 88+)
- ✅ Node.js 16+ installed
- ✅ Basic command line knowledge

### 2. Build the Extension
```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Copy manifest and icons
cp manifest.json dist/
cp -r icons dist/
```

### 3. Load in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the `dist/` folder from your project
5. ✅ Extension should now appear in your extensions list!

### 4. Test the Extension
1. Open the `demo.html` file in Chrome
2. Try selecting text and right-clicking
3. Click the NabuAI extension icon in the toolbar
4. Right-click on images and videos

---

## 🔧 Detailed Installation

### Step 1: Environment Setup
```bash
# Clone or download the project
cd nabu-ui

# Install Node.js dependencies
npm install
```

### Step 2: Build Process
```bash
# Build the extension (creates dist/ folder)
npm run build

# Ensure all files are in place
ls -la dist/
```

**Expected output:**
```
dist/
├── background.js
├── content.js
├── contextMenu.js
├── icons/
├── manifest.json
├── popup.css
├── popup.js
└── src/
```

### Step 3: Chrome Extension Loading
1. **Navigate to Extensions Page**
   - Open Chrome
   - Type `chrome://extensions/` in the address bar
   - Press Enter

2. **Enable Developer Mode**
   - Look for the toggle in the top-right corner
   - Click to enable "Developer mode"

3. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to your project folder
   - Select the `dist/` folder
   - Click "Select Folder"

4. **Verify Installation**
   - You should see "NabuAI" in your extensions list
   - The extension icon should appear in your Chrome toolbar

---

## 🧪 Testing Your Installation

### Test 1: Extension Popup
1. Click the NabuAI icon in Chrome toolbar
2. Should see a popup with current page info
3. Try adding notes and tags
4. Click "Save Page"

### Test 2: Text Selection
1. Select any text on a webpage
2. Right-click on the selection
3. Should see "Save to NabuAI" option
4. Click to open save dialog

### Test 3: Media Saving
1. Right-click on any image
2. Should see "Save Image to NabuAI"
3. Right-click on any video
4. Should see "Save Video to NabuAI"

### Test 4: Demo Page
1. Open `demo.html` in Chrome
2. Test all features systematically
3. Check browser console for errors

---

## 🚨 Troubleshooting

### Extension Won't Load
```bash
# Check build output
npm run build

# Verify dist/ folder contents
ls -la dist/

# Check for missing files
cat dist/manifest.json
```

### Context Menu Not Appearing
- ✅ Ensure extension is loaded
- ✅ Check manifest.json permissions
- ✅ Reload the extension
- ✅ Check browser console for errors

### Build Errors
```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

### Permission Issues
- Check `chrome://extensions/` for permission warnings
- Ensure all required permissions are granted
- Try reloading the extension

---

## 📁 Project Structure

```
nabu-ui/
├── src/                    # Source code
│   ├── popup/             # Extension popup UI
│   ├── content/           # Content script
│   ├── background/        # Background service worker
│   └── context-menu/      # Context menu handlers
├── dist/                  # Built extension (load this in Chrome)
├── icons/                 # Extension icons
├── scripts/               # Build and utility scripts
├── manifest.json          # Extension configuration
├── package.json           # Dependencies
└── README.md              # Project documentation
```

---

## 🔄 Development Workflow

### Making Changes
1. Edit files in `src/` directory
2. Run `npm run build`
3. Go to `chrome://extensions/`
4. Click reload button on NabuAI extension
5. Test changes

### Hot Reload (Development)
```bash
# Start development server
npm run dev

# Make changes and see them reflected
# Note: For extension development, you still need to reload in Chrome
```

---

## 🌐 Browser Compatibility

- ✅ **Chrome 88+** (Manifest V3)
- ✅ **Edge 88+** (Chromium-based)
- ✅ **Other Chromium browsers**
- ❌ **Firefox** (different extension system)
- ❌ **Safari** (different extension system)

---

## 📚 Next Steps

### After Installation
1. **Test all features** on the demo page
2. **Try on real websites** to see how it works
3. **Customize the extension** for your needs
4. **Integrate with backend** for persistent storage

### Advanced Features
- [ ] Backend API integration
- [ ] User authentication
- [ ] Content categorization
- [ ] Search functionality
- [ ] Export capabilities

---

## 🆘 Need Help?

### Common Issues
- **Build fails**: Check Node.js version and dependencies
- **Extension not loading**: Verify Developer mode is enabled
- **Features not working**: Check browser console for errors
- **Icons missing**: Ensure icons folder is copied to dist/

### Resources
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Vue 3 Documentation](https://vuejs.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

---

## 🎉 Success!

If you've made it this far, congratulations! You now have a fully functional NabuAI Chrome extension that can:

- ✅ Save selected text from any webpage
- ✅ Save entire pages with notes and tags
- ✅ Save images and videos with context
- ✅ Organize content with a beautiful UI
- ✅ Work seamlessly across the web

**Happy content saving! 🧠✨**
