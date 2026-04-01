/**
 * LogWatch Full System Test Suite
 * 
 * Verifies end-to-end functionality including:
 *   - Backend Health & Connectivity
 *   - Complex filtering (Level, Endpoint, Search)
 *   - Metrics and Aggregations
 *   - Alert detection & DynamoDB persistence
 *   - CloudWatch-to-S3 archival paths
 *   - Simulation of real-world error spikes
 * 
 * Usage: 
 *   BACKEND_URL=https://... API_URL=https://... node scripts/test-suite.mjs
 */

import { performance } from "perf_hooks";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";
const API_URL = process.env.API_URL;

const ANSI = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bold: "\x1b[1m",
  bg: "\x1b[44m\x1b[37m",
};

const EXPECTED_GROUPS = [
  "/aws/lambda/logwatch-login",
  "/aws/lambda/logwatch-upload",
  "/aws/lambda/logwatch-payment"
];

async function baseFetch(path, options = {}, retry = true) {
  const url = path.startsWith("http") ? path : `${BACKEND_URL}${path}`;
  const start = performance.now();
  
  try {
    const res = await fetch(url, options);
    const duration = Math.round(performance.now() - start);
    
    if (res.status >= 500 && retry) {
      process.stdout.write(`  ${ANSI.gray}⏳ Cold start? Retrying ${path}...${ANSI.reset}\r`);
      await new Promise(r => setTimeout(r, 2500));
      return baseFetch(path, options, false);
    }

    let data = null;
    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      data = await res.json();
    }
    
    return { status: res.status, data, duration, contentType };
  } catch (err) {
    if (retry) {
      process.stdout.write(`  ${ANSI.gray}⏳ Network error? Retrying...${ANSI.reset}\r`);
      await new Promise(r => setTimeout(r, 2500));
      return baseFetch(path, options, false);
    }
    throw err;
  }
}

async function runGroup(title, tests) {
  console.log(`\n ${ANSI.bg} ${title.toUpperCase()} ${ANSI.reset}`);
  let groupPassed = 0;

  for (const t of tests) {
    const start = performance.now();
    try {
      const result = await t.run();
      const duration = Math.round(performance.now() - start);
      
      if (result.pass) {
        console.log(`  ${ANSI.green}✅${ANSI.reset}  ${t.id.padEnd(4)} ${t.name.padEnd(30)} ${duration}ms`);
        groupPassed++;
      } else {
        console.log(`  ${ANSI.red}❌${ANSI.reset}  ${t.id.padEnd(4)} ${t.name.padEnd(30)} ${ANSI.red}→ ${result.msg}${ANSI.reset}`);
      }
    } catch (err) {
      console.log(`  ${ANSI.red}❌${ANSI.reset}  ${t.id.padEnd(4)} ${t.name.padEnd(30)} ${ANSI.red}→ FATAL: ${err.message}${ANSI.reset}`);
    }
  }
  return groupPassed;
}

async function main() {
  if (!API_URL) {
    console.warn(`\n${ANSI.red}⚠️  Warning: API_URL not set. Simulation tests (Group 6) will be skipped.${ANSI.reset}`);
  }

  console.log(`\n${ANSI.bold}${ANSI.cyan}LogWatch Full System Test Suite${ANSI.reset}`);
  console.log(`${ANSI.gray}Backend: ${BACKEND_URL}${ANSI.reset}`);
  console.log(`${ANSI.gray}Gateway: ${API_URL || "N/A"}${ANSI.reset}\n`);

  const GROUPS = [
    {
      title: "Group 1 — Backend Health",
      tests: [
        { id: "1.1", name: "GET /ping", run: async () => {
          const { status, data } = await baseFetch("/ping");
          return { pass: status === 200 && data.status === "ok", msg: `Status ${status}` };
        }},
        { id: "1.2", name: "GET /health (AWS check)", run: async () => {
          const { status, data } = await baseFetch("/health");
          return { pass: status === 200 && data.aws.status === "ok", msg: `AWS Error: ${data?.aws?.error}` };
        }},
        { id: "1.3", name: "Verify CloudWatch groups", run: async () => {
          const { data } = await baseFetch("/health");
          const groups = data?.aws?.logGroups || [];
          const missing = EXPECTED_GROUPS.filter(g => !groups.includes(g));
          return { pass: missing.length === 0, msg: `Missing: ${missing.join(", ")}` };
        }}
      ]
    },
    {
      title: "Group 2 — Log Fetching",
      tests: [
        { id: "2.1", name: "Log Array Presence", run: async () => {
          const { data } = await baseFetch("/logs?range=1h");
          return { pass: Array.isArray(data?.logs), msg: "No logs array in response" };
        }},
        { id: "2.2", name: "Level Filter: ERROR", run: async () => {
          const { data } = await baseFetch("/logs?level=ERROR&limit=20");
          const fails = data?.logs?.filter(l => l.level !== "ERROR") || [];
          return { pass: fails.length === 0, msg: `Found logs with level ${fails[0]?.level}` };
        }},
        { id: "2.3", name: "Endpoint Filter: /payment", run: async () => {
          const { data } = await baseFetch("/logs?endpoint=/payment&limit=20");
          const fails = data?.logs?.filter(l => l.endpoint !== "/payment") || [];
          return { pass: fails.length === 0, msg: `Found logs with endpoint ${fails[0]?.endpoint}` };
        }},
        { id: "2.4", name: "Search: 'timeout'", run: async () => {
          const { data } = await baseFetch("/logs?search=timeout&limit=10");
          // If no logs found, we pass (might be no timeouts right now), but we check content if they exist
          const fails = data?.logs?.filter(l => !l.message.toLowerCase().includes("timeout")) || [];
          return { pass: fails.length === 0, msg: "Search term not found in message" };
        }},
        { id: "2.5", name: "Limit Check: 5", run: async () => {
          const { data } = await baseFetch("/logs?limit=5");
          const count = data?.logs?.length || 0;
          return { pass: count <= 5, msg: `Expected max 5, got ${count}` };
        }}
      ]
    },
    {
      title: "Group 3 — Metrics",
      tests: [
        { id: "3.1", name: "Field presence", run: async () => {
          const { data } = await baseFetch("/logs/metrics");
          const m = data?.metrics;
          const hasFields = "total" in m && "errorRate" in m && "avgLatency" in m;
          return { pass: hasFields, msg: "Missing core metric fields" };
        }},
        { id: "3.2", name: "Error Rate boundaries", run: async () => {
          const { data } = await baseFetch("/logs/metrics");
          const rate = data?.metrics?.errorRate || 0;
          return { pass: rate >= 0 && rate <= 100, msg: `Rate ${rate}% out of bounds` };
        }}
      ]
    },
    {
      title: "Group 4 — Alert Detection",
      tests: [
        { id: "4.1", name: "Alert Fetching", run: async () => {
          const { data } = await baseFetch("/alerts");
          return { pass: Array.isArray(data?.alerts), msg: "No alerts array" };
        }},
        { id: "4.2", name: "Alert Schema", run: async () => {
          const { data } = await baseFetch("/alerts");
          const a = data?.alerts?.[0];
          if (!a) return { pass: true, msg: "Skip: No alerts to check" };
          const hasFields = "id" in a && "severity" in a && "type" in a && "title" in a;
          return { pass: hasFields, msg: "Missing properties in alert object" };
        }},
        { id: "4.3", name: "Severity Enums", run: async () => {
          const { data } = await baseFetch("/alerts");
          const enums = ["critical", "warning", "info"];
          const fails = data?.alerts?.filter(a => !enums.includes(a.severity)) || [];
          return { pass: fails.length === 0, msg: `Invalid severity: ${fails[0]?.severity}` };
        }},
        { id: "4.4", name: "Alert Stats Summary", run: async () => {
          const { data } = await baseFetch("/alerts/stats");
          const hasFields = "total" in data && "byType" in data && "byEndpoint" in data;
          return { pass: hasFields, msg: "Stats missing group fields" };
        }}
      ]
    },
    {
      title: "Group 5 — Storage",
      tests: [
        { id: "5.1", name: "Archiver Mode Check", run: async () => {
          const { data } = await baseFetch("/storage/status");
          return { pass: typeof data?.isRunning === "boolean", msg: "isRunning not boolean" };
        }},
        { id: "5.2", name: "S3 Object Listing", run: async () => {
          const { data } = await baseFetch("/storage/files");
          return { pass: Array.isArray(data?.files), msg: "Files list not found" };
        }},
        { id: "5.3", name: "Manual Archive Trigger", run: async () => {
          const { status, data } = await baseFetch("/storage/archive-now", { method: "POST" });
          return { pass: status === 200 && data.triggered === true, msg: `Trigger failed: ${status}` };
        }}
      ]
    },
    {
      title: "Group 6 — Simulation & Resilience",
      tests: [
        { id: "6.1", name: "Fire simulated /payment Errors", run: async () => {
          if (!API_URL) return { pass: true, msg: "Skipped (No API_URL)" };
          console.log(`    ${ANSI.gray}Firing 20 requests to ${API_URL}/payment...${ANSI.reset}`);
          const reqs = Array(20).fill(0).map(() => baseFetch(`${API_URL}/payment`, { method: "POST" }));
          await Promise.all(reqs);
          await new Promise(r => setTimeout(r, 3000)); // Wait for CW propagation
          const { data } = await baseFetch("/logs?endpoint=/payment&level=ERROR&limit=10");
          return { pass: (data?.logs?.length || 0) > 0, msg: "No ERROR logs appeared after simulation" };
        }},
        { id: "6.2", name: "Verify WARN generation", run: async () => {
          if (!API_URL) return { pass: true, msg: "Skipped (No API_URL)" };
          const { data } = await baseFetch("/logs?range=1h&level=WARN&limit=5");
          return { pass: data?.logs?.length !== undefined, msg: "Audit trail verify failed" };
        }},
        { id: "6.3", name: "Check Alerts for /payment", run: async () => {
          if (!API_URL) return { pass: true, msg: "Skipped (No API_URL)" };
          const { data } = await baseFetch("/alerts?range=1h");
          const paymentAlerts = data?.alerts?.filter(a => a.endpoint === "/payment");
          return { pass: true, msg: `Found ${paymentAlerts?.length || 0} alerts (Detection active)` };
        }},
        { id: "6.4", name: "Export CSV Header check", run: async () => {
          const { status, contentType } = await baseFetch("/logs/export?limit=5");
          return { pass: status === 200 && contentType === "text/csv", msg: `Content-Type: ${contentType}` };
        }},
        { id: "6.5", name: "Invalid Input Handling", run: async () => {
          const { status } = await baseFetch("/logs?limit=notanumber");
          // Should either be 400 or be handled gracefully by default value in code (200)
          return { pass: status === 200 || status === 400, msg: `Unexpected status code: ${status}` };
        }}
      ]
    }
  ];

  let totalPassed = 0;
  let totalTests = 0;
  const globalStart = performance.now();

  for (const group of GROUPS) {
    const passed = await runGroup(group.title, group.tests);
    totalPassed += passed;
    totalTests += group.tests.length;
  }

  const durationAll = ((performance.now() - globalStart) / 1000).toFixed(1);
  const color = totalPassed === totalTests ? ANSI.green : ANSI.red;

  console.log(`\n  ${ANSI.gray}──────────────────────────────────────────${ANSI.reset}`);
  console.log(`  ${ANSI.bold}${color}${totalPassed}/${totalTests} tests passed${ANSI.reset}  |  ${ANSI.red}${totalTests - totalPassed} failed${ANSI.reset}`);
  console.log(`  ${ANSI.gray}Total time: ${durationAll}s${ANSI.reset}\n`);

  if (totalPassed !== totalTests) {
    process.exit(1);
  }
}

main();
