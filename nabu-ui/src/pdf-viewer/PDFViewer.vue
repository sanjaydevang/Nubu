<template>
  <div class="pdf-viewer-container">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="logo">N</div>
        <span class="app-name">NabuAI</span>
        <div class="pdf-info">
          <svg class="pdf-icon" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path>
          </svg>
          <span class="filename">{{ filename }}</span>
        </div>
      </div>
      <div class="header-right">
        <button @click="openOriginal" class="btn btn-secondary">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
          </svg>
          Open Original
        </button>
        <button @click="showSaveModal" class="btn btn-primary">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
          </svg>
          Save to NabuAI
        </button>
      </div>
    </div>
    
    <!-- PDF Toolbar -->
    <div class="pdf-toolbar">
      <div class="toolbar-left">
        <div class="toolbar-group">
          <button @click="goToPage(currentPage - 1)" :disabled="currentPage <= 1" class="btn btn-secondary">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Previous
          </button>
          <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
          <button @click="goToPage(currentPage + 1)" :disabled="currentPage >= totalPages" class="btn btn-secondary">
            Next
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="toolbar-center">
        <div class="annotation-tools">
          <button 
            v-for="tool in tools" 
            :key="tool.id"
            @click="setTool(tool.id)"
            :class="['annotation-tool', { active: currentTool === tool.id }]"
            :title="tool.title"
          >
            <component :is="tool.icon" width="14" height="14" />
            {{ tool.name }}
          </button>
        </div>
        
        <div class="color-picker">
          <div 
            v-for="color in colors" 
            :key="color.id"
            @click="setColor(color.id)"
            :class="['color-option', { active: currentColor === color.id }]"
            :style="{ background: color.value }"
            :title="color.name"
          ></div>
        </div>
      </div>
      
      <div class="toolbar-right">
        <div class="toolbar-group">
          <button @click="changeZoom(scale - 0.25)" class="btn btn-secondary">−</button>
          <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
          <button @click="changeZoom(scale + 0.25)" class="btn btn-secondary">+</button>
        </div>
        <div class="toolbar-separator"></div>
        <button @click="saveAnnotations" class="btn btn-primary" title="Save Annotations to NabuAI">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
          </svg>
          Save Annotations
        </button>
      </div>
    </div>
    
    <!-- PDF Viewer -->
    <div class="pdf-viewer" ref="pdfViewer">
      <div v-if="!loading && !error" id="pdf-container" class="pdf-container">
        <div id="pdf-canvas-container" class="pdf-canvas-container" ref="canvasContainer">
          <!-- PDF pages will be rendered here -->
        </div>
        <div 
          id="annotation-layer" 
          class="annotation-layer"
          :class="{ 
            active: currentTool !== 'select', 
            'select-mode': currentTool === 'select' 
          }"
        >
          <!-- Annotations will be rendered here -->
        </div>
      </div>
      
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        Loading PDF...
      </div>
      
      <div v-if="error" class="error">
        <svg viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
        </svg>
        <h3>Failed to Load PDF</h3>
        <p>{{ error }}</p>
        <button @click="reload">Reload</button>
      </div>
    </div>
    
    <!-- Save Modal -->
    <SaveModal 
      v-if="showSaveModalFlag"
      :pdf-url="pdfUrl"
      :source-url="sourceUrl"
      :filename="filename"
      @close="showSaveModalFlag = false"
      @save="savePDF"
    />
    
    <!-- Note Modal -->
    <NoteModal 
      v-if="showNoteModalFlag"
      @close="showNoteModalFlag = false"
      @save="saveNote"
    />
    
    <!-- Text Selection Notification -->
    <div v-if="selectedText" class="text-notification">
      <div class="notification-content">
        <div class="notification-title">📋 Text Selected & Copied:</div>
        <div class="notification-text">{{ selectedText }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import SaveModal from './components/SaveModal.vue'
import NoteModal from './components/NoteModal.vue'
import { PDFViewerEngine } from './PDFViewerEngine'
import type { Annotation, Tool, Color } from './types'

// Props
const props = defineProps<{
  pdfUrl: string
  sourceUrl?: string
}>()

// Reactive state
const filename = ref('Loading PDF...')
const currentPage = ref(1)
const totalPages = ref(0)
const scale = ref(1.0)
const loading = ref(true)
const error = ref('')
const showSaveModalFlag = ref(false)
const showNoteModalFlag = ref(false)
const selectedText = ref('')

// Annotation state
const currentTool = ref<Tool>('select')
const currentColor = ref<Color>('yellow')
const annotations = ref<Map<number, Annotation[]>>(new Map())

// Refs
const pdfViewer = ref<HTMLElement>()
const canvasContainer = ref<HTMLElement>()

// PDF Engine
let pdfEngine: PDFViewerEngine | null = null

// Tools configuration
const tools: Array<{ id: Tool; name: string; title: string; icon: string }> = [
  { id: 'select', name: 'Select', title: 'Select Tool', icon: 'SelectIcon' },
  { id: 'highlight', name: 'Highlight', title: 'Highlight Text', icon: 'HighlightIcon' },
  { id: 'note', name: 'Note', title: 'Add Note', icon: 'NoteIcon' },
  { id: 'draw', name: 'Draw', title: 'Draw', icon: 'DrawIcon' },
  { id: 'eraser', name: 'Eraser', title: 'Eraser', icon: 'EraserIcon' }
]

// Colors configuration
const colors: Array<{ id: Color; name: string; value: string }> = [
  { id: 'yellow', name: 'Yellow', value: '#ffeb3b' },
  { id: 'green', name: 'Green', value: '#4caf50' },
  { id: 'blue', name: 'Blue', value: '#2196f3' },
  { id: 'red', name: 'Red', value: '#f44336' },
  { id: 'orange', name: 'Orange', value: '#ff9800' }
]

// Methods
const initPDFViewer = async () => {
  try {
    loading.value = true
    error.value = ''
    
    pdfEngine = new PDFViewerEngine({
      pdfUrl: props.pdfUrl,
      sourceUrl: props.sourceUrl,
      onPageChange: (page: number, total: number) => {
        currentPage.value = page
        totalPages.value = total
      },
      onFilenameChange: (name: string) => {
        filename.value = name
      },
      onLoadingChange: (isLoading: boolean) => {
        loading.value = isLoading
      },
      onError: (err: string) => {
        error.value = err
      },
      onTextSelected: (text: string) => {
        selectedText.value = text
        setTimeout(() => {
          selectedText.value = ''
        }, 3000)
      },
      onAnnotationsChange: (newAnnotations: Map<number, Annotation[]>) => {
        annotations.value = newAnnotations
      }
    })
    
    await pdfEngine.init()
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to initialize PDF viewer'
  }
}

const goToPage = async (pageNum: number) => {
  if (pdfEngine && pageNum >= 1 && pageNum <= totalPages.value) {
    await pdfEngine.goToPage(pageNum)
  }
}

const changeZoom = async (newScale: number) => {
  if (pdfEngine) {
    await pdfEngine.changeZoom(newScale)
    scale.value = newScale
  }
}

const setTool = (tool: Tool) => {
  currentTool.value = tool
  pdfEngine?.setTool(tool)
}

const setColor = (color: Color) => {
  currentColor.value = color
  pdfEngine?.setColor(color)
}

const showSaveModal = () => {
  showSaveModalFlag.value = true
}

const savePDF = async (data: any) => {
  // Implementation for saving PDF
  console.log('Saving PDF:', data)
  showSaveModalFlag.value = false
}

const saveNote = (noteData: any) => {
  // Implementation for saving note
  console.log('Saving note:', noteData)
  showNoteModalFlag.value = false
}

const saveAnnotations = async () => {
  if (pdfEngine) {
    await pdfEngine.saveAnnotationsToNabuAI()
  }
}

const openOriginal = () => {
  window.open(props.pdfUrl, '_blank')
}

const reload = () => {
  initPDFViewer()
}

// Lifecycle
onMounted(async () => {
  await nextTick()
  await initPDFViewer()
})

onUnmounted(() => {
  if (pdfEngine) {
    pdfEngine.destroy()
  }
})
</script>

<style scoped>
/* Import the existing styles */
@import './pdf-viewer.css';
</style>
