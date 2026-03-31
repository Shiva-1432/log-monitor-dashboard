/**
 * alerts.js
 * Analyses a batch of logs and returns triggered alerts.
 * In Phase 6 these will be persisted to DynamoDB.
 * For now they're computed on-the-fly from the log window.
 */

// ── Thresholds (will move to Settings in Phase 6) ─────────────
const THRESHOLDS = {
  errorRate:       30,   // % — fire CRITICAL if error rate exceeds this
  warnErrorRate:   10,   // % — fire WARNING if error rate exceeds this
  latencyP95:      800,  // ms — fire WARNING if P95 latency exceeds this
  minSampleSize:   10,   // minimum log count before alert fires
};

/**
 * Compute the P95 latency from an array of latency values.
 */
function p95(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx    = Math.floor(sorted.length * 0.95);
  return sorted[Math.min(idx, sorted.length - 1)];
}

/**
 * Analyse logs and return an array of alert objects.
 * @param {Array}  logs - from fetchAllLogs()
 * @returns {Array} alerts
 */
export function detectAlerts(logs) {
  const alerts = [];

  // Group logs by endpoint
  const byEndpoint = {};
  for (const log of logs) {
    const ep = log.endpoint ?? "unknown";
    if (!byEndpoint[ep]) byEndpoint[ep] = [];
    byEndpoint[ep].push(log);
  }

  for (const [endpoint, epLogs] of Object.entries(byEndpoint)) {
    if (epLogs.length < THRESHOLDS.minSampleSize) continue;

    const total     = epLogs.length;
    const errors    = epLogs.filter((l) => l.level === "ERROR").length;
    const errorRate = +((errors / total) * 100).toFixed(1);
    const latencies = epLogs.map((l) => l.latencyMs).filter(Boolean);
    const latencyP95Val = p95(latencies);

    // ── Critical: error rate > 30% ───────────────────────────
    if (errorRate > THRESHOLDS.errorRate) {
      alerts.push({
        id:          `alert-err-${endpoint}-${Date.now()}`,
        severity:    "critical",
        title:       `High Error Rate — ${endpoint}`,
        description: `Error rate is ${errorRate}% on ${endpoint} (threshold: ${THRESHOLDS.errorRate}%). ${errors} failures in the last window.`,
        time:        new Date().toISOString(),
        meta: {
          endpoint,
          "error rate":  `${errorRate}%`,
          threshold:     `${THRESHOLDS.errorRate}%`,
          "sample size": `${total} requests`,
        },
      });
    }

    // ── Warning: error rate > 10% ─────────────────────────────
    else if (errorRate > THRESHOLDS.warnErrorRate) {
      alerts.push({
        id:          `alert-warn-${endpoint}-${Date.now()}`,
        severity:    "warning",
        title:       `Elevated Error Rate — ${endpoint}`,
        description: `Error rate is ${errorRate}% on ${endpoint} — above warning threshold of ${THRESHOLDS.warnErrorRate}%.`,
        time:        new Date().toISOString(),
        meta: {
          endpoint,
          "error rate":  `${errorRate}%`,
          threshold:     `${THRESHOLDS.warnErrorRate}%`,
        },
      });
    }

    // ── Warning: P95 latency > 800ms ──────────────────────────
    if (latencyP95Val > THRESHOLDS.latencyP95) {
      alerts.push({
        id:          `alert-lat-${endpoint}-${Date.now()}`,
        severity:    "warning",
        title:       `Elevated Latency — ${endpoint}`,
        description: `P95 latency on ${endpoint} is ${latencyP95Val}ms (threshold: ${THRESHOLDS.latencyP95}ms). Possible cold start or downstream bottleneck.`,
        time:        new Date().toISOString(),
        meta: {
          endpoint,
          "p95 latency": `${latencyP95Val}ms`,
          threshold:     `${THRESHOLDS.latencyP95}ms`,
        },
      });
    }
  }

  // Sort: critical first
  const order = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3));

  return alerts;
}
