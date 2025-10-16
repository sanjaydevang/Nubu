// Content script for handling text selection and media interactions
class ContentScript {
  private selectedText = ''
  private isListening = false

  constructor() {
    this.init()
  }

  private init() {
    // Listen for text selection
    document.addEventListener('mouseup', this.handleTextSelection.bind(this))
    
    // Listen for right-click on images and videos
    document.addEventListener('contextmenu', this.handleMediaRightClick.bind(this))
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'getSelectedText') {
        sendResponse({ text: this.selectedText })
      }
    })
  }

  private handleTextSelection(event: MouseEvent) {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      this.selectedText = selection.toString().trim()
      
      // Only show context menu if we have meaningful text
      if (this.selectedText.length > 0) {
        this.isListening = true
        // Small delay to ensure selection is complete
        setTimeout(() => {
          this.isListening = false
        }, 100)
      }
    }
  }

  private handleMediaRightClick(event: MouseEvent) {
    const target = event.target as HTMLElement
    
    // Check if right-clicked element is an image or video
    if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
      event.preventDefault()
      
      const mediaElement = target as HTMLImageElement | HTMLVideoElement
      const mediaData = this.extractMediaData(mediaElement)
      
      if (mediaData) {
        // Send message to context menu handler
        chrome.runtime.sendMessage({
          action: 'showMediaSaveModal',
          data: mediaData
        })
      }
    }
  }

  private extractMediaData(element: HTMLImageElement | HTMLVideoElement) {
    const isImage = element.tagName === 'IMG'
    const imgElement = element as HTMLImageElement
    const videoElement = element as HTMLVideoElement
    
    if (isImage) {
      return {
        src: imgElement.src,
        alt: imgElement.alt || 'Image',
        url: window.location.href,
        type: 'image' as const
      }
    } else {
      return {
        src: videoElement.src || videoElement.currentSrc,
        alt: videoElement.title || 'Video',
        url: window.location.href,
        type: 'video' as const
      }
    }
  }

  // Method to check if text is currently selected
  public hasTextSelected(): boolean {
    const selection = window.getSelection()
    return !!(selection && selection.toString().trim())
  }

  // Method to get currently selected text
  public getSelectedText(): string {
    return this.selectedText
  }
}

// Initialize content script
const contentScript = new ContentScript()

// Expose methods for external access
(window as any).nabuContentScript = contentScript
