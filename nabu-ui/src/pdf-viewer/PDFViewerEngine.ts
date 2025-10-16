import type { PDFViewerConfig, Annotation, Tool, Color, TextItem } from './types'

export class PDFViewerEngine {
  private config: PDFViewerConfig
  private pdfDocument: any = null
  private currentPage = 1
  private totalPages = 0
  private scale = 1.0
  private renderedPages = new Map()
  private annotations = new Map<number, Annotation[]>()
  private textContent = new Map<number, TextItem[]>()
  private currentTool: Tool = 'select'
  private currentColor: Color = 'yellow'
  private isDrawing = false
  private drawingPath: Array<{ x: number; y: number }> = []
  private selectionStart: { x: number; y: number } | null = null
  private selectionEnd: { x: number; y: number } | null = null
  private tempAnnotation: any = null
  private textSelection: any = null
  private isSelectingText = false

  constructor(config: PDFViewerConfig) {
    this.config = config
  }

  async init() {
    console.log('🚀 Initializing PDF.js viewer...')
    
    // Configure PDF.js worker
    if (typeof (window as any).pdfjsLib !== 'undefined') {
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('lib/pdf.worker.min.js')
      console.log('✅ PDF.js worker configured')
    } else {
      console.error('❌ PDF.js library not loaded')
      this.config.onError?.('PDF.js library failed to load')
      return
    }

    this.config.onFilenameChange?.(this.extractFilename(this.config.pdfUrl))
    this.config.onLoadingChange?.(true)

    await this.loadPDF()
    this.setupEventListeners()
  }

  private extractFilename(url: string): string {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const parts = pathname.split('/')
      let filename = parts[parts.length - 1]
      filename = filename.split('?')[0]
      return filename || 'document.pdf'
    } catch (e) {
      console.error('Error extracting filename:', e)
      return 'document.pdf'
    }
  }

  private async loadPDF() {
    try {
      console.log('📥 Loading PDF with PDF.js...')
      
      const response = await fetch(this.config.pdfUrl, {
        mode: 'cors',
        credentials: 'omit'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const arrayBuffer = await response.arrayBuffer()
      console.log('✅ PDF downloaded successfully, size:', arrayBuffer.byteLength, 'bytes')
      
      const loadingTask = (window as any).pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true
      })
      
      this.pdfDocument = await loadingTask.promise
      this.totalPages = this.pdfDocument.numPages
      
      console.log('✅ PDF loaded with PDF.js, pages:', this.totalPages)
      
      this.config.onLoadingChange?.(false)
      this.config.onPageChange?.(this.currentPage, this.totalPages)
      
      await this.renderPage(1)
      
    } catch (error) {
      console.error('❌ Error loading PDF:', error)
      this.config.onError?.(`Failed to load PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async renderPage(pageNum: number) {
    if (!this.pdfDocument) return
    
    console.log(`🎨 Rendering page ${pageNum}...`)
    
    try {
      const page = await this.pdfDocument.getPage(pageNum)
      const viewport = page.getViewport({ scale: this.scale })
      
      let canvas = document.getElementById(`pdf-page-${pageNum}`) as HTMLCanvasElement
      if (!canvas) {
        canvas = document.createElement('canvas')
        canvas.id = `pdf-page-${pageNum}`
        canvas.className = 'pdf-canvas'
        canvas.width = viewport.width
        canvas.height = viewport.height
        
        const container = document.getElementById('pdf-canvas-container')
        if (container) {
          container.appendChild(canvas)
        }
      } else {
        canvas.width = viewport.width
        canvas.height = viewport.height
      }
      
      const context = canvas.getContext('2d')
      if (!context) return
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      }
      
      await page.render(renderContext).promise
      
      await this.extractTextContent(page, pageNum, viewport)
      
      console.log(`✅ Page ${pageNum} rendered successfully`)
      
      this.renderedPages.set(pageNum, {
        canvas: canvas,
        viewport: viewport
      })
      
    } catch (error) {
      console.error(`❌ Error rendering page ${pageNum}:`, error)
    }
  }

  private async extractTextContent(page: any, pageNum: number, viewport: any) {
    try {
      const textContent = await page.getTextContent()
      const textItems = textContent.items.map((item: any) => {
        const transform = item.transform
        const x = transform[4]
        const y = viewport.height - transform[5] - item.height
        
        return {
          text: item.str,
          x: x,
          y: y,
          width: item.width,
          height: item.height,
          fontName: item.fontName,
          fontSize: item.height
        }
      })
      
      this.textContent.set(pageNum, textItems)
      console.log(`📝 Extracted ${textItems.length} text items from page ${pageNum}`)
      
    } catch (error) {
      console.error(`❌ Error extracting text from page ${pageNum}:`, error)
    }
  }

  async goToPage(pageNum: number) {
    if (pageNum < 1 || pageNum > this.totalPages) return
    
    this.currentPage = pageNum
    this.config.onPageChange?.(this.currentPage, this.totalPages)
    
    if (!this.renderedPages.has(pageNum)) {
      await this.renderPage(pageNum)
    }
    
    const canvas = document.getElementById(`pdf-page-${pageNum}`)
    if (canvas) {
      canvas.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  async changeZoom(newScale: number) {
    const minScale = 0.5
    const maxScale = 3.0
    
    this.scale = Math.max(minScale, Math.min(maxScale, newScale))
    
    console.log(`🔍 Zoom changed to ${Math.round(this.scale * 100)}%`)
    
    await this.renderAllPages()
  }

  private async renderAllPages() {
    if (!this.pdfDocument) return
    
    console.log('🎨 Rendering all pages...')
    
    const container = document.getElementById('pdf-canvas-container')
    if (container) {
      container.innerHTML = ''
    }
    this.renderedPages.clear()
    this.textContent.clear()
    
    for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
      await this.renderPage(pageNum)
    }
    
    console.log('✅ All pages rendered')
  }

  setTool(tool: Tool) {
    this.currentTool = tool
    
    const annotationLayer = document.getElementById('annotation-layer')
    if (annotationLayer) {
      if (tool === 'select') {
        annotationLayer.classList.remove('active')
        annotationLayer.classList.add('select-mode')
      } else {
        annotationLayer.classList.remove('select-mode')
        annotationLayer.classList.add('active')
      }
    }
    
    console.log(`🛠️ Tool changed to: ${tool}`)
  }

  setColor(color: Color) {
    this.currentColor = color
    console.log(`🎨 Color changed to: ${color}`)
  }

  private setupEventListeners() {
    const canvasContainer = document.getElementById('pdf-canvas-container')
    if (!canvasContainer) return

    canvasContainer.addEventListener('mousedown', (e) => this.handleMouseDown(e))
    canvasContainer.addEventListener('mousemove', (e) => this.handleMouseMove(e))
    canvasContainer.addEventListener('mouseup', (e) => this.handleMouseUp(e))
    
    canvasContainer.addEventListener('selectstart', (e) => {
      if (this.currentTool !== 'select') {
        e.preventDefault()
      }
    })
  }

  private handleMouseDown(e: MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    if (this.currentTool === 'select') {
      this.startTextSelection(x, y)
      return
    }
    
    switch (this.currentTool) {
      case 'highlight':
        e.preventDefault()
        this.startHighlight(x, y)
        break
      case 'note':
        e.preventDefault()
        this.addNote(x, y)
        break
      case 'draw':
        e.preventDefault()
        this.startDrawing(x, y)
        break
      case 'eraser':
        e.preventDefault()
        this.eraseAt(x, y)
        break
    }
  }

  private handleMouseMove(e: MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    if (this.currentTool === 'select' && this.isSelectingText) {
      this.updateTextSelection(x, y)
      return
    }
    
    if (this.isDrawing) {
      this.continueDrawing(x, y)
    } else if (this.currentTool === 'highlight' && this.tempAnnotation) {
      this.updateHighlight(x, y)
    }
  }

  private handleMouseUp(e: MouseEvent) {
    if (this.currentTool === 'select' && this.isSelectingText) {
      this.finishTextSelection()
      return
    }
    
    if (this.isDrawing) {
      this.finishDrawing()
    } else if (this.currentTool === 'highlight' && this.tempAnnotation) {
      this.finishHighlight()
    }
  }

  // Text selection methods
  private startTextSelection(x: number, y: number) {
    this.isSelectingText = true
    this.textSelection = {
      start: { x, y },
      end: { x, y },
      page: this.currentPage
    }
    
    this.clearTextSelection()
    console.log('📝 Started text selection')
  }

  private updateTextSelection(x: number, y: number) {
    if (this.textSelection) {
      this.textSelection.end = { x, y }
      this.renderTextSelection()
    }
  }

  private finishTextSelection() {
    if (this.textSelection) {
      const selectedText = this.getSelectedText()
      if (selectedText) {
        this.config.onTextSelected?.(selectedText)
        this.copyToClipboard(selectedText)
      }
      this.clearTextSelection()
    }
    this.isSelectingText = false
    this.textSelection = null
  }

  private getSelectedText(): string {
    if (!this.textSelection) return ''
    
    const textItems = this.textContent.get(this.currentPage) || []
    const start = this.textSelection.start
    const end = this.textSelection.end
    
    const left = Math.min(start.x, end.x)
    const right = Math.max(start.x, end.x)
    const top = Math.min(start.y, end.y)
    const bottom = Math.max(start.y, end.y)
    
    const selectedItems = textItems.filter(item => {
      return item.x < right && 
             item.x + item.width > left && 
             item.y < bottom && 
             item.y + item.height > top
    })
    
    selectedItems.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 5) {
        return a.y - b.y
      }
      return a.x - b.x
    })
    
    let selectedText = ''
    let lastY = -Infinity
    
    selectedItems.forEach(item => {
      if (Math.abs(item.y - lastY) > 5) {
        if (selectedText) selectedText += '\n'
      } else {
        if (selectedText && !selectedText.endsWith('\n')) {
          selectedText += ' '
        }
      }
      selectedText += item.text
      lastY = item.y
    })
    
    return selectedText.trim()
  }

  private renderTextSelection() {
    if (!this.textSelection) return
    
    let selectionOverlay = document.getElementById('text-selection-overlay')
    if (!selectionOverlay) {
      selectionOverlay = document.createElement('div')
      selectionOverlay.id = 'text-selection-overlay'
      selectionOverlay.style.cssText = `
        position: absolute;
        background: rgba(0, 123, 255, 0.3);
        border: 1px solid rgba(0, 123, 255, 0.5);
        pointer-events: none;
        z-index: 5;
      `
      const annotationLayer = document.getElementById('annotation-layer')
      if (annotationLayer) {
        annotationLayer.appendChild(selectionOverlay)
      }
    }
    
    const start = this.textSelection.start
    const end = this.textSelection.end
    
    const left = Math.min(start.x, end.x)
    const top = Math.min(start.y, end.y)
    const width = Math.abs(end.x - start.x)
    const height = Math.abs(end.y - start.y)
    
    selectionOverlay.style.left = `${left}px`
    selectionOverlay.style.top = `${top}px`
    selectionOverlay.style.width = `${width}px`
    selectionOverlay.style.height = `${height}px`
    selectionOverlay.style.display = 'block'
  }

  private clearTextSelection() {
    const selectionOverlay = document.getElementById('text-selection-overlay')
    if (selectionOverlay) {
      selectionOverlay.style.display = 'none'
    }
  }

  private async copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      console.log('📋 Text copied to clipboard:', text)
    } catch (error) {
      console.error('❌ Failed to copy to clipboard:', error)
      this.fallbackCopyToClipboard(text)
    }
  }

  private fallbackCopyToClipboard(text: string) {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    try {
      document.execCommand('copy')
      console.log('📋 Text copied to clipboard (fallback):', text)
    } catch (error) {
      console.error('❌ Fallback copy failed:', error)
    }
    
    document.body.removeChild(textArea)
  }

  // Annotation methods (simplified for brevity)
  private startHighlight(x: number, y: number) {
    this.selectionStart = { x, y }
    this.tempAnnotation = {
      type: 'highlight',
      start: { x, y },
      end: { x, y },
      color: this.currentColor,
      page: this.currentPage
    }
  }

  private updateHighlight(x: number, y: number) {
    if (this.tempAnnotation) {
      this.tempAnnotation.end = { x, y }
      this.renderTempHighlight()
    }
  }

  private finishHighlight() {
    if (this.tempAnnotation) {
      const start = this.tempAnnotation.start
      const end = this.tempAnnotation.end
      
      if (Math.abs(end.x - start.x) > 5 || Math.abs(end.y - start.y) > 5) {
        this.addAnnotation(this.tempAnnotation)
      }
      
      this.tempAnnotation = null
      this.clearTempHighlight()
    }
  }

  private renderTempHighlight() {
    // Implementation for temporary highlight rendering
  }

  private clearTempHighlight() {
    // Implementation for clearing temporary highlight
  }

  private addNote(x: number, y: number) {
    // Implementation for adding notes
  }

  private startDrawing(x: number, y: number) {
    // Implementation for drawing
  }

  private continueDrawing(x: number, y: number) {
    // Implementation for continuing drawing
  }

  private finishDrawing() {
    // Implementation for finishing drawing
  }

  private eraseAt(x: number, y: number) {
    // Implementation for erasing
  }

  private addAnnotation(annotation: Annotation) {
    if (!this.annotations.has(annotation.page)) {
      this.annotations.set(annotation.page, [])
    }
    
    const pageAnnotations = this.annotations.get(annotation.page)!
    annotation.id = Date.now() + Math.random().toString()
    pageAnnotations.push(annotation)
    
    this.config.onAnnotationsChange?.(this.annotations)
    console.log('📝 Annotation added:', annotation)
  }

  async saveAnnotationsToNabuAI() {
    const allAnnotations: Annotation[] = []
    
    for (const [page, annotations] of this.annotations) {
      annotations.forEach(annotation => {
        allAnnotations.push({
          ...annotation,
          page: page
        })
      })
    }
    
    if (allAnnotations.length === 0) {
      alert('No annotations to save')
      return
    }
    
    console.log('💾 Saving annotations to NabuAI:', allAnnotations)
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'saveContent',
        data: {
          type: 'pdf-annotations',
          title: `${this.extractFilename(this.config.pdfUrl)} - Annotations`,
          url: this.config.sourceUrl || this.config.pdfUrl,
          content: JSON.stringify({
            pdfUrl: this.config.pdfUrl,
            filename: this.extractFilename(this.config.pdfUrl),
            annotations: allAnnotations,
            totalAnnotations: allAnnotations.length
          }),
          tags: ['pdf', 'annotations', 'highlights', 'notes'],
          notes: `PDF annotations for ${this.extractFilename(this.config.pdfUrl)}. Contains ${allAnnotations.length} annotations across ${this.annotations.size} pages.`,
          timestamp: new Date().toISOString()
        }
      })
      
      if (response && response.success) {
        alert(`Successfully saved ${allAnnotations.length} annotations to NabuAI!`)
      } else {
        throw new Error(response?.error || 'Failed to save annotations')
      }
      
    } catch (error) {
      console.error('❌ Error saving annotations:', error)
      alert('Failed to save annotations: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  destroy() {
    // Cleanup resources
    this.pdfDocument = null
    this.renderedPages.clear()
    this.annotations.clear()
    this.textContent.clear()
  }
}
