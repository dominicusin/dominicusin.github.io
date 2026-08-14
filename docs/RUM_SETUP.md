# RUM Dashboard Setup Guide

## Overview

The Real User Monitoring (RUM) system collects Core Web Vitals metrics from actual users visiting your site and provides a dashboard for visualization with automatic alerting.

## Metrics Collected

| Metric | Description | Good | Needs Improvement | Poor |
|--------|-------------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | Time to render largest content element | < 2.5s | 2.5-4.0s | > 4.0s |
| **INP** (Interaction to Next Paint) | Responsiveness to user interactions | < 200ms | 200-500ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | Visual stability during page load | < 0.1 | 0.1-0.25 | > 0.25 |

## Dashboard Access

The RUM Dashboard is available at:
```
/docs/rum-dashboard.html
```

**Note:** This page is only generated in production builds (`JEKYLL_ENV=production`).

### Features

- **Real-time metrics cards** showing current P95 values with status indicators
- **7-day trend charts** for LCP, INP, and CLS
- **Page views distribution** bar chart
- **Performance alerts** section with timestamped notifications
- **Dark mode support** via `prefers-color-scheme`
- **Responsive design** for mobile viewing

## Configuration

### Enable RUM Collection

Add the RUM service to your main JavaScript bundle:

```html
<script type="module">
  import RUMService from '/src/services/rum-service.js';
  
  window.rumService = new RUMService({
    sampleRate: 0.5,        // Sample 50% of users
    webhookUrl: 'YOUR_SLACK_WEBHOOK_URL',  // Optional
    batchSize: 10,          // Flush after 10 metrics
    flushInterval: 30000    // Flush every 30 seconds
  });
  
  document.addEventListener('DOMContentLoaded', () => {
    window.rumService.init();
  });
</script>
```

### Environment Variables

Set these environment variables for full functionality:

```bash
# Slack/Discord webhook for performance alerts
RUM_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Site base URL for proper metric attribution
SITE_BASE_URL=https://your-site.com
```

### Custom Thresholds

Modify thresholds in `src/services/rum-service.js`:

```javascript
this.thresholds = {
  lcp: { good: 2500, warning: 4000 },  // milliseconds
  inp: { good: 200, warning: 500 },    // milliseconds
  cls: { good: 0.1, warning: 0.25 }    // unitless score
};
```

## Alert Integration

### Slack Webhook

1. Create an Incoming Webhook in your Slack workspace
2. Copy the webhook URL
3. Set `RUM_WEBHOOK_URL` environment variable

Alert format:
```
🚨 Performance Alert: LCP degradation

Metric: LCP
Value: 4200ms
Threshold: 4000ms
Severity: POOR
URL: https://your-site.com/slow-page
Time: 2025-01-21T10:30:00Z
```

### Discord Webhook

Discord webhooks are also supported. Format the message:

```javascript
formatAlertMessage(alert) {
  return {
    embeds: [{
      title: `${alert.severity === 'poor' ? '🚨' : '⚠️'} Performance Alert`,
      color: alert.severity === 'poor' ? 15158332 : 15105570,
      fields: [
        { name: 'Metric', value: alert.metric, inline: true },
        { name: 'Value', value: `${alert.value}ms`, inline: true },
        { name: 'URL', value: alert.url, inline: false }
      ],
      timestamp: alert.timestamp
    }]
  };
}
```

## Interpreting Metrics

### LCP (Largest Contentful Paint)

**What it measures:** Time from page load to when the largest content element becomes visible.

**Common causes of poor LCP:**
- Slow server response times
- Render-blocking JavaScript/CSS
- Large unoptimized images
- Client-side rendering

**Improvement strategies:**
- Implement caching and CDN
- Preload critical resources
- Optimize and compress images
- Use server-side rendering

### INP (Interaction to Next Paint)

**What it measures:** Responsiveness to user interactions throughout the page lifecycle.

**Common causes of poor INP:**
- Long tasks blocking main thread
- Excessive JavaScript execution
- Complex CSS selectors
- Third-party scripts

**Improvement strategies:**
- Break up long tasks
- Use Web Workers for heavy computation
- Defer non-critical JavaScript
- Optimize event handlers

### CLS (Cumulative Layout Shift)

**What it measures:** Sum of all unexpected layout shifts during page load.

**Common causes of poor CLS:**
- Images without dimensions
- Dynamically injected content
- Web fonts causing FOIT/FOUT
- Ads/embeds without reserved space

**Improvement strategies:**
- Always include width/height on images
- Reserve space for dynamic content
- Use `font-display: optional` for web fonts
- Preallocate ad slots

## Data Storage

### Client-Side (Development)

Metrics are stored in `localStorage` under key `rum_aggregated_metrics`. Data persists across sessions but is cleared when localStorage is cleared.

### Server-Side (Production)

For production deployments, implement a server endpoint to:

1. Receive POST requests with metric batches
2. Aggregate metrics by date/page
3. Update `assets/rum/metrics.json` periodically
4. Store historical data in a database

Example endpoint structure:
```javascript
// POST /api/rum-metrics
{
  "metrics": [
    {
      "name": "lcp",
      "value": 1850,
      "timestamp": 1705834200000,
      "url": "/posts/edge-ai-guide",
      "userAgent": "...",
      "deviceMemory": 8
    }
  ]
}
```

## Privacy Considerations

The RUM service collects:
- Page URL (path only, no query parameters)
- User agent string
- Network connection type
- Device memory and CPU cores

**No personally identifiable information (PII) is collected.**

To further reduce data collection:

```javascript
new RUMService({
  sampleRate: 0.1,  // Only sample 10% of users
  // Omit sensitive metadata
  collectUserAgent: false,
  collectConnectionInfo: false
});
```

## Troubleshooting

### Dashboard shows fallback data

**Cause:** `metrics.json` file not found or invalid.

**Solution:** Ensure the file exists at `assets/rum/metrics.json` with valid JSON structure.

### No metrics appearing

**Causes:**
1. RUM service not initialized
2. Browser doesn't support PerformanceObserver
3. Sample rate too low

**Solution:** Check browser console for `[RUM] Service initialized` message.

### Alerts not sending

**Causes:**
1. Webhook URL not configured
2. Network error
3. Rate limiting

**Solution:** Verify `RUM_WEBHOOK_URL` is set and accessible. Check browser console for errors.

## Future Enhancements

Planned features:
- [ ] Multi-language support for alerts
- [ ] Custom metric tracking (FCP, TTFB, FID)
- [ ] A/B test integration
- [ ] Geographic breakdown
- [ ] Device type segmentation
- [ ] Export to Google Sheets/BigQuery
- [ ] Real-time WebSocket updates

## Related Documentation

- [Edge AI Guide](./EDGE_AI_GUIDE.md) - Performance optimization techniques
- [Decentralized Deploy](./DECENTRALIZED_DEPLOY.md) - IPFS deployment
- [CHANGELOG](./CHANGELOG.md) - Version history
