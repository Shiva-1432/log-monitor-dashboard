import config from "./config";

const BASE_URL = config.backendUrl;

// ── Types ──────────────────────────────────────────────────────

export type LogLevel = "INFO" | "WARN" | "ERROR";

export interface LogEntry {
  id:         string;
  timestamp:  number;
  time:       string;
  isoTime:    string;
  level:      LogLevel;
  endpoint:   string;
  message:    string;
  latencyMs:  number;
  statusCode: number;
  requestId:  string;
  region:     string;
  raw:        string;
}

export interface EndpointMetric {
  endpoint:   string;
  total:      number;
  errors:     number;
  errorRate:  number;
  avgLatency: number;
}

export interface Metrics {
  total:      number;
  errors:     number;
  warnings:   number;
  errorRate:  number;
  avgLatency: number;
  endpoints:  EndpointMetric[];
}

export type AlertType = "ERROR_SPIKE" | "HIGH_LATENCY";

export interface Alert {
  id:          string;
  severity:    "critical" | "warning" | "info";
  title:       string;
  description: string;
  time:        string;
  meta:        Record<string, string>;
  
  // Phase 6 extensions
  type:        AlertType;
  endpoint:    string;
  errorRate:   number;
  latencyP95:  number;
  threshold:   number;
  sampleSize:  number;
  timestamp:   number;
}

export type TimeRange = "1h" | "6h" | "24h" | "7d";

export interface LogFilters {
  level?:    LogLevel | "all";
  endpoint?: string;
  range?:    TimeRange;
  search?:   string;
  limit?:    number;
}

// ── Storage types (Phase 8) ────────────────────────────────────

export interface LogFile {
  key: string;
  size: number;
  sizeFormatted: string;
  lastModified: string;
  endpoint: string;
  date: string;
}

export interface ArchiverStatus {
  isRunning: boolean;
  lastArchivedAt: string | null;
  totalArchived: number;
  nextRunAt: string | null;
  intervalMinutes: number;
  errors: string[];
}

export interface StorageFile {
  key: string;
  logs: LogEntry[];
  count: number;
  savedAt: string;
  endpoint: string;
}

// ── Internal fetch helper with retry + timeout logic ───────────

const REQUEST_TIMEOUT_MS = 15000; // 15 seconds

async function apiFetchWithRetry<T>(
  path: string, 
  options: RequestInit = {}, 
  retries = 1
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      signal: controller.signal,
      cache: "no-store", 
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      // 503 is often transient (server waking up on Render)
      if (retries > 0 && res.status === 503) {
        console.warn(`[API] Retrying transient error (${res.status}) for ${path}...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return apiFetchWithRetry(path, options, retries - 1);
      }

      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error ?? `HTTP ${res.status}`);
    }

    return res.json() as Promise<T>;
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Network errors or timeouts
    if (retries > 0 && (error.name === "AbortError" || error.message === "Failed to fetch")) {
      console.warn(`[API] Retrying network failure for ${path}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return apiFetchWithRetry(path, options, retries - 1);
    }

    if (error.name === "AbortError") {
      throw new Error("Request timed out — backend is taking too long to respond");
    }

    if (error.message === "Failed to fetch") {
      throw new Error("Backend unreachable — check your connection or server status");
    }

    throw error;
  }
}


// ── Public API ─────────────────────────────────────────────────

/**
 * Fetch logs from the backend with optional filters.
 */
export async function fetchLogs(filters: LogFilters = {}): Promise<{
  logs:      LogEntry[];
  count:     number;
  fetchedAt: string;
}> {
  const params = new URLSearchParams();
  if (filters.level    && filters.level    !== "all") params.set("level", filters.level);
  if (filters.endpoint && filters.endpoint !== "all") params.set("endpoint", filters.endpoint);
  if (filters.range)   params.set("range", filters.range);
  if (filters.search)  params.set("search", filters.search);
  if (filters.limit)   params.set("limit", String(filters.limit));

  return apiFetchWithRetry(`/logs?${params.toString()}`);
}

/**
 * Helper to build the exact CSV download URL
 */
export function buildExportUrl(filters: LogFilters = {}): string {
  const url = new URL(`${BASE_URL}/logs/export`);
  if (filters.level    && filters.level    !== "all") url.searchParams.set("level", filters.level);
  if (filters.endpoint && filters.endpoint !== "all") url.searchParams.set("endpoint", filters.endpoint);
  if (filters.range)   url.searchParams.set("range", filters.range);
  if (filters.search)  url.searchParams.set("search", filters.search);
  if (filters.limit)   url.searchParams.set("limit", String(filters.limit));
  return url.toString();
}

/**
 * Fetch aggregated metrics for the Dashboard.
 */
export async function fetchMetrics(range: TimeRange = "1h"): Promise<{
  metrics:   Metrics;
  fetchedAt: string;
}> {
  return apiFetchWithRetry(`/logs/metrics?range=${range}`);
}

/**
 * Check backend + AWS health.
 */
export async function fetchHealth(): Promise<{
  status:    string;
  uptime:    number;
  timestamp: string;
  latencyMs: number;
  aws: {
    status:    string;
    region:    string;
    logGroups: string[];
    error:     string | null;
  };
}> {
  return apiFetchWithRetry("/health");
}

// ── Alerts (Phase 6) ───────────────────────────────────────────

/**
 * Fetch active alerts computed / synced with DynamoDB
 */
export async function fetchAlerts(params: { severity?: string; range?: string; limit?: number } = {}): Promise<{
  alerts:    Alert[];
  count:     number;
  fetchedAt: string;
}> {
  const search = new URLSearchParams(params as Record<string, string>).toString();
  return apiFetchWithRetry(`/alerts?${search}`);
}

/**
 * Fetch summary statistics for the dashboard
 */
export async function fetchAlertStats(): Promise<{
  total:      number;
  critical:   number;
  warning:    number;
  info:       number;
  byType: {
    ERROR_SPIKE: number;
    HIGH_LATENCY: number;
  };
  byEndpoint: Record<string, number>;
  fetchedAt:  string;
}> {
  return apiFetchWithRetry("/alerts/stats");
}

/**
 * Hard delete / dismiss a single alert from the database
 */
export async function dismissAlert(id: string, timestamp: number): Promise<{
  success: boolean;
  id:      string;
}> {
  return apiFetchWithRetry(`/alerts/${id}?timestamp=${timestamp}`, {
    method: "DELETE"
  });
}

/**
 * Clear all alerts entirely from the table
 */
export async function clearAlerts(): Promise<{
  success: boolean;
  cleared: number;
}> {
  return apiFetchWithRetry(`/alerts`, {
    method: "DELETE"
  });
}

// ── Storage (Phase 8) ──────────────────────────────────────────

export async function fetchLogFiles(params: { endpoint?: string; date?: string } = {}): Promise<{
  files: LogFile[];
  count: number;
  fetchedAt: string;
}> {
  const search = new URLSearchParams(params as Record<string, string>).toString();
  return apiFetchWithRetry(`/storage/files?${search}`);
}

export async function getDownloadUrl(key: string): Promise<{
  url: string;
  expiresAt: string;
  key: string;
}> {
  return apiFetchWithRetry(`/storage/files/download?key=${encodeURIComponent(key)}`);
}

export async function fetchFileContent(key: string): Promise<StorageFile> {
  return apiFetchWithRetry(`/storage/files/content?key=${encodeURIComponent(key)}`);
}

export async function deleteLogFile(key: string): Promise<{
  deleted: boolean;
  key: string;
}> {
  return apiFetchWithRetry(`/storage/files?key=${encodeURIComponent(key)}`, {
    method: "DELETE"
  });
}

export async function fetchArchiverStatus(): Promise<ArchiverStatus> {
  return apiFetchWithRetry("/storage/status");
}

export async function triggerArchiveNow(): Promise<{
  triggered: boolean;
  result: Record<string, unknown>;
}> {
  return apiFetchWithRetry("/storage/archive-now", {
    method: "POST"
  });
}

