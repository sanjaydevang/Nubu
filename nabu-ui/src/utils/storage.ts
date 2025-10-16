// Storage utility for NabuAI extension
export interface SavedContent {
  id: string
  type: 'page' | 'text' | 'image' | 'video'
  title: string
  url: string
  content?: string
  notes?: string
  tags: string[]
  timestamp: string
  metadata?: Record<string, any>
}

export class StorageManager {
  private static instance: StorageManager
  private storageBackend: 'chrome' | 'localStorage' | 'api' = 'chrome'

  private constructor() {}

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager()
    }
    return StorageManager.instance
  }

  // Save content to storage
  async saveContent(content: Omit<SavedContent, 'id'>): Promise<string> {
    const id = `saved_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const savedContent: SavedContent = { ...content, id }

    try {
      switch (this.storageBackend) {
        case 'chrome':
          await chrome.storage.local.set({ [id]: savedContent })
          break
        case 'localStorage':
          localStorage.setItem(id, JSON.stringify(savedContent))
          break
        case 'api':
          // TODO: Implement API call
          console.log('API storage not implemented yet')
          break
      }

      console.log('Content saved successfully:', savedContent)
      return id
    } catch (error) {
      console.error('Error saving content:', error)
      throw error
    }
  }

  // Get all saved content
  async getAllContent(): Promise<SavedContent[]> {
    try {
      switch (this.storageBackend) {
        case 'chrome':
          const result = await chrome.storage.local.get(null)
          return Object.values(result).filter(item => 
            item && typeof item === 'object' && 'id' in item
          ) as SavedContent[]
        
        case 'localStorage':
          const items: SavedContent[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith('saved_')) {
              try {
                const item = JSON.parse(localStorage.getItem(key) || '{}')
                if (item.id) items.push(item)
              } catch (e) {
                console.warn('Invalid item in localStorage:', key)
              }
            }
          }
          return items
        
        case 'api':
          // TODO: Implement API call
          console.log('API storage not implemented yet')
          return []
      }
    } catch (error) {
      console.error('Error getting content:', error)
      return []
    }
  }

  // Get content by ID
  async getContentById(id: string): Promise<SavedContent | null> {
    try {
      switch (this.storageBackend) {
        case 'chrome':
          const result = await chrome.storage.local.get(id)
          return result[id] || null
        
        case 'localStorage':
          const item = localStorage.getItem(id)
          return item ? JSON.parse(item) : null
        
        case 'api':
          // TODO: Implement API call
          console.log('API storage not implemented yet')
          return null
      }
    } catch (error) {
      console.error('Error getting content by ID:', error)
      return null
    }
  }

  // Delete content by ID
  async deleteContent(id: string): Promise<boolean> {
    try {
      switch (this.storageBackend) {
        case 'chrome':
          await chrome.storage.local.remove(id)
          break
        
        case 'localStorage':
          localStorage.removeItem(id)
          break
        
        case 'api':
          // TODO: Implement API call
          console.log('API storage not implemented yet')
          break
      }

      console.log('Content deleted successfully:', id)
      return true
    } catch (error) {
      console.error('Error deleting content:', error)
      return false
    }
  }

  // Search content by tags or text
  async searchContent(query: string): Promise<SavedContent[]> {
    const allContent = await this.getAllContent()
    const lowerQuery = query.toLowerCase()
    
    return allContent.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) ||
      item.notes?.toLowerCase().includes(lowerQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      item.url.toLowerCase().includes(lowerQuery)
    )
  }

  // Export all content as JSON
  async exportContent(): Promise<string> {
    const content = await this.getAllContent()
    return JSON.stringify(content, null, 2)
  }

  // Import content from JSON
  async importContent(jsonData: string): Promise<number> {
    try {
      const content = JSON.parse(jsonData)
      let importedCount = 0

      if (Array.isArray(content)) {
        for (const item of content) {
          if (item.id && item.type) {
            await this.saveContent(item)
            importedCount++
          }
        }
      }

      console.log(`Imported ${importedCount} items`)
      return importedCount
    } catch (error) {
      console.error('Error importing content:', error)
      throw error
    }
  }

  // Get storage statistics
  async getStorageStats(): Promise<{
    totalItems: number
    totalSize: number
    byType: Record<string, number>
  }> {
    const content = await this.getAllContent()
    const byType: Record<string, number> = {}
    
    content.forEach(item => {
      byType[item.type] = (byType[item.type] || 0) + 1
    })

    const totalSize = JSON.stringify(content).length

    return {
      totalItems: content.length,
      totalSize,
      byType
    }
  }

  // Change storage backend
  setStorageBackend(backend: 'chrome' | 'localStorage' | 'api') {
    this.storageBackend = backend
    console.log(`Storage backend changed to: ${backend}`)
  }

  // Get current storage backend
  getStorageBackend(): string {
    return this.storageBackend
  }
}

// Export singleton instance
export const storageManager = StorageManager.getInstance()
