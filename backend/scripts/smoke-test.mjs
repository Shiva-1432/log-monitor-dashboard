/**
 * LogWatch Production Smoke Test
 * 
 * Validates the live Render backend by hitting critical API endpoints.
 * Includes automatic retry for "cold start" scenarios.
 * 
 * Usage: 
 *   BACKEND_URL=https://your-app.onrender.com node scripts/smoke-test.mjs
 */

import { performance } from "perf_hooks";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

const ANSI = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bold: "\x1b[1m",
};

const TESTS = [
  { 
    name: "GET /ping", 
    path: "/ping", 
    validate: (data, status) => status === 200 && data.status === "ok" 
  },
  { 
    name: "GET /health", 
    path: "/health", 
    validate: (data, status) => status === 200 && data.aws.status === "ok" && Array.isArray(data.aws.logGroups) 
  },
  { 
    name: "GET /logs (1h)", 
    path: "/logs?range=1h&limit=10", 
    validate: (data, status) => status === 200 && Array.isArray(data.logs) 
  },
  { 
    name: "GET /logs (filter)", 
    path: "/logs?level=ERROR&endpoint=/payment", 
    validate: (data, status) => status === 200 
  },
  { 
    name: "GET /logs/metrics", 
    path: "/logs/metrics?range=1h", 
    validate: (data, status) => status === 200 && typeof data.metrics?.total === "number" 
  },
  { 
    name: "GET /alerts", 
    path: "/alerts?range=1h", 
    validate: (data, status) => status === 200 && Array.isArray(data.alerts) 
  },
  { 
    name: "GET /alerts/stats", 
    path: "/alerts/stats", 
    validate: (data, status) => status === 200 && "total" in data && "critical" in data 
  },
  { 
    name: "GET /storage/status", 
    path: "/storage/status", 
    validate: (data, status) => status === 200 && typeof data.isRunning === "boolean" 
  },
  { 
    name: "GET /storage/files", 
    path: "/storage/files", 
    validate: (data, status) => status === 200 && Array.isArray(data.files) 
  },
  { 
    name: "GET /stream/status", 
    path: "/stream/status", 
    validate: (data, status) => status === 200 && typeof data.activeConnections === "number" 
  }
];

async function runTest(test, retry = true) {
  const url = `${BACKEND_URL}${test.path}`;
  const start = performance.now();
  
  try {
    const response = await fetch(url);
    const duration = Math.round(performance.now() - start);
    let data = {};
    
    try {
      data = await response.json();
    } catch (e) {
      // Not JSON
    }

    const success = test.validate(data, response.status);
    
    if (success) {
      console.log(`  ${ANSI.green}✅${ANSI.reset}  ${test.name.padEnd(30)} ${response.status}  ${ANSI.gray}(${duration}ms)${ANSI.reset}`);
      return true;
    } else {
      // If we fail a 503 or 502, it might be Render waking up. Retry once.
      if (retry && [502, 503, 504].includes(response.status)) {
        process.stdout.write(`  ${ANSI.gray}⏳  ${test.name} (Retrying cold start...)${ANSI.reset}\r`);
        await new Promise(r => setTimeout(r, 2000));
        return runTest(test, false);
      }

      const errorMsg = data.error || data.message || JSON.stringify(data);
      console.log(`  ${ANSI.red}❌${ANSI.reset}  ${test.name.padEnd(30)} ${response.status}  ${ANSI.gray}(${duration}ms)${ANSI.reset}  ${ANSI.red}→ "${errorMsg}"${ANSI.reset}`);
      return false;
    }
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    
    if (retry) {
      process.stdout.write(`  ${ANSI.gray}⏳  ${test.name} (Retrying network error...)${ANSI.reset}\r`);
      await new Promise(r => setTimeout(r, 2000));
      return runTest(test, false);
    }
    
    console.log(`  ${ANSI.red}❌${ANSI.reset}  ${test.name.padEnd(30)} ERR  ${ANSI.gray}(${duration}ms)${ANSI.reset}  ${ANSI.red}→ "${err.message}"${ANSI.reset}`);
    return false;
  }
}

async function main() {
  console.log(`\n${ANSI.bold}${ANSI.cyan}LogWatch Production Smoke Test${ANSI.reset}`);
  console.log(`${ANSI.gray}Target: ${BACKEND_URL}${ANSI.reset}\n`);

  let passed = 0;
  const startAll = performance.now();

  for (const test of TESTS) {
    const success = await runTest(test);
    if (success) passed++;
  }

  const totalTime = ((performance.now() - startAll) / 1000).toFixed(1);
  const color = passed === TESTS.length ? ANSI.green : ANSI.red;

  console.log(`${ANSI.gray}──────────────────────────────────────────${ANSI.reset}`);
  console.log(`${ANSI.bold}Results: ${color}${passed}/${TESTS.length} passed${ANSI.reset} · ${passed === TESTS.length ? "All systems nominal" : "Issues detected"}`);
  console.log(`${ANSI.gray}Total time: ${totalTime}s${ANSI.reset}\n`);

  if (passed !== TESTS.length) {
    process.exit(1);
  }
}

main();
