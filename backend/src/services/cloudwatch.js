import {
  FilterLogEventsCommand,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import cwClient from "../lib/aws.js";
import config   from "../config.js";

// ── Log group names from config ────────────────────────────────
const LOG_GROUPS = config.cloudwatch.groups;
const FETCH_LIMIT = config.cloudwatch.limit;


/**
 * Parse a raw CloudWatch log event message into a structured object.
 * Our Lambda functions always log JSON — we parse that.
 * Non-JSON lines (Lambda START/END/REPORT) are tagged as system logs.
 */
function parseLogEvent(event, endpoint) {
  const raw = event.message?.trim() ?? "";

  // Skip Lambda runtime lines (START, END, REPORT, INIT_START)
  if (/^(START|END|REPORT|INIT_START)/.test(raw)) return null;

  let parsed = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Non-JSON line — wrap it
    parsed = { message: raw, level: "INFO" };
  }

  return {
    id:         event.eventId ?? `${Date.now()}-${Math.random()}`,
    timestamp:  event.timestamp,
    time:       new Date(event.timestamp).toLocaleTimeString("en-GB"),
    isoTime:    new Date(event.timestamp).toISOString(),
    level:      parsed.level      ?? "INFO",
    endpoint:   parsed.endpoint   ?? `/${endpoint}`,
    message:    parsed.message    ?? raw,
    latencyMs:  parsed.durationMs ?? parsed.latencyMs ?? 0,
    statusCode: parsed.statusCode ?? 200,
    requestId:  parsed.requestId  ?? event.eventId,
    region:     config.aws.region,
    raw,
  };
}

/**
 * Fetch logs from a single log group.
 * @param {string} groupName  - CloudWatch log group name
 * @param {string} endpoint   - label for parsing (login/upload/payment)
 * @param {object} opts       - { startTime, endTime, filterPattern, limit }
 */
async function fetchGroupLogs(groupName, endpoint, opts = {}) {
  const {
    startTime     = Date.now() - 60 * 60 * 1000,   // default: last 1 hour
    endTime       = Date.now(),
    filterPattern = "",
    limit         = FETCH_LIMIT,
  } = opts;

  const command = new FilterLogEventsCommand({
    logGroupName:  groupName,
    startTime,
    endTime,
    limit,
    filterPattern: filterPattern || undefined,
  });

  const response = await cwClient.send(command);
  const events   = response.events ?? [];

  return events
    .map((e) => parseLogEvent(e, endpoint))
    .filter(Boolean); // remove null (START/END/REPORT lines)
}

/**
 * Fetch logs from ALL 3 log groups, merge + sort by time descending.
 *
 * @param {object} opts
 * @param {string}   opts.level       - "ERROR" | "WARN" | "INFO" | "all"
 * @param {string}   opts.endpoint    - "/login" | "/upload" | "/payment" | "all"
 * @param {number}   opts.startTime   - epoch ms
 * @param {number}   opts.endTime     - epoch ms
 * @param {string}   opts.search      - free-text search filter
 * @param {number}   opts.limit       - max results
 */
export async function fetchAllLogs(opts = {}) {
  const {
    level    = "all",
    endpoint = "all",
    search   = "",
    limit    = FETCH_LIMIT,
    startTime,
    endTime,
  } = opts;

  // Build CloudWatch filterPattern from level + search
  let filterPattern = "";
  if (level !== "all")  filterPattern += `"${level}" `;
  if (search)           filterPattern += `"${search}"`;

  // Decide which groups to query
  const groupsToQuery = endpoint === "all"
    ? Object.entries(LOG_GROUPS)
    : Object.entries(LOG_GROUPS).filter(([key]) => `/${key}` === endpoint);

  const promises = groupsToQuery.map(([key, groupName]) =>
    fetchGroupLogs(groupName, key, { startTime, endTime, filterPattern: filterPattern.trim(), limit })
      .catch((err) => {
        // Don't crash the whole request if one group is missing
        console.warn(`[CloudWatch] Could not fetch ${groupName}:`, err.message);
        return [];
      })
  );

  const results = await Promise.all(promises);
  const merged  = results.flat();

  // Sort newest first
  merged.sort((a, b) => b.timestamp - a.timestamp);

  return merged.slice(0, limit);
}

/**
 * Compute summary metrics from a log array.
 * Used by GET /logs/metrics
 */
export function computeMetrics(logs) {
  const total      = logs.length;
  const errors     = logs.filter((l) => l.level === "ERROR").length;
  const warnings   = logs.filter((l) => l.level === "WARN").length;
  const errorRate  = total > 0 ? +((errors / total) * 100).toFixed(1) : 0;
  const avgLatency = total > 0
    ? Math.round(logs.reduce((sum, l) => sum + (l.latencyMs ?? 0), 0) / total)
    : 0;

  const byEndpoint = {};
  for (const log of logs) {
    const ep = log.endpoint ?? "unknown";
    if (!byEndpoint[ep]) byEndpoint[ep] = { total: 0, errors: 0, totalLatency: 0 };
    byEndpoint[ep].total++;
    if (log.level === "ERROR") byEndpoint[ep].errors++;
    byEndpoint[ep].totalLatency += log.latencyMs ?? 0;
  }

  // Compute per-endpoint error rates + avg latency
  const endpoints = Object.entries(byEndpoint).map(([ep, stats]) => ({
    endpoint:    ep,
    total:       stats.total,
    errors:      stats.errors,
    errorRate:   +((stats.errors / stats.total) * 100).toFixed(1),
    avgLatency:  Math.round(stats.totalLatency / stats.total),
  }));

  return { total, errors, warnings, errorRate, avgLatency, endpoints };
}

/**
 * Check if a log group exists in CloudWatch.
 * Useful for the /health endpoint.
 */
export async function checkLogGroupsExist() {
  const cmd = new DescribeLogGroupsCommand({ logGroupNamePrefix: "/aws/lambda/logwatch" });
  const res = await cwClient.send(cmd);
  return (res.logGroups ?? []).map((g) => g.logGroupName);
}

// ── In-Memory Store for Real-Time Polling ──────────────────────
export let lastFetchedTimestamp = Date.now() - 60000;

/**
 * Fetch logs from all groups since the given timestamp.
 * Used for incremental updates before WebSocket is fully active.
 * 
 * @param {number} lastTimestamp
 * @returns {Promise<Array>} merged array sorted by timestamp asc
 */
export async function fetchLogsSince(lastTimestamp) {
  const startTime = lastTimestamp + 1;
  const endTime = Date.now();
  const limit = 50;

  const promises = Object.entries(LOG_GROUPS).map(([key, groupName]) =>
    fetchGroupLogs(groupName, key, { startTime, endTime, limit })
      .catch((err) => {
        console.warn(`[CloudWatch] Could not fetch ${groupName} since ${startTime}:`, err.message);
        return [];
      })
  );

  const results = await Promise.all(promises);
  const merged = results.flat();

  // Sort by timestamp ascending (oldest first)
  merged.sort((a, b) => a.timestamp - b.timestamp);

  // Update the in-memory store
  // We set it to Date.now() to ensure we advance the cursor even if no logs are found.
  lastFetchedTimestamp = Date.now();

  return merged;
}

/**
 * Takes a logs array and returns the highest timestamp value.
 * Return null if array is empty.
 * 
 * @param {Array} logs
 * @returns {number|null}
 */
export function getLatestTimestamp(logs) {
  if (!logs || logs.length === 0) return null;
  return Math.max(...logs.map((l) => l.timestamp));
}

