#!/usr/bin/env node

/**
 * Frontmatter Validator & Normalizer
 * 
 * Validates Jekyll post frontmatter against JSON Schema
 * and normalizes data for downstream consumers (Knowledge Graph, AI Agent, Syndication)
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Ajv2019 = require('ajv/dist/2019');
const addFormats = require('ajv-formats');

const SCHEMA_PATH = path.join(__dirname, '..', 'schema', 'post-metadata.schema.json');
const POSTS_DIR = path.join(__dirname, '..', 'content', 'blog');
const PEOPLE_DIR = path.join(__dirname, '..', 'content', 'people');

// Initialize AJV with draft-07 schema support
const ajv = new Ajv2019({ 
  allErrors: true, 
  strict: false,
  messages: true,
  coerceTypes: true
});
addFormats(ajv);

// Add draft-07 meta schema explicitly
ajv.addMetaSchema(require('ajv/dist/refs/json-schema-draft-07.json'));

// Load schema
let schema;
try {
  schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  console.log('✅ Schema loaded successfully');
} catch (error) {
  console.error('❌ Failed to load schema:', error.message);
  process.exit(1);
}

const validate = ajv.compile(schema);

// Helper: Extract frontmatter from Markdown
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error('Invalid frontmatter format. Must start and end with ---');
  }
  
  const frontmatterStr = match[1];
  const body = match[2];
  
  let frontmatter;
  try {
    frontmatter = yaml.load(frontmatterStr);
  } catch (error) {
    throw new Error(`YAML parsing error: ${error.message}`);
  }
  
  return { frontmatter, body };
}

// Helper: Validate author exists in _people/
function validateAuthor(authorId) {
  if (!authorId) return false;
  
  const peopleFiles = fs.readdirSync(PEOPLE_DIR).filter(f => f.endsWith('.md'));
  const authorFile = peopleFiles.find(f => 
    path.basename(f, '.md').toLowerCase() === authorId.toLowerCase()
  );
  
  if (!authorFile) {
    return false;
  }
  
  // Verify author has required fields
  const authorPath = path.join(PEOPLE_DIR, authorFile);
  const content = fs.readFileSync(authorPath, 'utf8');
  const { frontmatter } = extractFrontmatter(content);
  
  return frontmatter && frontmatter.name && frontmatter.role;
}

// Helper: Normalize categories and tags
function normalizeMetadata(frontmatter) {
  const normalized = { ...frontmatter };
  
  // Ensure categories are lowercase and trimmed
  if (normalized.categories) {
    normalized.categories = normalized.categories
      .map(c => c.toLowerCase().trim())
      .filter(c => c.length > 0);
  }
  
  // Ensure tags are lowercase, trimmed, and deduplicated
  if (normalized.tags) {
    normalized.tags = [...new Set(
      normalized.tags
        .map(t => t.toLowerCase().trim())
        .filter(t => t.length >= 2)
    )];
  }
  
  // Auto-generate excerpt if missing
  if (!normalized.excerpt && normalized.subtitle) {
    normalized.excerpt = normalized.subtitle;
  }
  
  // Set defaults
  normalized.toc = normalized.toc ?? true;
  normalized.comments = normalized.comments ?? true;
  normalized.published = normalized.published ?? true;
  normalized.draft = normalized.draft ?? false;
  normalized.featured = normalized.featured ?? false;
  
  // Ensure permalink format
  if (normalized.permalink && !normalized.permalink.endsWith('/')) {
    normalized.permalink += '/';
  }
  
  return normalized;
}

// Main validation function
function validatePost(filePath) {
  const fileName = path.basename(filePath);
  const relativePath = path.relative(process.cwd(), filePath);
  
  console.log(`\n📄 Validating: ${relativePath}`);
  
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`  ❌ Cannot read file: ${error.message}`);
    return { valid: false, errors: [error.message] };
  }
  
  let frontmatter;
  try {
    const extracted = extractFrontmatter(content);
    frontmatter = extracted.frontmatter;
  } catch (error) {
    console.error(`  ❌ ${error.message}`);
    return { valid: false, errors: [error.message] };
  }
  
  // Normalize before validation
  const normalized = normalizeMetadata(frontmatter);
  
  // Validate against schema
  const valid = validate(normalized);
  
  if (!valid) {
    console.error('  ❌ Validation failed:');
    validate.errors.forEach(err => {
      console.error(`     - ${err.instancePath || '/'}: ${err.message}`);
      if (err.params) {
        console.error(`       Details: ${JSON.stringify(err.params)}`);
      }
    });
    
    return { valid: false, errors: validate.errors, normalized };
  }
  
  // Validate author existence (skip if no author declared — legacy posts)
  if (normalized.author && !validateAuthor(normalized.author)) {
    const errorMsg = `Author "${normalized.author}" not found in content/people/`;
    console.error(`  ❌ ${errorMsg}`);
    return { 
      valid: false, 
      errors: [{ message: errorMsg }],
      normalized 
    };
  }
  
  // Validate coauthors if present
  if (normalized.coauthors) {
    const missingCoauthors = normalized.coauthors.filter(author => !validateAuthor(author));
    if (missingCoauthors.length > 0) {
      const errorMsg = `Coauthors not found in content/people/: ${missingCoauthors.join(', ')}`;
      console.error(`  ❌ ${errorMsg}`);
      return { 
        valid: false, 
        errors: [{ message: errorMsg }],
        normalized 
      };
    }
  }
  
  console.log('  ✅ Valid and normalized');
  
  // Write normalized version (optional - can be disabled)
  const normalizedFrontmatter = yaml.dump(normalized, { 
    lineWidth: -1, 
    noRefs: true,
    quotingType: '"',
    forceQuotes: false 
  });
  
  const newContent = `---\n${normalizedFrontmatter}---\n${extractFrontmatter(content).body}`;
  
  // Only write if changed
  if (newContent !== content) {
    console.log('  🔄 Normalized metadata updated');
    // Uncomment to auto-fix: fs.writeFileSync(filePath, newContent, 'utf8');
  }
  
  return { valid: true, normalized };
}

// Scan all posts
function validateAllPosts() {
  console.log('🔍 Scanning posts directory...\n');
  
  if (!fs.existsSync(POSTS_DIR)) {
    console.error('❌ Posts directory not found:', POSTS_DIR);
    process.exit(1);
  }
  
  const files = fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md') || f.endsWith('.markdown'))
    .map(f => path.join(POSTS_DIR, f));
  
  if (files.length === 0) {
    console.log('⚠️  No posts found');
    return;
  }
  
  console.log(`Found ${files.length} posts\n`);
  console.log('─'.repeat(60));
  
  const results = files.map(validatePost);
  
  const validCount = results.filter(r => r.valid).length;
  const invalidCount = results.filter(r => !r.valid).length;
  
  console.log('\n' + '═'.repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   Total: ${results.length}`);
  console.log(`   ✅ Valid: ${validCount}`);
  console.log(`   ❌ Invalid: ${invalidCount}`);
  console.log('═'.repeat(60));
  
  if (invalidCount > 0) {
    console.log('\n⚠️  Please fix the validation errors above before committing.');
    process.exit(1);
  } else {
    console.log('\n🎉 All posts are valid!');
  }
}

// CLI
const args = process.argv.slice(2);

if (args.length === 0) {
  // Validate all posts
  validateAllPosts();
} else if (args[0] === '--help' || args[0] === '-h') {
  console.log(`
Frontmatter Validator & Normalizer

Usage:
  node scripts/validate-frontmatter.js              # Validate all posts
  node scripts/validate-frontmatter.js <file.md>    # Validate specific post
  node scripts/validate-frontmatter.js --help       # Show this help

Options:
  --fix    Auto-fix normalization issues (uncomment in code)
  
Example:
  node scripts/validate-frontmatter.js _posts/2026-08-14-deep-refactoring.md
`);
} else {
  // Validate specific file(s)
  const files = args.filter(arg => !arg.startsWith('--'));
  let hasErrors = false;
  
  files.forEach(file => {
    const filePath = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      hasErrors = true;
      return;
    }
    
    const result = validatePost(filePath);
    if (!result.valid) {
      hasErrors = true;
    }
  });
  
  if (hasErrors) {
    process.exit(1);
  }
}
