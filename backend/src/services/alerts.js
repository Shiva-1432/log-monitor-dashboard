import crypto from "crypto";
import { saveAlert } from "./dynamodb.js";

// ── Thresholds ─────────────────────────────────────────────────────────────
const ERROR_SPIKE_CRITICAL = 30;
const ERROR_SPIKE_WARNING  = 10;
const HIGH_LATENCY_MS      = 800;
const MIN_SAMPLE_SIZE      = 10;

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
 * @param {Array} logs - from fetchAllLogs()
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
    const sampleSize = epLogs.length;
    if (sampleSize < MIN_SAMPLE_SIZE) continue;

    const errors     = epLogs.filter((l) => l.level === "ERROR").length;
    const errorRate  = +((errors / sampleSize) * 100).toFixed(1);
    const latencies  = epLogs.map((l) => l.latencyMs).filter(Boolean);
    const latencyP95 = p95(latencies);
    const timestamp  = Date.now();

    // ── ERROR_SPIKE ─────────────────────────────────────────────────────────
    if (errorRate > ERROR_SPIKE_CRITICAL) {
      alerts.push({
        type:        "ERROR_SPIKE",
        severity:    "critical",
        title:       `High Error Rate — ${endpoint}`,
        description: `Error rate is ${errorRate}% on ${endpoint} (threshold: ${ERROR_SPIKE_CRITICAL}%). ${errors} failures in the last window.`,
        endpoint,
        timestamp,
        errorRate,
        latencyP95,
        threshold:   ERROR_SPIKE_CRITICAL,
        sampleSize,
        meta: {
          endpoint,
          "error rate":  `${errorRate}%`,
          threshold:     `${ERROR_SPIKE_CRITICAL}%`,
          "sample size": `${sampleSize} requests`
        }
      });
    } else if (errorRate > ERROR_SPIKE_WARNING) {
      alerts.push({
        type:        "ERROR_SPIKE",
        severity:    "warning",
        title:       `Elevated Error Rate — ${endpoint}`,
        description: `Error rate is ${errorRate}% on ${endpoint} — above warning threshold of ${ERROR_SPIKE_WARNING}%.`,
        endpoint,
        timestamp,
        errorRate,
        latencyP95,
        threshold:   ERROR_SPIKE_WARNING,
        sampleSize,
        meta: {
          endpoint,
          "error rate":  `${errorRate}%`,
          threshold:     `${ERROR_SPIKE_WARNING}%`,
          "sample size": `${sampleSize} requests`
        }
      });
    }

    // ── HIGH_LATENCY ────────────────────────────────────────────────────────
    if (latencyP95 > HIGH_LATENCY_MS) {
      alerts.push({
        type:        "HIGH_LATENCY",
        severity:    "warning",
        title:       `Elevated Latency — ${endpoint}`,
        description: `P95 latency on ${endpoint} is ${latencyP95}ms (threshold: ${HIGH_LATENCY_MS}ms). Possible cold start or downstream bottleneck.`,
        endpoint,
        timestamp,
        errorRate,
        latencyP95,
        threshold:   HIGH_LATENCY_MS,
        sampleSize,
        meta: {
          endpoint,
          "p95 latency": `${latencyP95}ms`,
          threshold:     `${HIGH_LATENCY_MS}ms`,
          "sample size": `${sampleSize} requests`
        }
      });
    }
  }

  // Sort: critical first, warning second
  const order = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3));

  return alerts;
}

/**
 * Evaluate active logs, generate deterministic deduplication IDs, 
 * and persist triggered alerts via DynamoDB.
 * @param {Array} logs - from fetchAllLogs()
 * @returns {Array} List of processed alerts with their IDs
 */
export async function runAlertCheck(logs) {
  const alerts = detectAlerts(logs);

  for (const alert of alerts) {
    // This hash prevents alert spam. 
    // If an alert for the same type+endpoint already exists within DynamoDB 
    // it will be rejected due to our attribute_not_exists check in saveAlert().
    const hashId = crypto
      .createHash("md5")
      .update(alert.type + alert.endpoint)
      .digest("hex")
      .slice(0, 12);
      
    alert.id = hashId;

    await saveAlert(alert);
  }

  return alerts;
}
