export type LogLevel = "INFO" | "WARN" | "ERROR";

export interface LogEntry {
  id: string;
  time: string;
  level: LogLevel;
  endpoint: string;
  message: string;
  latencyMs: number;
  statusCode: number;
  requestId: string;
  region: string;
}

export interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  time: string;
  meta: Record<string, string>;
}

export interface ApiEndpoint {
  method: string;
  path: string;
  reqPerMin: number;
  errorPct: number;
  p50: number;
  p99: string;
  uptime: number;
}

export const DUMMY_LOGS: LogEntry[] = [
  { id: "1",  time: "14:24:01", level: "ERROR", endpoint: "/payment", message: "Simulated failure — Lambda timeout",         latencyMs: 1821, statusCode: 502, requestId: "a3f-291b", region: "us-east-1" },
  { id: "2",  time: "14:23:58", level: "INFO",  endpoint: "/login",   message: "User authenticated successfully",            latencyMs: 91,   statusCode: 200, requestId: "b1c-882a", region: "us-east-1" },
  { id: "3",  time: "14:23:55", level: "WARN",  endpoint: "/upload",  message: "S3 PutObject latency elevated",              latencyMs: 834,  statusCode: 200, requestId: "c2d-445f", region: "us-east-1" },
  { id: "4",  time: "14:23:52", level: "ERROR", endpoint: "/payment", message: "Simulated failure — internal error",         latencyMs: 290,  statusCode: 500, requestId: "d3e-112c", region: "us-east-1" },
  { id: "5",  time: "14:23:49", level: "INFO",  endpoint: "/login",   message: "Token refresh — session extended",           latencyMs: 44,   statusCode: 200, requestId: "e4f-778d", region: "us-east-1" },
  { id: "6",  time: "14:23:46", level: "ERROR", endpoint: "/upload",  message: "Multipart upload aborted",                  latencyMs: 612,  statusCode: 500, requestId: "f5g-993e", region: "us-east-1" },
  { id: "7",  time: "14:23:43", level: "INFO",  endpoint: "/payment", message: "Payment processed successfully",             latencyMs: 288,  statusCode: 200, requestId: "g6h-221f", region: "us-east-1" },
  { id: "8",  time: "14:23:40", level: "WARN",  endpoint: "/login",   message: "Rate limit approaching — 80% used",         latencyMs: 12,   statusCode: 429, requestId: "h7i-554g", region: "us-east-1" },
  { id: "9",  time: "14:23:37", level: "ERROR", endpoint: "/payment", message: "Simulated failure — DDB write error",        latencyMs: 1200, statusCode: 500, requestId: "i8j-887h", region: "us-east-1" },
  { id: "10", time: "14:23:34", level: "INFO",  endpoint: "/upload",  message: "File upload complete — 4.2MB",              latencyMs: 410,  statusCode: 200, requestId: "j9k-110i", region: "us-east-1" },
  { id: "11", time: "14:23:31", level: "ERROR", endpoint: "/login",   message: "Invalid credentials — 3rd attempt",        latencyMs: 22,   statusCode: 401, requestId: "k0l-443j", region: "us-east-1" },
  { id: "12", time: "14:23:28", level: "INFO",  endpoint: "/payment", message: "Payment intent created",                    latencyMs: 144,  statusCode: 201, requestId: "l1m-776k", region: "us-east-1" },
];

export const DUMMY_ALERTS: Alert[] = [
  {
    id: "1",
    severity: "critical",
    title: "High Error Rate — /payment",
    description: "Error rate exceeded 30% threshold on /payment endpoint. 47 failures in last 5 minutes. Lambda execution errors detected.",
    time: "2m ago",
    meta: { endpoint: "/payment", "error rate": "31.2%", threshold: "30%", triggered: "14:22:08" },
  },
  {
    id: "2",
    severity: "warning",
    title: "Elevated Latency — /upload",
    description: "P95 latency on /upload has been above 800ms for 10+ minutes. Possible S3 write bottleneck or Lambda cold start spike.",
    time: "11m ago",
    meta: { "p95 latency": "912ms", threshold: "800ms", duration: "11m" },
  },
  {
    id: "3",
    severity: "info",
    title: "Unusual Traffic — /login",
    description: "Login endpoint received 3x normal request volume in a 2-minute window. Pattern consistent with load test or possible bot activity.",
    time: "34m ago",
    meta: { requests: "1,240 / 2min", baseline: "~400" },
  },
];

export const DUMMY_APIS: ApiEndpoint[] = [
  { method: "POST", path: "/login",   reqPerMin: 284, errorPct: 0.8,  p50: 88,  p99: "342ms",  uptime: 99.2 },
  { method: "POST", path: "/upload",  reqPerMin: 91,  errorPct: 4.1,  p50: 412, p99: "912ms",  uptime: 97.1 },
  { method: "POST", path: "/payment", reqPerMin: 55,  errorPct: 31.2, p50: 290, p99: "1.8s",   uptime: 68.8 },
];

export const BAR_DATA = [180, 240, 190, 320, 280, 450, 390, 410, 510, 380, 470, 530];
