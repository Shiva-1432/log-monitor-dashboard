/**
 * Lambda — POST /upload
 * Simulates S3 file upload with ~20% random failure rate
 * Higher latency than /login to simulate real upload behaviour
 */
export const handler = async (event) => {
  const requestId = event.requestContext?.requestId ?? "local-test";
  const start = Date.now();

  // ── Simulate upload processing (longer delay) ──────────────
  await sleep(randomBetween(200, 600));

  // ── Simulate 30% failure rate ──────────────────────────────
  if (Math.random() < 0.30) {
    const type = pickRandom([
      { msg: "Simulated failure — S3 PutObject timeout",   code: 504 },
      { msg: "Multipart upload aborted — connection reset", code: 500 },
      { msg: "Simulated failure — Lambda memory exceeded",  code: 500 },
    ]);

    const durationMs = Date.now() - start;
    console.error(JSON.stringify({
      level:      "ERROR",
      endpoint:   "/upload",
      message:    type.msg,
      requestId,
      durationMs,
      statusCode: type.code,
    }));
    return response(type.code, { error: "UploadFailed", message: type.msg });
  }

  // ── Simulate high latency warning (S3 slow) ─────────────────
  const extraDelay = Math.random() < 0.20 ? randomBetween(300, 500) : 0;
  if (extraDelay > 0) {
    await sleep(extraDelay);
    const durationMs = Date.now() - start;
    console.warn(JSON.stringify({
      level:      "WARN",
      endpoint:   "/upload",
      message:    "S3 PutObject latency elevated",
      requestId,
      durationMs,
      statusCode: 200,
    }));
  }

  // ── Parse body ─────────────────────────────────────────────
  let body = {};
  try { body = JSON.parse(event.body ?? "{}"); } catch (_) {}

  const fileName  = body.fileName  ?? `file_${Date.now()}.bin`;
  const fileSizeMb = +(Math.random() * 10 + 0.5).toFixed(1);
  const s3Key     = `uploads/${new Date().getFullYear()}/${Date.now()}/${fileName}`;
  const durationMs = Date.now() - start;

  console.log(JSON.stringify({
    level:      "INFO",
    endpoint:   "/upload",
    message:    `File upload complete — ${fileSizeMb}MB`,
    fileName,
    fileSizeMb,
    s3Key,
    requestId,
    durationMs,
    statusCode: 200,
  }));

  return response(200, { s3Key, fileSizeMb, fileName, uploadedAt: new Date().toISOString() });
};

// ── Helpers ────────────────────────────────────────────────────
const sleep       = (ms)  => new Promise((r) => setTimeout(r, ms));
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickRandom  = (arr) => arr[Math.floor(Math.random() * arr.length)];
const response    = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  },
  body: JSON.stringify(body),
});
