#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Post-build: Copying missing files to dist/...');

// Files to copy from root to dist
const filesToCopy = [
  'manifest.json'
];

// Directories to copy from root to dist
const dirsToCopy = [
  'icons'
];

// Files to copy from src to dist
const srcFilesToCopy = [
  { from: 'src/popup/index.html', to: 'popup.html' },
  { from: 'src/pdf-viewer/pdf-viewer.html', to: 'pdf-viewer.html' }
];

// Directories to copy from src to dist
const srcDirsToCopy = [
  { from: 'src/pdf-viewer/lib', to: 'lib' }
];

const distDir = 'dist';

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('❌ dist/ directory not found. Run npm run build first.');
  process.exit(1);
}

// Copy files from root
filesToCopy.forEach(file => {
  const srcPath = file;
  const destPath = path.join(distDir, file);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied ${file}`);
  } else {
    console.warn(`⚠️  ${file} not found`);
  }
});

// Copy directories from root
dirsToCopy.forEach(dir => {
  const srcPath = dir;
  const destPath = path.join(distDir, dir);
  
  if (fs.existsSync(srcPath)) {
    if (fs.existsSync(destPath)) {
      fs.rmSync(destPath, { recursive: true });
    }
    fs.cpSync(srcPath, destPath, { recursive: true });
    console.log(`✅ Copied ${dir}/`);
  } else {
    console.warn(`⚠️  ${dir}/ not found`);
  }
});

// Copy files from src
srcFilesToCopy.forEach(({ from, to }) => {
  const srcPath = from;
  const destPath = path.join(distDir, to);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied ${from} → ${to}`);
  } else {
    console.warn(`⚠️  ${from} not found`);
  }
});

// Copy directories from src
srcDirsToCopy.forEach(({ from, to }) => {
  const srcPath = from;
  const destPath = path.join(distDir, to);
  
  if (fs.existsSync(srcPath)) {
    if (fs.existsSync(destPath)) {
      fs.rmSync(destPath, { recursive: true });
    }
    fs.cpSync(srcPath, destPath, { recursive: true });
    console.log(`✅ Copied ${from}/ → ${to}/`);
  } else {
    console.warn(`⚠️  ${from}/ not found`);
  }
});

// Fix popup.html script reference
const popupHtmlPath = path.join(distDir, 'popup.html');
if (fs.existsSync(popupHtmlPath)) {
  let content = fs.readFileSync(popupHtmlPath, 'utf8');
  
  // Fix script reference
  content = content.replace(
    /<script type="module" src="\.\/main\.ts"><\/script>/,
    '<link rel="stylesheet" href="./popup.css">\n  <script type="module" src="./popup.js"></script>'
  );
  
  fs.writeFileSync(popupHtmlPath, content);
  console.log('✅ Fixed popup.html script reference');
}

console.log('🎉 Post-build complete!');
