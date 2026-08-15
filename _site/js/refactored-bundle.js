var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/config/constants.js
var DEFAULT_CONFIG, CSS_CLASSES, ARIA_LABELS, EVENT_NAMES, KEY_CODES, WEB_VITALS_THRESHOLDS;
var init_constants = __esm({
  "src/config/constants.js"() {
    DEFAULT_CONFIG = Object.freeze({
      // Performance settings
      PERFORMANCE: {
        DEBOUNCE_DELAY: 300,
        THROTTLE_DELAY: 100,
        SCROLL_TIMEOUT: 150,
        LAZY_LOAD_THRESHOLD: 0.1,
        LAZY_LOAD_ROOT_MARGIN: "50px",
        PREFETCH_HOVER_DELAY: 100,
        SLOW_RESOURCE_THRESHOLD: 1e3,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1e3,
        REQUEST_TIMEOUT: 1e4
      },
      // Animation settings
      ANIMATION: {
        DURATION: 300,
        EASING: "cubic-bezier(0.4, 0, 0.2, 1)",
        REDUCED_MOTION_QUERY: "(prefers-reduced-motion: reduce)"
      },
      // Scroll settings
      SCROLL: {
        SMOOTH_DURATION: 800,
        OFFSET: 80,
        SHOW_BACK_TO_TOP: 300
      },
      // Storage keys
      STORAGE: {
        THEME: "blog-theme",
        LANGUAGE: "preferred-language"
      },
      // Supported languages
      LANGUAGES: ["en", "ru"],
      DEFAULT_LANGUAGE: "en",
      // Theme options
      THEMES: ["light", "dark", "auto"],
      DEFAULT_THEME: "auto",
      // Analytics settings
      ANALYTICS: {
        SAMPLE_RATE: 0.1,
        SEND_INTERVAL: 3e4,
        ENDPOINT: "/api/analytics"
      }
    });
    CSS_CLASSES = Object.freeze({
      // Theme classes
      THEME_LIGHT: "theme-light",
      THEME_DARK: "theme-dark",
      // Font loading states
      FONTS_LOADING: "fonts-loading",
      FONTS_LOADED: "fonts-loaded",
      FONTS_FALLBACK: "fonts-fallback",
      // UI states
      SCROLLED: "scrolled",
      RESIZING: "resizing",
      MENU_OPEN: "menu-open",
      ACTIVE: "active",
      HIDDEN: "hidden",
      LOADING: "loading",
      ERROR: "error",
      // Lazy loading
      LAZY_LOADING: "lazy-loading",
      LAZY_LOADED: "lazy-loaded",
      LAZY_ERROR: "lazy-error",
      // Animations
      ANIMATE_ON_SCROLL: "animate-on-scroll",
      ANIMATED: "animated",
      NO_ANIMATIONS: "no-animations"
    });
    ARIA_LABELS = Object.freeze({
      CLOSE_MENU: "Close menu",
      OPEN_MENU: "Open menu",
      BACK_TO_TOP: "Back to top",
      SEARCH: "Search articles",
      CLEAR_SEARCH: "Clear search",
      LANGUAGE_SELECTION: "Language selection",
      THEME_SWITCHER: "Theme switcher"
    });
    EVENT_NAMES = Object.freeze({
      I18N_LOADED: "i18n:loaded",
      I18N_LANGUAGE_CHANGED: "i18n:languageChanged",
      THEME_CHANGED: "theme:changed",
      SEARCH_PERFORMED: "search:performed",
      MODULE_LOADED: "module:loaded"
    });
    KEY_CODES = Object.freeze({
      ENTER: "Enter",
      SPACE: " ",
      ESCAPE: "Escape",
      ARROW_UP: "ArrowUp",
      ARROW_DOWN: "ArrowDown",
      ARROW_LEFT: "ArrowLeft",
      ARROW_RIGHT: "ArrowRight"
    });
    WEB_VITALS_THRESHOLDS = Object.freeze({
      LCP: {
        GOOD: 2500,
        NEEDS_IMPROVEMENT: 4e3
      },
      FID: {
        GOOD: 100,
        NEEDS_IMPROVEMENT: 300
      },
      CLS: {
        GOOD: 0.1,
        NEEDS_IMPROVEMENT: 0.25
      }
    });
  }
});

// src/utils/helpers.js
function debounce(func, wait = DEFAULT_CONFIG.PERFORMANCE.DEBOUNCE_DELAY) {
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
function throttle(func, limit = DEFAULT_CONFIG.PERFORMANCE.THROTTLE_DELAY) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
function generateId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function getNestedValue(obj, key) {
  if (!obj || !key) return null;
  return key.split(".").reduce((current, keyPart) => {
    return current && current[keyPart] !== void 0 ? current[keyPart] : null;
  }, obj);
}
function deepMerge(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    });
  }
  return deepMerge(target, ...sources);
}
function isObject(value) {
  return !!(value && typeof value === "object" && !Array.isArray(value));
}
function isInViewport(element, threshold = 0) {
  const rect = element.getBoundingClientRect();
  const visibility = Math.min(1, Math.max(0, (rect.bottom - rect.top) / window.innerHeight));
  return visibility >= threshold;
}
function smoothScrollTo(target, options = {}) {
  const {
    offset = DEFAULT_CONFIG.SCROLL.OFFSET,
    behavior = "smooth"
  } = options;
  const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
  window.scrollTo({
    top: targetPosition,
    behavior
  });
}
function loadScript(src, options = {}) {
  const {
    async = true,
    type = "text/javascript",
    timeout = DEFAULT_CONFIG.PERFORMANCE.REQUEST_TIMEOUT
  } = options;
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = async;
    script.type = type;
    const cleanup = () => {
      clearTimeout(timeoutId);
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };
    const onLoad = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error(`Failed to load script: ${src}`));
    };
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`Script load timeout: ${src}`));
    }, timeout);
    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);
    document.head.appendChild(script);
  });
}
function loadCSS(href) {
  return new Promise((resolve, reject) => {
    const existingLink = document.querySelector(`link[href="${href}"]`);
    if (existingLink) {
      resolve();
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.addEventListener("load", resolve);
    link.addEventListener("error", () => reject(new Error(`Failed to load CSS: ${href}`)));
    document.head.appendChild(link);
  });
}
function supports(feature) {
  var _a, _b;
  const features = {
    intersectionObserver: "IntersectionObserver" in window,
    mutationObserver: "MutationObserver" in window,
    cssCustomProperties: (_a = CSS.supports) == null ? void 0 : _a.call(CSS, "color", "var(--test)"),
    promise: "Promise" in window,
    fetch: "fetch" in window,
    localStorage: "localStorage" in window,
    sendBeacon: "sendBeacon" in navigator,
    webAnimations: "animate" in document.documentElement
  };
  return (_b = features[feature]) != null ? _b : false;
}
function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent.substring(0, 200),
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    deviceMemory: navigator.deviceMemory || "unknown",
    hardwareConcurrency: navigator.hardwareConcurrency || "unknown",
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    screen: {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth
    }
  };
}
function getElementSelector(element) {
  if (!element) return "";
  if (element.id) {
    return `#${element.id}`;
  }
  const parts = [];
  let current = element;
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.nodeName.toLowerCase();
    if (current.id) {
      selector = `#${current.id}`;
      parts.unshift(selector);
      break;
    } else {
      if (current.className) {
        const classes = current.className.split(" ").filter(Boolean).slice(0, 2);
        if (classes.length) {
          selector += "." + classes.join(".");
        }
      }
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          (child) => child.nodeName === current.nodeName
        );
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }
    }
    parts.unshift(selector);
    current = current.parentElement;
  }
  return parts.join(" > ");
}
function formatDate2(dateString, options = {}) {
  const date = new Date(dateString);
  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric"
  };
  return date.toLocaleDateString(void 0, { ...defaultOptions, ...options });
}
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
function parseQueryParams(url = window.location.href) {
  const params = {};
  const queryString = url.split("?")[1];
  if (!queryString) return params;
  const pairs = queryString.split("&");
  pairs.forEach((pair) => {
    const [key, value] = pair.split("=");
    params[decodeURIComponent(key)] = decodeURIComponent(value || "");
  });
  return params;
}
function createElement(tag, attributes = {}, content = "") {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    if (key.startsWith("on") && typeof value === "function") {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === "class") {
      element.className = value;
    } else if (key === "dataset") {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else if (typeof value === "boolean") {
      if (value) element.setAttribute(key, "");
    } else {
      element.setAttribute(key, value);
    }
  });
  if (typeof content === "string") {
    element.innerHTML = content;
  } else if (content instanceof Element) {
    element.appendChild(content);
  }
  return element;
}
var init_helpers = __esm({
  "src/utils/helpers.js"() {
    init_constants();
  }
});

// src/modules/vector-search.js
var vector_search_exports = {};
__export(vector_search_exports, {
  VectorSearch: () => VectorSearch,
  default: () => vector_search_default
});
function tokenize(text) {
  if (!text) return [];
  return String(text).toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, " ").split(/\s+/).map((t) => t.trim()).filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}
function conceptTokens(concepts) {
  if (!Array.isArray(concepts)) return [];
  const out = [];
  for (const c of concepts) {
    if (!c) continue;
    const label = typeof c === "string" ? c : c.label || c.id || "";
    const t = tokenize(label);
    for (let i = 0; i < FIELD_WEIGHTS.concepts; i++) out.push(...t);
  }
  return out;
}
function termFreq(tokens) {
  const tf = /* @__PURE__ */ new Map();
  for (const tok of tokens) tf.set(tok, (tf.get(tok) || 0) + 1);
  return tf;
}
function cosim(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [k, v] of a) {
    na += v * v;
    if (b.has(k)) dot += v * b.get(k);
  }
  for (const [, v] of b) nb += v * v;
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
var STOPWORDS, FIELD_WEIGHTS, VectorSearch, vector_search_default;
var init_vector_search = __esm({
  "src/modules/vector-search.js"() {
    STOPWORDS = /* @__PURE__ */ new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "if",
      "then",
      "else",
      "when",
      "at",
      "by",
      "for",
      "with",
      "about",
      "against",
      "between",
      "into",
      "through",
      "during",
      "before",
      "after",
      "above",
      "below",
      "to",
      "from",
      "up",
      "down",
      "in",
      "out",
      "on",
      "off",
      "over",
      "under",
      "again",
      "further",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "of",
      "this",
      "that",
      "these",
      "those",
      "it",
      "its",
      "we",
      "you",
      "they",
      "he",
      "she",
      "i",
      "me",
      "my",
      "your",
      "our",
      "their",
      "as",
      "can",
      "will",
      "just",
      "should",
      "now",
      "so",
      "than",
      "too",
      "very",
      "s",
      "t",
      "can",
      "will",
      "not",
      "no",
      "yes",
      "how",
      "what",
      "why",
      "when",
      "where",
      "which",
      "who",
      "whom",
      "all",
      "any",
      "both",
      "each",
      "few",
      "more",
      "most",
      "other",
      "some",
      "such",
      "only",
      "own",
      "same",
      "one",
      "two",
      "three",
      "\u043F\u0440\u043E",
      "\u044D\u0442\u043E",
      "\u043A\u0430\u043A",
      "\u0434\u043B\u044F",
      "\u0447\u0442\u043E",
      "\u0438\u043B\u0438",
      "\u043D\u0435",
      "\u043D\u0430",
      "\u0432",
      "\u0438",
      "\u0441",
      "\u043F\u043E",
      "\u0442\u043E",
      "\u043C\u044B",
      "\u0432\u044B",
      "\u043E\u043D",
      "\u043E\u043D\u0430",
      "\u043E\u043D\u0438"
    ]);
    FIELD_WEIGHTS = {
      concepts: 5,
      title: 3,
      tags: 2.5,
      categories: 2,
      content: 1,
      excerpt: 1
    };
    VectorSearch = class {
      /**
       * @param {Array<Object>} [posts] - normalized posts from the Content Model
       */
      constructor(posts = []) {
        this.documents = [];
        this.idf = /* @__PURE__ */ new Map();
        this.vocab = /* @__PURE__ */ new Set();
        if (posts.length) this.buildIndex(posts);
      }
      /**
       * Build (or rebuild) the TF-IDF index from posts.
       * @param {Array<Object>} posts
       * @returns {void}
       */
      buildIndex(posts) {
        this.documents = [];
        const raw = posts.map((post) => {
          const concepts = conceptTokens(post.concepts);
          const title = tokenize(post.title);
          const tags = tokenize((post.tags || []).join(" "));
          const categories = tokenize((post.categories || []).join(" "));
          const content = tokenize(post.content);
          const excerpt = tokenize(post.excerpt);
          return { post, tokens: { concepts, title, tags, categories, content, excerpt } };
        });
        this.idf = /* @__PURE__ */ new Map();
        this.vocab = /* @__PURE__ */ new Set();
        const df = /* @__PURE__ */ new Map();
        for (const { tokens } of raw) {
          const seen = /* @__PURE__ */ new Set();
          for (const field of Object.keys(tokens)) {
            for (const tok of tokens[field]) {
              if (!seen.has(tok)) {
                seen.add(tok);
                df.set(tok, (df.get(tok) || 0) + 1);
              }
              this.vocab.add(tok);
            }
          }
        }
        const N = raw.length || 1;
        for (const [tok, d] of df) {
          this.idf.set(tok, Math.log((1 + N) / (1 + d)) + 1);
        }
        this.documents = raw.map(({ post, tokens }) => {
          const vec = /* @__PURE__ */ new Map();
          for (const field of Object.keys(tokens)) {
            const tf = termFreq(tokens[field]);
            const w = FIELD_WEIGHTS[field] || 1;
            for (const [tok, f] of tf) {
              const val = (1 + Math.log(f)) * this.idf.get(tok) * w;
              vec.set(tok, (vec.get(tok) || 0) + val);
            }
          }
          let norm = 0;
          for (const v of vec.values()) norm += v * v;
          norm = Math.sqrt(norm) || 1;
          for (const [k, v] of vec) vec.set(k, v / norm);
          return { post, vector: vec };
        });
      }
      /**
       * Vectorize a free-text query into a normalized TF-IDF vector.
       * @param {string} query
       * @returns {Map<string, number>}
       */
      embed(query) {
        const tokens = {
          concepts: tokenize(query),
          title: tokenize(query),
          tags: tokenize(query),
          categories: tokenize(query),
          content: tokenize(query),
          excerpt: tokenize(query)
        };
        const vec = /* @__PURE__ */ new Map();
        for (const field of Object.keys(tokens)) {
          const tf = termFreq(tokens[field]);
          const w = FIELD_WEIGHTS[field] || 1;
          for (const [tok, f] of tf) {
            if (!this.idf.has(tok)) {
              this.idf.set(tok, 1);
            }
            const val = (1 + Math.log(f)) * this.idf.get(tok) * w;
            vec.set(tok, (vec.get(tok) || 0) + val);
          }
        }
        let norm = 0;
        for (const v of vec.values()) norm += v * v;
        norm = Math.sqrt(norm) || 1;
        for (const [k, v] of vec) vec.set(k, v / norm);
        return vec;
      }
      /**
       * Search the index by semantic similarity.
       * @param {string} query
       * @param {Object} [opts]
       * @param {number} [opts.topK=5]
       * @param {number} [opts.threshold=0]
       * @returns {Array<{post: Object, score: number}>}
       */
      search(query, opts = {}) {
        const { topK = 5, threshold = 0 } = opts;
        const qv = this.embed(query);
        if (qv.size === 0) return [];
        const scored = this.documents.map((doc) => ({ post: doc.post, score: cosim(qv, doc.vector) })).filter((r) => r.score >= threshold).sort((a, b) => b.score - a.score).slice(0, topK);
        return scored;
      }
      /**
       * Compute similarity between two posts (0..1). Useful for "related posts".
       * @param {Object} a
       * @param {Object} b
       * @returns {number}
       */
      similarity(a, b) {
        const va = this.embed([a.title, (a.concepts || []).map((c) => c.label || c.id).join(" "), a.content].join(" "));
        const vb = this.embed([b.title, (b.concepts || []).map((c) => c.label || c.id).join(" "), b.content].join(" "));
        return cosim(va, vb);
      }
    };
    vector_search_default = VectorSearch;
  }
});

// src/modules/search-ui.js
var search_ui_exports = {};
__export(search_ui_exports, {
  SearchUI: () => SearchUI,
  default: () => search_ui_default
});
var SearchUI, search_ui_default;
var init_search_ui = __esm({
  "src/modules/search-ui.js"() {
    init_helpers();
    SearchUI = class {
      constructor(options = {}) {
        this.modal = null;
        this.input = null;
        this.resultsContainer = null;
        this.skeleton = null;
        this.placeholder = null;
        this.statusEl = null;
        this.modeButtons = null;
        this.currentMode = "hybrid";
        this.searchService = options.searchService || null;
        this.onSearchComplete = options.onSearchComplete || null;
        this.init();
      }
      init() {
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", () => this.setup());
        } else {
          this.setup();
        }
      }
      setup() {
        this.modal = document.getElementById("semantic-search-modal");
        if (!this.modal) return;
        this.input = document.getElementById("semantic-search-input");
        this.resultsContainer = document.getElementById("search-results");
        this.skeleton = document.getElementById("results-skeleton");
        this.placeholder = document.getElementById("results-placeholder");
        this.statusEl = document.getElementById("search-status");
        this.modeButtons = document.querySelectorAll(".mode-btn");
        this.modelInfo = document.getElementById("model-info");
        this.indexInfo = document.getElementById("index-info");
        this.bindEvents();
        this.updateStatus("ready");
      }
      bindEvents() {
        const closeButtons = document.querySelectorAll("[data-close-modal]");
        closeButtons.forEach((btn) => {
          btn.addEventListener("click", () => this.closeModal());
        });
        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape" && this.isOpen()) {
            this.closeModal();
          }
        });
        if (this.input) {
          this.input.addEventListener("input", debounce((e) => {
            this.handleSearch(e.target.value);
          }, 300));
          this.modal.addEventListener("transitionend", () => {
            if (this.isOpen()) {
              this.input.focus();
            }
          });
        }
        this.modeButtons.forEach((btn) => {
          btn.addEventListener("click", () => {
            this.setMode(btn.dataset.mode);
          });
        });
        document.addEventListener("open-semantic-search", () => {
          this.openModal();
        });
      }
      setMode(mode) {
        this.currentMode = mode;
        this.modeButtons.forEach((btn) => {
          btn.classList.toggle("active", btn.dataset.mode === mode);
        });
        if (this.input && this.input.value.trim()) {
          this.handleSearch(this.input.value);
        }
      }
      async handleSearch(query) {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) {
          this.showPlaceholder();
          return;
        }
        if (!this.searchService) {
          console.warn("Search service not available");
          return;
        }
        this.showLoading();
        this.updateStatus("loading");
        try {
          const results = await this.searchService.search(trimmedQuery, {
            mode: this.currentMode,
            limit: 10
          });
          this.renderResults(results);
          this.updateStatus("ready");
          if (this.onSearchComplete) {
            this.onSearchComplete(results);
          }
        } catch (error2) {
          console.error("Search error:", error2);
          this.showError(error2.message);
          this.updateStatus("error");
        }
      }
      showLoading() {
        if (this.placeholder) this.placeholder.hidden = true;
        if (this.resultsContainer) {
          const results = this.resultsContainer.querySelectorAll(".search-result-item");
          results.forEach((r) => r.remove());
        }
        if (this.skeleton) this.skeleton.hidden = false;
      }
      showPlaceholder() {
        if (this.skeleton) this.skeleton.hidden = true;
        if (this.placeholder) this.placeholder.hidden = false;
        if (this.resultsContainer) {
          const results = this.resultsContainer.querySelectorAll(".search-result-item");
          results.forEach((r) => r.remove());
        }
      }
      showError(message) {
        if (this.skeleton) this.skeleton.hidden = true;
        if (this.placeholder) this.placeholder.hidden = true;
        if (this.resultsContainer) {
          const errorEl = document.createElement("div");
          errorEl.className = "results-error";
          errorEl.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 8v4m0 4h.01"></path>
        </svg>
        <p>Error: ${message}</p>
      `;
          const results = this.resultsContainer.querySelectorAll(".search-result-item");
          results.forEach((r) => r.remove());
          this.resultsContainer.appendChild(errorEl);
        }
      }
      renderResults(results) {
        if (this.skeleton) this.skeleton.hidden = true;
        if (this.placeholder) this.placeholder.hidden = true;
        if (!results || results.length === 0) {
          this.showPlaceholder();
          return;
        }
        const template = document.getElementById("result-item-template");
        results.forEach((result, index) => {
          const clone = template.content.cloneNode(true);
          const item = clone.querySelector(".search-result-item");
          const titleEl = clone.querySelector(".result-title");
          titleEl.textContent = result.title || "Untitled";
          const scoreEl = clone.querySelector(".relevance-score");
          const score = Math.round((result.score || 0) * 100);
          scoreEl.textContent = `${score}%`;
          const badge = clone.querySelector(".relevance-badge");
          if (score >= 80) {
            badge.style.background = "rgba(72, 187, 120, 0.15)";
            badge.style.color = "#48bb78";
          } else if (score >= 60) {
            badge.style.background = "rgba(237, 137, 54, 0.15)";
            badge.style.color = "#ed8936";
          }
          const excerptEl = clone.querySelector(".result-excerpt");
          excerptEl.textContent = result.excerpt || "";
          const dateEl = clone.querySelector(".result-date");
          if (result.date) {
            dateEl.textContent = new Date(result.date).toLocaleDateString();
          }
          const categoryEl = clone.querySelector(".result-category");
          if (result.category) {
            categoryEl.textContent = result.category;
          }
          const linkEl = clone.querySelector(".result-link");
          if (result.url) {
            linkEl.href = result.url;
          }
          item.style.opacity = "0";
          item.style.transform = "translateY(10px)";
          item.style.transition = `opacity 0.2s ease ${index * 0.05}s, transform 0.2s ease ${index * 0.05}s`;
          this.resultsContainer.appendChild(item);
          requestAnimationFrame(() => {
            item.style.opacity = "1";
            item.style.transform = "translateY(0)";
          });
        });
      }
      updateStatus(status) {
        if (!this.statusEl) return;
        const indicator = this.statusEl.querySelector(".status-indicator");
        const text = this.statusEl.querySelector(".status-text");
        this.statusEl.setAttribute("data-status", status);
        indicator.setAttribute("data-status", status);
        const statusTexts = {
          ready: "Ready",
          loading: "Searching...",
          error: "Error"
        };
        text.textContent = statusTexts[status] || status;
      }
      updateIndexInfo(count) {
        if (this.indexInfo) {
          this.indexInfo.textContent = `${count} posts`;
        }
      }
      updateModelInfo(modelName) {
        if (this.modelInfo) {
          this.modelInfo.textContent = modelName;
        }
      }
      openModal() {
        if (!this.modal) return;
        this.modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        setTimeout(() => {
          if (this.input) this.input.focus();
        }, 100);
      }
      closeModal() {
        if (!this.modal) return;
        this.modal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        setTimeout(() => {
          if (this.input) this.input.value = "";
          this.showPlaceholder();
        }, 200);
      }
      isOpen() {
        return this.modal && this.modal.getAttribute("aria-hidden") === "false";
      }
      toggle() {
        if (this.isOpen()) {
          this.closeModal();
        } else {
          this.openModal();
        }
      }
      destroy() {
        this.modal = null;
        this.input = null;
        this.resultsContainer = null;
      }
    };
    search_ui_default = SearchUI;
  }
});

// src/services/prefetch.js
var prefetch_exports = {};
__export(prefetch_exports, {
  PrefetchService: () => PrefetchService,
  default: () => prefetch_default
});
var DEFAULT_OPTIONS, PrefetchService, prefetch_default;
var init_prefetch = __esm({
  "src/services/prefetch.js"() {
    DEFAULT_OPTIONS = {
      graphUrl: "/assets/data/knowledge-graph.json",
      maxPrefetch: 2,
      hoverDelayMs: 120,
      concurrency: 2,
      respectSaveData: true,
      respectReducedMotion: false,
      observeViewport: true,
      enabled: true,
      // Test/non-browser override of document (jsdom)
      _doc: typeof document !== "undefined" ? document : null,
      // Test/non-browser override of fetch
      _fetch: typeof fetch !== "undefined" ? fetch : null
    };
    PrefetchService = class {
      /**
       * @param {Object} [options]
       * @param {string} [options.graphUrl]
       * @param {number} [options.maxPrefetch] Max related links to prefetch per page
       * @param {number} [options.hoverDelayMs] Debounce before hover-triggered prefetch
       * @param {number} [options.concurrency] Max concurrent prefetches
       * @param {boolean} [options.respectSaveData] Skip prefetch when Data-Saver is on
       * @param {boolean} [options.observeViewport] Prefetch links entering the viewport
       * @param {Document} [options._doc] Inject document (testing)
       * @param {Function} [options._fetch] Inject fetch (testing)
       */
      constructor(options = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
        this.adjacency = /* @__PURE__ */ new Map();
        this.graphLoaded = false;
        this.currentUrl = "";
        this._inflight = /* @__PURE__ */ new Set();
        this._scheduled = /* @__PURE__ */ new Set();
        this._hoverTimers = /* @__PURE__ */ new Map();
        this._observer = null;
      }
      /**
       * Build an adjacency map: postId -> [{url, weight}] sorted by edge strength.
       * Pure function (no DOM) so it is unit-testable.
       * @private
       * @param {{nodes?:Array, edges?:Array}} graph
       * @returns {Map<string, Array<{url:string, weight:number}>>}
       */
      _buildAdjacency(graph) {
        const adj = /* @__PURE__ */ new Map();
        if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
          return adj;
        }
        const urlById = /* @__PURE__ */ new Map();
        for (const n of graph.nodes) {
          if (n && n.id != null) urlById.set(String(n.id), n.url || `#${n.id}`);
        }
        for (const e of graph.edges) {
          if (!e || e.source == null || e.target == null) continue;
          const sUrl = urlById.get(String(e.source));
          const tUrl = urlById.get(String(e.target));
          if (!sUrl || !tUrl) continue;
          const weight = Number.isFinite(e.strength) ? e.strength : 1;
          if (!adj.has(sUrl)) adj.set(sUrl, []);
          if (!adj.has(tUrl)) adj.set(tUrl, []);
          adj.get(sUrl).push({ url: tUrl, weight });
          adj.get(tUrl).push({ url: sUrl, weight });
        }
        for (const [url, list] of adj) {
          const seen = /* @__PURE__ */ new Set();
          const merged = [];
          for (const item of list.sort((a, b) => b.weight - a.weight)) {
            if (seen.has(item.url)) continue;
            seen.add(item.url);
            merged.push(item);
          }
          adj.set(url, merged);
        }
        return adj;
      }
      /**
       * Resolve the current page URL to the canonical form used in the graph.
       * @private
       * @returns {string}
       */
      _resolveCurrentUrl() {
        if (this.currentUrl) return this.currentUrl;
        const doc = this.options._doc;
        if (!doc || !doc.location) return "";
        try {
          const u = new URL(doc.location.href);
          return u.pathname.replace(/\/$/, "") || "/";
        } catch (e) {
          return doc.location.pathname || "";
        }
      }
      /**
       * Load the knowledge graph and build adjacency.
       * @returns {Promise<boolean>} true if loaded successfully
       */
      async init() {
        if (!this.options.enabled) return false;
        const doc = this.options._doc;
        const fetchFn = this.options._fetch;
        if (!doc || !fetchFn) return false;
        if (this.options.respectSaveData && this._isSaveData()) return false;
        try {
          const res = await fetchFn(this.options.graphUrl);
          if (!res.ok) return false;
          const graph = await res.json();
          this.adjacency = this._buildAdjacency(graph);
          this.graphLoaded = true;
          this.currentUrl = this._resolveCurrentUrl();
          if (this.options.observeViewport && doc.IntersectionObserver) {
            this._observeVisibleLinks();
          }
          return true;
        } catch (e) {
          this.graphLoaded = false;
          return false;
        }
      }
      /**
       * Detect Data-Saver preference (Chromium). Best-effort, never throws.
       * @private
       */
      _isSaveData() {
        const conn = typeof navigator !== "undefined" && navigator.connection || {};
        return !!conn.saveData;
      }
      /**
       * Return the top-N related article URLs for the current (or given) page.
       * @param {string} [url] override current url
       * @param {number} [limit]
       * @returns {Array<{url:string, weight:number}>}
       */
      getRelated(url, limit = this.options.maxPrefetch) {
        const key = url || this.currentUrl || this._resolveCurrentUrl();
        const list = this.adjacency.get(key) || [];
        return list.slice(0, limit);
      }
      /**
       * Prefetch a single URL by injecting <link rel="prefetch">.
       * Respects concurrency + already-inflight dedup.
       * @param {string} url
       * @returns {boolean} true if a prefetch was scheduled
       */
      prefetch(url) {
        const doc = this.options._doc;
        if (!doc || !url) return false;
        if (this._scheduled.has(url)) return false;
        if (this.options.respectSaveData && this._isSaveData()) return false;
        if (this._inflight.size >= this.options.concurrency) return false;
        this._scheduled.add(url);
        this._inflight.add(url);
        try {
          const link = doc.createElement("link");
          link.rel = "prefetch";
          link.href = url;
          link.as = "document";
          (doc.head || doc.documentElement).appendChild(link);
          return true;
        } catch (e) {
          this._scheduled.delete(url);
          this._inflight.delete(url);
          return false;
        }
      }
      /**
       * Prefetch the related articles for the current page (capped by maxPrefetch).
       * @param {string} [url]
       * @returns {number} count scheduled
       */
      prefetchRelated(url, limit = this.options.maxPrefetch) {
        const related = this.getRelated(url, limit);
        let scheduled = 0;
        for (const r of related) {
          if (this.prefetch(r.url)) scheduled++;
        }
        return scheduled;
      }
      /**
       * Attach hover/focus listeners to in-page links so related pages prefetch
       * when the user shows intent to navigate.
       * @param {HTMLElement} [root]
       */
      observeLinks(root) {
        const doc = this.options._doc;
        if (!doc || !this.graphLoaded) return;
        const scope = root || doc;
        const links = scope.querySelectorAll ? scope.querySelectorAll('a[href^="/"], a[href^="./"]') : [];
        links.forEach((a) => {
          if (a.__prefetchBound) return;
          a.__prefetchBound = true;
          const href = a.getAttribute("href");
          const handler = () => this._scheduleHover(href);
          a.addEventListener("mouseenter", handler);
          a.addEventListener("focus", handler);
          a.addEventListener("mouseleave", () => this._cancelHover(href));
          a.addEventListener("blur", () => this._cancelHover(href));
        });
      }
      /**
       * Debounced hover handler.
       * @private
       */
      _scheduleHover(href) {
        this._cancelHover(href);
        const t = setTimeout(() => {
          this._hoverTimers.delete(href);
          this.prefetch(href);
        }, this.options.hoverDelayMs);
        this._hoverTimers.set(href, t);
      }
      _cancelHover(href) {
        const t = this._hoverTimers.get(href);
        if (t) {
          clearTimeout(t);
          this._hoverTimers.delete(href);
        }
      }
      /**
       * Prefetch links that scroll into the viewport (intent prediction).
       * @private
       */
      _observeVisibleLinks() {
        const doc = this.options._doc;
        if (!doc.IntersectionObserver) return;
        const seen = /* @__PURE__ */ new Set();
        this._observer = new doc.IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && entry.target.href) {
              const href = entry.target.href;
              if (!seen.has(href)) {
                seen.add(href);
                this.prefetch(href);
              }
            }
          }
        }, { rootMargin: "200px" });
        const links = doc.querySelectorAll ? doc.querySelectorAll('a[href^="/"]') : [];
        links.forEach((a) => this._observer.observe(a));
      }
      /**
       * Tear down listeners + observer.
       */
      destroy() {
        for (const t of this._hoverTimers.values()) clearTimeout(t);
        this._hoverTimers.clear();
        if (this._observer && this._observer.disconnect) this._observer.disconnect();
        this._observer = null;
        this._inflight.clear();
        this._scheduled.clear();
      }
    };
    prefetch_default = PrefetchService;
  }
});

// src/index.js
init_constants();
init_helpers();

// src/utils/storage.js
init_constants();
function isLocalStorageAvailable() {
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
  }
  {
    return false;
  }
}
function isSessionStorageAvailable() {
  try {
    const test = "__storage_test__";
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch (e) {
  }
  {
    return false;
  }
}
var LocalStorage = class {
  constructor(prefix = "") {
    this.prefix = prefix;
    this.available = isLocalStorageAvailable();
    if (!this.available) {
      console.warn("localStorage is not available, using in-memory fallback");
      this.memory = /* @__PURE__ */ new Map();
    }
  }
  /**
   * Get prefixed key
   * @param {string} key - Original key
   * @returns {string} Prefixed key
   */
  _getKey(key) {
    return this.prefix ? `${this.prefix}:${key}` : key;
  }
  /**
   * Get item from storage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Stored value or default
   */
  get(key, defaultValue = null) {
    const prefixedKey = this._getKey(key);
    try {
      const item = this.available ? localStorage.getItem(prefixedKey) : this.memory.get(prefixedKey);
      if (item === null || item === void 0) {
        return defaultValue;
      }
      try {
        return JSON.parse(item);
      } catch (e) {
        return item;
      }
    } catch (e) {
    }
    {
      console.error(`Error reading from localStorage: ${error}`);
      return defaultValue;
    }
  }
  /**
   * Set item in storage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} Success status
   */
  set(key, value) {
    const prefixedKey = this._getKey(key);
    try {
      if (value === void 0) {
        this.remove(key);
        return true;
      }
      const serialized = typeof value === "string" ? value : JSON.stringify(value);
      if (this.available) {
        localStorage.setItem(prefixedKey, serialized);
      } else {
        this.memory.set(prefixedKey, serialized);
      }
      return true;
    } catch (e) {
    }
    {
      console.error(`Error writing to localStorage: ${error}`);
      return false;
    }
  }
  /**
   * Remove item from storage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  remove(key) {
    const prefixedKey = this._getKey(key);
    try {
      if (this.available) {
        localStorage.removeItem(prefixedKey);
      } else {
        this.memory.delete(prefixedKey);
      }
      return true;
    } catch (e) {
    }
    {
      console.error(`Error removing from localStorage: ${error}`);
      return false;
    }
  }
  /**
   * Clear all items with prefix
   * @returns {boolean} Success status
   */
  clear() {
    try {
      if (this.available) {
        if (this.prefix) {
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key == null ? void 0 : key.startsWith(this.prefix)) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((key) => localStorage.removeItem(key));
        } else {
          localStorage.clear();
        }
      } else {
        this.memory.clear();
      }
      return true;
    } catch (e) {
    }
    {
      console.error(`Error clearing localStorage: ${error}`);
      return false;
    }
  }
  /**
   * Get all keys with prefix
   * @returns {string[]} Array of keys
   */
  keys() {
    try {
      const allKeys = this.available ? Object.keys(localStorage) : Array.from(this.memory.keys());
      return this.prefix ? allKeys.filter((k) => k.startsWith(this.prefix)) : allKeys;
    } catch (e) {
    }
    {
      console.error(`Error getting keys from localStorage: ${error}`);
      return [];
    }
  }
  /**
   * Get length
   * @returns {number} Number of items
   */
  length() {
    try {
      return this.available ? localStorage.length : this.memory.size;
    } catch (e) {
    }
    {
      console.error(`Error getting localStorage length: ${error}`);
      return 0;
    }
  }
};
var SessionStorage = class extends LocalStorage {
  constructor(prefix = "") {
    super(prefix);
    this.available = isSessionStorageAvailable();
    if (!this.available) {
      console.warn("sessionStorage is not available, using in-memory fallback");
      this.memory = /* @__PURE__ */ new Map();
    }
  }
  /**
   * Get item from session storage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Stored value or default
   */
  get(key, defaultValue = null) {
    const prefixedKey = this._getKey(key);
    try {
      const item = this.available ? sessionStorage.getItem(prefixedKey) : this.memory.get(prefixedKey);
      if (item === null || item === void 0) {
        return defaultValue;
      }
      try {
        return JSON.parse(item);
      } catch (e) {
        return item;
      }
    } catch (e) {
    }
    {
      console.error(`Error reading from sessionStorage: ${error}`);
      return defaultValue;
    }
  }
  /**
   * Set item in session storage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} Success status
   */
  set(key, value) {
    const prefixedKey = this._getKey(key);
    try {
      const serialized = typeof value === "string" ? value : JSON.stringify(value);
      if (this.available) {
        sessionStorage.setItem(prefixedKey, serialized);
      } else {
        this.memory.set(prefixedKey, serialized);
      }
      return true;
    } catch (e) {
    }
    {
      console.error(`Error writing to sessionStorage: ${error}`);
      return false;
    }
  }
  /**
   * Remove item from session storage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  remove(key) {
    const prefixedKey = this._getKey(key);
    try {
      if (this.available) {
        sessionStorage.removeItem(prefixedKey);
      } else {
        this.memory.delete(prefixedKey);
      }
      return true;
    } catch (e) {
    }
    {
      console.error(`Error removing from sessionStorage: ${error}`);
      return false;
    }
  }
  /**
   * Clear all items with prefix
   * @returns {boolean} Success status
   */
  clear() {
    try {
      if (this.available) {
        if (this.prefix) {
          const keysToRemove = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key == null ? void 0 : key.startsWith(this.prefix)) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((key) => sessionStorage.removeItem(key));
        } else {
          sessionStorage.clear();
        }
      } else {
        this.memory.clear();
      }
      return true;
    } catch (e) {
    }
    {
      console.error(`Error clearing sessionStorage: ${error}`);
      return false;
    }
  }
  /**
   * Get all keys with prefix
   * @returns {string[]} Array of keys
   */
  keys() {
    try {
      const allKeys = this.available ? Object.keys(sessionStorage) : Array.from(this.memory.keys());
      return this.prefix ? allKeys.filter((k) => k.startsWith(this.prefix)) : allKeys;
    } catch (e) {
    }
    {
      console.error(`Error getting keys from sessionStorage: ${error}`);
      return [];
    }
  }
  /**
   * Get length
   * @returns {number} Number of items
   */
  length() {
    try {
      return this.available ? sessionStorage.length : this.memory.size;
    } catch (e) {
    }
    {
      console.error(`Error getting sessionStorage length: ${error}`);
      return 0;
    }
  }
};
var themeStorage = new LocalStorage(DEFAULT_CONFIG.STORAGE.THEME);
var languageStorage = new LocalStorage(DEFAULT_CONFIG.STORAGE.LANGUAGE);

// src/core/theme-manager.js
init_constants();
var ThemeManager = class {
  /**
   * Create ThemeManager instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      container: ".theme-toggle",
      themes: DEFAULT_CONFIG.THEMES,
      defaultTheme: DEFAULT_CONFIG.DEFAULT_THEME,
      storageKey: DEFAULT_CONFIG.STORAGE.THEME,
      transitionDuration: "300ms",
      ...options
    };
    this.storage = new LocalStorage("");
    this.currentTheme = this.getStoredTheme() || this.options.defaultTheme;
    this.container = null;
    this.init();
  }
  /**
   * Initialize theme system
   */
  init() {
    this.setupContainer();
    this.applyTheme(this.currentTheme);
    this.bindEvents();
    this.setupSystemPreferenceListener();
  }
  /**
   * Setup theme toggle container
   */
  setupContainer() {
    this.container = document.querySelector(this.options.container);
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.className = "theme-toggle";
      document.body.appendChild(this.container);
    }
    this.render();
  }
  /**
   * Render theme toggle UI
   */
  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="theme-toggle-container" role="group" aria-label="${ARIA_LABELS.THEME_SWITCHER}">
        <button 
          class="theme-btn theme-btn--light" 
          data-theme="light"
          aria-label="Light theme"
          title="Light theme"
        >
          <span class="theme-icon">\u2600\uFE0F</span>
          <span class="theme-label" data-i18n="theme.light">Light</span>
        </button>
        
        <button 
          class="theme-btn theme-btn--dark" 
          data-theme="dark"
          aria-label="Dark theme"
          title="Dark theme"
        >
          <span class="theme-icon">\u{1F319}</span>
          <span class="theme-label" data-i18n="theme.dark">Dark</span>
        </button>
        
        <button 
          class="theme-btn theme-btn--auto" 
          data-theme="auto"
          aria-label="Auto theme (system preference)"
          title="Auto theme (system preference)"
        >
          <span class="theme-icon">\u{1F313}</span>
          <span class="theme-label" data-i18n="theme.auto">Auto</span>
        </button>
      </div>
    `;
    this.updateActiveState();
  }
  /**
   * Get stored theme from localStorage
   * @returns {string|null} Stored theme
   */
  getStoredTheme() {
    return this.storage.get(this.options.storageKey);
  }
  /**
   * Store theme preference
   * @param {string} theme - Theme to store
   */
  storeTheme(theme) {
    this.storage.set(this.options.storageKey, theme);
  }
  /**
   * Apply theme to document
   * @param {string} theme - Theme to apply
   */
  applyTheme(theme) {
    const htmlElement = document.documentElement;
    const actualTheme = this.resolveTheme(theme);
    htmlElement.classList.remove(CSS_CLASSES.THEME_LIGHT, CSS_CLASSES.THEME_DARK);
    htmlElement.classList.add(`theme-${actualTheme}`);
    htmlElement.setAttribute("data-theme", actualTheme);
    this.updateMetaThemeColor(actualTheme);
    this.trackThemeChange(theme, actualTheme);
    if (theme !== "auto") {
      this.storeTheme(theme);
    }
  }
  /**
   * Resolve actual theme (for auto)
   * @param {string} theme - Requested theme
   * @returns {string} Resolved theme
   */
  resolveTheme(theme) {
    if (theme === "auto") {
      return this.getSystemPreference();
    }
    return theme;
  }
  /**
   * Get system color scheme preference
   * @returns {string} 'light' or 'dark'
   */
  getSystemPreference() {
    var _a;
    if ((_a = window.matchMedia) == null ? void 0 : _a.call(window, "(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  }
  /**
   * Update meta theme-color
   * @param {string} theme - Current theme
   */
  updateMetaThemeColor(theme) {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) return;
    const colors = {
      light: "#ffffff",
      dark: "#1a1a1a",
      auto: this.resolveTheme("auto") === "dark" ? "#1a1a1a" : "#ffffff"
    };
    metaThemeColor.setAttribute("content", colors[theme] || colors.light);
  }
  /**
   * Bind events
   */
  bindEvents() {
    if (!this.container) return;
    this.container.addEventListener("click", (e) => {
      const button = e.target.closest(".theme-btn");
      if (button) {
        const theme = button.dataset.theme;
        this.setTheme(theme);
      }
    });
    this.container.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        this.handleArrowNavigation(e);
      }
      if (e.key === "Enter" || e.key === " ") {
        const button = e.target.closest(".theme-btn");
        if (button) {
          e.preventDefault();
          button.click();
        }
      }
    });
  }
  /**
   * Handle arrow key navigation
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleArrowNavigation(e) {
    const buttons = Array.from(this.container.querySelectorAll(".theme-btn"));
    const currentBtn = this.container.querySelector(".theme-btn.active");
    const currentIndex = buttons.indexOf(currentBtn);
    let nextIndex;
    if (e.key === "ArrowLeft") {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
    } else {
      nextIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
    }
    buttons[nextIndex].focus();
    buttons[nextIndex].click();
  }
  /**
   * Setup system preference listener
   */
  setupSystemPreferenceListener() {
    var _a;
    const mediaQuery = (_a = window.matchMedia) == null ? void 0 : _a.call(window, "(prefers-color-scheme: dark)");
    if (!mediaQuery) return;
    mediaQuery.addEventListener("change", () => {
      if (this.currentTheme === "auto") {
        this.applyTheme("auto");
      }
    });
  }
  /**
   * Set theme
   * @param {string} theme - Theme to set
   */
  setTheme(theme) {
    if (!this.options.themes.includes(theme)) {
      console.warn(`Invalid theme: ${theme}`);
      return;
    }
    this.currentTheme = theme;
    this.applyTheme(theme);
    this.storeTheme(theme);
    this.updateActiveState();
    this.announceThemeChange(theme);
  }
  /**
   * Update active button state
   */
  updateActiveState() {
    var _a;
    const buttons = (_a = this.container) == null ? void 0 : _a.querySelectorAll(".theme-btn");
    if (!buttons) return;
    buttons.forEach((button) => {
      const isActive = button.dataset.theme === this.currentTheme;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", isActive.toString());
    });
  }
  /**
   * Announce theme change for screen readers
   * @param {string} theme - New theme
   */
  announceThemeChange(theme) {
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", "polite");
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = `Theme changed to ${theme}`;
    document.body.appendChild(announcement);
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1e3);
  }
  /**
   * Track theme change
   * @param {string} preference - User preference
   * @param {string} actual - Actual applied theme
   */
  trackThemeChange(preference, actual) {
    if (typeof gtag !== "undefined") {
      gtag("event", "theme_change", {
        preference,
        actual,
        system_preference: this.getSystemPreference()
      });
    }
    this.sendCustomAnalytics("theme_change", {
      preference,
      actual,
      system_preference: this.getSystemPreference(),
      timestamp: Date.now()
    });
  }
  /**
   * Send custom analytics
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  sendCustomAnalytics(event, data) {
    if (!navigator.sendBeacon) return;
    try {
      navigator.sendBeacon("/api/analytics", JSON.stringify({ event, data }));
    } catch (e) {
    }
  }
  /**
   * Get current theme
   * @returns {string} Current theme
   */
  getCurrentTheme() {
    return this.currentTheme;
  }
  /**
   * Get resolved theme
   * @returns {string} Resolved theme
   */
  getResolvedTheme() {
    return this.resolveTheme(this.currentTheme);
  }
  /**
   * Toggle between themes
   */
  toggleTheme() {
    const currentIndex = this.options.themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % this.options.themes.length;
    const nextTheme = this.options.themes[nextIndex];
    this.setTheme(nextTheme);
  }
  /**
   * Reset to default theme
   */
  resetTheme() {
    this.setTheme(this.options.defaultTheme);
  }
  /**
   * Destroy theme manager
   */
  destroy() {
    var _a;
    (_a = this.container) == null ? void 0 : _a.remove();
    this.container = null;
  }
};
if (typeof document !== "undefined" && typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    window.themeManager = new ThemeManager({
      container: ".theme-toggle",
      themes: DEFAULT_CONFIG.THEMES,
      defaultTheme: DEFAULT_CONFIG.DEFAULT_THEME
    });
  });
}

// src/modules/i18n.js
init_constants();
var I18nManager = class {
  /**
   * Create I18nManager instance
   */
  constructor() {
    this.storage = new LocalStorage(DEFAULT_CONFIG.STORAGE.LANGUAGE);
    this.currentLang = this.getStoredLanguage() || this.getBrowserLanguage();
    this.translations = {};
    this.isLoaded = false;
    this.init();
  }
  /**
   * Initialize i18n system
   */
  async init() {
    try {
      await this.loadTranslations(this.currentLang);
      this.setupLanguageSwitcher();
      this.applyTranslations();
      this.isLoaded = true;
      document.documentElement.setAttribute("data-lang", this.currentLang);
      document.dispatchEvent(new CustomEvent(EVENT_NAMES.I18N_LOADED, {
        detail: { language: this.currentLang }
      }));
    } catch (error2) {
      console.error("Failed to initialize i18n:", error2);
    }
  }
  /**
   * Get stored language from localStorage
   * @returns {string|null} Stored language
   */
  getStoredLanguage() {
    return this.storage.get("lang");
  }
  /**
   * Get browser language
   * @returns {string} Browser language code
   */
  getBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    return browserLang.startsWith("ru") ? "ru" : "en";
  }
  /**
   * Load translations for language
   * @param {string} lang - Language code
   * @returns {Promise<Object>} Translations object
   */
  async loadTranslations(lang) {
    if (this.translations[lang]) {
      return this.translations[lang];
    }
    try {
      const response = await fetch(`/assets/i18n/${lang}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load translations for ${lang}`);
      }
      this.translations[lang] = await response.json();
      return this.translations[lang];
    } catch (error2) {
      console.error(`Error loading translations for ${lang}:`, error2);
      if (lang !== "en") {
        return await this.loadTranslations("en");
      }
      throw error2;
    }
  }
  /**
   * Switch to different language
   * @param {string} lang - Target language code
   */
  async switchLanguage(lang) {
    if (lang === this.currentLang) return;
    try {
      this.showLoadingState();
      await this.loadTranslations(lang);
      this.currentLang = lang;
      this.storage.set("lang", lang);
      this.applyTranslations();
      this.updateLanguageSwitcher();
      document.documentElement.setAttribute("data-lang", lang);
      document.documentElement.setAttribute("lang", lang);
      document.dispatchEvent(new CustomEvent(EVENT_NAMES.I18N_LANGUAGE_CHANGED, {
        detail: { language: lang }
      }));
      this.hideLoadingState();
    } catch (error2) {
      console.error(`Failed to switch language to ${lang}:`, error2);
      this.hideLoadingState();
    }
  }
  /**
   * Apply translations to DOM elements
   */
  applyTranslations() {
    const elements = document.querySelectorAll("[data-i18n]");
    const currentTranslations = this.translations[this.currentLang];
    elements.forEach((element) => {
      const key = element.getAttribute("data-i18n");
      const translation = this.getNestedValue(currentTranslations, key);
      if (translation) {
        if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
          element.placeholder = translation;
        } else if (element.tagName === "IMG") {
          element.alt = translation;
        } else if (element.title) {
          element.title = translation;
        } else {
          element.textContent = translation;
        }
      }
    });
    this.updateAccessibilityAttributes(currentTranslations);
  }
  /**
   * Get nested object value by dot notation
   * @param {Object} obj - Object to search
   * @param {string} key - Dot-notation key
   * @returns {*} Value or null
   */
  getNestedValue(obj, key) {
    if (!obj || !key) return null;
    return key.split(".").reduce((current, keyPart) => {
      return current && current[keyPart] !== void 0 ? current[keyPart] : null;
    }, obj);
  }
  /**
   * Setup language switcher UI
   * @returns {Element} Language switcher element
   */
  setupLanguageSwitcher() {
    let switcher = document.querySelector(".language-switcher");
    if (!switcher) {
      switcher = document.createElement("div");
      switcher.className = "language-switcher";
      switcher.setAttribute("role", "group");
      switcher.setAttribute("aria-label", "Language selection");
      document.body.appendChild(switcher);
    }
    switcher.innerHTML = `
      <button type="button"
              class="lang-btn active"
              data-lang="en"
              aria-pressed="true"
              aria-label="Switch to English">
        EN
      </button>
      <button type="button"
              class="lang-btn"
              data-lang="ru"
              aria-pressed="false"
              aria-label="\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u043D\u0430 \u0440\u0443\u0441\u0441\u043A\u0438\u0439">
        RU
      </button>
    `;
    switcher.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const lang = btn.getAttribute("data-lang");
        this.switchLanguage(lang);
      });
    });
    return switcher;
  }
  /**
   * Update language switcher button states
   */
  updateLanguageSwitcher() {
    const switcher = document.querySelector(".language-switcher");
    if (!switcher) return;
    switcher.querySelectorAll(".lang-btn").forEach((btn) => {
      const lang = btn.getAttribute("data-lang");
      const isActive = lang === this.currentLang;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", isActive.toString());
    });
  }
  /**
   * Update accessibility attributes
   * @param {Object} translations - Translations object
   */
  updateAccessibilityAttributes(translations) {
    var _a, _b, _c;
    const skipLink = document.querySelector(".skip-link");
    if (skipLink && ((_a = translations.accessibility) == null ? void 0 : _a.skip_to_content)) {
      skipLink.textContent = translations.accessibility.skip_to_content;
    }
    const menuButton = document.querySelector(".menu-icon");
    if (menuButton) {
      const label = menuButton.classList.contains("active") ? (_b = translations.accessibility) == null ? void 0 : _b.close_menu : (_c = translations.accessibility) == null ? void 0 : _c.open_menu;
      if (label) menuButton.setAttribute("aria-label", label);
    }
  }
  /**
   * Show loading state during language switch
   */
  showLoadingState() {
    document.body.classList.add("i18n-loading");
    if (!document.querySelector(".i18n-loading-overlay")) {
      const overlay = document.createElement("div");
      overlay.className = "i18n-loading-overlay";
      overlay.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner"></div>
          <span>Loading...</span>
        </div>
      `;
      document.body.appendChild(overlay);
    }
  }
  /**
   * Hide loading state
   */
  hideLoadingState() {
    document.body.classList.remove("i18n-loading");
    const overlay = document.querySelector(".i18n-loading-overlay");
    if (overlay) overlay.remove();
  }
  /**
   * Get translation by key with parameter substitution
   * @param {string} key - Translation key
   * @param {Object} params - Parameters for substitution
   * @returns {string} Translated text
   */
  t(key, params = {}) {
    const translation = this.getNestedValue(
      this.translations[this.currentLang],
      key
    );
    if (!translation) return key;
    return Object.keys(params).reduce((text, param) => {
      return text.replace(new RegExp(`{{\\s*${param}\\s*}}`, "g"), params[param]);
    }, translation);
  }
  /**
   * Get current language
   * @returns {string} Current language code
   */
  getCurrentLanguage() {
    return this.currentLang;
  }
  /**
   * Get available languages
   * @returns {string[]} Array of language codes
   */
  getAvailableLanguages() {
    return ["en", "ru"];
  }
  /**
   * Check if i18n is ready
   * @returns {boolean} Ready status
   */
  isReady() {
    return this.isLoaded;
  }
  /**
   * Destroy i18n manager
   */
  destroy() {
    const overlay = document.querySelector(".i18n-loading-overlay");
    if (overlay) overlay.remove();
    const switcher = document.querySelector(".language-switcher");
    if (switcher) switcher.remove();
  }
};
if (typeof document !== "undefined" && typeof window !== "undefined") {
  window.i18n = new I18nManager();
  window.t = (key, params) => window.i18n.t(key, params);
}

// src/modules/image-optimizer.js
function getDevicePixelRatio() {
  return typeof window !== "undefined" && window.devicePixelRatio ? window.devicePixelRatio : 1;
}
var CONFIG = {
  // Lazy loading settings
  lazyLoading: {
    rootMargin: "50px 0px",
    threshold: 0.01
  },
  // Placeholder settings
  placeholder: {
    enableBlur: true,
    enableAspectRatio: true
  },
  // WebP settings
  webp: {
    enabled: true,
    patterns: [
      (url) => url.replace(/\.(jpg|jpeg|png)$/i, ".webp"),
      (url) => url.replace(/(\.[^.]+)$/, ".webp$1"),
      (url) => url.replace(/\/upload\//, "/upload/f_webp/")
    ]
  },
  // Responsive image settings
  responsive: {
    enabled: true,
    devicePixelRatio: getDevicePixelRatio()
  }
};
var ImageOptimizer = class {
  /**
   * Create an ImageOptimizer instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.observer = null;
    this.imageCache = /* @__PURE__ */ new Map();
    this.loadedImages = /* @__PURE__ */ new Set();
    this.isWebPSupported = this._checkWebPSupport();
    this.isIntersectionObserverSupported = "IntersectionObserver" in window;
    this.config = { ...CONFIG, ...options };
    this._init();
  }
  /**
   * Initialize image optimizer
   * @private
   */
  _init() {
    this._initLazyLoading();
    this._optimizeExistingImages();
    this._setupResponsiveImages();
    this._setupErrorHandling();
    if (this.config.debugMode) {
      console.log("Image optimizer initialized", {
        webPSupported: this.isWebPSupported,
        intersectionObserverSupported: this.isIntersectionObserverSupported
      });
    }
  }
  /**
   * Check WebP support
   * @returns {boolean} True if WebP is supported
   * @private
   */
  _checkWebPSupport() {
    try {
      if (typeof document === "undefined") return false;
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      if (typeof canvas.toDataURL !== "function") return false;
      const dataUrl = canvas.toDataURL("image/webp");
      return dataUrl.indexOf("data:image/webp") === 0;
    } catch (e) {
    }
    {
      return false;
    }
  }
  /**
   * Initialize lazy loading with Intersection Observer
   * @private
   */
  _initLazyLoading() {
    if (!this.isIntersectionObserverSupported) {
      this._loadAllImagesFallback();
      return;
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this._loadImage(entry.target);
            this.observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: this.config.lazyLoading.rootMargin,
        threshold: this.config.lazyLoading.threshold
      }
    );
    document.querySelectorAll("img[data-src]").forEach((img) => {
      this.observer.observe(img);
      this._addPlaceholders(img);
    });
  }
  /**
   * Add placeholders to images
   * @param {HTMLImageElement} img - Image element
   * @private
   */
  _addPlaceholders(img) {
    img.classList.add("loading");
    if (img.dataset.placeholder || img.dataset.blur) {
      this._createBlurPlaceholder(img);
    } else {
      this._createSimplePlaceholder(img);
    }
  }
  /**
   * Create blur-up placeholder
   * @param {HTMLImageElement} img - Image element
   * @private
   */
  _createBlurPlaceholder(img) {
    var _a;
    const placeholder = document.createElement("div");
    placeholder.className = "image-placeholder blur-placeholder";
    const blurHash = img.dataset.blur;
    if (blurHash) {
      placeholder.style.background = "linear-gradient(135deg, #f0f0f0, #e0e0e0)";
    } else {
      placeholder.style.background = "linear-gradient(135deg, #f8f9fa, #e9ecef)";
    }
    placeholder.style.paddingBottom = img.dataset.aspectRatio || "0";
    (_a = img.parentNode) == null ? void 0 : _a.insertBefore(placeholder, img);
    img.placeholder = placeholder;
    if (img.dataset.aspectRatio && this.config.placeholder.enableAspectRatio) {
      img.style.aspectRatio = img.dataset.aspectRatio;
    }
  }
  /**
   * Create simple placeholder
   * @param {HTMLImageElement} img - Image element
   * @private
   */
  _createSimplePlaceholder(img) {
    img.classList.add("loading");
    if (img.dataset.width) img.style.width = img.dataset.width;
    if (img.dataset.height) img.style.height = img.dataset.height;
    if (img.dataset.aspectRatio) img.style.aspectRatio = img.dataset.aspectRatio;
  }
  /**
   * Load a single image
   * @param {HTMLImageElement} img - Image element to load
   * @private
   */
  async _loadImage(img) {
    const src = this._getOptimizedSrc(img);
    if (!src || this.loadedImages.has(src)) return;
    try {
      const tempImg = new Image();
      tempImg.onload = () => {
        img.src = src;
        img.classList.remove("loading");
        img.classList.add("loaded");
        if (img.placeholder) {
          img.placeholder.remove();
          img.placeholder = null;
        }
        img.style.animation = "fadeIn 0.3s ease";
        this.imageCache.set(src, {
          width: tempImg.width,
          height: tempImg.height,
          aspectRatio: tempImg.width / tempImg.height
        });
        this.loadedImages.add(src);
      };
      tempImg.onerror = () => {
        this._handleImageError(img);
      };
      tempImg.src = src;
    } catch (e) {
    }
    {
      console.error("Failed to load image:", error);
      this._handleImageError(img);
    }
  }
  /**
   * Get optimized source URL for image
   * @param {HTMLImageElement} img - Image element
   * @returns {string|null} Optimized source URL
   * @private
   */
  _getOptimizedSrc(img) {
    const src = img.dataset.src || img.src;
    if (!src) return null;
    if (this.isWebPSupported && this.config.webp.enabled) {
      const webpSrc = this._getWebPSrc(src);
      if (webpSrc) return webpSrc;
    }
    if (img.dataset.srcset) {
      return this._getResponsiveSrc(img);
    }
    return src;
  }
  /**
   * Get WebP source URL
   * @param {string} originalSrc - Original image URL
   * @returns {string|null} WebP URL or null
   * @private
   */
  _getWebPSrc(originalSrc) {
    for (const pattern of this.config.webp.patterns) {
      const webpSrc = pattern(originalSrc);
      if (webpSrc && webpSrc !== originalSrc) {
        return webpSrc;
      }
    }
    return this.config.webp.patterns[0](originalSrc);
  }
  /**
   * Get responsive source URL
   * @param {HTMLImageElement} img - Image element
   * @returns {string} Selected responsive URL
   * @private
   */
  _getResponsiveSrc(img) {
    var _a, _b;
    const srcset = img.dataset.srcset;
    if (!srcset) return img.dataset.src || "";
    const containerWidth = ((_a = img.parentElement) == null ? void 0 : _a.offsetWidth) || window.innerWidth;
    const sources = srcset.split(",").map((source) => {
      const [url, width] = source.trim().split(" ");
      return {
        url: url.trim(),
        width: parseInt(width.replace("w", ""), 10)
      };
    });
    const idealWidth = containerWidth * this.config.responsive.devicePixelRatio;
    const selected = sources.reduce((prev, curr) => {
      if (!prev) return curr;
      return Math.abs(curr.width - idealWidth) < Math.abs(prev.width - idealWidth) ? curr : prev;
    }, null);
    return selected ? selected.url : ((_b = sources[0]) == null ? void 0 : _b.url) || "";
  }
  /**
   * Optimize existing images on page
   * @private
   */
  _optimizeExistingImages() {
    document.querySelectorAll("img:not([loading])").forEach((img) => {
      img.loading = "lazy";
      img.decoding = "async";
    });
    document.querySelectorAll("img:not([alt])").forEach((img) => {
      var _a, _b;
      const parentFigcaption = (_a = img.closest("figure")) == null ? void 0 : _a.querySelector("figcaption");
      const parentHeading = (_b = img.closest("section, article")) == null ? void 0 : _b.querySelector("h1, h2, h3, h4, h5, h6");
      if (parentFigcaption) {
        img.alt = parentFigcaption.textContent.trim();
      } else if (parentHeading) {
        img.alt = `Image related to: ${parentHeading.textContent.trim()}`;
      } else {
        img.alt = "Decorative image";
        img.role = "presentation";
      }
    });
  }
  /**
   * Setup responsive image handling
   * @private
   */
  _setupResponsiveImages() {
    document.querySelectorAll("img[data-sizes]").forEach((img) => {
      img.sizes = img.dataset.sizes;
    });
    document.querySelectorAll("picture").forEach((picture) => {
      this._optimizePictureElement(picture);
    });
  }
  /**
   * Optimize picture element
   * @param {HTMLPictureElement} picture - Picture element
   * @private
   */
  _optimizePictureElement(picture) {
    if (this.isWebPSupported && this.config.webp.enabled) {
      const existingSources = Array.from(picture.querySelectorAll("source"));
      existingSources.forEach((source) => {
        const webpSrcset = this._getWebPSrcSet(source.srcset);
        if (webpSrcset && !this._hasWebPSource(picture)) {
          const webpSource = document.createElement("source");
          webpSource.type = "image/webp";
          webpSource.srcset = webpSrcset;
          webpSource.sizes = source.sizes;
          picture.insertBefore(webpSource, source);
        }
      });
    }
  }
  /**
   * Convert srcset to WebP
   * @param {string} srcset - Source set string
   * @returns {string} WebP srcset
   * @private
   */
  _getWebPSrcSet(srcset) {
    return srcset.split(",").map((source) => {
      const [url, descriptor] = source.trim().split(" ");
      const webpUrl = this._getWebPSrc(url);
      return webpUrl ? `${webpUrl} ${descriptor}` : null;
    }).filter(Boolean).join(", ");
  }
  /**
   * Check if picture has WebP source
   * @param {HTMLPictureElement} picture - Picture element
   * @returns {boolean} True if WebP source exists
   * @private
   */
  _hasWebPSource(picture) {
    return Array.from(picture.querySelectorAll("source")).some(
      (source) => source.type === "image/webp"
    );
  }
  /**
   * Setup error handling for images
   * @private
   */
  _setupErrorHandling() {
    document.addEventListener(
      "error",
      (e) => {
        if (e.target.tagName === "IMG") {
          this._handleImageError(e.target);
        }
      },
      true
    );
  }
  /**
   * Handle image loading error
   * @param {HTMLImageElement} img - Image element
   * @private
   */
  _handleImageError(img) {
    img.classList.remove("loading");
    img.classList.add("error");
    if (img.dataset.fallback) {
      img.src = img.dataset.fallback;
      return;
    }
    this._createErrorPlaceholder(img);
  }
  /**
   * Create error placeholder
   * @param {HTMLImageElement} img - Image element
   * @private
   */
  _createErrorPlaceholder(img) {
    var _a;
    const errorDiv = document.createElement("div");
    errorDiv.className = "image-error";
    errorDiv.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 15"></polyline>
      </svg>
      <p>Image unavailable</p>
    `;
    (_a = img.parentNode) == null ? void 0 : _a.replaceChild(errorDiv, img);
  }
  /**
   * Fallback method to load all images immediately
   * @private
   */
  _loadAllImagesFallback() {
    document.querySelectorAll("img[data-src]").forEach((img) => {
      this._loadImage(img);
    });
  }
  /**
   * Preload an image
   * @param {string} src - Image source URL
   * @returns {Promise<Object>} Image metadata
   */
  preloadImage(src) {
    return new Promise((resolve, reject) => {
      if (this.imageCache.has(src)) {
        resolve(this.imageCache.get(src));
        return;
      }
      const img = new Image();
      img.onload = () => {
        const meta = {
          src,
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height
        };
        this.imageCache.set(src, meta);
        this.loadedImages.add(src);
        resolve(meta);
      };
      img.onerror = reject;
      img.src = src;
    });
  }
  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      size: this.imageCache.size,
      loadedCount: this.loadedImages.size,
      webPSupported: this.isWebPSupported,
      intersectionObserverSupported: this.isIntersectionObserverSupported
    };
  }
  /**
   * Clear image cache
   */
  clearCache() {
    this.imageCache.clear();
    this.loadedImages.clear();
  }
  /**
   * Destroy observer and cleanup
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.clearCache();
  }
};
if (typeof document !== "undefined" && typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.imageOptimizer = new ImageOptimizer();
    });
  } else {
    window.imageOptimizer = new ImageOptimizer();
  }
}

// src/modules/search-engine.js
init_constants();
init_helpers();
init_vector_search();
var SearchEngine = class {
  /**
   * Create SearchEngine instance
   */
  constructor() {
    this.searchIndex = null;
    this.posts = [];
    this.isInitialized = false;
    this.searchCache = /* @__PURE__ */ new Map();
    this.debounceTimer = null;
    this.keydownHandler = null;
    this.init();
  }
  /**
   * Initialize search engine
   */
  async init() {
    this.createSearchUI();
    await this.loadSearchIndex();
    this.setupEventListeners();
    this.isInitialized = true;
    console.log("Search engine initialized");
  }
  /**
   * Create search UI elements
   */
  createSearchUI() {
    let searchContainer = document.querySelector(".search-container");
    if (!searchContainer) {
      searchContainer = createElement("div", { class: "search-container" });
      searchContainer.innerHTML = `
        <div class="search-input-wrapper">
          <input 
            type="search" 
            class="search-input" 
            placeholder="Search articles..."
            data-search
            autocomplete="off"
            aria-label="Search articles"
          >
          <button class="search-clear" aria-label="Clear search" hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="search-results" role="region" aria-live="polite" aria-label="Search results">
          <div class="search-loading" hidden>
            <div class="search-spinner"></div>
            <span>Searching...</span>
          </div>
          <div class="search-empty" hidden>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <p>No results found</p>
            <p>Try different keywords or browse categories</p>
          </div>
        </div>
      `;
      const header = document.querySelector(".site-header");
      if (header) {
        header.after(searchContainer);
      } else {
        document.body.appendChild(searchContainer);
      }
    }
    this.searchInput = searchContainer.querySelector(".search-input");
    this.searchResults = searchContainer.querySelector(".search-results");
    this.clearButton = searchContainer.querySelector(".search-clear");
    this.loadingIndicator = searchContainer.querySelector(".search-loading");
    this.emptyState = searchContainer.querySelector(".search-empty");
  }
  /**
   * Format a date string for display (delegates to helpers.formatDate)
   * @param {string} date - ISO date string
   * @param {Object} [options] - Intl.DateTimeFormat options
   * @returns {string} Formatted date
   */
  formatDate(date, options) {
    const d = new Date(date);
    if (isNaN(d)) return String(date);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", ...options });
  }
  /**
   * Load search index from JSON file
   */
  async loadSearchIndex() {
    try {
      const response = await fetch("/search.json");
      if (!response.ok) throw new Error("Failed to load search index");
      const data = await response.json();
      const posts = Array.isArray(data) ? data : data.posts || data.entries || data.results || [];
      this.posts = posts.map((post) => ({
        ...post,
        title: post.title || "",
        content: post.content || "",
        excerpt: post.excerpt || "",
        url: post.url || "",
        date: post.date || "",
        tags: post.tags || [],
        categories: post.categories || [],
        concepts: post.concepts || []
      }));
      this.vectorIndex = new VectorSearch(this.posts);
      if (typeof lunr !== "undefined") {
        this.initializeLunrIndex();
      }
    } catch (error2) {
      console.error("Failed to load search index:", error2);
      this.showSearchError();
    }
  }
  /**
   * Initialize Lunr.js search index
   */
  initializeLunrIndex() {
    this.searchIndex = lunr(function() {
      this.ref("id");
      this.field("title", { boost: 10 });
      this.field("excerpt", { boost: 5 });
      this.field("content", { boost: 1 });
      this.field("tags", { boost: 8 });
      this.field("categories", { boost: 8 });
      this.posts.forEach((doc, idx) => {
        this.add({
          id: idx,
          title: doc.title,
          excerpt: doc.excerpt,
          content: doc.content,
          tags: doc.tags.join(" "),
          categories: doc.categories.join(" ")
        });
      });
    });
  }
  /**
   * Semantic (vector) search over the Content Model.
   * @param {string} query
   * @param {Object} [opts]
   * @returns {Array<{post: Object, score: number}>}
   */
  vectorSearch(query, opts = {}) {
    if (!this.vectorIndex) return [];
    return this.vectorIndex.search(query, opts);
  }
  /**
   * Unified search dispatcher for the Semantic Search UI.
   * @param {string} query
   * @param {Object} [opts]
   * @param {'hybrid'|'vector'|'keyword'} [opts.mode='hybrid']
   * @param {number} [opts.limit=10]
   * @returns {Array<{url,title,excerpt,date,category,score:number}>}
   */
  search(query, opts = {}) {
    const { mode = "hybrid", limit = 10 } = opts;
    const q = (query || "").trim();
    if (q.length < 2) return [];
    const withCategory = (post, score) => ({
      ...post,
      category: Array.isArray(post.categories) ? post.categories[0] : post.category || "",
      score
    });
    const keywordResults = () => {
      if (this.searchIndex) {
        return this.searchIndex.search(q).map((r) => withCategory(this.posts[r.ref], r.score));
      }
      return this.basicSearch(q).map((p) => withCategory(p, p.score || 0));
    };
    if (mode === "vector") {
      if (!this.vectorIndex) return [];
      return this.vectorIndex.search(q, { topK: limit }).map((r) => withCategory(r.post, r.score));
    }
    if (mode === "keyword") {
      return keywordResults().slice(0, limit);
    }
    const merged = /* @__PURE__ */ new Map();
    for (const r of keywordResults()) {
      merged.set(r.url, { ...r, score: (r.score || 0) * 0.5 });
    }
    if (this.vectorIndex) {
      for (const r of this.vectorIndex.search(q, { topK: limit })) {
        const existing = merged.get(r.post.url);
        if (existing) existing.score += r.score * 0.5;
        else merged.set(r.post.url, withCategory(r.post, r.score * 0.5));
      }
    }
    const values = [...merged.values()];
    const maxScore = values.reduce((m, r) => Math.max(m, r.score || 0), 0);
    if (maxScore > 0) values.forEach((r) => {
      r.score = (r.score || 0) / maxScore;
    });
    return values.sort((a, b) => b.score - a.score).slice(0, limit);
  }
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (!this.searchInput) return;
    const debouncedSearch = debounce(
      (value) => this.performSearch(value),
      DEFAULT_CONFIG.PERFORMANCE.DEBOUNCE_DELAY
    );
    this.searchInput.addEventListener("input", (e) => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        debouncedSearch(e.target.value);
      }, DEFAULT_CONFIG.PERFORMANCE.DEBOUNCE_DELAY);
    });
    if (this.clearButton) {
      this.clearButton.addEventListener("click", () => this.clearSearch());
    }
    document.addEventListener("keydown", (e) => {
      var _a, _b;
      if (e.altKey && e.key === "s") {
        e.preventDefault();
        (_a = this.searchInput) == null ? void 0 : _a.focus();
      }
      if (e.key === "Escape" && ((_b = this.searchInput) == null ? void 0 : _b.value)) {
        this.clearSearch();
      }
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-container")) {
        this.hideResults();
      }
    });
  }
  /**
   * Perform search
   * @param {string} query - Search query
   */
  async performSearch(query) {
    var _a, _b;
    if (!query || query.trim().length < 2) {
      this.hideResults();
      (_a = this.clearButton) == null ? void 0 : _a.setAttribute("hidden", "");
      return;
    }
    this.showLoading();
    (_b = this.clearButton) == null ? void 0 : _b.removeAttribute("hidden");
    const cacheKey = query.toLowerCase().trim();
    if (this.searchCache.has(cacheKey)) {
      const cachedResults = this.searchCache.get(cacheKey);
      setTimeout(() => this.displayResults(cachedResults, query), 100);
      return cachedResults;
    }
    let results = [];
    try {
      if (this.searchIndex) {
        const lunrResults = this.searchIndex.search(query);
        results = lunrResults.map((result) => ({
          ...this.posts[result.ref],
          score: result.score,
          matches: this.getMatches(this.posts[result.ref], query)
        }));
      } else if (this.vectorIndex) {
        results = this.vectorIndex.search(query, { topK: 10 }).map((r) => ({
          ...r.post,
          score: r.score,
          matches: this.getMatches(r.post, query)
        }));
      } else {
        results = this.basicSearch(query);
      }
      this.searchCache.set(cacheKey, results);
      this.displayResults(results, query);
      return results;
    } catch (error2) {
      console.error("Search error:", error2);
      this.showSearchError();
      return [];
    }
  }
  /**
   * Basic search fallback
   * @param {string} query - Search query
   * @returns {Array} Search results
   */
  basicSearch(query) {
    const searchTerms = query.toLowerCase().split(/\s+/);
    return this.posts.map((post) => {
      let score = 0;
      const matches = [];
      searchTerms.forEach((term) => {
        const titleMatch = post.title.toLowerCase().indexOf(term);
        if (titleMatch !== -1) {
          score += 10;
          matches.push({ field: "title", term, index: titleMatch });
        }
        const contentMatch = post.content.toLowerCase().indexOf(term);
        if (contentMatch !== -1) {
          score += 1;
          matches.push({ field: "content", term, index: contentMatch });
        }
        const tagMatch = post.tags.some((tag) => tag.toLowerCase().indexOf(term) !== -1);
        if (tagMatch) {
          score += 8;
          matches.push({ field: "tags", term });
        }
      });
      return { ...post, score, matches };
    }).filter((post) => post.score > 0).sort((a, b) => b.score - a.score).slice(0, 10);
  }
  /**
   * Get text matches for highlighting
   * @param {Object} post - Post object
   * @param {string} query - Search query
   * @returns {Array} Matches array
   */
  getMatches(post, query) {
    const matches = [];
    const terms = query.toLowerCase().split(/\s+/);
    terms.forEach((term) => {
      const titleIndex = post.title.toLowerCase().indexOf(term);
      if (titleIndex !== -1) {
        matches.push({
          field: "title",
          value: this.highlightText(post.title, titleIndex, term.length)
        });
      }
      const excerptIndex = post.excerpt.toLowerCase().indexOf(term);
      if (excerptIndex !== -1) {
        matches.push({
          field: "excerpt",
          value: this.highlightText(post.excerpt, excerptIndex, term.length)
        });
      }
    });
    return matches;
  }
  /**
   * Highlight matched text
   * @param {string} text - Text to highlight
   * @param {number} startIndex - Start index of match
   * @param {number} length - Length of match
   * @returns {Object} Highlighted text parts
   */
  highlightText(text, startIndex, length) {
    return {
      before: text.substring(0, startIndex),
      match: text.substring(startIndex, startIndex + length),
      after: text.substring(startIndex + length)
    };
  }
  /**
   * Display search results
   * @param {Array} results - Search results
   * @param {string} query - Original query
   */
  displayResults(results, query) {
    this.hideLoading();
    if (!this.searchResults) return;
    if (results.length === 0) {
      this.showEmptyState();
      return;
    }
    const resultsHTML = results.map((post, index) => `
      <div class="search-result-item" role="article" tabindex="-1" data-index="${index}">
        <a href="${post.url}" class="search-result-link">
          <div class="search-result-header">
            <h3 class="search-result-title">
              ${this.getHighlightedHTML(post.title, query)}
            </h3>
            <div class="search-result-meta">
              <time datetime="${post.date}" class="search-result-date">
                ${formatDate(post.date)}
              </time>
              ${post.categories.length > 0 ? `
                <span class="search-result-category">${post.categories[0]}</span>
              ` : ""}
            </div>
          </div>
          ${post.excerpt ? `
            <div class="search-result-excerpt">
              ${this.getHighlightedHTML(post.excerpt, query)}
            </div>
          ` : ""}
          ${post.tags.length > 0 ? `
            <div class="search-result-tags">
              ${post.tags.slice(0, 3).map((tag) => `<span class="search-result-tag">${tag}</span>`).join("")}
            </div>
          ` : ""}
        </a>
      </div>
    `).join("");
    this.searchResults.innerHTML = `
      <div class="search-results-list" role="list">
        ${resultsHTML}
      </div>
      <div class="search-results-footer">
        <p>${results.length} result${results.length !== 1 ? "s" : ""} found</p>
      </div>
    `;
    this.setupKeyboardNavigation(results.length);
  }
  /**
   * Get highlighted HTML with mark tags
   * @param {string} text - Text to highlight
   * @param {string} query - Search query
   * @returns {string} Highlighted HTML
   */
  getHighlightedHTML(text, query) {
    const regex = new RegExp(`(${query.split(/\s+/).join("|")})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  }
  /**
   * Setup keyboard navigation for results
   * @param {number} resultCount - Number of results
   */
  setupKeyboardNavigation(resultCount) {
    let currentIndex = -1;
    this.keydownHandler = (e) => {
      var _a;
      const items = this.searchResults.querySelectorAll(".search-result-item");
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          currentIndex = Math.min(currentIndex + 1, resultCount - 1);
          this.highlightResult(items, currentIndex);
          break;
        case "ArrowUp":
          e.preventDefault();
          currentIndex = Math.max(currentIndex - 1, 0);
          this.highlightResult(items, currentIndex);
          break;
        case "Enter":
          if (currentIndex >= 0 && items[currentIndex]) {
            e.preventDefault();
            const link = items[currentIndex].querySelector(".search-result-link");
            link == null ? void 0 : link.click();
          }
          break;
        case "Escape":
          this.hideResults();
          (_a = this.searchInput) == null ? void 0 : _a.focus();
          break;
      }
    };
    document.addEventListener("keydown", this.keydownHandler);
  }
  /**
   * Highlight result item
   * @param {NodeList} items - Result items
   * @param {number} index - Index to highlight
   */
  highlightResult(items, index) {
    items.forEach((item, i) => {
      item.classList.toggle("highlighted", i === index);
      item.setAttribute("aria-selected", i === index ? "true" : "false");
    });
    if (items[index]) {
      items[index].scrollIntoView({ block: "nearest" });
    }
  }
  /**
   * Show loading state
   */
  showLoading() {
    var _a;
    this.hideEmptyState();
    (_a = this.loadingIndicator) == null ? void 0 : _a.removeAttribute("hidden");
  }
  /**
   * Hide loading state
   */
  hideLoading() {
    var _a;
    (_a = this.loadingIndicator) == null ? void 0 : _a.setAttribute("hidden", "");
  }
  /**
   * Show empty state
   */
  showEmptyState() {
    var _a;
    this.hideLoading();
    (_a = this.emptyState) == null ? void 0 : _a.removeAttribute("hidden");
  }
  /**
   * Hide empty state
   */
  hideEmptyState() {
    var _a;
    (_a = this.emptyState) == null ? void 0 : _a.setAttribute("hidden", "");
  }
  /**
   * Hide search results
   */
  hideResults() {
    this.searchResults.innerHTML = "";
    this.hideEmptyState();
    this.hideLoading();
    if (this.keydownHandler) {
      document.removeEventListener("keydown", this.keydownHandler);
      this.keydownHandler = null;
    }
  }
  /**
   * Clear search
   */
  clearSearch() {
    var _a, _b;
    this.searchInput.value = "";
    this.hideResults();
    (_a = this.clearButton) == null ? void 0 : _a.setAttribute("hidden", "");
    (_b = this.searchInput) == null ? void 0 : _b.focus();
  }
  /**
   * Show search error state
   */
  showSearchError() {
    this.hideLoading();
    this.searchResults.innerHTML = `
      <div class="search-error">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        <p>Search unavailable</p>
        <p>Please try again later</p>
      </div>
    `;
  }
  /**
   * Clear search cache
   */
  clearCache() {
    this.searchCache.clear();
    console.log("Search cache cleared");
  }
  /**
   * Get cache size
   * @returns {number} Cache size
   */
  getCacheSize() {
    return this.searchCache.size;
  }
  /**
   * Destroy search engine and cleanup
   */
  destroy() {
    this.clearCache();
    if (this.keydownHandler) {
      document.removeEventListener("keydown", this.keydownHandler);
    }
    clearTimeout(this.debounceTimer);
  }
};
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.searchEngine = new SearchEngine();
    });
  } else {
    window.searchEngine = new SearchEngine();
  }
}

// src/modules/social-sharing.js
var PLATFORM_CONFIGS = {
  twitter: {
    name: "Twitter",
    icon: "\u{1D54F}",
    color: "#000000",
    url: (data) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(data.title)}`,
    shareUrl: (data) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(data.url)}`
  },
  linkedin: {
    name: "LinkedIn",
    icon: "in",
    color: "#0A66C2",
    url: (data) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.url)}`,
    shareUrl: (data) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.url)}`
  },
  facebook: {
    name: "Facebook",
    icon: "f",
    color: "#1877F2",
    url: (data) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`,
    shareUrl: (data) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`
  },
  reddit: {
    name: "Reddit",
    icon: "\u2282",
    color: "#FF4500",
    url: (data) => `https://www.reddit.com/submit?url=${encodeURIComponent(data.url)}&title=${encodeURIComponent(data.title)}`,
    shareUrl: (data) => `https://www.reddit.com/submit?url=${encodeURIComponent(data.url)}`
  },
  hackernews: {
    name: "Hacker News",
    icon: "Y",
    color: "#FF6600",
    url: (data) => `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(data.url)}&t=${encodeURIComponent(data.title)}`,
    shareUrl: (data) => `https://news.ycombinator.com/from?site=${encodeURIComponent(new URL(data.url).hostname)}`
  },
  email: {
    name: "Email",
    icon: "\u2709",
    color: "#666666",
    url: (data) => `mailto:?subject=${encodeURIComponent(data.title)}&body=${encodeURIComponent(data.url)}`,
    shareUrl: null
  }
};
var DEFAULT_CONFIG2 = {
  container: ".social-sharing",
  platforms: ["twitter", "linkedin", "facebook", "reddit", "hackernews", "email"],
  showCounts: true,
  showLabels: true,
  enableAnalytics: true,
  cacheTimeout: 3e5,
  // 5 minutes
  apiEndpoint: "/api/share-counts"
};
var SocialSharing = class {
  /**
   * Create a SocialSharing instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.config = { ...DEFAULT_CONFIG2, ...options };
    this.shareCounts = {};
    this.shareData = null;
    this.container = null;
    this.cache = /* @__PURE__ */ new Map();
    this._init();
  }
  /**
   * Initialize social sharing
   * @private
   */
  _init() {
    this.container = document.querySelector(this.config.container);
    if (!this.container) return;
    this._setupShareData();
    this._render();
    this._bindEvents();
    if (this.config.showCounts) {
      this._loadShareCounts();
    }
  }
  /**
   * Setup share data from meta tags
   * @private
   */
  _setupShareData() {
    this.shareData = {
      url: window.location.href.split("#")[0],
      title: document.title,
      description: this._getMetaDescription(),
      image: this._getMetaImage(),
      author: this._getMetaAuthor(),
      siteName: this._getMetaSiteName()
    };
  }
  /**
   * Get meta description
   * @returns {string} Meta description content
   * @private
   */
  _getMetaDescription() {
    const meta = document.querySelector('meta[name="description"]');
    return (meta == null ? void 0 : meta.getAttribute("content")) || "";
  }
  /**
   * Get meta image (Open Graph)
   * @returns {string} Image URL
   * @private
   */
  _getMetaImage() {
    const meta = document.querySelector('meta[property="og:image"]');
    return (meta == null ? void 0 : meta.getAttribute("content")) || "";
  }
  /**
   * Get meta author
   * @returns {string} Author name
   * @private
   */
  _getMetaAuthor() {
    const meta = document.querySelector('meta[name="author"]');
    return (meta == null ? void 0 : meta.getAttribute("content")) || "";
  }
  /**
   * Get meta site name
   * @returns {string} Site name
   * @private
   */
  _getMetaSiteName() {
    const meta = document.querySelector('meta[property="og:site_name"]');
    return (meta == null ? void 0 : meta.getAttribute("content")) || "";
  }
  /**
   * Get platform configurations
   * @returns {Array} Array of platform configs
   * @private
   */
  _getPlatformConfigs() {
    return this.config.platforms.map((platform) => PLATFORM_CONFIGS[platform]).filter(Boolean);
  }
  /**
   * Render social sharing buttons
   * @private
   */
  _render() {
    const platforms = this._getPlatformConfigs();
    this.container.innerHTML = `
      <div class="social-sharing-container" role="region" aria-label="Share this article">
        <div class="social-sharing-header">
          <h4 data-i18n="social.share">Share this article</h4>
        </div>
        <div class="social-sharing-buttons">
          ${platforms.map((platform) => this._renderShareButton(platform)).join("")}
        </div>
        ${this.config.showCounts ? `
          <div class="social-sharing-stats">
            <span class="total-shares" data-i18n="social.total_shares">Total shares:</span>
            <span class="total-count" id="total-share-count">0</span>
          </div>
        ` : ""}
      </div>
    `;
    if (this.config.showCounts) {
      this._updateTotalShares();
    }
  }
  /**
   * Render individual share button
   * @param {Object} platform - Platform configuration
   * @returns {string} HTML string
   * @private
   */
  _renderShareButton(platform) {
    return `
      <button
        class="share-button share-button--${platform.name.toLowerCase()}"
        data-platform="${platform.name.toLowerCase()}"
        data-url="${encodeURIComponent(this.shareData.url)}"
        aria-label="Share on ${platform.name}"
        title="Share on ${platform.name}"
        style="--share-color: ${platform.color}"
      >
        <span class="share-icon">${platform.icon}</span>
        ${this.config.showLabels ? `<span class="share-label">${platform.name}</span>` : ""}
        ${this.config.showCounts && this.shareCounts[platform.name] ? `
          <span class="share-count" data-platform="${platform.name.toLowerCase()}">
            ${this._formatCount(this.shareCounts[platform.name])}
          </span>
        ` : ""}
      </button>
    `;
  }
  /**
   * Format share count number
   * @param {number} count - Share count
   * @returns {string} Formatted count
   * @private
   */
  _formatCount(count) {
    if (count >= 1e6) {
      return (count / 1e6).toFixed(1) + "M";
    }
    if (count >= 1e3) {
      return (count / 1e3).toFixed(1) + "K";
    }
    return count.toString();
  }
  /**
   * Bind event listeners
   * @private
   */
  _bindEvents() {
    this.container.addEventListener("click", (e) => {
      const button = e.target.closest(".share-button");
      if (button) {
        e.preventDefault();
        const platform = button.dataset.platform;
        this._handleShare(platform);
      }
    });
    if (navigator.share) {
      this._setupWebShare();
    }
  }
  /**
   * Setup Web Share API
   * @private
   */
  _setupWebShare() {
    const webShareButton = this.container.querySelector(".share-button--web");
    if (webShareButton) {
      webShareButton.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          await navigator.share({
            title: this.shareData.title,
            text: this.shareData.description,
            url: this.shareData.url
          });
          this._trackShare("web_share");
        } catch (e2) {
        }
        {
          if (error.name !== "AbortError") {
            console.error("Web share failed:", error);
          }
        }
      });
    }
  }
  /**
   * Handle share click
   * @param {string} platform - Platform name
   * @private
   */
  _handleShare(platform) {
    const platformConfig = PLATFORM_CONFIGS[platform];
    if (!platformConfig) return;
    const shareUrl = platformConfig.url(this.shareData);
    const width = 600;
    const height = 400;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;
    window.open(
      shareUrl,
      `share_${platform}`,
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no`
    );
    this._trackShare(platform);
    this._incrementShareCount(platform);
  }
  /**
   * Track share event
   * @param {string} platform - Platform name
   * @private
   */
  _trackShare(platform) {
    if (!this.config.enableAnalytics) return;
    if (typeof gtag !== "undefined") {
      gtag("event", "social_share", {
        event_category: "engagement",
        event_label: platform,
        value: 1
      });
    }
    this._sendCustomAnalytics("social_share", {
      platform,
      url: this.shareData.url,
      timestamp: Date.now()
    });
  }
  /**
   * Send custom analytics event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   * @private
   */
  _sendCustomAnalytics(event, data) {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/analytics",
        JSON.stringify({ event, data })
      );
    } else {
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, data }),
        keepalive: true
      }).catch(() => {
      });
    }
  }
  /**
   * Load share counts from API
   * @private
   */
  async _loadShareCounts() {
    try {
      const cachedData = this.cache.get("shareCounts");
      if (cachedData && Date.now() - cachedData.timestamp < this.config.cacheTimeout) {
        this.shareCounts = cachedData.data;
        this._updateShareCountsUI();
        return;
      }
      const response = await fetch(
        `${this.config.apiEndpoint}?url=${encodeURIComponent(this.shareData.url)}`
      );
      if (!response.ok) throw new Error("Failed to load share counts");
      const data = await response.json();
      this.shareCounts = data.counts || {};
      this.cache.set("shareCounts", {
        data: this.shareCounts,
        timestamp: Date.now()
      });
      this._updateShareCountsUI();
    } catch (e) {
    }
    {
      console.warn("Failed to load share counts:", error);
      this._hideShareCounts();
    }
  }
  /**
   * Update share counts UI
   * @private
   */
  _updateShareCountsUI() {
    Object.entries(this.shareCounts).forEach(([platform, count]) => {
      const countElement = this.container.querySelector(
        `.share-count[data-platform="${platform.toLowerCase()}"]`
      );
      if (countElement) {
        countElement.textContent = this._formatCount(count);
      }
    });
    this._updateTotalShares();
  }
  /**
   * Update total shares count
   * @private
   */
  _updateTotalShares() {
    const totalElement = this.container.querySelector("#total-share-count");
    if (totalElement) {
      const total = Object.values(this.shareCounts).reduce(
        (sum, count) => sum + count,
        0
      );
      totalElement.textContent = this._formatCount(total);
    }
  }
  /**
   * Hide share counts on error
   * @private
   */
  _hideShareCounts() {
    this.container.querySelectorAll(".share-count").forEach((el) => {
      el.style.display = "none";
    });
    const statsElement = this.container.querySelector(".social-sharing-stats");
    if (statsElement) {
      statsElement.style.display = "none";
    }
  }
  /**
   * Increment local share count
   * @param {string} platform - Platform name
   * @private
   */
  _incrementShareCount(platform) {
    if (!this.shareCounts[platform]) {
      this.shareCounts[platform] = 0;
    }
    this.shareCounts[platform]++;
    this._updateShareCountsUI();
  }
  /**
   * Copy link to clipboard
   */
  async copyLinkToClipboard() {
    try {
      await navigator.clipboard.writeText(this.shareData.url);
      this._showToast("Link copied to clipboard!");
      this._trackShare("clipboard");
    } catch (e) {
    }
    {
      const textarea = document.createElement("textarea");
      textarea.value = this.shareData.url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        this._showToast("Link copied to clipboard!");
        this._trackShare("clipboard");
      } catch (e) {
      }
      {
        this._showToast("Failed to copy link");
      }
      document.body.removeChild(textarea);
    }
  }
  /**
   * Show toast notification
   * @param {string} message - Toast message
   * @private
   */
  _showToast(message) {
    const toast = document.createElement("div");
    toast.className = "share-toast";
    toast.textContent = message;
    toast.setAttribute("role", "alert");
    document.body.appendChild(toast);
    toast.offsetHeight;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 2e3);
  }
  /**
   * Get current share data
   * @returns {Object} Share data
   */
  getShareData() {
    return { ...this.shareData };
  }
  /**
   * Update share data
   * @param {Object} newData - New share data
   */
  updateShareData(newData) {
    this.shareData = { ...this.shareData, ...newData };
    this._render();
  }
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
  /**
   * Destroy and cleanup
   */
  destroy() {
    if (this.container) {
      this.container.innerHTML = "";
    }
    this.clearCache();
  }
};
if (typeof document !== "undefined" && typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.socialSharing = new SocialSharing();
    });
  } else {
    window.socialSharing = new SocialSharing();
  }
}

// src/modules/subscription.js
var SubscriptionSystem = class {
  /**
   * Create SubscriptionSystem instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      rssUrl: options.rssUrl || "/feed.xml",
      subscriptionEndpoint: options.subscriptionEndpoint || "/api/subscribe",
      verificationEndpoint: options.verificationEndpoint || "/api/verify-email",
      unsubscribeEndpoint: options.unsubscribeEndpoint || "/api/unsubscribe",
      ...options
    };
    this.init();
  }
  /**
   * Initialize subscription system
   */
  init() {
    this.renderSubscriptionForms();
    this.bindEvents();
    this.handleURLParameters();
  }
  /**
   * Render subscription forms
   */
  renderSubscriptionForms() {
    const containers = document.querySelectorAll(".subscription-container");
    containers.forEach((container) => {
      if (!container.hasAttribute("data-rendered")) {
        container.innerHTML = this.getSubscriptionFormHTML();
        container.setAttribute("data-rendered", "true");
      }
    });
    if (containers.length === 0) {
      this.createFloatingSubscriptionWidget();
    }
  }
  /**
   * Get subscription form HTML
   * @returns {string} Form HTML
   */
  getSubscriptionFormHTML() {
    return `
      <div class="subscription-system">
        <div class="subscription-header">
          <h3 data-i18n="subscription.title">Subscribe to Updates</h3>
          <p class="subscription-description" data-i18n="subscription.description">
            Get the latest articles delivered to your inbox
          </p>
        </div>

        <div class="subscription-forms">
          <!-- Email Subscription -->
          <div class="subscription-form email-subscription">
            <div class="form-header">
              <h4 data-i18n="subscription.email_title">Email Newsletter</h4>
              <p data-i18n="subscription.email_description">
                Weekly digest of new articles and updates
              </p>
            </div>

            <form class="email-form" data-type="email">
              <div class="form-group">
                <input
                  type="email"
                  name="email"
                  class="form-input"
                  placeholder="your@email.com"
                  data-i18n-placeholder="subscription.email_placeholder"
                  required
                />
              </div>

              <div class="form-group">
                <input
                  type="text"
                  name="name"
                  class="form-input"
                  placeholder="Your name (optional)"
                  data-i18n-placeholder="subscription.name_placeholder"
                />
              </div>

              <div class="form-group form-preferences">
                <label class="checkbox-label">
                  <input type="checkbox" name="weekly_digest" checked>
                  <span data-i18n="subscription.weekly_digest">Weekly digest</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" name="new_posts" checked>
                  <span data-i18n="subscription.new_posts">New posts</span>
                </label>
              </div>

              <button type="submit" class="btn btn-primary" data-i18n="subscription.subscribe_email">
                Subscribe via Email
              </button>
            </form>
          </div>

          <!-- RSS Subscription -->
          <div class="subscription-form rss-subscription">
            <div class="form-header">
              <h4 data-i18n="subscription.rss_title">RSS Feed</h4>
              <p data-i18n="subscription.rss_description">
                Subscribe in your favorite RSS reader
              </p>
            </div>

            <div class="rss-options">
              <a href="${this.options.rssUrl}" class="rss-link" target="_blank" rel="noopener">
                <span class="rss-icon">\u{1F4E1}</span>
                <span data-i18n="subscription.rss_feed">RSS Feed</span>
              </a>

              <button class="btn btn-secondary copy-rss" data-i18n="subscription.copy_rss">
                Copy RSS URL
              </button>
            </div>

            <div class="rss-readers">
              <p class="rss-readers-title" data-i18n="subscription.add_to_reader">
                Add to RSS Reader:
              </p>
              <div class="rss-reader-buttons">
                <button class="reader-btn feedly" data-reader="feedly">
                  <span class="reader-icon">\u{1F516}</span>
                  <span>Feedly</span>
                </button>
                <button class="reader-btn inoreader" data-reader="inoreader">
                  <span class="reader-icon">\u{1F4F0}</span>
                  <span>Inoreader</span>
                </button>
                <button class="reader-btn feedbin" data-reader="feedbin">
                  <span class="reader-icon">\u{1F4EC}</span>
                  <span>Feedbin</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="subscription-status" style="display: none;">
          <div class="status-message"></div>
          <button class="btn btn-secondary close-status" data-i18n="subscription.close">
            Close
          </button>
        </div>
      </div>
    `;
  }
  /**
   * Create floating subscription widget
   */
  createFloatingSubscriptionWidget() {
    const widget = document.createElement("div");
    widget.className = "floating-subscription";
    widget.innerHTML = `
      <button class="subscription-toggle" data-i18n="subscription.subscribe">
        \u{1F4E7} Subscribe
      </button>
      <div class="subscription-popup">
        ${this.getSubscriptionFormHTML()}
      </div>
    `;
    document.body.appendChild(widget);
  }
  /**
   * Bind event listeners
   */
  bindEvents() {
    document.addEventListener("submit", (e) => {
      const form = e.target.closest("form");
      if (form && form.classList.contains("email-form")) {
        e.preventDefault();
        this.handleEmailSubscription(form);
      }
    });
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("copy-rss")) {
        this.copyRSSUrl(e.target);
      }
      if (e.target.closest(".reader-btn")) {
        const button = e.target.closest(".reader-btn");
        this.addToRSSReader(button.dataset.reader);
      }
      if (e.target.classList.contains("subscription-toggle")) {
        this.toggleSubscriptionWidget();
      }
      if (e.target.classList.contains("close-status")) {
        this.hideStatusMessage();
      }
    });
    document.addEventListener("input", (e) => {
      if (e.target.type === "email") {
        this.validateEmail(e.target);
      }
    });
  }
  /**
   * Handle URL parameters for verification/unsubscribe
   */
  handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("verify") && urlParams.has("token")) {
      this.verifyEmail(urlParams.get("token"));
    }
    if (urlParams.has("unsubscribe") && urlParams.has("email")) {
      this.unsubscribeUser(urlParams.get("email"), urlParams.get("token"));
    }
    if (urlParams.has("subscribed")) {
      this.showStatusMessage("subscription.success", "success");
    }
  }
  /**
   * Handle email subscription
   * @param {HTMLFormElement} form - Form element
   */
  async handleEmailSubscription(form) {
    const formData = new FormData(form);
    const data = {
      email: formData.get("email"),
      name: formData.get("name") || "",
      preferences: {
        weekly_digest: formData.has("weekly_digest"),
        new_posts: formData.has("new_posts")
      }
    };
    if (!this.isValidEmail(data.email)) {
      this.showStatusMessage("subscription.invalid_email", "error");
      return;
    }
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Subscribing...";
    try {
      const response = await fetch(this.options.subscriptionEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (response.ok) {
        this.showStatusMessage("subscription.success", "success");
        form.reset();
        this.trackSubscription("email", data);
      } else {
        this.showStatusMessage(result.message || "subscription.error", "error");
      }
    } catch (error2) {
      this.showStatusMessage("subscription.network_error", "error");
      console.error("Subscription error:", error2);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }
  /**
   * Verify email with token
   * @param {string} token - Verification token
   */
  async verifyEmail(token) {
    try {
      const response = await fetch(this.options.verificationEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      const result = await response.json();
      if (response.ok) {
        this.showStatusMessage("subscription.verified", "success");
      } else {
        this.showStatusMessage(result.message || "subscription.verification_error", "error");
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {
      this.showStatusMessage("subscription.network_error", "error");
    }
  }
  /**
   * Unsubscribe user
   * @param {string} email - User email
   * @param {string} token - Unsubscribe token
   */
  async unsubscribeUser(email, token) {
    try {
      const response = await fetch(this.options.unsubscribeEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token })
      });
      const result = await response.json();
      if (response.ok) {
        this.showStatusMessage("subscription.unsubscribed", "success");
      } else {
        this.showStatusMessage(result.message || "subscription.unsubscribe_error", "error");
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {
      this.showStatusMessage("subscription.network_error", "error");
    }
  }
  /**
   * Copy RSS URL to clipboard
   * @param {HTMLElement} button - Button element
   */
  async copyRSSUrl(button) {
    try {
      await navigator.clipboard.writeText(window.location.origin + this.options.rssUrl);
      const originalText = button.textContent;
      button.textContent = "Copied!";
      button.classList.add("success");
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove("success");
      }, 2e3);
      this.trackSubscription("rss_copy");
    } catch (e) {
    }
    {
      console.error("Failed to copy RSS URL:", error);
      this.showStatusMessage("subscription.copy_error", "error");
    }
  }
  /**
   * Add feed to RSS reader
   * @param {string} reader - Reader name (feedly, inoreader, feedbin)
   */
  addToRSSReader(reader) {
    const readerUrls = {
      feedly: `https://feedly.com/i/subscription/feed/${encodeURIComponent(window.location.origin + this.options.rssUrl)}`,
      inoreader: `https://www.inoreader.com/?add_feed=${encodeURIComponent(window.location.origin + this.options.rssUrl)}`,
      feedbin: `https://feedbin.me/?subscribe=${encodeURIComponent(window.location.origin + this.options.rssUrl)}`
    };
    const url = readerUrls[reader];
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      this.trackSubscription("rss_reader", { reader });
    }
  }
  /**
   * Toggle subscription widget visibility
   */
  toggleSubscriptionWidget() {
    const popup = document.querySelector(".subscription-popup");
    const toggle = document.querySelector(".subscription-toggle");
    if (popup.style.display === "block") {
      popup.style.display = "none";
      toggle.textContent = "\u{1F4E7} Subscribe";
    } else {
      popup.style.display = "block";
      toggle.textContent = "\u2715 Close";
    }
  }
  /**
   * Validate email input
   * @param {HTMLInputElement} input - Email input element
   */
  validateEmail(input) {
    const isValid = this.isValidEmail(input.value);
    if (input.value && !isValid) {
      input.classList.add("error");
    } else {
      input.classList.remove("error");
    }
  }
  /**
   * Check if email is valid
   * @param {string} email - Email to validate
   * @returns {boolean} Is valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  /**
   * Show status message
   * @param {string} key - Message key
   * @param {string} type - Message type (success, error, info)
   */
  showStatusMessage(key, type = "info") {
    const statusDiv = document.querySelector(".subscription-status");
    const messageDiv = statusDiv == null ? void 0 : statusDiv.querySelector(".status-message");
    if (!statusDiv || !messageDiv) return;
    const messages = {
      "subscription.success": "Thank you for subscribing! Please check your email to confirm.",
      "subscription.invalid_email": "Please enter a valid email address.",
      "subscription.error": "Subscription failed. Please try again later.",
      "subscription.network_error": "Network error. Please check your connection.",
      "subscription.verified": "Email verified successfully! You are now subscribed.",
      "subscription.verification_error": "Verification failed. Please try again.",
      "subscription.unsubscribed": "You have been successfully unsubscribed.",
      "subscription.unsubscribe_error": "Unsubscribe failed. Please contact support.",
      "subscription.copy_error": "Failed to copy RSS URL."
    };
    messageDiv.textContent = messages[key] || key;
    statusDiv.className = `subscription-status ${type}`;
    statusDiv.style.display = "block";
    if (type === "success") {
      setTimeout(() => this.hideStatusMessage(), 5e3);
    }
  }
  /**
   * Hide status message
   */
  hideStatusMessage() {
    const statusDiv = document.querySelector(".subscription-status");
    if (statusDiv) statusDiv.style.display = "none";
    const popup = document.querySelector(".subscription-popup");
    const toggle = document.querySelector(".subscription-toggle");
    if (popup && toggle) {
      popup.style.display = "none";
      toggle.textContent = "\u{1F4E7} Subscribe";
    }
  }
  /**
   * Track subscription event
   * @param {string} type - Event type
   * @param {Object} data - Additional data
   */
  trackSubscription(type, data = {}) {
    if (typeof gtag !== "undefined") {
      gtag("event", "subscription", { method: type, ...data });
    }
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics", JSON.stringify({
        event: "subscription",
        type,
        data,
        timestamp: Date.now()
      }));
    }
  }
  /**
   * Destroy subscription system
   */
  destroy() {
    const widget = document.querySelector(".floating-subscription");
    if (widget) widget.remove();
  }
};
if (typeof document !== "undefined" && typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    window.subscriptionSystem = new SubscriptionSystem({
      rssUrl: "/feed.xml",
      subscriptionEndpoint: "/api/subscribe",
      verificationEndpoint: "/api/verify-email",
      unsubscribeEndpoint: "/api/unsubscribe"
    });
  });
}

// src/services/analytics-service.js
init_helpers();
var ANALYTICS_CONFIG = {
  endpoint: "/api/analytics",
  trackWebVitals: true,
  trackUserBehavior: true,
  trackPerformance: true,
  debugMode: false,
  sampleRate: 0.1,
  // 10% sample rate for privacy
  flushInterval: 3e4,
  // Flush events every 30 seconds
  maxQueueSize: 100,
  retryAttempts: 3,
  retryDelay: 1e3
};
var AnalyticsService = class {
  /**
   * Create AnalyticsService instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = { ...ANALYTICS_CONFIG, ...options };
    this.sessionId = this.generateSessionId();
    this.pageStartTime = Date.now();
    this.events = [];
    this.storage = new LocalStorage("analytics_session");
    this.isInitialized = false;
    this.flushEvents = this.flushEvents.bind(this);
  }
  /**
   * Initialize analytics system
   * @returns {void}
   */
  init() {
    if (this.isInitialized) {
      console.warn("AnalyticsService already initialized");
      return;
    }
    this.trackPageView();
    if (this.options.trackWebVitals) {
      this.trackCoreWebVitals();
    }
    if (this.options.trackUserBehavior) {
      this.trackUserInteractions();
    }
    if (this.options.trackPerformance) {
      this.trackPerformanceMetrics();
    }
    this.flushTimer = setInterval(this.flushEvents.bind(this), this.options.flushInterval);
    window.addEventListener("beforeunload", () => this.flushEvents());
    window.addEventListener("pagehide", () => this.flushEvents());
    this.isInitialized = true;
    this.log("AnalyticsService initialized", { sessionId: this.sessionId });
  }
  /**
   * Generate unique session ID
   * @returns {string} Unique session identifier
   */
  generateSessionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `session_${timestamp}_${random}`;
  }
  /**
   * Check if event should be sampled
   * @returns {boolean} True if event should be tracked
   */
  shouldSample() {
    return Math.random() < this.options.sampleRate;
  }
  /**
   * Track page view event
   * @returns {void}
   */
  trackPageView() {
    const pageData = {
      type: "pageview",
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      device: getDeviceInfo()
    };
    this.addEvent(pageData);
  }
  /**
   * Track Core Web Vitals (LCP, FID, CLS, INP)
   * @returns {void}
   */
  trackCoreWebVitals() {
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeINP();
  }
  /**
   * Observe Largest Contentful Paint (LCP)
   * @returns {void}
   */
  observeLCP() {
    if (!window.PerformanceObserver) return;
    let lcpValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      lcpValue = lastEntry.startTime;
      this.addEvent({
        type: "webvital_lcp",
        value: lcpValue,
        url: lastEntry.url,
        rating: this.getLCPRating(lcpValue),
        timestamp: Date.now(),
        sessionId: this.sessionId
      });
    });
    observer.observe({ entryTypes: ["largest-contentful-paint"], buffered: true });
  }
  /**
   * Get LCP rating based on thresholds
   * @param {number} value - LCP value in ms
   * @returns {string} Rating: 'good', 'needs-improvement', or 'poor'
   */
  getLCPRating(value) {
    if (value <= 2500) return "good";
    if (value <= 4e3) return "needs-improvement";
    return "poor";
  }
  /**
   * Observe First Input Delay (FID)
   * @returns {void}
   */
  observeFID() {
    if (!window.PerformanceObserver) return;
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const fidValue = entry.processingStart - entry.startTime;
        this.addEvent({
          type: "webvital_fid",
          value: fidValue,
          inputType: entry.name,
          rating: this.getFIDRating(fidValue),
          timestamp: Date.now(),
          sessionId: this.sessionId
        });
      });
    });
    observer.observe({ entryTypes: ["first-input"], buffered: true });
  }
  /**
   * Get FID rating based on thresholds
   * @param {number} value - FID value in ms
   * @returns {string} Rating: 'good', 'needs-improvement', or 'poor'
   */
  getFIDRating(value) {
    if (value <= 100) return "good";
    if (value <= 300) return "needs-improvement";
    return "poor";
  }
  /**
   * Observe Cumulative Layout Shift (CLS)
   * @returns {void}
   */
  observeCLS() {
    if (!window.PerformanceObserver) return;
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.addEvent({
        type: "webvital_cls",
        value: clsValue,
        rating: this.getCLSRating(clsValue),
        timestamp: Date.now(),
        sessionId: this.sessionId
      });
    });
    observer.observe({ entryTypes: ["layout-shift"], buffered: true });
    this.clsValue = clsValue;
  }
  /**
   * Get CLS rating based on thresholds
   * @param {number} value - CLS value
   * @returns {string} Rating: 'good', 'needs-improvement', or 'poor'
   */
  getCLSRating(value) {
    if (value <= 0.1) return "good";
    if (value <= 0.25) return "needs-improvement";
    return "poor";
  }
  /**
   * Observe Interaction to Next Paint (INP)
   * @returns {void}
   */
  observeINP() {
    if (!window.PerformanceObserver) return;
    let inpValue = 0;
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const duration = entry.duration;
        if (duration > inpValue) {
          inpValue = duration;
        }
      });
      this.addEvent({
        type: "webvital_inp",
        value: inpValue,
        rating: this.getINPRating(inpValue),
        timestamp: Date.now(),
        sessionId: this.sessionId
      });
    });
    observer.observe({ entryTypes: ["event"], buffered: true });
  }
  /**
   * Get INP rating based on thresholds
   * @param {number} value - INP value in ms
   * @returns {string} Rating: 'good', 'needs-improvement', or 'poor'
   */
  getINPRating(value) {
    if (value <= 200) return "good";
    if (value <= 500) return "needs-improvement";
    return "poor";
  }
  /**
   * Track user interactions (clicks, scrolls, form submissions)
   * @returns {void}
   */
  trackUserInteractions() {
    document.addEventListener("click", (e) => {
      if (this.shouldSample()) {
        this.addEvent({
          type: "click",
          target: getElementSelector(e.target),
          coordinates: { x: e.clientX, y: e.clientY },
          timestamp: Date.now(),
          sessionId: this.sessionId
        });
      }
    });
    const trackScroll = debounce(() => {
      if (this.shouldSample()) {
        this.addEvent({
          type: "scroll",
          depth: this.getScrollDepth(),
          timestamp: Date.now(),
          sessionId: this.sessionId
        });
      }
    }, 1e3);
    document.addEventListener("scroll", trackScroll, { passive: true });
    document.addEventListener("submit", (e) => {
      const form = e.target;
      if (form.tagName === "FORM") {
        this.addEvent({
          type: "form_submit",
          form: this.getFormIdentifier(form),
          timestamp: Date.now(),
          sessionId: this.sessionId
        });
      }
    });
  }
  /**
   * Track performance metrics
   * @returns {void}
   */
  trackPerformanceMetrics() {
    window.addEventListener("load", () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType("navigation")[0];
        if (!navigation) return;
        this.addEvent({
          type: "performance",
          metrics: {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            ssl: navigation.secureConnectionStart > 0 ? navigation.connectEnd - navigation.secureConnectionStart : 0,
            ttfb: navigation.responseStart - navigation.requestStart,
            download: navigation.responseEnd - navigation.responseStart,
            domParse: navigation.domContentLoadedEventStart - navigation.responseEnd,
            domReady: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            total: navigation.loadEventEnd - navigation.navigationStart
          },
          timestamp: Date.now(),
          sessionId: this.sessionId
        });
      }, 0);
    });
    this.trackResourceTiming();
  }
  /**
   * Track resource loading performance
   * @returns {void}
   */
  trackResourceTiming() {
    if (!window.PerformanceObserver) return;
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === "resource") {
          this.addEvent({
            type: "resource",
            name: entry.name,
            resourceType: this.getResourceType(entry.name),
            size: entry.transferSize,
            duration: entry.duration,
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
            timestamp: Date.now(),
            sessionId: this.sessionId
          });
        }
      });
    });
    observer.observe({ entryTypes: ["resource"] });
  }
  /**
   * Get resource type from URL
   * @param {string} url - Resource URL
   * @returns {string} Resource type
   */
  getResourceType(url) {
    var _a;
    const extension = (_a = url.split(".").pop()) == null ? void 0 : _a.toLowerCase();
    const typeMap = {
      image: ["jpg", "jpeg", "png", "gif", "svg", "webp", "avif"],
      script: ["js", "mjs"],
      stylesheet: ["css", "scss", "sass"],
      font: ["woff", "woff2", "ttf", "eot", "otf"],
      video: ["mp4", "webm", "ogg"],
      audio: ["mp3", "wav", "aac"]
    };
    for (const [type, extensions] of Object.entries(typeMap)) {
      if (extensions.includes(extension)) return type;
    }
    return "other";
  }
  /**
   * Get scroll depth percentage
   * @returns {number} Scroll depth percentage (0-100)
   */
  getScrollDepth() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    return documentHeight > 0 ? Math.round(scrollTop / documentHeight * 100) : 0;
  }
  /**
   * Get form identifier
   * @param {HTMLFormElement} form - Form element
   * @returns {string} Form identifier
   */
  getFormIdentifier(form) {
    if (form.id) return `#${form.id}`;
    if (form.className) return `form.${form.className.split(" ")[0]}`;
    if (form.action) return `form[${form.action}]`;
    return "form";
  }
  /**
   * Add event to queue
   * @param {Object} event - Event data
   * @returns {void}
   */
  addEvent(event) {
    if (this.events.length >= this.options.maxQueueSize) {
      this.flushEvents();
    }
    this.events.push(event);
    if (this.options.debugMode) {
      this.log("Event added", event);
    }
  }
  /**
   * Flush events to server
   * @returns {Promise<void>}
   */
  async flushEvents() {
    if (this.events.length === 0) return;
    const eventsToSend = [...this.events];
    this.events = [];
    try {
      await this.sendToServer(eventsToSend);
      this.log(`Flushed ${eventsToSend.length} events`);
    } catch (error2) {
      this.events = [...eventsToSend, ...this.events];
      this.warn("Failed to flush events", error2);
    }
  }
  /**
   * Send events to server with retry logic
   * @param {Array} events - Events to send
   * @returns {Promise<void>}
   */
  async sendToServer(events) {
    const payload = {
      events,
      session: this.sessionId,
      timestamp: Date.now(),
      version: "2.0.0"
    };
    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      try {
        const response = await fetch(this.options.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return;
      } catch (error2) {
        if (attempt === this.options.retryAttempts) throw error2;
        await this.delay(this.options.retryDelay * attempt);
      }
    }
  }
  /**
   * Delay helper
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * Debug logging
   * @param {string} message - Log message
   * @param {any} data - Additional data
   * @returns {void}
   */
  log(message, data = null) {
    if (!this.options.debugMode) return;
    console.log(`[Analytics] ${message}`, data || "");
  }
  /**
   * Warning logging
   * @param {string} message - Warning message
   * @param {any} data - Additional data
   * @returns {void}
   */
  warn(message, data = null) {
    if (!this.options.debugMode) return;
    console.warn(`[Analytics] ${message}`, data || "");
  }
  /**
   * Get current session ID
   * @returns {string} Session ID
   */
  getSessionId() {
    return this.sessionId;
  }
  /**
   * Get queued events count
   * @returns {number} Number of queued events
   */
  getQueuedEventsCount() {
    return this.events.length;
  }
  /**
   * Destroy analytics service and cleanup
   * @returns {void}
   */
  destroy() {
    this.flushEvents();
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.events = [];
    this.isInitialized = false;
  }
};
var shouldInitializeAnalytics = () => {
  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const isDebugEnabled = window.analyticsDebug === true;
  return !isLocalhost || isDebugEnabled;
};
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    if (shouldInitializeAnalytics()) {
      window.analyticsService = new AnalyticsService({
        endpoint: "/api/analytics",
        trackWebVitals: true,
        trackUserBehavior: true,
        trackPerformance: true,
        debugMode: window.analyticsDebug || false,
        sampleRate: 0.1
      });
      window.analyticsService.init();
    }
  });
}

// src/services/vector-store.js
var DB_NAME = "vector-search";
var STORE = "vectors";
var VERSION = 1;
function promisify(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
var VectorStore = class {
  /**
   * @param {Object} [opts]
   * @param {string} [opts.dbName]
   * @param {IDBFactory} [opts.idbFactory] - injectable for tests
   */
  constructor(opts = {}) {
    this.dbName = opts.dbName || DB_NAME;
    this.idbFactory = opts.idbFactory !== void 0 ? opts.idbFactory : typeof indexedDB !== "undefined" ? indexedDB : null;
    this.db = null;
    this._mem = /* @__PURE__ */ new Map();
    this._useMemory = !this.idbFactory;
  }
  /**
   * Open (or create) the database.
   * @returns {Promise<void>}
   */
  async open() {
    if (this.db) return;
    if (this._useMemory || !this.idbFactory) {
      this._useMemory = true;
      return;
    }
    const req = this.idbFactory.open(this.dbName, VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    this.db = await promisify(req);
  }
  /**
   * Store a single post vector.
   * @param {Object} record - { id, url, vector: Array<[term, weight]>, post }
   * @returns {Promise<void>}
   */
  async put(record) {
    await this.open();
    if (this._useMemory) {
      this._mem.set(record.id, record);
      return;
    }
    const tx = this.db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record);
    return promisify(tx);
  }
  /**
   * Bulk store vectors (used to warm the offline cache).
   * @param {Array<Object>} records
   * @returns {Promise<void>}
   */
  async bulkPut(records) {
    await this.open();
    if (this._useMemory) {
      for (const r of records) this._mem.set(r.id, r);
      return;
    }
    const tx = this.db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    for (const r of records) store.put(r);
    return promisify(tx);
  }
  /**
   * Get a stored vector by id.
   * @param {string} id
   * @returns {Promise<Object|undefined>}
   */
  async get(id) {
    await this.open();
    if (this._useMemory) return this._mem.get(id);
    const tx = this.db.transaction(STORE, "readonly");
    return promisify(tx.objectStore(STORE).get(id));
  }
  /**
   * Retrieve all stored vectors (for offline search).
   * @returns {Promise<Array<Object>>}
   */
  async getAll() {
    await this.open();
    if (this._useMemory) return [...this._mem.values()];
    const tx = this.db.transaction(STORE, "readonly");
    return promisify(tx.objectStore(STORE).getAll());
  }
  /**
   * Clear all stored vectors.
   * @returns {Promise<void>}
   */
  async clear() {
    await this.open();
    if (this._useMemory) {
      this._mem.clear();
      return;
    }
    const tx = this.db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    return promisify(tx);
  }
  /**
   * True if running on the in-memory fallback (no IndexedDB).
   * @returns {boolean}
   */
  isMemoryFallback() {
    return this._useMemory;
  }
};

// src/services/pwa-service.js
var PWA_CONFIG = {
  swUrl: "/sw.js",
  manifestUrl: "/manifest.json",
  enableInstallPrompt: true,
  enableBackgroundSync: true,
  enableOfflineAnalytics: true,
  cacheVersion: "v1",
  installPromptDelay: 2e3,
  installBannerTimeout: 1e4
};
var PWAService = class {
  /**
   * Create PWAService instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = { ...PWA_CONFIG, ...options };
    this.storage = new LocalStorage("pwa_state");
    this.state = {
      deferredPrompt: null,
      isOffline: !navigator.onLine,
      swRegistration: null,
      isInstalled: false,
      updateAvailable: false
    };
    this.elements = {};
    this.offlineQueue = [];
    this.vectorStore = new VectorStore();
    this.handleOnline = this.handleOnline.bind(this);
    this.handleOffline = this.handleOffline.bind(this);
  }
  /**
   * Initialize PWA system
   * @returns {Promise<void>}
   */
  async init() {
    await Promise.all([
      this.checkInstallStatus(),
      this.setupServiceWorker(),
      this.setupConnectivityListener()
    ]);
    if (this.options.enableInstallPrompt) {
      this.setupInstallPrompt();
    }
    if (this.options.enableBackgroundSync) {
      this.setupBackgroundSync();
    }
    this.warmVectorCache();
    this.log("PWAService initialized");
  }
  /**
   * Check if app is installed
   * @returns {void}
   */
  checkInstallStatus() {
    var _a;
    const displayModeStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const iosStandalone = window.navigator.standalone === true;
    const androidWebview = (_a = document.referrer) == null ? void 0 : _a.includes("android-app://");
    this.state.isInstalled = displayModeStandalone || iosStandalone || androidWebview;
    if (this.state.isInstalled) {
      this.trackEvent("app_launched", { mode: "installed" });
    }
    return Promise.resolve();
  }
  /**
   * Register service worker
   * @returns {Promise<ServiceWorkerRegistration|null>}
   */
  async setupServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      this.warn("Service Workers not supported");
      return null;
    }
    try {
      const registration = await navigator.serviceWorker.register(this.options.swUrl, {
        scope: "/",
        updateViaCache: "none"
      });
      this.state.swRegistration = registration;
      this.log("Service Worker registered", { scope: registration.scope });
      this.setupUpdateListener(registration);
      return registration;
    } catch (error2) {
      this.error("SW registration failed", error2);
      return null;
    }
  }
  /**
   * Listen for SW updates
   * @param {ServiceWorkerRegistration} registration - SW registration
   * @returns {void}
   */
  setupUpdateListener(registration) {
    registration.addEventListener("updatefound", () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;
      installingWorker.addEventListener("statechange", () => {
        if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
          this.state.updateAvailable = true;
          this.showUpdateNotification();
          this.trackEvent("sw_update_available");
        }
      });
    });
  }
  /**
   * Setup install prompt handlers
   * @returns {void}
   */
  setupInstallPrompt() {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.state.deferredPrompt = e;
      this.log("Install prompt available");
      setTimeout(() => this.showInstallBanner(), this.options.installPromptDelay);
    });
    window.addEventListener("appinstalled", () => {
      this.state.deferredPrompt = null;
      this.hideInstallBanner();
      this.trackEvent("app_installed");
      this.log("App installed successfully");
    });
  }
  /**
   * Setup online/offline listeners
   * @returns {void}
   */
  setupConnectivityListener() {
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);
    this.state.isOffline = !navigator.onLine;
  }
  /**
   * Handle online event
   * @returns {void}
   */
  handleOnline() {
    this.state.isOffline = false;
    this.hideOfflineMessage();
    this.syncOfflineActions();
    this.trackEvent("connectivity_restored");
  }
  /**
   * Handle offline event
   * @returns {void}
   */
  handleOffline() {
    this.state.isOffline = true;
    this.showOfflineMessage();
    this.trackEvent("connectivity_lost");
  }
  /**
   * Setup background sync
   * @returns {Promise<void>}
   */
  async setupBackgroundSync() {
    if (!("serviceWorker" in navigator) || !("SyncManager" in window)) {
      this.warn("Background Sync not supported");
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register("background-sync");
      this.log("Background Sync registered");
    } catch (error2) {
      this.error("Background Sync registration failed", error2);
    }
  }
  /**
   * Warm the offline vector-search cache.
   * Fetches the search index, builds TF-IDF vectors for every post, and stores
   * them in IndexedDB so semantic search keeps working offline. No-op when
   * offline or when IndexedDB is unavailable (falls back to in-memory).
   * @returns {Promise<void>}
   */
  async warmVectorCache() {
    if (this.state.isOffline) return;
    try {
      const { VectorSearch: VectorSearch2 } = await Promise.resolve().then(() => (init_vector_search(), vector_search_exports));
      const response = await fetch("/search.json");
      if (!response.ok) return;
      const data = await response.json();
      const posts = Array.isArray(data) ? data : data.posts || data.entries || data.results || [];
      if (!posts.length) return;
      const vs = new VectorSearch2(posts);
      const records = posts.map((post, idx) => ({
        id: String(idx),
        url: post.url || "",
        title: post.title || "",
        vector: [...vs.documents[idx].vector.entries()],
        post
      }));
      await this.vectorStore.bulkPut(records);
      this.log("Vector search cache warmed", { count: records.length });
    } catch (error2) {
      this.warn("Vector cache warm failed", error2);
    }
  }
  /**
   * Show install banner
   * @returns {void}
   */
  showInstallBanner() {
    if (!this.state.deferredPrompt) return;
    this.hideInstallBanner();
    const banner = document.createElement("div");
    banner.className = "pwa-install-banner";
    banner.setAttribute("role", "alertdialog");
    banner.setAttribute("aria-label", "Install application");
    banner.innerHTML = `
      <div class="pwa-install-content">
        <div class="pwa-install-info">
          <div class="pwa-install-icon">
            <img src="/assets/images/icon-192.png" alt="App Icon" />
          </div>
          <div class="pwa-install-text">
            <h3>Install Engineering Blog</h3>
            <p>Get the best experience with offline access</p>
          </div>
        </div>
        <div class="pwa-install-actions">
          <button class="pwa-install-btn" id="pwa-install" aria-label="Install application">
            <span class="install-icon">\u{1F4F1}</span>
            <span>Install</span>
          </button>
          <button class="pwa-install-dismiss" id="pwa-dismiss" aria-label="Dismiss">
            <span>\u2715</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);
    this.bindInstallEvents(banner);
    this.installBannerTimer = setTimeout(() => {
      this.hideInstallBanner();
    }, this.options.installBannerTimeout);
  }
  /**
   * Bind install banner events
   * @param {HTMLElement} banner - Banner element
   * @returns {void}
   */
  bindInstallEvents(banner) {
    const installBtn = banner.querySelector("#pwa-install");
    const dismissBtn = banner.querySelector("#pwa-dismiss");
    installBtn == null ? void 0 : installBtn.addEventListener("click", async () => {
      await this.promptInstall();
    });
    dismissBtn == null ? void 0 : dismissBtn.addEventListener("click", () => {
      this.hideInstallBanner();
      this.storage.set("install_dismissed", Date.now());
    });
  }
  /**
   * Prompt user to install
   * @returns {Promise<boolean>} Success status
   */
  async promptInstall() {
    if (!this.state.deferredPrompt) return false;
    try {
      const { outcome } = await this.state.deferredPrompt.prompt();
      this.state.deferredPrompt = null;
      this.trackEvent("install_prompt_response", { outcome });
      this.hideInstallBanner();
      return outcome === "accepted";
    } catch (error2) {
      this.error("Install prompt failed", error2);
      return false;
    }
  }
  /**
   * Hide install banner
   * @returns {void}
   */
  hideInstallBanner() {
    const banner = document.querySelector(".pwa-install-banner");
    if (banner) {
      banner.remove();
    }
    if (this.installBannerTimer) {
      clearTimeout(this.installBannerTimer);
    }
  }
  /**
   * Show offline message
   * @returns {void}
   */
  showOfflineMessage() {
    const existingMessage = document.querySelector(".pwa-offline-message");
    if (existingMessage) return;
    const message = document.createElement("div");
    message.className = "pwa-offline-message";
    message.setAttribute("role", "status");
    message.setAttribute("aria-live", "polite");
    message.innerHTML = `
      <div class="offline-content">
        <span class="offline-icon">\u{1F4E1}</span>
        <span>You're offline. Some features may be limited.</span>
      </div>
    `;
    document.body.appendChild(message);
    this.elements.offlineMessage = message;
  }
  /**
   * Hide offline message
   * @returns {void}
   */
  hideOfflineMessage() {
    if (this.elements.offlineMessage) {
      this.elements.offlineMessage.remove();
      this.elements.offlineMessage = null;
    }
  }
  /**
   * Queue action for offline sync
   * @param {Object} action - Action to queue
   * @returns {void}
   */
  queueOfflineAction(action) {
    this.offlineQueue.push({
      ...action,
      timestamp: Date.now(),
      queued: this.state.isOffline
    });
    if (this.options.enableOfflineAnalytics) {
      this.storage.set("offline_queue", this.offlineQueue);
    }
  }
  /**
   * Sync offline actions when back online
   * @returns {Promise<void>}
   */
  async syncOfflineActions() {
    if (this.offlineQueue.length === 0) return;
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];
    for (const action of queue) {
      try {
        await this.syncAction(action);
      } catch (error2) {
        this.error("Failed to sync action", { action, error: error2 });
        this.offlineQueue.push(action);
      }
    }
    if (this.options.enableOfflineAnalytics) {
      this.storage.set("offline_queue", this.offlineQueue);
    }
  }
  /**
   * Sync individual action
   * @param {Object} action - Action to sync
   * @returns {Promise<void>}
   */
  async syncAction(action) {
    const response = await fetch(action.url, {
      method: action.method || "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action.data),
      keepalive: true
    });
    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }
  }
  /**
   * Show update notification
   * @returns {void}
   */
  showUpdateNotification() {
    var _a;
    const notification = document.createElement("div");
    notification.className = "pwa-update-notification";
    notification.setAttribute("role", "alert");
    notification.innerHTML = `
      <div class="update-content">
        <span>A new version is available!</span>
        <button class="update-btn" id="pwa-update">Refresh</button>
      </div>
    `;
    document.body.appendChild(notification);
    (_a = document.querySelector("#pwa-update")) == null ? void 0 : _a.addEventListener("click", () => {
      window.location.reload();
    });
  }
  /**
   * Track PWA event
   * @param {string} eventName - Event name
   * @param {Object} data - Event data
   * @returns {void}
   */
  trackEvent(eventName, data = {}) {
    if (typeof gtag !== "undefined") {
      gtag("event", eventName, {
        event_category: "pwa",
        ...data
      });
    }
    if (navigator.sendBeacon) {
      const payload = JSON.stringify({
        event: eventName,
        category: "pwa",
        data,
        timestamp: Date.now()
      });
      navigator.sendBeacon("/api/analytics", payload);
    }
  }
  /**
   * Get installation status
   * @returns {boolean} True if installed
   */
  isAppInstalled() {
    return this.state.isInstalled;
  }
  /**
   * Get offline status
   * @returns {boolean} True if offline
   */
  isOffline() {
    return this.state.isOffline;
  }
  /**
   * Get service worker registration
   * @returns {ServiceWorkerRegistration|null}
   */
  getRegistration() {
    return this.state.swRegistration;
  }
  /**
   * Manual SW update check
   * @returns {Promise<void>}
   */
  async checkForUpdates() {
    if (!this.state.swRegistration) return;
    try {
      await this.state.swRegistration.update();
      this.log("Checked for SW updates");
    } catch (error2) {
      this.error("SW update check failed", error2);
    }
  }
  /**
   * Unregister service worker
   * @returns {Promise<boolean>}
   */
  async unregisterServiceWorker() {
    if (!this.state.swRegistration) return false;
    try {
      await this.state.swRegistration.unregister();
      this.state.swRegistration = null;
      this.log("Service Worker unregistered");
      return true;
    } catch (error2) {
      this.error("SW unregistration failed", error2);
      return false;
    }
  }
  /**
   * Logging helper
   * @param {string} message - Log message
   * @param {any} data - Additional data
   * @returns {void}
   */
  log(message, data = null) {
    if (this.options.debugMode) {
      console.log(`[PWA] ${message}`, data || "");
    }
  }
  /**
   * Warning helper
   * @param {string} message - Warning message
   * @param {any} data - Additional data
   * @returns {void}
   */
  warn(message, data = null) {
    if (this.options.debugMode) {
      console.warn(`[PWA] ${message}`, data || "");
    }
  }
  /**
   * Error helper
   * @param {string} message - Error message
   * @param {Error} error - Error object
   * @returns {void}
   */
  error(message, error2 = null) {
    if (this.options.debugMode) {
      console.error(`[PWA] ${message}`, error2 || "");
    }
  }
  /**
   * Destroy PWA service and cleanup
   * @returns {void}
   */
  destroy() {
    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);
    this.hideInstallBanner();
    this.hideOfflineMessage();
    if (this.installBannerTimer) {
      clearTimeout(this.installBannerTimer);
    }
  }
};
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", async () => {
    if ("serviceWorker" in navigator) {
      window.pwaService = new PWAService({
        debugMode: window.pwaDebug || false
      });
      await window.pwaService.init();
    }
  });
}

// src/index.js
var App = {
  config: DEFAULT_CONFIG,
  cssClasses: CSS_CLASSES,
  ariaLabels: ARIA_LABELS,
  events: EVENT_NAMES,
  helpers: {
    debounce,
    throttle,
    generateId,
    getNestedValue,
    deepMerge,
    isObject,
    isInViewport,
    smoothScrollTo,
    loadScript,
    loadCSS,
    supports,
    getDeviceInfo,
    formatDate: formatDate2,
    escapeHTML,
    parseQueryParams,
    createElement
  },
  storage: {
    LocalStorage,
    SessionStorage,
    theme: themeStorage,
    language: languageStorage
  },
  theme: null,
  i18n: null,
  imageOptimizer: null,
  searchEngine: null,
  socialSharing: null,
  subscription: null,
  analytics: null,
  pwa: null
};
function startApp() {
  if (typeof document === "undefined") return;
  if (!App.theme) {
    App.theme = new ThemeManager({
      container: ".theme-toggle",
      onThemeChange: (theme) => {
        document.documentElement.setAttribute("data-theme", theme);
        window.dispatchEvent(new CustomEvent(EVENT_NAMES.THEME_CHANGED, { detail: { theme } }));
      }
    });
    document.documentElement.setAttribute("data-theme", App.theme.currentTheme);
  }
  if (!App.i18n) {
    App.i18n = new I18nManager();
    window.i18n = App.i18n;
    window.t = (key, params) => App.i18n.t(key, params);
  }
  if (!App.imageOptimizer && document.querySelector("img[data-src], img[data-responsive]")) {
    App.imageOptimizer = new ImageOptimizer();
    window.imageOptimizer = App.imageOptimizer;
  }
  if (!App.searchEngine && (document.querySelector("[data-search]") || document.getElementById("semantic-search-modal"))) {
    App.searchEngine = new SearchEngine();
    window.searchEngine = App.searchEngine;
  }
  if (!App.semanticSearch && document.getElementById("semantic-search-modal") && App.searchEngine) {
    Promise.resolve().then(() => (init_search_ui(), search_ui_exports)).then(({ SearchUI: SearchUI2 }) => {
      App.semanticSearch = new SearchUI2({ searchService: App.searchEngine });
      window.semanticSearchUI = App.semanticSearch;
      App.searchEngine.loadSearchIndex().then(() => {
        const count = App.searchEngine.posts ? App.searchEngine.posts.length : 0;
        App.semanticSearch.updateIndexInfo(count);
      }).catch(() => {
      });
    });
  }
  const openTriggers = document.querySelectorAll("[data-open-semantic-search]");
  openTriggers.forEach((btn) => {
    btn.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("open-semantic-search"));
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.altKey && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent("open-semantic-search"));
    }
  });
  if (!App.socialSharing && document.querySelector(".social-sharing")) {
    App.socialSharing = new SocialSharing();
    window.socialSharing = App.socialSharing;
  }
  if (!App.subscription && document.querySelector(".subscription-container, .floating-subscription")) {
    App.subscription = new SubscriptionSystem({
      rssUrl: "/feed.xml",
      subscriptionEndpoint: "/api/subscribe",
      verificationEndpoint: "/api/verify-email",
      unsubscribeEndpoint: "/api/unsubscribe"
    });
    window.subscriptionSystem = App.subscription;
  }
  const shouldInitAnalytics = window.location.hostname !== "localhost" || window.analyticsDebug === true;
  if (!App.analytics && shouldInitAnalytics) {
    App.analytics = new AnalyticsService({
      endpoint: "/api/analytics",
      trackWebVitals: true,
      trackUserBehavior: true,
      trackPerformance: true,
      debugMode: window.analyticsDebug || false,
      sampleRate: 0.1
    });
    App.analytics.init();
    window.analyticsService = App.analytics;
  }
  if (!App.pwa && "serviceWorker" in navigator) {
    App.pwa = new PWAService({
      debugMode: window.pwaDebug || false
    });
    App.pwa.init().then(() => {
      window.pwaService = App.pwa;
    });
  }
  if (!App.prefetch) {
    Promise.resolve().then(() => (init_prefetch(), prefetch_exports)).then(({ PrefetchService: PrefetchService2 }) => {
      App.prefetch = new PrefetchService2({
        graphUrl: "/assets/data/knowledge-graph.json",
        enabled: window.prefetchEnabled !== false
      });
      App.prefetch.init().then((ok) => {
        if (ok) App.prefetch.observeLinks(document);
        window.prefetchService = App.prefetch;
      }).catch(() => {
      });
    }).catch(() => {
    });
  }
  window.App = App;
  window.dispatchEvent(new CustomEvent(EVENT_NAMES.MODULE_LOADED, { detail: { module: "app" } }));
}
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApp, { once: true });
  } else {
    startApp();
  }
}
var index_default = App;
export {
  App,
  index_default as default,
  startApp
};
//# sourceMappingURL=refactored-bundle.js.map
