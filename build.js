/**
 * Advanced Build Script for Engineering Blog
 * Optimization, minification, and production-ready assets
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Generate hash for cache busting
 */
function generateHash(content) {
  return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
}

/**
 * Простая минификация JavaScript
 */
function minifyJS(content) {
  return content
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
    // Remove whitespace except line breaks
    .replace(/\s+/g, ' ')
    // Remove spaces around operators
    .replace(/\s*([=+\-*/<>!&|,;:{}()[\]])\s*/g, '$1')
    // Remove trailing semicolons
    .replace(/;+/g, ';')
    // Remove unnecessary line breaks
    .replace(/\n+/g, '\n')
    .trim();
}

/**
 * Advanced minification for CSS
 */
function minifyCSS(content) {
  return content
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove whitespace
    .replace(/\s+/g, ' ')
    // Remove spaces around braces and semicolons
    .replace(/\s*([{}:;,])\s*/g, '$1')
    // Remove unnecessary semicolons
    .replace(/;}/g, '}')
    .trim();
}

/**
 * Оптимизация путей в CSS
 */
function optimizeCSSPaths(content, basePath) {
  return content.replace(/url\(['"]?([^'")]+)['"]?\)/g, (match, url) => {
    // Skip external URLs and data URLs
    if (url.startsWith('http') || url.startsWith('data:')) {
      return match;
    }
    
    // Ensure relative paths are correct
    return `url('${url}')`;
  });
}

/**
 * Создание WebP версии изображений (простая реализация)
 */
function createWebPPlaceholder() {
  const imagesDir = path.join(__dirname, 'assets/images');
  const webpPath = path.join(imagesDir, 'webp-placeholder.webp');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  
  if (!fs.existsSync(webpPath)) {
    // Создать простой placeholder (SVG as placeholder)
    const svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.3em" 
              font-family="Arial, sans-serif" font-size="16" fill="#666">
          WebP Image
        </text>
      </svg>
    `;
    
    // Write SVG instead of WebP for simplicity
    const svgPath = path.join(imagesDir, 'webp-placeholder.svg');
    fs.writeFileSync(svgPath, svg);
    console.log('📝 Created SVG placeholder for WebP images');
  }
}

/**
 * Optimize images (basic implementation)
 */
function optimizeImages() {
  console.log('🖼️ Optimizing images...');
  
  // Create WebP placeholder
  createWebPPlaceholder();
  
  // In a real implementation, you would:
  // - Convert images to WebP
  // - Generate responsive sizes
  // - Create blur placeholders
  // - Optimize compression
  
  console.log('✅ Image optimization completed');
}

/**
 * Build assets for development
 */
function buildDevAssets() {
  console.log('🛠️ Building development assets...');
  
  // Copy files without minification for development
  const jsAssets = [
    'js/main.js',
    'js/theme-manager.js',
    'js/i18n.js', 
    'js/interactive.js',
    'js/search.js',
    'js/images.js',
    'js/social-sharing.js',
    'js/comments.js'
  ];
  
  jsAssets.forEach(asset => {
    const inputPath = path.join(__dirname, asset);
    if (fs.existsSync(inputPath)) {
      console.log(`📝 ${asset} ready for development`);
    }
  });
  
  console.log('✅ Development assets ready');
}

/**
 * Build assets with optimization
 */
function buildAssets() {
  console.log('🚀 Starting optimized build process...');
  
  // Create output directories
  const outputDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Minify and bundle JavaScript
  const jsAssets = [
    { input: 'js/main.js', output: 'dist/js/main.min.js', critical: true },
    { input: 'js/theme-manager.js', output: 'dist/js/theme-manager.min.js' },
    { input: 'js/i18n.js', output: 'dist/js/i18n.min.js' },
    { input: 'js/interactive.js', output: 'dist/js/interactive.min.js' },
    { input: 'js/search.js', output: 'dist/js/search.min.js' },
    { input: 'js/images.js', output: 'dist/js/images.min.js' },
    { input: 'js/social-sharing.js', output: 'dist/js/social-sharing.min.js' },
    { input: 'js/comments.js', output: 'dist/js/comments.min.js' }
  ];
  
  jsAssets.forEach(asset => {
    const inputPath = path.join(__dirname, asset.input);
    
    if (fs.existsSync(inputPath)) {
      const content = fs.readFileSync(inputPath, 'utf8');
      const minified = minifyJS(content);
      
      // Create output directory if needed
      const assetDir = path.dirname(path.join(__dirname, asset.output));
      if (!fs.existsSync(assetDir)) {
        fs.mkdirSync(assetDir, { recursive: true });
      }
      
      // Add cache busting hash if critical
      const hash = asset.critical ? generateHash(minified) : '';
      const finalOutput = hash ? asset.output.replace('.min.js', `.min.${hash}.js`) : asset.output;
      
      fs.writeFileSync(path.join(__dirname, finalOutput), minified);
      
      const savings = ((content.length - minified.length) / content.length * 100).toFixed(1);
      console.log(`✅ ${asset.input} -> ${path.basename(finalOutput)} (${savings}% smaller)`);
      
      if (asset.critical) {
        // Create non-hashed version for consistency
        fs.writeFileSync(path.join(__dirname, asset.output), minified);
      }
    } else {
      console.warn(`⚠️ ${asset.input} not found, skipping`);
    }
  });
  
  // Optimize CSS
  const cssAssets = [
    { input: 'css/main.scss', output: 'dist/css/main.min.css' },
    { input: 'css/critical.css', output: 'dist/css/critical.min.css' },
    { input: 'css/comments.css', output: 'dist/css/comments.min.css' },
    { input: 'css/social-sharing.css', output: 'dist/css/social-sharing.min.css' },
    { input: 'css/theme-manager.css', output: 'dist/css/theme-manager.min.css' }
  ];
  
  cssAssets.forEach(asset => {
    const inputPath = path.join(__dirname, asset.input);
    
    if (fs.existsSync(inputPath)) {
      const content = fs.readFileSync(inputPath, 'utf8');
      const minified = minifyCSS(content);
      
      // Create output directory if needed
      const assetDir = path.dirname(path.join(__dirname, asset.output));
      if (!fs.existsSync(assetDir)) {
        fs.mkdirSync(assetDir, { recursive: true });
      }
      
      const hash = generateHash(minified);
      const finalOutput = asset.output.replace('.min.css', `.min.${hash}.css`);
      
      fs.writeFileSync(path.join(__dirname, finalOutput), minified);
      
      const savings = ((content.length - minified.length) / content.length * 100).toFixed(1);
      console.log(`✅ ${asset.input} -> ${path.basename(finalOutput)} (${savings}% smaller)`);
      
      // Create non-hashed version for consistency
      fs.writeFileSync(path.join(__dirname, asset.output), minified);
    } else {
      console.warn(`⚠️ ${asset.input} not found, skipping`);
    }
  });
  
  // Optimize images (basic implementation)
  optimizeImages();
  
  // Generate build stats
  generateBuildStats();
  
  console.log(`\n🎉 Production build completed successfully!`);
}

/**
 * Generate build statistics
 */
function generateBuildStats() {
  const stats = {
    buildTime: new Date().toISOString(),
    totalSize: 0,
    files: []
  };
  
  const distDir = path.join(__dirname, 'dist');
  if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir, { recursive: true });
    
    files.forEach(file => {
      const filePath = path.join(distDir, file);
      if (fs.statSync(filePath).isFile()) {
        const fileStats = fs.statSync(filePath);
        stats.totalSize += fileStats.size;
        stats.files.push({
          name: file,
          size: fileStats.size,
          sizeHuman: formatBytes(fileStats.size)
        });
      }
    });
  }
  
  // Save stats
  const statsPath = path.join(__dirname, 'build-stats.json');
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
  
  console.log('\n📊 Build Statistics:');
  console.log(`   Total size: ${formatBytes(stats.totalSize)}`);
  console.log(`   Files: ${stats.files.length}`);
  
  stats.files.forEach(file => {
    console.log(`   ${file.name}: ${file.sizeHuman}`);
  });
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Clean old build artifacts
 */
function cleanBuildArtifacts() {
  const artifacts = [
    'dist',
    'css/*.min.*.css',
    'js/*.min.*.js',
    'build-stats.json'
  ];
  
  console.log('🧹 Cleaning old build artifacts...');
  
  // Clean dist directory
  const distDir = path.join(__dirname, 'dist');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
    console.log('🗑️ Removed dist directory');
  }
  
  // Clean build stats
  const statsPath = path.join(__dirname, 'build-stats.json');
  if (fs.existsSync(statsPath)) {
    fs.unlinkSync(statsPath);
    console.log('🗑️ Removed build stats');
  }
}

/**
 * Validate build output
 */
function validateBuild() {
  const requiredFiles = [
    'dist/js/main.min.js',
    'dist/css/main.min.css',
    'dist/css/critical.min.css'
  ];
  
  console.log('✅ Validating build output...');
  
  const missingFiles = [];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  });
  
  if (missingFiles.length > 0) {
    throw new Error(`Required build artifacts missing: ${missingFiles.join(', ')}`);
  }
  
  console.log('✅ Build validation passed');
}

// Main build function
async function main() {
  console.log('🔧 Engineering Blog Build Tool');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  try {
    // Clean old build artifacts
    cleanBuildArtifacts();
    
    // Build for environment
    if (process.env.NODE_ENV === 'production') {
      buildAssets();
      validateBuild();
    } else {
      buildDevAssets();
    }
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run build
if (require.main === module) {
  main();
}

module.exports = {
  buildAssets,
  minifyJS,
  minifyCSS,
  generateHash
};