/**
 * Lambda — POST /login
 * Simulates authentication with ~15% random failure rate
 */
export const handler = async (event) => {
  const requestId = event.requestContext?.requestId ?? "local-test";
  const start = Date.now();

  // ── Simulate processing delay ──────────────────────────────
  await sleep(randomBetween(30, 120));

  // ── Simulate 15% failure rate ──────────────────────────────
  if (Math.random() < 0.15) {
    const durationMs = Date.now() - start;
    console.error(JSON.stringify({
      level:      "ERROR",
      endpoint:   "/login",
      message:    "Simulated failure — auth service timeout",
      requestId,
      durationMs,
      statusCode: 500,
    }));
    return response(500, { error: "InternalServerError", message: "Auth service unavailable" });
  }

  // ── Parse body ─────────────────────────────────────────────
  let body = {};
  try { body = JSON.parse(event.body ?? "{}"); } catch (_) {}

  const { email = "demo@logwatch.dev" } = body;

  // ── Simulate invalid credentials (10% of successful path) ──
  if (Math.random() < 0.10) {
    const durationMs = Date.now() - start;
    console.warn(JSON.stringify({
      level:      "WARN",
      endpoint:   "/login",
      message:    "Invalid credentials — failed attempt",
      email,
      requestId,
      durationMs,
      statusCode: 401,
    }));
    return response(401, { error: "Unauthorized", message: "Invalid email or password" });
  }

  // ── Simulate rate limit (5%) ────────────────────────────────
  if (Math.random() < 0.05) {
    const durationMs = Date.now() - start;
    console.warn(JSON.stringify({
      level:      "WARN",
      endpoint:   "/login",
      message:    "Rate limit approaching — 80% used",
      requestId,
      durationMs,
      statusCode: 429,
    }));
    return response(429, { error: "TooManyRequests", message: "Rate limit reached. Try again in 60s." });
  }

  // ── Success ─────────────────────────────────────────────────
  const durationMs = Date.now() - start;
  const userId = `usr_${Math.random().toString(36).slice(2, 10)}`;
  console.log(JSON.stringify({
    level:      "INFO",
    endpoint:   "/login",
    message:    "User authenticated successfully",
    email,
    userId,
    requestId,
    durationMs,
    statusCode: 200,
  }));

  return response(200, {
    userId,
    email,
    sessionToken: `eyJhbGciOiJSUzI1NiJ9.${Buffer.from(JSON.stringify({ userId, exp: Date.now() + 3600000 })).toString("base64")}`,
    expiresIn: 3600,
  });
};

// ── Helpers ────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const response = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  },
  body: JSON.stringify(body),
});
