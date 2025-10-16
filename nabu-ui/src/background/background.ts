// Background service worker for NabuAI extension
class BackgroundService {
  private contextMenuIds = {
    text: 'nabu-save-text',
    image: 'nabu-save-image',
    video: 'nabu-save-video',
    screenshot: 'nabu-take-screenshot',
    pdf: 'nabu-save-pdf'
  }

  constructor() {
    this.init()
  }

  private init() {
    console.log('🚀 NabuAI Background Service initializing...')
    
    // Create context menus when extension is installed
    this.createContextMenus()
    
    // Listen for context menu clicks
    chrome.contextMenus.onClicked.addListener(this.handleContextMenuClick.bind(this))
    
    // Listen for messages from content scripts and popup
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this))
    
    // Handle extension installation
    chrome.runtime.onInstalled.addListener(this.handleInstallation.bind(this))
    
    console.log('✅ NabuAI Background Service initialized')
  }

  private createContextMenus() {
    console.log('🔧 Creating context menus...')
    
    try {
      // Create context menu for text selection
      chrome.contextMenus.create({
        id: this.contextMenuIds.text,
        title: 'Save to NabuAI',
        contexts: ['selection'],
        documentUrlPatterns: ['<all_urls>']
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error creating text context menu:', chrome.runtime.lastError)
        } else {
          console.log('✅ Text context menu created')
        }
      })

      // Create context menu for images
      chrome.contextMenus.create({
        id: this.contextMenuIds.image,
        title: 'Save Image to NabuAI',
        contexts: ['image'],
        documentUrlPatterns: ['<all_urls>']
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error creating image context menu:', chrome.runtime.lastError)
        } else {
          console.log('✅ Image context menu created')
        }
      })

      // Create context menu for videos
      chrome.contextMenus.create({
        id: this.contextMenuIds.video,
        title: 'Save Video to NabuAI',
        contexts: ['video'],
        documentUrlPatterns: ['<all_urls>']
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error creating video context menu:', chrome.runtime.lastError)
        } else {
          console.log('✅ Video context menu created')
        }
      })

      // Create context menu for taking full screenshots
      chrome.contextMenus.create({
        id: this.contextMenuIds.screenshot,
        title: 'Take Full Screenshot with NabuAI',
        contexts: ['page'],
        documentUrlPatterns: ['<all_urls>']
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error creating screenshot context menu:', chrome.runtime.lastError)
        } else {
          console.log('✅ Screenshot context menu created')
        }
      })

      // Create context menu for taking partial screenshots
      chrome.contextMenus.create({
        id: 'nabu-take-partial-screenshot',
        title: 'Select Area to Screenshot with NabuAI',
        contexts: ['page'],
        documentUrlPatterns: ['<all_urls>']
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error creating partial screenshot context menu:', chrome.runtime.lastError)
        } else {
          console.log('✅ Partial screenshot context menu created')
        }
      })

      // Create context menu for PDF links
      chrome.contextMenus.create({
        id: this.contextMenuIds.pdf,
        title: 'Open PDF in NabuAI Viewer',
        contexts: ['link'],
        documentUrlPatterns: ['<all_urls>']
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error creating PDF context menu:', chrome.runtime.lastError)
        } else {
          console.log('✅ PDF context menu created')
        }
      })
      
      console.log('🎯 All context menus created successfully')
    } catch (error) {
      console.error('❌ Error creating context menus:', error)
    }
  }

  private async handleContextMenuClick(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) {
    console.log('🖱️ Context menu clicked:', info.menuItemId, info, tab)
    
    if (!tab?.id) {
      console.error('❌ No tab ID available')
      return
    }

    try {
      if (info.menuItemId === this.contextMenuIds.text && info.selectionText) {
        console.log('📝 Text selected, showing save dialog...')
        // Handle text selection - show dialog directly
        await this.showTextSaveDialog(tab.id, info.selectionText, tab.url || '')
      } else if (info.menuItemId === this.contextMenuIds.image && info.srcUrl) {
        console.log('🖼️ Image selected, showing save dialog...')
        // Handle image save
        await this.showMediaSaveDialog(tab.id, {
          src: info.srcUrl,
          alt: 'Image',
          url: tab.url || '',
          type: 'image' as const
        })
      } else if (info.menuItemId === this.contextMenuIds.video && info.srcUrl) {
        console.log('🎥 Video selected, showing save dialog...')
        // Handle video save
        await this.showMediaSaveDialog(tab.id, {
          src: info.srcUrl,
          alt: 'Video',
          url: tab.url || '',
          type: 'video' as const
        })
      } else if (info.menuItemId === this.contextMenuIds.screenshot) {
        console.log('📸 Full screenshot requested, capturing page...')
        // Handle full screenshot capture
        await this.takeScreenshot(tab.id, tab.url || '')
      } else if (info.menuItemId === 'nabu-take-partial-screenshot') {
        console.log('📸 Partial screenshot requested, starting selection mode...')
        // Handle partial screenshot capture
        await this.startPartialScreenshot(tab.id, tab.url || '')
      } else if (info.menuItemId === this.contextMenuIds.pdf && info.linkUrl) {
        // Check if the link is actually a PDF
        if (this.isPDFUrl(info.linkUrl)) {
          console.log('📄 PDF link selected, opening in NabuAI viewer...')
          // Handle PDF opening in viewer
          await this.openPDFInViewer(info.linkUrl, tab.url || '')
        } else {
          console.log('⚠️ Link is not a PDF, ignoring...')
        }
      } else {
        console.log('⚠️ Unknown context menu item:', info.menuItemId)
      }
    } catch (error) {
      console.error('❌ Error handling context menu click:', error)
    }
  }

  private async showTextSaveDialog(tabId: number, text: string, url: string) {
    console.log(`🎬 Injecting text save dialog into tab ${tabId}`)
    console.log(`📝 Text: ${text.substring(0, 100)}...`)
    console.log(`🔗 URL: ${url}`)
    
    try {
      // Inject the dialog script directly into the page
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (text, url) => {
          console.log('🎭 Creating text save dialog in page context...')
          
          // Create and show the text save dialog
          const modal = document.createElement('div')
          modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          `
          
          modal.innerHTML = `
            <div style="
              background: white;
              border-radius: 8px;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              max-width: 448px;
              width: 100%;
              margin: 16px;
              max-height: 80vh;
              overflow-y: auto;
            ">
              <div style="
                padding: 24px;
                border-bottom: 1px solid #e5e7eb;
              ">
                <div style="
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                ">
                  <h3 style="
                    font-size: 18px;
                    font-weight: 600;
                    color: #111827;
                    margin: 0;
                  ">Save Text to NabuAI</h3>
                  <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" style="
                    color: #9ca3af;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                  ">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div style="padding: 24px;">
                <div style="margin-bottom: 16px;">
                  <label style="
                    display: block;
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 8px;
                  ">Selected Text</label>
                  <div style="
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    padding: 12px;
                    font-size: 14px;
                    color: #111827;
                    max-height: 128px;
                    overflow-y: auto;
                    white-space: pre-wrap;
                  ">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                </div>
                
                <div style="margin-bottom: 16px;">
                  <label style="
                    display: block;
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 8px;
                  ">Page URL</label>
                  <div style="
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    padding: 12px;
                    font-size: 14px;
                    color: #6b7280;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                  ">${url}</div>
                </div>
                
                <div style="margin-bottom: 16px;">
                  <label for="tags" style="
                    display: block;
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 8px;
                  ">Tags</label>
                  <input type="text" id="tags" style="
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 14px;
                    outline: none;
                    box-sizing: border-box;
                  " placeholder="Enter tags separated by commas..." onfocus="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 0 0 3px rgba(59, 130, 246, 0.1)'" onblur="this.style.borderColor='#d1d5db'; this.style.boxShadow='none'">
                </div>
                
                <div style="display: flex; gap: 12px;">
                  <button id="saveBtn" style="
                    flex: 1;
                    background: #2563eb;
                    color: white;
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.2s;
                  " onmouseover="this.style.backgroundColor='#1d4ed8'" onmouseout="this.style.backgroundColor='#2563eb'">
                    Save
                  </button>
                  <button onclick="window.open('https://nabu-ai.com/dashboard', '_blank')" style="
                    flex: 1;
                    background: #f3f4f6;
                    color: #374151;
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.2s;
                  " onmouseover="this.style.backgroundColor='#e5e7eb'" onmouseout="this.style.backgroundColor='#f3f4f6'">
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          `
          
          document.body.appendChild(modal)
          console.log('✅ Text save dialog added to page')
          
          // Add save functionality
          const saveBtn = modal.querySelector('#saveBtn')
          if (saveBtn) {
            console.log('🔘 Save button found, adding click handler...')
            saveBtn.addEventListener('click', () => {
              console.log('💾 Save button clicked, processing save...')
              const tagsInput = modal.querySelector('#tags') as HTMLInputElement
              const tags = tagsInput?.value || ''
              
              const saveData = {
                type: 'text',
                title: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
                url: url,
                content: text,
                tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                timestamp: new Date().toISOString()
              }
              
              console.log('📊 Save data prepared:', saveData)
              
              // Send message to background script to save
              chrome.runtime.sendMessage({
                action: 'saveContent',
                data: saveData
              }, (response) => {
                console.log('📨 Save response received:', response)
                if (response && response.success) {
                  // Show success message
                  modal.innerHTML = `
                    <div style="
                      background: white;
                      border-radius: 8px;
                      padding: 24px;
                      max-width: 384px;
                      margin: 16px;
                      text-align: center;
                    ">
                      <div style="
                        width: 48px;
                        height: 48px;
                        background: #dcfce7;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 16px;
                      ">
                        <svg width="24" height="24" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                      <h3 style="
                        font-size: 18px;
                        font-weight: 500;
                        color: #111827;
                        margin: 0 0 8px;
                      ">Saved to NabuAI!</h3>
                      <p style="
                        font-size: 14px;
                        color: #6b7280;
                        margin: 0 0 16px;
                      ">Your text has been successfully saved.</p>
                      <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" style="
                        width: 100%;
                        background: #2563eb;
                        color: white;
                        padding: 8px 16px;
                        border: none;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                      ">
                        Continue
                      </button>
                    </div>
                  `
                  console.log('✅ Success message displayed')
                } else {
                  // Show error message
                  modal.innerHTML = `
                    <div style="
                      background: white;
                      border-radius: 8px;
                      padding: 24px;
                      max-width: 384px;
                      margin: 16px;
                      text-align: center;
                    ">
                      <div style="
                        width: 48px;
                        height: 48px;
                        background: #fef2f2;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 16px;
                      ">
                        <svg width="24" height="24" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </div>
                      <h3 style="
                        font-size: 18px;
                        font-weight: 500;
                        color: #111827;
                        margin: 0 0 8px;
                      ">Save Failed</h3>
                      <p style="
                        font-size: 14px;
                        color: #6b7280;
                        margin: 0 0 16px;
                      ">There was an error saving your content.</p>
                      <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" style="
                        width: 100%;
                        background: #dc2626;
                        color: white;
                        padding: 8px 16px;
                        border: none;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                      ">
                        Try Again
                      </button>
                    </div>
                  `
                  console.log('❌ Error message displayed')
                }
              })
            })
            console.log('✅ Save button click handler added')
          } else {
            console.error('❌ Save button not found')
          }
          
          // Close modal when clicking outside
          modal.addEventListener('click', (e) => {
            if (e.target === modal) {
              modal.remove()
              console.log('🔒 Modal closed by outside click')
            }
          })
          
        },
        args: [text, url]
      })
      
      console.log('✅ Text save dialog script injected successfully')
    } catch (error) {
      console.error('❌ Error showing text save dialog:', error)
    }
  }

  private async showMediaSaveDialog(tabId: number, mediaData: {
    src: string
    alt: string
    url: string
    type: 'image' | 'video'
  }) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (data) => {
          const modal = document.createElement('div')
          modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          `
          
          const mediaPreview = data.type === 'image' 
            ? `<img src="${data.src}" alt="${data.alt}" style="width: 100%; height: 128px; object-fit: cover; border-radius: 6px;">`
            : `<video src="${data.src}" style="width: 100%; height: 128px; object-fit: cover; border-radius: 6px;" controls></video>`

          modal.innerHTML = `
            <div style="
              background: white;
              border-radius: 8px;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              max-width: 448px;
              width: 100%;
              margin: 16px;
              max-height: 80vh;
              overflow-y: auto;
            ">
              <div style="
                padding: 24px;
                border-bottom: 1px solid #e5e7eb;
              ">
                <div style="
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                ">
                  <h3 style="
                    font-size: 18px;
                    font-weight: 600;
                    color: #111827;
                    margin: 0;
                  ">Save ${data.type === 'image' ? 'Image' : 'Video'} to NabuAI</h3>
                  <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" style="
                    color: #9ca3af;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                  ">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div style="padding: 24px;">
                <div style="margin-bottom: 16px;">
                  <label style="
                    display: block;
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 8px;
                  ">Preview</label>
                  ${mediaPreview}
                </div>
                
                <div style="margin-bottom: 16px;">
                  <label style="
                    display: block;
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 8px;
                  ">Media URL</label>
                  <div style="
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    padding: 12px;
                    font-size: 14px;
                    color: #6b7280;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                  ">${data.src}</div>
                </div>
                
                <div style="margin-bottom: 16px;">
                  <label for="tags" style="
                    display: block;
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 8px;
                  ">Tags</label>
                  <input type="text" id="tags" style="
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 14px;
                    outline: none;
                    box-sizing: border-box;
                  " placeholder="Enter tags separated by commas..." onfocus="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 0 0 3px rgba(59, 130, 246, 0.1)'" onblur="this.style.borderColor='#d1d5db'; this.style.boxShadow='none'">
                </div>
                
                <div style="display: flex; gap: 12px;">
                  <button id="saveBtn" style="
                    flex: 1;
                    background: #2563eb;
                    color: white;
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.2s;
                  " onmouseover="this.style.backgroundColor='#1d4ed8'" onmouseout="this.style.backgroundColor='#2563eb'">
                    Save
                  </button>
                  <button onclick="window.open('https://nabu-ai.com/dashboard', '_blank')" style="
                    flex: 1;
                    background: #f3f4f6;
                    color: #374151;
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.2s;
                  " onmouseover="this.style.backgroundColor='#e5e7eb'" onmouseout="this.style.backgroundColor='#f3f4f6'">
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          `
          
          document.body.appendChild(modal)
          
          // Add save functionality
          const saveBtn = modal.querySelector('#saveBtn')
          if (saveBtn) {
            saveBtn.addEventListener('click', () => {
              const tagsInput = modal.querySelector('#tags') as HTMLInputElement
              const tags = tagsInput?.value || ''
              
              const saveData = {
                type: data.type,
                title: data.alt,
                url: data.url,
                content: data.src,
                tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                timestamp: new Date().toISOString()
              }
              
              console.log('Saving media to NabuAI:', saveData)
              
              // Send message to background script to save
              chrome.runtime.sendMessage({
                action: 'saveContent',
                data: saveData
              }, (response) => {
                if (response && response.success) {
                  // Show success message
                  modal.innerHTML = `
                    <div style="
                      background: white;
                      border-radius: 8px;
                      padding: 24px;
                      max-width: 384px;
                      margin: 16px;
                      text-align: center;
                    ">
                      <div style="
                        width: 48px;
                        height: 48px;
                        background: #dcfce7;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 16px;
                      ">
                        <svg width="24" height="24" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                      <h3 style="
                        font-size: 18px;
                        font-weight: 500;
                        color: #111827;
                        margin: 0 0 8px;
                      ">Saved to NabuAI!</h3>
                      <p style="
                        font-size: 14px;
                        color: #6b7280;
                        margin: 0 0 16px;
                      ">Your ${data.type} has been successfully saved.</p>
                      <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" style="
                        width: 100%;
                        background: #2563eb;
                        color: white;
                        padding: 8px 16px;
                        border: none;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                      ">
                        Continue
                      </button>
                    </div>
                  `
                } else {
                  // Show error message
                  modal.innerHTML = `
                    <div style="
                      background: white;
                      border-radius: 8px;
                      padding: 24px;
                      max-width: 384px;
                      margin: 16px;
                      text-align: center;
                    ">
                      <div style="
                        width: 48px;
                        height: 48px;
                        background: #fef2f2;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 16px;
                      ">
                        <svg width="24" height="24" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </div>
                      <h3 style="
                        font-size: 18px;
                        font-weight: 500;
                        color: #111827;
                        margin: 0 0 8px;
                      ">Save Failed</h3>
                      <p style="
                        font-size: 14px;
                        color: #6b7280;
                        margin: 0 0 16px;
                      ">There was an error saving your content.</p>
                      <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" style="
                        width: 100%;
                        background: #dc2626;
                        color: white;
                        padding: 8px 16px;
                        border: none;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                      ">
                        Try Again
                      </button>
                    </div>
                  `
                }
              })
            })
          }
          
          // Close modal when clicking outside
          modal.addEventListener('click', (e) => {
            if (e.target === modal) {
              modal.remove()
            }
          })
        },
        args: [mediaData]
      })
    } catch (error) {
      console.error('Error showing media save dialog:', error)
    }
  }

  private isPDFUrl(url: string): boolean {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname.toLowerCase()
      const searchParams = urlObj.searchParams
      
      // Check if URL ends with .pdf
      if (pathname.endsWith('.pdf')) {
        return true
      }
      
      // Check if URL has PDF in query parameters
      if (searchParams.has('format') && searchParams.get('format')?.toLowerCase() === 'pdf') {
        return true
      }
      
      // Check if URL has PDF in the path
      if (pathname.includes('.pdf')) {
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error parsing URL:', error)
      return false
    }
  }

  private async takeScreenshot(tabId: number, url: string) {
    console.log(`📸 Taking screenshot of tab ${tabId}`)
    console.log(`🔗 URL: ${url}`)
    
    try {
      // Capture the visible tab
      const dataUrl = await chrome.tabs.captureVisibleTab(null, {
        format: 'png',
        quality: 90
      })
      
      console.log('✅ Screenshot captured successfully')
      
      // Upload directly to backend
      await this.uploadScreenshotToBackend(dataUrl, url, tabId)
      
    } catch (error) {
      console.error('❌ Error taking screenshot:', error)
      
      // Show error dialog
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const modal = document.createElement('div')
          modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          `
          
          modal.innerHTML = `
            <div style="
              background: white;
              border-radius: 8px;
              padding: 24px;
              max-width: 384px;
              margin: 16px;
              text-align: center;
            ">
              <div style="
                width: 48px;
                height: 48px;
                background: #fef2f2;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 16px;
              ">
                <svg width="24" height="24" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h3 style="
                font-size: 18px;
                font-weight: 500;
                color: #111827;
                margin: 0 0 8px;
              ">Screenshot Failed</h3>
              <p style="
                font-size: 14px;
                color: #6b7280;
                margin: 0 0 16px;
              ">Unable to capture screenshot. Please try again.</p>
              <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" style="
                width: 100%;
                background: #dc2626;
                color: white;
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
              ">
                Close
              </button>
            </div>
          `
          
          document.body.appendChild(modal)
          
          // Close modal when clicking outside
          modal.addEventListener('click', (e) => {
            if (e.target === modal) {
              modal.remove()
            }
          })
        }
      })
    }
  }

  private async uploadScreenshotToBackend(dataUrl: string, url: string, tabId: number) {
    const BACKEND_URL = 'http://127.0.0.1:8010'
    const SCRIBE_ID = 'scribe-123'
    
    try {
      // Convert dataURL to Blob
      const blob = this.dataURLtoBlob(dataUrl)
      
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('scribe_id', SCRIBE_ID)
      formData.append('file', new File([blob], `screenshot_${Date.now()}.png`, { type: 'image/png' }))
      
      // Upload to backend
      const response = await fetch(`${BACKEND_URL}/upload/file`, {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Upload failed ${response.status}: ${text}`)
      }
      
      const data = await response.json() // { key, uri }
      console.log('✅ Screenshot saved to S3:', data)
      
      // Show success notification
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (url) => {
          const notification = document.createElement('div')
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 500;
          `
          notification.textContent = '✅ Screenshot saved to NabuAI!'
          document.body.appendChild(notification)
          
          // Auto-remove after 3 seconds
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification)
            }
          }, 3000)
        },
        args: [url]
      })
      
    } catch (error) {
      console.error('❌ Error uploading screenshot to backend:', error)
      
      // Show error notification
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (url, errorMsg) => {
          const notification = document.createElement('div')
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 500;
          `
          notification.textContent = `❌ Screenshot save failed: ${errorMsg}`
          document.body.appendChild(notification)
          
          // Auto-remove after 5 seconds
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification)
            }
          }, 5000)
        },
        args: [url, error instanceof Error ? error.message : 'Unknown error']
      })
    }
  }

  private dataURLtoBlob(dataUrl: string): Blob {
    const [head, data] = dataUrl.split(',')
    const mime = head.match(/:(.*?);/)?.[1] || 'image/png'
    const binStr = atob(data)
    const len = binStr.length
    const u8 = new Uint8Array(len)
    for (let i = 0; i < len; i++) u8[i] = binStr.charCodeAt(i)
    return new Blob([u8], { type: mime })
  }

  private async startPartialScreenshot(tabId: number, url: string) {
    console.log(`📸 Starting partial screenshot selection for tab ${tabId}`)
    console.log(`🔗 URL: ${url}`)
    
    try {
      // First capture the full screenshot
      const fullScreenshot = await chrome.tabs.captureVisibleTab(null, {
        format: 'png',
        quality: 90
      })
      
      console.log('✅ Full screenshot captured for selection')
      
      // Inject the selection overlay
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (fullScreenshot, url) => {
          console.log('🎭 Creating partial screenshot selection overlay...')
          
          // Create overlay for selection
          const overlay = document.createElement('div')
          overlay.id = 'nabu-screenshot-overlay'
          overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.3);
            z-index: 999999;
            cursor: crosshair;
            user-select: none;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          `
          
          // Create selection rectangle
          const selectionRect = document.createElement('div')
          selectionRect.id = 'nabu-selection-rect'
          selectionRect.style.cssText = `
            position: absolute;
            border: 2px solid #3b82f6;
            background: rgba(59, 130, 246, 0.1);
            display: none;
            pointer-events: none;
          `
          
          // Create instructions
          const instructions = document.createElement('div')
          instructions.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            font-size: 14px;
            z-index: 1000000;
            pointer-events: none;
          `
          instructions.textContent = 'Click and drag to select area, then press Enter to capture or Escape to cancel'
          
          overlay.appendChild(selectionRect)
          overlay.appendChild(instructions)
          document.body.appendChild(overlay)
          
          let isSelecting = false
          let startX = 0
          let startY = 0
          let currentX = 0
          let currentY = 0
          
          // Mouse down - start selection
          overlay.addEventListener('mousedown', (e) => {
            isSelecting = true
            startX = e.clientX
            startY = e.clientY
            currentX = e.clientX
            currentY = e.clientY
            
            selectionRect.style.display = 'block'
            selectionRect.style.left = startX + 'px'
            selectionRect.style.top = startY + 'px'
            selectionRect.style.width = '0px'
            selectionRect.style.height = '0px'
            
            e.preventDefault()
          })
          
          // Mouse move - update selection
          overlay.addEventListener('mousemove', (e) => {
            if (!isSelecting) return
            
            currentX = e.clientX
            currentY = e.clientY
            
            const left = Math.min(startX, currentX)
            const top = Math.min(startY, currentY)
            const width = Math.abs(currentX - startX)
            const height = Math.abs(currentY - startY)
            
            selectionRect.style.left = left + 'px'
            selectionRect.style.top = top + 'px'
            selectionRect.style.width = width + 'px'
            selectionRect.style.height = height + 'px'
            
            e.preventDefault()
          })
          
          // Mouse up - end selection
          overlay.addEventListener('mouseup', (e) => {
            if (!isSelecting) return
            
            isSelecting = false
            e.preventDefault()
          })
          
          // Keyboard events
          overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              // Capture the selected area
              const rect = selectionRect.getBoundingClientRect()
              if (rect.width > 10 && rect.height > 10) {
                captureSelectedArea(fullScreenshot, rect, url)
              } else {
                showError('Please select a larger area')
              }
            } else if (e.key === 'Escape') {
              // Cancel selection
              overlay.remove()
            }
          })
          
          // Make overlay focusable for keyboard events
          overlay.tabIndex = 0
          overlay.focus()
          
          function captureSelectedArea(fullScreenshotDataUrl: string, selectionRect: DOMRect, pageUrl: string) {
            console.log('📸 Capturing selected area:', selectionRect)
            
            // Create canvas to crop the image
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            
            if (!ctx) {
              showError('Failed to create canvas context')
              return
            }
            
            // Set canvas size to selection size
            canvas.width = selectionRect.width
            canvas.height = selectionRect.height
            
            // Create image from full screenshot
            const img = new Image()
            img.onload = () => {
              // Draw the cropped portion
              ctx.drawImage(
                img,
                selectionRect.left,
                selectionRect.top,
                selectionRect.width,
                selectionRect.height,
                0,
                0,
                selectionRect.width,
                selectionRect.height
              )
              
              // Convert to data URL
              const croppedDataUrl = canvas.toDataURL('image/png', 0.9)
              
              // Remove overlay
              overlay.remove()
              
              // Show save dialog with cropped image
              showScreenshotSaveDialog(croppedDataUrl, pageUrl, true)
            }
            
            img.onerror = () => {
              showError('Failed to load screenshot image')
            }
            
            img.src = fullScreenshotDataUrl
          }
          
          function showScreenshotSaveDialog(dataUrl: string, url: string, isPartial: boolean) {
            console.log('🎭 Creating screenshot save dialog...')
            
            const modal = document.createElement('div')
            modal.style.cssText = `
              position: fixed;
              top: 0;
              left: 0;
              width: 100vw;
              height: 100vh;
              background: rgba(0, 0, 0, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 999999;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `
            
            modal.innerHTML = `
              <div style="
                background: white;
                border-radius: 8px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                max-width: 500px;
                width: 100%;
                margin: 16px;
                max-height: 90vh;
                overflow-y: auto;
              ">
                <div style="
                  padding: 24px;
                  border-bottom: 1px solid #e5e7eb;
                ">
                  <div style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                  ">
                    <h3 style="
                      font-size: 18px;
                      font-weight: 600;
                      color: #111827;
                      margin: 0;
                    ">Save ${isPartial ? 'Partial ' : ''}Screenshot to NabuAI</h3>
                    <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" style="
                      color: #9ca3af;
                      background: none;
                      border: none;
                      cursor: pointer;
                      padding: 4px;
                    ">
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div style="padding: 24px;">
                  <div style="margin-bottom: 16px;">
                    <label style="
                      display: block;
                      font-size: 14px;
                      font-weight: 500;
                      color: #374151;
                      margin-bottom: 8px;
                    ">Screenshot Preview</label>
                    <div style="
                      border: 1px solid #e5e7eb;
                      border-radius: 6px;
                      overflow: hidden;
                      max-height: 300px;
                      text-align: center;
                      background: #f9fafb;
                    ">
                      <img src="${dataUrl}" alt="Screenshot" style="
                        max-width: 100%;
                        max-height: 300px;
                        object-fit: contain;
                      ">
                    </div>
                  </div>
                  
                  <div style="margin-bottom: 16px;">
                    <label style="
                      display: block;
                      font-size: 14px;
                      font-weight: 500;
                      color: #374151;
                      margin-bottom: 8px;
                    ">Page URL</label>
                    <div style="
                      background: #f9fafb;
                      border: 1px solid #e5e7eb;
                      border-radius: 6px;
                      padding: 12px;
                      font-size: 14px;
                      color: #6b7280;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                    ">${url}</div>
                  </div>
                  
                  <div style="margin-bottom: 16px;">
                    <label for="screenshot-title" style="
                      display: block;
                      font-size: 14px;
                      font-weight: 500;
                      color: #374151;
                      margin-bottom: 8px;
                    ">Title</label>
                    <input type="text" id="screenshot-title" style="
                      width: 100%;
                      padding: 8px 12px;
                      border: 1px solid #d1d5db;
                      border-radius: 6px;
                      font-size: 14px;
                      outline: none;
                      box-sizing: border-box;
                    " placeholder="Enter a title for this screenshot..." onfocus="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 0 0 3px rgba(59, 130, 246, 0.1)'" onblur="this.style.borderColor='#d1d5db'; this.style.boxShadow='none'">
                  </div>
                  
                  <div style="margin-bottom: 16px;">
                    <label for="screenshot-tags" style="
                      display: block;
                      font-size: 14px;
                      font-weight: 500;
                      color: #374151;
                      margin-bottom: 8px;
                    ">Tags</label>
                    <input type="text" id="screenshot-tags" style="
                      width: 100%;
                      padding: 8px 12px;
                      border: 1px solid #d1d5db;
                      border-radius: 6px;
                      font-size: 14px;
                      outline: none;
                      box-sizing: border-box;
                    " placeholder="Enter tags separated by commas..." onfocus="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 0 0 3px rgba(59, 130, 246, 0.1)'" onblur="this.style.borderColor='#d1d5db'; this.style.boxShadow='none'">
                  </div>
                  
                  <div style="display: flex; gap: 12px;">
                    <button id="saveScreenshotBtn" style="
                      flex: 1;
                      background: #2563eb;
                      color: white;
                      padding: 8px 16px;
                      border: none;
                      border-radius: 6px;
                      font-size: 14px;
                      font-weight: 500;
                      cursor: pointer;
                      transition: background-color 0.2s;
                    " onmouseover="this.style.backgroundColor='#1d4ed8'" onmouseout="this.style.backgroundColor='#2563eb'">
                      Save Screenshot
                    </button>
                    <button onclick="window.open('https://nabu-ai.com/dashboard', '_blank')" style="
                      flex: 1;
                      background: #f3f4f6;
                      color: #374151;
                      padding: 8px 16px;
                      border: none;
                      border-radius: 6px;
                      font-size: 14px;
                      font-weight: 500;
                      cursor: pointer;
                      transition: background-color 0.2s;
                    " onmouseover="this.style.backgroundColor='#e5e7eb'" onmouseout="this.style.backgroundColor='#f3f4f6'">
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            `
            
            document.body.appendChild(modal)
            console.log('✅ Screenshot save dialog added to page')
            
            // Add save functionality
            const saveBtn = modal.querySelector('#saveScreenshotBtn')
            if (saveBtn) {
              console.log('🔘 Save screenshot button found, adding click handler...')
              saveBtn.addEventListener('click', () => {
                console.log('💾 Save screenshot button clicked, processing save...')
                const titleInput = modal.querySelector('#screenshot-title') as HTMLInputElement
                const tagsInput = modal.querySelector('#screenshot-tags') as HTMLInputElement
                const title = titleInput?.value || (isPartial ? 'Partial Screenshot' : 'Screenshot')
                const tags = tagsInput?.value || ''
                
                const saveData = {
                  type: 'screenshot',
                  title: title,
                  url: url,
                  content: dataUrl,
                  tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                  timestamp: new Date().toISOString()
                }
                
                console.log('📊 Screenshot save data prepared:', saveData)
                
                // Send message to background script to save
                chrome.runtime.sendMessage({
                  action: 'saveContent',
                  data: saveData
                }, (response) => {
                  console.log('📨 Screenshot save response received:', response)
                  if (response && response.success) {
                    // Show success message
                    modal.innerHTML = `
                      <div style="
                        background: white;
                        border-radius: 8px;
                        padding: 24px;
                        max-width: 384px;
                        margin: 16px;
                        text-align: center;
                      ">
                        <div style="
                          width: 48px;
                          height: 48px;
                          background: #dcfce7;
                          border-radius: 50%;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          margin: 0 auto 16px;
                        ">
                          <svg width="24" height="24" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                        <h3 style="
                          font-size: 18px;
                          font-weight: 500;
                          color: #111827;
                          margin: 0 0 8px;
                        ">Screenshot Saved!</h3>
                        <p style="
                          font-size: 14px;
                          color: #6b7280;
                          margin: 0 0 16px;
                        ">Your ${isPartial ? 'partial ' : ''}screenshot has been successfully saved to NabuAI.</p>
                        <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" style="
                          width: 100%;
                          background: #2563eb;
                          color: white;
                          padding: 8px 16px;
                          border: none;
                          border-radius: 6px;
                          font-size: 14px;
                          font-weight: 500;
                          cursor: pointer;
                        ">
                          Continue
                        </button>
                      </div>
                    `
                    console.log('✅ Screenshot success message displayed')
                  } else {
                    // Show error message
                    modal.innerHTML = `
                      <div style="
                        background: white;
                        border-radius: 8px;
                        padding: 24px;
                        max-width: 384px;
                        margin: 16px;
                        text-align: center;
                      ">
                        <div style="
                          width: 48px;
                          height: 48px;
                          background: #fef2f2;
                          border-radius: 50%;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          margin: 0 auto 16px;
                        ">
                          <svg width="24" height="24" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </div>
                        <h3 style="
                          font-size: 18px;
                          font-weight: 500;
                          color: #111827;
                          margin: 0 0 8px;
                        ">Save Failed</h3>
                        <p style="
                          font-size: 14px;
                          color: #6b7280;
                          margin: 0 0 16px;
                        ">There was an error saving your screenshot.</p>
                        <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" style="
                          width: 100%;
                          background: #dc2626;
                          color: white;
                          padding: 8px 16px;
                          border: none;
                          border-radius: 6px;
                          font-size: 14px;
                          font-weight: 500;
                          cursor: pointer;
                        ">
                          Try Again
                        </button>
                      </div>
                    `
                    console.log('❌ Screenshot error message displayed')
                  }
                })
              })
              console.log('✅ Screenshot save button click handler added')
            } else {
              console.error('❌ Screenshot save button not found')
            }
            
            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
              if (e.target === modal) {
                modal.remove()
                console.log('🔒 Screenshot modal closed by outside click')
              }
            })
          }
          
          function showError(message: string) {
            const errorDiv = document.createElement('div')
            errorDiv.style.cssText = `
              position: fixed;
              top: 20px;
              left: 50%;
              transform: translateX(-50%);
              background: #dc2626;
              color: white;
              padding: 12px 20px;
              border-radius: 6px;
              font-size: 14px;
              z-index: 1000001;
              pointer-events: none;
            `
            errorDiv.textContent = message
            document.body.appendChild(errorDiv)
            
            setTimeout(() => {
              errorDiv.remove()
            }, 3000)
          }
          
        },
        args: [fullScreenshot, url]
      })
      
      console.log('✅ Partial screenshot selection overlay injected successfully')
    } catch (error) {
      console.error('❌ Error starting partial screenshot:', error)
    }
  }

  private async openPDFInViewer(pdfUrl: string, sourceUrl: string) {
    console.log(`📄 Opening PDF in NabuAI viewer: ${pdfUrl}`)
    console.log(`🔗 Source URL: ${sourceUrl}`)
    
    try {
      // Create PDF viewer URL with parameters (using Vue version)
      const viewerUrl = chrome.runtime.getURL('pdf-viewer-vue.js')
      const params = new URLSearchParams({
        url: pdfUrl,
        source: sourceUrl
      })
      
      const fullViewerUrl = `${viewerUrl}?${params.toString()}`
      
      // Open PDF viewer in new tab
      await chrome.tabs.create({
        url: fullViewerUrl,
        active: true
      })
      
      console.log('✅ PDF viewer opened successfully')
    } catch (error) {
      console.error('❌ Error opening PDF viewer:', error)
    }
  }

  private async showScreenshotSaveDialog(tabId: number, dataUrl: string, url: string) {
    console.log(`🎬 Showing screenshot save dialog for tab ${tabId}`)
    
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (dataUrl, url) => {
          console.log('🎭 Creating screenshot save dialog in page context...')
          
          const modal = document.createElement('div')
          modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          `
          
          modal.innerHTML = `
            <div style="
              background: white;
              border-radius: 8px;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              max-width: 500px;
              width: 100%;
              margin: 16px;
              max-height: 90vh;
              overflow-y: auto;
            ">
              <div style="
                padding: 24px;
                border-bottom: 1px solid #e5e7eb;
              ">
                <div style="
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                ">
                  <h3 style="
                    font-size: 18px;
                    font-weight: 600;
                    color: #111827;
                    margin: 0;
                  ">Save Screenshot to NabuAI</h3>
                  <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" style="
                    color: #9ca3af;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                  ">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div style="padding: 24px;">
                <div style="margin-bottom: 16px;">
                  <label style="
                    display: block;
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 8px;
                  ">Screenshot Preview</label>
                  <div style="
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    overflow: hidden;
                    max-height: 300px;
                    text-align: center;
                    background: #f9fafb;
                  ">
                    <img src="${dataUrl}" alt="Screenshot" style="
                      max-width: 100%;
                      max-height: 300px;
                      object-fit: contain;
                    ">
                  </div>
                </div>
                
                <div style="margin-bottom: 16px;">
                  <label style="
                    display: block;
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 8px;
                  ">Page URL</label>
                  <div style="
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    padding: 12px;
                    font-size: 14px;
                    color: #6b7280;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                  ">${url}</div>
                </div>
                
                <div style="margin-bottom: 16px;">
                  <label for="screenshot-title" style="
                    display: block;
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 8px;
                  ">Title</label>
                  <input type="text" id="screenshot-title" style="
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 14px;
                    outline: none;
                    box-sizing: border-box;
                  " placeholder="Enter a title for this screenshot..." onfocus="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 0 0 3px rgba(59, 130, 246, 0.1)'" onblur="this.style.borderColor='#d1d5db'; this.style.boxShadow='none'">
                </div>
                
                <div style="margin-bottom: 16px;">
                  <label for="screenshot-tags" style="
                    display: block;
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 8px;
                  ">Tags</label>
                  <input type="text" id="screenshot-tags" style="
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 14px;
                    outline: none;
                    box-sizing: border-box;
                  " placeholder="Enter tags separated by commas..." onfocus="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 0 0 3px rgba(59, 130, 246, 0.1)'" onblur="this.style.borderColor='#d1d5db'; this.style.boxShadow='none'">
                </div>
                
                <div style="display: flex; gap: 12px;">
                  <button id="saveScreenshotBtn" style="
                    flex: 1;
                    background: #2563eb;
                    color: white;
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.2s;
                  " onmouseover="this.style.backgroundColor='#1d4ed8'" onmouseout="this.style.backgroundColor='#2563eb'">
                    Save Screenshot
                  </button>
                  <button onclick="window.open('https://nabu-ai.com/dashboard', '_blank')" style="
                    flex: 1;
                    background: #f3f4f6;
                    color: #374151;
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.2s;
                  " onmouseover="this.style.backgroundColor='#e5e7eb'" onmouseout="this.style.backgroundColor='#f3f4f6'">
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          `
          
          document.body.appendChild(modal)
          console.log('✅ Screenshot save dialog added to page')
          
          // Add save functionality
          const saveBtn = modal.querySelector('#saveScreenshotBtn')
          if (saveBtn) {
            console.log('🔘 Save screenshot button found, adding click handler...')
            saveBtn.addEventListener('click', () => {
              console.log('💾 Save screenshot button clicked, processing save...')
              const titleInput = modal.querySelector('#screenshot-title') as HTMLInputElement
              const tagsInput = modal.querySelector('#screenshot-tags') as HTMLInputElement
              const title = titleInput?.value || 'Screenshot'
              const tags = tagsInput?.value || ''
              
              const saveData = {
                type: 'screenshot',
                title: title,
                url: url,
                content: dataUrl,
                tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                timestamp: new Date().toISOString()
              }
              
              console.log('📊 Screenshot save data prepared:', saveData)
              
              // Send message to background script to save
              chrome.runtime.sendMessage({
                action: 'saveContent',
                data: saveData
              }, (response) => {
                console.log('📨 Screenshot save response received:', response)
                if (response && response.success) {
                  // Show success message
                  modal.innerHTML = `
                    <div style="
                      background: white;
                      border-radius: 8px;
                      padding: 24px;
                      max-width: 384px;
                      margin: 16px;
                      text-align: center;
                    ">
                      <div style="
                        width: 48px;
                        height: 48px;
                        background: #dcfce7;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 16px;
                      ">
                        <svg width="24" height="24" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                      <h3 style="
                        font-size: 18px;
                        font-weight: 500;
                        color: #111827;
                        margin: 0 0 8px;
                      ">Screenshot Saved!</h3>
                      <p style="
                        font-size: 14px;
                        color: #6b7280;
                        margin: 0 0 16px;
                      ">Your screenshot has been successfully saved to NabuAI.</p>
                      <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" style="
                        width: 100%;
                        background: #2563eb;
                        color: white;
                        padding: 8px 16px;
                        border: none;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                      ">
                        Continue
                      </button>
                    </div>
                  `
                  console.log('✅ Screenshot success message displayed')
                } else {
                  // Show error message
                  modal.innerHTML = `
                    <div style="
                      background: white;
                      border-radius: 8px;
                      padding: 24px;
                      max-width: 384px;
                      margin: 16px;
                      text-align: center;
                    ">
                      <div style="
                        width: 48px;
                        height: 48px;
                        background: #fef2f2;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 16px;
                      ">
                        <svg width="24" height="24" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </div>
                      <h3 style="
                        font-size: 18px;
                        font-weight: 500;
                        color: #111827;
                        margin: 0 0 8px;
                      ">Save Failed</h3>
                      <p style="
                        font-size: 14px;
                        color: #6b7280;
                        margin: 0 0 16px;
                      ">There was an error saving your screenshot.</p>
                      <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" style="
                        width: 100%;
                        background: #dc2626;
                        color: white;
                        padding: 8px 16px;
                        border: none;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                      ">
                        Try Again
                      </button>
                    </div>
                  `
                  console.log('❌ Screenshot error message displayed')
                }
              })
            })
            console.log('✅ Screenshot save button click handler added')
          } else {
            console.error('❌ Screenshot save button not found')
          }
          
          // Close modal when clicking outside
          modal.addEventListener('click', (e) => {
            if (e.target === modal) {
              modal.remove()
              console.log('🔒 Screenshot modal closed by outside click')
            }
          })
          
        },
        args: [dataUrl, url]
      })
      
      console.log('✅ Screenshot save dialog script injected successfully')
    } catch (error) {
      console.error('❌ Error showing screenshot save dialog:', error)
    }
  }

  private handleMessage(request: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) {
    if (request.action === 'showTextSaveModal') {
      // Handle text save modal request
      this.showTextSaveDialog(sender.tab?.id || 0, request.data.text, request.data.url)
      sendResponse({ success: true })
    } else if (request.action === 'showMediaSaveModal') {
      // Handle media save modal request
      this.showMediaSaveDialog(sender.tab?.id || 0, request.data)
      sendResponse({ success: true })
    } else if (request.action === 'saveContent') {
      // Handle save content request
      this.saveContent(request.data, sendResponse)
      return true // Keep message channel open for async response
    }
  }

  private async saveContent(data: any, sendResponse: (response: any) => void) {
    try {
      const BACKEND_URL = 'http://127.0.0.1:8010'
      const SCRIBE_ID = 'scribe-123'

      const id = `saved_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const savedData = { ...data, id }

      const payload = {
        type: savedData.type,
        title: savedData.title,
        url: savedData.url,
        notes: savedData.notes || '',
        tags: savedData.tags || [],
        timestamp: new Date().toISOString(),
        content: savedData.content // for text/image/screenshot where applicable
      }

      const response = await fetch(`${BACKEND_URL}/scribes/${encodeURIComponent(SCRIBE_ID)}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: JSON.stringify(payload),
          metadata: { type: payload.type, title: payload.title, url: payload.url, tags: payload.tags }
        })
      })

      if (!response.ok) {
        const text = await response.text()
        console.error('Backend save failed:', response.status, text)
        // Fallback to local storage to avoid data loss
        await chrome.storage.local.set({ [id]: savedData })
        sendResponse({ success: false, id, fallback: true, error: text })
        return
      }

      const dataJson = await response.json() // { key, uri }
      console.log('✅ Saved to S3 via backend:', dataJson)
      sendResponse({ success: true, id, backend: true, data: dataJson })
    } catch (error) {
      console.error('Error saving content:', error)
      try {
        // Last-resort fallback: local save
        const id = `saved_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const savedData = { ...data, id }
        await chrome.storage.local.set({ [id]: savedData })
        sendResponse({ success: false, id, fallback: true, error: error instanceof Error ? error.message : 'Unknown error' })
      } catch (fallbackError) {
        sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }
  }

  private handleInstallation(details: chrome.runtime.InstalledDetails) {
    if (details.reason === 'install') {
      console.log('NabuAI extension installed successfully!')
      
      // Open welcome page
      chrome.tabs.create({
        url: 'https://nabu-ai.com/welcome'
      })
    } else if (details.reason === 'update') {
      console.log('NabuAI extension updated!')
    }
  }
}

// Initialize background service
new BackgroundService()
