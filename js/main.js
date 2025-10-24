// Main JavaScript file for Domini's blog

document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
    initBackToTop();
    initSmoothScrolling();
    initCodeBlocks();
    initSearch();
    initScrollAnimations();
    initActiveNav();
    initHeroParallax();
    initReadingProgress();
    initImageLazyLoad();
    initTableOfContents();
});

function initMobileMenu() {
    const navTrigger = document.getElementById('nav-trigger');
    const menuIcon = document.querySelector('.menu-icon');
    const header = document.querySelector('.site-header');

    if (menuIcon) {
        menuIcon.addEventListener('click', function() {
            navTrigger.checked = !navTrigger.checked;
        });
    }

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.site-nav') && navTrigger && navTrigger.checked) {
            navTrigger.checked = false;
        }
    });

    window.addEventListener('scroll', debounce(() => {
        if (window.pageYOffset > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, 10));
}

function initBackToTop() {
    // Create back to top button
    const backToTop = document.createElement('a');
    backToTop.href = '#';
    backToTop.className = 'back-to-top';
    backToTop.innerHTML = '↑';
    backToTop.setAttribute('aria-label', 'Back to top');
    document.body.appendChild(backToTop);
    
    // Show/hide based on scroll position
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });
    
    // Smooth scroll to top
    backToTop.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

function initSmoothScrolling() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Handle back-to-top or empty hash
            if (href === '#' || href === '#top') {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                return;
            }
            
            // Handle specific anchor links
            try {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            } catch (err) {
                // Invalid selector, let default behavior happen
                console.warn('Invalid anchor selector:', href);
            }
        });
    });
}

function initCodeBlocks() {
    document.querySelectorAll('pre code').forEach(function(codeBlock) {
        const pre = codeBlock.parentNode;

        if (pre.querySelector('.copy-code-btn')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        const button = document.createElement('button');
        button.className = 'copy-code-btn';
        button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copy</span>';
        button.setAttribute('aria-label', 'Copy code to clipboard');

        button.addEventListener('click', function() {
            navigator.clipboard.writeText(codeBlock.textContent).then(function() {
                button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copied!</span>';
                button.classList.add('copied');
                setTimeout(function() {
                    button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copy</span>';
                    button.classList.remove('copied');
                }, 2000);
            });
        });

        wrapper.appendChild(button);
    });
}

function initSearch() {
    // Simple client-side search implementation
    const searchInput = document.querySelector('.search-input');
    const searchResults = document.querySelector('.search-results');
    
    if (!searchInput || !searchResults) return;
    
    let posts = [];
    
    // Load posts data (you would need to generate this JSON file)
    fetch('/search.json')
        .then(response => response.json())
        .then(data => {
            posts = data;
        })
        .catch(error => {
            console.log('Search data not available');
        });
    
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        
        if (query.length < 2) {
            searchResults.classList.remove('active');
            return;
        }
        
        const results = posts.filter(post => 
            post.title.toLowerCase().includes(query) ||
            post.content.toLowerCase().includes(query) ||
            post.tags.some(tag => tag.toLowerCase().includes(query))
        ).slice(0, 5);
        
        displaySearchResults(results);
    });
    
    function displaySearchResults(results) {
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-result">No results found</div>';
        } else {
            searchResults.innerHTML = results.map(post => 
                `<div class="search-result">
                    <a href="${post.url}">
                        <strong>${post.title}</strong>
                        <br>
                        <small>${post.date}</small>
                    </a>
                </div>`
            ).join('');
        }
        
        searchResults.classList.add('active');
    }
    
    // Hide results when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            searchResults.classList.remove('active');
        }
    });
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Theme toggle (for future dark mode implementation)
function initThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (!themeToggle) return;
    
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    themeToggle.addEventListener('click', function() {
        const theme = document.documentElement.getAttribute('data-theme');
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

// Scroll-based animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    const fadeElements = document.querySelectorAll('.recent-posts, .featured-content');
    fadeElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Active navigation highlighting
function initActiveNav() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.page-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || (currentPath === '/' && href === '/')) {
            link.classList.add('active');
        }
    });
}

function initHeroParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const handleScroll = debounce(() => {
        const scrolled = window.pageYOffset;
        const parallax = scrolled * 0.4;
        const opacity = Math.max(0, 1 - scrolled / 600);
        hero.style.transform = `translateY(${parallax}px)`;
        hero.style.opacity = opacity;
    }, 10);

    window.addEventListener('scroll', handleScroll);
}

function initReadingProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', debounce(() => {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrolled = window.pageYOffset;
        const progress = (scrolled / documentHeight) * 100;
        progressBar.style.width = progress + '%';
    }, 10));
}

function initImageLazyLoad() {
    const images = document.querySelectorAll('img[data-src]');
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    } else {
        images.forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
    }
}

function initTableOfContents() {
    const postContent = document.querySelector('.post-content');
    if (!postContent) return;

    const headings = postContent.querySelectorAll('h2, h3');
    if (headings.length < 3) return;

    const toc = document.createElement('nav');
    toc.className = 'table-of-contents';
    toc.innerHTML = '<h4>Table of Contents</h4><ul class="toc-list"></ul>';

    const tocList = toc.querySelector('.toc-list');

    headings.forEach((heading, index) => {
        const id = heading.id || `heading-${index}`;
        heading.id = id;

        const li = document.createElement('li');
        li.className = `toc-item toc-${heading.tagName.toLowerCase()}`;
        const link = document.createElement('a');
        link.href = `#${id}`;
        link.textContent = heading.textContent;
        link.className = 'toc-link';

        link.addEventListener('click', (e) => {
            e.preventDefault();
            heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
            window.history.pushState(null, null, `#${id}`);
        });

        li.appendChild(link);
        tocList.appendChild(li);
    });

    const firstHeading = postContent.querySelector('h1, h2');
    if (firstHeading) {
        firstHeading.parentNode.insertBefore(toc, firstHeading.nextSibling);
    }
}