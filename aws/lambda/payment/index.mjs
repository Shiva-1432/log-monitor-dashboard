/**
 * Lambda — POST /payment
 * Simulates payment processing with ~30% random failure rate
 * This endpoint intentionally has the most errors — drives alert triggers
 */
export const handler = async (event) => {
  const requestId = event.requestContext?.requestId ?? "local-test";
  const start = Date.now();

  // ── Simulate payment gateway call delay ────────────────────
  await sleep(randomBetween(100, 350));

  // ── Simulate 30% hard failure rate ────────────────────────
  if (Math.random() < 0.30) {
    const type = pickRandom([
      { msg: "Simulated failure — payment gateway timeout",      code: 502 },
      { msg: "Simulated failure — internal error",               code: 500 },
      { msg: "Simulated failure — DynamoDB write error",         code: 500 },
      { msg: "Simulated failure — Lambda execution error",       code: 500 },
    ]);

    const durationMs = Date.now() - start;
    console.error(JSON.stringify({
      level:      "ERROR",
      endpoint:   "/payment",
      message:    type.msg,
      requestId,
      durationMs,
      statusCode: type.code,
    }));
    return response(type.code, { error: "PaymentFailed", message: type.msg });
  }

  // ── Parse body ─────────────────────────────────────────────
  let body = {};
  try { body = JSON.parse(event.body ?? "{}"); } catch (_) {}

  const amount   = body.amount   ?? randomBetween(10, 9999);
  const currency = body.currency ?? "USD";

  // ── Simulate payment intent creation (2-step) ───────────────
  if (Math.random() < 0.30) {
    // First call: just create the intent
    const durationMs = Date.now() - start;
    const intentId = `pi_${Math.random().toString(36).slice(2, 18)}`;
    console.log(JSON.stringify({
      level:      "INFO",
      endpoint:   "/payment",
      message:    "Payment intent created",
      intentId,
      amount,
      currency,
      requestId,
      durationMs,
      statusCode: 201,
    }));
    return response(201, { intentId, amount, currency, status: "requires_confirmation" });
  }

  // ── Success: payment processed ──────────────────────────────
  await sleep(randomBetween(50, 150)); // extra delay for processing
  const durationMs  = Date.now() - start;
  const transactionId = `txn_${Math.random().toString(36).slice(2, 18)}`;

  console.log(JSON.stringify({
    level:      "INFO",
    endpoint:   "/payment",
    message:    "Payment processed successfully",
    transactionId,
    amount,
    currency,
    requestId,
    durationMs,
    statusCode: 200,
  }));

  return response(200, {
    transactionId,
    amount,
    currency,
    status: "succeeded",
    processedAt: new Date().toISOString(),
  });
};

// ── Helpers ────────────────────────────────────────────────────
const sleep         = (ms)  => new Promise((r) => setTimeout(r, ms));
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickRandom    = (arr) => arr[Math.floor(Math.random() * arr.length)];
const response      = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  },
  body: JSON.stringify(body),
});
