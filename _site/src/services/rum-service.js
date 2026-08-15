/**
 * Real User Monitoring (RUM) Service v2.0
 * 
 * Optimized collection of Core Web Vitals with advanced analytics,
 * percentile calculations, and adaptive sampling.
 * 
 * Features:
 * - LCP (Largest Contentful Paint) with element attribution
 * - INP (Interaction to Next Paint) with interaction details
 * - CLS (Cumulative Layout Shift) with shift sources
 * - P75/P95/P99 percentile calculations
 * - Adaptive sampling based on device performance
 * - Batched metric submission with retry logic
 * - Offline support with IndexedDB persistence
 */

class RUMService {
  constructor(options = {}) {
    this.endpoint = options.endpoint || '/assets/rum/metrics.json';
    this.webhookUrl = options.webhookUrl || process.env.RUM_WEBHOOK_URL;
    this.sampleRate = options.sampleRate || 1.0;
    this.batchSize = options.batchSize || 10;
    this.flushInterval = options.flushInterval || 30000;
    this.maxRetries = options.maxRetries || 3;
    this.enableOffline = options.enableOffline !== false;
    
    this.metricsQueue = [];
    this.pendingMetrics = new Map(); // Track in-flight metrics
    this.retryCounts = new Map();
    
    // Enhanced thresholds with percentiles
    this.thresholds = {
      lcp: { good: 2500, warning: 4000, poor: 4000 },
      inp: { good: 200, warning: 500, poor: 500 },
      cls: { good: 0.1, warning: 0.25, poor: 0.25 }
    };
    
    // Percentile tracking
    this.metricHistory = {
      lcp: [],
      inp: [],
      cls: []
    };
    this.maxHistorySize = 1000;
    
    this.initialized = false;
    this.db = null;
    this.deviceClass = this.detectDeviceClass();
  }

  /**
   * Detect device class for adaptive sampling
   */
  detectDeviceClass() {
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const connection = navigator.connection?.effectiveType || '4g';
    
    if (memory >= 8 && cores >= 8 && connection !== '2g' && connection !== 'slow-2g') {
      return 'high';
    } else if (memory >= 4 && cores >= 4) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Initialize RUM service with adaptive sampling
   */
  init() {
    if (this.initialized) return;
    
    // Adaptive sampling based on device class
    const adjustedSampleRate = this.getAdaptiveSampleRate();
    if (Math.random() > adjustedSampleRate) {
      console.log('[RUM] Sampling disabled for this session (device:', this.deviceClass + ')');
      return;
    }

    // Initialize offline storage
    if (this.enableOffline) {
      this.initIndexedDB();
    }

    this.setupLCPCollection();
    this.setupINPCollection();
    this.setupCLSCollection();
    this.setupFlushTimer();
    this.setupVisibilityHandler();
    
    this.initialized = true;
    console.log(`[RUM] Service initialized (sample rate: ${adjustedSampleRate}, device: ${this.deviceClass})`);
  }

  /**
   * Get adaptive sample rate based on device class
   */
  getAdaptiveSampleRate() {
    const baseRate = this.sampleRate;
    switch (this.deviceClass) {
      case 'high': return Math.min(baseRate, 1.0);
      case 'medium': return baseRate * 0.7;
      case 'low': return baseRate * 0.3;
      default: return baseRate;
    }
  }

  /**
   * Initialize IndexedDB for offline metric storage
   */
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('RUMMetrics', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('metrics')) {
          const store = db.createObjectStore('metrics', { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('name', 'name', { unique: false });
        }
      };
    });
  }

  /**
   * Setup Largest Contentful Paint collection with enhanced attribution
   */
  setupLCPCollection() {
    if (!('PerformanceObserver' in window)) return;

    let lcpValue = 0;
    let lcpEntry = null;

    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      lcpValue = lastEntry.startTime;
      lcpEntry = lastEntry;
    });

    lcpObserver.observe({ entryTypes: ['largest-contentful'], buffered: true });

    // Send LCP on page hide or visibility change
    const sendLCP = () => {
      if (lcpEntry && lcpValue > 0) {
        const attribution = this.getLCPAttribution(lcpEntry);
        this.recordMetric('lcp', lcpValue, attribution);
        lcpObserver.disconnect();
      }
    };

    window.addEventListener('pagehide', sendLCP, { once: true });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        sendLCP();
      }
    }, { once: false });
  }

  /**
   * Extract detailed LCP attribution
   */
  getLCPAttribution(entry) {
    const attribution = {
      element: entry.element?.tagName || 'unknown',
      url: window.location.pathname,
      size: entry.size || 0,
      loadTime: entry.startTime || 0,
      renderDelay: 0,
      loadDelay: 0,
      elementDelay: 0
    };

    // Calculate timing breakdown if available
    if (entry.url) {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        attribution.renderDelay = navigation.responseStart - navigation.requestStart;
        attribution.loadDelay = entry.startTime - navigation.responseStart;
      }
    }

    return attribution;
  }

  /**
   * Setup Interaction to Next Paint collection with enhanced tracking
   */
  setupINPCollection() {
    if (!('PerformanceObserver' in window)) return;

    let inpValue = 0;
    let inpEntry = null;
    const interactionMap = new Map();
    const MAX_INTERACTIONS = 100;

    const eventHandler = (event) => {
      const startTime = event.timeStamp;
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.duration > inpValue) {
            inpValue = entry.duration;
            inpEntry = entry;
          }
        }
      });

      observer.observe({ entryTypes: ['event'], buffered: true });
      
      // Store interaction for later analysis (limit memory usage)
      if (interactionMap.size < MAX_INTERACTIONS) {
        interactionMap.set(startTime, {
          type: event.type,
          target: event.target?.tagName || 'unknown',
          timestamp: startTime,
          duration: 0
        });
      }
    };

    ['click', 'keydown', 'touchstart', 'mousedown', 'pointerdown'].forEach(eventType => {
      window.addEventListener(eventType, eventHandler, { passive: true, capture: true });
    });

    // Send INP on page hide or visibility change
    const sendINP = () => {
      if (inpEntry && inpValue > 0) {
        const attribution = this.getINPAttribution(inpEntry, interactionMap);
        this.recordMetric('inp', inpValue, attribution);
      }
    };

    window.addEventListener('pagehide', sendINP, { once: true });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        sendINP();
      }
    }, { once: false });
  }

  /**
   * Extract detailed INP attribution
   */
  getINPAttribution(entry, interactionMap) {
    const interaction = Array.from(interactionMap.values()).find(
      i => Math.abs(i.timestamp - entry.startTime) < 100
    );

    return {
      element: entry.target?.tagName || 'unknown',
      eventType: entry.name,
      url: window.location.pathname,
      processingTime: entry.processingStart ? entry.processingEnd - entry.processingStart : 0,
      presentationDelay: entry.startTime - (entry.processingStart || entry.startTime),
      interactionType: interaction?.type || 'unknown',
      interactionTarget: interaction?.target || 'unknown',
      totalInteractions: interactionMap.size
    };
  }

  /**
   * Setup Cumulative Layout Shift collection with source attribution
   */
  setupCLSCollection() {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    const clsEntries = [];
    const MAX_SHIFTS = 50;

    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          if (clsEntries.length < MAX_SHIFTS) {
            clsEntries.push(entry);
          }
        }
      }
    });

    clsObserver.observe({ entryTypes: ['layout-shift'], buffered: true });

    // Send CLS on page hide or visibility change
    const sendCLS = () => {
      if (clsValue > 0) {
        const attribution = this.getCLSAttribution(clsEntries, clsValue);
        this.recordMetric('cls', clsValue, attribution);
      }
    };

    window.addEventListener('pagehide', sendCLS, { once: true });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        sendCLS();
      }
    }, { once: false });
  }

  /**
   * Extract detailed CLS attribution
   */
  getCLSAttribution(entries, totalValue) {
    const largestShift = entries.reduce((max, entry) => 
      entry.value > max.value ? entry : max, 
      { value: 0 }
    );

    // Get sources of the largest shift
    const sources = largestShift.sources?.map(source => ({
      node: source.node?.tagName || 'unknown',
      selector: source.node?.id ? `#${source.node.id}` : 
                source.node?.className ? `.${source.node.className}` : 'unknown',
      value: source.value || 0
    })) || [];

    return {
      url: window.location.pathname,
      shifts: entries.length,
      largestShift: largestShift.value || 0,
      largestShiftTime: largestShift.startTime || 0,
      sources: sources.slice(0, 5), // Limit to top 5 sources
      totalValue: totalValue
    };
  }

  /**
   * Setup visibility change handler for flushing metrics
   */
  setupVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Flush all pending metrics when page is hidden
        this.flush(true);
      }
    });
  }

  /**
   * Record a metric value with percentile tracking
   */
  recordMetric(name, value, metadata = {}) {
    const metric = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      value,
      timestamp: Date.now(),
      url: window.location.pathname,
      userAgent: navigator.userAgent,
      connection: navigator.connection?.effectiveType,
      deviceMemory: navigator.deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceClass: this.deviceClass,
      ...metadata
    };

    this.metricsQueue.push(metric);

    // Track history for percentile calculations
    if (this.metricHistory[name]) {
      this.metricHistory[name].push(value);
      // Keep only recent history
      if (this.metricHistory[name].length > this.maxHistorySize) {
        this.metricHistory[name].shift();
      }
    }

    // Check thresholds and trigger alerts if needed
    this.checkThresholds(name, value);

    // Flush if batch is full
    if (this.metricsQueue.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Calculate percentiles from metric history
   */
  calculatePercentiles(metricName) {
    const values = this.metricHistory[metricName];
    if (!values || values.length === 0) return { p75: 0, p95: 0, p99: 0 };

    const sorted = [...values].sort((a, b) => a - b);
    const len = sorted.length;

    return {
      p75: sorted[Math.floor(len * 0.75)] || 0,
      p95: sorted[Math.floor(len * 0.95)] || 0,
      p99: sorted[Math.floor(len * 0.99)] || 0,
      count: len,
      avg: values.reduce((a, b) => a + b, 0) / len
    };
  }

  /**
   * Get all percentiles for dashboard display
   */
  getPercentiles() {
    return {
      lcp: this.calculatePercentiles('lcp'),
      inp: this.calculatePercentiles('inp'),
      cls: this.calculatePercentiles('cls')
    };
  }

  /**
   * Check if metric exceeds thresholds and send alerts
   */
  checkThresholds(name, value) {
    const threshold = this.thresholds[name];
    if (!threshold) return;

    let severity = null;
    if (value > threshold.warning) {
      severity = 'poor';
    } else if (value > threshold.good) {
      severity = 'warning';
    }

    if (severity && this.webhookUrl) {
      this.sendAlert(name, value, severity, threshold);
    }
  }

  /**
   * Send alert to webhook (Slack/Discord)
   */
  async sendAlert(name, value, severity, threshold) {
    const alert = {
      metric: name.toUpperCase(),
      value: Math.round(value),
      threshold: threshold[severity],
      severity,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    const message = this.formatAlertMessage(alert);

    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      console.log(`[RUM] Alert sent for ${name}: ${value}`);
    } catch (error) {
      console.error('[RUM] Failed to send alert:', error);
    }
  }

  /**
   * Format alert message for Slack/Discord
   */
  formatAlertMessage(alert) {
    const emoji = alert.severity === 'poor' ? '🚨' : '⚠️';
    
    return {
      text: `${emoji} Performance Alert: ${alert.metric} degradation`,
      attachments: [{
        color: alert.severity === 'poor' ? 'danger' : 'warning',
        fields: [
          { title: 'Metric', value: alert.metric, short: true },
          { title: 'Value', value: `${alert.value}ms`, short: true },
          { title: 'Threshold', value: `${alert.threshold}ms`, short: true },
          { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
          { title: 'URL', value: alert.url, short: false },
          { title: 'Time', value: alert.timestamp, short: false }
        ]
      }]
    };
  }

  /**
   * Flush metrics queue to server with retry logic and offline support
   */
  async flush(isPageHide = false) {
    if (this.metricsQueue.length === 0) return;

    const metrics = [...this.metricsQueue];
    
    // For page hide, use sendBeacon for reliable delivery
    if (isPageHide && navigator.sendBeacon) {
      try {
        const blob = new Blob([JSON.stringify(metrics)], { type: 'application/json' });
        const sent = navigator.sendBeacon(this.endpoint, blob);
        if (sent) {
          this.metricsQueue = [];
          console.log('[RUM] Metrics sent via sendBeacon:', metrics.length);
        } else {
          // Fallback to storing in IndexedDB
          await this.storeMetricsOffline(metrics);
        }
      } catch (error) {
        console.error('[RUM] sendBeacon failed:', error);
        await this.storeMetricsOffline(metrics);
      }
      return;
    }

    // Normal flush with retry logic
    this.metricsQueue = [];
    
    try {
      await this.sendMetricsWithRetry(metrics);
    } catch (error) {
      console.error('[RUM] Failed to flush metrics after retries:', error);
      // Store offline on permanent failure
      await this.storeMetricsOffline(metrics);
    }
  }

  /**
   * Send metrics with exponential backoff retry
   */
  async sendMetricsWithRetry(metrics, attempt = 1) {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics, timestamp: Date.now() })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      console.log(`[RUM] Metrics flushed successfully: ${metrics.length}`);
      
      // Update aggregated metrics on success
      await this.updateAggregatedMetrics(metrics);
    } catch (error) {
      if (attempt < this.maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.log(`[RUM] Retry ${attempt}/${this.maxRetries} in ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendMetricsWithRetry(metrics, attempt + 1);
      } else {
        throw error;
      }
    }
  }

  /**
   * Store metrics in IndexedDB for offline sync
   */
  async storeMetricsOffline(metrics) {
    if (!this.db || !this.enableOffline) {
      console.warn('[RUM] Offline storage not available');
      return;
    }

    try {
      const transaction = this.db.transaction(['metrics'], 'readwrite');
      const store = transaction.objectStore('metrics');
      
      for (const metric of metrics) {
        store.put(metric);
      }

      await new Promise((resolve, reject) => {
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
      });

      console.log(`[RUM] Stored ${metrics.length} metrics offline`);
    } catch (error) {
      console.error('[RUM] Failed to store metrics offline:', error);
    }
  }

  /**
   * Sync offline metrics when connection is restored
   */
  async syncOfflineMetrics() {
    if (!this.db || !this.enableOffline) return;

    try {
      const transaction = this.db.transaction(['metrics'], 'readwrite');
      const store = transaction.objectStore('metrics');
      
      const metrics = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (metrics.length > 0) {
        console.log(`[RUM] Syncing ${metrics.length} offline metrics`);
        await this.sendMetricsWithRetry(metrics);
        
        // Clear synced metrics
        const clearRequest = store.clear();
        await new Promise((resolve, reject) => {
          clearRequest.onsuccess = resolve;
          clearRequest.onerror = () => reject(clearRequest.error);
        });
      }
    } catch (error) {
      console.error('[RUM] Failed to sync offline metrics:', error);
    }
  }

  /**
   * Update aggregated metrics with percentile data
   */
  async updateAggregatedMetrics(newMetrics) {
    const storageKey = 'rum_aggregated_metrics';
    let aggregated = JSON.parse(localStorage.getItem(storageKey) || '{}');
    
    // Initialize structure if needed
    if (!aggregated.current) {
      aggregated = {
        current: { lcp: 0, inp: 0, cls: 0 },
        percentiles: {
          lcp: { p75: 0, p95: 0, p99: 0 },
          inp: { p75: 0, p95: 0, p99: 0 },
          cls: { p75: 0, p95: 0, p99: 0 }
        },
        trends: {
          dates: this.getLast7Days(),
          lcp: [],
          inp: [],
          cls: []
        },
        byDeviceClass: {
          high: { lcp: 0, inp: 0, cls: 0, count: 0 },
          medium: { lcp: 0, inp: 0, cls: 0, count: 0 },
          low: { lcp: 0, inp: 0, cls: 0, count: 0 }
        },
        alerts: [],
        pageViews: {},
        lastUpdated: new Date().toISOString()
      };
    }

    // Update current values (weighted average)
    newMetrics.forEach(metric => {
      if (['lcp', 'inp', 'cls'].includes(metric.name)) {
        const count = aggregated.pageViews[metric.url] || 1;
        const oldValue = aggregated.current[metric.name] || 0;
        aggregated.current[metric.name] = ((oldValue * (count - 1)) + metric.value) / count;
        
        // Track by device class
        const deviceClass = metric.deviceClass || 'medium';
        if (aggregated.byDeviceClass[deviceClass]) {
          const dc = aggregated.byDeviceClass[deviceClass];
          dc[metric.name] = ((dc[metric.name] * dc.count) + metric.value) / (dc.count + 1);
          dc.count++;
        }
      }
      
      // Track page views
      aggregated.pageViews[metric.url] = (aggregated.pageViews[metric.url] || 0) + 1;
    });

    // Update percentiles from current history
    const percentiles = this.getPercentiles();
    aggregated.percentiles = percentiles;

    // Update trends (simplified)
    if (newMetrics.some(m => m.name === 'lcp')) {
      aggregated.trends.lcp.push(aggregated.current.lcp);
      if (aggregated.trends.lcp.length > 7) aggregated.trends.lcp.shift();
    }
    if (newMetrics.some(m => m.name === 'inp')) {
      aggregated.trends.inp.push(aggregated.current.inp);
      if (aggregated.trends.inp.length > 7) aggregated.trends.inp.shift();
    }
    if (newMetrics.some(m => m.name === 'cls')) {
      aggregated.trends.cls.push(aggregated.current.cls);
      if (aggregated.trends.cls.length > 7) aggregated.trends.cls.shift();
    }

    aggregated.lastUpdated = new Date().toISOString();
    
    localStorage.setItem(storageKey, JSON.stringify(aggregated));
    
    // Dispatch event for dashboard update
    window.dispatchEvent(new CustomEvent('rum-metrics-updated', { detail: aggregated }));
  }

  /**
   * Get last 7 days labels
   */
  getLast7Days() {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return dates;
  }

  /**
   * Setup periodic flush timer
   */
  setupFlushTimer() {
    setInterval(() => this.flush(), this.flushInterval);
  }

  /**
   * Get current metrics for debugging
   */
  getMetrics() {
    return {
      queued: this.metricsQueue.length,
      thresholds: this.thresholds,
      initialized: this.initialized,
      deviceClass: this.deviceClass,
      percentiles: this.getPercentiles(),
      historySize: {
        lcp: this.metricHistory.lcp.length,
        inp: this.metricHistory.inp.length,
        cls: this.metricHistory.cls.length
      }
    };
  }

  /**
   * Get detailed analytics report
   */
  getAnalyticsReport() {
    const percentiles = this.getPercentiles();
    const aggregated = JSON.parse(localStorage.getItem('rum_aggregated_metrics') || '{}');
    
    return {
      summary: {
        current: aggregated.current || { lcp: 0, inp: 0, cls: 0 },
        percentiles: percentiles,
        deviceBreakdown: aggregated.byDeviceClass || {}
      },
      trends: aggregated.trends || {},
      pageViews: aggregated.pageViews || {},
      health: this.getHealthStatus(percentiles)
    };
  }

  /**
   * Get health status based on percentiles
   */
  getHealthStatus(percentiles) {
    const getStatus = (value, thresholds) => {
      if (value <= thresholds.good) return 'good';
      if (value <= thresholds.warning) return 'warning';
      return 'poor';
    };

    return {
      lcp: getStatus(percentiles.lcp.p75, this.thresholds.lcp),
      inp: getStatus(percentiles.inp.p75, this.thresholds.inp),
      cls: getStatus(percentiles.cls.p75, this.thresholds.cls),
      overall: this.calculateOverallScore(percentiles)
    };
  }

  /**
   * Calculate overall performance score (0-100)
   */
  calculateOverallScore(percentiles) {
    const lcpScore = Math.max(0, 100 - (percentiles.lcp.p75 / 40));
    const inpScore = Math.max(0, 100 - (percentiles.inp.p75 / 5));
    const clsScore = Math.max(0, 100 - (percentiles.cls.p75 * 400));
    
    return Math.round((lcpScore + inpScore + clsScore) / 3);
  }

  /**
   * Enable online sync after connection restored
   */
  enableOnlineSync() {
    window.addEventListener('online', () => {
      console.log('[RUM] Connection restored, syncing offline metrics...');
      this.syncOfflineMetrics();
    });
  }
}

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
  window.rumService = new RUMService({
    sampleRate: 0.5, // Sample 50% of users
    webhookUrl: window.env?.RUM_WEBHOOK_URL,
    enableOffline: true,
    maxRetries: 3
  });
  
  document.addEventListener('DOMContentLoaded', () => {
    window.rumService.init();
    window.rumService.enableOnlineSync();
  });
}

export default RUMService;
