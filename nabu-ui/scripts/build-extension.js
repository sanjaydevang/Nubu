import { copyFile, mkdir, readdir, stat } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true })
  const entries = await readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = join(src, entry.name)
    const destPath = join(dest, entry.name)

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath)
    } else {
      await copyFile(srcPath, destPath)
    }
  }
}

async function buildExtension() {
  try {
    console.log('Building NabuAI Chrome Extension...')
    
    // Create dist directory if it doesn't exist
    await mkdir('dist', { recursive: true })
    
    // Copy manifest.json to dist
    await copyFile('manifest.json', 'dist/manifest.json')
    console.log('✓ Copied manifest.json')
    
    // Copy popup HTML to the correct location
    try {
      await copyFile('dist/src/popup/index.html', 'dist/popup.html')
      console.log('✓ Copied popup.html')
    } catch (error) {
      console.log('⚠ Could not copy popup.html:', error.message)
    }
    
        // Copy PDF viewer files
        try {
          await copyFile('dist/src/pdf-viewer/pdf-viewer.html', 'dist/pdf-viewer.html')
          await copyFile('dist/pdf-viewer.js', 'dist/pdf-viewer.js')
          console.log('✓ Copied PDF viewer files')
        } catch (error) {
          console.log('⚠ Could not copy PDF viewer files:', error.message)
        }
        
        // Copy Vue PDF viewer files
        try {
          await copyFile('dist/pdf-viewer-vue.js', 'dist/pdf-viewer-vue.js')
          console.log('✓ Copied Vue PDF viewer files')
        } catch (error) {
          console.log('⚠ Could not copy Vue PDF viewer files:', error.message)
        }
        
        // Copy PDF.js library files
        try {
          await copyDir('src/pdf-viewer/lib', 'dist/lib')
          console.log('✓ Copied PDF.js library files')
        } catch (error) {
          console.log('⚠ Could not copy PDF.js library files:', error.message)
        }
    
    // Copy icons directory if it exists
    try {
      await copyDir('icons', 'dist/icons')
      console.log('✓ Copied icons directory')
    } catch (error) {
      console.log('⚠ Icons directory not found, skipping...')
    }
    
    console.log('\n🎉 Extension built successfully!')
    console.log('Files are ready in the dist/ directory')
    console.log('\n📱 To load in Chrome:')
    console.log('1. Go to chrome://extensions/')
    console.log('2. Enable "Developer mode" (toggle in top right)')
    console.log('3. Click "Load unpacked"')
    console.log('4. Select the dist/ folder')
    console.log('\n🧪 To test:')
    console.log('1. Open demo.html in Chrome')
    console.log('2. Try selecting text and right-clicking')
    console.log('3. Click the extension icon in the toolbar')
    
  } catch (error) {
    console.error('❌ Error building extension:', error)
    process.exit(1)
  }
}

buildExtension()
