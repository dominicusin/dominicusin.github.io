/**
 * Prefetch Service - Knowledge Graph driven predictive prefetching (Vector D)
 *
 * Preloads related articles based on the generated knowledge graph so that
 * navigating between semantically linked posts feels instant. Prefetch is
 * triggered on hover/focus and (optionally) when a link scrolls into view,
 * and is throttled to avoid wasting bandwidth on low-end devices.
 *
 * @version 3.0.0
 * @performance Targets INP < 100ms; prefetch happens off the critical path.
 */

const DEFAULT_OPTIONS = {
  graphUrl: '/data/knowledge-graph.json',
  maxPrefetch: 2,
  hoverDelayMs: 120,
  concurrency: 2,
  respectSaveData: true,
  respectReducedMotion: false,
  observeViewport: true,
  enabled: true,
  // Test/non-browser override of document (jsdom)
  _doc: typeof document !== 'undefined' ? document : null,
  // Test/non-browser override of fetch
  _fetch: typeof fetch !== 'undefined' ? fetch : null
};

export class PrefetchService {
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
    /** @type {Map<string, Array<{url:string, weight:number}>} } */
    this.adjacency = new Map();
    this.graphLoaded = false;
    this.currentUrl = '';
    this._inflight = new Set();
    this._scheduled = new Set();
    this._hoverTimers = new Map();
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
    const adj = new Map();
    if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
      return adj;
    }
    const urlById = new Map();
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
      // undirected: both directions get the same weight
      adj.get(sUrl).push({ url: tUrl, weight });
      adj.get(tUrl).push({ url: sUrl, weight });
    }
    // Dedupe + sort by weight desc
    for (const [url, list] of adj) {
      const seen = new Set();
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
    if (!doc || !doc.location) return '';
    // Strip origin + trailing slash to match graph url shape (/2026/..)
    try {
      const u = new URL(doc.location.href);
      return u.pathname.replace(/\/$/, '') || '/';
    } catch {
      return doc.location.pathname || '';
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
    } catch {
      this.graphLoaded = false;
      return false;
    }
  }

  /**
   * Detect Data-Saver preference (Chromium). Best-effort, never throws.
   * @private
   */
  _isSaveData() {
    const conn = (typeof navigator !== 'undefined' && navigator.connection) || {};
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
      const link = doc.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = 'document';
      (doc.head || doc.documentElement).appendChild(link);
      return true;
    } catch {
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
    const links = scope.querySelectorAll
      ? scope.querySelectorAll('a[href^="/"], a[href^="./"]')
      : [];
    links.forEach((a) => {
      if (a.__prefetchBound) return;
      a.__prefetchBound = true;
      const href = a.getAttribute('href');
      const handler = () => this._scheduleHover(href);
      a.addEventListener('mouseenter', handler);
      a.addEventListener('focus', handler);
      a.addEventListener('mouseleave', () => this._cancelHover(href));
      a.addEventListener('blur', () => this._cancelHover(href));
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
    const seen = new Set();
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
    }, { rootMargin: '200px' });
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
}

export default PrefetchService;
