/**
 * test-local.mjs
 * Run this BEFORE deploying to AWS to verify your Lambda logic locally.
 *
 * Usage:
 *   node test-local.mjs
 */

import { handler as loginHandler }   from "./lambda/login/index.mjs";
import { handler as uploadHandler }  from "./lambda/upload/index.mjs";
import { handler as paymentHandler } from "./lambda/payment/index.mjs";

const fakeEvent = (body = {}) => ({
  requestContext: { requestId: `test-${Math.random().toString(36).slice(2, 8)}` },
  body: JSON.stringify(body),
});

async function runTest(name, handler, body) {
  console.log(`\n${"─".repeat(50)}`);
  console.log(`▶  Testing ${name}`);
  console.log("─".repeat(50));
  const result = await handler(fakeEvent(body));
  console.log(`   Status : ${result.statusCode}`);
  console.log(`   Body   : ${result.body}`);
}

(async () => {
  // Run each endpoint 3 times to see different outcomes
  for (let i = 0; i < 3; i++) {
    await runTest("POST /login",   loginHandler,   { email: "test@logwatch.dev" });
    await runTest("POST /upload",  uploadHandler,  { fileName: "report.pdf" });
    await runTest("POST /payment", paymentHandler, { amount: 4999, currency: "USD" });
  }
  console.log(`\n${"─".repeat(50)}`);
  console.log("✅  Local tests complete — check logs above");
})();
