// PDF Viewer for NabuAI Extension using PDF.js
class PDFViewer {
  constructor() {
    this.pdfUrl = null;
    this.sourceUrl = null;
    this.filename = null;
    this.pdfDocument = null;
    this.currentPage = 1;
    this.totalPages = 0;
    this.scale = 1.0;
    this.renderedPages = new Map();
    
    // Annotation system
    this.annotations = new Map(); // page -> annotations array
    this.currentTool = 'select';
    this.currentColor = 'yellow';
    this.isDrawing = false;
    this.drawingPath = [];
    this.selectionStart = null;
    this.selectionEnd = null;
    this.tempAnnotation = null;
    
    // Text selection system
    this.textContent = new Map(); // page -> text items
    this.textSelection = null;
    this.isSelectingText = false;
    
    // Initialize asynchronously
    this.init().catch(error => {
      console.error('Error initializing PDF viewer:', error);
      this.showError('Failed to initialize PDF viewer');
    });
  }
  
  async init() {
    console.log('🚀 Initializing PDF.js viewer...');
    
    // Configure PDF.js worker
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('lib/pdf.worker.min.js');
      console.log('✅ PDF.js worker configured');
    } else {
      console.error('❌ PDF.js library not loaded');
      this.showError('PDF.js library failed to load');
      return;
    }
    
    // Get PDF URL from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    this.pdfUrl = urlParams.get('url');
    this.sourceUrl = urlParams.get('source') || document.referrer;
    
    if (!this.pdfUrl) {
      this.showError('No PDF URL provided');
      return;
    }
    
    console.log('📄 PDF URL:', this.pdfUrl);
    console.log('🔗 Source URL:', this.sourceUrl);
    
    // Extract filename from URL
    this.filename = this.extractFilename(this.pdfUrl);
    
    // Update UI
    this.updateUI();
    
    // Load PDF
    await this.loadPDF();
    
    // Setup event listeners
    this.setupEventListeners();
  }
  
  extractFilename(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const parts = pathname.split('/');
      let filename = parts[parts.length - 1];
      
      // Remove query parameters from filename
      filename = filename.split('?')[0];
      
      return filename || 'document.pdf';
    } catch (e) {
      console.error('Error extracting filename:', e);
      return 'document.pdf';
    }
  }
  
  updateUI() {
    const filenameElement = document.getElementById('pdf-filename');
    if (filenameElement) {
      filenameElement.textContent = this.filename;
    }
  }
  
  async loadPDF() {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const pdfContainer = document.getElementById('pdf-container');
    
    console.log('📥 Loading PDF with PDF.js...');
    
    // Show loading state
    loading.style.display = 'flex';
    error.style.display = 'none';
    pdfContainer.style.display = 'none';
    
    try {
      // Download the PDF as a blob first
      console.log('📥 Downloading PDF:', this.pdfUrl);
      const response = await fetch(this.pdfUrl, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log('✅ PDF downloaded successfully, size:', arrayBuffer.byteLength, 'bytes');
      
      // Load PDF with PDF.js
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true
      });
      
      this.pdfDocument = await loadingTask.promise;
      this.totalPages = this.pdfDocument.numPages;
      
      console.log('✅ PDF loaded with PDF.js, pages:', this.totalPages);
      
      // Hide loading and show PDF container
      loading.style.display = 'none';
      pdfContainer.style.display = 'block';
      
      // Render first page
      await this.renderPage(1);
      
      // Update page controls
      this.updatePageControls();
      
    } catch (error) {
      console.error('❌ Error loading PDF:', error);
      loading.style.display = 'none';
      error.style.display = 'flex';
      
      // Update error message
      const errorElement = document.getElementById('error');
      if (errorElement) {
        const errorText = errorElement.querySelector('p');
        if (errorText) {
          errorText.textContent = `Failed to load PDF: ${error.message}`;
        }
      }
    }
  }
  
  async renderPage(pageNum) {
    if (!this.pdfDocument) return;
    
    console.log(`🎨 Rendering page ${pageNum}...`);
    
    try {
      const page = await this.pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale: this.scale });
      
      // Create canvas if it doesn't exist
      let canvas = document.getElementById(`pdf-page-${pageNum}`);
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = `pdf-page-${pageNum}`;
        canvas.className = 'pdf-canvas';
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Add to container
        const container = document.getElementById('pdf-canvas-container');
        container.appendChild(canvas);
      } else {
        // Update canvas size
        canvas.width = viewport.width;
        canvas.height = viewport.height;
      }
      
      const context = canvas.getContext('2d');
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      
      // Extract text content for text selection
      await this.extractTextContent(page, pageNum, viewport);
      
      console.log(`✅ Page ${pageNum} rendered successfully`);
      
      // Store rendered page info
      this.renderedPages.set(pageNum, {
        canvas: canvas,
        viewport: viewport
      });
      
    } catch (error) {
      console.error(`❌ Error rendering page ${pageNum}:`, error);
    }
  }
  
  async renderAllPages() {
    if (!this.pdfDocument) return;
    
    console.log('🎨 Rendering all pages...');
    
    // Clear existing canvases
    const container = document.getElementById('pdf-canvas-container');
    container.innerHTML = '';
    this.renderedPages.clear();
    
    // Render all pages
    for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
      await this.renderPage(pageNum);
    }
    
    console.log('✅ All pages rendered');
  }
  
  updatePageControls() {
    const pageInfo = document.getElementById('page-info');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const zoomLevel = document.getElementById('zoom-level');
    
    if (pageInfo) {
      pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
    }
    
    if (prevBtn) {
      prevBtn.disabled = this.currentPage <= 1;
    }
    
    if (nextBtn) {
      nextBtn.disabled = this.currentPage >= this.totalPages;
    }
    
    if (zoomLevel) {
      zoomLevel.textContent = `${Math.round(this.scale * 100)}%`;
    }
  }
  
  async goToPage(pageNum) {
    if (pageNum < 1 || pageNum > this.totalPages) return;
    
    this.currentPage = pageNum;
    this.updatePageControls();
    
    // Render the page if not already rendered
    if (!this.renderedPages.has(pageNum)) {
      await this.renderPage(pageNum);
    }
    
    // Scroll to the page
    const canvas = document.getElementById(`pdf-page-${pageNum}`);
    if (canvas) {
      canvas.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  
  async changeZoom(newScale) {
    const minScale = 0.5;
    const maxScale = 3.0;
    
    this.scale = Math.max(minScale, Math.min(maxScale, newScale));
    
    console.log(`🔍 Zoom changed to ${Math.round(this.scale * 100)}%`);
    
    // Re-render all pages with new scale
    await this.renderAllPages();
    this.updatePageControls();
  }
  
  setupEventListeners() {
    // Page navigation
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.goToPage(this.currentPage - 1);
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.goToPage(this.currentPage + 1);
      });
    }
    
    // Zoom controls
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        this.changeZoom(this.scale + 0.25);
      });
    }
    
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        this.changeZoom(this.scale - 0.25);
      });
    }
    
    // Annotation tools
    this.setupAnnotationTools();
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          this.goToPage(this.currentPage - 1);
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          this.goToPage(this.currentPage + 1);
          break;
        case '+':
        case '=':
          e.preventDefault();
          this.changeZoom(this.scale + 0.25);
          break;
        case '-':
          e.preventDefault();
          this.changeZoom(this.scale - 0.25);
          break;
        case 'Escape':
          this.setTool('select');
          break;
      }
    });
    
    // Open original button
    const openOriginalBtn = document.getElementById('open-original');
    if (openOriginalBtn) {
      openOriginalBtn.addEventListener('click', () => {
        window.open(this.pdfUrl, '_blank');
      });
    }

    // Save to NabuAI button
    const saveToNabuAIBtn = document.getElementById('save-to-nabuai');
    if (saveToNabuAIBtn) {
      saveToNabuAIBtn.addEventListener('click', () => {
        this.showSaveModal();
      });
    }
    
    // Save annotations button
    const saveAnnotationsBtn = document.getElementById('save-annotations');
    if (saveAnnotationsBtn) {
      saveAnnotationsBtn.addEventListener('click', () => {
        this.saveAnnotationsToNabuAI();
      });
    }
    
    // Save modal event listeners
    this.setupSaveModalListeners();
    
    // Note modal event listeners
    this.setupNoteModalListeners();
  }
  
  showSaveModal() {
    const modal = document.getElementById('save-modal');
    const pdfFileDisplay = document.getElementById('pdf-file-display');
    const pdfUrlDisplay = document.getElementById('pdf-url-display');
    const sourcePageDisplay = document.getElementById('source-page-display');
    const pdfTitle = document.getElementById('pdf-title');
    
    if (pdfFileDisplay) {
      pdfFileDisplay.textContent = this.filename;
    }
    
    if (pdfUrlDisplay) {
      pdfUrlDisplay.textContent = this.pdfUrl;
    }
    
    if (sourcePageDisplay) {
      sourcePageDisplay.textContent = this.sourceUrl || 'Unknown';
    }
    
    if (pdfTitle) {
      pdfTitle.value = this.filename.replace('.pdf', '');
    }
    
    if (modal) {
      modal.classList.add('show');
    }
  }
  
  hideSaveModal() {
    const modal = document.getElementById('save-modal');
    if (modal) {
      modal.classList.remove('show');
    }
  }
  
  setupSaveModalListeners() {
    const modal = document.getElementById('save-modal');
    const closeBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-save');
    const saveBtn = document.getElementById('save-pdf-btn');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hideSaveModal();
      });
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.hideSaveModal();
      });
    }
    
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideSaveModal();
        }
      });
    }
    
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.savePDF();
      });
    }
  }
  
  async savePDF() {
    const titleInput = document.getElementById('pdf-title');
    const tagsInput = document.getElementById('pdf-tags');
    
    const title = titleInput ? titleInput.value.trim() : this.filename;
    const tags = tagsInput ? tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    if (!title) {
      alert('Please enter a title for the PDF');
      return;
    }
    
    console.log('💾 Saving PDF to NabuAI:', { title, tags, url: this.pdfUrl });
    
    try {
      // Send message to background script to save the PDF
      const response = await chrome.runtime.sendMessage({
        action: 'saveContent',
        data: {
          type: 'pdf',
          title: title,
          url: this.sourceUrl || this.pdfUrl,
          content: this.pdfUrl,
          tags: tags,
          notes: `PDF: ${this.filename}`,
          timestamp: new Date().toISOString()
        }
      });
      
      if (response && response.success) {
        this.showSaveSuccess();
      } else {
        throw new Error(response?.error || 'Failed to save PDF');
      }
      
    } catch (error) {
      console.error('❌ Error saving PDF:', error);
      alert('Failed to save PDF: ' + error.message);
    }
  }
  
  showSaveSuccess() {
    const modalBody = document.getElementById('modal-body');
    if (modalBody) {
      modalBody.innerHTML = `
        <div class="success-message">
          <div class="success-icon">
            <svg width="32" height="32" fill="#16a34a" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <h3 class="success-title">PDF Saved Successfully!</h3>
          <p class="success-text">The PDF has been added to your NabuAI knowledge base.</p>
          <div class="modal-actions">
            <button class="btn btn-primary" onclick="this.closest('.save-modal').classList.remove('show')">Close</button>
          </div>
        </div>
      `;
    }
  }

  showError(message) {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    if (loading) loading.style.display = 'none';
    if (error) {
      error.style.display = 'flex';
      const errorText = error.querySelector('p');
      if (errorText) {
        errorText.textContent = message;
      }
    }
  }
  
  // Annotation Methods
  setupAnnotationTools() {
    // Tool selection
    const tools = ['select', 'highlight', 'note', 'draw', 'eraser'];
    tools.forEach(tool => {
      const btn = document.getElementById(`${tool}-tool`);
      if (btn) {
        btn.addEventListener('click', () => {
          this.setTool(tool);
        });
      }
    });
    
    // Color selection
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
      option.addEventListener('click', () => {
        this.setColor(option.dataset.color);
        colorOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
      });
    });
    
    // Canvas interaction
    this.setupCanvasInteraction();
  }
  
  setTool(tool) {
    this.currentTool = tool;
    
    // Update UI
    document.querySelectorAll('.annotation-tool').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(`${tool}-tool`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
    
    // Update cursor and interaction
    const annotationLayer = document.getElementById('annotation-layer');
    if (annotationLayer) {
      if (tool === 'select') {
        annotationLayer.classList.remove('active');
        annotationLayer.classList.add('select-mode');
      } else {
        annotationLayer.classList.remove('select-mode');
        annotationLayer.classList.add('active');
      }
    }
    
    console.log(`🛠️ Tool changed to: ${tool}`);
  }
  
  setColor(color) {
    this.currentColor = color;
    console.log(`🎨 Color changed to: ${color}`);
  }
  
  setupCanvasInteraction() {
    const canvasContainer = document.getElementById('pdf-canvas-container');
    const annotationLayer = document.getElementById('annotation-layer');
    
    if (!canvasContainer || !annotationLayer) return;
    
    // Mouse events for annotations
    canvasContainer.addEventListener('mousedown', (e) => {
      this.handleMouseDown(e);
    });
    
    canvasContainer.addEventListener('mousemove', (e) => {
      this.handleMouseMove(e);
    });
    
    canvasContainer.addEventListener('mouseup', (e) => {
      this.handleMouseUp(e);
    });
    
    // Prevent text selection when using annotation tools
    canvasContainer.addEventListener('selectstart', (e) => {
      if (this.currentTool !== 'select') {
        e.preventDefault();
      }
    });
    
    // Allow text selection in select mode
    canvasContainer.addEventListener('mousedown', (e) => {
      if (this.currentTool === 'select') {
        // Allow default text selection behavior
        return;
      }
    }, true);
  }
  
  handleMouseDown(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (this.currentTool === 'select') {
      // Start text selection
      this.startTextSelection(x, y);
      return;
    }
    
    switch (this.currentTool) {
      case 'highlight':
        e.preventDefault(); // Prevent text selection
        this.startHighlight(x, y);
        break;
      case 'note':
        e.preventDefault(); // Prevent text selection
        this.addNote(x, y);
        break;
      case 'draw':
        e.preventDefault(); // Prevent text selection
        this.startDrawing(x, y);
        break;
      case 'eraser':
        e.preventDefault(); // Prevent text selection
        this.eraseAt(x, y);
        break;
    }
  }
  
  handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (this.currentTool === 'select' && this.isSelectingText) {
      this.updateTextSelection(x, y);
      return;
    }
    
    if (this.isDrawing) {
      this.continueDrawing(x, y);
    } else if (this.currentTool === 'highlight' && this.tempAnnotation) {
      this.updateHighlight(x, y);
    }
  }
  
  handleMouseUp(e) {
    if (this.currentTool === 'select' && this.isSelectingText) {
      this.finishTextSelection();
      return;
    }
    
    if (this.isDrawing) {
      this.finishDrawing();
    } else if (this.currentTool === 'highlight' && this.tempAnnotation) {
      this.finishHighlight();
    }
  }
  
  startHighlight(x, y) {
    this.selectionStart = { x, y };
    this.tempAnnotation = {
      type: 'highlight',
      start: { x, y },
      end: { x, y },
      color: this.currentColor,
      page: this.currentPage
    };
  }
  
  updateHighlight(x, y) {
    if (this.tempAnnotation) {
      this.tempAnnotation.end = { x, y };
      this.renderTempHighlight();
    }
  }
  
  finishHighlight() {
    if (this.tempAnnotation) {
      const start = this.tempAnnotation.start;
      const end = this.tempAnnotation.end;
      
      // Only add highlight if it has some size
      if (Math.abs(end.x - start.x) > 5 || Math.abs(end.y - start.y) > 5) {
        this.addAnnotation(this.tempAnnotation);
      }
      
      this.tempAnnotation = null;
      this.clearTempHighlight();
    }
  }
  
  renderTempHighlight() {
    // Create or update temporary highlight element
    let tempElement = document.getElementById('temp-highlight');
    if (!tempElement) {
      tempElement = document.createElement('div');
      tempElement.id = 'temp-highlight';
      tempElement.className = 'highlight-annotation';
      document.getElementById('annotation-layer').appendChild(tempElement);
    }
    
    const start = this.tempAnnotation.start;
    const end = this.tempAnnotation.end;
    
    const left = Math.min(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    
    tempElement.style.left = `${left}px`;
    tempElement.style.top = `${top}px`;
    tempElement.style.width = `${width}px`;
    tempElement.style.height = `${height}px`;
    tempElement.style.backgroundColor = this.getColorValue(this.currentColor, 0.3);
  }
  
  clearTempHighlight() {
    const tempElement = document.getElementById('temp-highlight');
    if (tempElement) {
      tempElement.remove();
    }
  }
  
  addNote(x, y) {
    this.showNoteModal(x, y);
  }
  
  showNoteModal(x, y) {
    const modal = document.getElementById('note-modal');
    const textarea = document.getElementById('note-text');
    
    if (modal && textarea) {
      textarea.value = '';
      modal.classList.add('show');
      
      // Store position for when note is saved
      this.tempAnnotation = {
        type: 'note',
        x: x,
        y: y,
        page: this.currentPage,
        color: this.currentColor
      };
    }
  }
  
  setupNoteModalListeners() {
    const modal = document.getElementById('note-modal');
    const saveBtn = document.getElementById('save-note');
    const cancelBtn = document.getElementById('cancel-note');
    
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveNote();
      });
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.hideNoteModal();
      });
    }
    
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideNoteModal();
        }
      });
    }
  }
  
  saveNote() {
    const textarea = document.getElementById('note-text');
    if (textarea && this.tempAnnotation) {
      const text = textarea.value.trim();
      if (text) {
        this.tempAnnotation.text = text;
        this.addAnnotation(this.tempAnnotation);
        this.hideNoteModal();
      }
    }
  }
  
  hideNoteModal() {
    const modal = document.getElementById('note-modal');
    if (modal) {
      modal.classList.remove('show');
    }
    this.tempAnnotation = null;
  }
  
  startDrawing(x, y) {
    this.isDrawing = true;
    this.drawingPath = [{ x, y }];
    
    this.tempAnnotation = {
      type: 'drawing',
      path: [{ x, y }],
      color: this.currentColor,
      page: this.currentPage
    };
  }
  
  continueDrawing(x, y) {
    if (this.isDrawing && this.tempAnnotation) {
      this.drawingPath.push({ x, y });
      this.tempAnnotation.path.push({ x, y });
      this.renderTempDrawing();
    }
  }
  
  finishDrawing() {
    if (this.isDrawing && this.tempAnnotation && this.tempAnnotation.path.length > 1) {
      this.addAnnotation(this.tempAnnotation);
    }
    this.isDrawing = false;
    this.drawingPath = [];
    this.tempAnnotation = null;
  }
  
  renderTempDrawing() {
    // Create or update temporary drawing element
    let tempElement = document.getElementById('temp-drawing');
    if (!tempElement) {
      tempElement = document.createElement('div');
      tempElement.id = 'temp-drawing';
      tempElement.className = 'drawing-annotation';
      document.getElementById('annotation-layer').appendChild(tempElement);
    }
    
    // Create SVG path
    const path = this.tempAnnotation.path;
    if (path.length > 1) {
      let pathData = `M ${path[0].x} ${path[0].y}`;
      for (let i = 1; i < path.length; i++) {
        pathData += ` L ${path[i].x} ${path[i].y}`;
      }
      
      tempElement.innerHTML = `
        <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;">
          <path d="${pathData}" stroke="${this.getColorValue(this.currentColor)}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
    }
  }
  
  eraseAt(x, y) {
    const annotations = this.annotations.get(this.currentPage) || [];
    const annotationLayer = document.getElementById('annotation-layer');
    
    // Find and remove annotation at this position
    for (let i = annotations.length - 1; i >= 0; i--) {
      const annotation = annotations[i];
      if (this.isPointInAnnotation(x, y, annotation)) {
        annotations.splice(i, 1);
        this.renderAnnotations();
        break;
      }
    }
  }
  
  isPointInAnnotation(x, y, annotation) {
    // Simple hit detection - can be improved
    switch (annotation.type) {
      case 'highlight':
        return x >= Math.min(annotation.start.x, annotation.end.x) &&
               x <= Math.max(annotation.start.x, annotation.end.x) &&
               y >= Math.min(annotation.start.y, annotation.end.y) &&
               y <= Math.max(annotation.start.y, annotation.end.y);
      case 'note':
        return x >= annotation.x - 10 && x <= annotation.x + 20 &&
               y >= annotation.y - 10 && y <= annotation.y + 20;
      default:
        return false;
    }
  }
  
  addAnnotation(annotation) {
    if (!this.annotations.has(annotation.page)) {
      this.annotations.set(annotation.page, []);
    }
    
    const pageAnnotations = this.annotations.get(annotation.page);
    annotation.id = Date.now() + Math.random();
    pageAnnotations.push(annotation);
    
    this.renderAnnotations();
    console.log('📝 Annotation added:', annotation);
  }
  
  renderAnnotations() {
    const annotationLayer = document.getElementById('annotation-layer');
    if (!annotationLayer) return;
    
    // Clear existing annotations
    annotationLayer.innerHTML = '';
    
    // Remove temp elements
    const tempDrawing = document.getElementById('temp-drawing');
    if (tempDrawing) {
      tempDrawing.remove();
    }
    
    const tempHighlight = document.getElementById('temp-highlight');
    if (tempHighlight) {
      tempHighlight.remove();
    }
    
    // Render annotations for current page
    const pageAnnotations = this.annotations.get(this.currentPage) || [];
    pageAnnotations.forEach(annotation => {
      this.renderAnnotation(annotation);
    });
  }
  
  renderAnnotation(annotation) {
    const annotationLayer = document.getElementById('annotation-layer');
    if (!annotationLayer) return;
    
    let element;
    
    switch (annotation.type) {
      case 'highlight':
        element = this.createHighlightElement(annotation);
        break;
      case 'note':
        element = this.createNoteElement(annotation);
        break;
      case 'drawing':
        element = this.createDrawingElement(annotation);
        break;
    }
    
    if (element) {
      element.dataset.annotationId = annotation.id;
      annotationLayer.appendChild(element);
    }
  }
  
  createHighlightElement(annotation) {
    const element = document.createElement('div');
    element.className = 'highlight-annotation';
    
    const left = Math.min(annotation.start.x, annotation.end.x);
    const top = Math.min(annotation.start.y, annotation.end.y);
    const width = Math.abs(annotation.end.x - annotation.start.x);
    const height = Math.abs(annotation.end.y - annotation.start.y);
    
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.backgroundColor = this.getColorValue(annotation.color, 0.3);
    
    return element;
  }
  
  createNoteElement(annotation) {
    const element = document.createElement('div');
    element.className = 'note-annotation';
    element.textContent = '📝';
    element.title = annotation.text || 'Note';
    
    element.style.left = `${annotation.x}px`;
    element.style.top = `${annotation.y}px`;
    element.style.backgroundColor = this.getColorValue(annotation.color);
    
    // Show note text on hover
    element.addEventListener('mouseenter', () => {
      this.showNoteTooltip(annotation.text, element);
    });
    
    element.addEventListener('mouseleave', () => {
      this.hideNoteTooltip();
    });
    
    return element;
  }
  
  createDrawingElement(annotation) {
    const element = document.createElement('div');
    element.className = 'drawing-annotation';
    
    if (annotation.path && annotation.path.length > 1) {
      let pathData = `M ${annotation.path[0].x} ${annotation.path[0].y}`;
      for (let i = 1; i < annotation.path.length; i++) {
        pathData += ` L ${annotation.path[i].x} ${annotation.path[i].y}`;
      }
      
      element.innerHTML = `
        <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;">
          <path d="${pathData}" stroke="${this.getColorValue(annotation.color)}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
    }
    
    return element;
  }
  
  getColorValue(color, alpha = 1) {
    const colors = {
      yellow: `rgba(255, 235, 59, ${alpha})`,
      green: `rgba(76, 175, 80, ${alpha})`,
      blue: `rgba(33, 150, 243, ${alpha})`,
      red: `rgba(244, 67, 54, ${alpha})`,
      orange: `rgba(255, 152, 0, ${alpha})`
    };
    return colors[color] || colors.yellow;
  }
  
  showNoteTooltip(text, element) {
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'note-tooltip';
    tooltip.textContent = text;
    tooltip.style.cssText = `
      position: absolute;
      background: #333;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      max-width: 200px;
      word-wrap: break-word;
      z-index: 1000;
      pointer-events: none;
    `;
    
    document.body.appendChild(tooltip);
    
    // Position tooltip
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.right + 10}px`;
    tooltip.style.top = `${rect.top}px`;
    
    this.currentTooltip = tooltip;
  }
  
  hideNoteTooltip() {
    if (this.currentTooltip) {
      this.currentTooltip.remove();
      this.currentTooltip = null;
    }
  }
  
  async saveAnnotationsToNabuAI() {
    const allAnnotations = [];
    
    // Collect all annotations
    for (const [page, annotations] of this.annotations) {
      annotations.forEach(annotation => {
        allAnnotations.push({
          ...annotation,
          page: page
        });
      });
    }
    
    if (allAnnotations.length === 0) {
      alert('No annotations to save');
      return;
    }
    
    console.log('💾 Saving annotations to NabuAI:', allAnnotations);
    
    try {
      // Send message to background script to save annotations
      const response = await chrome.runtime.sendMessage({
        action: 'saveContent',
        data: {
          type: 'pdf-annotations',
          title: `${this.filename} - Annotations`,
          url: this.sourceUrl || this.pdfUrl,
          content: JSON.stringify({
            pdfUrl: this.pdfUrl,
            filename: this.filename,
            annotations: allAnnotations,
            totalAnnotations: allAnnotations.length
          }),
          tags: ['pdf', 'annotations', 'highlights', 'notes'],
          notes: `PDF annotations for ${this.filename}. Contains ${allAnnotations.length} annotations across ${this.annotations.size} pages.`,
          timestamp: new Date().toISOString()
        }
      });
      
      if (response && response.success) {
        alert(`Successfully saved ${allAnnotations.length} annotations to NabuAI!`);
      } else {
        throw new Error(response?.error || 'Failed to save annotations');
      }
      
    } catch (error) {
      console.error('❌ Error saving annotations:', error);
      alert('Failed to save annotations: ' + error.message);
    }
  }
  
  // Text Selection Methods
  async extractTextContent(page, pageNum, viewport) {
    try {
      const textContent = await page.getTextContent();
      const textItems = textContent.items.map(item => {
        // Transform text item coordinates to match our viewport
        const transform = item.transform;
        const x = transform[4];
        const y = viewport.height - transform[5] - item.height;
        
        return {
          text: item.str,
          x: x,
          y: y,
          width: item.width,
          height: item.height,
          fontName: item.fontName,
          fontSize: item.height
        };
      });
      
      this.textContent.set(pageNum, textItems);
      console.log(`📝 Extracted ${textItems.length} text items from page ${pageNum}`);
      
    } catch (error) {
      console.error(`❌ Error extracting text from page ${pageNum}:`, error);
    }
  }
  
  startTextSelection(x, y) {
    this.isSelectingText = true;
    this.textSelection = {
      start: { x, y },
      end: { x, y },
      page: this.currentPage
    };
    
    // Clear any existing text selection
    this.clearTextSelection();
    
    console.log('📝 Started text selection');
  }
  
  updateTextSelection(x, y) {
    if (this.textSelection) {
      this.textSelection.end = { x, y };
      this.renderTextSelection();
    }
  }
  
  finishTextSelection() {
    if (this.textSelection) {
      const selectedText = this.getSelectedText();
      if (selectedText) {
        this.showSelectedText(selectedText);
        this.copyToClipboard(selectedText);
      }
      this.clearTextSelection();
    }
    this.isSelectingText = false;
    this.textSelection = null;
  }
  
  getSelectedText() {
    if (!this.textSelection) return '';
    
    const textItems = this.textContent.get(this.currentPage) || [];
    const start = this.textSelection.start;
    const end = this.textSelection.end;
    
    // Create selection rectangle
    const left = Math.min(start.x, end.x);
    const right = Math.max(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const bottom = Math.max(start.y, end.y);
    
    // Find text items that intersect with selection
    const selectedItems = textItems.filter(item => {
      return item.x < right && 
             item.x + item.width > left && 
             item.y < bottom && 
             item.y + item.height > top;
    });
    
    // Sort by position (top to bottom, left to right)
    selectedItems.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 5) {
        return a.y - b.y; // Different lines
      }
      return a.x - b.x; // Same line
    });
    
    // Combine text
    let selectedText = '';
    let lastY = -Infinity;
    
    selectedItems.forEach(item => {
      if (Math.abs(item.y - lastY) > 5) {
        // New line
        if (selectedText) selectedText += '\n';
      } else {
        // Same line, add space if needed
        if (selectedText && !selectedText.endsWith('\n')) {
          selectedText += ' ';
        }
      }
      selectedText += item.text;
      lastY = item.y;
    });
    
    return selectedText.trim();
  }
  
  renderTextSelection() {
    if (!this.textSelection) return;
    
    // Create or update selection overlay
    let selectionOverlay = document.getElementById('text-selection-overlay');
    if (!selectionOverlay) {
      selectionOverlay = document.createElement('div');
      selectionOverlay.id = 'text-selection-overlay';
      selectionOverlay.style.cssText = `
        position: absolute;
        background: rgba(0, 123, 255, 0.3);
        border: 1px solid rgba(0, 123, 255, 0.5);
        pointer-events: none;
        z-index: 5;
      `;
      document.getElementById('annotation-layer').appendChild(selectionOverlay);
    }
    
    const start = this.textSelection.start;
    const end = this.textSelection.end;
    
    const left = Math.min(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    
    selectionOverlay.style.left = `${left}px`;
    selectionOverlay.style.top = `${top}px`;
    selectionOverlay.style.width = `${width}px`;
    selectionOverlay.style.height = `${height}px`;
    selectionOverlay.style.display = 'block';
  }
  
  clearTextSelection() {
    const selectionOverlay = document.getElementById('text-selection-overlay');
    if (selectionOverlay) {
      selectionOverlay.style.display = 'none';
    }
  }
  
  showSelectedText(text) {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #333;
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 14px;
      max-width: 300px;
      word-wrap: break-word;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">📋 Text Selected & Copied:</div>
      <div style="font-size: 12px; opacity: 0.9;">${text}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
  
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      console.log('📋 Text copied to clipboard:', text);
    } catch (error) {
      console.error('❌ Failed to copy to clipboard:', error);
      // Fallback for older browsers
      this.fallbackCopyToClipboard(text);
    }
  }
  
  fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      console.log('📋 Text copied to clipboard (fallback):', text);
    } catch (error) {
      console.error('❌ Fallback copy failed:', error);
    }
    
    document.body.removeChild(textArea);
  }
}

// Initialize PDF viewer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 DOM loaded, initializing PDF viewer...');
  new PDFViewer();
});