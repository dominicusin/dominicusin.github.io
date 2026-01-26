/**
 * Advanced Build Script for Engineering Blog
 * Optimization, minification, and production-ready assets
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
    . Remove unnecessary line breaks
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
  const webpPath = path.join(__dirname, '../assets/images/webp-placeholder.webp');
  
  if (!fs.existsSync(webpPath)) {
    // Создать простой placeholder
    const svg = Buffer.from(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.3em" 
              font-family="Arial, sans-serif" font-size="16" fill="#666">
          WebP Image
        </text>
      </svg>
    `);
    
    fs.writeFileSync(webpPath, svg);
  }
}

/**
 * Обработка всех файлов
 */
async function buildAssets() {
  console.log('🚀 Starting build process...');
  
  try {
/**
 * Build assets with optimization
 */
function buildAssets() {
  console.log('🚀 Starting optimized build process...');
  
  // Create output directories
  const outputDir = path.join(__dirname, '../dist');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Minify and bundle JavaScript
  const jsAssets = [
    { input: 'js/main.js', output: 'js/main.min.js', critical: true },
    { input: 'js/i18n.js', output: 'js/i18n.min.js' },
    { input: 'js/interactive.js', output: 'js/interactive.min.js' },
    { input: 'js/search.js', output: 'js/search.min.js' },
    { input: 'js/images.js', output: 'js/images.min.js' }
  ];
  
  jsAssets.forEach(asset => {
    const inputPath = path.join(__dirname, '..', asset.input);
    const outputPath = path.join(__dirname, '..', asset.output);
    
    if (fs.existsSync(inputPath)) {
      const content = fs.readFileSync(inputPath, 'utf8');
      const minified = minifyJS(content);
      
      // Add cache busting hash if critical
      const hash = asset.critical ? generateHash(minified) : '';
      const finalOutput = hash ? outputPath.replace('.min.js', `.min.${hash}.js`) : outputPath;
      
      fs.writeFileSync(finalOutput, minified);
      
      const savings = ((content.length - minified.length) / content.length * 100).toFixed(1);
      console.log(`✅ ${asset.input} -> ${path.basename(finalOutput)} (${savings}% smaller)`);
      
      if (asset.critical) {
        // Create non-hashed version for consistency
        fs.writeFileSync(outputPath, minified);
      }
    }
  });
  
  // Optimize CSS
  const cssAssets = [
    { input: 'css/main.scss', output: 'css/main.min.css' },
    { input: 'css/critical.css', output: 'css/critical.min.css' }
  ];
  
  cssAssets.forEach(asset => {
    const inputPath = path.join(__dirname, '..', asset.input);
    const outputPath = path.join(__dirname, '..', asset.output);
    
    if (fs.existsSync(inputPath)) {
      const content = fs.readFileSync(inputPath, 'utf8');
      const minified = minifyCSS(content);
      
      const hash = generateHash(minified);
      const finalOutput = outputPath.replace('.min.css', `.min.${hash}.css`);
      
      fs.writeFileSync(finalOutput, minified);
      
      const savings = ((content.length - minified.length) / content.length * 100).toFixed(1);
      console.log(`✅ ${asset.input} -> ${path.basename(finalOutput)} (${savings}% smaller)`);
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
  
  const distDir = path.join(__dirname, '../dist');
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
  const statsPath = path.join(__dirname, '../build-stats.json');
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
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
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
      await buildAssets();
      validateBuild();
    } else {
      await buildDevAssets();
    }
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

/**
 * Clean old build artifacts
 */
function cleanBuildArtifacts() {
  const artifacts = [
    '../dist',
    '../css/*.min.*.css',
    '../js/*.min.*.js',
    '../build-stats.json'
  ];
  
  // Would use glob in real implementation
  console.log('🧹 Cleaning old build artifacts...');
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
  
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Required build artifact missing: ${file}`);
    }
  });
  
  console.log('✅ Build validation passed');
}

// Run build
if (require.main === module) {
  main();
}

module.exports = {
  buildAssets,
  minifyJS,
  minifyCSS
};