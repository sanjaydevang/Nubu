import { createApp } from 'vue'
import PDFViewer from './PDFViewer.vue'

// Get PDF URL from URL parameters
const urlParams = new URLSearchParams(window.location.search)
const pdfUrl = urlParams.get('url')
const sourceUrl = urlParams.get('source') || document.referrer

if (!pdfUrl) {
  document.body.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: #1a1a1a;
      color: #e0e0e0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <h2>No PDF URL provided</h2>
      <p>Please provide a PDF URL in the query parameters.</p>
    </div>
  `
} else {
  // Create Vue app
  const app = createApp(PDFViewer, {
    pdfUrl,
    sourceUrl
  })
  
  app.mount('#app')
}

