// Main JavaScript file for Domini's blog

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    initMobileMenu();
    
    // Back to top button
    initBackToTop();
    
    // Smooth scrolling for anchor links
    initSmoothScrolling();
    
    // Code block enhancements
    initCodeBlocks();
    
    // Search functionality (if implemented)
    initSearch();
    
    // Scroll animations
    initScrollAnimations();
    
    // Active nav links
    initActiveNav();
    
    // Hero parallax
    initHeroParallax();
});

function initMobileMenu() {
    const navTrigger = document.getElementById('nav-trigger');
    const menuIcon = document.querySelector('.menu-icon');
    
    if (menuIcon) {
        menuIcon.addEventListener('click', function() {
            navTrigger.checked = !navTrigger.checked;
        });
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.site-nav') && navTrigger && navTrigger.checked) {
            navTrigger.checked = false;
        }
    });
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
    // Add copy button to code blocks
    document.querySelectorAll('pre code').forEach(function(codeBlock) {
        const pre = codeBlock.parentNode;
        const button = document.createElement('button');
        button.className = 'copy-code-btn';
        button.textContent = 'Copy';
        button.setAttribute('aria-label', 'Copy code to clipboard');
        
        button.addEventListener('click', function() {
            navigator.clipboard.writeText(codeBlock.textContent).then(function() {
                button.textContent = 'Copied!';
                setTimeout(function() {
                    button.textContent = 'Copy';
                }, 2000);
            });
        });
        
        pre.style.position = 'relative';
        pre.appendChild(button);
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

// Hero section parallax effect
function initHeroParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    const handleScroll = debounce(() => {
        const scrolled = window.pageYOffset;
        const parallax = scrolled * 0.5;
        hero.style.transform = `translateY(${parallax}px)`;
    }, 10);
    
    window.addEventListener('scroll', handleScroll);
}