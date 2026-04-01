import express from "express";
import { fetchLogsSince, lastFetchedTimestamp } from "../services/cloudwatch.js";

const router = express.Router();

// Track active connections in memory
let activeConnections = 0;

// GET /stream/status
router.get("/status", (req, res) => {
  res.json({
    activeConnections,
    lastFetchedAt: new Date(lastFetchedTimestamp).toISOString(),
  });
});

// GET /stream/logs
router.get("/logs", (req, res) => {
  // 1. On connection: Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Send a "connected" event immediately
  res.write(`event: connected\ndata: ${JSON.stringify({ message: "stream connected", timestamp: Date.now() })}\n\n`);

  activeConnections++;
  
  // Local cursor for this connection
  let currentLastTimestamp = lastFetchedTimestamp || (Date.now() - 60000);

  // 2. Start polling loop every 3 seconds
  const pollingInterval = setInterval(async () => {
    try {
      const logs = await fetchLogsSince(currentLastTimestamp);
      
      if (logs && logs.length > 0) {
        for (const log of logs) {
          res.write(`event: log\ndata: ${JSON.stringify(log)}\n\n`);
        }
        // Update lastTimestamp to latest log's timestamp
        // since the logs are sorted ascending (oldest first), the last one is the latest
        currentLastTimestamp = logs[logs.length - 1].timestamp;
      }
    } catch (err) {
      // 4. Error handling: keep connection alive, send error event
      res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
    }
  }, 3000);

  // Send a heartbeat every 10 seconds even if no new logs
  const heartbeatInterval = setInterval(() => {
    res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`);
  }, 10000);

  // 3. On client disconnect
  req.on("close", () => {
    clearInterval(pollingInterval);
    clearInterval(heartbeatInterval);
    activeConnections--;
  });
});

export default router;
