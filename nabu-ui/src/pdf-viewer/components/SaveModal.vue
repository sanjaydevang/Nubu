<template>
  <div class="save-modal show" @click="handleBackdropClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">Save PDF to NabuAI</h3>
        <button class="close-btn" @click="$emit('close')">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">PDF File</label>
          <div class="form-display">{{ filename }}</div>
        </div>
        <div class="form-group">
          <label class="form-label">PDF URL</label>
          <div class="form-display">{{ pdfUrl }}</div>
        </div>
        <div class="form-group">
          <label class="form-label">Source Page</label>
          <div class="form-display">{{ sourceUrl || 'Unknown' }}</div>
        </div>
        <div class="form-group">
          <label class="form-label" for="pdf-title">Title</label>
          <input 
            v-model="formData.title"
            type="text" 
            id="pdf-title" 
            class="form-input" 
            placeholder="Enter a title for this PDF..."
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="pdf-tags">Tags</label>
          <input 
            v-model="formData.tags"
            type="text" 
            id="pdf-tags" 
            class="form-input" 
            placeholder="Enter tags separated by commas..."
          />
        </div>
        <div class="modal-actions">
          <button @click="handleSave" class="btn btn-primary">Save PDF</button>
          <button @click="$emit('close')" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { SaveModalData } from '../types'

// Props
const props = defineProps<{
  pdfUrl: string
  sourceUrl?: string
  filename: string
}>()

// Emits
const emit = defineEmits<{
  close: []
  save: [data: SaveModalData]
}>()

// Form data
const formData = ref<SaveModalData>({
  title: '',
  tags: ''
})

// Methods
const handleSave = () => {
  if (!formData.value.title.trim()) {
    alert('Please enter a title for the PDF')
    return
  }
  
  const tags = formData.value.tags
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag)
  
  emit('save', {
    title: formData.value.title,
    tags,
    notes: formData.value.notes
  })
}

const handleBackdropClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}

// Lifecycle
onMounted(() => {
  formData.value.title = props.filename.replace('.pdf', '')
})
</script>

<style scoped>
.save-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.save-modal.show {
  display: flex;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  color: #1f2937;
}

.modal-header {
  padding: 24px 24px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-btn {
  color: #9ca3af;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-display {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.modal-actions .btn {
  flex: 1;
  justify-content: center;
}

.btn {
  padding: 8px 15px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 5px;
  border: none;
}

.btn-primary {
  background-color: #2563eb;
  color: white;
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

.btn-secondary {
  background-color: #4a4a4a;
  color: #e0e0e0;
}

.btn-secondary:hover {
  background-color: #5a5a5a;
}
</style>

