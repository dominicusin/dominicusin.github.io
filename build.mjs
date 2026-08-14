import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import marked from 'marked';
import nunjucks from 'nunjucks';
import sass from 'sass';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================
// CONFIG
// ============================================

const config = {
  title: "Domini's Blog",
  description: 'Экспертный блог о промышленной и системной инженерии, науке о данных и искусственном интеллекте. Практические руководства, глубокая аналитика и профессиональные инструменты.',
  url: 'https://dominicusin.github.io',
  baseurl: '',
  lang: 'ru_RU',
  author: {
    name: 'Domini',
    email: 'transgregorial@gmail.com',
    bio: 'Эксперт в области промышленной инженерии, системной инженерии и науки о данных',
    location: 'Chișinău, Moldova',
    orcid: '0000-0002-7425-0526',
    github: 'dominicusin',
    twitter: 'dominicusin',
  },
  navigation: [
    { name: 'Главная', url: '/' },
    { name: 'Статьи', url: '/archive/' },
    { name: 'Категории', url: '/categories/' },
    { name: 'Теги', url: '/tags/' },
    { name: 'О блоге', url: '/about/' },
  ],
  words_per_minute: 200,
  reading_time: true,
  date_format: '%d.%m.%Y',
};

// ============================================
// HELPERS
// ============================================

const slugify = (s) =>
  String(s).toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

const monthsRu = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

function formatDate(date, fmt) {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  if (fmt === '%d.%m.%Y') return `${dd}.${mm}.${yyyy}`;
  if (fmt === '%Y') return String(yyyy);
  if (fmt === '%B %Y') return `${monthsRu[d.getMonth()]} ${yyyy}`;
  if (fmt === '%B') return monthsRu[d.getMonth()];
  if (fmt === '%d') return dd;
  if (fmt === '%m/%d') return `${mm}/${dd}`;
  return `${dd}.${mm}.${yyyy}`;
}

function dateToXmlSchema(date) {
  return new Date(date).toISOString();
}

function truncateWords(str, n) {
  const words = String(str).trim().split(/\s+/);
  if (words.length <= n) return words.join(' ');
  return words.slice(0, n).join(' ') + '…';
}

function stripHtml(str) {
  return String(str).replace(/<[^>]*>/g, '');
}

function numberofwords(str) {
  return String(str).trim().split(/\s+/).length;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================
// NUNJUCKS SETUP
// ============================================

const nj = nunjucks.configure(path.join(__dirname, '_layouts'), {
  autoescape: false,
  noCache: true,
});

// Add includes path
nunjucks.configure([
  path.join(__dirname, '_layouts'),
  path.join(__dirname, '_includes'),
], { autoescape: false, noCache: true });

nj.addFilter('slugify', slugify);
nj.addFilter('date', (date, fmt) => formatDate(date, fmt));
nj.addFilter('date_to_xmlschema', dateToXmlSchema);
nj.addFilter('truncatewords', (str, n) => truncateWords(str, n));
nj.addFilter('strip_html', stripHtml);
nj.addFilter('strip_newlines', (str) => String(str).replace(/\n/g, ''));
nj.addFilter('truncate', (str, n) => String(str).slice(0, n));
nj.addFilter('escape', escapeHtml);
nj.addFilter('jsonify', (val) => JSON.stringify(val));
nj.addFilter('number_of_words', numberofwords);
nj.addFilter('divided_by', (a, b) => Math.floor(a / b));
nj.addFilter('minus', (a, b) => a - b);
nj.addFilter('prepend', (str, prefix) => (prefix || '') + (str || ''));
nj.addFilter('append', (str, suffix) => (str || '') + (suffix || ''));
nj.addFilter('replace', (str, from, to) => String(str).split(from).join(to));
nj.addFilter('relative_url', (url) => (config.baseurl || '') + (url || ''));
nj.addFilter('absolute_url', (url) => config.url + (config.baseurl || '') + (url || ''));
nj.addFilter('default', (val, dflt) => (val === undefined || val === null || val === '') ? dflt : val);
nj.addFilter('first', (arr) => Array.isArray(arr) ? arr[0] : arr);
nj.addFilter('size', (val) => Array.isArray(val) ? val.length : (typeof val === 'object' ? Object.keys(val).length : 0));
nj.addFilter('join', (arr, sep) => Array.isArray(arr) ? arr.join(sep) : '');

// group_by_exp filter: group items by a computed key
nj.addFilter('group_by_exp', (items, expr) => {
  // expr is like "post", "post.date | date: '%Y'"
  // We need to evaluate the expression for each item
  const match = expr.match(/^(\w+),\s*(.+)$/);
  if (!match) return [];
  const varName = match[1];
  const body = match[2];

  // Parse the body to extract filter calls
  // e.g. "post.date | date: '%Y'"
  const parts = body.split('|').map(s => s.trim());
  const baseExpr = parts[0];
  const filters = parts.slice(1);

  const groups = {};
  for (const item of items) {
    const ctx = {};
    ctx[varName] = item;
    // Evaluate base expression (e.g. "post.date")
    let val = baseExpr.split('.').reduce((obj, key) => obj ? obj[key] : undefined, ctx);
    // Apply filters
    for (const f of filters) {
      const fm = f.match(/^(\w+)(?::\s*'([^']*)')?/);
      if (fm) {
        const fname = fm[1];
        const farg = fm[2];
        if (fname === 'date' && farg) {
          val = formatDate(val, farg);
        }
      }
    }
    if (!groups[val]) groups[val] = { name: val, items: [] };
    groups[val].items.push(item);
  }
  return Object.values(groups);
});

// ============================================
// READ POSTS
// ============================================

function readPosts() {
  const postsDir = path.join(__dirname, '_posts');
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.markdown') || f.endsWith('.md'));

  const posts = files.map(file => {
    const raw = fs.readFileSync(path.join(postsDir, file), 'utf-8');
    const parsed = matter(raw);
    const content = parsed.content;

    // Extract date from filename: YYYY-MM-DD-title.markdown
    const dateMatch = file.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.(?:markdown|md)$/);
    let date;
    let slug;
    if (dateMatch) {
      const [, y, m, d, titleSlug] = dateMatch;
      slug = titleSlug;
      if (parsed.data.date) {
        date = new Date(parsed.data.date);
      } else {
        date = new Date(`${y}-${m}-${d}T00:00:00`);
      }
    } else {
      date = parsed.data.date ? new Date(parsed.data.date) : new Date();
      slug = file.replace(/\.(?:markdown|md)$/, '');
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const url = `/${year}/${month}/${slug}/`;

    // Build excerpt: first paragraph or up to <!--more-->
    let excerpt = '';
    const moreIdx = content.indexOf('<!--more-->');
    if (moreIdx >= 0) {
      excerpt = content.slice(0, moreIdx).trim();
    } else {
      excerpt = content.split('\n\n')[0].trim();
    }
    excerpt = marked.parse(excerpt);

    const htmlContent = marked.parse(content);
    const wordCount = numberofwords(stripHtml(htmlContent));
    const readingTime = Math.max(1, Math.ceil(wordCount / config.words_per_minute));

    return {
      title: parsed.data.title || slug,
      date,
      url,
      content: htmlContent,
      rawContent: content,
      excerpt,
      categories: parsed.data.categories || [],
      tags: parsed.data.tags || [],
      author: parsed.data.author || 'Domini',
      layout: parsed.data.layout || 'post',
      image: parsed.data.image || null,
      readingTime,
      wordCount,
      slug,
      // For navigation
      previous: null,
      next: null,
    };
  });

  // Sort by date descending
  posts.sort((a, b) => b.date - a.date);

  // Set previous/next (Jekyll: previous = older, next = newer)
  for (let i = 0; i < posts.length; i++) {
    posts[i].previous = i < posts.length - 1 ? posts[i + 1] : null;
    posts[i].next = i > 0 ? posts[i - 1] : null;
  }

  return posts;
}

// ============================================
// READ PAGES
// ============================================

function readPages() {
  const pages = [];
  const rootPages = [
    { file: 'index.html', permalink: '/', isHtml: true },
    { file: 'archive.html', permalink: '/archive/', isHtml: true },
    { file: 'categories.html', permalink: '/categories/', isHtml: true },
    { file: 'tags.html', permalink: '/tags/', isHtml: true },
    { file: 'about.md', permalink: '/about/', isHtml: false },
  ];

  for (const p of rootPages) {
    const filePath = path.join(__dirname, p.file);
    if (!fs.existsSync(filePath)) continue;
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = matter(raw);
    const content = p.isHtml ? parsed.content : marked.parse(parsed.content);

    pages.push({
      title: parsed.data.title || '',
      permalink: p.permalink,
      layout: parsed.data.layout || 'page',
      subtitle: parsed.data.subtitle || '',
      content,
      url: p.permalink,
    });
  }

  return pages;
}

// ============================================
// RENDERING
// ============================================

function renderTemplate(layoutName, pageData, siteData) {
  const layoutFile = `${layoutName}.html`;
  const layoutPath = path.join(__dirname, '_layouts', layoutFile);

  if (!fs.existsSync(layoutPath)) {
    console.warn(`Layout not found: ${layoutFile}, using default`);
    return renderTemplate('default', pageData, siteData);
  }

  const ctx = {
    page: pageData,
    site: siteData,
    content: pageData.content,
    jekyll: { environment: 'production' },
  };

  return nj.render(layoutFile, ctx);
}

function renderInclude(includeName, siteData, pageData) {
  const includePath = path.join(__dirname, '_includes', includeName);
  if (!fs.existsSync(includePath)) return '';
  const ctx = {
    site: siteData,
    page: pageData || {},
    jekyll: { environment: 'production' },
  };
  return nunjucks.render(includeName, ctx);
}

// ============================================
// BUILD CATEGORIES AND TAGS
// ============================================

function buildCollections(posts) {
  const categories = {};
  const tags = {};

  for (const post of posts) {
    for (const cat of post.categories) {
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(post);
    }
    for (const tag of post.tags) {
      if (!tags[tag]) tags[tag] = [];
      tags[tag].push(post);
    }
  }

  // Sort posts within each collection by date descending
  for (const k of Object.keys(categories)) {
    categories[k].sort((a, b) => b.date - a.date);
  }
  for (const k of Object.keys(tags)) {
    tags[k].sort((a, b) => b.date - a.date);
  }

  return { categories, tags };
}

// ============================================
// COMPILE SCSS
// ============================================

function compileScss() {
  const mainScssPath = path.join(__dirname, 'css', 'main.scss');
  const raw = fs.readFileSync(mainScssPath, 'utf-8');

  // Strip Jekyll front matter
  const scssContent = raw.replace(/^---[\s\S]*?---\n?/, '');

  // We need to manually inline the @import statements since sass package
  // resolves imports relative to the file
  const scssDir = path.join(__dirname, '_sass');

  // Prepend the _sass imports inline
  let inlinedScss = '';

  // Extract variables and mixins from main.scss (everything before @import)
  const importIdx = scssContent.indexOf('@import');
  if (importIdx >= 0) {
    inlinedScss = scssContent.slice(0, importIdx);
    // Add the imported files
    const imports = ['base', 'layout', 'components', 'syntax-highlighting'];
    for (const imp of imports) {
      const impPath = path.join(scssDir, `_${imp}.scss`);
      if (fs.existsSync(impPath)) {
        inlinedScss += '\n' + fs.readFileSync(impPath, 'utf-8');
      }
    }
    // Add the rest of main.scss after @import block
    const afterImport = scssContent.slice(scssContent.indexOf(';', importIdx) + 1);
    inlinedScss += '\n' + afterImport;
  } else {
    inlinedScss = scssContent;
  }

  const result = sass.compileString(inlinedScss, { style: 'compressed' });
  return result.css;
}

// ============================================
// MAIN BUILD
// ============================================

function build() {
  console.log('Building site...');
  const siteDir = path.join(__dirname, '_site');

  // Clean _site
  if (fs.existsSync(siteDir)) {
    fs.rmSync(siteDir, { recursive: true, force: true });
  }
  fs.mkdirSync(siteDir, { recursive: true });

  const posts = readPosts();
  const pages = readPages();
  const { categories, tags } = buildCollections(posts);

  const siteData = {
    title: config.title,
    description: config.description,
    url: config.url,
    baseurl: config.baseurl,
    lang: config.lang,
    author: config.author,
    navigation: config.navigation,
    posts,
    categories,
    tags,
    time: new Date(),
    words_per_minute: config.words_per_minute,
    reading_time: config.reading_time,
    date_format: config.date_format,
  };

  // Render includes as strings for layout use
  const headHtml = renderInclude('head.html', siteData, {});
  const headerHtml = renderInclude('header.html', siteData, {});
  const footerHtml = renderInclude('footer.html', siteData, {});

  // Add includes to site data so layouts can use them
  siteData.includes = {
    head: headHtml,
    header: headerHtml,
    footer: footerHtml,
  };

  // Override nunjucks to handle {% include %} from _includes
  // We need a custom approach: render includes as variables
  // Actually, let's use nunjucks's native include by configuring both paths

  // Render posts
  console.log(`Rendering ${posts.length} posts...`);
  for (const post of posts) {
    const pageData = {
      ...post,
      layout: post.layout || 'post',
    };

    const html = renderTemplate(pageData.layout, pageData, siteData);

    // Write to /YYYY/MM/slug/index.html
    const outputDir = path.join(siteDir, post.url);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'index.html'), html);
  }

  // Render pages
  console.log(`Rendering ${pages.length} pages...`);
  for (const page of pages) {
    const pageData = {
      ...page,
      layout: page.layout || 'page',
    };

    const html = renderTemplate(pageData.layout, pageData, siteData);

    const outputDir = path.join(siteDir, page.permalink);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'index.html'), html);
  }

  // Render category pages
  console.log(`Rendering ${Object.keys(categories).length} category pages...`);
  for (const [catName, catPosts] of Object.entries(categories)) {
    const slug = slugify(catName);
    const pageData = {
      title: catName,
      posts: catPosts,
      layout: 'category',
      url: `/category/${slug}/`,
    };
    const html = renderTemplate('category', pageData, siteData);
    const outputDir = path.join(siteDir, 'category', slug);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'index.html'), html);
  }

  // Render tag pages
  console.log(`Rendering ${Object.keys(tags).length} tag pages...`);
  for (const [tagName, tagPosts] of Object.entries(tags)) {
    const slug = slugify(tagName);
    const pageData = {
      title: tagName,
      posts: tagPosts,
      layout: 'tag',
      url: `/tag/${slug}/`,
    };
    const html = renderTemplate('tag', pageData, siteData);
    const outputDir = path.join(siteDir, 'tag', slug);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'index.html'), html);
  }

  // Render year archive pages
  const yearGroups = {};
  for (const post of posts) {
    const y = post.date.getFullYear();
    if (!yearGroups[y]) yearGroups[y] = [];
    yearGroups[y].push(post);
  }
  console.log(`Rendering ${Object.keys(yearGroups).length} year archive pages...`);
  for (const [yearStr, yearPosts] of Object.entries(yearGroups)) {
    const pageData = {
      date: new Date(`${yearStr}-01-01`),
      posts: yearPosts,
      layout: 'year',
      url: `/${yearStr}/`,
    };
    const html = renderTemplate('year', pageData, siteData);
    const outputDir = path.join(siteDir, yearStr);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'index.html'), html);
  }

  // Compile and copy CSS
  console.log('Compiling SCSS...');
  try {
    const css = compileScss();
    const cssDir = path.join(siteDir, 'css');
    fs.mkdirSync(cssDir, { recursive: true });
    fs.writeFileSync(path.join(cssDir, 'main.css'), css);
  } catch (err) {
    console.error('SCSS compilation error:', err.message);
  }

  // Copy static assets
  const staticFiles = ['favicon.ico', 'favicon.svg', 'robots.txt', 'search.json', 'feed.xml'];
  for (const file of staticFiles) {
    const src = path.join(__dirname, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(siteDir, file));
    }
  }

  // Copy js
  const jsDir = path.join(siteDir, 'js');
  fs.mkdirSync(jsDir, { recursive: true });
  const jsSrc = path.join(__dirname, 'js', 'main.js');
  if (fs.existsSync(jsSrc)) {
    fs.copyFileSync(jsSrc, path.join(jsDir, 'main.js'));
  }

  // Generate feed.xml
  generateFeed(posts, siteData, siteDir);

  console.log(`Build complete! ${posts.length} posts, ${pages.length} pages, ${Object.keys(categories).length} categories, ${Object.keys(tags).length} tags`);
}

// ============================================
// RSS FEED
// ============================================

function generateFeed(posts, siteData, siteDir) {
  let xml = `<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n`;
  xml += `  <title>${escapeHtml(siteData.title)}</title>\n`;
  xml += `  <link href="${siteData.url}/feed.xml" rel="self" type="application/atom+xml"/>\n`;
  xml += `  <link href="${siteData.url}/" rel="alternate" type="text/html"/>\n`;
  xml += `  <updated>${dateToXmlSchema(new Date())}</updated>\n`;
  xml += `  <id>${siteData.url}/</id>\n`;
  xml += `  <author><name>${escapeHtml(siteData.author.name)}</name></author>\n`;

  for (const post of posts.slice(0, 20)) {
    xml += `  <entry>\n`;
    xml += `    <title>${escapeHtml(post.title)}</title>\n`;
    xml += `    <link href="${siteData.url}${post.url}"/>\n`;
    xml += `    <updated>${dateToXmlSchema(post.date)}</updated>\n`;
    xml += `    <id>${siteData.url}${post.url}</id>\n`;
    xml += `    <content type="html"><![CDATA[${post.content}]]></content>\n`;
    xml += `  </entry>\n`;
  }

  xml += `</feed>\n`;
  fs.writeFileSync(path.join(siteDir, 'feed.xml'), xml);
}

// Run build
build();
