/**
 * src/lib/api.ts
 *
 * Typed client for the LogWatch Express backend.
 * All frontend pages import from here — never call fetch() directly.
 */

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

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

export interface Alert {
  id:          string;
  severity:    "critical" | "warning" | "info";
  title:       string;
  description: string;
  time:        string;
  meta:        Record<string, string>;
}

export type TimeRange = "1h" | "6h" | "24h" | "7d";

export interface LogFilters {
  level?:    LogLevel | "all";
  endpoint?: string;
  range?:    TimeRange;
  search?:   string;
  limit?:    number;
}

// ── Internal fetch helper ──────────────────────────────────────

async function apiFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString(), {
    headers: { "Content-Type": "application/json" },
    cache:   "no-store",  // always fresh — this is a real-time dashboard
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
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
  const params: Record<string, string> = {};
  if (filters.level    && filters.level    !== "all") params.level    = filters.level;
  if (filters.endpoint && filters.endpoint !== "all") params.endpoint = filters.endpoint;
  if (filters.range)   params.range  = filters.range;
  if (filters.search)  params.search = filters.search;
  if (filters.limit)   params.limit  = String(filters.limit);

  return apiFetch("/logs", params);
}

/**
 * Fetch aggregated metrics for the Dashboard.
 */
export async function fetchMetrics(range: TimeRange = "1h"): Promise<{
  metrics:   Metrics;
  fetchedAt: string;
}> {
  return apiFetch("/logs/metrics", { range });
}

/**
 * Fetch active alerts computed from recent logs.
 */
export async function fetchAlerts(range: TimeRange = "1h"): Promise<{
  alerts:    Alert[];
  count:     number;
  fetchedAt: string;
}> {
  return apiFetch("/alerts", { range });
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
  return apiFetch("/health");
}
