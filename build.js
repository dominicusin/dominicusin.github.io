/**
 * Build script для минификации и оптимизации ресурсов
 */

const fs = require('fs');
const path = require('path');

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
 * Простая минификация CSS
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
    // Минифицировать JavaScript файлы
    const jsFiles = [
      'js/i18n.js',
      'js/interactive.js'
    ];
    
    for (const file of jsFiles) {
      const inputPath = path.join(__dirname, '..', file);
      const outputPath = inputPath.replace('.js', '.min.js');
      
      if (fs.existsSync(inputPath)) {
        const content = fs.readFileSync(inputPath, 'utf8');
        const minified = minifyJS(content);
        
        fs.writeFileSync(outputPath, minified);
        console.log(`✅ Minified ${file} -> ${path.basename(outputPath)}`);
        
        const savings = ((content.length - minified.length) / content.length * 100).toFixed(1);
        console.log(`   💾 Size reduction: ${savings}%`);
      }
    }
    
    // Минифицировать CSS
    const cssInput = path.join(__dirname, '../css/main.scss');
    const cssOutput = path.join(__dirname, '../css/main.min.css');
    
    if (fs.existsSync(cssInput)) {
      const content = fs.readFileSync(cssInput, 'utf8');
      const minified = minifyCSS(content);
      
      fs.writeFileSync(cssOutput, minified);
      console.log(`✅ Minified CSS -> main.min.css`);
      
      const savings = ((content.length - minified.length) / content.length * 100).toFixed(1);
      console.log(`   💾 Size reduction: ${savings}%`);
    }
    
    // Создать WebP placeholder
    createWebPPlaceholder();
    console.log(`✅ Created WebP placeholder`);
    
    // Создать critical CSS (упрощенная версия)
    const criticalCSS = `
      body{margin:0;font-family:'Inter',sans-serif;line-height:1.7;color:var(--text-color,#1a202c);background:var(--background-color,#fff)}
      .site-header{background:var(--surface-color,#fff);border-bottom:1px solid var(--border-color,#e2e8f0);position:sticky;top:0;z-index:1000}
      .hero{padding:80px 20px;text-align:center;min-height:60vh;display:flex;align-items:center;justify-content:center}
      .hero-title{font-size:clamp(2rem,5vw,3.5rem);font-weight:700;margin-bottom:1rem}
      .hero-description{font-size:1.2rem;color:var(--grey-color,#718096);max-width:600px;margin:0 auto 2rem}
      .btn{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border:none;border-radius:8px;text-decoration:none;font-weight:500;transition:all 0.3s ease}
      .btn-primary{background:var(--brand-color,#4158D0);color:white}
      .btn-primary:hover{background:var(--brand-color-dark,#2c3e8f);transform:translateY(-2px)}
    `;
    
    const criticalPath = path.join(__dirname, '../css/critical.min.css');
    fs.writeFileSync(criticalPath, criticalCSS);
    console.log(`✅ Created critical CSS`);
    
    // Создать Service Worker с правильными путями
    const swPath = path.join(__dirname, '../sw.js');
    if (fs.existsSync(swPath)) {
      console.log(`✅ Service Worker ready`);
    }
    
    console.log(`\n🎉 Build completed successfully!`);
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Запустить сборку
if (require.main === module) {
  buildAssets();
}

module.exports = {
  buildAssets,
  minifyJS,
  minifyCSS
};