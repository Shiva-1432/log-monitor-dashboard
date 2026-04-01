import { Router } from "express";
import { fetchAllLogs, computeMetrics } from "../services/cloudwatch.js";

const router = Router();

// ── Helper — parse time range query param ────────────────────
function parseTimeRange(range) {
  const now = Date.now();
  const MAP = {
    "1h": 60 * 60 * 1000,
    "6h": 6 * 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
  };
  return {
    endTime: now,
    startTime: now - (MAP[range] ?? MAP["1h"]),
  };
}

/**
 * GET /logs
 *
 * Query params:
 *   level      - ERROR | WARN | INFO | all  (default: all)
 *   endpoint   - /login | /upload | /payment | all  (default: all)
 *   range      - 1h | 6h | 24h | 7d  (default: 1h)
 *   startTime  - epoch ms
 *   endTime    - epoch ms
 *   search     - free text search
 *   limit      - max results (default: 100)
 *
 * Response:
 *   { logs: LogEntry[], count: number, fetchedAt: string }
 */
router.get("/", async (req, res) => {
  try {
    const {
      level = "all",
      endpoint = "all",
      range = "1h",
      search = "",
      limit = "100",
      startTime,
      endTime,
    } = req.query;

    const parsedRange = parseTimeRange(range);
    const finalStartTime = startTime ? parseInt(startTime, 10) : parsedRange.startTime;
    const finalEndTime = endTime ? parseInt(endTime, 10) : parsedRange.endTime;

    const logs = await fetchAllLogs({
      level: level === "all" ? "all" : level.toUpperCase(),
      endpoint: endpoint === "all" ? "all" : endpoint,
      search,
      startTime: finalStartTime,
      endTime: finalEndTime,
      limit: parseInt(limit, 10),
    });

    res.json({
      logs,
      count: logs.length,
      fetchedAt: new Date().toISOString(),
      filters: { level, endpoint, range, search, startTime: finalStartTime, endTime: finalEndTime },
    });
  } catch (err) {
    console.error("[GET /logs] Error:", err.message);
    res.status(500).json({ error: "Failed to fetch logs", detail: err.message });
  }
});

/**
 * GET /logs/export
 * 
 * Returns logs as a CSV file matching the applied filters.
 */
router.get("/export", async (req, res) => {
  try {
    const {
      level = "all",
      endpoint = "all",
      range = "1h",
      search = "",
      limit = "100",
      startTime,
      endTime,
    } = req.query;

    const parsedRange = parseTimeRange(range);
    const finalStartTime = startTime ? parseInt(startTime, 10) : parsedRange.startTime;
    const finalEndTime = endTime ? parseInt(endTime, 10) : parsedRange.endTime;

    const logs = await fetchAllLogs({
      level: level === "all" ? "all" : level.toUpperCase(),
      endpoint: endpoint === "all" ? "all" : endpoint,
      search,
      startTime: finalStartTime,
      endTime: finalEndTime,
      limit: parseInt(limit, 10),
    });

    const fields = [
      "id", "timestamp", "isoTime", "time", "level", "endpoint",
      "message", "latencyMs", "statusCode", "requestId", "region", "raw"
    ];

    const escapeCsv = (str) => {
      if (str == null) return '""';
      const strVal = String(str);
      if (strVal.includes('"') || strVal.includes(',') || strVal.includes('\n')) {
        return `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    };

    const csvLines = [fields.join(",")];
    for (const log of logs) {
      const row = fields.map(field => escapeCsv(log[field]));
      csvLines.push(row.join(","));
    }
    const csvContent = csvLines.join("\n");

    res.setHeader("Content-Disposition", 'attachment; filename="logs_export.csv"');
    res.setHeader("Content-Type", "text/csv");
    res.send(csvContent);
  } catch (err) {
    console.error("[GET /logs/export] Error:", err.message);
    res.status(500).json({ error: "Failed to export logs", detail: err.message });
  }
});

/**
 * GET /logs/metrics
 *
 * Returns aggregated metrics computed from the last hour of logs.
 * Used by the Dashboard page for the 4 metric cards.
 *
 * Query params:
 *   range - same as /logs
 *   startTime - epoch ms
 *   endTime - epoch ms
 */
router.get("/metrics", async (req, res) => {
  try {
    const { range = "1h", startTime, endTime } = req.query;
    const parsedRange = parseTimeRange(range);
    const finalStartTime = startTime ? parseInt(startTime, 10) : parsedRange.startTime;
    const finalEndTime = endTime ? parseInt(endTime, 10) : parsedRange.endTime;

    const logs = await fetchAllLogs({ startTime: finalStartTime, endTime: finalEndTime, limit: 500 });
    const metrics = computeMetrics(logs);

    res.json({ metrics, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error("[GET /logs/metrics] Error:", err.message);
    res.status(500).json({ error: "Failed to compute metrics", detail: err.message });
  }
});

export default router;