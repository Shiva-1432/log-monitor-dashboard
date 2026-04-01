import express from "express";
import {
  listLogFiles,
  generateDownloadUrl,
  getLogFile,
  deleteLogFile
} from "../services/s3.js";
import {
  getArchiverStatus,
  archiveLogs
} from "../services/archiver.js";

const router = express.Router();
const PREFIX = process.env.S3_LOG_PREFIX || "logs";
const ARCHIVE_INTERVAL_MINUTES = parseInt(process.env.LOG_ARCHIVE_INTERVAL_MINUTES || "10", 10);

/**
 * Format bytes to human readable sizes
 */
function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Validates strictly if an S3 key belongs to the LogWatch prefix namespace
 */
function isValidKey(key) {
  return key && typeof key === "string" && key.startsWith(`${PREFIX}/`);
}

// 1. GET /storage/files
router.get("/files", async (req, res) => {
  try {
    const { endpoint, date } = req.query;
    
    // AWS SDK fetches limit natively bounded inside service layer
    const filesList = await listLogFiles({ endpoint, date });

    if (!filesList) {
      return res.status(500).json({ error: "Failed to fetch files from S3 layer" });
    }

    const files = filesList.map(f => ({
      ...f,
      sizeFormatted: formatBytes(f.size)
    }));

    res.json({
      files,
      count: files.length,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("[Storage Router] GET /files error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2. GET /storage/files/download
router.get("/files/download", async (req, res) => {
  try {
    const { key } = req.query;
    
    if (!isValidKey(key)) {
      return res.status(400).json({ error: "Access Denied: Invalid S3 key or boundary breach attempt" });
    }

    const result = await generateDownloadUrl(key);
    if (!result) {
      return res.status(500).json({ error: "Failed to cryptographically sign download URL" });
    }

    res.json(result);
  } catch (error) {
    console.error("[Storage Router] GET /files/download error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 3. GET /storage/files/content
router.get("/files/content", async (req, res) => {
  try {
    const { key } = req.query;
    
    if (!isValidKey(key)) {
      return res.status(400).json({ error: "Access Denied: Invalid S3 key or boundary breach attempt" });
    }

    // Fetches the entire JSON block ({ logs, count, savedAt, endpoint })
    const content = await getLogFile(key);
    
    if (!content) {
      return res.status(500).json({ error: "Failed to structurally retrieve and decrypt log content" });
    }

    res.json(content);
  } catch (error) {
    console.error("[Storage Router] GET /files/content error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 4. DELETE /storage/files
router.delete("/files", async (req, res) => {
  try {
    const { key } = req.query;
    
    if (!isValidKey(key)) {
      return res.status(400).json({ error: "Access Denied: Invalid S3 key or boundary breach attempt" });
    }

    const result = await deleteLogFile(key);
    if (!result) {
      return res.status(500).json({ error: "Failed to explicitly execute Object Deletion" });
    }

    res.json(result);
  } catch (error) {
    console.error("[Storage Router] DELETE /files error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 5. GET /storage/status
router.get("/status", (req, res) => {
  try {
    const status = getArchiverStatus();
    
    let nextRunAt = null;
    if (status.isRunning && status.lastArchivedAt) {
      nextRunAt = new Date(status.lastArchivedAt + ARCHIVE_INTERVAL_MINUTES * 60 * 1000).toISOString();
    }

    res.json({
      ...status,
      nextRunAt,
      intervalMinutes: ARCHIVE_INTERVAL_MINUTES
    });
  } catch (error) {
    console.error("[Storage Router] GET /status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 6. POST /storage/archive-now
router.post("/archive-now", async (req, res) => {
  try {
    // Explicit synchronous override
    await archiveLogs();
    
    // Snag the direct output log locally mapped
    const status = getArchiverStatus();
    res.json({
      triggered: true,
      result: status.lastResult
    });
  } catch (error) {
    console.error("[Storage Router] POST /archive-now error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
