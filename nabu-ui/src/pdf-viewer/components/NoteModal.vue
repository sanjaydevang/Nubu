<template>
  <div class="note-modal show" @click="handleBackdropClick">
    <div class="note-content" @click.stop>
      <h3>Add Note</h3>
      <textarea 
        v-model="noteText"
        class="note-textarea" 
        placeholder="Enter your note here..."
        ref="textareaRef"
      ></textarea>
      <div class="modal-actions">
        <button @click="handleSave" class="btn btn-primary">Save Note</button>
        <button @click="$emit('close')" class="btn btn-secondary">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

// Emits
const emit = defineEmits<{
  close: []
  save: [text: string]
}>()

// Refs
const noteText = ref('')
const textareaRef = ref<HTMLTextAreaElement>()

// Methods
const handleSave = () => {
  const text = noteText.value.trim()
  if (text) {
    emit('save', text)
  }
}

const handleBackdropClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}

// Lifecycle
onMounted(async () => {
  await nextTick()
  textareaRef.value?.focus()
})
</script>

<style scoped>
.note-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.note-modal.show {
  display: flex;
}

.note-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  max-width: 400px;
  width: 90%;
  color: #333;
}

.note-content h3 {
  margin: 0 0 16px;
  color: #111827;
}

.note-textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  outline: none;
  font-family: inherit;
}

.note-textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.btn {
  flex: 1;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background-color: #2563eb;
  color: white;
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}
</style>

