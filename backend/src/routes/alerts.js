import { Router } from "express";
import { fetchAllLogs } from "../services/cloudwatch.js";
import { detectAlerts } from "../services/alerts.js";

const router = Router();

/**
 * GET /alerts
 *
 * Fetches last 1h of logs, runs alert detection logic,
 * returns triggered alerts sorted by severity.
 *
 * Query params:
 *   range - 1h | 6h | 24h  (default: 1h)
 *
 * Response:
 *   { alerts: Alert[], count: number, fetchedAt: string }
 */
router.get("/", async (req, res) => {
  try {
    const { range = "1h" } = req.query;
    const now       = Date.now();
    const RANGES    = { "1h": 3600000, "6h": 21600000, "24h": 86400000 };
    const startTime = now - (RANGES[range] ?? RANGES["1h"]);

    // Fetch all logs for the window
    const logs   = await fetchAllLogs({ startTime, endTime: now, limit: 500 });

    // Run alert detection
    const alerts = detectAlerts(logs);

    res.json({
      alerts,
      count:     alerts.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[GET /alerts] Error:", err.message);
    res.status(500).json({ error: "Failed to compute alerts", detail: err.message });
  }
});

export default router;
