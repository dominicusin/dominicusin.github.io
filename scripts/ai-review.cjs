#!/usr/bin/env node

/**
 * AI Agent Content Reviewer
 * 
 * Automated pre-merge validation for blog posts:
 * - Frontmatter validation (via JSON Schema)
 * - Link integrity check (internal/external)
 * - OpenGraph image generation trigger
 * - Content quality heuristics
 * - SEO best practices verification
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yaml = require('js-yaml');

const POSTS_DIR = path.join(__dirname, '..', '_posts');
const SITE_URL = 'https://dominicusin.github.io';

// Configuration
const CONFIG = {
  minWordCount: 300,
  maxTitleLength: 60,
  minExcerptLength: 50,
  maxExcerptLength: 160,
  requiredTagsMin: 3,
  checkExternalLinks: true,
  generateOpenGraph: true
};

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

// Helper: Extract frontmatter and body
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error('Invalid frontmatter format');
  }
  
  return {
    frontmatter: yaml.load(match[1]),
    body: match[2].trim()
  };
}

// Helper: Count words in markdown body
function countWords(markdown) {
  // Remove code blocks, comments, and frontmatter
  const cleaned = markdown
    .replace(/```[\s\S]*?```/g, '') // Code blocks
    .replace(/<!--[\s\S]*?-->/g, '') // Comments
    .replace(/^[>#*\-\d\.:\[\]()"'_~`]/gm, '') // Markdown syntax
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleaned.split(' ').filter(w => w.length > 0).length;
}

// Helper: Extract links from markdown
function extractLinks(markdown) {
  const links = {
    internal: [],
    external: [],
    images: []
  };
  
  // Match [text](url) and ![alt](url)
  const linkRegex = /(!?)\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = linkRegex.exec(markdown)) !== null) {
    const isImage = match[1] === '!';
    const url = match[3];
    
    if (isImage) {
      links.images.push({ url, alt: match[2] });
    } else if (url.startsWith('http://') || url.startsWith('https://')) {
      links.external.push({ url, text: match[2] });
    } else if (url.startsWith('#')) {
      // Anchor link - skip validation
    } else if (url.startsWith('/') || !url.includes('.')) {
      links.internal.push({ url, text: match[2] });
    }
  }
  
  return links;
}

// Helper: Validate internal links
function validateInternalLinks(links, allPosts) {
  const errors = [];
  const validPaths = [
    '/',
    '/assets/',
    '/css/',
    '/js/',
    '/images/',
    ...allPosts.map(p => p.permalink || `/${p.id}/`)
  ];
  
  links.internal.forEach(link => {
    const url = link.url.split('#')[0]; // Remove anchor
    
    // Check if it's a valid path
    const isValid = validPaths.some(validPath => 
      url === validPath || url.startsWith(validPath)
    );
    
    if (!isValid && !url.endsWith('.html') && !url.endsWith('/')) {
      errors.push({
        type: 'internal_link',
        url: link.url,
        message: `Potentially broken internal link: ${link.url}`,
        suggestion: `Ensure "${link.url}" exists or add trailing slash`
      });
    }
  });
  
  return errors;
}

// Helper: Check external links (basic)
async function validateExternalLinks(links) {
  const warnings = [];
  
  // Note: Full HTTP checks are expensive; we do basic format validation
  // In CI, this would be replaced with actual HTTP HEAD requests or a service like lychee
  
  links.external.forEach(link => {
    try {
      const urlObj = new URL(link.url);
      
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        warnings.push({
          type: 'external_link',
          url: link.url,
          message: `Non-HTTP protocol: ${urlObj.protocol}`
        });
      }
      
      if (!urlObj.hostname.includes('.')) {
        warnings.push({
          type: 'external_link',
          url: link.url,
          message: `Invalid hostname: ${urlObj.hostname}`
        });
      }
    } catch (e) {
      warnings.push({
        type: 'external_link',
        url: link.url,
        message: `Invalid URL format: ${e.message}`
      });
    }
  });
  
  return warnings;
}

// Helper: Generate OpenGraph metadata suggestions
function generateOpenGraphSuggestions(frontmatter, postId) {
  const suggestions = [];
  
  // Check for header image
  if (!frontmatter.header?.image) {
    suggestions.push({
      type: 'opengraph',
      severity: 'warning',
      message: 'No header image specified',
      suggestion: 'Add `header.image` for better social sharing. Will auto-generate fallback.'
    });
  }
  
  // Check excerpt length for social description
  const excerpt = frontmatter.excerpt || frontmatter.subtitle || '';
  if (excerpt.length < CONFIG.minExcerptLength) {
    suggestions.push({
      type: 'opengraph',
      severity: 'info',
      message: `Excerpt is short (${excerpt.length} chars)`,
      suggestion: `Aim for ${CONFIG.minExcerptLength}-${CONFIG.maxExcerptLength} characters for optimal social previews`
    });
  }
  
  return suggestions;
}

// Helper: SEO best practices check
function checkSEO(frontmatter, body) {
  const issues = [];
  
  // Title length
  if (frontmatter.title.length > CONFIG.maxTitleLength) {
    issues.push({
      type: 'seo',
      severity: 'warning',
      message: `Title too long (${frontmatter.title.length} chars)`,
      suggestion: `Keep titles under ${CONFIG.maxTitleLength} characters for better SERP display`
    });
  }
  
  // Excerpt presence
  if (!frontmatter.excerpt && !frontmatter.subtitle) {
    issues.push({
      type: 'seo',
      severity: 'info',
      message: 'No explicit excerpt or subtitle',
      suggestion: 'Add `excerpt` or `subtitle` for better meta descriptions'
    });
  }
  
  // H1 in body (should match title)
  const h1Match = body.match(/^#\s+(.+)$/m);
  if (!h1Match) {
    issues.push({
      type: 'seo',
      severity: 'info',
      message: 'No H1 heading found in content',
      suggestion: 'Add an H1 heading that matches or complements the title'
    });
  } else if (h1Match[1].toLowerCase() !== frontmatter.title.toLowerCase()) {
    issues.push({
      type: 'seo',
      severity: 'info',
      message: 'H1 heading differs from post title',
      suggestion: 'Consider aligning H1 with title for consistency'
    });
  }
  
  // Word count
  const wordCount = countWords(body);
  if (wordCount < CONFIG.minWordCount) {
    issues.push({
      type: 'seo',
      severity: 'warning',
      message: `Low word count (${wordCount} words)`,
      suggestion: `Aim for at least ${CONFIG.minWordCount} words for better SEO`
    });
  }
  
  return issues;
}

// Main review function
async function reviewPost(filePath) {
  const fileName = path.basename(filePath);
  const relativePath = path.relative(process.cwd(), filePath);
  
  log(colors.blue, `\n🤖 AI Agent Review: ${relativePath}`);
  log(colors.blue, '─'.repeat(60));
  
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    log(colors.red, `❌ Cannot read file: ${error.message}`);
    return { valid: false, errors: [error.message] };
  }
  
  let extracted;
  try {
    extracted = extractFrontmatter(content);
  } catch (error) {
    log(colors.red, `❌ ${error.message}`);
    return { valid: false, errors: [error.message] };
  }
  
  const { frontmatter, body } = extracted;
  const postId = fileName.replace(/\.(md|markdown)$/, '');
  
  const report = {
    postId,
    timestamp: new Date().toISOString(),
    errors: [],
    warnings: [],
    suggestions: [],
    metrics: {}
  };
  
  // 1. Content Quality Checks
  log(colors.cyan, '\n📝 Checking content quality...');
  const wordCount = countWords(body);
  report.metrics.wordCount = wordCount;
  log(colors.green, `   Word count: ${wordCount}`);
  
  if (wordCount < CONFIG.minWordCount) {
    report.warnings.push({
      type: 'content',
      message: `Word count (${wordCount}) below minimum (${CONFIG.minWordCount})`
    });
  }
  
  // 2. Link Validation
  log(colors.cyan, '\n🔗 Validating links...');
  const links = extractLinks(body);
  report.metrics.links = {
    internal: links.internal.length,
    external: links.external.length,
    images: links.images.length
  };
  log(colors.green, `   Found: ${links.internal.length} internal, ${links.external.length} external, ${links.images.length} images`);
  
  // Get all posts for internal link validation
  let allPosts = [];
  try {
    const files = fs.readdirSync(POSTS_DIR)
      .filter(f => f.endsWith('.md') || f.endsWith('.markdown'));
    allPosts = files.map(f => {
      const content = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8');
      const fm = extractFrontmatter(content).frontmatter;
      return {
        id: f.replace(/\.(md|markdown)$/, ''),
        permalink: fm?.permalink
      };
    });
  } catch (e) {
    log(colors.yellow, '   ⚠️  Could not scan all posts for link validation');
  }
  
  const internalErrors = validateInternalLinks(links, allPosts);
  report.errors.push(...internalErrors);
  
  if (CONFIG.checkExternalLinks && links.external.length > 0) {
    const externalWarnings = await validateExternalLinks(links);
    report.warnings.push(...externalWarnings);
  }
  
  if (internalErrors.length === 0 && links.external.length === 0) {
    log(colors.green, '   All links valid');
  } else if (internalErrors.length === 0) {
    log(colors.green, '   Internal links valid');
    log(colors.yellow, `   ⚠️  ${externalWarnings.length} external link warnings`);
  }
  
  // 3. OpenGraph & Social Sharing
  log(colors.cyan, '\n📱 Checking OpenGraph readiness...');
  const ogSuggestions = generateOpenGraphSuggestions(frontmatter, postId);
  report.suggestions.push(...ogSuggestions);
  
  if (ogSuggestions.length === 0) {
    log(colors.green, '   OpenGraph metadata looks good');
  } else {
    log(colors.yellow, `   ${ogSuggestions.length} suggestions for improvement`);
  }
  
  // 4. SEO Best Practices
  log(colors.cyan, '\n🔍 Checking SEO best practices...');
  const seoIssues = checkSEO(frontmatter, body);
  report.warnings.push(...seoIssues.filter(i => i.severity === 'warning'));
  report.suggestions.push(...seoIssues.filter(i => i.severity === 'info'));
  
  if (seoIssues.length === 0) {
    log(colors.green, '   SEO checks passed');
  } else {
    log(colors.yellow, `   ${seoIssues.length} SEO notes`);
  }
  
  // 5. Schema Validation (call external script)
  log(colors.cyan, '\n✅ Running schema validation...');
  try {
    execSync(`node ${path.join(__dirname, 'validate-frontmatter.js')} "${filePath}"`, {
      stdio: 'pipe',
      encoding: 'utf8'
    });
    log(colors.green, '   Schema validation passed');
  } catch (error) {
    log(colors.red, '   ❌ Schema validation failed');
    report.errors.push({
      type: 'schema',
      message: 'Frontmatter does not comply with JSON Schema',
      details: error.stdout
    });
  }
  
  // Summary
  log(colors.blue, '\n' + '═'.repeat(60));
  log(colors.blue, '📊 Review Summary:');
  log(colors.reset, `   Errors: ${report.errors.length}`);
  log(colors.reset, `   Warnings: ${report.warnings.length}`);
  log(colors.reset, `   Suggestions: ${report.suggestions.length}`);
  
  if (report.errors.length > 0) {
    log(colors.red, '\n❌ Review FAILED - Please fix errors before merging');
    report.valid = false;
  } else if (report.warnings.length > 0) {
    log(colors.yellow, '\n⚠️  Review PASSED with warnings');
    report.valid = true;
  } else {
    log(colors.green, '\n✅ Review PASSED - Ready to merge');
    report.valid = true;
  }
  
  // Write report to file
  const reportsDir = path.join(__dirname, '..', '.github', 'reviews');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  const reportFile = path.join(reportsDir, `${postId}-review.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  log(colors.cyan, `\n📄 Full report saved to: ${reportFile}`);
  
  return report;
}

// CLI
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
AI Agent Content Reviewer

Usage:
  node scripts/ai-review.js <file.md>              # Review specific post
  node scripts/ai-review.js --all                  # Review all published posts
  node scripts/ai-review.js --recent               # Review 5 most recent posts
  node scripts/ai-review.js --help                 # Show this help

This script performs automated pre-merge validation:
  ✓ Frontmatter schema validation
  ✓ Internal link integrity
  ✓ External link format check
  ✓ OpenGraph metadata suggestions
  ✓ SEO best practices
  ✓ Content quality heuristics

Exit codes:
  0 - Review passed (no errors)
  1 - Review failed (errors found)
`);
  process.exit(args.length === 0 ? 0 : 1);
}

async function main() {
  let filesToReview = [];
  
  if (args.includes('--all')) {
    const files = fs.readdirSync(POSTS_DIR)
      .filter(f => f.endsWith('.md') || f.endsWith('.markdown'));
    filesToReview = files.map(f => path.join(POSTS_DIR, f));
  } else if (args.includes('--recent')) {
    const files = fs.readdirSync(POSTS_DIR)
      .filter(f => f.endsWith('.md') || f.endsWith('.markdown'))
      .sort()
      .reverse()
      .slice(0, 5);
    filesToReview = files.map(f => path.join(POSTS_DIR, f));
  } else {
    // Specific file(s)
    filesToReview = args
      .filter(arg => !arg.startsWith('--'))
      .map(file => path.isAbsolute(file) ? file : path.join(process.cwd(), file));
  }
  
  let hasErrors = false;
  
  for (const file of filesToReview) {
    if (!fs.existsSync(file)) {
      log(colors.red, `❌ File not found: ${file}`);
      hasErrors = true;
      continue;
    }
    
    const result = await reviewPost(file);
    if (!result.valid) {
      hasErrors = true;
    }
  }
  
  process.exit(hasErrors ? 1 : 0);
}

main().catch(error => {
  log(colors.red, `❌ Unexpected error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
