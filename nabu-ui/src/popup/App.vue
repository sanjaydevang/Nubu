<template>
  <div v-if="!showDashboard">
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200 px-4 py-3">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">N</span>
          </div>
          <div>
            <h1 class="text-lg font-semibold text-gray-900">NabuAI</h1>
            <p class="text-sm text-gray-500">Save this page to your knowledge base</p>
          </div>
        </div>
      </div>

      <!-- Page Info -->
      <div class="p-4">
        <div class="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="text-sm font-medium text-gray-900 truncate">{{ pageInfo.title }}</h2>
              <p class="text-xs text-gray-500 truncate">{{ pageInfo.url }}</p>
            </div>
          </div>
        </div>

        <!-- Notes Input -->
        <div class="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
            Add notes or context
          </label>
          <textarea
            id="notes"
            v-model="notes"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="What's important about this page? Add your thoughts..."
          ></textarea>
        </div>

        <!-- Tags Input -->
        <div class="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <label for="tags" class="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <input
            id="tags"
            v-model="tags"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter tags separated by commas..."
          />
          <p class="text-xs text-gray-500 mt-1">Tags help organize your saved content</p>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3">
          <button
            @click="savePage"
            :disabled="isSaving"
            class="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isSaving">Saving...</span>
            <span v-else>Save Page</span>
          </button>
          
          <button
            @click="showDashboard = true"
            class="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Go to NabuAI Dashboard
          </button>
        </div>
      </div>

      <!-- Success Message -->
      <div
        v-if="showSuccess"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div class="bg-white rounded-lg p-6 max-w-sm mx-4 text-center">
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Page Saved!</h3>
          <p class="text-sm text-gray-500 mb-4">Your page has been successfully saved to NabuAI.</p>
          <button
            @click="showSuccess = false"
            class="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Dashboard -->
  <Dashboard v-if="showDashboard" @back="showDashboard = false" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Dashboard from './Dashboard.vue'
import { storageManager } from '../utils/storage'

interface PageInfo {
  title: string
  url: string
}

const pageInfo = ref<PageInfo>({
  title: '',
  url: ''
})
const notes = ref('')
const tags = ref('')
const isSaving = ref(false)
const showSuccess = ref(false)
const showDashboard = ref(false)

onMounted(async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab) {
      pageInfo.value = {
        title: tab.title || 'Untitled Page',
        url: tab.url || ''
      }
    }
  } catch (error) {
    console.error('Error getting tab info:', error)
  }
})

const savePage = async () => {
  isSaving.value = true
  
  try {
    const savedData = {
      type: 'page' as const,
      title: pageInfo.value.title,
      url: pageInfo.value.url,
      notes: notes.value,
      tags: tags.value.split(',').map(tag => tag.trim()).filter(tag => tag),
      timestamp: new Date().toISOString()
    }
    
    console.log('Saving page:', savedData)
    
    // Save via backend (S3 through FastAPI)
    const BACKEND_URL = "http://127.0.0.1:8010"
    const SCRIBE_ID = "scribe-123"

    console.log('Making API call to:', `${BACKEND_URL}/scribes/${encodeURIComponent(SCRIBE_ID)}/content`)
    const res = await fetch(`${BACKEND_URL}/scribes/${encodeURIComponent(SCRIBE_ID)}/content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: JSON.stringify(savedData),
        metadata: {
          type: savedData.type,
          title: savedData.title,
          url: savedData.url,
          tags: savedData.tags
        }
      })
    })

    if (!res.ok) {
      const text = await res.text()
      console.error("Upload failed:", res.status, text)
      throw new Error(text)
    }

    const data = await res.json() // { key, uri }
    console.log("✅ Saved to S3 via backend:", data)
    
    showSuccess.value = true
    notes.value = ''
    tags.value = ''
  } catch (error) {
    console.error('Error saving page:', error)
    // Show error to user
    alert(`Failed to save: ${error.message}`)
  } finally {
    isSaving.value = false
  }
}
</script>
