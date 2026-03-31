// ── Shared types for the Log Monitor Dashboard ──────────────────────────────
// Single source of truth — import from here in all components.

export type LogLevel = "ERROR" | "WARN" | "INFO";

export interface LogEntry {
  id: string;
  timestamp: number;      // epoch ms
  time: string;           // localtime string e.g. "14:24:01"
  isoTime: string;        // ISO-8601 string
  level: LogLevel;
  endpoint: string;       // "/login" | "/upload" | "/payment"
  message: string;
  latencyMs: number;
  statusCode: number;
  requestId: string;
  region: string;
  raw: string;            // raw JSON string from CloudWatch
}
