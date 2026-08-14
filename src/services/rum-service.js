/**
 * Real User Monitoring (RUM) Service
 * 
 * Collects Core Web Vitals metrics from real users and sends them
 * to the metrics endpoint for aggregation and visualization.
 * 
 * Features:
 * - LCP (Largest Contentful Paint)
 * - INP (Interaction to Next Paint)
 * - CLS (Cumulative Layout Shift)
 * - Automatic threshold checking and alerting
 * - Batched metric submission
 */

class RUMService {
  constructor(options = {}) {
    this.endpoint = options.endpoint || '/assets/rum/metrics.json';
    this.webhookUrl = options.webhookUrl || process.env.RUM_WEBHOOK_URL;
    this.sampleRate = options.sampleRate || 1.0; // 100% by default
    this.batchSize = options.batchSize || 10;
    this.flushInterval = options.flushInterval || 30000; // 30 seconds
    
    this.metricsQueue = [];
    this.thresholds = {
      lcp: { good: 2500, warning: 4000 },
      inp: { good: 200, warning: 500 },
      cls: { good: 0.1, warning: 0.25 }
    };
    
    this.initialized = false;
  }

  /**
   * Initialize RUM service and start collecting metrics
   */
  init() {
    if (this.initialized) return;
    
    // Check if we should sample this session
    if (Math.random() > this.sampleRate) {
      console.log('[RUM] Sampling disabled for this session');
      return;
    }

    this.setupLCPCollection();
    this.setupINPCollection();
    this.setupCLSCollection();
    this.setupFlushTimer();
    
    this.initialized = true;
    console.log('[RUM] Service initialized');
  }

  /**
   * Setup Largest Contentful Paint collection
   */
  setupLCPCollection() {
    if (!('PerformanceObserver' in window)) return;

    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      const lcpValue = lastEntry.startTime;
      this.recordMetric('lcp', lcpValue, {
        element: lastEntry.element?.tagName,
        url: window.location.pathname
      });
    });

    lcpObserver.observe({ entryTypes: ['largest-contentful'], buffered: true });
  }

  /**
   * Setup Interaction to Next Paint collection
   */
  setupINPCollection() {
    if (!('PerformanceObserver' in window)) return;

    let inpValue = 0;
    const interactionMap = new Map();

    const eventHandler = (event) => {
      const startTime = event.timeStamp;
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          const duration = entry.duration;
          if (duration > inpValue) {
            inpValue = duration;
          }
        }
      });

      observer.observe({ entryTypes: ['event'] });
      
      // Store interaction for later analysis
      interactionMap.set(startTime, {
        type: event.type,
        target: event.target?.tagName,
        timestamp: startTime
      });
    };

    ['click', 'keydown', 'touchstart', 'mousedown'].forEach(eventType => {
      window.addEventListener(eventType, eventHandler, { passive: true });
    });

    // Send INP on page hide
    window.addEventListener('pagehide', () => {
      if (inpValue > 0) {
        this.recordMetric('inp', inpValue, {
          interactions: interactionMap.size
        });
      }
    });
  }

  /**
   * Setup Cumulative Layout Shift collection
   */
  setupCLSCollection() {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    let clsEntries = [];

    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          clsEntries.push(entry);
        }
      }
    });

    clsObserver.observe({ entryTypes: ['layout-shift'], buffered: true });

    // Send CLS on page hide
    window.addEventListener('pagehide', () => {
      if (clsValue > 0) {
        this.recordMetric('cls', clsValue, {
          shifts: clsEntries.length,
          largestShift: Math.max(...clsEntries.map(e => e.value), 0)
        });
      }
    });
  }

  /**
   * Record a metric value
   */
  recordMetric(name, value, metadata = {}) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.pathname,
      userAgent: navigator.userAgent,
      connection: navigator.connection?.effectiveType,
      deviceMemory: navigator.deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
      ...metadata
    };

    this.metricsQueue.push(metric);

    // Check thresholds and trigger alerts if needed
    this.checkThresholds(name, value);

    // Flush if batch is full
    if (this.metricsQueue.length >= this.batchSize) {
      this.flush();
    }
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
   * Flush metrics queue to server
   */
  async flush() {
    if (this.metricsQueue.length === 0) return;

    const metrics = [...this.metricsQueue];
    this.metricsQueue = [];

    try {
      // In production, this would POST to your analytics endpoint
      // For now, we'll update the local metrics.json structure
      console.log('[RUM] Flushing metrics:', metrics.length);
      
      // Update aggregated metrics (simplified for demo)
      await this.updateAggregatedMetrics(metrics);
    } catch (error) {
      console.error('[RUM] Failed to flush metrics:', error);
      // Re-queue metrics on failure
      this.metricsQueue.unshift(...metrics);
    }
  }

  /**
   * Update aggregated metrics file
   */
  async updateAggregatedMetrics(newMetrics) {
    // This is a client-side simulation
    // In production, this would be handled by a server endpoint
    
    const storageKey = 'rum_aggregated_metrics';
    let aggregated = JSON.parse(localStorage.getItem(storageKey) || '{}');
    
    // Initialize structure if needed
    if (!aggregated.current) {
      aggregated = {
        current: { lcp: 0, inp: 0, cls: 0 },
        trends: {
          dates: this.getLast7Days(),
          lcp: [],
          inp: [],
          cls: []
        },
        alerts: [],
        pageViews: {},
        lastUpdated: new Date().toISOString()
      };
    }

    // Update current values (simple average for demo)
    newMetrics.forEach(metric => {
      if (['lcp', 'inp', 'cls'].includes(metric.name)) {
        const count = aggregated.pageViews[metric.url] || 1;
        const oldValue = aggregated.current[metric.name] || 0;
        aggregated.current[metric.name] = ((oldValue * (count - 1)) + metric.value) / count;
      }
      
      // Track page views
      aggregated.pageViews[metric.url] = (aggregated.pageViews[metric.url] || 0) + 1;
    });

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
      initialized: this.initialized
    };
  }
}

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
  window.rumService = new RUMService({
    sampleRate: 0.5, // Sample 50% of users
    webhookUrl: window.env?.RUM_WEBHOOK_URL
  });
  
  document.addEventListener('DOMContentLoaded', () => {
    window.rumService.init();
  });
}

export default RUMService;
