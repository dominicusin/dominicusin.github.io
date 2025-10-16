# Domini's Blog - Jekyll Site

## Overview
This is a Jekyll-based personal blog website featuring posts about programming, system administration, and security topics. The site is built with Jekyll 4.3.4 and includes features like RSS feeds, SEO optimization, and syntax highlighting.

## Project Structure
- `_posts/` - Blog posts in markdown format
- `_layouts/` - Jekyll layout templates
- `_includes/` - Reusable HTML components
- `_sass/` - SCSS stylesheets
- `assets/` - Images and static files
- `_config.yml` - Jekyll configuration

## Technology Stack
- **Framework**: Jekyll 4.3.4 (Ruby-based static site generator)
- **Language**: Ruby 3.2
- **Styling**: Sass/SCSS
- **Plugins**: 
  - jekyll-feed (RSS feeds)
  - jekyll-sitemap (XML sitemap)
  - jekyll-seo-tag (SEO optimization)
  - jekyll-paginate (pagination)
  - jekyll-archives (archive pages)

## Development Setup
The site is configured to run on Replit with the following setup:
- Server runs on `0.0.0.0:5000`
- Live reload enabled for instant preview of changes
- Force polling enabled for file watching in the Replit environment

## Running the Site
The Jekyll server is configured as a workflow and starts automatically. To manually restart:
```bash
bundle exec jekyll serve --host 0.0.0.0 --port 5000 --livereload --force_polling
```

## Recent Changes
- **2025-10-16**: Initial Replit setup
  - Configured Jekyll to run on port 5000
  - Added Ruby 3.2 toolchain
  - Installed all dependencies via Bundler
  - Fixed file conflict by excluding Manifest.md from build
  - Updated .gitignore for Jekyll/Ruby files
  - Configured deployment settings

## Known Issues
- Sass deprecation warnings (non-critical, related to future Dart Sass 3.0.0)
- Missing favicon.ico (cosmetic issue)

## Deployment
The site is configured for Replit's autoscale deployment, suitable for static websites.
