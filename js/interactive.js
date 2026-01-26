/**
 * Основной JavaScript файл с интерактивными элементами
 * Современный ES6+ код с оптимизациями
 */

'use strict';

// Конфигурация
const CONFIG = {
  // Настройки анимаций
  animations: {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },
  
  // Настройки lazy loading
  lazyLoading: {
    threshold: 0.1,
    rootMargin: '50px'
  },
  
  // Настройки плавной прокрутки
  smoothScroll: {
    duration: 800,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    offset: 80
  }
};

/**
 * Класс управления интерактивными элементами
 */
class InteractiveUI {
  constructor() {
    this.isInitialized = false;
    this.observers = new Map();
    
    // Ждем загрузки DOM и i18n
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
    
    // Ждем загрузки переводов
    document.addEventListener('i18n:loaded', () => {
      this.refreshAriaLabels();
    });
  }

  /**
   * Инициализация всех компонентов
   */
  async init() {
    try {
      // Проверка поддержки браузера
      this.checkBrowserSupport();
      
      // Инициализация компонентов
      this.initSmoothScroll();
      this.initLazyLoading();
      this.initAnimations();
      this.initMobileMenu();
      this.initBreadcrumbs();
      this.initScrollProgress();
      this.initBackToTop();
      this.initFormValidation();
      this.initSearch();
      this.initThemeToggle();
      this.initKeyboardNavigation();
      
      this.isInitialized = true;
      
      // Добавить класс для стилизации
      document.body.classList.add('interactive-ui-loaded');
      
      console.log('Interactive UI initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Interactive UI:', error);
    }
  }

  /**
   * Проверка поддержки браузера
   */
  checkBrowserSupport() {
    const features = {
      'IntersectionObserver': 'IntersectionObserver' in window,
      'MutationObserver': 'MutationObserver' in window,
      'CSSCustomProperties': CSS.supports('color', 'var(--test)'),
      'Promise': 'Promise' in window,
      'Fetch': 'fetch' in window,
      'LocalStorage': 'localStorage' in window
    };
    
    const unsupported = Object.entries(features)
      .filter(([_, supported]) => !supported)
      .map(([feature]) => feature);
    
    if (unsupported.length > 0) {
      console.warn('Browser does not support:', unsupported);
      document.body.classList.add('legacy-browser');
    }
  }

  /**
   * Плавная прокрутка к якорям
   */
  initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]:not([href="#"])');
    
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        const targetId = link.getAttribute('href');
        const target = document.querySelector(targetId);
        
        if (target) {
          this.smoothScrollTo(target);
          
          // Обновить URL без перезагрузки
          history.pushState(null, null, targetId);
          
          // Фокус на цели для доступности
          target.setAttribute('tabindex', '-1');
          target.focus();
        }
      });
    });
  }

  /**
   * Плавная прокрутка к элементу
   */
  smoothScrollTo(target) {
    const headerOffset = CONFIG.smoothScroll.offset;
    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
    
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  }

  /**
   * Lazy loading для изображений
   */
  initLazyLoading() {
    if (!('IntersectionObserver' in window)) {
      // Fallback для старых браузеров
      this.loadAllImages();
      return;
    }

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          this.loadImage(img);
          imageObserver.unobserve(img);
        }
      });
    }, CONFIG.lazyLoading);

    // Наблюдаем за всеми изображениями с data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });

    this.observers.set('images', imageObserver);
  }

  /**
   * Загрузка отдельного изображения
   */
  loadImage(img) {
    const src = img.getAttribute('data-src');
    const srcset = img.getAttribute('data-srcset');
    
    if (src) {
      img.src = src;
    }
    
    if (srcset) {
      img.srcset = srcset;
    }
    
    img.classList.add('loaded');
    img.removeAttribute('data-src');
    img.removeAttribute('data-srcset');
  }

  /**
   * Загрузка всех изображений (fallback)
   */
  loadAllImages() {
    document.querySelectorAll('img[data-src]').forEach(img => {
      this.loadImage(img);
    });
  }

  /**
   * Анимации при прокрутке
   */
  initAnimations() {
    if (CONFIG.animations.reducedMotion) {
      document.body.classList.add('no-animations');
      return;
    }

    if (!('IntersectionObserver' in window)) {
      // Показать все элементы сразу
      document.querySelectorAll('.animate-on-scroll').forEach(el => {
        el.classList.add('animated');
      });
      return;
    }

    const animationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const delay = element.getAttribute('data-delay') || 0;
          
          setTimeout(() => {
            element.classList.add('animated');
          }, delay);
          
          animationObserver.unobserve(element);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      animationObserver.observe(el);
    });

    this.observers.set('animations', animationObserver);
  }

  /**
   * Мобильное меню
   */
  initMobileMenu() {
    const menuToggle = document.querySelector('.menu-icon');
    const nav = document.querySelector('.site-nav');
    
    if (!menuToggle || !nav) return;

    menuToggle.addEventListener('click', () => {
      this.toggleMobileMenu();
    });

    // Закрытие при клике вне меню
    document.addEventListener('click', (e) => {
      if (nav.classList.contains('active') && 
          !nav.contains(e.target) && 
          !menuToggle.contains(e.target)) {
        this.closeMobileMenu();
      }
    });

    // Закрытие при клавише Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('active')) {
        this.closeMobileMenu();
      }
    });
  }

  /**
   * Переключение мобильного меню
   */
  toggleMobileMenu() {
    const nav = document.querySelector('.site-nav');
    const menuToggle = document.querySelector('.menu-icon');
    
    const isActive = nav.classList.toggle('active');
    menuToggle.classList.toggle('active', isActive);
    
    // Блокировка прокрутки
    document.body.classList.toggle('menu-open', isActive);
    
    // Обновить ARIA атрибуты
    menuToggle.setAttribute('aria-expanded', isActive.toString());
    
    if (isActive) {
      // Фокус на первом элементе меню
      const firstLink = nav.querySelector('.page-link');
      if (firstLink) {
        setTimeout(() => firstLink.focus(), 100);
      }
    }
  }

  /**
   * Закрытие мобильного меню
   */
  closeMobileMenu() {
    const nav = document.querySelector('.site-nav');
    const menuToggle = document.querySelector('.menu-icon');
    
    nav.classList.remove('active');
    menuToggle.classList.remove('active');
    document.body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  /**
   * Хлебные крошки
   */
  initBreadcrumbs() {
    const breadcrumbContainer = document.querySelector('.breadcrumbs');
    
    if (breadcrumbContainer) {
      this.generateBreadcrumbs();
    }
  }

  /**
   * Генерация хлебных крошек
   */
  generateBreadcrumbs() {
    const path = window.location.pathname;
    const parts = path.split('/').filter(part => part);
    
    if (parts.length <= 1) return;
    
    const breadcrumbs = [
      { name: window.t?.('navigation.home') || 'Home', url: '/' }
    ];
    
    let currentPath = '';
    parts.forEach((part, index) => {
      currentPath += '/' + part;
      
      const name = this.formatBreadcrumbName(part);
      const isLast = index === parts.length - 1;
      
      breadcrumbs.push({
        name,
        url: currentPath,
        isLast
      });
    });
    
    this.renderBreadcrumbs(breadcrumbs);
  }

  /**
   * Форматирование имени для хлебной крошки
   */
  formatBreadcrumbName(part) {
    // Преобразование URL part в читаемое имя
    const nameMap = {
      'about': window.t?.('navigation.about') || 'About',
      'archive': window.t?.('navigation.archive') || 'Archive',
      'categories': window.t?.('navigation.categories') || 'Categories',
      'tags': window.t?.('navigation.tags') || 'Tags'
    };
    
    return nameMap[part] || part.charAt(0).toUpperCase() + part.slice(1);
  }

  /**
   * Отрисовка хлебных крошек
   */
  renderBreadcrumbs(breadcrumbs) {
    const container = document.querySelector('.breadcrumbs');
    if (!container) return;
    
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Breadcrumb');
    
    const ol = document.createElement('ol');
    ol.className = 'breadcrumb-list';
    
    breadcrumbs.forEach((crumb, index) => {
      const li = document.createElement('li');
      
      if (crumb.isLast) {
        li.setAttribute('aria-current', 'page');
        li.textContent = crumb.name;
      } else {
        const link = document.createElement('a');
        link.href = crumb.url;
        link.textContent = crumb.name;
        li.appendChild(link);
      }
      
      ol.appendChild(li);
    });
    
    nav.appendChild(ol);
    container.appendChild(nav);
  }

  /**
   * Прогресс прокрутки
   */
  initScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    progressBar.setAttribute('role', 'progressbar');
    progressBar.setAttribute('aria-valuenow', '0');
    progressBar.setAttribute('aria-valuemin', '0');
    progressBar.setAttribute('aria-valuemax', '100');
    
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', this.throttle(() => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      
      progressBar.style.width = scrolled + '%';
      progressBar.setAttribute('aria-valuenow', Math.round(scrolled).toString());
    }, 50));
  }

  /**
   * Кнопка "Наверх"
   */
  initBackToTop() {
    const button = document.createElement('button');
    button.className = 'back-to-top';
    button.setAttribute('aria-label', window.t?.('accessibility.back_to_top') || 'Back to top');
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    `;
    
    document.body.appendChild(button);
    
    // Показать/скрыть при прокрутке
    window.addEventListener('scroll', this.throttle(() => {
      const showThreshold = 300;
      button.classList.toggle('visible', window.pageYOffset > showThreshold);
    }, 100));
    
    // Прокрутка наверх
    button.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  /**
   * Валидация форм
   */
  initFormValidation() {
    const forms = document.querySelectorAll('form[data-validate]');
    
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        if (!this.validateForm(form)) {
          e.preventDefault();
        }
      });
      
      // Валидация при вводе
      form.querySelectorAll('input, textarea, select').forEach(field => {
        field.addEventListener('blur', () => {
          this.validateField(field);
        });
      });
    });
  }

  /**
   * Валидация формы
   */
  validateForm(form) {
    let isValid = true;
    const fields = form.querySelectorAll('input, textarea, select');
    
    fields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });
    
    return isValid;
  }

  /**
   * Валидация поля
   */
  validateField(field) {
    const isValid = field.checkValidity();
    const errorElement = field.parentNode.querySelector('.error-message');
    
    field.classList.toggle('invalid', !isValid);
    
    if (!isValid && errorElement) {
      errorElement.textContent = field.validationMessage;
      errorElement.style.display = 'block';
    } else if (errorElement) {
      errorElement.style.display = 'none';
    }
    
    return isValid;
  }

  /**
   * Поиск
   */
  initSearch() {
    const searchInput = document.querySelector('[data-search]');
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      
      searchTimeout = setTimeout(() => {
        this.performSearch(e.target.value);
      }, 300);
    });
  }

  /**
   * Выполнение поиска
   */
  async performSearch(query) {
    // Реализация поиска зависит от структуры сайта
    console.log('Searching for:', query);
  }

  /**
   * Переключение темы
   */
  initThemeToggle() {
    const themeToggle = document.querySelector('[data-theme-toggle]');
    if (!themeToggle) return;
    
    // Установить начальную тему
    const savedTheme = localStorage.getItem('theme') || 
                     (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    this.setTheme(savedTheme);
    
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      this.setTheme(newTheme);
    });
  }

  /**
   * Установка темы
   */
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const themeToggle = document.querySelector('[data-theme-toggle]');
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
  }

  /**
   * Навигация с клавиатуры
   */
  initKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Alt + S для поиска
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        const searchInput = document.querySelector('[data-search]');
        if (searchInput) {
          searchInput.focus();
        }
      }
      
      // Alt + M для меню
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        this.toggleMobileMenu();
      }
    });
  }

  /**
   * Обновление ARIA меток при смене языка
   */
  refreshAriaLabels() {
    const elements = document.querySelectorAll('[aria-label][data-aria-i18n]');
    
    elements.forEach(element => {
      const key = element.getAttribute('data-aria-i18n');
      const label = window.t?.(key);
      
      if (label) {
        element.setAttribute('aria-label', label);
      }
    });
  }

  /**
   * Утилита: throttle
   */
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Утилита: debounce
   */
  debounce(func, wait) {
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

  /**
   * Очистка при unload
   */
  destroy() {
    // Очистка всех observers
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    
    // Удаление event listeners
    // (в реальном приложении нужно сохранить ссылки на функции)
  }
}

// Инициализация
window.interactiveUI = new InteractiveUI();

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InteractiveUI;
}