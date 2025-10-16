// Test script to view saved content in Chrome storage
// Run this in the Chrome DevTools console when inspecting the extension popup

console.log('🧠 NabuAI Storage Test Script')
console.log('==============================')

// Function to view all saved content
async function viewAllSavedContent() {
  try {
    const result = await chrome.storage.local.get(null)
    const savedItems = Object.values(result).filter(item => 
      item && typeof item === 'object' && 'id' in item
    )
    
    console.log(`📊 Total saved items: ${savedItems.length}`)
    
    if (savedItems.length === 0) {
      console.log('📝 No content saved yet. Try saving some text or pages!')
      return
    }
    
    // Group by type
    const byType = {}
    savedItems.forEach(item => {
      byType[item.type] = (byType[item.type] || 0) + 1
    })
    
    console.log('📈 Content by type:', byType)
    
    // Show each item
    savedItems.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.type.toUpperCase()}: ${item.title}`)
      console.log(`   URL: ${item.url}`)
      console.log(`   Tags: ${item.tags.join(', ')}`)
      console.log(`   Saved: ${new Date(item.timestamp).toLocaleString()}`)
      if (item.notes) console.log(`   Notes: ${item.notes}`)
      if (item.content && item.content.length > 100) {
        console.log(`   Content: ${item.content.substring(0, 100)}...`)
      } else if (item.content) {
        console.log(`   Content: ${item.content}`)
      }
    })
    
  } catch (error) {
    console.error('❌ Error viewing saved content:', error)
  }
}

// Function to clear all saved content
async function clearAllSavedContent() {
  try {
    const result = await chrome.storage.local.get(null)
    const savedKeys = Object.keys(result).filter(key => key.startsWith('saved_'))
    
    if (savedKeys.length === 0) {
      console.log('📝 No saved content to clear')
      return
    }
    
    if (confirm(`Are you sure you want to delete ${savedKeys.length} saved items?`)) {
      await chrome.storage.local.remove(savedKeys)
      console.log(`🗑️ Cleared ${savedKeys.length} saved items`)
    }
  } catch (error) {
    console.error('❌ Error clearing saved content:', error)
  }
}

// Function to export saved content as JSON
async function exportSavedContent() {
  try {
    const result = await chrome.storage.local.get(null)
    const savedItems = Object.values(result).filter(item => 
      item && typeof item === 'object' && 'id' in item
    )
    
    if (savedItems.length === 0) {
      console.log('📝 No content to export')
      return
    }
    
    const jsonData = JSON.stringify(savedItems, null, 2)
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nabu-ai-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    console.log(`📤 Exported ${savedItems.length} items`)
  } catch (error) {
    console.error('❌ Error exporting content:', error)
  }
}

// Function to search saved content
async function searchSavedContent(query) {
  try {
    const result = await chrome.storage.local.get(null)
    const savedItems = Object.values(result).filter(item => 
      item && typeof item === 'object' && 'id' in item
    )
    
    const lowerQuery = query.toLowerCase()
    const matches = savedItems.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) ||
      item.notes?.toLowerCase().includes(lowerQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      item.url.toLowerCase().includes(lowerQuery)
    )
    
    console.log(`🔍 Search results for "${query}": ${matches.length} items`)
    
    matches.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.type.toUpperCase()}: ${item.title}`)
      console.log(`   URL: ${item.url}`)
      console.log(`   Tags: ${item.tags.join(', ')}`)
    })
    
  } catch (error) {
    console.error('❌ Error searching content:', error)
  }
}

// Add functions to global scope for easy access
window.nabuTest = {
  viewAll: viewAllSavedContent,
  clearAll: clearAllSavedContent,
  export: exportSavedContent,
  search: searchSavedContent
}

console.log('🚀 Available test functions:')
console.log('  nabuTest.viewAll() - View all saved content')
console.log('  nabuTest.clearAll() - Clear all saved content')
console.log('  nabuTest.export() - Export content as JSON')
console.log('  nabuTest.search("query") - Search saved content')
console.log('\n💡 Try: nabuTest.viewAll()')
