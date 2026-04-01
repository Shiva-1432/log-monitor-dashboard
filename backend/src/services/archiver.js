import { fetchAllLogs } from "./cloudwatch.js";
import { saveLogsToS3 } from "./s3.js";
import config from "../config.js";


const state = {
  lastArchivedAt: null,
  isRunning: false,
  totalArchived: 0,
  lastResult: null,
  errors: []
};

export async function archiveLogs() {
  const now = Date.now();
  // Fetch logs from lastArchivedAt, or default to last 10 minutes if running for the first time
  const startTime = state.lastArchivedAt || now - 10 * 60 * 1000;
  
  try {
    const logs = await fetchAllLogs({
      level: "all",
      endpoint: "all",
      startTime,
      endTime: now,
      limit: 10000 // High limit strictly for batch archival
    });

    if (!logs || logs.length === 0) {
      state.lastArchivedAt = now;
      state.lastResult = { msg: "No logs found to archive", count: 0 };
      return;
    }

    // Process endpoints explicitly as requested
    const grouped = {
      "/login": [],
      "/upload": [],
      "/payment": []
    };

    for (const log of logs) {
      const ep = log.endpoint || "/unknown";
      if (grouped[ep]) {
        grouped[ep].push(log);
      }
    }

    let archivedInRun = 0;
    const endpointsArchived = [];

    for (const [ep, epLogs] of Object.entries(grouped)) {
      if (epLogs.length > 0) {
        const res = await saveLogsToS3(epLogs, ep);
        if (res) {
          console.log(`[STORAGE] ${new Date().toISOString()} | ARCHIVED | ${epLogs.length} logs | endpoint: ${ep}`);
          archivedInRun += epLogs.length;
          endpointsArchived.push(ep);
        }
      }
    }

    // Register success states
    state.lastArchivedAt = now;
    state.totalArchived += archivedInRun;
    state.lastResult = { 
      msg: archivedInRun > 0 ? "Archive complete" : "No logs needed archival", 
      count: archivedInRun, 
      endpoints: endpointsArchived,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error(`[STORAGE_ERROR] ${new Date().toISOString()} | FAILED | ${error.message}`);
    state.errors.push({ time: new Date().toISOString(), message: error.message || String(error) });
    // Shrink error buffer ensuring we only keep 10 max
    if (state.errors.length > 10) {
      state.errors.shift();
    }
  }
}

export function startArchiver(intervalMinutes = 10) {
  let interval = parseInt(intervalMinutes, 10);
  
  // Bound interval securely between 1 and 60 minutes
  if (isNaN(interval) || interval < 1 || interval > 60) {
    console.warn(`[ARCHIVER_WARN] Invalid interval (${intervalMinutes}). Defaulting to 10 min.`);
    interval = 10;
  }

  if (state.isRunning) return null;

  state.isRunning = true;
  console.log(`[SYSTEM] ${new Date().toISOString()} | Archiver service started (Interval: ${interval}m)`);

  // Invoke immediately
  archiveLogs();

  // Establish perpetual loop
  const intervalId = setInterval(archiveLogs, interval * 60 * 1000);
  return intervalId;
}

export function stopArchiver(intervalId) {
  if (intervalId) clearInterval(intervalId);
  state.isRunning = false;
  console.log(`[SYSTEM] ${new Date().toISOString()} | Archiver service stopped.`);
}

export function getArchiverStatus() {
  return { ...state };
}
