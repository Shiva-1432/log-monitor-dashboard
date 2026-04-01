import { Router } from "express";
import { fetchAllLogs } from "../services/cloudwatch.js";
import { runAlertCheck } from "../services/alerts.js";
import { getAlerts, deleteAlert, clearAllAlerts } from "../services/dynamodb.js";

const router = Router();

// ── Helper — parse time range query param ────────────────────
function parseTimeRange(range) {
  const now = Date.now();
  const MAP = {
    "1h":  60 * 60 * 1000,
    "6h":  6  * 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d":  7  * 24 * 60 * 60 * 1000,
  };
  return {
    endTime: now,
    startTime: now - (MAP[range] ?? MAP["1h"]),
  };
}

/**
 * 1. GET /alerts
 *
 * Query params:
 *   severity - critical | warning | info | all (default: all)
 *   range    - 1h | 6h | 24h | 7d (default: 1h)
 *   limit    - max results (default: 50)
 */
router.get("/", async (req, res) => {
  try {
    const { severity = "all", range = "1h", limit = "50" } = req.query;
    const { startTime, endTime } = parseTimeRange(range);

    // a. Fetch fresh logs from CloudWatch for the requested range to trigger live detection
    const logs = await fetchAllLogs({ startTime, endTime, limit: 1000 });
    
    // b. Run detection (which uses DynamoDB conditional checks to safely ingest new alerts without dupes)
    const newlyDetected = await runAlertCheck(logs);

    // c. Fetch persisted historical alerts from DynamoDB
    const persistedAlerts = await getAlerts({
      limit: parseInt(limit, 10) * 2, // overfetch slightly to allow deduplication / merging
      severity: severity === "all" ? undefined : severity,
      startTime,
      endTime
    });

    // d. Merge and deduplicate by ID.
    // Local detection might find an alert that was just persisted but DynamoDB scan hasn't reached it yet
    const mergedMap = new Map();
    
    // Prioritize persisted ones to retain original creation timestamps from DB
    for (const pa of persistedAlerts) {
      if (severity !== "all" && pa.severity !== severity) continue;
      mergedMap.set(pa.id, pa);
    }
    
    // Fill in any actively newly detected ones perfectly
    for (const nd of newlyDetected) {
      if (severity !== "all" && nd.severity !== severity) continue;
      if (!mergedMap.has(nd.id)) {
        mergedMap.set(nd.id, nd);
      }
    }

    // e. Sort timestamp descending, then trim accurately
    const finalAlerts = Array.from(mergedMap.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, parseInt(limit, 10));

    res.json({
      alerts: finalAlerts,
      count: finalAlerts.length,
      fetchedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("[GET /alerts] Error:", err.message);
    res.status(500).json({ error: "Failed to fetch alerts", detail: err.message });
  }
});

/**
 * 4. GET /alerts/stats
 * Aggregates summary statistics for the last 24h of alerts
 */
router.get("/stats", async (req, res) => {
  try {
    const { startTime } = parseTimeRange("24h");
    
    // Fetch last 24h from DynamoDB
    const alerts = await getAlerts({ startTime, limit: 1000 });

    const stats = {
      total: alerts.length,
      critical: 0,
      warning: 0,
      info: 0,
      byType: {
        ERROR_SPIKE: 0,
        HIGH_LATENCY: 0
      },
      byEndpoint: {
        "/login": 0,
        "/upload": 0,
        "/payment": 0
      }
    };

    for (const alert of alerts) {
      // Aggregate severity
      if (alert.severity === "critical") stats.critical++;
      else if (alert.severity === "warning") stats.warning++;
      else if (alert.severity === "info") stats.info++;

      // Aggregate type
      if (alert.type === "ERROR_SPIKE") stats.byType.ERROR_SPIKE++;
      else if (alert.type === "HIGH_LATENCY") stats.byType.HIGH_LATENCY++;

      // Aggregate endpoints cleanly
      const ep = alert.endpoint || "unknown";
      if (stats.byEndpoint[ep] !== undefined) {
        stats.byEndpoint[ep]++;
      } else {
        stats.byEndpoint[ep] = 1;
      }
    }

    res.json({
      ...stats,
      fetchedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("[GET /alerts/stats] Error:", err.message);
    res.status(500).json({ error: "Failed to compute alert stats", detail: err.message });
  }
});

/**
 * 2. DELETE /alerts/:id
 * Hard delete a single alert. Requires ?timestamp in query.
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { timestamp } = req.query;
    
    if (!timestamp) {
      return res.status(400).json({ error: "Query parameter 'timestamp' is required for hard deletion." });
    }

    const success = await deleteAlert(id, timestamp);
    res.json({ success, id });
  } catch (err) {
    console.error(`[DELETE /alerts/${req.params.id}] Error:`, err.message);
    res.status(500).json({ error: "Failed to delete alert", detail: err.message });
  }
});

/**
 * 3. DELETE /alerts
 * Clear all alerts from the DynamoDB database entirely.
 */
router.delete("/", async (req, res) => {
  try {
    const clearedCount = await clearAllAlerts();
    
    if (clearedCount === false) {
      return res.status(500).json({ success: false, error: "Failed to clear alerts from DB" });
    }

    res.json({ success: true, cleared: clearedCount });
  } catch (err) {
    console.error("[DELETE /alerts] Error:", err.message);
    res.status(500).json({ error: "Failed to clear all alerts", detail: err.message });
  }
});

export default router;
