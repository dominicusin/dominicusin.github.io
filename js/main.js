// ============================================
// DOMINI'S BLOG - ГЛАВНЫЙ JAVASCRIPT
// ============================================

'use strict';

// Глобальный объект приложения
const DominiBlog = {
  init() {
    this.setupEventListeners();
    this.initModules();
  },

  setupEventListeners() {
    document.addEventListener('DOMContentLoaded', () => {
      this.initModules();
    });

    window.addEventListener('load', () => {
      this.onWindowLoad();
    });

    window.addEventListener('scroll', () => {
      this.throttle(this.onScroll.bind(this), 100)();
    }, { passive: true });
  },

  initModules() {
    this.initMobileMenu();
    this.initBackToTop();
    this.initSmoothScrolling();
    this.initCodeBlocks();
    this.initScrollAnimations();
    this.initActiveNav();
    this.initHeroParallax();
    this.initReadingProgress();
    this.initImageLazyLoad();
    this.initTableOfContents();
    this.initThemeToggle();
    this.initSearch();
    this.initShareButtons();
    this.initTooltips();
  },

  onWindowLoad() {
    this.removeLoadingClass();
    this.initPerformanceMonitoring();
  },

  onScroll() {
    this.updateScrollIndicators();
    this.updateHeaderOnScroll();
  },

  // Утилиты
  throttle(func, wait) {
    let timeout;
    return function(...args) {
      if (!timeout) {
        timeout = setTimeout(() => {
          func.apply(this, args);
          timeout = null;
        }, wait);
      }
    };
  },

  debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },

  removeLoadingClass() {
    document.body.classList.remove('loading');
    document.body.classList.add('loaded');
  },

  updateScrollIndicators() {
    // Реализация обновления индикаторов прокрутки
  },

  updateHeaderOnScroll() {
    const header = document.querySelector('.site-header');
    if (header) {
      if (window.pageYOffset > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  }
};

// ============================================
// МОБИЛЬНОЕ МЕНЮ
// ============================================

DominiBlog.initMobileMenu = function() {
  const navTrigger = document.getElementById('nav-trigger');
  const menuIcon = document.querySelector('.menu-icon');
  const siteNav = document.querySelector('.site-nav');
  
  if (!navTrigger || !menuIcon) return;
  
  // Переключение меню
  menuIcon.addEventListener('click', () => {
    navTrigger.checked = !navTrigger.checked;
    document.body.classList.toggle('menu-open', navTrigger.checked);
  });
  
  // Закрытие при клике вне меню
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.site-nav') && navTrigger.checked) {
      navTrigger.checked = false;
      document.body.classList.remove('menu-open');
    }
  });
  
  // Закрытие при нажатии Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navTrigger.checked) {
      navTrigger.checked = false;
      document.body.classList.remove('menu-open');
    }
  });
  
  // Закрытие меню при переходе по ссылке
  const navLinks = siteNav.querySelectorAll('.page-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navTrigger.checked) {
        navTrigger.checked = false;
        document.body.classList.remove('menu-open');
      }
    });
  });
};

// ============================================
// КНОПКА "НАВЕРХ"
// ============================================

DominiBlog.initBackToTop = function() {
  let backToTop = document.querySelector('.back-to-top');
  
  if (!backToTop) {
    backToTop = document.createElement('a');
    backToTop.href = '#top';
    backToTop.className = 'back-to-top';
    backToTop.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="19" x2="12" y2="5"></line>
        <polyline points="5 12 12 5 19 12"></polyline>
      </svg>
    `;
    backToTop.setAttribute('aria-label', 'Вернуться наверх');
    document.body.appendChild(backToTop);
  }
  
  // Показ/скрытие кнопки
  const toggleButton = () => {
    if (window.pageYOffset > 300) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  };
  
  window.addEventListener('scroll', this.throttle(toggleButton, 100), { passive: true });
  
  // Плавная прокрутка наверх
  backToTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
};

// ============================================
// ПЛАВНАЯ ПРОКРУТКА
// ============================================

DominiBlog.initSmoothScrolling = function() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      if (href === '#' || href === '#top') {
        e.preventDefault();
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
        return;
      }
      
      try {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const headerOffset = 80;
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
          
          // Обновление URL без прокрутки
          if (history.pushState) {
            history.pushState(null, null, href);
          }
        }
      } catch (err) {
        console.warn('Invalid anchor selector:', href);
      }
    });
  });
};

// ============================================
// БЛОКИ КОДА
// ============================================

DominiBlog.initCodeBlocks = function() {
  document.querySelectorAll('pre code').forEach((codeBlock) => {
    const pre = codeBlock.parentNode;
    
    if (pre.querySelector('.copy-code-btn')) return;
    
    // Обертка для кода
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);
    
    // Кнопка копирования
    const button = document.createElement('button');
    button.className = 'copy-code-btn';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span>Копировать</span>
    `;
    button.setAttribute('aria-label', 'Копировать код');
    
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(codeBlock.textContent);
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Скопировано!</span>
        `;
        button.classList.add('copied');
        
        setTimeout(() => {
          button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Копировать</span>
          `;
          button.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    });
    
    wrapper.appendChild(button);
    
    // Определение языка кода
    const language = Array.from(codeBlock.classList)
      .find(cls => cls.startsWith('language-'))
      ?.replace('language-', '');
    
    if (language) {
      const languageLabel = document.createElement('span');
      languageLabel.className = 'code-language-label';
      languageLabel.textContent = language;
      wrapper.appendChild(languageLabel);
    }
  });
};

// ============================================
// АНИМАЦИИ ПРИ ПРОКРУТКЕ
// ============================================

DominiBlog.initScrollAnimations = function() {
  if ('IntersectionObserver' in window) {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    
    const fadeElements = document.querySelectorAll(
      '.recent-posts, .featured-topics, .newsletter-section'
    );
    
    fadeElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      observer.observe(el);
    });
  }
};

// ============================================
// АКТИВНАЯ НАВИГАЦИЯ
// ============================================

DominiBlog.initActiveNav = function() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.page-link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '/' && href === '/')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
};

// ============================================
// ПАРАЛЛАКС HERO
// ============================================

DominiBlog.initHeroParallax = function() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  
  const handleScroll = this.throttle(() => {
    const scrolled = window.pageYOffset;
    const parallax = scrolled * 0.5;
    const opacity = Math.max(0, 1 - scrolled / 500);
    
    hero.style.transform = `translateY(${parallax}px)`;
    hero.style.opacity = opacity;
  }, 10);
  
  window.addEventListener('scroll', handleScroll, { passive: true });
};

// ============================================
// ПРОГРЕСС ЧТЕНИЯ
// ============================================

DominiBlog.initReadingProgress = function() {
  let progressBar = document.querySelector('.reading-progress');
  
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    progressBar.setAttribute('role', 'progressbar');
    progressBar.setAttribute('aria-label', 'Прогресс чтения');
    document.body.appendChild(progressBar);
  }
  
  const updateProgress = this.throttle(() => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight - windowHeight;
    const scrolled = window.pageYOffset;
    const progress = (scrolled / documentHeight) * 100;
    
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute('aria-valuenow', Math.round(progress));
  }, 10);
  
  window.addEventListener('scroll', updateProgress, { passive: true });
};

// ============================================
// ЛЕНИВАЯ ЗАГРУЗКА ИЗОБРАЖЕНИЙ
// ============================================

DominiBlog.initImageLazyLoad = function() {
  if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
      img.src = img.dataset.src || img.src;
    });
  } else if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    });
    
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => imageObserver.observe(img));
  }
};

// ============================================
// ОГЛАВЛЕНИЕ
// ============================================

DominiBlog.initTableOfContents = function() {
  const postContent = document.querySelector('.post-content');
  if (!postContent) return;
  
  const headings = postContent.querySelectorAll('h2, h3');
  if (headings.length < 3) return;
  
  const toc = document.createElement('nav');
  toc.className = 'table-of-contents';
  toc.setAttribute('aria-label', 'Оглавление');
  toc.innerHTML = '<h4>Содержание</h4><ul class="toc-list"></ul>';
  
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
      const headerOffset = 80;
      const elementPosition = heading.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      history.pushState(null, null, `#${id}`);
    });
    
    li.appendChild(link);
    tocList.appendChild(li);
  });
  
  const firstHeading = postContent.querySelector('h1, h2');
  if (firstHeading) {
    firstHeading.parentNode.insertBefore(toc, firstHeading.nextSibling);
  }
};

// ============================================
// ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ
// ============================================

DominiBlog.initThemeToggle = function() {
  const themeToggle = document.querySelector('.theme-toggle');
  if (!themeToggle) return;
  
  const currentTheme = localStorage.getItem('theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  
  document.documentElement.setAttribute('data-theme', currentTheme);
  
  themeToggle.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme');
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Анимация переключения
    document.body.classList.add('theme-transition');
    setTimeout(() => {
      document.body.classList.remove('theme-transition');
    }, 300);
  });
  
  // Автоматическое переключение при изменении системной темы
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      const newTheme = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  });
};

// ============================================
// ПОИСК
// ============================================

DominiBlog.initSearch = function() {
  const searchInput = document.querySelector('.search-input');
  const searchResults = document.querySelector('.search-results');
  
  if (!searchInput || !searchResults) return;
  
  let posts = [];
  
  // Загрузка данных поиска
  fetch('/search.json')
    .then(response => response.json())
    .then(data => {
      posts = data;
    })
    .catch(error => {
      console.log('Search data not available:', error);
    });
  
  const performSearch = this.debounce((query) => {
    if (query.length < 2) {
      searchResults.classList.remove('active');
      return;
    }
    
    const results = posts.filter(post => 
      post.title.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query) ||
      post.tags?.some(tag => tag.toLowerCase().includes(query))
    ).slice(0, 5);
    
    displaySearchResults(results);
  }, 300);
  
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    performSearch(query);
  });
  
  function displaySearchResults(results) {
    if (results.length === 0) {
      searchResults.innerHTML = `
        <div class="search-result no-results">
          <p>Ничего не найдено</p>
        </div>
      `;
    } else {
      searchResults.innerHTML = results.map(post => `
        <div class="search-result">
          <a href="${post.url}">
            <strong>${post.title}</strong>
            <br>
            <small>${post.date}</small>
          </a>
        </div>
      `).join('');
    }
    
    searchResults.classList.add('active');
  }
  
  // Закрытие при клике вне области поиска
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      searchResults.classList.remove('active');
    }
  });
};

// ============================================
// КНОПКИ РАСШАРИВАНИЯ
// ============================================

DominiBlog.initShareButtons = function() {
  const shareButtons = document.querySelectorAll('.share-btn');
  
  shareButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const platform = button.dataset.platform;
      const url = encodeURIComponent(window.location.href);
      const title = encodeURIComponent(document.title);
      
      let shareUrl = '';
      
      switch (platform) {
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
          break;
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
          break;
        case 'linkedin':
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
          break;
        case 'telegram':
          shareUrl = `https://t.me/share/url?url=${url}&text=${title}`;
          break;
      }
      
      if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
      }
    });
  });
};

// ============================================
// ПОДСКАЗКИ
// ============================================

DominiBlog.initTooltips = function() {
  const tooltips = document.querySelectorAll('[data-tooltip]');
  
  tooltips.forEach(element => {
    const tooltip = document.createElement('span');
    tooltip.className = 'tooltip';
    tooltip.textContent = element.dataset.tooltip;
    element.appendChild(tooltip);
    
    element.addEventListener('mouseenter', () => {
      tooltip.classList.add('visible');
    });
    
    element.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
    });
  });
};

// ============================================
// МОНИТОРИНГ ПРОИЗВОДИТЕЛЬНОСТИ
// ============================================

DominiBlog.initPerformanceMonitoring = function() {
  if ('PerformanceObserver' in window) {
    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.log('LCP monitoring not supported');
    }
    
    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          console.log('FID:', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.log('FID monitoring not supported');
    }
  }
};

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

DominiBlog.init();

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DominiBlog;
}
